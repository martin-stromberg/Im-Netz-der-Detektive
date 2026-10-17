import { describe, expect, it } from "vitest";
import { bfsDistances, buildGraph, distance, neighbors } from "./Graph";
import { loadMap } from "./MapLoader";
import type { MapPack } from "./mapPack";

const map = loadMap("teststadt");
const graph = buildGraph(map);

/*
 * teststadt edges:
 *   weg:   a-b, b-c, c-d, b-e, e-f, c-f, d-g, g-h, e-h, h-i, i-j, e-j
 *   fahrt: f-g
 * BFS distances from a: b=1, c=2, e=2, d=3, f=3, h=3, j=3, g=4, i=4
 */
describe("neighbors", () => {
  it("returns direct neighbours in both directions", () => {
    expect(neighbors(graph, "b").sort()).toEqual(["a", "c", "e"]);
    expect(neighbors(graph, "a")).toEqual(["b"]);
  });

  it("returns an empty list for an unknown node", () => {
    expect(neighbors(graph, "nope")).toEqual([]);
  });
});

describe("bfsDistances / distance", () => {
  it("computes correct edge distances on the fixture graph", () => {
    const expected: Record<string, number> = {
      a: 0,
      b: 1,
      c: 2,
      e: 2,
      d: 3,
      f: 3,
      h: 3,
      j: 3,
      g: 4,
      i: 4,
    };
    const dists = bfsDistances(graph, "a");
    for (const [nodeId, dist] of Object.entries(expected)) {
      expect(dists.get(nodeId)).toBe(dist);
    }
    expect(dists.size).toBe(map.nodes.length);
  });

  it("returns 0 for the same node", () => {
    expect(distance(graph, "a", "a")).toBe(0);
  });

  it("uses the fahrt edge as a regular edge (unweighted)", () => {
    expect(distance(graph, "f", "g")).toBe(1);
    expect(distance(graph, "a", "g")).toBe(4);
  });

  it("returns Infinity for unreachable nodes", () => {
    const island: MapPack = {
      ...map,
      edges: [{ a: "a", b: "b", type: "weg" }],
    };
    const islandGraph = buildGraph(island);
    expect(distance(islandGraph, "a", "j")).toBe(Infinity);
  });

  it("returns Infinity for unknown nodes", () => {
    expect(distance(graph, "a", "ghost")).toBe(Infinity);
    expect(distance(graph, "ghost", "a")).toBe(Infinity);
    expect(distance(graph, "ghost", "ghost")).toBe(Infinity);
  });
});
