/**
 * Camera placement and triggering (01-spielkonzept.md section 4.1).
 * Cameras are placed at game start via the seeded RNG: each placement
 * keeps a minimum BFS edge distance (`cameraMinGap`) to every other
 * camera and honours an exclusion list of protected nodes (the mission
 * targets will fill it in a later step). Active cameras fire a
 * detective-only hint whenever the ganove enters their node.
 * `deactivateAll` is reserved for the camera sabotage effect.
 */
import { bfsDistances, type Graph } from "./Graph";
import type { Camera } from "./InformationSystem";
import type { Rng } from "./rng";

/**
 * Places up to `count` cameras on the graph. Candidates are the
 * shuffled node ids minus `protectedNodeIds`; a candidate is taken only
 * when its BFS edge distance to every already placed camera is at least
 * `minGap`. If the map cannot satisfy `count` placements under these
 * constraints, fewer cameras are placed (the invariants always hold).
 */
export function placeCameras(
  graph: Graph,
  rng: Rng,
  count: number,
  minGap: number,
  protectedNodeIds: readonly string[] = [],
): Camera[] {
  const protectedNodes = new Set(protectedNodeIds);
  const candidates = rng.shuffle(
    [...graph.adjacency.keys()].filter((nodeId) => !protectedNodes.has(nodeId)),
  );
  const placed: string[] = [];
  for (const candidate of candidates) {
    if (placed.length >= count) {
      break;
    }
    const distances = bfsDistances(graph, candidate);
    if (placed.every((other) => (distances.get(other) ?? Infinity) >= minGap)) {
      placed.push(candidate);
    }
  }
  return placed.map((nodeId) => ({ nodeId, active: true }));
}

/**
 * The active camera on `nodeId`, if any — the ganove triggers it by
 * entering the node. Inactive (sabotaged) cameras never trigger.
 */
export function triggeredCamera(cameras: readonly Camera[], nodeId: string): Camera | undefined {
  return cameras.find((camera) => camera.active && camera.nodeId === nodeId);
}

/** Returns a copy with every camera deactivated (sabotage effect). */
export function deactivateAll(cameras: readonly Camera[]): Camera[] {
  return cameras.map((camera) => (camera.active ? { ...camera, active: false } : camera));
}
