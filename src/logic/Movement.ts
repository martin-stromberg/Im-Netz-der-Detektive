/**
 * Movement rules for the round engine (`01-spielkonzept.md` section 3):
 * one move = one edge (both `weg` and `fahrt`), forced movement for every
 * actor (nobody may voluntarily stay), nodes occupied by detectives are
 * illegal targets for the ganove while detectives may share a node, and
 * edges listed in `blockedEdges` are impassable for both sides. The module
 * is pure — it takes the graph and positions explicitly so the same rules
 * drive the store, scripted games and later the AI, fully deterministic.
 */
import type { Graph } from "./Graph";
import type { EdgeType, MapPack } from "./mapPack";

/** An edge blocked until `untilRound` (inclusive) for both sides. */
export interface BlockedEdge {
  a: string;
  b: string;
  untilRound: number;
}

/** Everything the move rules need to know about a running game. */
export interface MoveContext {
  graph: Graph;
  round: number;
  blockedEdges: readonly BlockedEdge[];
  ganovePosition: string;
  detektivePositions: readonly string[];
}

/** A legal or validated move destination, including the traversed edge type. */
export interface MoveTarget {
  nodeId: string;
  edgeType: EdgeType;
}

export type MoveRejection =
  | "no_game"
  | "game_over"
  | "wrong_phase"
  | "not_active_detective"
  | "stay_forbidden"
  | "not_adjacent"
  | "blocked_edge"
  | "occupied"
  | "no_action_available"
  | "already_used"
  | "mission_choice_pending"
  | "no_mission_choice";

/** Raised when a move or phase action violates the movement rules. */
export class MoveError extends Error {
  readonly reason: MoveRejection;

  constructor(reason: MoveRejection, message: string) {
    super(message);
    this.name = "MoveError";
    this.reason = reason;
  }
}

/** Whether the edge between `a` and `b` is blocked during `round`. */
export function isEdgeBlocked(
  a: string,
  b: string,
  blockedEdges: readonly BlockedEdge[],
  round: number,
): boolean {
  return blockedEdges.some(
    (edge) =>
      edge.untilRound >= round &&
      ((edge.a === a && edge.b === b) || (edge.a === b && edge.b === a)),
  );
}

/**
 * Nodes reachable from `nodeId` over unblocked edges, with their edge
 * types. The current node is never listed — staying is not a move
 * (Zugzwang, section 3).
 */
export function legalMovesFrom(ctx: MoveContext, nodeId: string): MoveTarget[] {
  return (ctx.graph.adjacency.get(nodeId) ?? [])
    .filter((edge) => !isEdgeBlocked(nodeId, edge.nodeId, ctx.blockedEdges, ctx.round))
    .map((edge) => ({ nodeId: edge.nodeId, edgeType: edge.type }));
}

/** Legal ganove targets: unblocked neighbours not occupied by a detective. */
export function legalGanoveMoves(ctx: MoveContext): MoveTarget[] {
  const occupied = new Set(ctx.detektivePositions);
  return legalMovesFrom(ctx, ctx.ganovePosition).filter((target) => !occupied.has(target.nodeId));
}

/**
 * Legal targets for the detective at `detectiveIndex` (D1→Dn order).
 * Nodes occupied by other detectives stay legal — sharing is allowed.
 * Returns `[]` when the index has no detective.
 */
export function legalDetectiveMoves(ctx: MoveContext, detectiveIndex: number): MoveTarget[] {
  const position = ctx.detektivePositions[detectiveIndex];
  if (position === undefined) {
    return [];
  }
  return legalMovesFrom(ctx, position);
}

function adjacentTarget(ctx: MoveContext, from: string, to: string): MoveTarget | undefined {
  const edge = (ctx.graph.adjacency.get(from) ?? []).find((e) => e.nodeId === to);
  return edge ? { nodeId: to, edgeType: edge.type } : undefined;
}

/**
 * Shared movement rules for both sides (Zugzwang, adjacency, blocked
 * edges). `actor` only labels the error messages.
 */
function validateSharedMove(
  ctx: MoveContext,
  actor: "ganove" | "detective",
  from: string,
  target: string,
): MoveTarget {
  if (target === from) {
    throw new MoveError("stay_forbidden", `${actor} may not stay on ${JSON.stringify(target)}`);
  }
  const move = adjacentTarget(ctx, from, target);
  if (move === undefined) {
    throw new MoveError(
      "not_adjacent",
      `no edge from ${JSON.stringify(from)} to ${JSON.stringify(target)}`,
    );
  }
  if (isEdgeBlocked(from, target, ctx.blockedEdges, ctx.round)) {
    throw new MoveError(
      "blocked_edge",
      `edge ${JSON.stringify(from)}–${JSON.stringify(target)} is blocked`,
    );
  }
  return move;
}

/**
 * Validates a ganove move to `target`; returns the resolved `MoveTarget`.
 * Throws `MoveError` (`stay_forbidden`, `not_adjacent`, `blocked_edge`,
 * `occupied`) when the move is illegal.
 */
export function validateGanoveMove(ctx: MoveContext, target: string): MoveTarget {
  const move = validateSharedMove(ctx, "ganove", ctx.ganovePosition, target);
  if (ctx.detektivePositions.includes(target)) {
    throw new MoveError("occupied", `${JSON.stringify(target)} is occupied by a detective`);
  }
  return move;
}

/**
 * Validates a move of the detective at `detectiveIndex` to `target`.
 * Occupied nodes are legal targets for detectives (node sharing).
 * Throws `MoveError` (`not_active_detective`, `stay_forbidden`,
 * `not_adjacent`, `blocked_edge`) when the move is illegal.
 */
export function validateDetectiveMove(
  ctx: MoveContext,
  detectiveIndex: number,
  target: string,
): MoveTarget {
  const from = ctx.detektivePositions[detectiveIndex];
  if (from === undefined) {
    throw new MoveError("not_active_detective", `no detective at index ${detectiveIndex}`);
  }
  return validateSharedMove(ctx, "detective", from, target);
}

/** Ids of all nodes carrying the `flucht` category — the map's escape points. */
export function mapEscapeNodeIds(map: MapPack): string[] {
  return map.nodes.filter((node) => node.categories.includes("flucht")).map((node) => node.id);
}
