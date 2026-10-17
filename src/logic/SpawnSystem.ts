/**
 * Startaufstellung (spawn) system per map package `spawnRules`.
 * Detectives are always placed before the ganove (`detektive_first`).
 * Modes: `choice` (allowed node list or zones), `free` (all nodes),
 * `random` (assigned via the seeded RNG). The ganove's candidate list is
 * additionally filtered by `minDistanceToDetective` — measured in BFS
 * edge distance to every already-placed detective — so positions below
 * the minimum distance are never offered, regardless of mode.
 */
import { bfsDistances, buildGraph } from "./Graph";
import { missionCriteriaViolations, type MissionTargets } from "./MissionSystem";
import type { MapPack, SpawnRule } from "./mapPack";
import type { Rng } from "./rng";

export type SpawnActor = "detective" | "ganove";

export interface SpawnAssignment {
  detectivePositions: string[];
  ganovePosition: string;
}

export class SpawnError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpawnError";
  }
}

function nodesInZones(map: MapPack, zones: readonly string[]): string[] {
  const zoneSet = new Set(zones);
  return map.nodes.filter((node) => zoneSet.has(node.zone)).map((node) => node.id);
}

/** Candidate nodes for a spawn rule, before distance filtering. */
function candidatesForRule(map: MapPack, rule: SpawnRule): string[] {
  if (rule.mode === "choice") {
    const nodes = [...(rule.nodes ?? []), ...nodesInZones(map, rule.zones ?? [])];
    const unique = [...new Set(nodes)];
    if (unique.length === 0) {
      throw new SpawnError('spawn rule mode "choice" resolved to no candidate nodes');
    }
    return unique;
  }
  return map.nodes.map((node) => node.id);
}

/** Nodes the next detective may spawn on, per `spawnRules.detectives`. */
export function detectiveSpawnChoices(map: MapPack): string[] {
  return candidatesForRule(map, map.spawnRules.detectives);
}

/**
 * Nodes the ganove may spawn on after `detectivePositions` are placed.
 * Candidates below `minDistanceToDetective` (BFS edge distance to any
 * placed detective) are removed; unreachable nodes count as infinitely
 * far and stay eligible.
 */
export function ganoveSpawnChoices(map: MapPack, detectivePositions: readonly string[]): string[] {
  const candidates = candidatesForRule(map, map.spawnRules.ganove);
  const minDistance = map.spawnRules.ganove.minDistanceToDetective;
  if (minDistance === undefined || detectivePositions.length === 0) {
    return candidates;
  }
  const graph = buildGraph(map);
  const distanceMaps = detectivePositions.map((pos) => bfsDistances(graph, pos));
  return candidates.filter((nodeId) =>
    distanceMaps.every((dists) => (dists.get(nodeId) ?? Infinity) >= minDistance),
  );
}

/**
 * Placement order enforced by the map (`order: "detektive_first"` is
 * already schema-required): every detective before the ganove.
 */
export function spawnSequence(map: MapPack, detectiveCount?: number): SpawnActor[] {
  const count = detectiveCount ?? map.settings.detectiveCount.suggested;
  return [...new Array<SpawnActor>(count).fill("detective"), "ganove"];
}

/**
 * Deterministically draws spawn positions for `count` detectives via the
 * seeded RNG. Detectives are drawn without replacement from their
 * candidates; the pool refills if `count` exceeds the candidate count
 * (detectives may legally share a node).
 */
export function pickDetectiveSpawns(map: MapPack, rng: Rng, count: number): string[] {
  const choices = detectiveSpawnChoices(map);
  let pool = [...choices];
  const positions: string[] = [];
  for (let i = 0; i < count; i += 1) {
    if (pool.length === 0) {
      pool = [...choices];
    }
    const index = rng.nextInt(0, pool.length);
    const [picked] = pool.splice(index, 1);
    positions.push(picked);
  }
  return positions;
}

/**
 * `ganoveSpawnChoices` plus a mission-criteria filter: when the game
 * carries fixed targets (a predefined "Fall", a player-defined mission
 * or a recorded `resolvedMission`), candidates are additionally
 * restricted to positions where `missionCriteriaViolations` finds no
 * conflict with `map.settings.missionRules`. `targets === null` (or
 * omitted) keeps the plain distance-filtered set — `random`/`auto`
 * missions draw their targets from the spawn, never against it.
 */
export function ganoveSpawnChoicesForMission(
  map: MapPack,
  detectivePositions: readonly string[],
  targets?: MissionTargets | null,
): string[] {
  const choices = ganoveSpawnChoices(map, detectivePositions);
  if (targets === undefined || targets === null) {
    return choices;
  }
  const graph = buildGraph(map);
  return choices.filter(
    (nodeId) =>
      missionCriteriaViolations(graph, map.settings.missionRules, targets, nodeId).length === 0,
  );
}

/**
 * Deterministically draws the ganove's spawn from the distance-filtered
 * candidates. Throws `SpawnError` when no eligible node remains.
 */
export function pickGanoveSpawn(
  map: MapPack,
  rng: Rng,
  detectivePositions: readonly string[],
): string {
  const choices = ganoveSpawnChoices(map, detectivePositions);
  if (choices.length === 0) {
    throw new SpawnError(
      "no ganove spawn candidate satisfies minDistanceToDetective for the placed detectives",
    );
  }
  return rng.pick(choices);
}

/**
 * `pickGanoveSpawn` over the mission-filtered candidate set. Throws
 * `SpawnError` when no position satisfies both the spawn rule and the
 * mission criteria (e.g. a custom mission that is unplayable for the
 * placed detectives).
 */
export function pickGanoveSpawnForMission(
  map: MapPack,
  rng: Rng,
  detectivePositions: readonly string[],
  targets?: MissionTargets | null,
): string {
  const choices = ganoveSpawnChoicesForMission(map, detectivePositions, targets);
  if (choices.length === 0) {
    throw new SpawnError(
      "no ganove spawn candidate satisfies spawnRules and the mission criteria " +
        "for the placed detectives",
    );
  }
  return rng.pick(choices);
}

/**
 * Full automatic spawn in `spawnSequence` order — every detective is
 * drawn before the ganove, so the ganove's distance-filtered candidates
 * always see the final detective positions. Deterministic for a given
 * `(map, rng)` pair.
 */
export function assignSpawns(map: MapPack, rng: Rng, detectiveCount?: number): SpawnAssignment {
  const sequence = spawnSequence(map, detectiveCount);
  const count = sequence.filter((actor) => actor === "detective").length;
  const detectivePositions = pickDetectiveSpawns(map, rng, count);
  const ganovePosition = pickGanoveSpawn(map, rng, detectivePositions);
  return { detectivePositions, ganovePosition };
}
