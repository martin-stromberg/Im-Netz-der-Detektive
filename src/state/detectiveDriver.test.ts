import { afterEach, describe, expect, it, vi } from "vitest";
import { loadMap } from "../logic/MapLoader";
import { ganoveSpawnChoices } from "../logic/SpawnSystem";
import { useGameStore } from "./gameStore";
import {
  detectiveStartsFromLog,
  driveDetectivePhase,
  installDetectiveDriver,
} from "./detectiveDriver";

const map = loadMap("teststadt");

function startQuietGame() {
  useGameStore.getState().startGame(map, 7, {
    detectivePositions: ["a"],
    ganovePosition: "g",
    mission: "none",
    cameraCount: 0,
    roundLimit: 20,
  });
}

afterEach(() => {
  useGameStore.getState().resetGame();
});

describe("detectiveStartsFromLog", () => {
  it("recovers the detective starting positions from the log header", () => {
    startQuietGame();
    expect(detectiveStartsFromLog(useGameStore.getState().log)).toEqual(["a"]);
  });

  it("falls back to current positions when no header exists", () => {
    useGameStore.setState({ detektivePositions: ["x", "y"] });
    expect(detectiveStartsFromLog([])).toEqual(["x", "y"]);
  });
});

describe("driveDetectivePhase", () => {
  it("is a no-op outside the detektive phase", () => {
    startQuietGame();
    driveDetectivePhase();
    const state = useGameStore.getState();
    expect(state.phase).toBe("ganove");
    expect(state.detektivePositions).toEqual(["a"]);
  });

  it("drives the whole squad deterministically and hands back to the ganove", () => {
    startQuietGame();
    const before = [...useGameStore.getState().detektivePositions];
    useGameStore.getState().moveGanove("h");
    expect(useGameStore.getState().phase).toBe("detektive");
    driveDetectivePhase();
    const state = useGameStore.getState();
    expect(["ganove"]).toContain(state.phase);
    expect(state.detektivePositions).not.toEqual(before);
    expect(state.round).toBe(2);
  });

  it("produces identical detective moves for identical games", () => {
    startQuietGame();
    useGameStore.getState().moveGanove("h");
    driveDetectivePhase();
    const first = [...useGameStore.getState().detektivePositions];

    useGameStore.getState().resetGame();
    startQuietGame();
    useGameStore.getState().moveGanove("h");
    driveDetectivePhase();
    expect(useGameStore.getState().detektivePositions).toEqual(first);
  });
});

describe("installDetectiveDriver", () => {
  it("runs the detective phase automatically on the phase transition", () => {
    startQuietGame();
    const unsubscribe = installDetectiveDriver();
    try {
      useGameStore.getState().moveGanove("h");
      const state = useGameStore.getState();
      // The subscription fired synchronously: detectives already moved.
      expect(state.phase).toBe("ganove");
      expect(state.round).toBe(2);
      expect(state.detektivePositions).not.toEqual(["a"]);
    } finally {
      unsubscribe();
    }
  });

  it("stops driving after unsubscribe", () => {
    startQuietGame();
    const unsubscribe = installDetectiveDriver();
    unsubscribe();
    useGameStore.getState().moveGanove("h");
    expect(useGameStore.getState().phase).toBe("detektive");
  });

  it("does not drive when the game is already over", () => {
    startQuietGame();
    const unsubscribe = installDetectiveDriver();
    try {
      useGameStore.getState().abortAsDraw();
      expect(useGameStore.getState().outcome).toBe("draw");
    } finally {
      unsubscribe();
    }
  });

  it("steps the squad one detective per delay tick", () => {
    vi.useFakeTimers();
    try {
      useGameStore.getState().startGame(map, 7, {
        detectivePositions: ["a", "i", "j"],
        ganovePosition: ganoveSpawnChoices(map, ["a", "i", "j"])[0],
        mission: "none",
        cameraCount: 0,
        roundLimit: 20,
      });
      const unsubscribe = installDetectiveDriver(100);
      try {
        const escape = new Set(useGameStore.getState().escapeNodeIds);
        const legal = useGameStore
          .getState()
          .getLegalGanoveMoves()
          .filter((move) => !escape.has(move.nodeId));
        useGameStore.getState().moveGanove(legal[0].nodeId);
        expect(useGameStore.getState().phase).toBe("detektive");
        // One move per tick: the squad advances visibly, not in a burst.
        vi.advanceTimersByTime(100);
        const afterFirst = useGameStore.getState();
        expect(afterFirst.phase).toBe("detektive");
        expect(afterFirst.detektivePositions[0]).not.toBe("a");
        vi.advanceTimersByTime(300);
        expect(useGameStore.getState().phase).toBe("ganove");
        expect(useGameStore.getState().round).toBe(2);
      } finally {
        unsubscribe();
      }
    } finally {
      vi.useRealTimers();
    }
  });
});
