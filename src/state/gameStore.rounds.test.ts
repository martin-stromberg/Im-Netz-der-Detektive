import { beforeEach, describe, expect, it } from "vitest";
import { loadMap } from "../logic/MapLoader";
import { MoveError } from "../logic/Movement";
import { GameConfigError, useGameStore } from "./gameStore";

const map = loadMap("teststadt");
const luebeck = loadMap("luebeck");

function reset() {
  useGameStore.getState().resetGame();
}

function store() {
  return useGameStore.getState();
}

/** Scripted game: detectives on a/i, ganove on d (teststadt). */
function startStandard(seed = 1) {
  store().startGame(map, seed, { detectivePositions: ["a", "i"], ganovePosition: "d" });
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

describe("startGame roundLimit resolution", () => {
  beforeEach(reset);

  it("defaults to the map's suggested round limit", () => {
    startStandard();
    expect(store().roundLimit).toBe(30);
  });

  it("accepts an explicit limit inside the map corridor", () => {
    store().startGame(map, 1, {
      detectivePositions: ["a", "i"],
      ganovePosition: "d",
      roundLimit: 15,
    });
    expect(store().roundLimit).toBe(15);
  });

  it("accepts null on a map that allows unlimited", () => {
    store().startGame(map, 1, {
      detectivePositions: ["a", "i"],
      ganovePosition: "d",
      roundLimit: null,
    });
    expect(store().roundLimit).toBeNull();
  });

  it("rejects a limit below the map minimum", () => {
    expect(() => store().startGame(map, 1, { roundLimit: 10 })).toThrow(GameConfigError);
  });

  it("rejects a non-integer limit", () => {
    expect(() => store().startGame(map, 1, { roundLimit: 20.5 })).toThrow(GameConfigError);
  });

  it("rejects null and out-of-range values on a map without unlimited/max", () => {
    expect(() => store().startGame(luebeck, 1, { roundLimit: null })).toThrow(GameConfigError);
    expect(() => store().startGame(luebeck, 1, { roundLimit: 31 })).toThrow(GameConfigError);
  });
});

describe("startGame escape nodes and outcome fields", () => {
  beforeEach(reset);

  it("initialises outcome, escapeNodeIds and ganoveCanAct", () => {
    startStandard();
    const s = store();
    expect(s.outcome).toBeNull();
    expect(s.escapeNodeIds).toEqual(["b", "d", "g"]);
    expect(s.ganoveCanAct).toBe(false);
  });
});

describe("moveGanove", () => {
  beforeEach(reset);

  it("moves the ganove, logs the move and opens the detektive phase", () => {
    startStandard();
    store().moveGanove("c");
    const s = store();
    expect(s.ganovePosition).toBe("c");
    expect(s.phase).toBe("detektive");
    expect(s.activeDetectiveIndex).toBe(0);
    expect(s.log.at(-1)).toMatchObject({
      type: "move",
      round: 1,
      details: { actor: "ganove", from: "d", to: "c", edgeType: "weg" },
    });
  });

  it("logs fahrt edges with their type", () => {
    startStandard();
    // Keep "g" out of the escape list so the ganove may pass through it.
    store().setEscapeNodeIds(["a"]);
    store().moveGanove("g"); // d -> g (weg)
    store().moveDetective("b"); // D1 a -> b
    store().moveDetective("h"); // D2 i -> h
    store().moveGanove("f"); // g -> f (fahrt)
    expect(store().log.at(-1)).toMatchObject({
      type: "move",
      details: { actor: "ganove", from: "g", to: "f", edgeType: "fahrt" },
    });
  });

  it("rejects moves before a game started, in the wrong phase and after game over", () => {
    expect(reasonOf(() => store().moveGanove("c"))).toBe("no_game");
    startStandard();
    store().moveGanove("c");
    expect(reasonOf(() => store().moveGanove("d"))).toBe("wrong_phase");
    store().abortAsDraw();
    expect(reasonOf(() => store().moveGanove("d"))).toBe("game_over");
  });

  it("rejects staying, non-adjacent, blocked and occupied targets", () => {
    startStandard();
    expect(reasonOf(() => store().moveGanove("d"))).toBe("stay_forbidden");
    expect(reasonOf(() => store().moveGanove("h"))).toBe("not_adjacent");
    store().blockEdge("d", "g", 5);
    expect(reasonOf(() => store().moveGanove("g"))).toBe("blocked_edge");
    // Occupied: after the ganove moved to c, D1 sits on b — an illegal ganove target.
    store().setEscapeNodeIds([]); // keep "d" etc. out of the way for this rule check
    store().moveGanove("c");
    store().moveDetective("b"); // D1 a -> b
    store().moveDetective("h"); // D2 i -> h
    expect(reasonOf(() => store().moveGanove("b"))).toBe("occupied");
  });
});

describe("moveDetective fixed order and round completion", () => {
  beforeEach(reset);

  it("moves detectives D1->Dn, then completes the round", () => {
    startStandard();
    store().moveGanove("c");

    store().moveDetective("b"); // D1 a -> b
    expect(store().detektivePositions).toEqual(["b", "i"]);
    expect(store().activeDetectiveIndex).toBe(1);
    expect(store().phase).toBe("detektive");
    expect(store().round).toBe(1);

    store().moveDetective("h"); // D2 i -> h (last detective)
    const s = store();
    expect(s.detektivePositions).toEqual(["b", "h"]);
    expect(s.phase).toBe("ganove");
    expect(s.round).toBe(2);
    expect(s.activeDetectiveIndex).toBe(0);
  });

  it("lets two detectives share the same node", () => {
    store().startGame(map, 1, { detectivePositions: ["i", "j"], ganovePosition: "d" });
    store().moveGanove("c");
    store().moveDetective("h"); // D1 i -> h
    store().moveDetective("i"); // D2 j -> i
    // Round 2: D1 h -> i would share D2's node — sharing is legal.
    store().moveGanove("f");
    store().moveDetective("i");
    expect(store().detektivePositions).toEqual(["i", "i"]);
  });

  it("rejects detective moves outside the detektive phase", () => {
    startStandard();
    expect(reasonOf(() => store().moveDetective("b"))).toBe("wrong_phase");
  });
});

describe("getLegalMoves selectors", () => {
  beforeEach(reset);

  it("expose legal ganove and detective targets", () => {
    startStandard();
    expect(
      store()
        .getLegalGanoveMoves()
        .map((m) => m.nodeId)
        .sort(),
    ).toEqual(["c", "g"]);
    expect(store().getLegalDetectiveMoves()).toEqual([]); // ganove phase

    store().moveGanove("c");
    expect(
      store()
        .getLegalDetectiveMoves()
        .map((m) => m.nodeId),
    ).toEqual(["b"]);
    store().moveDetective("b");
    expect(
      store()
        .getLegalDetectiveMoves()
        .map((m) => m.nodeId)
        .sort(),
    ).toEqual(["h", "j"]);
  });

  it("returns empty lists when no game runs", () => {
    expect(store().getLegalGanoveMoves()).toEqual([]);
    expect(store().getLegalDetectiveMoves()).toEqual([]);
  });
});

describe("ganoveAction (Zugzwang exception hook)", () => {
  beforeEach(reset);

  it("rejects the action round while ganoveCanAct is false", () => {
    startStandard();
    expect(reasonOf(() => store().ganoveAction())).toBe("no_action_available");
  });

  it("lets the ganove stay, logs the action and opens the detektive phase", () => {
    startStandard();
    store().setGanoveCanAct(true);
    store().ganoveAction();
    const s = store();
    expect(s.ganovePosition).toBe("d");
    expect(s.phase).toBe("detektive");
    expect(s.activeDetectiveIndex).toBe(0);
    expect(s.log.at(-1)).toMatchObject({
      type: "action",
      details: { actor: "ganove", nodeId: "d" },
    });
  });

  it("is rejected in the wrong phase", () => {
    startStandard();
    store().setGanoveCanAct(true);
    store().moveGanove("c");
    expect(reasonOf(() => store().ganoveAction())).toBe("wrong_phase");
  });
});

describe("setEscapeNodeIds (mission hook)", () => {
  beforeEach(reset);

  it("overrides the escape targets and validates node ids", () => {
    startStandard();
    store().setEscapeNodeIds(["a"]);
    expect(store().escapeNodeIds).toEqual(["a"]);
    expect(() => store().setEscapeNodeIds(["nirgendwo"])).toThrow(GameConfigError);
  });
});
