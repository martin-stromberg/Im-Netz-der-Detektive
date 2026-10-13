import { describe, expect, it } from "vitest";
import { deducePossiblePositions, lastHintAnchor, type DeductionInput } from "./Deduction";
import type { Camera, GameEvent } from "./InformationSystem";
import { loadMap } from "./MapLoader";
import { ganoveSpawnChoices } from "./SpawnSystem";
import { useGameStore } from "../state/gameStore";
import { visibleCameras, visibleEvents } from "./InformationSystem";

const teststadt = loadMap("teststadt");

// teststadt graph: a-b, b-c, c-d, b-e, e-f, c-f, f-g, d-g, g-h, e-h,
// h-i, i-j, e-j. Detectives at "a" → ganove prior = dist(a) ≥ 3:
// {d, f, g, h, i, j}.

const baseInput: DeductionInput = {
  map: teststadt,
  detectiveStarts: ["a"],
  events: [],
  cameras: [],
  round: 0,
};

const camera = (round: number, nodeId: string): GameEvent => ({
  kind: "camera",
  round,
  nodeId,
  visibleTo: "detectives",
});
const sichtbarkeit = (round: number, nodeId: string): GameEvent => ({
  kind: "sichtbarkeit",
  round,
  nodeId,
  visibleTo: "detectives",
});
const hinweis = (round: number, nodeIds: string[]): GameEvent => ({
  kind: "hinweis",
  round,
  zone: "x",
  nodeIds,
  visibleTo: "detectives",
});
const aktion = (round: number, nodeId: string): GameEvent => ({
  kind: "aktion",
  round,
  nodeId,
  visibleTo: "detectives",
});
const umwelt = (round: number, a: string, b: string, untilRound: number): GameEvent => ({
  kind: "umwelt",
  round,
  edge: { a, b },
  untilRound,
  visibleTo: "both",
});

describe("deducePossiblePositions — Prior und Übergang", () => {
  it("round 0 yields the public spawn candidates", () => {
    expect(deducePossiblePositions({ ...baseInput, round: 0 }).sort()).toEqual(
      ganoveSpawnChoices(teststadt, ["a"]).sort(),
    );
  });

  it("a round without hints expands by exactly one edge (forced move)", () => {
    // Neighbours of {d,f,g,h,i,j}: c,d,e,f,g,h,i,j — a and b unreachable.
    expect(deducePossiblePositions({ ...baseInput, round: 1 })).toEqual([
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
    ]);
  });

  it("staying put is impossible without an aktion trace", () => {
    const events = [camera(1, "c")];
    // After the camera pinned c in round 1, round 2 must be a neighbour.
    const result = deducePossiblePositions({ ...baseInput, round: 2, events });
    expect(result).toEqual(["b", "d", "f"]);
    expect(result).not.toContain("c");
  });
});

describe("deducePossiblePositions — Hinweis-Constraints", () => {
  it("a camera hint pins the node and bounds later rounds by reachability", () => {
    const events = [camera(1, "c")];
    expect(deducePossiblePositions({ ...baseInput, round: 1, events })).toEqual(["c"]);
    // Round 2: only neighbours of c remain consistent — the round-1 hint
    // restricts round 2 through the maximum range.
    expect(deducePossiblePositions({ ...baseInput, round: 2, events })).toEqual(["b", "d", "f"]);
    // Round 3: two edges from c — {a,c,e,g} (b→a/c/e, d→g, f→e/g; d
    // itself drops out, reachable only via the now-excluded stay).
    expect(deducePossiblePositions({ ...baseInput, round: 3, events })).toEqual([
      "a",
      "c",
      "e",
      "g",
    ]);
  });

  it("sichtbarkeit reveals the live position exactly", () => {
    const events = [sichtbarkeit(2, "f")];
    expect(deducePossiblePositions({ ...baseInput, round: 2, events })).toEqual(["f"]);
  });

  it("a hinweis zone ball intersects the reachable set", () => {
    const events = [hinweis(1, ["d", "f"])];
    expect(deducePossiblePositions({ ...baseInput, round: 1, events })).toEqual(["d", "f"]);
  });

  it("aktion pins the stay on the action node", () => {
    // Round 1 hinweis narrows to {c,d}; the aktion on d in round 2 says
    // the ganove stayed — position must be d in both rounds.
    const events = [hinweis(1, ["c", "d"]), aktion(2, "d")];
    expect(deducePossiblePositions({ ...baseInput, round: 2, events })).toEqual(["d"]);
    // Round 3: forced move again.
    expect(deducePossiblePositions({ ...baseInput, round: 3, events })).toEqual(["c", "g"]);
  });

  it("an aktion on a node outside the predecessor set is inconsistent", () => {
    // Camera pinned c in round 1 — an aktion at d in round 2 contradicts
    // the trace (aktion means staying), so no consistent history exists.
    const events = [camera(1, "c"), aktion(2, "d")];
    expect(deducePossiblePositions({ ...baseInput, round: 2, events })).toEqual([]);
  });
});

describe("deducePossiblePositions — Sperrungen und Belegung", () => {
  it("umwelt blocks constrain transitions of the affected rounds", () => {
    const events = [camera(1, "c"), umwelt(1, "c", "d", 3)];
    // c→d is blocked in round 2 — reachable set of c drops d.
    expect(deducePossiblePositions({ ...baseInput, round: 2, events })).toEqual(["b", "f"]);
  });

  it("a block created in the same round does not affect its own transition", () => {
    const events = [camera(1, "c"), umwelt(2, "c", "d", 4)];
    // The block appeared after the ganove's round-2 move (umwelt fires
    // after moving) — d stays reachable in round 2, blocked from round 3.
    expect(deducePossiblePositions({ ...baseInput, round: 2, events })).toEqual(["b", "d", "f"]);
    // Round 3: the block applies — c↔d is impassable, so from {b,d,f}
    // only {a,c,e,g} remain reachable (d can't return to c).
    expect(deducePossiblePositions({ ...baseInput, round: 3, events })).toEqual([
      "a",
      "c",
      "e",
      "g",
    ]);
  });

  it("excludes nodes the detectives currently occupy", () => {
    const result = deducePossiblePositions({
      ...baseInput,
      round: 1,
      detectivePositions: ["f"],
    });
    expect(result).not.toContain("f");
    expect(result).toEqual(["c", "d", "e", "g", "h", "i", "j"]);
  });
});

describe("deducePossiblePositions — Negativ-Schluss Kameras", () => {
  const cams: Camera[] = [
    { nodeId: "c", active: true },
    { nodeId: "d", active: true },
    { nodeId: "f", active: false },
  ];

  it("a move round without a camera hint excludes active camera nodes", () => {
    const result = deducePossiblePositions({ ...baseInput, round: 1, cameras: cams });
    expect(result).not.toContain("c");
    expect(result).not.toContain("d");
    // The deactivated camera is not excluded.
    expect(result).toContain("f");
  });

  it("an aktion round disables the negative inference", () => {
    // An aktion on the camera node d in round 1 means the ganove stayed
    // there — a stay never refires a camera, so d stays consistent even
    // though an active camera sits on it.
    const events = [aktion(1, "d")];
    expect(deducePossiblePositions({ ...baseInput, round: 1, events, cameras: cams })).toEqual([
      "d",
    ]);
  });

  it("a move onto an active camera without a camera hint is inconsistent", () => {
    // hinweis pins to d in round 1 — but d carries an active camera, so
    // the absence of a camera hint rules it out entirely.
    const events = [hinweis(1, ["d"])];
    expect(deducePossiblePositions({ ...baseInput, round: 1, events, cameras: cams })).toEqual([]);
  });
});

describe("deducePossiblePositions — Monotonie und Sichtbarkeit", () => {
  it("adding a hint can only shrink the belief set", () => {
    const eventsWithout = [hinweis(1, ["c", "d", "f", "g"])];
    const eventsWith = [...eventsWithout, hinweis(2, ["c", "d"])];
    const before = deducePossiblePositions({ ...baseInput, round: 2, events: eventsWithout });
    const after = deducePossiblePositions({ ...baseInput, round: 2, events: eventsWith });
    expect(after.length).toBeLessThan(before.length);
    for (const node of after) {
      expect(before).toContain(node);
    }
  });

  it("ganove-only events never constrain the deduction", () => {
    const spy: GameEvent = {
      kind: "polizeifunk",
      round: 1,
      nodeId: "zzz",
      visibleTo: "ganove",
    };
    const clean = deducePossiblePositions({ ...baseInput, round: 1 });
    expect(deducePossiblePositions({ ...baseInput, round: 1, events: [spy] })).toEqual(clean);
  });
});

describe("lastHintAnchor", () => {
  it("returns the latest positional event", () => {
    const events = [camera(1, "c"), hinweis(3, ["d", "f"]), sichtbarkeit(2, "g")];
    expect(lastHintAnchor(events)?.nodeIds).toEqual(["d", "f"]);
  });

  it("returns null without positional hints", () => {
    expect(lastHintAnchor([umwelt(1, "a", "b", 3)])).toBeNull();
    expect(lastHintAnchor([])).toBeNull();
  });
});

describe("deducePossiblePositions — Integration über den Store", () => {
  it("contains the actual ganove position in a scripted game", () => {
    const store = useGameStore;
    store.getState().resetGame();
    store.getState().startGame(teststadt, 7, {
      detectivePositions: ["a"],
      ganovePosition: "d",
      mission: "none",
      cameraCount: 0,
    });
    const starts = [...store.getState().detektivePositions];
    // Scripted path avoiding the `flucht` nodes {b, d, g}: without a
    // mission every escape node would end the game on entry.
    const ganovePath = ["c", "f", "e"];
    for (const target of ganovePath) {
      store.getState().moveGanove(target);
      const state = store.getState();
      const belief = deducePossiblePositions({
        map: teststadt,
        detectiveStarts: starts,
        events: visibleEvents(state.events, "detectives"),
        cameras: visibleCameras(state.cameras, "detectives"),
        round: state.round,
        detectivePositions: state.detektivePositions,
      });
      expect(belief).toContain(state.ganovePosition as string);
      // The detective moves without landing on the ganove's node, so
      // the scripted game keeps running.
      const detMove = store
        .getState()
        .getLegalDetectiveMoves()
        .find((move) => move.nodeId !== state.ganovePosition);
      if (detMove === undefined) {
        break;
      }
      store.getState().moveDetective(detMove.nodeId);
    }
  });
});
