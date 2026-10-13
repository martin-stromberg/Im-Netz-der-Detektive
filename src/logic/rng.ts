/**
 * Central seeded RNG (mulberry32). It is the single source of randomness
 * for every engine module — `Math.random()` is forbidden in src/logic/
 * (enforced by the no-math-random git hook) so replays and AI-vs-AI
 * simulations stay deterministic: the same seed produces the same
 * sequence everywhere.
 */
export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [minInclusive, maxExclusive). */
  nextInt(minInclusive: number, maxExclusive: number): number;
  /** Deterministically chosen element of `items`. */
  pick<T>(items: readonly T[]): T;
  /** New array with the same elements in a deterministic permutation. */
  shuffle<T>(items: readonly T[]): T[];
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const nextInt = (minInclusive: number, maxExclusive: number): number => {
    if (maxExclusive <= minInclusive) {
      throw new RangeError(
        `nextInt: maxExclusive (${maxExclusive}) must exceed minInclusive (${minInclusive})`,
      );
    }
    return minInclusive + Math.floor(next() * (maxExclusive - minInclusive));
  };

  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) {
      throw new RangeError("pick: cannot choose from an empty list");
    }
    return items[nextInt(0, items.length)];
  };

  const shuffle = <T>(items: readonly T[]): T[] => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = nextInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  return { next, nextInt, pick, shuffle };
}
