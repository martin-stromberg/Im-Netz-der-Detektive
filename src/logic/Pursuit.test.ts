import { describe, expect, it } from "vitest";
import { pursuitLevel, pursuitStatus } from "./Pursuit";
import { loadMap } from "./MapLoader";

const teststadt = loadMap("teststadt");

describe("pursuitLevel — Druckstufen", () => {
  it("maps distances to the four tiers", () => {
    expect(pursuitLevel(0)).toBe("unmittelbar");
    expect(pursuitLevel(1)).toBe("unmittelbar");
    expect(pursuitLevel(2)).toBe("nah");
    expect(pursuitLevel(3)).toBe("spuerbar");
    expect(pursuitLevel(4)).toBe("ruhig");
    expect(pursuitLevel(9)).toBe("ruhig");
  });
});

describe("pursuitStatus — Naehe des naechsten Detektivs", () => {
  it("reports the nearest detective with BFS distance", () => {
    // a→i is 5 edges (a-b-e-h-i / a-b-c-…). Detectives at i and b.
    const status = pursuitStatus(teststadt, [], 1, "a", ["i", "b", "j"]);
    expect(status).not.toBeNull();
    expect(status?.nearestIndex).toBe(1);
    expect(status?.nearestNode).toBe("b");
    expect(status?.distance).toBe(1);
    expect(status?.level).toBe("unmittelbar");
  });

  it("prefers the lowest squad index on equal distance", () => {
    // e and c are both 2 edges from a; index 0 (e) wins over index 1 (c).
    const status = pursuitStatus(teststadt, [], 1, "a", ["e", "c"]);
    expect(status?.nearestIndex).toBe(0);
    expect(status?.nearestNode).toBe("e");
    expect(status?.distance).toBe(2);
    expect(status?.level).toBe("nah");
  });

  it("measures over edges still open in the round (umwelt blocks)", () => {
    // Edge a-b blocked in round 5: 'a' is otherwise unreachable → the
    // status reports an unreachable (ruhig) pressure, never crashes.
    const blocked = [{ a: "a", b: "b", untilRound: 7 }];
    const status = pursuitStatus(teststadt, blocked, 5, "a", ["b"]);
    expect(status?.distance).toBe(Infinity);
    expect(status?.level).toBe("ruhig");
  });

  it("returns null for an empty squad", () => {
    expect(pursuitStatus(teststadt, [], 1, "a", [])).toBeNull();
  });
});
