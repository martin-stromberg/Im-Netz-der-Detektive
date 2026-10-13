/**
 * Random world events (01-spielkonzept.md sections 4.2 and 4.3).
 * Three trigger modes (`cycle`, `chance`, `tension`) decide *whether*
 * an event fires this round; the `eventMix` decides *which* of the
 * three types it becomes. All randomness flows through the seeded
 * `Rng` — the module is pure and deterministic.
 */
import { bfsDistances, type Graph } from "./Graph";
import type { BlockedEdge } from "./Movement";
import type {
  EventDefaults,
  EventMix,
  EventMode,
  MapEdge,
  MapPack,
} from "./mapPack";
import type { Rng } from "./rng";

/** The three drawable event types (`eventMix` keys). */
export type EventTypeKind = "sichtbarkeit" | "hinweis" | "umwelt";

export interface TriggerResult {
  fires: boolean;
  /** Updated tension value (only accumulates/resets in `tension` mode). */
  tensionValue: number;
}

/** Zone hint content: the spoken area plus its operative node region. */
export interface ZoneHint {
  zone: string;
  nodeIds: string[];
}

/**
 * Decides whether an event fires in `round` for the given mode:
 * - `cycle`: exactly when `round % defaults.cycle === 0`
 * - `chance`: `rng.next() < defaults.chance`
 * - `tension`: `tensionValue += defaults.perRound`, fires when it
 *   reaches `defaults.threshold`, then resets to 0
 * In non-tension modes the tension value is left untouched.
 */
export function rollTrigger(
  mode: EventMode,
  round: number,
  tensionValue: number,
  defaults: EventDefaults,
  rng: Rng,
): TriggerResult {
  if (mode === "cycle") {
    return { fires: round > 0 && round % defaults.cycle === 0, tensionValue };
  }
  if (mode === "chance") {
    return { fires: rng.next() < defaults.chance, tensionValue };
  }
  const tension = tensionValue + defaults.perRound;
  if (tension >= defaults.threshold) {
    return { fires: true, tensionValue: 0 };
  }
  return { fires: false, tensionValue: tension };
}

/**
 * Draws the event type with the `eventMix` weights. The weights do not
 * need to sum to 1 — they are normalised against their total.
 */
export function drawEventType(mix: EventMix, rng: Rng): EventTypeKind {
  const total = mix.sichtbarkeit + mix.hinweis + mix.umwelt;
  const roll = rng.next() * total;
  if (roll < mix.sichtbarkeit) {
    return "sichtbarkeit";
  }
  if (roll < mix.sichtbarkeit + mix.hinweis) {
    return "hinweis";
  }
  return "umwelt";
}

/**
 * Zone hint for the ganove's actual position: `zone` is the zone of his
 * node ("im Bereich X"), `nodeIds` is the operative region — every node
 * within `hintZoneRadius` edges of the true position. Returns `null`
 * for a position unknown to the map.
 */
export function zoneHint(
  position: string,
  map: MapPack,
  graph: Graph,
  radius: number,
): ZoneHint | null {
  const node = map.nodes.find((candidate) => candidate.id === position);
  if (node === undefined) {
    return null;
  }
  const distances = bfsDistances(graph, position);
  const nodeIds = [...distances.entries()]
    .filter(([, dist]) => dist <= radius)
    .map(([nodeId]) => nodeId)
    .sort();
  return { zone: node.zone, nodeIds };
}

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * BFS reachability of all nodes over the edges that remain when the
 * pairs in `removed` are taken out of the graph.
 */
function isConnectedWithout(graph: Graph, removed: ReadonlySet<string>): boolean {
  const nodes = [...graph.adjacency.keys()];
  if (nodes.length === 0) {
    return true;
  }
  const seen = new Set<string>([nodes[0]]);
  const queue = [nodes[0]];
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    for (const edge of graph.adjacency.get(current) ?? []) {
      if (removed.has(edgeKey(current, edge.nodeId)) || seen.has(edge.nodeId)) {
        continue;
      }
      seen.add(edge.nodeId);
      queue.push(edge.nodeId);
    }
  }
  return seen.size === nodes.length;
}

/**
 * Picks a random edge that may be blocked by an `umwelt` event in
 * `round`. A candidate is eligible only when it is not already blocked
 * and the graph — minus the currently blocked edges and itself — stays
 * fully connected. That single connectivity check covers both spec
 * constraints: the block never removes a node's last free edge and
 * never splits the graph. Returns `null` when no edge qualifies.
 */
export function pickBlockableEdge(
  graph: Graph,
  edges: readonly MapEdge[],
  blockedEdges: readonly BlockedEdge[],
  round: number,
  rng: Rng,
): MapEdge | null {
  const alreadyBlocked = new Set(
    blockedEdges.filter((edge) => edge.untilRound >= round).map((edge) => edgeKey(edge.a, edge.b)),
  );
  const candidates = rng
    .shuffle(edges)
    .filter((edge) => !alreadyBlocked.has(edgeKey(edge.a, edge.b)));
  for (const candidate of candidates) {
    const removed = new Set(alreadyBlocked);
    removed.add(edgeKey(candidate.a, candidate.b));
    if (isConnectedWithout(graph, removed)) {
      return candidate;
    }
  }
  return null;
}
