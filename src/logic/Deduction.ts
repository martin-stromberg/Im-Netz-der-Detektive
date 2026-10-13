/**
 * Deduction data structure (01-spielkonzept.md sections 4.4 and 6 —
 * the shared "mögliche Positionen" basis used identically by the UI
 * overlay and the detective AI).
 *
 * The module computes, for an observation round, every node the ganove
 * could stand on after his turn of that round given ALL detective-side
 * hints so far — evaluated as position *histories* over the graph and
 * the past rounds, not as point sets: a camera hint in round 3 restricts
 * the possible positions in round 5 through the reachable range
 * (exactly one unblocked edge per round; staying put is possible only
 * in rounds that produced an `aktion` trace).
 *
 * Model: `S(0)` = the public spawn candidates (`spawnRules.ganove`
 * against the detective start positions). For each round `t`,
 * `S(t)` = successors of `S(t-1)` over one legal ganove step — or
 * `S(t-1)` ∩ {action node} when an `aktion` trace pins the stay —
 * intersected with every constraint observed in `t`:
 *
 * - `camera`/`sichtbarkeit`/`aktion` events: exact node (Knoten+Runde)
 * - `hinweis` events: the zone ball `nodeIds`
 * - `umwelt` events: edges blocked between their emission round and
 *   `untilRound` constrain the transitions of the affected rounds
 *   (the block created in round `t` applies from the detective moves
 *   of `t` onwards — the ganove's move of `t` already happened)
 * - negative camera inference: a move round without a `camera` event
 *   excludes every node carrying an active camera — entering it would
 *   have fired deterministically
 * - occupancy: the ganove's move target is never a node a detective
 *   occupied at that moment, and his position never equals a node a
 *   detective ended a round on (the catch check runs after every
 *   detective move)
 *
 * Everything is pure and deterministic; detective-invisible events
 * (`visibleTo: "ganove"`) are filtered out defensively, so callers may
 * pass the raw chronicle. A `falsche_spur` sabotage legitimately
 * falsifies the result — the detectives cannot tell; the "no false
 * exclusion" guarantee applies to unfalsified observations.
 */
import { buildGraph } from "./Graph";
import type { Camera, GameEvent } from "./InformationSystem";
import type { MapPack } from "./mapPack";
import { isEdgeBlocked, type BlockedEdge } from "./Movement";
import { ganoveSpawnChoices } from "./SpawnSystem";

/** A recorded `umwelt` block: edge impassable in rounds [round, untilRound]. */
interface UmweltBlock extends BlockedEdge {
  /** Round the block was created (applies to ganove moves only from round+1). */
  round: number;
}

export interface DeductionInput {
  map: MapPack;
  /** Detective positions at game start — the public spawn prior. */
  detectiveStarts: readonly string[];
  /** Event chronicle; only non-`ganove` events constrain the result. */
  events: readonly GameEvent[];
  /** Detectives' camera knowledge (the `active` flag drives the negative inference). */
  cameras: readonly Camera[];
  /** Observation round: belief after the ganove's turn of this round. */
  round: number;
  /**
   * Detective positions at the end of each round's detective phase —
   * index `[r]` = after round `r` (index 0 equals `detectiveStarts`).
   * Missing entries skip the occupancy constraint for those rounds.
   */
  detectiveHistory?: readonly (readonly string[] | undefined)[];
  /**
   * Current detective positions (live view): they equal the positions
   * during the ganove's move of `round`, so they constrain the last
   * transition and are excluded from the result set.
   */
  detectivePositions?: readonly string[];
}

/** Blocks derived from `umwelt` events in the chronicle. */
function umweltBlocks(events: readonly GameEvent[]): UmweltBlock[] {
  return events
    .filter(
      (event): event is GameEvent & { edge: { a: string; b: string }; untilRound: number } =>
        event.kind === "umwelt" && event.edge !== undefined && event.untilRound !== undefined,
    )
    .map((event) => ({
      a: event.edge.a,
      b: event.edge.b,
      round: event.round,
      untilRound: event.untilRound,
    }));
}

/** Intersects `set` with `allowed`, in place. */
function intersect(set: Set<string>, allowed: ReadonlySet<string>): void {
  for (const node of set) {
    if (!allowed.has(node)) {
      set.delete(node);
    }
  }
}

/**
 * Detective positions that were on the board at the end of round `r`
 * (their occupancy constrained the ganove's moves and positions of that
 * era). Returns `undefined` where the history is unknown — the caller's
 * `detectivePositions` fill rounds `round-1`/`round` in the live view.
 */
function occupiedAfterRound(input: DeductionInput, r: number): readonly string[] | undefined {
  if (r === 0) {
    return input.detectiveStarts;
  }
  // In the live view the detectives have not moved yet in `round`:
  // their current positions are exactly the end-of-round positions of
  // `round - 1` — and the occupancy of `round` during the ganove's move.
  if (input.detectivePositions !== undefined && (r === input.round || r === input.round - 1)) {
    return input.detectivePositions;
  }
  return input.detectiveHistory?.[r];
}

/**
 * Every node the ganove could occupy after his turn of `input.round`,
 * given all observations. Sorted for stable output; empty when the
 * observations contradict every history (legitimate under `falsche_spur`).
 */
export function deducePossiblePositions(input: DeductionInput): string[] {
  const graph = buildGraph(input.map);
  const events = input.events.filter((event) => event.visibleTo !== "ganove");
  const byRound = new Map<number, GameEvent[]>();
  for (const event of events) {
    const list = byRound.get(event.round);
    if (list === undefined) {
      byRound.set(event.round, [event]);
    } else {
      list.push(event);
    }
  }
  const blocks = umweltBlocks(events);

  // Prior: the public spawn rules against the known start positions.
  let current = new Set(ganoveSpawnChoices(input.map, input.detectiveStarts));

  for (let round = 1; round <= input.round; round += 1) {
    const fired = byRound.get(round) ?? [];
    const action = fired.find((event) => event.kind === "aktion");
    const next = new Set<string>();

    if (action !== undefined) {
      // Action round: the ganove stayed on the action node — his
      // position this round is both the previous one and the traced node.
      if (action.nodeId !== undefined && current.has(action.nodeId)) {
        next.add(action.nodeId);
      }
    } else {
      // Forced move over exactly one edge that was passable during the
      // ganove's move: a block created in this very round did not exist
      // yet at that moment, so only earlier blocks constrain the step.
      const activeBlocks: BlockedEdge[] = blocks.filter(
        (block) => block.round < round && block.untilRound >= round,
      );
      const occupied = new Set(occupiedAfterRound(input, round - 1) ?? []);
      for (const from of current) {
        for (const edge of graph.adjacency.get(from) ?? []) {
          if (occupied.has(edge.nodeId)) {
            continue;
          }
          if (!isEdgeBlocked(from, edge.nodeId, activeBlocks, round)) {
            next.add(edge.nodeId);
          }
        }
      }
    }

    // Hint constraints of this round.
    for (const event of fired) {
      if (event.kind === "hinweis") {
        if (event.nodeIds !== undefined) {
          intersect(next, new Set(event.nodeIds));
        }
      } else if (
        (event.kind === "camera" || event.kind === "sichtbarkeit" || event.kind === "aktion") &&
        event.nodeId !== undefined
      ) {
        intersect(next, new Set([event.nodeId]));
      }
    }

    // Negative camera inference: in a move round without a camera hint
    // the position cannot be an active camera node (entering fires).
    if (action === undefined && !fired.some((event) => event.kind === "camera")) {
      for (const camera of input.cameras) {
        if (camera.active) {
          next.delete(camera.nodeId);
        }
      }
    }

    // Occupancy: a detective ending round `round` on the ganove's node
    // would have caught him — in a running game his position is never
    // a node a detective ended that round on.
    const endedOn = occupiedAfterRound(input, round);
    if (endedOn !== undefined) {
      for (const node of endedOn) {
        next.delete(node);
      }
    }

    current = next;
    if (current.size === 0) {
      break;
    }
  }
  return [...current].sort();
}

/**
 * The most recent positional clue for steering ("zum letzten Hinweis"):
 * the latest event carrying an exact node (`camera`/`sichtbarkeit`/
 * `aktion`) or a zone ball (`hinweis`). Returns the event — `null` when
 * no positional hint exists yet.
 */
export function lastHintAnchor(events: readonly GameEvent[]): GameEvent | null {
  let best: GameEvent | null = null;
  for (const event of events) {
    if (event.visibleTo === "ganove") {
      continue;
    }
    const hasPosition =
      event.nodeId !== undefined || (event.nodeIds !== undefined && event.nodeIds.length > 0);
    if (hasPosition && (best === null || event.round >= best.round)) {
      best = event;
    }
  }
  return best;
}
