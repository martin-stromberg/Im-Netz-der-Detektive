/**
 * Headless AI-vs-AI dev mode (01-spielkonzept.md section 6 "Dev-Modus",
 * 02-technisches-konzept.md section 7): `runAiGame` drives one full
 * game on the regular `useGameStore` — `GanoveAI` in the ganove phase,
 * `DetectiveAI` for every detective — until the store reaches a regular
 * `outcome`. `runAiBatch` plays a seed list; `summarizeBatch` aggregates
 * the balancing metrics straight out of the JSONL event logs
 * (outcome distribution, game lengths, hints/game, camera hits,
 * sabotage acceptance, radio usage) for the later balancing step.
 *
 * The module never bypasses the store: every turn goes through the
 * public actions (`moveGanove`, `ganoveAction`, `chooseMissionPath`,
 * `useRadio`, `moveDetective`), so logs stay bit-identical per seed and
 * all regular endings apply. Both AIs are fed only their side's view —
 * the detectives' view is built exclusively from `visibleEvents`/
 * `visibleCameras`/`missionStructure` (structural no-leak guarantee).
 */
import {
  useGameStore,
  type GameOutcome,
  type GameState,
  type LogEntry,
  type StartGameOptions,
} from "../state/gameStore";
import { chooseDetectiveMove, type DetectiveView } from "./DetectiveAI";
import { chooseGanoveTurn, chooseSabotagePath, shouldUseRadio, type GanoveView } from "./GanoveAI";
import { visibleCameras, visibleEvents } from "./InformationSystem";
import type { MapPack } from "./mapPack";
import { createRng, mixSeed, type Rng } from "./rng";

/** Salt separating AI draws from the engine's per-round event stream. */
const AI_RNG_SALT = 0xa11ce5;
/** Hard iteration cap — a broken driver must never spin forever. */
const MAX_TURNS = 100_000;

export interface AiGameOptions {
  /** Forwarded to `startGame` (e.g. detectiveCount, roundLimit, mission). */
  startOptions?: StartGameOptions;
  /**
   * Safety cap for games without a round limit: a game exceeding
   * `maxRounds` ends as `draw` via `abortAsDraw` (defaults to 120).
   */
  maxRounds?: number;
  /**
   * Called after every driven turn with the live store state — test and
   * instrumentation hook (e.g. belief-invariant checks). Must not
   * mutate the state.
   */
  observe?: (state: GameState) => void;
}

/** One finished AI-vs-AI game with its full JSONL event log. */
export interface SimGameResult {
  seed: number;
  outcome: GameOutcome;
  rounds: number;
  log: LogEntry[];
  hintsTotal: number;
  camerasTriggered: number;
  sabotageOffers: number;
  sabotageAccepted: number;
  radioUsed: boolean;
}

/** Aggregated balancing metrics of a batch run. */
export interface BatchSummary {
  games: number;
  outcomes: Record<GameOutcome, number>;
  avgRounds: number;
  minRounds: number;
  maxRounds: number;
  avgHints: number;
  avgCamerasTriggered: number;
  /** `null` when no sabotage offer occurred in the batch. */
  sabotageAcceptanceRate: number | null;
  radioUsageRate: number;
}

/** Deterministic per-round AI stream, one lane per actor index. */
function aiRng(seed: number, round: number, lane: number): Rng {
  return createRng(mixSeed(mixSeed(seed ^ AI_RNG_SALT, round), lane));
}

/**
 * The detective-side view of `state` — the only data the detective AI
 * ever sees: detective-visible events and cameras, own positions,
 * blocked edges, mission structure without target nodes.
 */
export function buildDetectiveView(
  state: Pick<
    GameState,
    | "map"
    | "round"
    | "detektivePositions"
    | "blockedEdges"
    | "events"
    | "cameras"
    | "getMissionStructure"
  >,
  detectiveStarts: readonly string[],
): DetectiveView {
  return {
    map: state.map as MapPack,
    round: state.round,
    detectiveStarts,
    detektivePositions: state.detektivePositions,
    blockedEdges: state.blockedEdges,
    events: visibleEvents(state.events, "detectives"),
    cameras: visibleCameras(state.cameras, "detectives"),
    missionStructure: state.getMissionStructure(),
  };
}

/**
 * The ganove-side view of `state`: full mission, own position, all
 * detective positions, ganove-visible events, heat level/score and the
 * currently legal moves plus the executable mission action.
 */
export function buildGanoveView(
  state: Pick<
    GameState,
    | "map"
    | "round"
    | "roundLimit"
    | "ganovePosition"
    | "detektivePositions"
    | "mission"
    | "events"
    | "blockedEdges"
    | "radioUsed"
    | "escapeNodeIds"
    | "getHeatLevel"
    | "getLegalGanoveMoves"
    | "getMissionAction"
  >,
): GanoveView {
  const heat = state.getHeatLevel();
  return {
    map: state.map as MapPack,
    round: state.round,
    roundLimit: state.roundLimit,
    ganovePosition: state.ganovePosition as string,
    detektivePositions: state.detektivePositions,
    mission: state.mission,
    events: visibleEvents(state.events, "ganove"),
    blockedEdges: state.blockedEdges,
    heatLevel: heat.level,
    heatScore: heat.score,
    radioUsed: state.radioUsed,
    escapeNodeIds: state.escapeNodeIds,
    legalMoves: state.getLegalGanoveMoves(),
    missionAction: state.getMissionAction(),
  };
}

/** Counts of a finished game's log, aggregated for balancing. */
function metricsFromLog(log: readonly LogEntry[]): {
  outcome: GameOutcome | null;
  rounds: number;
  hintsTotal: number;
  camerasTriggered: number;
  sabotageOffers: number;
  sabotageAccepted: number;
  radioUsed: boolean;
} {
  const result = log.find((entry) => entry.type === "result");
  const hints = log.filter((entry) => entry.type === "hint");
  // Each offer produces two entries: the offer itself and the resolved
  // choice (the only entries carrying `chosen`).
  const offers = log.filter((entry) => entry.type === "sabotage_offer" && !("chosen" in entry));
  const accepted = log.filter((entry) => entry.type === "sabotage_offer" && entry.chosen === true);
  return {
    outcome: (result?.outcome as GameOutcome | undefined) ?? null,
    rounds: (result?.rounds as number | undefined) ?? 0,
    hintsTotal: hints.length,
    camerasTriggered: hints.filter((entry) => entry.kind === "camera").length,
    sabotageOffers: offers.length,
    sabotageAccepted: accepted.length,
    radioUsed: log.some((entry) => entry.type === "radio"),
  };
}

/**
 * Plays one full AI-vs-AI game on the shared store. The loop runs the
 * phase machine: pending sabotage offers are answered via
 * `chooseMissionPath`, the ganove phase asks `GanoveAI` (radio first,
 * then action-or-move), the detective phase asks `DetectiveAI` per
 * active index. Ends on the store's `outcome`; `maxRounds` (default:
 * `roundLimit`, else 120) and `MAX_TURNS` are safety nets that abort
 * the game as a draw.
 */
export function runAiGame(map: MapPack, seed: number, options?: AiGameOptions): SimGameResult {
  const store = useGameStore;
  store.getState().resetGame();
  store.getState().startGame(map, seed, options?.startOptions);
  const detectiveStarts = [...store.getState().detektivePositions];
  const maxRounds = options?.maxRounds ?? store.getState().roundLimit ?? 120;

  let turns = 0;
  while (store.getState().outcome === null) {
    const state = store.getState();
    if (state.round > maxRounds || turns >= MAX_TURNS) {
      state.abortAsDraw();
      break;
    }
    turns += 1;
    if (state.mission?.pendingChoice != null) {
      state.chooseMissionPath(chooseSabotagePath(buildGanoveView(state)));
      continue;
    }
    if (state.phase === "ganove") {
      const view = buildGanoveView(state);
      if (shouldUseRadio(view)) {
        state.useRadio();
        continue;
      }
      const turn = chooseGanoveTurn(view, aiRng(seed, state.round, 0));
      if (turn.type === "action") {
        state.ganoveAction();
      } else {
        state.moveGanove(turn.target);
      }
    } else {
      const index = state.activeDetectiveIndex;
      const target = chooseDetectiveMove(
        buildDetectiveView(state, detectiveStarts),
        index,
        state.getLegalDetectiveMoves(),
        aiRng(seed, state.round, index + 1),
      );
      state.moveDetective(target);
    }
    options?.observe?.(store.getState());
  }

  const finalState = store.getState();
  const metrics = metricsFromLog(finalState.log);
  return {
    seed,
    outcome: metrics.outcome ?? finalState.outcome ?? "draw",
    rounds: metrics.rounds || finalState.round,
    log: finalState.log,
    hintsTotal: metrics.hintsTotal,
    camerasTriggered: metrics.camerasTriggered,
    sabotageOffers: metrics.sabotageOffers,
    sabotageAccepted: metrics.sabotageAccepted,
    radioUsed: metrics.radioUsed || finalState.radioUsed,
  };
}

/** Plays `seeds` in order on `map`; returns one result per game. */
export function runAiBatch(
  map: MapPack,
  seeds: readonly number[],
  options?: AiGameOptions,
): SimGameResult[] {
  return seeds.map((seed) => runAiGame(map, seed, options));
}

/** Aggregates the batch results into the balancing summary. */
export function summarizeBatch(results: readonly SimGameResult[]): BatchSummary {
  const outcomes: Record<GameOutcome, number> = {
    caught: 0,
    surrounded: 0,
    escaped: 0,
    timeout: 0,
    draw: 0,
  };
  let roundsTotal = 0;
  let minRounds = Infinity;
  let maxRounds = 0;
  let hintsTotal = 0;
  let camerasTotal = 0;
  let offers = 0;
  let accepted = 0;
  let radioGames = 0;
  for (const result of results) {
    outcomes[result.outcome] += 1;
    roundsTotal += result.rounds;
    minRounds = Math.min(minRounds, result.rounds);
    maxRounds = Math.max(maxRounds, result.rounds);
    hintsTotal += result.hintsTotal;
    camerasTotal += result.camerasTriggered;
    offers += result.sabotageOffers;
    accepted += result.sabotageAccepted;
    if (result.radioUsed) {
      radioGames += 1;
    }
  }
  const games = results.length;
  return {
    games,
    outcomes,
    avgRounds: games > 0 ? roundsTotal / games : 0,
    minRounds: games > 0 ? minRounds : 0,
    maxRounds,
    avgHints: games > 0 ? hintsTotal / games : 0,
    avgCamerasTriggered: games > 0 ? camerasTotal / games : 0,
    sabotageAcceptanceRate: offers > 0 ? accepted / offers : null,
    radioUsageRate: games > 0 ? radioGames / games : 0,
  };
}
