import { create } from "zustand";
import type { MapPack } from "../logic/mapPack";
import { createRng } from "../logic/rng";
import { buildGraph } from "../logic/Graph";
import {
  legalDetectiveMoves,
  legalGanoveMoves,
  mapEscapeNodeIds,
  MoveError,
  validateDetectiveMove,
  validateGanoveMove,
  type BlockedEdge,
  type MoveContext,
  type MoveTarget,
} from "../logic/Movement";
import {
  detectiveSpawnChoices,
  ganoveSpawnChoices,
  pickDetectiveSpawns,
  pickGanoveSpawn,
  SpawnError,
} from "../logic/SpawnSystem";

export type GamePhase = "ganove" | "detektive";
export type EventMode = "cycle" | "chance" | "tension";
export type GameOutcome = "caught" | "surrounded" | "escaped" | "timeout" | "draw";

export type { BlockedEdge } from "../logic/Movement";

/**
 * Raised when `startGame` options conflict with the map settings —
 * e.g. `roundLimit: null` on a map that does not allow `unlimited`,
 * or a round limit outside the map's `[min, max]` corridor.
 */
export class GameConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameConfigError";
  }
}

/** Missionszustand (MissionEngine details arrive in a later step). */
export interface Mission {
  id: string;
  targetNodes: string[];
  currentStepIndex: number;
}

/** A hint or world event as it lands in the detectives' chronicle. */
export interface GameEvent {
  kind: string;
  round: number;
  nodeId?: string;
  zone?: string;
  visibleTo: "detectives" | "both";
}

export interface Camera {
  nodeId: string;
  active: boolean;
}

export interface LogEntry {
  seq: number;
  round: number;
  type: string;
  details?: Record<string, unknown>;
}

export interface StartGameOptions {
  /** Number of detectives; defaults to `settings.detectiveCount.suggested`. */
  detectiveCount?: number;
  /** Explicit detective spawns — validated against `detectiveSpawnChoices`. */
  detectivePositions?: string[];
  /** Explicit ganove spawn — validated against `ganoveSpawnChoices`. */
  ganovePosition?: string;
  /**
   * Round limit for the timeout ending; `null` disables it and requires
   * `settings.roundLimit.unlimited`. Defaults to `roundLimit.suggested`.
   */
  roundLimit?: number | null;
}

export interface GameState {
  map: MapPack | null;
  round: number;
  phase: GamePhase;
  activeDetectiveIndex: number;
  ganovePosition: string | null;
  detektivePositions: string[];
  mission: Mission | null;
  events: GameEvent[];
  cameras: Camera[];
  blockedEdges: BlockedEdge[];
  eventMode: EventMode;
  tensionValue: number;
  seed: number;
  log: LogEntry[];
  /** `null` while the game runs; a `GameOutcome` once it is finished. */
  outcome: GameOutcome | null;
  /** Effective round limit; `null` = unlimited (only Fang/Flucht decide). */
  roundLimit: number | null;
  /**
   * Nodes that end the game with an escape when the ganove reaches them.
   * Initialised from the `flucht` node category; the mission system can
   * override the list via `setEscapeNodeIds` (mission-bound escape).
   */
  escapeNodeIds: string[];
  /**
   * Hook for the mission system: whether the ganove can execute an action
   * this round (Aktionsrunde — the only legal exception to Zugzwang).
   * Conservatively `false` until the mission engine fills it.
   */
  ganoveCanAct: boolean;

  startGame: (map: MapPack, seed: number, options?: StartGameOptions) => void;
  resetGame: () => void;
  appendLog: (entry: Omit<LogEntry, "seq">) => void;
  endGanovePhase: () => void;
  advanceDetective: () => void;
  endDetectivePhase: () => void;
  moveGanove: (target: string) => void;
  moveDetective: (target: string) => void;
  ganoveAction: () => void;
  abortAsDraw: () => void;
  getLegalGanoveMoves: () => MoveTarget[];
  getLegalDetectiveMoves: () => MoveTarget[];
  setEscapeNodeIds: (nodeIds: string[]) => void;
  setGanoveCanAct: (canAct: boolean) => void;
  setMission: (mission: Mission | null) => void;
  addEvent: (event: GameEvent) => void;
  setCameras: (nodeIds: readonly string[]) => void;
  blockEdge: (a: string, b: string, untilRound: number) => void;
  unblockExpiredEdges: () => void;
  setTension: (value: number) => void;
  setEventMode: (mode: EventMode) => void;
}

type GameData = Omit<
  GameState,
  | "startGame"
  | "resetGame"
  | "appendLog"
  | "endGanovePhase"
  | "advanceDetective"
  | "endDetectivePhase"
  | "moveGanove"
  | "moveDetective"
  | "ganoveAction"
  | "abortAsDraw"
  | "getLegalGanoveMoves"
  | "getLegalDetectiveMoves"
  | "setEscapeNodeIds"
  | "setGanoveCanAct"
  | "setMission"
  | "addEvent"
  | "setCameras"
  | "blockEdge"
  | "unblockExpiredEdges"
  | "setTension"
  | "setEventMode"
>;

/** Fresh data state — new array instances on every call. */
function initialData(): GameData {
  return {
    map: null,
    round: 1,
    phase: "ganove",
    activeDetectiveIndex: 0,
    ganovePosition: null,
    detektivePositions: [],
    mission: null,
    events: [],
    cameras: [],
    blockedEdges: [],
    eventMode: "tension",
    tensionValue: 0,
    seed: 0,
    log: [],
    outcome: null,
    roundLimit: null,
    escapeNodeIds: [],
    ganoveCanAct: false,
  };
}

function resolveSpawnPositions(
  map: MapPack,
  seed: number,
  options?: StartGameOptions,
): { detectivePositions: string[]; ganovePosition: string } {
  const rng = createRng(seed);
  const count =
    options?.detectiveCount ??
    options?.detectivePositions?.length ??
    map.settings.detectiveCount.suggested;

  let detectivePositions: string[];
  if (options?.detectivePositions !== undefined) {
    const allowed = new Set(detectiveSpawnChoices(map));
    for (const pos of options.detectivePositions) {
      if (!allowed.has(pos)) {
        throw new SpawnError(`detective spawn ${JSON.stringify(pos)} is not an allowed node`);
      }
    }
    detectivePositions = [...options.detectivePositions];
  } else {
    detectivePositions = pickDetectiveSpawns(map, rng, count);
  }

  let ganovePosition: string;
  if (options?.ganovePosition !== undefined) {
    if (!ganoveSpawnChoices(map, detectivePositions).includes(options.ganovePosition)) {
      throw new SpawnError(
        `ganove spawn ${JSON.stringify(options.ganovePosition)} violates spawnRules ` +
          `(not allowed or below minDistanceToDetective)`,
      );
    }
    ganovePosition = options.ganovePosition;
  } else {
    ganovePosition = pickGanoveSpawn(map, rng, detectivePositions);
  }

  return { detectivePositions, ganovePosition };
}

/**
 * Effective round limit for a new game. `null` (unlimited) requires
 * `settings.roundLimit.unlimited`; numbers must be integers inside the
 * map's `[min, max]` corridor — otherwise `GameConfigError` is thrown.
 */
function resolveRoundLimit(map: MapPack, option: number | null | undefined): number | null {
  const setting = map.settings.roundLimit;
  const value = option === undefined ? setting.suggested : option;
  if (value === null) {
    if (setting.unlimited !== true) {
      throw new GameConfigError(
        `roundLimit: unlimited games are not allowed on map ${JSON.stringify(map.id)}`,
      );
    }
    return null;
  }
  if (
    !Number.isInteger(value) ||
    value < setting.min ||
    (setting.max !== undefined && value > setting.max)
  ) {
    const max = setting.max === undefined ? "∞" : setting.max;
    throw new GameConfigError(
      `roundLimit ${value} is outside the allowed range [${setting.min}, ${max}]`,
    );
  }
  return value;
}

function moveContext(state: {
  map: MapPack | null;
  round: number;
  blockedEdges: BlockedEdge[];
  ganovePosition: string | null;
  detektivePositions: string[];
}): MoveContext {
  return {
    // `moveContext` is only called while a game is running.
    graph: buildGraph(state.map as MapPack),
    round: state.round,
    blockedEdges: state.blockedEdges,
    ganovePosition: state.ganovePosition as string,
    detektivePositions: state.detektivePositions,
  };
}

/**
 * Zustand store holding the game state specified in
 * `02-technisches-konzept.md` section 3. Deliberately headless-capable:
 * it carries no React dependency beyond the hook binding, so simulations
 * can drive it via `useGameStore.getState()` / `setState()` without a UI.
 *
 * The round engine (`01-spielkonzept.md` sections 3 and 7) lives in the
 * move actions: `moveGanove`/`moveDetective` validate via `Movement.ts`,
 * run the catch check after every single detective move and drive the
 * phase machine; `ganoveAction` is the action-round hook; the game ends
 * via `outcome` (caught / surrounded / escaped / timeout / draw).
 */
export const useGameStore = create<GameState>((set, get) => {
  const finish = (outcome: GameOutcome): void => {
    const { round } = get();
    set({ outcome });
    get().appendLog({ round, type: "result", details: { outcome, rounds: round } });
  };

  /**
   * Surrounded check — runs "at the start of the ganove's phase"
   * (spec section 7): no legal move AND no executable action ⇒ caught.
   */
  const checkGanoveSurrounded = (): void => {
    const state = get();
    if (
      state.map !== null &&
      state.ganovePosition !== null &&
      state.outcome === null &&
      state.phase === "ganove" &&
      legalGanoveMoves(moveContext(state)).length === 0 &&
      !state.ganoveCanAct
    ) {
      finish("surrounded");
    }
  };

  /**
   * Round-end sequence once the last detective has moved: timeout check,
   * then round increment + expired edge unblocking + surrounded check.
   */
  const completeDetectivePhase = (): void => {
    const state = get();
    if (state.map !== null && state.roundLimit !== null && state.round >= state.roundLimit) {
      finish("timeout");
      return;
    }
    set((s) => ({ phase: "ganove", round: s.round + 1, activeDetectiveIndex: 0 }));
    get().unblockExpiredEdges();
    checkGanoveSurrounded();
  };

  const requireRunningGame = (phase?: GamePhase): void => {
    const state = get();
    if (state.map === null) {
      throw new MoveError("no_game", "no game is running");
    }
    if (state.outcome !== null) {
      throw new MoveError("game_over", `the game is already finished (${state.outcome})`);
    }
    if (phase !== undefined && state.phase !== phase) {
      throw new MoveError(
        "wrong_phase",
        `action requires phase ${JSON.stringify(phase)} but phase is ${JSON.stringify(state.phase)}`,
      );
    }
  };

  return {
    ...initialData(),

    startGame: (map, seed, options) => {
      const { detectivePositions, ganovePosition } = resolveSpawnPositions(map, seed, options);
      const roundLimit = resolveRoundLimit(map, options?.roundLimit);
      set({
        ...initialData(),
        map,
        seed,
        eventMode: map.settings.eventMode,
        detektivePositions: detectivePositions,
        ganovePosition,
        roundLimit,
        escapeNodeIds: mapEscapeNodeIds(map),
      });
      get().appendLog({
        round: 1,
        type: "header",
        details: {
          mapId: map.id,
          seed,
          roundLimit,
          starts: { detectives: detectivePositions, ganove: ganovePosition },
        },
      });
      // The game starts in the ganove phase — check surrounded immediately.
      checkGanoveSurrounded();
    },

    resetGame: () => set({ ...initialData() }),

    appendLog: (entry) =>
      set((state) => ({ log: [...state.log, { ...entry, seq: state.log.length + 1 }] })),

    endGanovePhase: () =>
      set((state) =>
        state.phase === "ganove" ? { phase: "detektive", activeDetectiveIndex: 0 } : state,
      ),

    advanceDetective: () =>
      set((state) =>
        state.phase === "detektive"
          ? { activeDetectiveIndex: state.activeDetectiveIndex + 1 }
          : state,
      ),

    endDetectivePhase: () => {
      const state = get();
      if (state.phase !== "detektive" || state.outcome !== null) {
        return;
      }
      if (state.map === null) {
        set({ phase: "ganove", round: state.round + 1, activeDetectiveIndex: 0 });
        return;
      }
      completeDetectivePhase();
    },

    /**
     * Ganove moves to `target` (one edge, any type). Illegal targets throw
     * `MoveError`. Reaching a node in `escapeNodeIds` ends the game with
     * `escaped`; otherwise the detektive phase begins.
     */
    moveGanove: (target) => {
      requireRunningGame("ganove");
      const state = get();
      const move = validateGanoveMove(moveContext(state), target);
      const from = state.ganovePosition;
      set({ ganovePosition: target });
      get().appendLog({
        round: state.round,
        type: "move",
        details: { actor: "ganove", from, to: target, edgeType: move.edgeType },
      });
      if (state.escapeNodeIds.includes(target)) {
        finish("escaped");
        return;
      }
      set({ phase: "detektive", activeDetectiveIndex: 0 });
    },

    /**
     * The active detective (fixed order D1→Dn) moves to `target`.
     * The catch check runs immediately after this single move — when the
     * detective lands on the ganove's node the game ends right away, even
     * with detectives still queued. Otherwise the next detective moves or
     * the round completes after the last one.
     */
    moveDetective: (target) => {
      requireRunningGame("detektive");
      const state = get();
      const index = state.activeDetectiveIndex;
      const move = validateDetectiveMove(moveContext(state), index, target);
      const from = state.detektivePositions[index];
      set((s) => ({
        detektivePositions: s.detektivePositions.map((pos, i) => (i === index ? target : pos)),
      }));
      get().appendLog({
        round: state.round,
        type: "move",
        details: {
          actor: "detective",
          detectiveIndex: index,
          from,
          to: target,
          edgeType: move.edgeType,
        },
      });
      if (target === state.ganovePosition) {
        finish("caught");
        return;
      }
      if (index === state.detektivePositions.length - 1) {
        completeDetectivePhase();
      } else {
        set({ activeDetectiveIndex: index + 1 });
      }
    },

    /**
     * Action round of the ganove — the only legal exception to Zugzwang
     * (spec section 5.3): the ganove stays put and remains fully
     * catchable. Requires `ganoveCanAct` (mission-system hook); the
     * actual action effects arrive with the mission step.
     */
    ganoveAction: () => {
      requireRunningGame("ganove");
      const state = get();
      if (!state.ganoveCanAct) {
        throw new MoveError(
          "no_action_available",
          "the ganove has no executable action this round",
        );
      }
      get().appendLog({
        round: state.round,
        type: "action",
        details: { actor: "ganove", nodeId: state.ganovePosition },
      });
      set({ phase: "detektive", activeDetectiveIndex: 0 });
    },

    /** Ends a running game as a draw (Remis, spec section 7). */
    abortAsDraw: () => {
      requireRunningGame();
      finish("draw");
    },

    getLegalGanoveMoves: () => {
      const state = get();
      if (
        state.map === null ||
        state.ganovePosition === null ||
        state.outcome !== null ||
        state.phase !== "ganove"
      ) {
        return [];
      }
      return legalGanoveMoves(moveContext(state));
    },

    getLegalDetectiveMoves: () => {
      const state = get();
      if (state.map === null || state.outcome !== null || state.phase !== "detektive") {
        return [];
      }
      return legalDetectiveMoves(moveContext(state), state.activeDetectiveIndex);
    },

    /**
     * Overrides the escape-node list (mission-bound escape targets).
     * Unknown node ids raise `GameConfigError`.
     */
    setEscapeNodeIds: (nodeIds) => {
      const state = get();
      if (state.map !== null) {
        const known = new Set(state.map.nodes.map((node) => node.id));
        for (const id of nodeIds) {
          if (!known.has(id)) {
            throw new GameConfigError(
              `escape node ${JSON.stringify(id)} does not exist on map ${JSON.stringify(state.map.id)}`,
            );
          }
        }
      }
      set({ escapeNodeIds: [...nodeIds] });
    },

    /** Mission-system hook: marks whether the ganove may act this round. */
    setGanoveCanAct: (canAct) => set({ ganoveCanAct: canAct }),

    setMission: (mission) => set({ mission }),

    addEvent: (event) => set((state) => ({ events: [...state.events, event] })),

    setCameras: (nodeIds) => set({ cameras: nodeIds.map((nodeId) => ({ nodeId, active: true })) }),

    blockEdge: (a, b, untilRound) =>
      set((state) => ({ blockedEdges: [...state.blockedEdges, { a, b, untilRound }] })),

    unblockExpiredEdges: () =>
      set((state) => ({
        blockedEdges: state.blockedEdges.filter((edge) => edge.untilRound >= state.round),
      })),

    setTension: (value) => set({ tensionValue: value }),

    setEventMode: (mode) => set({ eventMode: mode }),
  };
});
