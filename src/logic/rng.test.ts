import { describe, expect, it } from "vitest";
import { createRng } from "./rng";

function sequence(rng: ReturnType<typeof createRng>, length: number): number[] {
  return Array.from({ length }, () => rng.next());
}

describe("createRng.next", () => {
  it("produces an identical sequence for the same seed", () => {
    const a = sequence(createRng(42), 20);
    const b = sequence(createRng(42), 20);
    expect(a).toEqual(b);
  });

  it("produces different sequences for different seeds", () => {
    const a = sequence(createRng(1), 20);
    const b = sequence(createRng(2), 20);
    expect(a).not.toEqual(b);
  });

  it("yields values in [0, 1)", () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i += 1) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("createRng.nextInt", () => {
  it("stays within [minInclusive, maxExclusive) and returns integers", () => {
    const rng = createRng(11);
    for (let i = 0; i < 1000; i += 1) {
      const v = rng.nextInt(3, 9);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThan(9);
    }
  });

  it("rejects an empty range", () => {
    const rng = createRng(11);
    expect(() => rng.nextInt(5, 5)).toThrow(RangeError);
  });
});

describe("createRng.pick", () => {
  it("returns an element of the list, deterministically per seed", () => {
    const items = ["a", "b", "c", "d"];
    const pickedA = createRng(99).pick(items);
    const pickedB = createRng(99).pick(items);
    expect(items).toContain(pickedA);
    expect(pickedA).toBe(pickedB);
  });

  it("rejects an empty list", () => {
    expect(() => createRng(1).pick([])).toThrow(RangeError);
  });
});

describe("createRng.shuffle", () => {
  it("returns a permutation of the input without mutating it", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const result = createRng(5).shuffle(input);
    expect(result).toHaveLength(input.length);
    expect([...result].sort()).toEqual([...input].sort());
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("is deterministic for the same seed", () => {
    const input = [1, 2, 3, 4, 5, 6];
    expect(createRng(5).shuffle(input)).toEqual(createRng(5).shuffle(input));
  });
});
