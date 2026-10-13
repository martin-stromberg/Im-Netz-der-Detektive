import { describe, expect, it } from "vitest";
import { advanceRound } from "./placeholder";

describe("advanceRound", () => {
  it("increments the round number by one", () => {
    expect(advanceRound(1)).toBe(2);
  });

  it("advances from the initial round 0 to round 1", () => {
    expect(advanceRound(0)).toBe(1);
  });
});
