/**
 * Content-level checks for the shipped map packages. Schema correctness
 * is already enforced by `loadMap`/`validateMapPack`; these tests assert
 * the structural metrics and the mission-generation feasibility that the
 * packages promise (see docs/konzept/content/01-spielkonzept.md §2/§5.2,
 * 04-balancing.md).
 */
import { describe, expect, it } from "vitest";
import { listMapIds, loadMap } from "./MapLoader";
import { bfsDistances, buildGraph, distance, type Graph } from "./Graph";
import { NODE_CATEGORIES, type MapPack, type NodeCategory } from "./mapPack";
import { detectiveSpawnChoices, ganoveSpawnChoices } from "./SpawnSystem";

const muenster = loadMap("muenster");
const luebeck = loadMap("luebeck");

function nodesOf(map: MapPack, category: NodeCategory): string[] {
  return map.nodes.filter((n) => n.categories.includes(category)).map((n) => n.id);
}

function isConnected(graph: Graph, map: MapPack): boolean {
  const reached = bfsDistances(graph, map.nodes[0].id);
  return map.nodes.every((n) => reached.has(n.id));
}

function averageDegree(graph: Graph): number {
  let sum = 0;
  for (const neighbours of graph.adjacency.values()) {
    sum += neighbours.length;
  }
  return sum / graph.adjacency.size;
}

describe("shipped map packages", () => {
  it("loads complete MapPack objects for muenster and luebeck", () => {
    expect(listMapIds()).toEqual(expect.arrayContaining(["muenster", "luebeck"]));
    for (const [map, id] of [
      [muenster, "muenster"],
      [luebeck, "luebeck"],
    ] as const) {
      expect(map.id).toBe(id);
      expect(map.name.length).toBeGreaterThan(0);
      expect(map.viewBox).toMatch(/^\d+ \d+ \d+ \d+$/);
      expect(map.nodes.length).toBeGreaterThan(0);
      expect(map.edges.length).toBeGreaterThan(0);
      expect(map.spawnRules.order).toBe("detektive_first");
    }
  });

  it("ships different settings profiles per map (no hardcoded values)", () => {
    // Luebeck is the deliberately unbalanced validation map: its profile
    // must differ structurally from the Muenster defaults.
    expect(luebeck.nodes.length).toBeLessThan(muenster.nodes.length / 2);
    expect(luebeck.settings.eventMode).not.toBe(muenster.settings.eventMode);
    expect(luebeck.spawnRules.ganove.minDistanceToDetective).not.toBe(
      muenster.spawnRules.ganove.minDistanceToDetective,
    );
  });
});

describe("muenster structural metrics", () => {
  const graph = buildGraph(muenster);

  it("has 45-60 nodes and ~90-110 edges", () => {
    expect(muenster.nodes.length).toBeGreaterThanOrEqual(45);
    expect(muenster.nodes.length).toBeLessThanOrEqual(60);
    expect(muenster.edges.length).toBeGreaterThanOrEqual(90);
    expect(muenster.edges.length).toBeLessThanOrEqual(110);
  });

  it("has an average node degree between 3 and 4", () => {
    const avg = averageDegree(graph);
    expect(avg).toBeGreaterThanOrEqual(3);
    expect(avg).toBeLessThanOrEqual(4);
  });

  it("is connected", () => {
    expect(isConnected(graph, muenster)).toBe(true);
  });

  it("has multiple candidate nodes for every mission category", () => {
    for (const category of NODE_CATEGORIES) {
      expect(nodesOf(muenster, category).length).toBeGreaterThanOrEqual(4);
    }
  });

  it("uses both edge types, with fahrt as the rare one", () => {
    const weg = muenster.edges.filter((e) => e.type === "weg").length;
    const fahrt = muenster.edges.filter((e) => e.type === "fahrt").length;
    expect(weg).toBeGreaterThan(0);
    expect(fahrt).toBeGreaterThanOrEqual(1);
    expect(fahrt).toBeLessThanOrEqual(Math.ceil(muenster.edges.length * 0.1));
  });

  it("carries the Muenster balancing defaults", () => {
    const s = muenster.settings;
    expect(s.detectiveCount).toEqual({ suggested: 4, min: 2, max: 6 });
    expect(s.cameraCount).toEqual({ suggested: 8, min: 0, max: 15 });
    expect(s.roundLimit).toEqual({ suggested: 30, min: 15, unlimited: true });
    expect(s.radioHintCount).toEqual({ suggested: 5, min: 3, max: 10 });
    expect(s.edgeBlockRounds).toEqual({ suggested: 3, min: 1, max: 6 });
    expect(s.cameraMinGap).toBe(2);
    expect(s.hintZoneRadius).toBe(2);
    expect(s.eventMode).toBe("tension");
    expect(s.eventDefaults).toEqual({ cycle: 4, chance: 0.25, threshold: 40, perRound: 10 });
    expect(s.eventMix).toEqual({ sichtbarkeit: 0.25, hinweis: 0.45, umwelt: 0.3 });
    expect(s.missionRules).toEqual({
      minGap: 3,
      maxGap: 8,
      routeBudget: 18,
      routeBudgetSabotage: 22,
      sabotageDetour: 4,
    });
    expect([...s.sabotageEffects].sort()).toEqual(
      ["falsche_spur", "funkstille", "kamera_aus"].sort(),
    );
    expect(muenster.spawnRules.ganove.mode).toBe("free");
    expect(muenster.spawnRules.ganove.minDistanceToDetective).toBe(3);
  });
});

describe("settings format of both maps", () => {
  it.each([muenster, luebeck])("keeps range settings in {suggested, min, max} form ($id)", (map) => {
    for (const key of [
      "detectiveCount",
      "cameraCount",
      "roundLimit",
      "radioHintCount",
      "edgeBlockRounds",
    ] as const) {
      const range = map.settings[key];
      expect(range.suggested).toBeGreaterThanOrEqual(range.min);
      if (range.unlimited === true) {
        // unlimited replaces the upper bound
      } else {
        expect(range.max).toBeGreaterThanOrEqual(range.suggested);
      }
    }
    expect(typeof map.settings.cameraMinGap).toBe("number");
    expect(typeof map.settings.hintZoneRadius).toBe("number");
    const mix = map.settings.eventMix;
    expect(mix.sichtbarkeit + mix.hinweis + mix.umwelt).toBeCloseTo(1, 5);
  });
});

describe("muenster mission-generation feasibility", () => {
  const graph = buildGraph(muenster);
  const rules = muenster.settings.missionRules;
  const diebstahl = nodesOf(muenster, "diebstahl");
  const kontakt = nodesOf(muenster, "kontakt");
  const flucht = nodesOf(muenster, "flucht");
  const sabotage = nodesOf(muenster, "sabotage");
  // Ganove spawn candidates given detectives occupy their full choice list.
  const ganoveStarts = ganoveSpawnChoices(muenster, detectiveSpawnChoices(muenster));

  const dist = (a: string, b: string) => distance(graph, a, b);
  const shortestStartLeg = (target: string) =>
    Math.min(...ganoveStarts.map((s) => dist(s, target)));

  /** Candidate triples honouring distance rules (fixed order D -> K -> F). */
  const triples = diebstahl.flatMap((d) =>
    kontakt.flatMap((k) =>
      flucht.flatMap((f) => {
        const dk = dist(d, k);
        const kf = dist(k, f);
        const df = dist(d, f);
        const valid =
          dk >= rules.minGap &&
          dk <= rules.maxGap &&
          kf >= rules.minGap &&
          kf <= rules.maxGap &&
          df >= rules.minGap &&
          kf >= rules.minGap + 1; // Fluchtpunkt >= 4 vom Kontaktziel
        return valid ? [{ d, k, f, dk, kf }] : [];
      }),
    ),
  );

  it("offers ganove spawn candidates on the real map", () => {
    expect(ganoveStarts.length).toBeGreaterThan(0);
  });

  it("provides distance-compliant target triples", () => {
    expect(triples.length).toBeGreaterThan(0);
  });

  it("keeps at least one full route within the mission budget", () => {
    const affordable = triples.filter(
      ({ d, kf, dk }) => shortestStartLeg(d) + dk + kf + 3 <= rules.routeBudget,
    );
    expect(affordable.length).toBeGreaterThan(0);
  });

  it("keeps at least one sabotage detour within the sabotage budget", () => {
    const affordable = triples.filter(({ k, f, d, dk }) =>
      sabotage.some((s) => {
        const detourOk = dist(k, s) + dist(s, f) <= dist(k, f) + rules.sabotageDetour;
        const route = shortestStartLeg(d) + dk + dist(k, s) + dist(s, f) + 4;
        return detourOk && route <= rules.routeBudgetSabotage;
      }),
    );
    expect(affordable.length).toBeGreaterThan(0);
  });
});

describe("luebeck structural sanity", () => {
  const graph = buildGraph(luebeck);

  it("is a small but connected island map", () => {
    expect(luebeck.nodes.length).toBeLessThanOrEqual(25);
    expect(isConnected(graph, luebeck)).toBe(true);
  });

  it("covers every mission category", () => {
    for (const category of NODE_CATEGORIES) {
      expect(nodesOf(luebeck, category).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("still offers the ganove a legal spawn at suggested settings", () => {
    const placed = detectiveSpawnChoices(luebeck).slice(
      0,
      luebeck.settings.detectiveCount.suggested,
    );
    expect(placed).toHaveLength(luebeck.settings.detectiveCount.suggested);
    expect(ganoveSpawnChoices(luebeck, placed).length).toBeGreaterThan(0);
  });
});
