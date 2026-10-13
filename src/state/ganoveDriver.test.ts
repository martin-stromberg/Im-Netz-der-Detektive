import { afterEach, describe, expect, it } from "vitest";
import { loadMap } from "../logic/MapLoader";
import type { Mission } from "./gameStore";
import { useGameStore } from "./gameStore";
import { driveGanovePhase, installGanoveDriver } from "./ganoveDriver";

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

function pendingMission(): Mission {
  return {
    id: "custom",
    targets: { diebstahl: "c", kontakt: "e", flucht: "b", sabotage: "d" },
    stage: "wahl",
    pendingChoice: { sabotageNode: "d", effect: "funkstille" },
    offeredEffect: "funkstille",
    appliedEffect: null,
  };
}

afterEach(() => {
  useGameStore.getState().resetGame();
});

describe("driveGanovePhase", () => {
  it("is a no-op outside the ganove phase", () => {
    startQuietGame();
    useGameStore.getState().moveGanove("h");
    expect(useGameStore.getState().phase).toBe("detektive");
    const positions = [...useGameStore.getState().detektivePositions];
    driveGanovePhase();
    const state = useGameStore.getState();
    expect(state.phase).toBe("detektive");
    expect(state.detektivePositions).toEqual(positions);
    expect(state.ganovePosition).toBe("h");
  });

  it("plays one ganove turn and hands the phase back to the detectives", () => {
    startQuietGame();
    const before = useGameStore.getState().ganovePosition;
    driveGanovePhase();
    const state = useGameStore.getState();
    expect(state.phase).toBe("detektive");
    expect(state.ganovePosition).not.toBe(before);
    // The detective phase is untouched — a human plays it.
    expect(state.detektivePositions).toEqual(["a"]);
  });

  it("produces identical ganove moves for identical seeds", () => {
    const runs = [1, 2].map(() => {
      useGameStore.getState().resetGame();
      startQuietGame();
      driveGanovePhase();
      return useGameStore.getState().ganovePosition;
    });
    expect(runs[0]).toBe(runs[1]);
  });

  it("answers the informant's sabotage offer before moving on", () => {
    startQuietGame();
    useGameStore.getState().setMission(pendingMission());
    driveGanovePhase();
    const state = useGameStore.getState();
    expect(state.mission?.pendingChoice).toBeNull();
    expect(["sabotage", "flucht"]).toContain(state.mission?.stage);
    // The loop continues: the ganove's regular turn plays after the choice.
    expect(state.phase).toBe("detektive");
  });

  it("taps the police radio once under pressure", () => {
    startQuietGame();
    useGameStore.setState({ tensionValue: 100 });
    useGameStore.getState().addEvent({
      kind: "camera",
      round: 1,
      nodeId: "g",
      visibleTo: "detectives",
    });
    useGameStore.getState().addEvent({
      kind: "sichtbarkeit",
      round: 1,
      nodeId: "g",
      visibleTo: "detectives",
    });
    expect(useGameStore.getState().getHeatLevel().score).toBeGreaterThanOrEqual(3);
    driveGanovePhase();
    const state = useGameStore.getState();
    expect(state.radioUsed).toBe(true);
    // After the radio tap the same turn continues with a real move.
    expect(state.phase).toBe("detektive");
  });
});

describe("installGanoveDriver", () => {
  it("drives the ganove phase automatically when the phase flips over", () => {
    startQuietGame();
    const unsubscribe = installGanoveDriver();
    try {
      // The subscription fires synchronously on the next publish:
      // completing the detective phase hands the phase to the ganove and
      // the driver immediately plays its turn.
      useGameStore.getState().endGanovePhase();
      expect(useGameStore.getState().phase).toBe("detektive");
      useGameStore.getState().moveDetective("b");
      const state = useGameStore.getState();
      expect(state.phase).toBe("detektive");
      expect(state.round).toBe(2);
      expect(state.ganovePosition).not.toBe("g");
    } finally {
      unsubscribe();
    }
  });

  it("stops driving after unsubscribe", () => {
    startQuietGame();
    const unsubscribe = installGanoveDriver();
    unsubscribe();
    useGameStore.getState().endGanovePhase();
    useGameStore.getState().moveDetective("b");
    const state = useGameStore.getState();
    expect(state.phase).toBe("ganove");
    expect(state.ganovePosition).toBe("g");
  });

  it("does not drive when the game is already over", () => {
    startQuietGame();
    const unsubscribe = installGanoveDriver();
    try {
      useGameStore.getState().abortAsDraw();
      expect(useGameStore.getState().outcome).toBe("draw");
      expect(useGameStore.getState().ganovePosition).toBe("g");
    } finally {
      unsubscribe();
    }
  });
});
