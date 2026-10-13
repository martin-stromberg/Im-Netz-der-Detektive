/**
 * Ganove AI (01-spielkonzept.md sections 5 and 6): pursues the mission
 * — routes toward the current target, times action rounds (never while
 * the heat is critical or a detective is adjacent), taps the police
 * radio once under pressure and weighs the informant's sabotage offer
 * against its detour.
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
 * same round.
 */
export const SAFE_ACTION_GAP = 2;
/** Heat score at which the police radio is tapped (`erhoeht` and up). */
export const RADIO_HEAT_THRESHOLD = 3;
/**
 * Distance to the nearest detective at which the ganove switches from
 * mission progress to evasion (maximise distance first).
 */
export const EVADE_DISTANCE = 2;
/**
 * Preferred minimum distance of a move target to the nearest detective
 * — kept whenever such a move exists (landing closer invites the net).
 */
export const MOVE_SAFE_GAP = 3;

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

/** Remaining route + action rounds needed to finish the mission. */
function remainingWork(view: GanoveView, distFrom: (from: string) => Map<string, number>): number {
  const mission = view.mission;
  if (mission === null) {
    const target = currentTarget(view, distFrom);
    return target === null ? 0 : (distFrom(view.ganovePosition).get(target) ?? Infinity);
  }
  const d = (a: string, b: string | null): number =>
    b === null ? Infinity : (distFrom(a).get(b) ?? Infinity);
  const t = mission.targets;
  const pos = view.ganovePosition;
  switch (mission.stage) {
    case "diebstahl":
      return d(pos, t.diebstahl) + d(t.diebstahl, t.kontakt) + d(t.kontakt, t.flucht) + 2;
    case "kontakt":
      return d(pos, t.kontakt) + d(t.kontakt, t.flucht) + 1;
    case "wahl":
      return d(pos, t.flucht);
    case "sabotage":
      return t.sabotage === null
        ? d(pos, t.flucht)
        : d(pos, t.sabotage) + d(t.sabotage, t.flucht) + 1;
    case "flucht":
      return d(pos, t.flucht);
  }
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
 * Decides the informant's binary offer (spec section 5.4): accept the
 * sabotage when its detour stays within the map's `sabotageDetour`
 * budget and the heat is below `kritisch` — otherwise head for the
 * escape point.
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
  const worthIt = detour <= view.map.settings.missionRules.sabotageDetour;
  return worthIt && view.heatLevel !== "kritisch" ? "sabotage" : "flucht";
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
 * (only when safe — no detective within `SAFE_ACTION_GAP` and heat
 * below `kritisch`, unless the remaining round budget forces it) or a
 * move toward the current mission target. Moves that land within one
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
    // hard floor is `SAFE_ACTION_GAP`. Heat only vetoes the action when
    // the mission is not yet on the deadline: every action emits an
    // exact trace, so acting while `kritisch` invites the swarm — but
    // stalling loses to the round limit anyway.
    const safe = dangerAt(view.ganovePosition) >= SAFE_ACTION_GAP;
    const work = remainingWork(view, distFrom);
    const deadline =
      view.roundLimit !== null && Number.isFinite(work) && view.roundLimit - view.round <= work;
    if (safe && (view.heatLevel !== "kritisch" || deadline)) {
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
  // Move targets are filtered to the widest safe gap available:
  // landing within one edge of a detective is suicide this round
  // (distance ≥2 is the hard floor), within two it invites the net next
  // round — so the AI keeps `MOVE_SAFE_GAP` whenever an alternative
  // exists.
  const comfortable = view.legalMoves.filter((move) => dangerAt(move.nodeId) >= MOVE_SAFE_GAP);
  const safeMoves = view.legalMoves.filter((move) => dangerAt(move.nodeId) >= 2);
  const pool =
    comfortable.length > 0 ? comfortable : safeMoves.length > 0 ? safeMoves : view.legalMoves;

  // On the final leg (sabotage/flucht) the ganove commits: reaching the
  // node ends or finishes the mission — pure evasion would only stall
  // into a timeout loss. Early stages balance progress against safety.
  const finalLeg =
    view.mission !== null && (view.mission.stage === "sabotage" || view.mission.stage === "flucht");
  // Evade mode: once a detective is within `EVADE_DISTANCE` edges or the
  // heat is `kritisch` (the trail is hot — they likely know where he
  // is), the priority flips from mission progress to opening distance.
  // The escape score maximises first the distance to the nearest
  // detective, then the exits the node keeps, then the summed distance
  // to the whole squad (avoids running into a corner surrounded on all
  // sides).
  const evading =
    !finalLeg && (dangerAt(view.ganovePosition) <= EVADE_DISTANCE || view.heatLevel === "kritisch");
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
  const score = (move: MoveTarget): [number, number, number, number, number] => {
    const targetDist = target === null ? 0 : (distFrom(move.nodeId).get(target) ?? Infinity);
    const squadDist = view.detektivePositions.reduce(
      (sum, d) => sum + (distFrom(d).get(move.nodeId) ?? 0),
      0,
    );
    const cameraPenalty = knownCameras.has(move.nodeId) ? 1 : 0;
    return evading
      ? [-dangerAt(move.nodeId), cameraPenalty, -futureExits(move.nodeId), -squadDist, targetDist]
      : [targetDist, -dangerAt(move.nodeId), cameraPenalty, -futureExits(move.nodeId), -squadDist];
  };

  let bestScore: readonly number[] = [Infinity, Infinity, Infinity, Infinity, Infinity];
  let best: MoveTarget[] = [];
  for (const move of pool) {
    const value = score(move);
    let cmp = 0;
    for (let i = 0; i < value.length && cmp === 0; i += 1) {
      cmp = value[i] - (bestScore[i] ?? Infinity);
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
