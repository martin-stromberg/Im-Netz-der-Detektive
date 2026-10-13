/**
 * Game recorder (02-technisches-konzept.md sections 5 and 8): every game
 * is recorded as a JSONL event log — a `header` line (gameId, mapId,
 * seed, config, mission, cameras, starts), sequenced events
 * (`seq`/`round`/`type`/…/`visibleTo`) and a final `result` line with
 * the balancing metrics. The same seed and the same inputs reproduce
 * the same log bit for bit — `rng.ts` stays the single randomness
 * source.
 *
 * The module owns the browser boundary so the engine stays headless:
 * `localStorage` keeps the last `MAX_STORED_LOGS` games (FIFO) and
 * `exportGameLog` produces a downloadable JSONL file — both degrade to
 * no-ops when `window`/`document`/`Blob` are missing, and both accept
 * injected implementations for tests and simulations.
 */
import type { LogEntry, MissionOption, StartGameOptions } from "../state/gameStore";

/** `localStorage` key under which the last N game logs are kept. */
export const LOG_STORAGE_KEY = "im-netz-der-detektive:game-logs";

/** How many recent game logs are retained (FIFO). */
export const MAX_STORED_LOGS = 10;

/**
 * Minimal storage contract — structurally compatible with
 * `localStorage`/`sessionStorage`, injectable for tests.
 */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Download sink for `exportGameLog` — injectable, DOM default. */
export type LogDownloader = (blob: Blob, filename: string) => void;

export interface PersistOptions {
  /** Storage to use; `undefined` resolves the default (`window.localStorage`), `null` disables. */
  storage?: StorageLike | null;
  /** FIFO limit; defaults to `MAX_STORED_LOGS`. */
  maxLogs?: number;
}

export interface ExportOptions {
  /** Defaults to `im-netz-der-detektive-{gameId}.jsonl`. */
  filename?: string;
  /** Defaults to a DOM anchor download (no-op without `document`). */
  download?: LogDownloader;
}

/** Everything a header carries to replay `startGame` identically. */
export interface ReconstructedStart {
  mapId: string;
  seed: number;
  options: StartGameOptions;
}

/**
 * Serializes one log entry to a JSONL line. The `header` is the only
 * entry written without `seq`/`round` (spec section 8 example: events
 * count 1..n, the header precedes them).
 */
export function serializeLogEntry(entry: LogEntry): string {
  const record: Record<string, unknown> = { ...entry };
  if (entry.type === "header") {
    delete record.seq;
    delete record.round;
  }
  return JSON.stringify(record);
}

/** The full log as JSONL — one JSON object per line, spec section 8. */
export function serializeLog(log: readonly LogEntry[]): string {
  return log.map(serializeLogEntry).join("\n");
}

/** Parses a JSONL log back into plain records (one object per line). */
export function parseLog(jsonl: string): Record<string, unknown>[] {
  return jsonl
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

/** The `header` entry of a log, or `undefined` when none was recorded. */
export function headerFromLog(log: readonly LogEntry[]): LogEntry | undefined {
  return log.find((entry) => entry.type === "header");
}

/**
 * Maps a `header` entry back to everything `startGame` needs to
 * reproduce the exact same initial state: `mapId` + `seed` plus the
 * effective `StartGameOptions` (explicit starts, resolved limits and
 * the original mission option, so the mission's provenance — `random`,
 * `custom`, case id — survives reconstruction).
 */
export function startOptionsFromHeader(header: LogEntry): ReconstructedStart {
  if (header.type !== "header") {
    throw new TypeError(
      `startOptionsFromHeader expects a header entry, got type ${JSON.stringify(header.type)}`,
    );
  }
  const config = (header.config ?? {}) as Record<string, unknown>;
  const starts = (header.starts ?? {}) as { detectives?: string[]; ganove?: string };
  return {
    mapId: header.mapId as string,
    seed: header.seed as number,
    options: {
      gameId: header.gameId as string | undefined,
      detectivePositions: starts.detectives,
      ganovePosition: starts.ganove,
      roundLimit: (config.roundLimit ?? null) as number | null,
      cameraCount: config.cameraCount as number | undefined,
      radioHintCount: config.radioHintCount as number | undefined,
      edgeBlockRounds: config.edgeBlockRounds as number | undefined,
      cameraProtectedNodes: config.cameraProtectedNodes as string[] | undefined,
      mission: config.mission as MissionOption | undefined,
    },
  };
}

/**
 * `window.localStorage` when it exists and is accessible — `null`
 * otherwise (headless runs, blocked storage). Never throws.
 */
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

/** Stored JSONL strings, oldest → newest; invalid content reads as empty. */
function readLogStrings(storage: StorageLike): string[] {
  try {
    const raw = storage.getItem(LOG_STORAGE_KEY);
    if (raw === null) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

/** The retained game logs (JSONL), oldest → newest. */
export function listGameLogs(storage?: StorageLike | null): string[] {
  const resolved = resolveStorage(storage);
  return resolved === null ? [] : readLogStrings(resolved);
}

/**
 * Serializes `log` and appends it to the retained logs, keeping only
 * the last `maxLogs` entries (FIFO). Returns the JSONL string; `null`
 * when no storage is available. Storage write failures (quota, denied
 * access) degrade silently — recording is best-effort and must never
 * break a finished game.
 */
export function saveGameLog(log: readonly LogEntry[], options?: PersistOptions): string | null {
  const storage = resolveStorage(options?.storage);
  if (storage === null) {
    return null;
  }
  const jsonl = serializeLog(log);
  const kept = [...readLogStrings(storage), jsonl].slice(-(options?.maxLogs ?? MAX_STORED_LOGS));
  try {
    storage.setItem(LOG_STORAGE_KEY, JSON.stringify(kept));
  } catch {
    // Quota or denied storage: the game is already over — ignore.
  }
  return jsonl;
}

/** Removes all retained game logs. */
export function clearGameLogs(storage?: StorageLike | null): void {
  resolveStorage(storage)?.removeItem(LOG_STORAGE_KEY);
}

/** Default download: anchor click — only with a DOM, else a no-op. */
function defaultDownload(blob: Blob, filename: string): void {
  if (
    typeof document === "undefined" ||
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    return;
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * "Partie exportieren" (spec section 8): builds a downloadable
 * `application/x-ndjson` Blob from the log and hands it to the
 * download sink. Returns the `Blob` (`null` where `Blob` is
 * unavailable); without a DOM the default sink simply does nothing, so
 * callers can always use the returned Blob themselves.
 */
export function exportGameLog(log: readonly LogEntry[], options?: ExportOptions): Blob | null {
  if (typeof Blob === "undefined") {
    return null;
  }
  const blob = new Blob([serializeLog(log)], { type: "application/x-ndjson" });
  const gameId = headerFromLog(log)?.gameId;
  const filename =
    options?.filename ??
    `im-netz-der-detektive-${typeof gameId === "string" ? gameId : "partie"}.jsonl`;
  (options?.download ?? defaultDownload)(blob, filename);
  return blob;
}
