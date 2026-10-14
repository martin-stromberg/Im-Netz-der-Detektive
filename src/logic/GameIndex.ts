/**
 * Game index (menu layer of spec `02-technisches-konzept.md` sections
 * 6 and 8.1): derives per-game summaries from the JSONL logs retained
 * by `Recorder.listGameLogs` and manages the resumable mid-game saves
 * of "Partie fortsetzen".
 *
 * A `ResumeEntry` carries a versioned snapshot of the store
 * (`SaveGame.ts`), the JSONL log up to the save point and the played
 * perspective, so the menu can restore the exact game state in the
 * matching screen. Entries with an unknown `schema` are rejected on
 * read — later format changes stay explicit instead of silent.
 */
import type { GameOutcome, GameStateSnapshot, StartGameOptions } from "../state/gameStore";
import { listGameLogs, parseLog, type StorageLike } from "./Recorder";
import { isValidResumeEntry } from "./SaveGame";

/** `localStorage` key holding the resumable mid-game saves. */
export const RESUME_STORAGE_KEY = "im-netz-der-detektive:resume-entries";

/** How many resume entries are retained (FIFO). */
export const MAX_RESUME_ENTRIES = 10;

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
 * A resumable mid-game entry: everything needed to continue a running
 * game — the start inputs plus the state snapshot and the so-far
 * recorded log lines (spec section 8.1: "Speicherstand =
 * State-Snapshot + Log + Seed"). `schema` versions the format.
 */
export interface ResumeEntry {
  /** Format version — `SAVE_SCHEMA_VERSION`; others are rejected on read. */
  schema: number;
  gameId: string;
  mapId: string;
  seed: number;
  /** The perspective the saving player controls. */
  mode: "ganove" | "detektiv";
  /** `StartGameOptions` as chosen in the menu/settings flow. */
  options: StartGameOptions;
  /** ISO-8601 timestamp of the save. */
  savedAt: string;
  /** JSONL event log lines up to the save point (without `result`). */
  log: string;
  /** State snapshot — every `GameData` field except `map` and `log`. */
  snapshot: GameStateSnapshot;
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

function resolveStorage(storage: StorageLike | null | undefined): StorageLike | null {
  return storage === undefined ? defaultStorage() : storage;
}

/** Raw stored array (any schema, possibly malformed), newest first. */
function readRawResumeEntries(storage: StorageLike): unknown[] {
  try {
    const raw = storage.getItem(RESUME_STORAGE_KEY);
    if (raw === null) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** The `gameId` of a raw stored entry — `undefined` when malformed. */
function rawGameId(item: unknown): string | undefined {
  return typeof item === "object" &&
    item !== null &&
    typeof (item as ResumeEntry).gameId === "string"
    ? (item as ResumeEntry).gameId
    : undefined;
}

/** Stored entries of the current schema (valid snapshots only), newest first. */
function readResumeEntries(storage: StorageLike): ResumeEntry[] {
  // Entries of an unknown schema version or with a damaged snapshot
  // are filtered out — a later format is never guessed at.
  return readRawResumeEntries(storage).filter((item): item is ResumeEntry =>
    isValidResumeEntry(item),
  );
}

/**
 * Stored resume entries, newest first. Only entries of the current
 * `SAVE_SCHEMA_VERSION` with a structurally valid snapshot are listed.
 */
export function listResumeEntries(storage?: StorageLike | null): ResumeEntry[] {
  const resolved = resolveStorage(storage);
  return resolved === null ? [] : readResumeEntries(resolved);
}

/**
 * Persists a resume entry: an existing entry of the same `gameId` is
 * replaced (saving again overwrites the earlier save point), and the
 * list stays within `MAX_RESUME_ENTRIES` (FIFO). Newest entries sort
 * first. Entries of a foreign schema version are preserved on write —
 * only same-`gameId` duplicates and the FIFO overflow are dropped.
 * Storage write failures degrade silently — saving is best-effort and
 * must never break a running game.
 */
export function saveResumeEntry(entry: ResumeEntry, storage?: StorageLike | null): void {
  const resolved = resolveStorage(storage);
  if (resolved === null) {
    return;
  }
  const kept = [
    entry,
    ...readRawResumeEntries(resolved).filter((item) => rawGameId(item) !== entry.gameId),
  ].slice(0, MAX_RESUME_ENTRIES);
  try {
    resolved.setItem(RESUME_STORAGE_KEY, JSON.stringify(kept));
  } catch {
    // Quota or denied storage: ignore — the running game stays playable.
  }
}

/**
 * Removes the resume entry of `gameId`; unknown ids are a no-op.
 * Entries of a foreign schema version are kept — deletion is strictly
 * scoped to the matching `gameId`.
 */
export function deleteResumeEntry(gameId: string, storage?: StorageLike | null): void {
  const resolved = resolveStorage(storage);
  if (resolved === null) {
    return;
  }
  const kept = readRawResumeEntries(resolved).filter((item) => rawGameId(item) !== gameId);
  try {
    resolved.setItem(RESUME_STORAGE_KEY, JSON.stringify(kept));
  } catch {
    // Storage failures degrade silently.
  }
}

/** Removes all resume entries. */
export function clearResumeEntries(storage?: StorageLike | null): void {
  resolveStorage(storage)?.removeItem(RESUME_STORAGE_KEY);
}
