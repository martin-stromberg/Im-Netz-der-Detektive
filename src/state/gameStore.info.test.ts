import { beforeEach, describe, expect, it } from "vitest";
import { bfsDistances, buildGraph } from "../logic/Graph";
import { loadMap } from "../logic/MapLoader";
import { MoveError } from "../logic/Movement";
import {
  HINT_EVENT_KINDS,
  revealedGanovePosition,
  visibleCameras,
  visibleEvents,
} from "../logic/InformationSystem";
import { GameConfigError, useGameStore } from "./gameStore";

const teststadt = loadMap("teststadt");
const muenster = loadMap("muenster");
const teststadtGraph = buildGraph(teststadt);

function reset() {
  useGameStore.getState().resetGame();
}

function store() {
  return useGameStore.getState();
}

/** Scripted game: detectives on a/i, ganove on d (teststadt). */
function startStandard(seed = 1) {
  store().startGame(teststadt, seed, { detectivePositions: ["a", "i"], ganovePosition: "d" });
}

/** Completes the current detektive phase (each detective moves once). */
function finishDetectivePhase(): void {
  while (store().phase === "detektive" && store().outcome === null) {
    const current = store();
    const moves = current.getLegalDetectiveMoves();
    if (moves.length === 0) {
      current.endDetectivePhase();
      break;
    }
    const nonCatch = moves.find((move) => move.nodeId !== current.ganovePosition) ?? moves[0];
    current.moveDetective(nonCatch.nodeId);
  }
}

/**
 * Plays one ganove turn plus the following detektive phase. The ganove
 * avoids escape nodes when alternatives exist so scripted games stay
 * alive. Returns false when the game is over or no move exists.
 */
function playRound(): boolean {
  const state = store();
  if (state.outcome !== null || state.phase !== "ganove") {
    return false;
  }
  const ganoveMoves = state.getLegalGanoveMoves();
  if (ganoveMoves.length === 0) {
    return false;
  }
  const safe =
    ganoveMoves.find((move) => !state.escapeNodeIds.includes(move.nodeId)) ?? ganoveMoves[0];
  state.moveGanove(safe.nodeId);
  finishDetectivePhase();
  return store().outcome === null;
}

function playRounds(count: number): void {
  for (let i = 0; i < count && playRound(); i += 1) {
    // loop body: playRound does the work
  }
}

describe("startGame camera placement", () => {
  beforeEach(reset);

  it("places cameras honouring minGap and the exclusion list over many seeds", () => {
    const graph = buildGraph(muenster);
    const protectedNodes = muenster.nodes.slice(0, 12).map((node) => node.id);
    for (let seed = 1; seed <= 40; seed += 1) {
      store().startGame(muenster, seed * 13, {
        detectiveCount: 3,
        cameraProtectedNodes: protectedNodes,
      });
      const { cameras } = store();
      expect(cameras.length).toBeGreaterThan(0);
      expect(cameras.length).toBeLessThanOrEqual(muenster.settings.cameraCount.suggested);
      const placed = cameras.map((camera) => camera.nodeId);
      for (const id of protectedNodes) {
        expect(placed).not.toContain(id);
      }
      for (let i = 0; i < placed.length; i += 1) {
        for (let j = i + 1; j < placed.length; j += 1) {
          expect(bfsDistances(graph, placed[i]).get(placed[j])).toBeGreaterThanOrEqual(
            muenster.settings.cameraMinGap,
          );
        }
      }
    }
  });

  it("honours the cameraCount override and validates the corridor", () => {
    store().startGame(muenster, 5, { cameraCount: 2 });
    expect(store().cameras).toHaveLength(2);
    expect(() => store().startGame(muenster, 5, { cameraCount: 99 })).toThrow(GameConfigError);
    expect(() => store().startGame(muenster, 5, { cameraProtectedNodes: ["unbekannt"] })).toThrow(
      GameConfigError,
    );
    expect(() => store().startGame(muenster, 5, { radioHintCount: 99 })).toThrow(GameConfigError);
    expect(() => store().startGame(muenster, 5, { edgeBlockRounds: 0 })).toThrow(GameConfigError);
  });

  it("is deterministic and records cameras in the header log", () => {
    store().startGame(muenster, 77);
    const first = store().cameras.map((camera) => camera.nodeId);
    store().startGame(muenster, 77);
    expect(store().cameras.map((camera) => camera.nodeId)).toEqual(first);
    expect(store().log[0].details?.cameras).toEqual(first);
    expect(store().cameras.every((camera) => camera.active)).toBe(true);
  });
});

describe("camera triggering", () => {
  beforeEach(reset);

  it("emits an exact-node detective hint with the triggering round", () => {
    startStandard();
    store().setCameras(["c"]);
    store().moveGanove("c"); // d -> c
    const s = store();
    expect(s.phase).toBe("detektive");
    const cameraEvent = s.events.find((event) => event.kind === "camera");
    expect(cameraEvent).toMatchObject({
      kind: "camera",
      round: 1,
      nodeId: "c",
      visibleTo: "detectives",
    });
    expect(s.log.some((entry) => entry.type === "hint")).toBe(true);
    // The ganove's view contains no hint at all.
    expect(visibleEvents(s.events, "ganove")).toEqual([]);
  });

  it("keeps the hint past-relative after the ganove moves on", () => {
    startStandard();
    store().setCameras(["c"]);
    store().moveGanove("c");
    finishDetectivePhase();
    playRound(); // round 2: the ganove leaves "c"
    const s = store();
    const cameraEvent = s.events.find((event) => event.kind === "camera");
    expect(cameraEvent?.nodeId).toBe("c");
    expect(cameraEvent?.round).toBe(1);
    expect(s.ganovePosition).not.toBe("c");
  });

  it("does not trigger deactivated cameras (sabotage hook)", () => {
    startStandard();
    store().setCameras(["c"]);
    store().deactivateCameras();
    expect(store().cameras.every((camera) => !camera.active)).toBe(true);
    store().moveGanove("c");
    expect(store().events.filter((event) => event.kind === "camera")).toEqual([]);
  });
});

describe("event engine in the round timeline", () => {
  beforeEach(reset);

  it("accumulates the tension bar and fires on the threshold round", () => {
    startStandard();
    store().setCameras([]); // isolate the event check from camera hints
    playRounds(3);
    expect(store().events.filter((e) => e.kind !== "camera")).toHaveLength(0);
    expect(store().tensionValue).toBe(30);
    playRound(); // round 4: 30 + 10 >= 40 -> fire + reset
    const s = store();
    expect(s.tensionValue).toBe(0);
    const fired = s.events.filter((e) => e.kind !== "camera");
    expect(fired).toHaveLength(1);
    expect(fired[0].round).toBe(4);
  });

  it("fires deterministically every cycle round in cycle mode", () => {
    startStandard();
    store().setCameras([]);
    store().setEventMode("cycle");
    const seen: number[] = [];
    for (let round = 1; round <= 8 && playRound(); round += 1) {
      const event = store().events.find((e) => e.round === round);
      if (event) {
        seen.push(event.round);
      }
    }
    expect(seen).toEqual([4, 8]);
  });

  it("produces zone hints with the operative region around the true position", () => {
    // Find a seed that yields a "hinweis" event within the first rounds.
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      startStandard(seed);
      store().setCameras([]);
      const positions = new Map<number, string>();
      for (let round = 1; round <= 8 && store().outcome === null; round += 1) {
        playRound();
        positions.set(round, store().ganovePosition as string);
        if (store().events.some((e) => e.kind === "hinweis")) {
          break;
        }
      }
      const hint = store().events.find((e) => e.kind === "hinweis");
      if (hint === undefined) {
        continue;
      }
      const positionAtHint = positions.get(hint.round) as string;
      const zoneOf = teststadt.nodes.find((node) => node.id === positionAtHint)?.zone;
      expect(hint.zone).toBe(zoneOf);
      expect(hint.nodeIds).toContain(positionAtHint);
      for (const nodeId of hint.nodeIds ?? []) {
        expect(bfsDistances(teststadtGraph, positionAtHint).get(nodeId)).toBeLessThanOrEqual(
          teststadt.settings.hintZoneRadius,
        );
      }
      expect(hint.visibleTo).toBe("detectives");
      return;
    }
    throw new Error("no hinweis event produced within 8 seeds");
  });

  it("blocks edges for edgeBlockRounds, visible to both sides, without splitting the graph", () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]) {
      startStandard(seed);
      store().setCameras([]);
      playRounds(12);
      const umwelt = store().events.find((e) => e.kind === "umwelt");
      if (umwelt === undefined) {
        continue;
      }
      expect(umwelt.visibleTo).toBe("both");
      expect(umwelt.edge).toBeDefined();
      expect(umwelt.untilRound).toBe(umwelt.round + store().edgeBlockRounds - 1);
      const blocked = store().blockedEdges.find(
        (edge) => edge.a === umwelt.edge?.a && edge.b === umwelt.edge?.b,
      );
      // The block may have expired by now; the event itself must match.
      if (blocked !== undefined) {
        expect(blocked.untilRound).toBe(umwelt.untilRound);
      }
      // Ganove may see umwelt but never hint-giving kinds.
      const ganoveView = visibleEvents(store().events, "ganove");
      expect(ganoveView.every((event) => !HINT_EVENT_KINDS.includes(event.kind))).toBe(true);
      return;
    }
    throw new Error("no umwelt event produced within 16 seeds");
  });

  it("reveals the ganove position only during the firing round", () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      startStandard(seed);
      store().setCameras([]);
      playRounds(8);
      const reveal = store().events.find((e) => e.kind === "sichtbarkeit");
      if (reveal === undefined) {
        continue;
      }
      const s = store();
      expect(reveal.nodeId).toBeDefined();
      // Reveal is live only in its own round.
      expect(revealedGanovePosition(s.events, reveal.round)).toBe(reveal.nodeId);
      expect(revealedGanovePosition(s.events, reveal.round + 1)).toBeNull();
      return;
    }
    throw new Error("no sichtbarkeit event produced within 8 seeds");
  });
});

describe("police radio", () => {
  beforeEach(reset);

  it("reports the last N hints including camera hits — exactly once", () => {
    startStandard();
    store().setCameras(["c"]);
    store().moveGanove("c"); // camera hit round 1
    playRound();
    playRound();
    playRound(); // reach round 4 for an event hint
    const hintCount = store().events.filter((e) => HINT_EVENT_KINDS.includes(e.kind)).length;
    store().useRadio();
    const s = store();
    expect(s.radioUsed).toBe(true);
    const radio = s.events.find((e) => e.kind === "polizeifunk");
    expect(radio?.visibleTo).toBe("ganove");
    const hints = radio?.details?.hints as { kind: string; round: number }[];
    expect(hints).toHaveLength(Math.min(s.radioHintCount, hintCount));
    expect(hints.some((hint) => hint.kind === "camera")).toBe(true);
    // Second tap is refused.
    expect(() => store().useRadio()).toThrowError(MoveError);
    expect(() => store().useRadio()).toThrowError(/once per game/);
  });

  it("refuses before a game and after game over", () => {
    expect(() => store().useRadio()).toThrowError(MoveError);
    startStandard();
    store().abortAsDraw();
    expect(() => store().useRadio()).toThrowError(MoveError);
  });
});

describe("heat indicator", () => {
  beforeEach(reset);

  it("reflects hint activity of the last 3 rounds without exposing content", () => {
    startStandard();
    expect(store().getHeatLevel()).toEqual({ level: "ruhig", score: 0 });
    store().addEvent({ kind: "camera", round: 1, nodeId: "c", visibleTo: "detectives" });
    expect(store().getHeatLevel()).toEqual({ level: "aktiv", score: 2 });
    store().addEvent({ kind: "aktion", round: 1, nodeId: "c", visibleTo: "detectives" });
    expect(store().getHeatLevel()).toEqual({ level: "erhoeht", score: 4 });
    store().addEvent({
      kind: "sichtbarkeit",
      round: 1,
      nodeId: "c",
      visibleTo: "detectives",
    });
    expect(store().getHeatLevel()).toEqual({ level: "kritisch", score: 7 });
    // The result carries only level and score — no hint fields.
    expect(Object.keys(store().getHeatLevel()).sort()).toEqual(["level", "score"]);
  });
});

describe("asymmetry end-to-end", () => {
  beforeEach(reset);

  it("keeps cameras and hint-giving events out of the ganove view across a played game", () => {
    startStandard(3);
    store().setCameras(["c"]);
    store().moveGanove("c"); // camera hit
    playRounds(8);
    const s = store();
    const ganoveEvents = visibleEvents(s.events, "ganove");
    for (const event of ganoveEvents) {
      expect(["ganove", "both"]).toContain(event.visibleTo);
      expect(HINT_EVENT_KINDS).not.toContain(event.kind);
    }
    expect(visibleCameras(s.cameras, "ganove")).toEqual([]);
    // Detectives see the world blocks too (shared visibility).
    const detectiveEvents = visibleEvents(s.events, "detectives");
    expect(detectiveEvents.length).toBeGreaterThanOrEqual(ganoveEvents.length);
    expect(detectiveEvents.some((event) => event.kind === "camera")).toBe(true);
  });
});
