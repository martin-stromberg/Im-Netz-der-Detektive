import { beforeEach, describe, expect, it } from "vitest";
import { loadMap } from "../logic/MapLoader";
import type { MapPack } from "../logic/mapPack";
import { MoveError } from "../logic/Movement";
import { useGameStore } from "./gameStore";

const map = loadMap("teststadt");

function reset() {
  useGameStore.getState().resetGame();
}

function store() {
  return useGameStore.getState();
}

function reasonOf(fn: () => void): string {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(MoveError);
    return (error as MoveError).reason;
  }
  throw new Error("expected MoveError");
}

/** Minimal valid map: line a-b-c-d, one detective, tiny round limits. */
const tinyMap: MapPack = {
  id: "tiny",
  name: "Tiny",
  viewBox: "0 0 4 1",
  nodes: [
    { id: "a", name: "A", x: 0, y: 0, categories: ["kontakt"], zone: "z" },
    { id: "b", name: "B", x: 1, y: 0, categories: ["kontakt"], zone: "z" },
    { id: "c", name: "C", x: 2, y: 0, categories: ["kontakt"], zone: "z" },
    { id: "d", name: "D", x: 3, y: 0, categories: ["kontakt"], zone: "z" },
  ],
  edges: [
    { a: "a", b: "b", type: "weg" },
    { a: "b", b: "c", type: "weg" },
    { a: "c", b: "d", type: "weg" },
  ],
  spawnRules: {
    detectives: { mode: "choice", nodes: ["a"] },
    ganove: { mode: "choice", nodes: ["d"] },
    order: "detektive_first",
  },
  settings: {
    detectiveCount: { suggested: 1, min: 1, max: 4 },
    cameraCount: { suggested: 0, min: 0, max: 4 },
    roundLimit: { suggested: 2, min: 1, max: 5, unlimited: true },
    radioHintCount: { suggested: 1, min: 1, max: 4 },
    edgeBlockRounds: { suggested: 2, min: 1, max: 4 },
    cameraMinGap: 2,
    hintZoneRadius: 2,
    eventMode: "tension",
    eventDefaults: { cycle: 4, chance: 0.25, threshold: 40, perRound: 10 },
    eventMix: { sichtbarkeit: 0.25, hinweis: 0.45, umwelt: 0.3 },
    missionRules: {
      minGap: 3,
      maxGap: 8,
      routeBudget: 18,
      routeBudgetSabotage: 22,
      sabotageDetour: 4,
    },
    sabotageEffects: ["kamera_aus"],
  },
};

function startTiny(roundLimit: number | null = 2) {
  store().startGame(tinyMap, 1, {
    detectivePositions: ["a"],
    ganovePosition: "d",
    roundLimit,
  });
}

/** One scripted round on tinyMap: ganove d<->c, detective a<->b. */
function tinyRound(ganoveTo: string, detectiveTo: string) {
  store().moveGanove(ganoveTo);
  store().moveDetective(detectiveTo);
}

describe("caught (Fang)", () => {
  beforeEach(reset);

  it("ends the game immediately mid-detektive-phase, before queued detectives move", () => {
    store().startGame(map, 1, {
      detectivePositions: ["a", "i", "j", "a"],
      ganovePosition: "d",
    });
    // Round 1: ganove d -> c; detectives spread out, D3 reaches e (adjacent to f).
    store().moveGanove("c");
    store().moveDetective("b"); // D1 a -> b
    store().moveDetective("h"); // D2 i -> h
    store().moveDetective("e"); // D3 j -> e
    store().moveDetective("b"); // D4 a -> b (shares D1's node)

    // Round 2: ganove c -> f; D3 e -> f catches him — D4 never moves.
    store().moveGanove("f");
    store().moveDetective("c"); // D1 b -> c
    store().moveDetective("g"); // D2 h -> g
    store().moveDetective("f"); // D3 e -> f: catch!

    const s = store();
    expect(s.outcome).toBe("caught");
    expect(s.phase).toBe("detektive");
    expect(s.activeDetectiveIndex).toBe(2);
    expect(s.log.at(-1)).toMatchObject({
      type: "result",
      details: { outcome: "caught", rounds: 2 },
    });
    // The game is over mid-phase: D4 cannot move anymore.
    expect(reasonOf(() => store().moveDetective("b"))).toBe("game_over");
    expect(reasonOf(() => store().moveGanove("e"))).toBe("game_over");
  });
});

/** Line a-b-c-d-e: detectives corner the ganove on the dead end e. */
const lineMap: MapPack = {
  ...tinyMap,
  id: "line",
  name: "Line",
  nodes: [
    { id: "a", name: "A", x: 0, y: 0, categories: ["kontakt"], zone: "z" },
    { id: "b", name: "B", x: 1, y: 0, categories: ["kontakt"], zone: "z" },
    { id: "c", name: "C", x: 2, y: 0, categories: ["kontakt"], zone: "z" },
    { id: "d", name: "D", x: 3, y: 0, categories: ["kontakt"], zone: "z" },
    { id: "e", name: "E", x: 4, y: 0, categories: ["kontakt"], zone: "z" },
  ],
  edges: [
    { a: "a", b: "b", type: "weg" },
    { a: "b", b: "c", type: "weg" },
    { a: "c", b: "d", type: "weg" },
    { a: "d", b: "e", type: "weg" },
  ],
  spawnRules: {
    detectives: { mode: "choice", nodes: ["a", "b", "d"] },
    ganove: { mode: "choice", nodes: ["e"] },
    order: "detektive_first",
  },
};

describe("surrounded (Umzingelung)", () => {
  beforeEach(reset);

  it("detects a trapped ganove at the start of his phase (detectives' win)", () => {
    store().startGame(lineMap, 1, {
      detectivePositions: ["a", "b"],
      ganovePosition: "e",
      roundLimit: 5,
    });
    // Round 1: ganove e -> d (forced); detectives close in.
    store().moveGanove("d");
    store().moveDetective("b"); // D1 a -> b
    store().moveDetective("c"); // D2 b -> c
    // Round 2: ganove d -> e (c is occupied); detectives seal the exit.
    store().moveGanove("e");
    store().moveDetective("c"); // D1 b -> c
    store().moveDetective("d"); // D2 c -> d

    const s = store();
    expect(s.phase).toBe("ganove"); // round 3 begins — surrounded check fires
    expect(s.round).toBe(3);
    expect(s.outcome).toBe("surrounded");
    expect(s.log.at(-1)).toMatchObject({
      type: "result",
      details: { outcome: "surrounded", rounds: 3 },
    });
  });

  it("detects a ganove surrounded from the very first round", () => {
    store().startGame(lineMap, 1, {
      detectivePositions: ["a", "d"],
      ganovePosition: "e",
    });
    expect(store().outcome).toBe("surrounded");
  });

  it("counts occupied nodes and blocked edges as no legal move", () => {
    store().startGame(map, 1, { detectivePositions: ["a", "i"], ganovePosition: "d" });
    store().moveGanove("c");
    store().blockEdge("c", "d", 99); // c-d blocked (d is also an escape node)
    store().blockEdge("c", "f", 99); // c-f blocked
    store().moveDetective("b"); // D1 occupies b — the last remaining exit
    store().moveDetective("h");
    expect(store().outcome).toBe("surrounded");
  });

  it("does not fire while the ganove can act (action hook keeps him alive)", () => {
    store().startGame(lineMap, 1, {
      detectivePositions: ["a", "b"],
      ganovePosition: "e",
      roundLimit: 5,
    });
    store().moveGanove("d");
    store().moveDetective("b");
    store().moveDetective("c");
    store().moveGanove("e");
    store().setGanoveCanAct(true); // mission hook: action available on e
    store().moveDetective("c");
    store().moveDetective("d");

    const s = store();
    expect(s.phase).toBe("ganove");
    expect(s.outcome).toBeNull();
    // And the action round is executable instead of a move.
    store().ganoveAction();
    expect(store().ganovePosition).toBe("e");
    expect(store().phase).toBe("detektive");
  });
});

describe("escaped (Flucht)", () => {
  beforeEach(reset);

  it("ends the game when the ganove reaches a free escape node (ganove's win)", () => {
    // mission "none": every flucht-category node is an escape point.
    store().startGame(map, 1, {
      detectivePositions: ["i", "j"],
      ganovePosition: "a",
      mission: "none",
    });
    store().moveGanove("b"); // b carries the flucht category
    const s = store();
    expect(s.outcome).toBe("escaped");
    expect(s.log.at(-1)).toMatchObject({
      type: "result",
      details: { outcome: "escaped", rounds: 1 },
    });
    expect(reasonOf(() => store().moveDetective("h"))).toBe("game_over");
  });

  it("treats an occupied escape node as an illegal target, not as escape", () => {
    store().startGame(map, 1, { detectivePositions: ["a", "i"], ganovePosition: "d" });
    store().moveGanove("c");
    store().moveDetective("b"); // D1 occupies the escape node b
    store().moveDetective("h");
    expect(reasonOf(() => store().moveGanove("b"))).toBe("occupied");
    expect(store().outcome).toBeNull();
  });
});

describe("timeout (Zeitlimit)", () => {
  beforeEach(reset);

  it("ends the game for the detectives once the round limit is spent", () => {
    startTiny(2);
    tinyRound("c", "b"); // round 1
    expect(store().round).toBe(2);
    tinyRound("d", "a"); // round 2 — limit reached
    const s = store();
    expect(s.outcome).toBe("timeout");
    expect(s.round).toBe(2);
    expect(s.log.at(-1)).toMatchObject({
      type: "result",
      details: { outcome: "timeout", rounds: 2 },
    });
  });

  it("never ends the game on time with roundLimit null (unlimited)", () => {
    startTiny(null);
    for (let round = 0; round < 8; round += 1) {
      const even = round % 2 === 0;
      tinyRound(even ? "c" : "d", even ? "b" : "a");
    }
    const s = store();
    expect(s.outcome).toBeNull();
    expect(s.round).toBe(9);
  });
});

describe("draw (Remis)", () => {
  beforeEach(reset);

  it("aborts a running game as draw and logs the result", () => {
    store().startGame(map, 1, { detectivePositions: ["a", "i"], ganovePosition: "d" });
    store().moveGanove("c");
    store().abortAsDraw();
    const s = store();
    expect(s.outcome).toBe("draw");
    expect(s.log.at(-1)).toMatchObject({
      type: "result",
      details: { outcome: "draw", rounds: 1 },
    });
    expect(reasonOf(() => store().abortAsDraw())).toBe("game_over");
  });

  it("rejects aborting without a running game", () => {
    expect(reasonOf(() => store().abortAsDraw())).toBe("no_game");
  });
});
