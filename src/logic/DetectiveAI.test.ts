import { describe, expect, it } from "vitest";
import { chooseDetectiveMove, type DetectiveView } from "./DetectiveAI";
import type { GameEvent } from "./InformationSystem";
import { loadMap } from "./MapLoader";
import { legalDetectiveMoves, type MoveContext } from "./Movement";
import { buildGraph } from "./Graph";
import { createRng } from "./rng";

const teststadt = loadMap("teststadt");
const graph = buildGraph(teststadt);

const camera = (round: number, nodeId: string): GameEvent => ({
  kind: "camera",
  round,
  nodeId,
  visibleTo: "detectives",
});

function makeView(overrides: Partial<DetectiveView> = {}): DetectiveView {
  return {
    map: teststadt,
    round: 1,
    detectiveStarts: ["a"],
    detektivePositions: ["a"],
    blockedEdges: [],
    events: [],
    cameras: [],
    missionStructure: [],
    ...overrides,
  };
}

function legalMovesFor(view: DetectiveView, index: number) {
  const ctx: MoveContext = {
    graph,
    round: view.round,
    blockedEdges: view.blockedEdges,
    ganovePosition: "x", // irrelevant for legalDetectiveMoves
    detektivePositions: view.detektivePositions,
  };
  return legalDetectiveMoves(ctx, index);
}

describe("chooseDetectiveMove — Zugauswahl", () => {
  it("always returns a legal move", () => {
    const view = makeView();
    const moves = legalMovesFor(view, 0);
    const target = chooseDetectiveMove(view, 0, moves, createRng(1));
    expect(moves.map((m) => m.nodeId)).toContain(target);
  });

  it("throws on an empty legal move list", () => {
    expect(() => chooseDetectiveMove(makeView(), 0, [], createRng(1))).toThrow(RangeError);
  });

  it("converges on a singleton belief (camera pin)", () => {
    // Camera on c in round 1 → the ganove is certainly at c; the
    // detective at a must move a→b (dist to c shrinks from 2 to 1).
    const view = makeView({ events: [camera(1, "c")] });
    expect(chooseDetectiveMove(view, 0, legalMovesFor(view, 0), createRng(1))).toBe("b");
  });

  it("splits the squad over distinct belief regions (encirclement)", () => {
    // Belief {d,f,g} via hinweis; detectives at a (nearer to d-side) and
    // j (nearer to f-side). The second detective must cover the f/g
    // side, i.e. move j→e rather than j→i.
    const view = makeView({
      detectiveStarts: ["a", "j"],
      detektivePositions: ["a", "j"],
      events: [
        {
          kind: "hinweis",
          round: 1,
          zone: "x",
          nodeIds: ["d", "f", "g"],
          visibleTo: "detectives",
        },
      ],
    });
    // Seed 43 draws ≥ DETECTIVE_RANDOM_MOVE_CHANCE on the first roll —
    // the patrol branch stays off and the optimal coverage move shows.
    const move = chooseDetectiveMove(view, 1, legalMovesFor(view, 1), createRng(43));
    expect(move).toBe("e");
  });

  it("hunts on a fresh trail — the patrol roll is skipped outright", () => {
    // Seed 7 draws < DETECTIVE_RANDOM_MOVE_CHANCE and would patrol on a
    // cold trail; with a hint this fresh the squad commits to the
    // coverage-optimal move (detective j → e, splitting over the belief).
    const view = makeView({
      detectiveStarts: ["a", "j"],
      detektivePositions: ["a", "j"],
      events: [
        {
          kind: "hinweis",
          round: 1,
          zone: "x",
          nodeIds: ["d", "f", "g"],
          visibleTo: "detectives",
        },
      ],
    });
    expect(chooseDetectiveMove(view, 1, legalMovesFor(view, 1), createRng(7))).toBe("e");
  });

  it("patrols on a random draw below the calibrated chance on a cold trail", () => {
    // Same squad/belief as above but round 10 — the round-1 hint is way
    // past DETECTIVE_FRESH_TRAIL_ROUNDS, so the patrol roll happens;
    // seed 7 draws below the chance → legal patrol pick.
    const view = makeView({
      round: 10,
      detectiveStarts: ["a", "j"],
      detektivePositions: ["a", "j"],
      events: [
        {
          kind: "hinweis",
          round: 1,
          zone: "x",
          nodeIds: ["d", "f", "g"],
          visibleTo: "detectives",
        },
      ],
    });
    const moves = legalMovesFor(view, 1);
    const move = chooseDetectiveMove(view, 1, moves, createRng(7));
    expect(moves.map((m) => m.nodeId)).toContain(move);
  });

  it("falls back to the last hint area when the belief set is empty", () => {
    // Contradicting hints → empty belief; the AI must still move —
    // toward the most recent hint region.
    const view = makeView({
      events: [
        camera(1, "c"),
        { kind: "hinweis", round: 2, zone: "x", nodeIds: ["h"], visibleTo: "detectives" },
      ],
    });
    const moves = legalMovesFor(view, 0);
    const target = chooseDetectiveMove(view, 0, moves, createRng(1));
    expect(moves.map((m) => m.nodeId)).toContain(target);
  });
});

describe("DetectiveView — Informations-Trennung", () => {
  it("carries neither the ganove position nor mission target nodes", () => {
    const view = makeView({
      missionStructure: [
        { kind: "diebstahl", status: "aktuell" },
        { kind: "kontakt", status: "offen" },
        { kind: "flucht", status: "offen" },
      ],
    });
    expect("ganovePosition" in view).toBe(false);
    expect("mission" in view).toBe(false);
    // The structure view must not leak node ids (the map itself lists
    // them legitimately — only the mission structure is checked).
    const serialized = JSON.stringify(view.missionStructure);
    for (const node of teststadt.nodes) {
      expect(serialized).not.toContain(`"${node.id}"`);
    }
  });
});
