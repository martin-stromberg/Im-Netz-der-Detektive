import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HINT_EVENT_KINDS } from "../logic/InformationSystem";
import { loadMap } from "../logic/MapLoader";
import type { MapPack } from "../logic/mapPack";
import {
  LOG_STORAGE_KEY,
  exportGameLog,
  headerFromLog,
  listGameLogs,
  parseLog,
  serializeLog,
  startOptionsFromHeader,
  type StorageLike,
} from "../logic/Recorder";
import { useGameStore } from "./gameStore";

function reset() {
  useGameStore.getState().resetGame();
}

function store() {
  return useGameStore.getState();
}

/**
 * Scripted mission map (same fixture family as gameStore.mission.test):
 *   p - s - d - m1 - k - m2 - x        (x = sabotage dead end)
 *                   \- m3 - m4 - m5 - f
 * `chance: 1` + hinweis-only eventMix emits a zone hint on every ganove
 * turn without ever blocking the scripted route.
 */
const missionMap: MapPack = {
  id: "missionmap",
  name: "Mission Test",
  viewBox: "0 0 12 2",
  nodes: [
    { id: "p", name: "P", x: 0, y: 0, categories: ["kontakt"], zone: "west" },
    { id: "s", name: "S", x: 1, y: 0, categories: ["kontakt"], zone: "west" },
    { id: "d", name: "D", x: 2, y: 0, categories: ["diebstahl"], zone: "west" },
    { id: "m1", name: "M1", x: 3, y: 0, categories: ["kontakt"], zone: "mid" },
    { id: "k", name: "K", x: 4, y: 0, categories: ["kontakt"], zone: "mid" },
    { id: "m2", name: "M2", x: 5, y: 0, categories: ["kontakt"], zone: "mid" },
    { id: "x", name: "X", x: 6, y: 0, categories: ["sabotage"], zone: "mid" },
    { id: "m3", name: "M3", x: 5, y: 1, categories: ["kontakt"], zone: "east" },
    { id: "m4", name: "M4", x: 6, y: 1, categories: ["kontakt"], zone: "east" },
    { id: "m5", name: "M5", x: 7, y: 1, categories: ["kontakt"], zone: "east" },
    { id: "f", name: "F", x: 8, y: 1, categories: ["flucht"], zone: "east" },
  ],
  edges: [
    { a: "p", b: "s", type: "weg" },
    { a: "s", b: "d", type: "weg" },
    { a: "d", b: "m1", type: "weg" },
    { a: "m1", b: "k", type: "weg" },
    { a: "k", b: "m2", type: "weg" },
    { a: "m2", b: "x", type: "weg" },
    { a: "k", b: "m3", type: "weg" },
    { a: "m3", b: "m4", type: "weg" },
    { a: "m4", b: "m5", type: "weg" },
    { a: "m5", b: "f", type: "weg" },
  ],
  spawnRules: {
    detectives: { mode: "choice", nodes: ["p"] },
    ganove: { mode: "choice", nodes: ["s"] },
    order: "detektive_first",
  },
  settings: {
    detectiveCount: { suggested: 1, min: 1, max: 4 },
    cameraCount: { suggested: 1, min: 0, max: 4 },
    roundLimit: { suggested: 60, min: 1, unlimited: true },
    radioHintCount: { suggested: 3, min: 1, max: 5 },
    edgeBlockRounds: { suggested: 3, min: 1, max: 6 },
    cameraMinGap: 2,
    hintZoneRadius: 1,
    eventMode: "chance",
    eventDefaults: { cycle: 2, chance: 1.0, threshold: 10, perRound: 10 },
    eventMix: { sichtbarkeit: 0, hinweis: 1, umwelt: 0 },
    missionRules: {
      minGap: 2,
      maxGap: 8,
      routeBudget: 12,
      routeBudgetSabotage: 15,
      sabotageDetour: 4,
    },
    sabotageEffects: ["kamera_aus", "funkstille", "falsche_spur"],
  },
};

/** Detective oscillates p <-> s, never touching the mission route. */
function detStep() {
  const pos = store().detektivePositions[0];
  store().moveDetective(pos === "p" ? "s" : "p");
}

function ganoveMove(target: string) {
  store().moveGanove(target);
  if (store().outcome === null) {
    detStep();
  }
}

function ganoveAct() {
  store().ganoveAction();
  if (store().outcome === null) {
    detStep();
  }
}

/**
 * Full scripted game touching every log event type:
 * camera trigger (m1), zone hints each round, police radio, sabotage
 * offer + choice + execution, an edge block that expires mid-game,
 * and the escape ending.
 */
function playFullGame(seed = 1) {
  store().startGame(missionMap, seed, {
    detectivePositions: ["p"],
    ganovePosition: "s",
    roundLimit: 60,
    mission: {
      type: "custom",
      targets: { diebstahl: "d", kontakt: "k", flucht: "f", sabotage: "x" },
    },
  });
  store().setCameras(["m1"]); // camera on the scripted route
  store().blockEdge("m3", "m4", 4); // expires entering round 5
  ganoveMove("d"); // R1: approach the diebstahl node
  ganoveAct(); // R2: diebstahl action -> aktion trace
  ganoveMove("m1"); // R3: camera fires
  store().useRadio(); // police radio at the start of R4
  ganoveMove("k"); // R4
  ganoveAct(); // R5: kontakt -> sabotage offer (edge unblock logged)
  store().chooseMissionPath("sabotage");
  ganoveMove("m2"); // R6
  ganoveMove("x"); // R7
  ganoveAct(); // R8: sabotage action -> effect applied
  ganoveMove("m2"); // R9
  ganoveMove("k"); // R10
  ganoveMove("m3"); // R11
  ganoveMove("m4"); // R12
  ganoveMove("m5"); // R13
  ganoveMove("f"); // R14: escaped at the mission flucht node
}

describe("full game log (spec section 8)", () => {
  beforeEach(reset);

  it("records every event type with sequential seq and a final result", () => {
    playFullGame();
    const s = store();
    expect(s.outcome).toBe("escaped");

    const jsonl = serializeLog(s.log);
    const lines = parseLog(jsonl);
    expect(lines).toHaveLength(s.log.length);

    // Header first, no seq — events count 1..n.
    expect(lines[0]).toMatchObject({ type: "header", gameId: "g-1", mapId: "missionmap" });
    expect(lines[0]).not.toHaveProperty("seq");
    const eventSeqs = s.log.filter((e) => e.type !== "header").map((e) => e.seq);
    expect(eventSeqs).toEqual([...Array(eventSeqs.length).keys()].map((i) => i + 1));

    const types = new Set(s.log.map((e) => e.type));
    for (const expected of [
      "header",
      "move",
      "hint",
      "action",
      "sabotage_offer",
      "sabotage",
      "radio",
      "edge_unblock",
      "result",
    ]) {
      expect(types).toContain(expected);
    }

    // Sabotage-Angebot und -Wahl: two records, the second with `chosen`.
    const offers = s.log.filter((e) => e.type === "sabotage_offer");
    expect(offers).toHaveLength(2);
    expect(offers[0]).toMatchObject({ offered: s.mission!.appliedEffect, node: "x" });
    expect(offers[1]).toMatchObject({ chosen: true, node: "x" });

    // Result line: outcome + balancing metrics.
    const result = lines.at(-1)!;
    expect(result).toMatchObject({ type: "result", outcome: "escaped" });
    expect(result.hintsTotal).toBe(
      s.events.filter((event) => HINT_EVENT_KINDS.includes(event.kind)).length,
    );
    expect(result.camerasTriggered).toBe(1); // camera on m1 fired once
    expect(result.rounds).toBe(s.round);
  });

  it("carries a correct visibleTo on every entry", () => {
    playFullGame();
    for (const entry of store().log) {
      expect(entry.visibleTo).toMatch(/^(detectives|ganove|both)$/);
    }
    const expectVisibleTo = (type: string, visibleTo: string, kind?: string) => {
      const entries = store().log.filter(
        (e) => e.type === type && (kind === undefined || e.kind === kind),
      );
      expect(entries.length).toBeGreaterThan(0);
      for (const entry of entries) {
        expect(entry.visibleTo).toBe(visibleTo);
      }
    };
    // Detectives never see the ganove's moves; the ganove sees all
    // detective positions (spec section 1 asymmetry).
    for (const entry of store().log.filter((e) => e.type === "move")) {
      expect(entry.visibleTo).toBe(entry.actor === "ganove" ? "ganove" : "both");
    }
    expectVisibleTo("header", "both");
    expectVisibleTo("hint", "detectives"); // camera + hinweis + aktion traces
    expectVisibleTo("action", "ganove");
    expectVisibleTo("sabotage_offer", "ganove");
    expectVisibleTo("sabotage", "ganove");
    expectVisibleTo("radio", "ganove");
    expectVisibleTo("edge_unblock", "both");
    expectVisibleTo("result", "both");
  });

  it("produces a bit-identical log for the same seed and inputs", () => {
    playFullGame(7);
    const firstLog = serializeLog(store().log);
    const firstState = {
      ganovePosition: store().ganovePosition,
      detektivePositions: [...store().detektivePositions],
      cameras: store().cameras.map((c) => c.nodeId),
      mission: store().mission,
      outcome: store().outcome,
      round: store().round,
    };
    reset();
    playFullGame(7);
    expect(serializeLog(store().log)).toBe(firstLog);
    expect(store().ganovePosition).toBe(firstState.ganovePosition);
    expect(store().detektivePositions).toEqual(firstState.detektivePositions);
    expect(store().cameras.map((c) => c.nodeId)).toEqual(firstState.cameras);
    expect(store().mission).toEqual(firstState.mission);
    expect(store().outcome).toBe(firstState.outcome);
    expect(store().round).toBe(firstState.round);
  });

  it("reconstructs the same starting state from header + seed", () => {
    playFullGame(3);
    const header = headerFromLog(store().log)!;
    const reconstructed = startOptionsFromHeader(header);
    expect(reconstructed.mapId).toBe(missionMap.id);
    expect(reconstructed.seed).toBe(3);

    // Fresh game directly from the recorded header inputs — the
    // reconstructed starting state must match a clean startGame.
    reset();
    store().startGame(missionMap, 3, {
      detectivePositions: ["p"],
      ganovePosition: "s",
      roundLimit: 60,
      mission: {
        type: "custom",
        targets: { diebstahl: "d", kontakt: "k", flucht: "f", sabotage: "x" },
      },
    });
    const original = {
      detektivePositions: [...store().detektivePositions],
      ganovePosition: store().ganovePosition,
      cameras: store().cameras,
      mission: store().mission,
      roundLimit: store().roundLimit,
      radioHintCount: store().radioHintCount,
      edgeBlockRounds: store().edgeBlockRounds,
      escapeNodeIds: [...store().escapeNodeIds],
    };

    reset();
    store().startGame(missionMap, reconstructed.seed, reconstructed.options);
    const s = store();
    expect(s.detektivePositions).toEqual(original.detektivePositions);
    expect(s.ganovePosition).toBe(original.ganovePosition);
    expect(s.cameras).toEqual(original.cameras);
    expect(s.mission).toEqual(original.mission);
    expect(s.roundLimit).toBe(original.roundLimit);
    expect(s.radioHintCount).toBe(original.radioHintCount);
    expect(s.edgeBlockRounds).toBe(original.edgeBlockRounds);
    expect(s.escapeNodeIds).toEqual(original.escapeNodeIds);
  });

  it("records the result metrics also for a draw ending", () => {
    store().startGame(missionMap, 1, {
      detectivePositions: ["p"],
      ganovePosition: "s",
      roundLimit: 60,
      mission: "none",
    });
    store().moveGanove("d");
    store().abortAsDraw();
    const result = parseLog(serializeLog(store().log)).at(-1)!;
    expect(result).toMatchObject({
      type: "result",
      outcome: "draw",
      rounds: 1,
      hintsTotal: expect.any(Number),
      camerasTriggered: 0,
      visibleTo: "both",
    });
  });
});

describe("world event types in the log", () => {
  beforeEach(reset);

  function mixMap(kind: "sichtbarkeit" | "hinweis" | "umwelt"): MapPack {
    return {
      ...missionMap,
      id: `logmap-${kind}`,
      settings: {
        ...missionMap.settings,
        eventMix: {
          sichtbarkeit: kind === "sichtbarkeit" ? 1 : 0,
          hinweis: kind === "hinweis" ? 1 : 0,
          umwelt: kind === "umwelt" ? 1 : 0,
        },
      },
    };
  }

  function startMix(kind: "sichtbarkeit" | "hinweis" | "umwelt") {
    store().startGame(mixMap(kind), 1, {
      detectivePositions: ["p"],
      ganovePosition: "s",
      roundLimit: 60,
      mission: "none",
    });
  }

  it("logs sichtbarkeit as a detective-only exact-node hint", () => {
    startMix("sichtbarkeit");
    store().moveGanove("d");
    const entry = store().log.find((e) => e.type === "hint" && e.kind === "sichtbarkeit");
    expect(entry).toMatchObject({
      type: "hint",
      kind: "sichtbarkeit",
      node: "d",
      visibleTo: "detectives",
    });
  });

  it("logs hinweis as a detective-only zone hint with region", () => {
    startMix("hinweis");
    store().moveGanove("d");
    const entry = store().log.find((e) => e.type === "hint" && e.kind === "hinweis");
    expect(entry).toMatchObject({
      type: "hint",
      kind: "hinweis",
      zone: "west",
      visibleTo: "detectives",
    });
    expect(entry?.nodeIds).toContain("d");
  });

  it("logs umwelt edge blocks as both-visible events with duration", () => {
    // The mission fixture is a tree — no edge can be blocked without
    // splitting the graph. teststadt has cycles, so umwelt fires there.
    const teststadt = loadMap("teststadt");
    const umweltMap: MapPack = {
      ...teststadt,
      settings: {
        ...teststadt.settings,
        eventMode: "chance",
        eventDefaults: { ...teststadt.settings.eventDefaults, chance: 1.0 },
        eventMix: { sichtbarkeit: 0, hinweis: 0, umwelt: 1 },
      },
    };
    store().startGame(umweltMap, 1, {
      detectivePositions: ["a", "i"],
      ganovePosition: "d",
      mission: "none",
    });
    store().moveGanove("c");
    const block = store().log.find((e) => e.type === "event" && e.kind === "umwelt");
    expect(block).toMatchObject({ type: "event", kind: "umwelt", visibleTo: "both" });
    expect(block?.edge).toBeDefined();
    expect(typeof block?.untilRound).toBe("number");
    // The edge is actually blocked in the world state.
    const edge = block!.edge as { a: string; b: string };
    expect(store().blockedEdges).toContainEqual({
      a: edge.a,
      b: edge.b,
      untilRound: block!.untilRound,
    });
  });

  it("logs the expiry of an edge block as edge_unblock", () => {
    startMix("sichtbarkeit"); // no umwelt interference on the route
    store().blockEdge("k", "m3", 1); // blocked during round 1 only
    ganoveMove("d"); // R1: ganove s -> d, detective oscillates
    // Entering round 2 the block expired — recorded for both sides.
    expect(store().log).toContainEqual(
      expect.objectContaining({
        type: "edge_unblock",
        round: 2,
        edge: { a: "k", b: "m3" },
        visibleTo: "both",
      }),
    );
  });
});

describe("export and auto-persist", () => {
  beforeEach(reset);
  afterEach(() => vi.unstubAllGlobals());

  it("exports the running game log as a Blob via the store action", async () => {
    store().startGame(missionMap, 1, {
      detectivePositions: ["p"],
      ganovePosition: "s",
      mission: "none",
    });
    store().moveGanove("d");
    const blob = store().exportGameLog();
    expect(blob).not.toBeNull();
    expect(await blob!.text()).toBe(serializeLog(store().log));
  });

  it("auto-persists the finished log to localStorage when present", () => {
    const data = new Map<string, string>();
    const storage: StorageLike = {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => void data.set(key, value),
      removeItem: (key) => void data.delete(key),
    };
    vi.stubGlobal("window", { localStorage: storage });

    store().startGame(missionMap, 1, {
      detectivePositions: ["p"],
      ganovePosition: "s",
      mission: "none",
    });
    store().moveGanove("d");
    store().abortAsDraw();

    const logs = listGameLogs(storage);
    expect(logs).toHaveLength(1);
    const lines = parseLog(logs[0]);
    expect(lines[0].type).toBe("header");
    expect(lines.at(-1)).toMatchObject({ type: "result", outcome: "draw" });
    // Persisted under the documented key — survives across "sessions"
    // (same storage object, independent store state).
    expect(storage.getItem(LOG_STORAGE_KEY)).toBe(JSON.stringify(logs));
    reset();
    expect(listGameLogs(storage)).toHaveLength(1);
  });

  it("is a silent no-op for finished games without localStorage", () => {
    store().startGame(missionMap, 1, {
      detectivePositions: ["p"],
      ganovePosition: "s",
      mission: "none",
    });
    store().abortAsDraw();
    expect(store().outcome).toBe("draw"); // finish must not throw headless
  });
});

describe("exportGameLog filename", () => {
  beforeEach(reset);

  it("derives the filename from the recorded gameId", () => {
    store().startGame(missionMap, 9, {
      detectivePositions: ["p"],
      ganovePosition: "s",
      mission: "none",
      gameId: "g-0042",
    });
    const download = vi.fn();
    exportGameLog(store().log, { download });
    expect(download.mock.calls[0][1]).toBe("im-netz-der-detektive-g-0042.jsonl");
  });
});
