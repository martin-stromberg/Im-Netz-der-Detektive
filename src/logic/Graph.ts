/**
 * Undirected, unweighted graph built from a map package's edges.
 * Distances are BFS edge counts — the metric used by spawn rules,
 * mission generation and zone hints (`cost` on edges is reserved and
 * intentionally ignored for now).
 */
import type { EdgeType, MapPack } from "./mapPack";

export interface GraphEdge {
  nodeId: string;
  type: EdgeType;
}

export interface Graph {
  /** nodeId -> directly connected neighbours */
  adjacency: Map<string, GraphEdge[]>;
}

export function buildGraph(map: MapPack): Graph {
  const adjacency = new Map<string, GraphEdge[]>();
  for (const node of map.nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of map.edges) {
    adjacency.get(edge.a)?.push({ nodeId: edge.b, type: edge.type });
    adjacency.get(edge.b)?.push({ nodeId: edge.a, type: edge.type });
  }
  return { adjacency };
}

/** Ids of nodes directly connected to `nodeId` (empty for unknown nodes). */
export function neighbors(graph: Graph, nodeId: string): string[] {
  return (graph.adjacency.get(nodeId) ?? []).map((e) => e.nodeId);
}

/**
 * BFS edge distances from `from` to every reachable node. Unreachable
 * and unknown nodes are absent from the result; `from` maps to 0.
 */
export function bfsDistances(graph: Graph, from: string): Map<string, number> {
  const dist = new Map<string, number>();
  if (!graph.adjacency.has(from)) {
    return dist;
  }
  dist.set(from, 0);
  const queue: string[] = [from];
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    const nextDist = (dist.get(current) ?? 0) + 1;
    for (const edge of graph.adjacency.get(current) ?? []) {
      if (!dist.has(edge.nodeId)) {
        dist.set(edge.nodeId, nextDist);
        queue.push(edge.nodeId);
      }
    }
  }
  return dist;
}

/**
 * Edge distance between two nodes: `0` when identical, `Infinity` when
 * unreachable or unknown.
 */
export function distance(graph: Graph, from: string, to: string): number {
  if (from === to) {
    return graph.adjacency.has(from) ? 0 : Infinity;
  }
  return bfsDistances(graph, from).get(to) ?? Infinity;
}
