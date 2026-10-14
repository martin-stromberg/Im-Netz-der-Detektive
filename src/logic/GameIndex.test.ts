import { describe, expect, it } from "vitest";
import {
  listGameSummaries,
  listResumeEntries,
  RESUME_STORAGE_KEY,
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

describe("listResumeEntries (Struktur für Schritt 12)", () => {
  it("returns an empty list when nothing is stored", () => {
    expect(listResumeEntries(fakeStorage())).toEqual([]);
    expect(listResumeEntries(null)).toEqual([]);
  });

  it("filters malformed entries out", () => {
    const valid = {
      gameId: "g-1",
      mapId: "muenster",
      seed: 7,
      options: {},
      savedAt: "2026-10-14T00:00:00.000Z",
      log: "{}",
    };
    const storage = fakeStorage({
      [RESUME_STORAGE_KEY]: JSON.stringify([valid, { broken: true }, "x"]),
    });
    expect(listResumeEntries(storage)).toEqual([valid]);
  });
});
