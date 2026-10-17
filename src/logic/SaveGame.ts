/**
 * Save-game serialization (spec `02-technisches-konzept.md` section
 * 8.1): a save point is `State-Snapshot + Log + Seed`. The snapshot is
 * the plain-data subset of `GameState` — `map` is re-loaded via
 * `loadMap(entry.mapId)`, `log` travels as JSONL inside the
 * `ResumeEntry` itself.
 *
 * The format is versioned: `SAVE_SCHEMA_VERSION` lands in every entry
 * and `listResumeEntries` (GameIndex.ts) rejects unknown versions —
 * later format changes must either stay backward compatible or bump
 * the version (old entries then simply disappear from the menu).
 */
import type { GameData, GameStateSnapshot, LogEntry, StartGameOptions } from "../state/gameStore";
import { headerFromLog, parseLog, serializeLog, startOptionsFromHeader } from "./Recorder";
import type { ResumeEntry } from "./GameIndex";

/** Schema version of the resume-entry format; unknown versions are rejected. */
export const SAVE_SCHEMA_VERSION = 1;

/** Which side the saving player controls — restores the right screen. */
export type SavedPlayerMode = "ganove" | "detektiv";

/** Fields a snapshot must carry (minimal structural validation). */
const SNAPSHOT_REQUIRED: readonly (keyof GameStateSnapshot)[] = [
  "round",
  "phase",
  "activeDetectiveIndex",
  "detektivePositions",
  "events",
  "cameras",
  "blockedEdges",
  "seed",
];

/**
 * Extracts the serializable snapshot from a running game state — a
 * deep copy via JSON so the saved entry cannot alias live state.
 */
export function snapshotGame(state: GameData): GameStateSnapshot {
  const raw: Record<string, unknown> = { ...state };
  delete raw.map;
  delete raw.log;
  return JSON.parse(JSON.stringify(raw)) as GameStateSnapshot;
}

/**
 * The `gameId` of a running game's log header — `null` when no header
 * exists yet (hand-built states in tests).
 */
export function gameIdOf(state: Pick<GameData, "log">): string | null {
  const header = headerFromLog(state.log);
  return header !== undefined && typeof header.gameId === "string" ? header.gameId : null;
}

/**
 * Builds a complete resume entry from the live game state. Returns
 * `null` when the state cannot be saved — no running game
 * (`map === null`) or a finished one (`outcome !== null`).
 */
export function buildResumeEntry(
  state: GameData,
  mode: SavedPlayerMode,
  savedAt: string = new Date().toISOString(),
): ResumeEntry | null {
  if (state.map === null || state.outcome !== null) {
    return null;
  }
  const header = headerFromLog(state.log);
  if (header === undefined) {
    return null;
  }
  const start = startOptionsFromHeader(header);
  const options: StartGameOptions = start.options;
  return {
    schema: SAVE_SCHEMA_VERSION,
    gameId: gameIdOf(state) ?? `g-${state.seed}`,
    mapId: state.map.id,
    seed: state.seed,
    mode,
    options,
    savedAt,
    log: serializeLog(state.log),
    snapshot: snapshotGame(state),
  };
}

/**
 * Minimal structural validation of a stored entry: the schema version
 * must match exactly (clear rejection — no guessing) and the snapshot
 * must carry its required fields. Returns `true` for a loadable entry.
 */
export function isValidResumeEntry(entry: unknown): entry is ResumeEntry {
  if (typeof entry !== "object" || entry === null) {
    return false;
  }
  const candidate = entry as Partial<ResumeEntry>;
  if (
    candidate.schema !== SAVE_SCHEMA_VERSION ||
    typeof candidate.gameId !== "string" ||
    typeof candidate.mapId !== "string" ||
    typeof candidate.seed !== "number" ||
    (candidate.mode !== "ganove" && candidate.mode !== "detektiv") ||
    typeof candidate.savedAt !== "string" ||
    typeof candidate.log !== "string" ||
    typeof candidate.snapshot !== "object" ||
    candidate.snapshot === null
  ) {
    return false;
  }
  return SNAPSHOT_REQUIRED.every((key) => key in (candidate.snapshot as object));
}

/**
 * The parsed log entries of a resume entry — ready to feed
 * `resumeGame`. Corrupt JSONL propagates a `SyntaxError` so callers can
 * drop the damaged entry.
 */
export function resumeLogEntries(entry: ResumeEntry): LogEntry[] {
  // `serializeLogEntry` writes the header without `seq`/`round`
  // (spec section 8) — restore the in-memory defaults so the loaded
  // state is byte-identical to the saved one.
  return parseLog(entry.log).map((record) =>
    record.type === "header" ? ({ seq: 0, round: 0, ...record } as LogEntry) : (record as LogEntry),
  );
}
