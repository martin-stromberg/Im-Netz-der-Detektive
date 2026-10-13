import { beforeEach, describe, expect, it } from "vitest";
import { loadMap } from "../logic/MapLoader";
import { SpawnError } from "../logic/SpawnSystem";
import { useGameStore } from "./gameStore";

const map = loadMap("teststadt");

function reset() {
  useGameStore.getState().resetGame();
}

describe("useGameStore headless", () => {
  beforeEach(reset);

  it("starts with the documented initial state", () => {
    const s = useGameStore.getState();
    expect(s.round).toBe(1);
    expect(s.phase).toBe("ganove");
    expect(s.activeDetectiveIndex).toBe(0);
    expect(s.map).toBeNull();
    expect(s.ganovePosition).toBeNull();
    expect(s.detektivePositions).toEqual([]);
    expect(s.mission).toBeNull();
    expect(s.events).toEqual([]);
    expect(s.cameras).toEqual([]);
    expect(s.blockedEdges).toEqual([]);
    expect(s.eventMode).toBe("tension");
    expect(s.tensionValue).toBe(0);
    expect(s.seed).toBe(0);
    expect(s.log).toEqual([]);
    expect(s.outcome).toBeNull();
    expect(s.roundLimit).toBeNull();
    expect(s.escapeNodeIds).toEqual([]);
    expect(s.ganoveCanAct).toBe(false);
  });
});

describe("startGame", () => {
  beforeEach(reset);

  it("initializes positions, seed, eventMode and the header log entry", () => {
    useGameStore.getState().startGame(map, 42);
    const s = useGameStore.getState();
    expect(s.map).toBe(map);
    expect(s.seed).toBe(42);
    expect(s.eventMode).toBe(map.settings.eventMode);
    expect(s.detektivePositions).toHaveLength(map.settings.detectiveCount.suggested);
    expect(s.ganovePosition).not.toBeNull();
    expect(s.round).toBe(1);
    expect(s.phase).toBe("ganove");
    expect(s.log).toHaveLength(1);
    expect(s.log[0]).toMatchObject({ seq: 1, round: 1, type: "header" });
  });

  it("produces identical starting positions for the same seed", () => {
    useGameStore.getState().startGame(map, 77);
    const first = {
      detektivePositions: [...useGameStore.getState().detektivePositions],
      ganovePosition: useGameStore.getState().ganovePosition,
    };
    reset();
    useGameStore.getState().startGame(map, 77);
    const s = useGameStore.getState();
    expect(s.detektivePositions).toEqual(first.detektivePositions);
    expect(s.ganovePosition).toBe(first.ganovePosition);
  });

  it("varies starting positions across different seeds", () => {
    const setups = new Set(
      [1, 2, 3, 4, 5].map((seed) => {
        reset();
        useGameStore.getState().startGame(map, seed);
        return JSON.stringify(useGameStore.getState().detektivePositions);
      }),
    );
    expect(setups.size).toBeGreaterThan(1);
  });

  it("accepts explicit valid positions", () => {
    useGameStore.getState().startGame(map, 1, {
      detectivePositions: ["a", "i"],
      ganovePosition: "d",
    });
    const s = useGameStore.getState();
    expect(s.detektivePositions).toEqual(["a", "i"]);
    expect(s.ganovePosition).toBe("d");
  });

  it("rejects a detective position outside the spawn choices", () => {
    expect(() => useGameStore.getState().startGame(map, 1, { detectivePositions: ["b"] })).toThrow(
      SpawnError,
    );
  });

  it("rejects a ganove position below minDistanceToDetective", () => {
    // dist(i, h) = 1 < 3.
    expect(() =>
      useGameStore.getState().startGame(map, 1, {
        detectivePositions: ["i"],
        ganovePosition: "h",
      }),
    ).toThrow(SpawnError);
  });
});

describe("phase machine and actions", () => {
  beforeEach(reset);

  it("walks ganove phase -> detektive phase -> next round", () => {
    const s = useGameStore.getState();
    s.startGame(map, 5, { detectivePositions: ["a", "i", "j", "a"], ganovePosition: "d" });

    useGameStore.getState().endGanovePhase();
    expect(useGameStore.getState().phase).toBe("detektive");
    expect(useGameStore.getState().activeDetectiveIndex).toBe(0);

    useGameStore.getState().advanceDetective();
    useGameStore.getState().advanceDetective();
    expect(useGameStore.getState().activeDetectiveIndex).toBe(2);

    useGameStore.getState().endDetectivePhase();
    expect(useGameStore.getState().phase).toBe("ganove");
    expect(useGameStore.getState().round).toBe(2);
    expect(useGameStore.getState().activeDetectiveIndex).toBe(0);
  });

  it("ignores phase transitions that do not match the current phase", () => {
    useGameStore.getState().advanceDetective();
    expect(useGameStore.getState().activeDetectiveIndex).toBe(0);
    useGameStore.getState().endDetectivePhase();
    expect(useGameStore.getState().round).toBe(1);
  });

  it("appends log entries with increasing seq", () => {
    useGameStore.getState().appendLog({ round: 1, type: "move" });
    useGameStore.getState().appendLog({ round: 1, type: "hint" });
    const log = useGameStore.getState().log;
    expect(log.map((e) => e.seq)).toEqual([1, 2]);
    expect(log[1].type).toBe("hint");
  });

  it("stores mission and event entries imperatively", () => {
    const s = useGameStore.getState();
    s.setMission({ id: "m1", targetNodes: ["c", "e"], currentStepIndex: 0 });
    s.addEvent({ kind: "camera", round: 2, nodeId: "f", visibleTo: "detectives" });

    const state = useGameStore.getState();
    expect(state.mission?.id).toBe("m1");
    expect(state.events[0]).toMatchObject({ kind: "camera", nodeId: "f" });
  });

  it("stores cameras, tension and event mode imperatively", () => {
    const s = useGameStore.getState();
    s.setCameras(["f", "d"]);
    s.setTension(30);
    s.setEventMode("cycle");

    const state = useGameStore.getState();
    expect(state.cameras).toEqual([
      { nodeId: "f", active: true },
      { nodeId: "d", active: true },
    ]);
    expect(state.tensionValue).toBe(30);
    expect(state.eventMode).toBe("cycle");
  });

  it("blocks edges and drops them once their round has passed", () => {
    useGameStore.getState().blockEdge("a", "b", 2);
    useGameStore.getState().blockEdge("c", "d", 1);
    expect(useGameStore.getState().blockedEdges).toHaveLength(2);

    useGameStore.getState().unblockExpiredEdges();
    expect(useGameStore.getState().blockedEdges).toHaveLength(2);

    // Round 2: the edge blocked until round 1 expires.
    useGameStore.getState().endGanovePhase();
    useGameStore.getState().endDetectivePhase();
    useGameStore.getState().unblockExpiredEdges();
    const remaining = useGameStore.getState().blockedEdges;
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toMatchObject({ a: "a", b: "b", untilRound: 2 });
  });

  it("resets to the initial state", () => {
    useGameStore.getState().startGame(map, 9);
    useGameStore.getState().resetGame();
    const s = useGameStore.getState();
    expect(s.map).toBeNull();
    expect(s.detektivePositions).toEqual([]);
    expect(s.log).toEqual([]);
  });
});
