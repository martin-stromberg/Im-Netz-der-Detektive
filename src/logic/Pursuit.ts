/**
 * Pursuit pressure ("Verfolgungsdruck") — the ganove-facing distance
 * readout. Detective positions are fully public to the ganove (spec
 * section 1), yet a wall of icons hides the one fact that matters:
 * how close the nearest hunter is. `pursuitStatus` surfaces exactly
 * that as a BFS distance over the edges still open this round
 * (`umwelt` blocks impassable for both sides). No hidden information
 * is exposed — this is a presentation of data the player can already
 * see, not a new hint channel.
 */
import { buildGraph } from "./Graph";
import type { MapPack } from "./mapPack";
import { bfsOpenDistances, type BlockedEdge } from "./Movement";

/**
 * Pressure tiers by BFS distance to the nearest detective — icon and
 * text carry the level (a11y), colour is only the accent.
 */
export type PursuitLevel = "ruhig" | "spuerbar" | "nah" | "unmittelbar";

export interface PursuitStatus {
  /** Squad index of the nearest detective (tie → lowest index). */
  readonly nearestIndex: number;
  /** Node the nearest detective currently stands on. */
  readonly nearestNode: string;
  /** BFS edge distance over edges passable this round. */
  readonly distance: number;
  readonly level: PursuitLevel;
}

export function pursuitLevel(distance: number): PursuitLevel {
  if (distance <= 1) {
    return "unmittelbar";
  }
  if (distance === 2) {
    return "nah";
  }
  if (distance === 3) {
    return "spuerbar";
  }
  return "ruhig";
}

/**
 * Nearest-detective status for the ganove view; `null` when no
 * detective exists (no squad — impossible in play, defensive).
 * A distance of 0 means a detective shares the ganove's node — the
 * capture check has normally already ended the game by then.
 */
export function pursuitStatus(
  map: MapPack,
  blockedEdges: readonly BlockedEdge[],
  round: number,
  ganovePosition: string,
  detektivePositions: readonly string[],
): PursuitStatus | null {
  if (detektivePositions.length === 0) {
    return null;
  }
  const dist = bfsOpenDistances(buildGraph(map), ganovePosition, blockedEdges, round);
  let nearestIndex = -1;
  let nearestDistance = Infinity;
  for (let index = 0; index < detektivePositions.length; index += 1) {
    const d = dist.get(detektivePositions[index]) ?? Infinity;
    if (d < nearestDistance) {
      nearestDistance = d;
      nearestIndex = index;
    }
  }
  return {
    nearestIndex,
    nearestNode: detektivePositions[nearestIndex],
    distance: nearestDistance,
    level: pursuitLevel(nearestDistance),
  };
}
