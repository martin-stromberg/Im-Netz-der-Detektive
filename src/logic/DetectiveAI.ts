/**
 * Detective AI (01-spielkonzept.md section 6, 02-technisches-konzept.md
 * section 5): steers the whole detective squad as one instance —
 * heuristic "close in on the last hint + narrow the possible positions".
 *
 * The squad never chases a single trace: each move minimises the joint
 * coverage of the belief set B (sum over all possible ganove positions
 * of their distance to the nearest detective), which spreads the
 * detectives over distinct regions and encircles the remaining area;
 * ties break towards the most recent hint location. B comes from the
 * shared `Deduction` module — the same data the UI overlay shows.
 *
 * Structural information separation: the AI only receives a
 * `DetectiveView` — detective-visible events, own positions, cameras,
 * blocked edges and the mission *structure* (never the drawn target
 * nodes, never the ganove's position). Camping on mission targets is
 * impossible by construction. All randomness flows through the injected
 * `Rng` — deterministic per seed.
 */
import { buildGraph, type Graph } from "./Graph";
import { deducePossiblePositions, lastHintAnchor } from "./Deduction";
import type { Camera, GameEvent } from "./InformationSystem";
import type { MapPack } from "./mapPack";
import type { MissionStructureStep } from "./MissionSystem";
import { bfsOpenDistances, type BlockedEdge, type MoveTarget } from "./Movement";
import type { Rng } from "./rng";

/** Everything the detective AI may know — and nothing more. */
export interface DetectiveView {
  map: MapPack;
  /** Current round (events of this round already include the ganove's turn). */
  round: number;
  /** Detective positions at game start — the deduction spawn prior. */
  detectiveStarts: readonly string[];
  /** Current squad positions (public information). */
  detektivePositions: readonly string[];
  /** Currently blocked edges (public, `umwelt`). */
  blockedEdges: readonly BlockedEdge[];
  /** Detective-visible chronicle only (`visibleTo` detectives|both). */
  events: readonly GameEvent[];
  /** Known cameras incl. `active` flag. */
  cameras: readonly Camera[];
  /** Mission steps + status — never the drawn target nodes. */
  missionStructure: readonly MissionStructureStep[];
  /**
   * The node each detective stood on before its last move (per squad
   * index, `null` when unknown). Drives the patrol momentum of the
   * random-move branch (step 14): a patrolling officer sweeps a
   * corridor instead of jittering back and forth — patrol moves never
   * immediately reverse onto the previous node while alternatives
   * exist.
   */
  previousPositions?: readonly (string | null)[];
}

/**
 * Nodes the detective AI hunts when the belief set is empty — e.g.
 * after a `falsche_spur` sabotage legitimately excluded the truth:
 * fall back to the most recent hint area, else the whole map.
 */
function fallbackTargets(view: DetectiveView): string[] {
  const anchor = lastHintAnchor(view.events);
  if (anchor !== null) {
    if (anchor.nodeIds !== undefined && anchor.nodeIds.length > 0) {
      return anchor.nodeIds;
    }
    if (anchor.nodeId !== undefined) {
      return [anchor.nodeId];
    }
  }
  return view.map.nodes.map((node) => node.id);
}

/** Nodes the anchor event refers to (exact node or zone ball). */
function anchorNodes(anchor: GameEvent): string[] {
  if (anchor.nodeId !== undefined) {
    return [anchor.nodeId];
  }
  return anchor.nodeIds ?? [];
}

/** BFS distances over the currently passable edges, cached per origin. */
function distanceOracle(
  graph: Graph,
  blockedEdges: readonly BlockedEdge[],
  round: number,
): (from: string) => Map<string, number> {
  const cache = new Map<string, Map<string, number>>();
  return (from) => {
    let dist = cache.get(from);
    if (dist === undefined) {
      dist = bfsOpenDistances(graph, from, blockedEdges, round);
      cache.set(from, dist);
    }
    return dist;
  };
}

/**
 * Picks the move for the detective at `detectiveIndex` from its legal
 * targets. Scoring, best value first (ties broken via `rng.pick`):
 *
 * 1. `coverage` — Σ over every belief node of its distance to the
 *    nearest detective position after the move (squad-wide encirclement
 *    instead of single-file pursuit)
 * 2. `anchor` — distance to the most recent hint location
 * 3. `closest` — distance to the nearest belief node
 *
 * Throws `RangeError` when `legalMoves` is empty (the store guarantees
 * forced moves while the game runs — an empty list means a caller bug).
 */
/**
 * Probability that a detective takes a plain random legal move instead
 * of the optimal coverage move — step-14 calibration. The belief-set
 * coverage above plays *perfectly*: every quiet round the negative
 * camera inference and the occupancy elimination squeeze the set, and
 * the squad encircled the remaining candidates so tightly that the
 * AI-vs-AI ganove never finished a mission. Human detectives lose the
 * thread — they patrol, second-guess, idle. A modest random patrol
 * fraction reproduces that leak while the optimal move still governs
 * most turns; the draw comes from the same injected `Rng` lane, so
 * every game stays deterministic per seed.
 *
 * Revision after playtest feedback ("the detectives never feel like
 * they are on your tail"): the patrol fraction dropped from 0.95 to
 * 0.6 and a fresh-trail override was added — while a hint younger
 * than DETECTIVE_FRESH_TRAIL_ROUNDS exists, the squad never rolls for
 * patrol and always hunts on the live deduction.
 */
export const DETECTIVE_RANDOM_MOVE_CHANCE = 0.6;

/**
 * Command lag in rounds — the squad steers on the deduction picture of
 * `round - INTEL_LAG`, not the live one. A lag of 3 rounds keeps the
 * hunt visibly committed but humanly imperfect: the squad descends on
 * the area a hint *was*, which opens the escape windows the game is
 * built around.
 */
export const DETECTIVE_INTEL_LAG = 3;

/**
 * Fresh-trail window in rounds: while the newest detective-visible
 * position hint is at most this many rounds old, the squad is "on the
 * trail" — the patrol roll is skipped and every detective commits to
 * the deduction-driven move. Outside the window (cold trail) patrols
 * resume at DETECTIVE_RANDOM_MOVE_CHANCE.
 */
export const DETECTIVE_FRESH_TRAIL_ROUNDS = 2;

export function chooseDetectiveMove(
  view: DetectiveView,
  detectiveIndex: number,
  legalMoves: readonly MoveTarget[],
  rng: Rng,
): string {
  if (legalMoves.length === 0) {
    throw new RangeError(
      `chooseDetectiveMove: no legal moves for detective ${detectiveIndex} in round ${view.round}`,
    );
  }
  // Fresh-trail override: while a position hint is younger than
  // DETECTIVE_FRESH_TRAIL_ROUNDS the squad is "on the trail" — no
  // patrol roll at all, every detective commits to the hunt.
  const trail = lastHintAnchor(view.events);
  const onFreshTrail = trail !== null && view.round - trail.round <= DETECTIVE_FRESH_TRAIL_ROUNDS;
  // Random patrol move — see DETECTIVE_RANDOM_MOVE_CHANCE. The draw
  // consumes the lane regardless of outcome so the sequence does not
  // depend on which detectives were optimal this round. Patrol keeps
  // momentum: an instant reversal is skipped while other options exist.
  if (!onFreshTrail && legalMoves.length > 1 && rng.next() < DETECTIVE_RANDOM_MOVE_CHANCE) {
    const previous = view.previousPositions?.[detectiveIndex] ?? null;
    const forward = legalMoves.filter((move) => move.nodeId !== previous);
    return rng.pick(forward.length > 0 ? forward : [...legalMoves]).nodeId;
  }
  const graph = buildGraph(view.map);
  const distFrom = distanceOracle(graph, view.blockedEdges, view.round);

  // The squad acts on stale intel (DETECTIVE_INTEL_LAG): only events
  // older than the lag feed the belief computation and the anchor.
  const intelRound = Math.max(0, view.round - DETECTIVE_INTEL_LAG);
  const intelEvents = view.events.filter((event) => event.round <= intelRound);
  const belief = deducePossiblePositions({
    map: view.map,
    detectiveStarts: view.detectiveStarts,
    events: intelEvents,
    cameras: view.cameras,
    round: view.round,
    detectivePositions: view.detektivePositions,
  });
  const targets = belief.length > 0 ? belief : fallbackTargets(view);
  const anchor = lastHintAnchor(intelEvents);
  const anchorSet = anchor !== null ? anchorNodes(anchor) : [];
  const others = view.detektivePositions.filter((_, index) => index !== detectiveIndex);

  const score = (move: MoveTarget): [number, number, number] => {
    const mine = distFrom(move.nodeId);
    let coverage = 0;
    for (const node of targets) {
      let nearest = mine.get(node) ?? Infinity;
      for (const other of others) {
        const d = distFrom(other).get(node) ?? Infinity;
        if (d < nearest) {
          nearest = d;
        }
      }
      coverage += nearest;
    }
    let anchorDist = Infinity;
    for (const node of anchorSet) {
      const d = mine.get(node) ?? Infinity;
      if (d < anchorDist) {
        anchorDist = d;
      }
    }
    let closest = Infinity;
    for (const node of targets) {
      const d = mine.get(node) ?? Infinity;
      if (d < closest) {
        closest = d;
      }
    }
    return [coverage, anchorDist === Infinity ? 0 : anchorDist, closest === Infinity ? 0 : closest];
  };

  let bestScore: [number, number, number] = [Infinity, Infinity, Infinity];
  let best: MoveTarget[] = [];
  for (const move of legalMoves) {
    const value = score(move);
    const cmp = value[0] - bestScore[0] || value[1] - bestScore[1] || value[2] - bestScore[2];
    if (cmp < 0) {
      bestScore = value;
      best = [move];
    } else if (cmp === 0) {
      best.push(move);
    }
  }
  return rng.pick(best).nodeId;
}
