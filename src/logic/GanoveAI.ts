/**
 * Ganove AI (01-spielkonzept.md sections 5 and 6): pursues the mission
 * — routes toward the current target, times action rounds (a detective
 * within `SAFE_ACTION_GAP` postpones them), taps the police radio once
 * under pressure and weighs the informant's sabotage offer against its
 * detour.
 *
 * The AI sees exactly what a ganove player sees (`GanoveView`): own
 * position and full mission targets, all detective positions, the
 * ganove-visible chronicle (incl. police-radio hints), blocked edges,
 * the heat indicator (level + score only — never hint contents), the
 * legal moves and the currently executable mission action. All
 * randomness flows through the injected `Rng` — deterministic per seed.
 */
import { buildGraph, type Graph } from "./Graph";
import type { GameEvent, HeatLevel } from "./InformationSystem";
import type { MapPack } from "./mapPack";
import type { MissionStage } from "./MissionSystem";
import { bfsOpenDistances, isEdgeBlocked, type BlockedEdge, type MoveTarget } from "./Movement";
import type { Rng } from "./rng";
import type { Mission } from "../state/gameStore";

/**
 * Minimum distance to the nearest detective required for a safe action
 * round — a detective one edge away catches a stationary ganove in the
 * same round; two edges away is already suicide on a fresh trail (the
 * action hint pins the node while the squad closes in). Raised to 3 in
 * the pursuit revision.
 */
export const SAFE_ACTION_GAP = 3;
/**
 * Heat score at which the police radio is tapped. Calibrated in step
 * 14: threshold 1 taps it right after the first hint activity — the
 * revealed trail lists the cameras already triggered, so the ganove
 * stops re-entering the very nodes that exposed him (the double camera
 * hit on one node was a recurring early-catch pattern).
 */
export const RADIO_HEAT_THRESHOLD = 1;
/**
 * Distance to the nearest detective at which the ganove switches from
 * mission progress to evasion (maximise distance first). Raised back
 * to 2 in the pursuit revision: against a squad that actually hunts on
 * fresh trails, waiting for adjacency before evading means the net is
 * already closed.
 */
export const EVADE_DISTANCE = 2;
/**
 * Preferred minimum distance of a move target to the nearest detective
 * — kept whenever such a move exists. Calibrated in step 14: the
 * earlier value 3 filtered out direct routes so often that the ganove
 * detoured around the squad while the zone closed in. 2 matches the
 * hard survival floor (adjacent = caught this round).
 */
export const MOVE_SAFE_GAP = 2;

/** Everything the ganove AI may know — its own side's view. */
export interface GanoveView {
  map: MapPack;
  round: number;
  /** `null` = unlimited (only catch/escape decide). */
  roundLimit: number | null;
  ganovePosition: string;
  detektivePositions: readonly string[];
  /** Full mission incl. drawn targets — ganove-side knowledge. */
  mission: Mission | null;
  /** Ganove-visible chronicle (incl. `polizeifunk` payloads). */
  events: readonly GameEvent[];
  blockedEdges: readonly BlockedEdge[];
  heatLevel: HeatLevel;
  heatScore: number;
  radioUsed: boolean;
  escapeNodeIds: readonly string[];
  /** Legal moves of the current ganove phase. */
  legalMoves: readonly MoveTarget[];
  /** Mission action executable at the current position, if any. */
  missionAction: string | null;
  /**
   * Node the ganove came from with his last move (`null` before his
   * first move). Feeds the anti-oscillation tie-break added in step 14:
   * without it the greedy scorer ping-ponged between two nodes whenever
   * the direct route sat inside the detectives' coverage.
   */
  cameFromNodeId: string | null;
}

/** The AI's decision for the ganove phase. */
export type GanoveTurn = { type: "move"; target: string } | { type: "action" };

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

/** Minimum open-edge distance between `node` and any detective. */
function minDetectiveDistance(
  distFrom: (from: string) => Map<string, number>,
  detektivePositions: readonly string[],
  node: string,
): number {
  let nearest = Infinity;
  for (const detective of detektivePositions) {
    const d = distFrom(detective).get(node) ?? Infinity;
    if (d < nearest) {
      nearest = d;
    }
  }
  return nearest;
}

/**
 * The node the ganove currently steers to: the drawn target of the
 * mission stage, or — without a mission — the nearest escape node.
 */
function currentTarget(
  view: GanoveView,
  distFrom: (from: string) => Map<string, number>,
): string | null {
  const mission = view.mission;
  if (mission !== null) {
    const targets = mission.targets;
    const byStage: Record<MissionStage, string | null> = {
      diebstahl: targets.diebstahl,
      kontakt: targets.kontakt,
      // During "wahl" the driver answers the offer before this AI moves.
      wahl: targets.flucht,
      sabotage: targets.sabotage,
      flucht: targets.flucht,
    };
    return byStage[mission.stage];
  }
  let best: string | null = null;
  let bestDist = Infinity;
  const dist = distFrom(view.ganovePosition);
  for (const nodeId of view.escapeNodeIds) {
    const d = dist.get(nodeId) ?? Infinity;
    if (d < bestDist) {
      bestDist = d;
      best = nodeId;
    }
  }
  return best;
}

/** Camera nodes the police radio revealed as already triggered. */
function knownCameraNodes(view: GanoveView): Set<string> {
  const known = new Set<string>();
  for (const event of view.events) {
    if (event.kind !== "polizeifunk") {
      continue;
    }
    const hints = event.details?.hints;
    if (!Array.isArray(hints)) {
      continue;
    }
    for (const hint of hints) {
      if (
        typeof hint === "object" &&
        hint !== null &&
        (hint as { kind?: unknown }).kind === "camera" &&
        typeof (hint as { nodeId?: unknown }).nodeId === "string"
      ) {
        known.add((hint as { nodeId: string }).nodeId);
      }
    }
  }
  return known;
}

/**
 * Maximum detour (in edges over the direct kontakt→flucht leg) the AI
 * still judges worth the sabotage effect — step-14 calibration. The
 * generation budget `missionRules.sabotageDetour` draws offers up to
 * detour 8; accepting only cheap detours (≤ 3) makes the binary choice
 * a genuine weigh-off — measured offer distribution on muenster puts
 * the acceptance rate near 50 %, the corridor the balancing targets —
 * instead of rubber-stamping every offer.
 */
export const SABOTAGE_ACCEPT_DETOUR = 3;

/**
 * Decides the informant's binary offer (spec section 5.4): accept the
 * sabotage when its detour stays within `SABOTAGE_ACCEPT_DETOUR` —
 * otherwise head for the escape point. Step-14 calibration dropped the
 * heat clause: the sabotage cover is worth most exactly when the trail
 * is hot, and vetoing at `kritisch` only suppressed the escape window.
 */
export function chooseSabotagePath(view: GanoveView): "sabotage" | "flucht" {
  const mission = view.mission;
  const sabotage = mission?.targets.sabotage;
  if (mission === null || sabotage === null || sabotage === undefined) {
    return "flucht";
  }
  const distFrom = distanceOracle(buildGraph(view.map), view.blockedEdges, view.round);
  const t = mission.targets;
  const detour =
    (distFrom(t.kontakt).get(sabotage) ?? Infinity) +
    (distFrom(sabotage).get(t.flucht) ?? Infinity) -
    (distFrom(t.kontakt).get(t.flucht) ?? Infinity);
  return detour <= SABOTAGE_ACCEPT_DETOUR ? "sabotage" : "flucht";
}

/**
 * Police radio (spec section 4.5): tap it once the heat rises to
 * `erhoeht` — the revealed hint trail (incl. triggered cameras) steers
 * later route choices. Once per game.
 */
export function shouldUseRadio(view: GanoveView): boolean {
  return !view.radioUsed && view.heatScore >= RADIO_HEAT_THRESHOLD;
}

/**
 * Chooses the ganove's turn: an action round at the current target
 * (only when no detective sits within `SAFE_ACTION_GAP` edges — the
 * reveal makes an adjacent catch certain) or a move toward the current
 * mission target. Moves that land within one
 * edge of a detective are avoided whenever an alternative exists
 * (a detective there catches him in the same round); among the rest the
 * AI prefers shorter target distance, more distance to detectives and
 * avoids camera nodes revealed by the police radio. Throws `RangeError`
 * when neither an action nor a legal move exists (the store's
 * surrounded check makes that unreachable in a running game).
 */
export function chooseGanoveTurn(view: GanoveView, rng: Rng): GanoveTurn {
  const graph = buildGraph(view.map);
  const distFrom = distanceOracle(graph, view.blockedEdges, view.round);
  const dangerAt = (node: string): number =>
    minDetectiveDistance(distFrom, view.detektivePositions, node);

  if (view.missionAction !== null) {
    // Action rounds leave the ganove standing and fully catchable — a
    // detective within one edge catches him this very round, so the
    // hard floor is `SAFE_ACTION_GAP`. Step-14 calibration: both the
    // former heat veto and a stricter "post-action exit" gate were
    // tested and dropped — skipping an available action window stalls
    // the mission while the trail only gets hotter; grabbing the
    // action whenever the floor holds was strictly better in batch.
    const safe = dangerAt(view.ganovePosition) >= SAFE_ACTION_GAP;
    if (safe) {
      return { type: "action" };
    }
  }

  if (view.legalMoves.length === 0) {
    if (view.missionAction !== null) {
      // Corner case: boxed in but an action round is executable — it is
      // the only legal turn left (the store would otherwise have ended
      // the game as surrounded).
      return { type: "action" };
    }
    throw new RangeError(`chooseGanoveTurn: no legal move and no action in round ${view.round}`);
  }

  const target = currentTarget(view, distFrom);
  const knownCameras = knownCameraNodes(view);
  // Plain shortest distance to the current target — step-14 finding:
  // risk-priced routing (tested and discarded) made the ganove orbit
  // the whole squad in 15-round odysseys while hints piled up. Direct
  // dashes with the landing floor plus the anti-oscillation tie-break
  // below proved strictly better.
  const route = target === null ? null : distFrom(target);
  // Infinity leaks NaN into the lexicographic comparison below
  // (Infinity − Infinity = NaN never satisfies `< 0` or `=== 0`), so
  // unreachable entries are clamped to a large finite rank instead.
  const rank = (value: number): number => (Number.isFinite(value) ? value : 1_000_000);
  const routeDist = (nodeId: string): number =>
    route === null ? 0 : rank(route.get(nodeId) ?? Infinity);
  const currentRouteDist = routeDist(view.ganovePosition);

  // On the final leg (sabotage/flucht) the ganove commits: reaching the
  // node ends or finishes the mission — pure evasion would only stall
  // into a timeout loss. Early stages balance progress against safety.
  const finalLeg =
    view.mission !== null && (view.mission.stage === "sabotage" || view.mission.stage === "flucht");

  // Move pool, step-14 calibrated. Landing within one edge of a
  // detective is *not* automatic suicide — the catch only lands when a
  // detective actually steps onto the node, and the squad AI does not
  // see the ganove's position. The real rule from the batch logs:
  // prefer moves that strictly reduce the target distance ("progress
  // moves") at danger ≥ 2; when no safe progress exists, accept a
  // riskier progress move rather than circling (circling feeds the
  // deduction engine one more round of elimination); only when no
  // progress move exists at all fall back to the safest sidestep. On
  // the final leg any progress beats waiting — distance-1 landings
  // stay in the pool there as desperation dashes.
  const progressMoves = view.legalMoves.filter((move) => routeDist(move.nodeId) < currentRouteDist);
  const safeProgress = progressMoves.filter((move) => dangerAt(move.nodeId) >= MOVE_SAFE_GAP);
  const safeMoves = view.legalMoves.filter((move) => dangerAt(move.nodeId) >= 2);
  const pool =
    safeProgress.length > 0
      ? safeProgress
      : progressMoves.length > 0
        ? progressMoves
        : safeMoves.length > 0
          ? safeMoves
          : view.legalMoves;
  // Evade mode: once a detective is within `EVADE_DISTANCE` edges the
  // priority flips from mission progress to opening distance. Heat no
  // longer triggers evasion on its own (step-14 calibration): a hot
  // trail without a nearby detective must not stall the mission — the
  // heat only ever described recent hint activity, not proximity.
  // The escape score maximises first the distance to the nearest
  // detective, then the exits the node keeps, then the summed distance
  // to the whole squad (avoids running into a corner surrounded on all
  // sides).
  const evading = !finalLeg && dangerAt(view.ganovePosition) <= EVADE_DISTANCE;
  /**
   * "Future exits": neighbours of `node` that would still be survivable
   * next round — not occupied and at least two edges from every current
   * detective position. A node without exits is a trap once the net
   * closes in.
   */
  const futureExits = (node: string): number =>
    (graph.adjacency.get(node) ?? []).filter(
      (edge) =>
        !view.detektivePositions.includes(edge.nodeId) &&
        !isEdgeBlocked(node, edge.nodeId, view.blockedEdges, view.round + 1) &&
        dangerAt(edge.nodeId) >= 2,
    ).length;
  const score = (move: MoveTarget): [number, number, number, number, number, number] => {
    const targetDist = routeDist(move.nodeId);
    const squadDist = rank(
      view.detektivePositions.reduce((sum, d) => sum + (distFrom(d).get(move.nodeId) ?? 0), 0),
    );
    const cameraPenalty = knownCameras.has(move.nodeId) ? 1 : 0;
    // Anti-oscillation: stepping straight back onto the node he just
    // left is scored worse than any equally attractive alternative —
    // a 2-cycle never progresses the mission (step-14 calibration).
    const backtrack = move.nodeId === view.cameFromNodeId ? 1 : 0;
    return evading
      ? [
          -dangerAt(move.nodeId),
          cameraPenalty,
          backtrack,
          -futureExits(move.nodeId),
          -squadDist,
          targetDist,
        ]
      : // Camera rank sits right behind route progress: a known camera
        // node is an exact position report — worth an extra edge of
        // detour, but never worth skipping a closer safe approach.
        [
          targetDist,
          cameraPenalty,
          -dangerAt(move.nodeId),
          backtrack,
          -futureExits(move.nodeId),
          -squadDist,
        ];
  };

  let bestScore: readonly number[] = [Infinity, Infinity, Infinity, Infinity, Infinity, Infinity];
  let best: MoveTarget[] = [];
  for (const move of pool) {
    const value = score(move);
    let cmp = 0;
    for (let i = 0; i < value.length && cmp === 0; i += 1) {
      // Infinity − Infinity = NaN must never reach the comparison —
      // `rank` already clamped every score component to a finite value,
      // and the initial bestScore entries compare as "worse than anything
      // finite" because cmp stays > 0 only via value − Infinity = −Inf.
      const reference = bestScore[i];
      cmp = reference === Infinity ? (value[i] === Infinity ? 0 : -1) : value[i] - reference;
    }
    if (cmp < 0) {
      bestScore = value;
      best = [move];
    } else if (cmp === 0) {
      best.push(move);
    }
  }
  return { type: "move", target: rng.pick(best).nodeId };
}
