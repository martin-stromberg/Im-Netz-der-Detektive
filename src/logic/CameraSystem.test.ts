import { describe, expect, it } from "vitest";
import { buildGraph, distance } from "./Graph";
import { loadMap } from "./MapLoader";
import { createRng } from "./rng";
import { deactivateAll, placeCameras, triggeredCamera } from "./CameraSystem";

const muenster = loadMap("muenster");
const teststadt = loadMap("teststadt");

function assertCameraInvariants(
  map: typeof muenster,
  cameras: { nodeId: string }[],
  minGap: number,
  protectedNodes: readonly string[] = [],
) {
  const known = new Set(map.nodes.map((node) => node.id));
  for (const camera of cameras) {
    expect(known.has(camera.nodeId)).toBe(true);
    expect(protectedNodes.includes(camera.nodeId)).toBe(false);
  }
  const ids = cameras.map((camera) => camera.nodeId);
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      expect(distance(buildGraph(map), ids[i], ids[j])).toBeGreaterThanOrEqual(minGap);
    }
  }
}

describe("placeCameras", () => {
  it("keeps the min gap and excludes protected nodes over many seeds (muenster)", () => {
    const graph = buildGraph(muenster);
    const protectedNodes = muenster.nodes.slice(0, 10).map((node) => node.id);
    for (let seed = 1; seed <= 60; seed += 1) {
      const cameras = placeCameras(
        graph,
        createRng(seed),
        muenster.settings.cameraCount.suggested,
        muenster.settings.cameraMinGap,
        protectedNodes,
      );
      expect(cameras.length).toBeLessThanOrEqual(muenster.settings.cameraCount.suggested);
      assertCameraInvariants(muenster, cameras, muenster.settings.cameraMinGap, protectedNodes);
    }
  });

  it("keeps the invariants on the tight teststadt map over many seeds", () => {
    const graph = buildGraph(teststadt);
    for (let seed = 1; seed <= 50; seed += 1) {
      const cameras = placeCameras(
        graph,
        createRng(seed * 7),
        teststadt.settings.cameraCount.suggested,
        teststadt.settings.cameraMinGap,
      );
      assertCameraInvariants(teststadt, cameras, teststadt.settings.cameraMinGap);
    }
  });

  it("places the requested count when the map can satisfy it", () => {
    const graph = buildGraph(muenster);
    const cameras = placeCameras(
      graph,
      createRng(42),
      muenster.settings.cameraCount.suggested,
      muenster.settings.cameraMinGap,
    );
    expect(cameras).toHaveLength(muenster.settings.cameraCount.suggested);
    expect(cameras.every((camera) => camera.active)).toBe(true);
  });

  it("is deterministic for the same seed", () => {
    const graph = buildGraph(muenster);
    const first = placeCameras(graph, createRng(7), 8, 2);
    const second = placeCameras(graph, createRng(7), 8, 2);
    expect(first).toEqual(second);
  });

  it("places nothing when every node is protected", () => {
    const graph = buildGraph(teststadt);
    const all = teststadt.nodes.map((node) => node.id);
    expect(placeCameras(graph, createRng(1), 5, 1, all)).toEqual([]);
  });
});

describe("triggeredCamera", () => {
  const cameras = [
    { nodeId: "a", active: true },
    { nodeId: "b", active: false },
  ];

  it("returns the active camera on the node", () => {
    expect(triggeredCamera(cameras, "a")).toEqual({ nodeId: "a", active: true });
  });

  it("ignores inactive cameras and other nodes", () => {
    expect(triggeredCamera(cameras, "b")).toBeUndefined();
    expect(triggeredCamera(cameras, "c")).toBeUndefined();
  });
});

describe("deactivateAll", () => {
  it("deactivates every camera for the sabotage effect", () => {
    const result = deactivateAll([
      { nodeId: "a", active: true },
      { nodeId: "b", active: false },
    ]);
    expect(result).toEqual([
      { nodeId: "a", active: false },
      { nodeId: "b", active: false },
    ]);
  });
});
