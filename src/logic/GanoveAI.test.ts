import { describe, expect, it } from "vitest";
import { chooseGanoveTurn, chooseSabotagePath, shouldUseRadio, type GanoveView } from "./GanoveAI";
import { legalGanoveMoves, type MoveContext } from "./Movement";
import { buildGraph } from "./Graph";
import { loadMap } from "./MapLoader";
import { createRng } from "./rng";
import type { GameEvent } from "./InformationSystem";
import type { Mission } from "../state/gameStore";

const teststadt = loadMap("teststadt");
const graph = buildGraph(teststadt);

function makeMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: "custom",
    targets: { diebstahl: "f", kontakt: "i", flucht: "b", sabotage: null },
    stage: "diebstahl",
    pendingChoice: null,
    offeredEffect: null,
    appliedEffect: null,
    ...overrides,
  };
}

function makeView(overrides: Partial<GanoveView> = {}): GanoveView {
  const view: GanoveView = {
    map: teststadt,
    round: 5,
    roundLimit: 30,
    ganovePosition: "e",
    detektivePositions: ["a", "i"],
    mission: makeMission(),
    events: [],
    blockedEdges: [],
    heatLevel: "ruhig",
    heatScore: 0,
    radioUsed: false,
    escapeNodeIds: ["b", "d", "g"],
    legalMoves: [],
    missionAction: null,
    cameFromNodeId: null,
    ...overrides,
  };
  const ctx: MoveContext = {
    graph,
    round: view.round,
    blockedEdges: view.blockedEdges,
    ganovePosition: view.ganovePosition,
    detektivePositions: view.detektivePositions,
  };
  view.legalMoves = overrides.legalMoves ?? legalGanoveMoves(ctx);
  return view;
}

describe("chooseGanoveTurn — Mission-Routing", () => {
  it("moves toward the current mission target", () => {
    // At e, target f (diebstahl) — f itself is the best move.
    const view = makeView({ ganovePosition: "e" });
    const turn = chooseGanoveTurn(view, createRng(1));
    expect(turn).toEqual({ type: "move", target: "f" });
  });

  it("executes the mission action at the target when it is safe", () => {
    const view = makeView({ ganovePosition: "f", missionAction: "diebstahl" });
    expect(chooseGanoveTurn(view, createRng(1))).toEqual({ type: "action" });
  });

  it("refuses the action while a detective is adjacent", () => {
    // Detective at c is one edge from f — standing still means capture.
    const view = makeView({
      ganovePosition: "f",
      missionAction: "diebstahl",
      detektivePositions: ["c", "i"],
    });
    const turn = chooseGanoveTurn(view, createRng(1));
    expect(turn.type).toBe("move");
  });

  it("acts at critical heat — heat never vetoes an action (step-14 calibration)", () => {
    // Stalling on the target while the trail is hot only hands the
    // squad more rounds of deduction; the survival floor is the only
    // gate left.
    const view = makeView({
      ganovePosition: "f",
      missionAction: "diebstahl",
      detektivePositions: ["a", "i"],
      heatLevel: "kritisch",
      heatScore: 6,
      round: 5,
      roundLimit: 30,
    });
    expect(chooseGanoveTurn(view, createRng(1))).toEqual({ type: "action" });
  });

  it("does not ping-pong back onto the node it just left", () => {
    // cameFromNodeId feeds the anti-oscillation tie-break: between two
    // otherwise equal moves the one that does not reverse the last step
    // wins. At e with target f both f and the came-from node c are
    // legal; the AI must not choose c when an equal-or-better option
    // exists.
    const view = makeView({
      ganovePosition: "e",
      cameFromNodeId: "c",
      detektivePositions: ["i"],
      mission: makeMission({
        targets: { diebstahl: "f", kontakt: "i", flucht: "b", sabotage: null },
      }),
    });
    const turn = chooseGanoveTurn(view, createRng(1));
    expect(turn.type).toBe("move");
    expect(turn.type === "move" ? turn.target : null).not.toBe("c");
  });

  it("avoids landing within reach of a detective when alternatives exist", () => {
    // At f with a detective on d: c and g are one edge from d (catchable
    // this round), only e stays ≥2 — the AI must pick e regardless of
    // the mission direction.
    const view = makeView({
      ganovePosition: "f",
      detektivePositions: ["d"],
      mission: makeMission({
        targets: { diebstahl: "h", kontakt: "i", flucht: "b", sabotage: null },
      }),
    });
    const turn = chooseGanoveTurn(view, createRng(1));
    expect(turn).toEqual({ type: "move", target: "e" });
  });

  it("avoids camera nodes revealed by the police radio", () => {
    // At e, target i (kontakt stage): h and j are equidistant to i;
    // the radio revealed h as a triggered camera → prefer j.
    const radio: GameEvent = {
      kind: "polizeifunk",
      round: 4,
      visibleTo: "ganove",
      details: { hints: [{ kind: "camera", round: 3, nodeId: "h" }] },
    };
    const view = makeView({
      ganovePosition: "e",
      detektivePositions: ["a", "c"],
      mission: makeMission({ stage: "kontakt" }),
      events: [radio],
    });
    // legal from e: b,f,h,j. dist to i: h→i=1, j→i=1, b→i=3, f→i=3.
    expect(chooseGanoveTurn(view, createRng(1))).toEqual({ type: "move", target: "j" });
  });

  it("returns the only legal fallback when boxed in", () => {
    const view = makeView({ ganovePosition: "e", legalMoves: [] });
    expect(() => chooseGanoveTurn({ ...view, legalMoves: [] }, createRng(1))).toThrow(RangeError);
  });
});

describe("chooseSabotagePath — Binärwahl", () => {
  function wahlView(sabotageNode: string, heat: "ruhig" | "kritisch" = "ruhig"): GanoveView {
    return makeView({
      ganovePosition: "i",
      mission: makeMission({
        stage: "wahl",
        targets: { diebstahl: "f", kontakt: "i", flucht: "b", sabotage: sabotageNode },
        pendingChoice: { sabotageNode, effect: "funkstille" },
      }),
      heatLevel: heat,
      heatScore: heat === "kritisch" ? 6 : 0,
    });
  }

  it("accepts a cheap detour below the sabotageDetour budget", () => {
    // kontakt i → sabotage g → flucht b: d(i-g)=2, d(g-b)=3, d(i-b)=3 →
    // detour 2 ≤ 4 → accept.
    expect(chooseSabotagePath(wahlView("g"))).toBe("sabotage");
  });

  it("declines a detour beyond the acceptance bound", () => {
    // muenster: kontakt domplatz → sabotage stadtwerke → flucht
    // wolbeck is a detour of 8 — well beyond SABOTAGE_ACCEPT_DETOUR,
    // so the direct escape wins even though the offer is on the table.
    const muenster = loadMap("muenster");
    const view = makeView({
      map: muenster,
      ganovePosition: "domplatz",
      legalMoves: [],
      mission: makeMission({
        stage: "wahl",
        targets: {
          diebstahl: "rathaus",
          kontakt: "domplatz",
          flucht: "wolbeck",
          sabotage: "stadtwerke",
        },
        pendingChoice: { sabotageNode: "stadtwerke", effect: "funkstille" },
      }),
    });
    expect(chooseSabotagePath(view)).toBe("flucht");
  });

  it("accepts a cheap detour even at critical heat (step-14 calibration)", () => {
    expect(chooseSabotagePath(wahlView("g", "kritisch"))).toBe("sabotage");
  });

  it("declines when the mission carries no sabotage target", () => {
    const noSab = makeView({
      mission: makeMission({
        stage: "wahl",
        targets: { diebstahl: "f", kontakt: "i", flucht: "b", sabotage: null },
        pendingChoice: { sabotageNode: "j", effect: "funkstille" },
      }),
    });
    expect(chooseSabotagePath(noSab)).toBe("flucht");
  });
});

describe("shouldUseRadio", () => {
  it("fires once heat reaches the threshold, only once per game", () => {
    // RADIO_HEAT_THRESHOLD = 1 (step-14 calibration): the radio taps as
    // soon as any hint activity exists so triggered cameras become
    // known before the ganove re-enters them.
    expect(shouldUseRadio(makeView({ heatScore: 1 }))).toBe(true);
    expect(shouldUseRadio(makeView({ heatScore: 0 }))).toBe(false);
    expect(shouldUseRadio(makeView({ heatScore: 6, radioUsed: true }))).toBe(false);
  });
});
