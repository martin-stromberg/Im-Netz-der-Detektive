import { describe, expect, it } from "vitest";
import { loadMap } from "./MapLoader";
import type { MapPack } from "./mapPack";
import { createRng } from "./rng";
import {
  assignSpawns,
  detectiveSpawnChoices,
  ganoveSpawnChoices,
  pickDetectiveSpawns,
  pickGanoveSpawn,
  SpawnError,
  spawnSequence,
} from "./SpawnSystem";

const map = loadMap("teststadt");
const allNodeIds = map.nodes.map((n) => n.id).sort();

function withSpawnRules(overrides: Partial<MapPack["spawnRules"]>): MapPack {
  return { ...map, spawnRules: { ...map.spawnRules, ...overrides } };
}

describe("spawnSequence", () => {
  it("places every detective before the ganove", () => {
    const sequence = spawnSequence(map, 4);
    expect(sequence).toEqual(["detective", "detective", "detective", "detective", "ganove"]);
  });

  it("defaults to the map's suggested detective count", () => {
    const sequence = spawnSequence(map);
    expect(sequence).toHaveLength(map.settings.detectiveCount.suggested + 1);
    expect(sequence.at(-1)).toBe("ganove");
  });
});

describe("detectiveSpawnChoices", () => {
  it("returns the allowed node list for mode choice", () => {
    expect(detectiveSpawnChoices(map).sort()).toEqual(["a", "i", "j"]);
  });

  it("resolves zones to their nodes for mode choice", () => {
    const zoned = withSpawnRules({ detectives: { mode: "choice", zones: ["sued"] } });
    expect(detectiveSpawnChoices(zoned).sort()).toEqual(["e", "j"]);
  });

  it("combines nodes and zones without duplicates for mode choice", () => {
    const combined = withSpawnRules({
      detectives: { mode: "choice", nodes: ["j", "a"], zones: ["sued"] },
    });
    expect(detectiveSpawnChoices(combined).sort()).toEqual(["a", "e", "j"]);
  });

  it("returns all nodes for mode free", () => {
    const free = withSpawnRules({ detectives: { mode: "free" } });
    expect(detectiveSpawnChoices(free).sort()).toEqual(allNodeIds);
  });

  it("returns all nodes for mode random", () => {
    const random = withSpawnRules({ detectives: { mode: "random" } });
    expect(detectiveSpawnChoices(random).sort()).toEqual(allNodeIds);
  });
});

describe("ganoveSpawnChoices", () => {
  it("excludes nodes below minDistanceToDetective", () => {
    // dist(a): a=0, b=1, c=2, e=2 — all below 3 must be filtered out.
    const choices = ganoveSpawnChoices(map, ["a"]);
    expect(choices.sort()).toEqual(["d", "f", "g", "h", "i", "j"]);
    expect(choices).not.toContain("a");
    expect(choices).not.toContain("b");
    expect(choices).not.toContain("c");
    expect(choices).not.toContain("e");
  });

  it("enforces the distance to every placed detective", () => {
    const choices = ganoveSpawnChoices(map, ["a", "i"]);
    // dist(i): i=0, h=1, j=1, g=2, e=2 — those must be filtered out as well.
    for (const forbidden of ["a", "b", "c", "e", "g", "h", "i", "j"]) {
      expect(choices).not.toContain(forbidden);
    }
    expect(choices.sort()).toEqual(["d", "f"]);
  });

  it("filters the choice list by distance too", () => {
    const choice = withSpawnRules({
      ganove: { mode: "choice", nodes: ["a", "b", "g"], minDistanceToDetective: 3 },
    });
    expect(ganoveSpawnChoices(choice, ["a"])).toEqual(["g"]);
  });

  it("offers all nodes when no distance limit is set", () => {
    const noLimit = withSpawnRules({ ganove: { mode: "free" } });
    expect(ganoveSpawnChoices(noLimit, ["a"]).sort()).toEqual(allNodeIds);
  });

  it("returns an empty list when nothing satisfies the distance", () => {
    const strict = withSpawnRules({ ganove: { mode: "free", minDistanceToDetective: 99 } });
    expect(ganoveSpawnChoices(strict, ["a"])).toEqual([]);
  });
});

describe("pickDetectiveSpawns / pickGanoveSpawn", () => {
  it("draws detectives without replacement", () => {
    const rng = createRng(1);
    const positions = pickDetectiveSpawns(map, rng, 3);
    expect(new Set(positions).size).toBe(3);
    for (const pos of positions) {
      expect(detectiveSpawnChoices(map)).toContain(pos);
    }
  });

  it("refills the pool when count exceeds candidates", () => {
    const rng = createRng(1);
    const positions = pickDetectiveSpawns(map, rng, 5);
    expect(positions).toHaveLength(5);
    for (const pos of positions) {
      expect(detectiveSpawnChoices(map)).toContain(pos);
    }
  });

  it("throws SpawnError when no ganove candidate satisfies the distance", () => {
    const strict = withSpawnRules({ ganove: { mode: "free", minDistanceToDetective: 99 } });
    expect(() => pickGanoveSpawn(strict, createRng(1), ["a"])).toThrow(SpawnError);
  });
});

describe("assignSpawns", () => {
  it("produces identical assignments for the same seed", () => {
    const a = assignSpawns(map, createRng(123), 4);
    const b = assignSpawns(map, createRng(123), 4);
    expect(a).toEqual(b);
  });

  it("varies assignments across different seeds", () => {
    const results = new Set(
      [1, 2, 3, 4, 5].map((seed) => JSON.stringify(assignSpawns(map, createRng(seed), 4))),
    );
    expect(results.size).toBeGreaterThan(1);
  });

  it("respects minDistanceToDetective for every seed", () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const { detectivePositions, ganovePosition } = assignSpawns(map, createRng(seed), 4);
      expect(ganoveSpawnChoices(map, detectivePositions)).toContain(ganovePosition);
    }
  });

  it("assigns positions in random mode without explicit choice", () => {
    const random = withSpawnRules({
      detectives: { mode: "random" },
      ganove: { mode: "random", minDistanceToDetective: 1 },
    });
    const { detectivePositions, ganovePosition } = assignSpawns(random, createRng(7), 4);
    expect(detectivePositions).toHaveLength(4);
    for (const pos of detectivePositions) {
      expect(allNodeIds).toContain(pos);
    }
    expect(ganoveSpawnChoices(random, detectivePositions)).toContain(ganovePosition);
  });
});
