/**
 * Game index (menu layer of spec `02-technisches-konzept.md` section 6):
 * derives per-game summaries from the JSONL logs retained by
 * `Recorder.listGameLogs` — the data source for the menu's
 * "Statistiken/Replays" view.
 *
 * It also reserves the entry structure for "Partie fortsetzen": a
 * `ResumeEntry` describes a mid-game save (game id, map, seed, full
 * start config and the running log). Nothing writes resume entries yet
 * — that persistence layer is the next development step — but the menu
 * already consumes `listResumeEntries`, so the entry shape and storage
 * key are fixed now.
 */
import type { GameOutcome, StartGameOptions } from "../state/gameStore";
import { listGameLogs, parseLog, type StorageLike } from "./Recorder";

/** `localStorage` key reserved for resumable mid-game saves. */
export const RESUME_STORAGE_KEY = "im-netz-der-detektive:resume-entries";

/**
 * One finished game as listed in the menu — flattened from the log
 * `header` and its `result` line.
 */
export interface GameSummary {
  gameId: string | null;
  mapId: string | null;
  seed: number | null;
  outcome: GameOutcome | null;
  rounds: number;
  hintsTotal: number;
  camerasTriggered: number;
}

/**
 * A resumable mid-game entry (structure fixed now, written by the
 * persistence step): everything needed to continue a running game —
 * the start inputs plus the so-far recorded log lines.
 */
export interface ResumeEntry {
  gameId: string;
  mapId: string;
  seed: number;
  /** `StartGameOptions` as chosen in the menu/settings flow. */
  options: StartGameOptions;
  /** ISO-8601 timestamp of the save. */
  savedAt: string;
  /** JSONL event log lines up to the save point (without `result`). */
  log: string;
}

const OUTCOMES: readonly GameOutcome[] = ["caught", "surrounded", "escaped", "timeout", "draw"];

/**
 * Builds a `GameSummary` from one stored JSONL log; returns `null` for
 * unparseable or header-less content so damaged entries simply drop
 * out of the listing.
 */
export function summarizeLog(jsonl: string): GameSummary | null {
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
  const outcome =
    typeof result?.outcome === "string" && (OUTCOMES as readonly string[]).includes(result.outcome)
      ? (result.outcome as GameOutcome)
      : null;
  return {
    gameId: typeof header.gameId === "string" ? header.gameId : null,
    mapId: typeof header.mapId === "string" ? header.mapId : null,
    seed: typeof header.seed === "number" ? header.seed : null,
    outcome,
    rounds: typeof result?.rounds === "number" ? result.rounds : 0,
    hintsTotal: typeof result?.hintsTotal === "number" ? result.hintsTotal : 0,
    camerasTriggered: typeof result?.camerasTriggered === "number" ? result.camerasTriggered : 0,
  };
}

/**
 * Summaries of all retained game logs, newest first (the FIFO stores
 * oldest → newest; the menu lists the most recent game on top).
 */
export function listGameSummaries(storage?: StorageLike | null): GameSummary[] {
  return listGameLogs(storage)
    .map(summarizeLog)
    .filter((entry): entry is GameSummary => entry !== null)
    .reverse();
}

function defaultStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined" || window.localStorage == null) {
      return null;
    }
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Stored resume entries, newest first. Nothing writes them yet (the
 * mid-game persistence is scheduled for the next step), so this
 * currently always returns an empty list — the structure and storage
 * key are what the menu already relies on.
 */
export function listResumeEntries(storage?: StorageLike | null): ResumeEntry[] {
  const resolved = storage === undefined ? defaultStorage() : storage;
  if (resolved === null) {
    return [];
  }
  try {
    const raw = resolved.getItem(RESUME_STORAGE_KEY);
    if (raw === null) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is ResumeEntry =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as ResumeEntry).gameId === "string" &&
        typeof (item as ResumeEntry).mapId === "string" &&
        typeof (item as ResumeEntry).seed === "number" &&
        typeof (item as ResumeEntry).savedAt === "string" &&
        typeof (item as ResumeEntry).log === "string",
    );
  } catch {
    return [];
  }
}
