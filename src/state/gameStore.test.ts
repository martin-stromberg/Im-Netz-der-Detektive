import { beforeEach, describe, expect, it } from "vitest";
import { useGameStore } from "./gameStore";

describe("useGameStore", () => {
  beforeEach(() => {
    useGameStore.setState({ round: 1 });
  });

  it("starts at round 1", () => {
    expect(useGameStore.getState().round).toBe(1);
  });

  it("advances the round via the headless store action", () => {
    useGameStore.getState().advanceRound();
    expect(useGameStore.getState().round).toBe(2);
  });
});
