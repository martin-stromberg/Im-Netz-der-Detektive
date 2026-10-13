import { describe, expect, it } from "vitest";
import { buildGraph } from "./Graph";
import { loadMap } from "./MapLoader";
import {
  isEdgeBlocked,
  legalDetectiveMoves,
  legalGanoveMoves,
  legalMovesFrom,
  mapEscapeNodeIds,
  MoveError,
  validateDetectiveMove,
  validateGanoveMove,
  type BlockedEdge,
  type MoveContext,
} from "./Movement";

const map = loadMap("teststadt");
const graph = buildGraph(map);

function ctx(overrides: Partial<MoveContext> = {}): MoveContext {
  return {
    graph,
    round: 1,
    blockedEdges: [],
    ganovePosition: "d",
    detektivePositions: ["a", "i"],
    ...overrides,
  };
}

function reasonOf(fn: () => void): string {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(MoveError);
    return (error as MoveError).reason;
  }
  throw new Error("expected MoveError");
}

describe("isEdgeBlocked", () => {
  const blocks: BlockedEdge[] = [{ a: "c", b: "d", untilRound: 2 }];

  it("blocks in both directions while untilRound is not reached", () => {
    expect(isEdgeBlocked("c", "d", blocks, 2)).toBe(true);
    expect(isEdgeBlocked("d", "c", blocks, 1)).toBe(true);
  });

  it("is open again after untilRound has passed", () => {
    expect(isEdgeBlocked("c", "d", blocks, 3)).toBe(false);
  });
});

describe("legalMovesFrom", () => {
  it("returns all neighbours with their edge type", () => {
    const moves = legalMovesFrom(ctx(), "g");
    expect(moves).toEqual([
      { nodeId: "f", edgeType: "fahrt" },
      { nodeId: "d", edgeType: "weg" },
      { nodeId: "h", edgeType: "weg" },
    ]);
  });

  it("filters blocked edges", () => {
    const moves = legalMovesFrom(ctx({ blockedEdges: [{ a: "c", b: "d", untilRound: 3 }] }), "d");
    expect(moves.map((m) => m.nodeId)).toEqual(["g"]);
  });

  it("returns an empty list for unknown nodes", () => {
    expect(legalMovesFrom(ctx(), "nirgendwo")).toEqual([]);
  });
});

describe("legalGanoveMoves", () => {
  it("excludes detective-occupied nodes", () => {
    const moves = legalGanoveMoves(ctx({ ganovePosition: "b", detektivePositions: ["c", "i"] }));
    expect(moves.map((m) => m.nodeId).sort()).toEqual(["a", "e"]);
  });

  it("returns empty when every neighbour is occupied or blocked", () => {
    const moves = legalGanoveMoves(ctx({ detektivePositions: ["c", "g"], blockedEdges: [] }));
    expect(moves).toEqual([]);
  });
});

describe("legalDetectiveMoves", () => {
  it("keeps nodes occupied by other detectives legal (sharing allowed)", () => {
    const moves = legalDetectiveMoves(
      ctx({ detektivePositions: ["a", "i"], ganovePosition: "d" }),
      0,
    );
    expect(moves.map((m) => m.nodeId)).toEqual(["b"]);
  });

  it("filters blocked edges for detectives as well", () => {
    const moves = legalDetectiveMoves(
      ctx({ blockedEdges: [{ a: "a", b: "b", untilRound: 1 }] }),
      0,
    );
    expect(moves).toEqual([]);
  });

  it("returns empty for an out-of-range detective index", () => {
    expect(legalDetectiveMoves(ctx(), 7)).toEqual([]);
  });
});

describe("validateGanoveMove", () => {
  it("rejects staying on the same node (Zugzwang)", () => {
    expect(reasonOf(() => validateGanoveMove(ctx(), "d"))).toBe("stay_forbidden");
  });

  it("rejects non-adjacent targets", () => {
    expect(reasonOf(() => validateGanoveMove(ctx(), "h"))).toBe("not_adjacent");
  });

  it("rejects targets over a blocked edge", () => {
    const blocked = ctx({ blockedEdges: [{ a: "d", b: "g", untilRound: 1 }] });
    expect(reasonOf(() => validateGanoveMove(blocked, "g"))).toBe("blocked_edge");
  });

  it("rejects detective-occupied targets", () => {
    const occupied = ctx({ detektivePositions: ["c", "i"] });
    expect(reasonOf(() => validateGanoveMove(occupied, "c"))).toBe("occupied");
  });

  it("returns the target with edge type on success", () => {
    expect(validateGanoveMove(ctx({ ganovePosition: "g" }), "f")).toEqual({
      nodeId: "f",
      edgeType: "fahrt",
    });
  });
});

describe("validateDetectiveMove", () => {
  it("rejects an out-of-range detective index", () => {
    expect(reasonOf(() => validateDetectiveMove(ctx(), 5, "b"))).toBe("not_active_detective");
  });

  it("rejects staying on the same node (Zugzwang)", () => {
    expect(reasonOf(() => validateDetectiveMove(ctx(), 0, "a"))).toBe("stay_forbidden");
  });

  it("rejects non-adjacent targets", () => {
    expect(reasonOf(() => validateDetectiveMove(ctx(), 0, "d"))).toBe("not_adjacent");
  });

  it("rejects targets over a blocked edge", () => {
    const blocked = ctx({ blockedEdges: [{ a: "a", b: "b", untilRound: 2 }], round: 1 });
    expect(reasonOf(() => validateDetectiveMove(blocked, 0, "b"))).toBe("blocked_edge");
  });

  it("accepts a node occupied by another detective (sharing)", () => {
    const sharing = ctx({ detektivePositions: ["i", "j"] });
    expect(validateDetectiveMove(sharing, 1, "i")).toEqual({ nodeId: "i", edgeType: "weg" });
  });
});

describe("mapEscapeNodeIds", () => {
  it("collects every node carrying the flucht category", () => {
    expect(mapEscapeNodeIds(map)).toEqual(["b", "d", "g"]);
  });
});
