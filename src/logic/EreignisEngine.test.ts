import { describe, expect, it } from "vitest";
import { bfsDistances, buildGraph, type Graph } from "./Graph";
import { loadMap } from "./MapLoader";
import type { MapEdge, MapPack } from "./mapPack";
import { createRng } from "./rng";
import {
  drawEventType,
  pickBlockableEdge,
  rollTrigger,
  zoneHint,
} from "./EreignisEngine";

const teststadt = loadMap("teststadt");
const muenster = loadMap("muenster");
const luebeck = loadMap("luebeck");

const defaults = teststadt.settings.eventDefaults; // {cycle:4, chance:0.25, threshold:40, perRound:10}

describe("rollTrigger", () => {
  it("cycle fires exactly every X rounds and leaves tension untouched", () => {
    const fired: number[] = [];
    const rng = createRng(1);
    for (let round = 1; round <= 16; round += 1) {
      const result = rollTrigger("cycle", round, 7, defaults, rng);
      expect(result.tensionValue).toBe(7);
      if (result.fires) {
        fired.push(round);
      }
    }
    expect(fired).toEqual([4, 8, 12, 16]);
  });

  it("chance fires statistically near the configured probability", () => {
    const rng = createRng(123);
    let fired = 0;
    const rounds = 4000;
    for (let round = 1; round <= rounds; round += 1) {
      if (rollTrigger("chance", round, 0, defaults, rng).fires) {
        fired += 1;
      }
    }
    const frequency = fired / rounds;
    expect(frequency).toBeGreaterThan(defaults.chance - 0.05);
    expect(frequency).toBeLessThan(defaults.chance + 0.05);
  });

  it("tension guarantees the cadence ceil(threshold/perRound) and resets", () => {
    let tension = 0;
    const fired: number[] = [];
    const rng = createRng(9);
    for (let round = 1; round <= 12; round += 1) {
      const result = rollTrigger("tension", round, tension, defaults, rng);
      if (result.fires) {
        fired.push(round);
      }
      tension = result.tensionValue;
    }
    // 40/10 => an event every 4th round, bar reset to 0 after firing.
    expect(fired).toEqual([4, 8, 12]);
    expect(tension).toBe(0);
  });
});

describe("drawEventType", () => {
  it("approaches the configured mix over many draws", () => {
    const mix = teststadt.settings.eventMix; // 0.25 / 0.45 / 0.30
    const counts = { sichtbarkeit: 0, hinweis: 0, umwelt: 0 };
    const rng = createRng(2024);
    const draws = 4000;
    for (let i = 0; i < draws; i += 1) {
      counts[drawEventType(mix, rng)] += 1;
    }
    expect(counts.sichtbarkeit / draws).toBeCloseTo(mix.sichtbarkeit, 1);
    expect(counts.hinweis / draws).toBeCloseTo(mix.hinweis, 1);
    expect(counts.umwelt / draws).toBeCloseTo(mix.umwelt, 1);
  });
});

describe("zoneHint", () => {
  it("names the zone of the ganove node and the BFS ball around it", () => {
    const graph = buildGraph(teststadt);
    const hint = zoneHint("a", teststadt, graph, teststadt.settings.hintZoneRadius);
    expect(hint).not.toBeNull();
    expect(hint?.zone).toBe("altstadt");
    // Radius 2 from "a": a(0), b(1), c(2), e(2).
    expect(hint?.nodeIds).toEqual(["a", "b", "c", "e"]);
  });

  it("always contains the ganove's actual position", () => {
    const graph = buildGraph(muenster);
    for (const node of muenster.nodes) {
      const hint = zoneHint(node.id, muenster, graph, muenster.settings.hintZoneRadius);
      expect(hint?.zone).toBe(node.zone);
      expect(hint?.nodeIds).toContain(node.id);
      for (const id of hint?.nodeIds ?? []) {
        expect(bfsDistances(graph, node.id).get(id)).toBeLessThanOrEqual(
          muenster.settings.hintZoneRadius,
        );
      }
    }
  });

  it("returns null for an unknown position", () => {
    expect(zoneHint("nope", teststadt, buildGraph(teststadt), 2)).toBeNull();
  });
});

function freeAdjacency(map: MapPack, removed: Set<string>): Map<string, string[]> {
  const adjacency = new Map<string, string[]>(map.nodes.map((node) => [node.id, []]));
  for (const edge of map.edges) {
    const key = [edge.a, edge.b].sort().join("|");
    if (removed.has(key)) {
      continue;
    }
    adjacency.get(edge.a)?.push(edge.b);
    adjacency.get(edge.b)?.push(edge.a);
  }
  return adjacency;
}

function staysConnected(map: MapPack, removed: Set<string>): boolean {
  const adjacency = freeAdjacency(map, removed);
  const first = map.nodes[0].id;
  const seen = new Set([first]);
  const queue = [first];
  for (let head = 0; head < queue.length; head += 1) {
    for (const next of adjacency.get(queue[head]) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen.size === map.nodes.length;
}

function keyOf(edge: { a: string; b: string }): string {
  return [edge.a, edge.b].sort().join("|");
}

describe("pickBlockableEdge", () => {
  it("never splits the graph and never picks an already blocked edge", () => {
    const maps = [muenster, luebeck, teststadt];
    for (const map of maps) {
      const graph = buildGraph(map);
      for (let seed = 1; seed <= 40; seed += 1) {
        const edge = pickBlockableEdge(graph, map.edges, [], 1, createRng(seed));
        expect(edge).not.toBeNull();
        expect(staysConnected(map, new Set([keyOf(edge as MapEdge)]))).toBe(true);
      }
    }
  });

  it("respects already blocked edges when checking connectivity", () => {
    // f-g already blocked: the pick must neither re-block it nor choose
    // an edge whose removal on top of f-g would split the graph.
    const graph = buildGraph(teststadt);
    const edge = pickBlockableEdge(
      graph,
      teststadt.edges,
      [{ a: "f", b: "g", untilRound: 5 }],
      3,
      createRng(11),
    );
    expect(edge).not.toBeNull();
    expect(keyOf(edge as MapEdge)).not.toBe("f|g");
    const removed = new Set(["f|g", keyOf(edge as MapEdge)]);
    expect(staysConnected(teststadt, removed)).toBe(true);
  });

  it("returns null when every removal would disconnect the graph", () => {
    // Minimal path graph: a-b-c — blocking any edge isolates a node.
    const graph: Graph = {
      adjacency: new Map([
        ["a", [{ nodeId: "b", type: "weg" }]],
        [
          "b",
          [
            { nodeId: "a", type: "weg" },
            { nodeId: "c", type: "weg" },
          ],
        ],
        ["c", [{ nodeId: "b", type: "weg" }]],
      ]),
    };
    const edges: MapEdge[] = [
      { a: "a", b: "b", type: "weg" },
      { a: "b", b: "c", type: "weg" },
    ];
    expect(pickBlockableEdge(graph, edges, [], 1, createRng(1))).toBeNull();
  });
});
