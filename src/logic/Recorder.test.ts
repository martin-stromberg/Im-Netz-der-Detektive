import { describe, expect, it, vi } from "vitest";
import type { LogEntry } from "../state/gameStore";
import {
  LOG_STORAGE_KEY,
  MAX_STORED_LOGS,
  clearGameLogs,
  exportGameLog,
  headerFromLog,
  listGameLogs,
  parseLog,
  saveGameLog,
  serializeLog,
  serializeLogEntry,
  startOptionsFromHeader,
  type StorageLike,
} from "./Recorder";

/** In-memory `localStorage` replacement for headless tests. */
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
  gameId: "g-42",
  mapId: "muenster",
  seed: 12345,
  config: {
    detectiveCount: 2,
    roundLimit: 30,
    cameraCount: 8,
    radioHintCount: 5,
    edgeBlockRounds: 3,
    eventMode: "tension",
    mission: "auto",
    cameraProtectedNodes: [],
  },
  mission: { id: "random", targets: { diebstahl: "a", kontakt: "b", sabotage: null, flucht: "c" } },
  cameras: ["d", "e"],
  starts: { detectives: ["x", "y"], ganove: "z" },
  visibleTo: "both",
};

const moveEntry: LogEntry = {
  seq: 1,
  round: 1,
  type: "move",
  actor: "ganove",
  from: "x",
  to: "y",
  edgeType: "weg",
  visibleTo: "ganove",
};

const hintEntry: LogEntry = {
  seq: 2,
  round: 1,
  type: "hint",
  kind: "camera",
  node: "domplatz",
  visibleTo: "detectives",
};

const resultEntry: LogEntry = {
  seq: 88,
  round: 21,
  type: "result",
  outcome: "caught",
  rounds: 21,
  hintsTotal: 14,
  camerasTriggered: 5,
  visibleTo: "both",
};

const sampleLog: LogEntry[] = [header, moveEntry, hintEntry, resultEntry];

describe("serializeLog (JSONL format, spec section 8)", () => {
  it("writes the header without seq/round and all required fields", () => {
    const line = serializeLogEntry(header);
    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(line.startsWith('{"type":"header"')).toBe(true);
    expect(parsed).not.toHaveProperty("seq");
    expect(parsed).not.toHaveProperty("round");
    expect(parsed).toMatchObject({
      type: "header",
      gameId: "g-42",
      mapId: "muenster",
      seed: 12345,
      cameras: ["d", "e"],
      starts: { detectives: ["x", "y"], ganove: "z" },
      mission: { id: "random" },
      visibleTo: "both",
    });
    expect(parsed.config).toMatchObject({ detectiveCount: 2, roundLimit: 30, mission: "auto" });
  });

  it("writes events with seq/round/type and flat fields in spec order", () => {
    expect(serializeLogEntry(moveEntry)).toBe(
      '{"seq":1,"round":1,"type":"move","actor":"ganove","from":"x","to":"y","edgeType":"weg","visibleTo":"ganove"}',
    );
    expect(serializeLogEntry(hintEntry)).toBe(
      '{"seq":2,"round":1,"type":"hint","kind":"camera","node":"domplatz","visibleTo":"detectives"}',
    );
  });

  it("writes the result line with outcome and balancing metrics", () => {
    expect(serializeLogEntry(resultEntry)).toBe(
      '{"seq":88,"round":21,"type":"result","outcome":"caught","rounds":21,"hintsTotal":14,"camerasTriggered":5,"visibleTo":"both"}',
    );
  });

  it("produces one parseable JSON object per line", () => {
    const jsonl = serializeLog(sampleLog);
    const lines = jsonl.split("\n");
    expect(lines).toHaveLength(sampleLog.length);
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
    expect(parseLog(jsonl)).toHaveLength(sampleLog.length);
  });
});

describe("headerFromLog / startOptionsFromHeader", () => {
  it("returns the header entry or undefined", () => {
    expect(headerFromLog(sampleLog)).toBe(header);
    expect(headerFromLog([moveEntry])).toBeUndefined();
  });

  it("reconstructs startGame inputs from the header", () => {
    const reconstructed = startOptionsFromHeader(header);
    expect(reconstructed.mapId).toBe("muenster");
    expect(reconstructed.seed).toBe(12345);
    expect(reconstructed.options).toEqual({
      gameId: "g-42",
      detectivePositions: ["x", "y"],
      ganovePosition: "z",
      roundLimit: 30,
      cameraCount: 8,
      radioHintCount: 5,
      edgeBlockRounds: 3,
      eventMode: "tension",
      cameraProtectedNodes: [],
      mission: "auto",
      // The recorded mission/cameras are applied verbatim — no redraws.
      resolvedMission: {
        id: "random",
        targets: { diebstahl: "a", kontakt: "b", sabotage: null, flucht: "c" },
      },
      resolvedCameras: ["d", "e"],
    });
  });

  it("feeds a recorded `null` mission and missing cameras through verbatim", () => {
    const reconstructed = startOptionsFromHeader({ ...header, mission: null, cameras: [] });
    expect(reconstructed.options.resolvedMission).toBeNull();
    expect(reconstructed.options.resolvedCameras).toEqual([]);
  });

  it("round-trips structured mission options (case/custom/none)", () => {
    const withCase = startOptionsFromHeader({
      ...header,
      config: { ...(header.config as object), mission: { type: "case", id: "fall-1" } },
    });
    expect(withCase.options.mission).toEqual({ type: "case", id: "fall-1" });

    const withCustom = startOptionsFromHeader({
      ...header,
      config: {
        ...(header.config as object),
        mission: { type: "custom", targets: { diebstahl: "a", kontakt: "b", flucht: "c" } },
      },
    });
    expect(withCustom.options.mission).toEqual({
      type: "custom",
      targets: { diebstahl: "a", kontakt: "b", flucht: "c" },
    });
  });

  it("rejects a non-header entry", () => {
    expect(() => startOptionsFromHeader(moveEntry)).toThrow(TypeError);
  });
});

describe("localStorage FIFO", () => {
  it("keeps the last N logs and drops the oldest", () => {
    const storage = fakeStorage();
    for (let i = 0; i < MAX_STORED_LOGS + 2; i += 1) {
      saveGameLog([{ ...header, gameId: `g-${i}` }], { storage });
    }
    const logs = listGameLogs(storage);
    expect(logs).toHaveLength(MAX_STORED_LOGS);
    // Oldest retained entry is game 2 (games 0 and 1 were evicted).
    expect(logs[0]).toContain('"gameId":"g-2"');
    expect(logs.at(-1)).toContain(`"gameId":"g-${MAX_STORED_LOGS + 1}"`);
  });

  it("stores logs oldest to newest under the storage key", () => {
    const storage = fakeStorage();
    saveGameLog([{ ...header, gameId: "first" }], { storage });
    saveGameLog([{ ...header, gameId: "second" }], { storage });
    const raw = storage.data.get(LOG_STORAGE_KEY);
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw as string) as string[];
    expect(parsed).toHaveLength(2);
    expect(listGameLogs(storage)).toEqual(parsed);
    expect(parsed[0]).toContain('"gameId":"first"');
    expect(parsed[1]).toContain('"gameId":"second"');
  });

  it("honours a custom maxLogs limit", () => {
    const storage = fakeStorage();
    for (let i = 0; i < 5; i += 1) {
      saveGameLog([{ ...header, gameId: `g-${i}` }], { storage, maxLogs: 2 });
    }
    const logs = listGameLogs(storage);
    expect(logs).toHaveLength(2);
    expect(logs[0]).toContain('"gameId":"g-3"');
  });

  it("returns the serialized JSONL string", () => {
    const storage = fakeStorage();
    const jsonl = saveGameLog(sampleLog, { storage });
    expect(jsonl).toBe(serializeLog(sampleLog));
  });

  it("is a no-op without storage (explicit null or headless default)", () => {
    expect(saveGameLog(sampleLog, { storage: null })).toBeNull();
    // No window in the node test environment — the default resolves to null.
    expect(saveGameLog(sampleLog)).toBeNull();
    expect(listGameLogs()).toEqual([]);
  });

  it("treats corrupt storage content as an empty list", () => {
    const storage = fakeStorage({ [LOG_STORAGE_KEY]: "not-json{{{" });
    expect(listGameLogs(storage)).toEqual([]);
    saveGameLog(sampleLog, { storage });
    expect(listGameLogs(storage)).toHaveLength(1);

    const wrongShape = fakeStorage({ [LOG_STORAGE_KEY]: '{"a":1}' });
    expect(listGameLogs(wrongShape)).toEqual([]);
  });

  it("does not throw when the storage write fails (quota/denied)", () => {
    const failing: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: () => undefined,
    };
    expect(() => saveGameLog(sampleLog, { storage: failing })).not.toThrow();
  });

  it("clearGameLogs removes the retained logs", () => {
    const storage = fakeStorage();
    saveGameLog(sampleLog, { storage });
    clearGameLogs(storage);
    expect(listGameLogs(storage)).toEqual([]);
    expect(storage.data.has(LOG_STORAGE_KEY)).toBe(false);
  });
});

describe("exportGameLog", () => {
  it("returns a Blob containing the JSONL and calls the injected downloader", async () => {
    const download = vi.fn();
    const blob = exportGameLog(sampleLog, { download });
    expect(blob).not.toBeNull();
    expect(await blob!.text()).toBe(serializeLog(sampleLog));
    expect(download).toHaveBeenCalledTimes(1);
    const [blobArg, filename] = download.mock.calls[0] as [Blob, string];
    expect(blobArg).toBe(blob);
    expect(filename).toBe("im-netz-der-detektive-g-42.jsonl");
  });

  it("honours a custom filename and falls back without header", () => {
    const download = vi.fn();
    exportGameLog(sampleLog, { filename: "custom.jsonl", download });
    expect(download.mock.calls[0][1]).toBe("custom.jsonl");

    const noHeader: LogEntry[] = [moveEntry];
    exportGameLog(noHeader, { download });
    expect(download.mock.calls[1][1]).toBe("im-netz-der-detektive-partie.jsonl");
  });

  it("does not throw without a DOM (default downloader no-ops)", () => {
    // Node test environment: no document/URL.createObjectURL.
    expect(() => exportGameLog(sampleLog)).not.toThrow();
  });
});
