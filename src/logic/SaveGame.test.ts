/**
 * Save/Load (spec section 8.1): `buildResumeEntry` freezes a running
 * game as `State-Snapshot + Log + Seed` inside a versioned
 * `ResumeEntry`; `resumeGame` restores it bit-identically — including
 * spent one-shot abilities (`radioUsed`), sabotage windows
 * (`hintSilenceUntilRound`/`falseTrailUntilRound`), camera states and
 * the exact phase/turn cursor.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { loadMap } from "./MapLoader";
import { useGameStore, type GameData, type GameStateSnapshot } from "../state/gameStore";
import {
  buildResumeEntry,
  gameIdOf,
  isValidResumeEntry,
  resumeLogEntries,
  SAVE_SCHEMA_VERSION,
  snapshotGame,
} from "./SaveGame";
import { serializeLog } from "./Recorder";

const map = loadMap("teststadt");

const store = () => useGameStore.getState();

/** The plain-data part of the current state (functions stripped). */
function dataOf(state: ReturnType<typeof store>): GameData {
  const data: Record<string, unknown> = { ...state };
  for (const key of Object.keys(data)) {
    if (typeof data[key] === "function") {
      delete data[key];
    }
  }
  return data as unknown as GameData;
}

/** Plays `rounds` full rounds (ganove move + every detective move). */
function playTurns(turns: number): void {
  for (let i = 0; i < turns && store().outcome === null; i += 1) {
    if (store().phase === "ganove") {
      const moves = store().getLegalGanoveMoves();
      if (moves.length === 0) {
        return;
      }
      store().moveGanove(moves[0].nodeId);
    }
    while (store().phase === "detektive" && store().outcome === null) {
      const targets = store().getLegalDetectiveMoves();
      if (targets.length === 0) {
        break;
      }
      store().moveDetective(targets[0].nodeId);
    }
  }
}

describe("snapshotGame", () => {
  beforeEach(() => store().resetGame());

  it("extracts every data field except map and log", () => {
    store().startGame(map, 7);
    const snapshot = snapshotGame(store());
    expect(snapshot).not.toHaveProperty("map");
    expect(snapshot).not.toHaveProperty("log");
    expect(snapshot.round).toBe(store().round);
    expect(snapshot.phase).toBe(store().phase);
    expect(snapshot.detektivePositions).toEqual(store().detektivePositions);
    expect(snapshot.cameras).toEqual(store().cameras);
    expect(snapshot.seed).toBe(7);
  });

  it("deep-copies the state — later moves do not alias the snapshot", () => {
    store().startGame(map, 7);
    const snapshot = snapshotGame(store());
    const positions = [...snapshot.detektivePositions];
    playTurns(1);
    expect(snapshot.detektivePositions).toEqual(positions);
  });
});

describe("buildResumeEntry", () => {
  beforeEach(() => store().resetGame());

  it("builds a versioned entry with snapshot, JSONL log and start options", () => {
    store().startGame(map, 42);
    playTurns(1);
    const entry = buildResumeEntry(store(), "ganove", "2026-10-14T12:00:00.000Z");
    expect(entry).not.toBeNull();
    expect(entry!.schema).toBe(SAVE_SCHEMA_VERSION);
    expect(entry!.gameId).toBe("g-42");
    expect(entry!.mapId).toBe("teststadt");
    expect(entry!.seed).toBe(42);
    expect(entry!.mode).toBe("ganove");
    expect(entry!.savedAt).toBe("2026-10-14T12:00:00.000Z");
    expect(entry!.log).toBe(serializeLog(store().log));
    expect(entry!.options.mission).toBeDefined();
    expect(isValidResumeEntry(entry)).toBe(true);
  });

  it("returns null without a running game or after the outcome", () => {
    expect(buildResumeEntry(store(), "ganove")).toBeNull();
    store().startGame(map, 42);
    store().abortAsDraw();
    expect(buildResumeEntry(store(), "ganove")).toBeNull();
  });
});

describe("isValidResumeEntry", () => {
  beforeEach(() => store().resetGame());

  function validEntry() {
    store().startGame(map, 42);
    const entry = buildResumeEntry(store(), "detektiv")!;
    expect(entry).not.toBeNull();
    return entry;
  }

  it("rejects entries of another schema version", () => {
    expect(isValidResumeEntry({ ...validEntry(), schema: SAVE_SCHEMA_VERSION + 1 })).toBe(false);
  });

  it("rejects entries without a snapshot or with a damaged one", () => {
    const entry = validEntry();
    const without = { ...entry } as Record<string, unknown>;
    delete without.snapshot;
    expect(isValidResumeEntry(without)).toBe(false);
    expect(
      isValidResumeEntry({ ...entry, snapshot: { round: 1 } as unknown as GameStateSnapshot }),
    ).toBe(false);
  });

  it("rejects malformed scalar fields", () => {
    const entry = validEntry();
    expect(isValidResumeEntry({ ...entry, mode: "dev" })).toBe(false);
    expect(isValidResumeEntry({ ...entry, seed: "42" })).toBe(false);
    expect(isValidResumeEntry(null)).toBe(false);
    expect(isValidResumeEntry("x")).toBe(false);
  });
});

describe("resumeGame", () => {
  beforeEach(() => store().resetGame());

  it("restores the identical full state after save → reset → load", () => {
    store().startGame(map, 42);
    playTurns(2);
    const before = dataOf(store());
    const entry = buildResumeEntry(store(), "ganove")!;

    // keep playing, then wipe everything
    playTurns(2);
    store().resetGame();

    const restoredMap = loadMap(entry.mapId);
    store().resumeGame(restoredMap, entry.snapshot, resumeLogEntries(entry));
    expect(dataOf(store())).toEqual(before);
    expect(serializeLog(store().log)).toBe(entry.log);
  });

  it("keeps one-shot abilities spent — the police radio stays consumed", () => {
    store().startGame(map, 42);
    store().useRadio();
    const entry = buildResumeEntry(store(), "ganove")!;
    store().resetGame();
    store().resumeGame(loadMap(entry.mapId), entry.snapshot, resumeLogEntries(entry));
    expect(store().radioUsed).toBe(true);
    expect(() => store().useRadio()).toThrow();
  });

  it("preserves sabotage windows, deactivated cameras and blocked edges", () => {
    store().startGame(map, 42);
    store().setTension(7);
    store().blockEdge(map.edges[0].a, map.edges[0].b, 99);
    store().deactivateCameras();
    const before = dataOf(store());
    const entry = buildResumeEntry(store(), "detektiv")!;
    store().resetGame();
    store().resumeGame(loadMap(entry.mapId), entry.snapshot, resumeLogEntries(entry));
    expect(dataOf(store())).toEqual(before);
    expect(store().cameras.every((c) => !c.active)).toBe(true);
    expect(store().blockedEdges).toHaveLength(1);
  });

  it("resumes mid-detective-phase with the active detective index", () => {
    store().startGame(map, 42);
    const moves = store().getLegalGanoveMoves();
    store().moveGanove(moves[0].nodeId);
    // one detective moved, the rest still queued (more than 1 detective)
    if (store().detektivePositions.length > 1) {
      const targets = store().getLegalDetectiveMoves();
      store().moveDetective(targets[0].nodeId);
      const entry = buildResumeEntry(store(), "detektiv");
      if (entry === null) {
        return; // the move ended the game — nothing to resume
      }
      const index = store().activeDetectiveIndex;
      const phase = store().phase;
      store().resetGame();
      store().resumeGame(loadMap(entry.mapId), entry.snapshot, resumeLogEntries(entry));
      expect(store().phase).toBe(phase);
      expect(store().activeDetectiveIndex).toBe(index);
    }
  });

  it("gameIdOf reads the header game id", () => {
    store().startGame(map, 77);
    expect(gameIdOf(store())).toBe("g-77");
  });
});

describe("resumeLogEntries", () => {
  it("parses the entry JSONL back into log entries", () => {
    store().resetGame();
    store().startGame(map, 5);
    const entry = buildResumeEntry(store(), "ganove")!;
    const entries = resumeLogEntries(entry);
    expect(entries).toHaveLength(store().log.length);
    expect(entries[0].type).toBe("header");
  });
});
