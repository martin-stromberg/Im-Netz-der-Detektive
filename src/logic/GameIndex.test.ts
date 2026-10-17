import { describe, expect, it } from "vitest";
import {
  clearResumeEntries,
  deleteResumeEntry,
  listGameSummaries,
  listResumeEntries,
  RESUME_STORAGE_KEY,
  saveResumeEntry,
  summarizeLog,
  type GameSummary,
} from "./GameIndex";
import { serializeLog, type StorageLike } from "./Recorder";
import type { LogEntry } from "../state/gameStore";

function fakeStorage(initial?: Record<string, string>): StorageLike & {
  data: Map<string, string>;
} {
  const data = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const header: LogEntry = {
  seq: 0,
  round: 0,
  type: "header",
  gameId: "g-99",
  mapId: "muenster",
  seed: 42,
  config: {},
  mission: null,
  cameras: [],
  starts: { detectives: ["a"], ganove: "z" },
};

const resultEntry: LogEntry = {
  seq: 3,
  round: 12,
  type: "result",
  outcome: "escaped",
  rounds: 12,
  hintsTotal: 7,
  camerasTriggered: 2,
  visibleTo: "both",
};

describe("summarizeLog", () => {
  it("derives a summary from header + result", () => {
    const summary = summarizeLog(serializeLog([header, resultEntry]));
    expect(summary).toEqual({
      gameId: "g-99",
      mapId: "muenster",
      seed: 42,
      outcome: "escaped",
      rounds: 12,
      hintsTotal: 7,
      camerasTriggered: 2,
    });
  });

  it("returns null for content without a header", () => {
    expect(summarizeLog(serializeLog([resultEntry]))).toBeNull();
  });

  it("returns null for unparseable content", () => {
    expect(summarizeLog("not json\nstill not json")).toBeNull();
  });

  it("tolerates a missing result line", () => {
    const summary = summarizeLog(serializeLog([header]));
    expect(summary?.outcome).toBeNull();
    expect(summary?.rounds).toBe(0);
  });
});

describe("listGameSummaries", () => {
  it("returns stored summaries newest first", () => {
    const older = serializeLog([{ ...header, gameId: "g-1" }, resultEntry]);
    const newer = serializeLog([{ ...header, gameId: "g-2" }, resultEntry]);
    const storage = fakeStorage({
      "im-netz-der-detektive:game-logs": JSON.stringify([older, "broken", newer]),
    });
    const list: GameSummary[] = listGameSummaries(storage);
    expect(list.map((entry) => entry.gameId)).toEqual(["g-2", "g-1"]);
  });

  it("returns an empty list for empty storage", () => {
    expect(listGameSummaries(fakeStorage())).toEqual([]);
    expect(listGameSummaries(null)).toEqual([]);
  });
});

describe("listResumeEntries", () => {
  it("returns an empty list when nothing is stored", () => {
    expect(listResumeEntries(fakeStorage())).toEqual([]);
    expect(listResumeEntries(null)).toEqual([]);
  });

  it("filters malformed entries and unknown schema versions out", () => {
    const valid = {
      schema: 1,
      gameId: "g-1",
      mapId: "muenster",
      seed: 7,
      mode: "ganove",
      options: {},
      savedAt: "2026-10-14T00:00:00.000Z",
      log: "{}",
      snapshot: {
        round: 2,
        phase: "ganove",
        activeDetectiveIndex: 0,
        detektivePositions: ["a"],
        events: [],
        cameras: [],
        blockedEdges: [],
        seed: 7,
      },
    };
    const future = { ...valid, gameId: "g-2", schema: 99 };
    const storage = fakeStorage({
      [RESUME_STORAGE_KEY]: JSON.stringify([valid, { broken: true }, "x", future]),
    });
    expect(listResumeEntries(storage)).toEqual([valid]);
  });
});

describe("saveResumeEntry / deleteResumeEntry / clearResumeEntries", () => {
  function entry(gameId: string, round = 1) {
    return {
      schema: 1,
      gameId,
      mapId: "muenster",
      seed: 7,
      mode: "ganove" as const,
      options: {},
      savedAt: "2026-10-14T00:00:00.000Z",
      log: "{}",
      snapshot: {
        round,
        phase: "ganove" as const,
        activeDetectiveIndex: 0,
        detektivePositions: ["a"],
        events: [],
        cameras: [],
        blockedEdges: [],
        seed: 7,
      } as never,
    };
  }

  it("stores entries newest first and replaces the same gameId", () => {
    const storage = fakeStorage();
    saveResumeEntry(entry("g-1"), storage);
    saveResumeEntry(entry("g-2"), storage);
    expect(listResumeEntries(storage).map((e) => e.gameId)).toEqual(["g-2", "g-1"]);
    // Saving the same game again replaces the old save point.
    saveResumeEntry(entry("g-1", 5), storage);
    const list = listResumeEntries(storage);
    expect(list.map((e) => e.gameId)).toEqual(["g-1", "g-2"]);
    expect(list[0].snapshot.round).toBe(5);
  });

  it("keeps at most MAX_RESUME_ENTRIES", () => {
    const storage = fakeStorage();
    for (let i = 0; i < 12; i += 1) {
      saveResumeEntry(entry(`g-${i}`), storage);
    }
    const list = listResumeEntries(storage);
    expect(list).toHaveLength(10);
    expect(list[0].gameId).toBe("g-11");
  });

  it("deletes a single entry by gameId and clears all", () => {
    const storage = fakeStorage();
    saveResumeEntry(entry("g-1"), storage);
    saveResumeEntry(entry("g-2"), storage);
    deleteResumeEntry("g-1", storage);
    expect(listResumeEntries(storage).map((e) => e.gameId)).toEqual(["g-2"]);
    deleteResumeEntry("unknown", storage);
    expect(listResumeEntries(storage)).toHaveLength(1);
    clearResumeEntries(storage);
    expect(listResumeEntries(storage)).toEqual([]);
  });

  it("preserves foreign-schema entries on save and delete", () => {
    const storage = fakeStorage({
      [RESUME_STORAGE_KEY]: JSON.stringify([{ ...entry("g-future"), schema: 99 }, entry("g-1")]),
    });
    saveResumeEntry(entry("g-2"), storage);
    const raw = JSON.parse(storage.getItem(RESUME_STORAGE_KEY)!) as { gameId: string }[];
    // The schema-99 entry survives the write even though it never lists.
    expect(raw.map((item) => item.gameId)).toEqual(["g-2", "g-future", "g-1"]);
    expect(listResumeEntries(storage).map((e) => e.gameId)).toEqual(["g-2", "g-1"]);
    deleteResumeEntry("g-1", storage);
    const after = JSON.parse(storage.getItem(RESUME_STORAGE_KEY)!) as { gameId: string }[];
    expect(after.map((item) => item.gameId)).toEqual(["g-2", "g-future"]);
  });

  it("degrades silently without storage or on write failure", () => {
    expect(() => saveResumeEntry(entry("g-1"), null)).not.toThrow();
    expect(() => deleteResumeEntry("g-1", null)).not.toThrow();
    const failing: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => undefined,
    };
    expect(() => saveResumeEntry(entry("g-1"), failing)).not.toThrow();
  });
});
