/**
 * Aggregated statistics over the retained game logs (spec
 * `02-technisches-konzept.md` section 8.1, feeds OT-23 balancing):
 * win rate per side and per played mode, average game length, hints
 * per game and camera hits — all read from the `header`/`result`
 * lines, so damaged or unfinished logs simply drop out.
 *
 * "Modus" is the perspective a human played (`header.config.playerMode`,
 * written by the game screens): `"ganove"`, `"detektiv"`; logs without
 * the field — AI-vs-AI batches, older recordings — aggregate under
 * `"unbekannt"`.
 */
import type { GameOutcome } from "../state/gameStore";
import { parseLog } from "./Recorder";

/** Grouping key for the per-mode breakdown. */
export type StatsMode = "ganove" | "detektiv" | "unbekannt";

/** Aggregated metrics of one group of finished games. */
export interface StatsBucket {
  /** Finished games in this group (logs without `result` don't count). */
  games: number;
  /** `escaped`/`timeout` — the ganove's wins. */
  ganoveWins: number;
  /** `caught`/`surrounded` — the detectives' wins. */
  detectiveWins: number;
  /** `draw` outcomes. */
  draws: number;
  /** `ganoveWins / games` (0–1); `null` for an empty group. */
  winRateGanove: number | null;
  /** `detectiveWins / games` (0–1); `null` for an empty group. */
  winRateDetectives: number | null;
  /** Mean rounds of the finished games; `null` for an empty group. */
  avgRounds: number | null;
  /** Mean `hintsTotal` per game; `null` for an empty group. */
  avgHints: number | null;
  /** Mean `camerasTriggered` per game; `null` for an empty group. */
  avgCameras: number | null;
}

/** Total statistics plus the per-mode breakdown. */
export interface GameStatistics {
  total: StatsBucket;
  byMode: Record<StatsMode, StatsBucket>;
}

/** Running sums behind a `StatsBucket` — divided by `games` at the end. */
interface Accumulator {
  games: number;
  ganoveWins: number;
  detectiveWins: number;
  draws: number;
  rounds: number;
  hints: number;
  cameras: number;
}

function newAccumulator(): Accumulator {
  return { games: 0, ganoveWins: 0, detectiveWins: 0, draws: 0, rounds: 0, hints: 0, cameras: 0 };
}

function toBucket(acc: Accumulator): StatsBucket {
  if (acc.games === 0) {
    return {
      games: 0,
      ganoveWins: 0,
      detectiveWins: 0,
      draws: 0,
      winRateGanove: null,
      winRateDetectives: null,
      avgRounds: null,
      avgHints: null,
      avgCameras: null,
    };
  }
  return {
    games: acc.games,
    ganoveWins: acc.ganoveWins,
    detectiveWins: acc.detectiveWins,
    draws: acc.draws,
    winRateGanove: acc.ganoveWins / acc.games,
    winRateDetectives: acc.detectiveWins / acc.games,
    avgRounds: acc.rounds / acc.games,
    avgHints: acc.hints / acc.games,
    avgCameras: acc.cameras / acc.games,
  };
}

/** The winning side key of an outcome; `null` for `draw`/unknown. */
function winningSide(outcome: GameOutcome | null): "ganove" | "detectives" | null {
  if (outcome === "escaped" || outcome === "timeout") {
    return "ganove";
  }
  if (outcome === "caught" || outcome === "surrounded") {
    return "detectives";
  }
  return null;
}

/**
 * Reads one JSONL log into its statistics contribution, or `null` for
 * unparseable/header-less content. Logs without a `result` line
 * (running or aborted-before-result games) contribute nothing.
 */
export function logStats(jsonl: string): {
  mode: StatsMode;
  outcome: GameOutcome | null;
  rounds: number;
  hintsTotal: number;
  camerasTriggered: number;
} | null {
  let records: Record<string, unknown>[];
  try {
    records = parseLog(jsonl);
  } catch {
    return null;
  }
  const header = records.find((entry) => entry.type === "header");
  if (header === undefined) {
    return null;
  }
  const result = records.find((entry) => entry.type === "result");
  if (result === undefined || typeof result.outcome !== "string") {
    return null;
  }
  const config = (header.config ?? {}) as Record<string, unknown>;
  const rawMode = config.playerMode;
  const mode: StatsMode = rawMode === "ganove" || rawMode === "detektiv" ? rawMode : "unbekannt";
  const outcome = result.outcome as GameOutcome;
  return {
    mode,
    outcome,
    rounds: typeof result.rounds === "number" ? result.rounds : 0,
    hintsTotal: typeof result.hintsTotal === "number" ? result.hintsTotal : 0,
    camerasTriggered: typeof result.camerasTriggered === "number" ? result.camerasTriggered : 0,
  };
}

function addTo(acc: Accumulator, entry: NonNullable<ReturnType<typeof logStats>>): void {
  acc.games += 1;
  const side = winningSide(entry.outcome);
  if (side === "ganove") {
    acc.ganoveWins += 1;
  } else if (side === "detectives") {
    acc.detectiveWins += 1;
  } else {
    acc.draws += 1;
  }
  acc.rounds += entry.rounds;
  acc.hints += entry.hintsTotal;
  acc.cameras += entry.camerasTriggered;
}

/**
 * Aggregates all given JSONL logs into totals plus a per-mode
 * breakdown. Unfinished and damaged logs are skipped.
 */
export function aggregateStatistics(jsonls: readonly string[]): GameStatistics {
  const total = newAccumulator();
  const byMode: Record<StatsMode, Accumulator> = {
    ganove: newAccumulator(),
    detektiv: newAccumulator(),
    unbekannt: newAccumulator(),
  };
  for (const jsonl of jsonls) {
    const entry = logStats(jsonl);
    if (entry === null) {
      continue;
    }
    addTo(total, entry);
    addTo(byMode[entry.mode], entry);
  }
  return {
    total: toBucket(total),
    byMode: {
      ganove: toBucket(byMode.ganove),
      detektiv: toBucket(byMode.detektiv),
      unbekannt: toBucket(byMode.unbekannt),
    },
  };
}
