import { describe, expect, it } from "vitest";
import { buildGraph } from "./Graph";
import { loadMap } from "./MapLoader";
import type { MapPack } from "./mapPack";
import {
  ACTION_ROUNDS,
  drawSabotageEffect,
  executableMissionAction,
  generateMission,
  isNodeCategory,
  missionCriteriaViolations,
  MissionGenerationError,
  missionStructure,
  missionTargetIds,
  MissionValidationError,
  nodesByCategory,
  sabotageDuration,
  validateCustomTargets,
  validateMissionSet,
  type MissionTargets,
} from "./MissionSystem";
import { createRng } from "./rng";

const muenster = loadMap("muenster");
const luebeck = loadMap("luebeck");
const teststadt = loadMap("teststadt");
const muensterGraph = buildGraph(muenster);
const teststadtGraph = buildGraph(teststadt);
const rules = muenster.settings.missionRules;
const testRules = teststadt.settings.missionRules;

/** Map without any mission-relevant categories (like the endings-test fixtures). */
const poollessMap: MapPack = {
  ...teststadt,
  id: "poolless",
  nodes: teststadt.nodes.map((node) => ({ ...node, categories: ["kontakt"] })),
};

describe("nodesByCategory / missionTargetIds", () => {
  it("lists the category pools of a map", () => {
    expect(nodesByCategory(muenster, "diebstahl")).toHaveLength(17);
    expect(nodesByCategory(muenster, "kontakt")).toHaveLength(32);
    expect(nodesByCategory(muenster, "sabotage")).toHaveLength(6);
    expect(nodesByCategory(muenster, "flucht")).toHaveLength(7);
    expect(nodesByCategory(teststadt, "sabotage")).toHaveLength(0);
  });

  it("collects all target ids, skipping a missing sabotage slot", () => {
    const targets: MissionTargets = {
      diebstahl: "schloss",
      kontakt: "wienburgpark",
      sabotage: null,
      flucht: "hafenpier",
    };
    expect(missionTargetIds(targets)).toEqual(["schloss", "wienburgpark", "hafenpier"]);
  });
});

describe("missionCriteriaViolations", () => {
  const valid: MissionTargets = {
    diebstahl: "schloss",
    kontakt: "wienburgpark",
    sabotage: "stadtwerke",
    flucht: "hafenpier",
  };

  it("accepts a conforming target set", () => {
    expect(missionCriteriaViolations(muensterGraph, rules, valid, "domplatz")).toEqual([]);
    // Without a start only the necessary part of the route budget applies.
    expect(missionCriteriaViolations(muensterGraph, rules, valid, null)).toEqual([]);
  });

  it("flags pairwise distances below minGap", () => {
    // a and e are 2 edges apart on teststadt (minGap is 3).
    const targets: MissionTargets = {
      diebstahl: "a",
      kontakt: "e",
      sabotage: null,
      flucht: "d",
    };
    const violations = missionCriteriaViolations(teststadtGraph, testRules, targets, null);
    expect(violations.some((code) => code.startsWith("min_gap"))).toBe(true);
  });

  it("flags consecutive distances above maxGap", () => {
    const tightRules = { ...rules, maxGap: 2 };
    const violations = missionCriteriaViolations(muensterGraph, tightRules, valid, null);
    expect(violations.some((code) => code.startsWith("max_gap"))).toBe(true);
  });

  it("requires the escape point >= 4 from kontakt and >= 3 from diebstahl", () => {
    const targets: MissionTargets = {
      diebstahl: "a",
      kontakt: "e",
      sabotage: null,
      flucht: "b",
    };
    const violations = missionCriteriaViolations(teststadtGraph, testRules, targets, null);
    expect(violations).toContain("flucht_kontakt_gap");
    expect(violations).toContain("flucht_diebstahl_gap");
  });

  it("flags a sabotage detour above the budget", () => {
    const targets: MissionTargets = {
      diebstahl: "schloss",
      kontakt: "schlosspark",
      sabotage: "polizei",
      flucht: "hafenpier",
    };
    const zeroDetour = { ...rules, sabotageDetour: 0 };
    expect(missionCriteriaViolations(muensterGraph, zeroDetour, targets, null)).toContain(
      "sabotage_detour",
    );
  });

  it("flags route budgets including the +3 action rounds", () => {
    const tight = { ...rules, routeBudget: 8 };
    const violations = missionCriteriaViolations(muensterGraph, tight, valid, "domplatz");
    expect(violations).toContain("route_budget");
    const tightSab = { ...rules, routeBudgetSabotage: 10 };
    expect(missionCriteriaViolations(muensterGraph, tightSab, valid, "domplatz")).toContain(
      "route_budget_sabotage",
    );
  });

  it("treats unreachable targets as violations", () => {
    // Two components: a-b and c-d — d unreachable from a.
    const broken: MapPack = {
      ...teststadt,
      id: "broken",
      edges: teststadt.edges.filter(
        (edge) => !(edge.a === "b" && edge.b === "c") && !(edge.a === "b" && edge.b === "e"),
      ),
    };
    const targets: MissionTargets = {
      diebstahl: "a",
      kontakt: "j",
      sabotage: null,
      flucht: "d",
    };
    const violations = missionCriteriaViolations(buildGraph(broken), testRules, targets, "a");
    expect(violations.length).toBeGreaterThan(0);
  });
});

describe("generateMission", () => {
  it("produces criterion-conforming missions across many seeds (muenster)", () => {
    const starts = ["domplatz", "hbf", "aasee_terrassen", "hiltrup", "zentrum_nord"];
    for (let seed = 1; seed <= 200; seed += 1) {
      const rng = createRng(seed);
      const start = starts[seed % starts.length];
      const targets = generateMission(muenster, muensterGraph, start, rng);
      expect(
        missionCriteriaViolations(muensterGraph, rules, targets, start),
        `seed ${seed} start ${start}`,
      ).toEqual([]);
    }
  });

  it("produces criterion-conforming missions across many seeds (luebeck)", () => {
    const graph = buildGraph(luebeck);
    const luebeckRules = luebeck.settings.missionRules;
    // hbf allows no conforming mission on luebeck, rathaus does — both
    // behaviours are exercised deterministically (small attempt budget
    // keeps the rejection path fast).
    for (const start of ["rathaus", "hbf"]) {
      let generated = 0;
      for (let seed = 1; seed <= 60; seed += 1) {
        try {
          const targets = generateMission(luebeck, graph, start, createRng(seed), 400);
          expect(missionCriteriaViolations(graph, luebeckRules, targets, start)).toEqual([]);
          generated += 1;
        } catch (error) {
          expect(error).toBeInstanceOf(MissionGenerationError);
        }
      }
      if (start === "hbf") {
        expect(generated).toBe(0);
      } else {
        expect(generated).toBeGreaterThan(0);
      }
    }
  });

  it("generates the only conforming mission on teststadt (no sabotage pool)", () => {
    const targets = generateMission(teststadt, teststadtGraph, "e", createRng(1));
    expect(targets).toEqual({ diebstahl: "a", kontakt: "j", sabotage: null, flucht: "d" });
  });

  it("is deterministic for the same seed and start", () => {
    const a = generateMission(muenster, muensterGraph, "hbf", createRng(42));
    const b = generateMission(muenster, muensterGraph, "hbf", createRng(42));
    expect(a).toEqual(b);
  });

  it("throws MissionGenerationError when a required pool is missing", () => {
    expect(() => generateMission(poollessMap, buildGraph(poollessMap), "a", createRng(1))).toThrow(
      MissionGenerationError,
    );
  });

  it("throws MissionGenerationError when the attempt budget is exhausted", () => {
    expect(() => generateMission(teststadt, teststadtGraph, "a", createRng(1), 0)).toThrow(
      MissionGenerationError,
    );
  });
});

describe("validateCustomTargets", () => {
  const start = "e";

  it("accepts the only valid teststadt mission", () => {
    const targets: MissionTargets = {
      diebstahl: "a",
      kontakt: "j",
      sabotage: null,
      flucht: "d",
    };
    expect(validateCustomTargets(teststadt, teststadtGraph, targets, start)).toEqual([]);
  });

  it("reports unknown node ids", () => {
    const targets: MissionTargets = {
      diebstahl: "nirgendwo",
      kontakt: "j",
      sabotage: null,
      flucht: "d",
    };
    const errors = validateCustomTargets(teststadt, teststadtGraph, targets, start);
    expect(errors.some((entry) => entry.includes("unknown node id"))).toBe(true);
  });

  it("reports nodes lacking the required category", () => {
    const targets: MissionTargets = {
      diebstahl: "e", // kontakt node, not diebstahl
      kontakt: "j",
      sabotage: null,
      flucht: "d",
    };
    const errors = validateCustomTargets(teststadt, teststadtGraph, targets, start);
    expect(errors.some((entry) => entry.includes("lacks"))).toBe(true);
  });

  it("reports duplicated roles", () => {
    const targets: MissionTargets = {
      diebstahl: "a",
      kontakt: "a",
      sabotage: null,
      flucht: "d",
    };
    const errors = validateCustomTargets(teststadt, teststadtGraph, targets, start);
    expect(errors.some((entry) => entry.includes("multiple mission roles"))).toBe(true);
  });

  it("reports criteria violations", () => {
    const targets: MissionTargets = {
      diebstahl: "a",
      kontakt: "e",
      sabotage: null,
      flucht: "b",
    };
    const errors = validateCustomTargets(teststadt, teststadtGraph, targets, start);
    expect(errors.some((entry) => entry.startsWith("criteria:"))).toBe(true);
  });
});

describe("validateMissionSet", () => {
  const validSet = {
    mapId: "muenster",
    cases: [
      {
        id: "fall-1",
        name: "Fall Eins",
        story: "Eine Geschichte.",
        diebstahl: "schloss",
        kontakt: "wienburgpark",
        flucht: "hafenpier",
        sabotage: "stadtwerke",
      },
    ],
  };

  it("accepts a valid set", () => {
    const set = validateMissionSet(validSet, muenster);
    expect(set.cases).toHaveLength(1);
    expect(set.cases[0].id).toBe("fall-1");
  });

  it("rejects a non-object payload", () => {
    expect(() => validateMissionSet([1, 2], muenster)).toThrow(MissionValidationError);
  });

  it("collects every schema violation", () => {
    const broken = {
      mapId: "luebeck",
      cases: [
        { id: "x", name: "", story: "s", diebstahl: "nirgendwo", kontakt: "e", flucht: "d" },
        { id: "x", name: "n", story: "s", diebstahl: "schloss", kontakt: "k", flucht: "f" },
      ],
    };
    try {
      validateMissionSet(broken, muenster);
      expect.unreachable("should have thrown");
    } catch (error) {
      const errors = (error as MissionValidationError).errors;
      expect(errors.some((entry) => entry.startsWith("mapId:"))).toBe(true);
      expect(errors.some((entry) => entry.includes(".name"))).toBe(true);
      expect(errors.some((entry) => entry.includes("unknown node id"))).toBe(true);
      expect(errors.some((entry) => entry.includes("duplicate case id"))).toBe(true);
    }
  });

  it("rejects a wrong category and an invalid sabotageEffect", () => {
    const broken = {
      mapId: "muenster",
      cases: [
        {
          id: "f1",
          name: "n",
          story: "s",
          diebstahl: "schlosspark", // kontakt node
          kontakt: "wienburgpark",
          flucht: "hafenpier",
          sabotage: "domplatz", // not a sabotage node
          sabotageEffect: "explosion",
        },
      ],
    };
    const errors = (() => {
      try {
        validateMissionSet(broken, muenster);
      } catch (error) {
        return (error as MissionValidationError).errors;
      }
      return [] as string[];
    })();
    expect(errors.some((entry) => entry.includes("lacks"))).toBe(true);
    expect(errors.some((entry) => entry.includes("sabotageEffect"))).toBe(true);
  });

  it("rejects a sabotageEffect outside the map's pool", () => {
    const set = {
      mapId: "luebeck",
      cases: [
        {
          id: "f1",
          name: "n",
          story: "s",
          diebstahl: "a1",
          kontakt: "b1",
          flucht: "f1",
          sabotageEffect: "kamera_aus", // not in luebeck's pool
        },
      ],
    };
    expect(() => validateMissionSet(set, luebeck)).toThrow(MissionValidationError);
  });
});

describe("executableMissionAction", () => {
  const mission = {
    targets: { diebstahl: "d", kontakt: "k", sabotage: "x", flucht: "f" },
    stage: "diebstahl" as const,
    pendingChoice: null,
  };

  it("allows the action only at the current stage's target node", () => {
    expect(executableMissionAction(mission, "d")).toBe("diebstahl");
    expect(executableMissionAction(mission, "k")).toBeNull();
    expect(executableMissionAction(mission, "f")).toBeNull();
    expect(executableMissionAction({ ...mission, stage: "kontakt" }, "k")).toBe("kontakt");
    expect(executableMissionAction({ ...mission, stage: "sabotage" }, "x")).toBe("sabotage");
    expect(executableMissionAction({ ...mission, stage: "flucht" }, "f")).toBeNull();
  });

  it("returns null without mission, position or during a pending choice", () => {
    expect(executableMissionAction(null, "d")).toBeNull();
    expect(executableMissionAction(mission, null)).toBeNull();
    const wahl = {
      ...mission,
      stage: "wahl" as const,
      pendingChoice: { sabotageNode: "x", effect: "kamera_aus" as const },
    };
    expect(executableMissionAction(wahl, "k")).toBeNull();
  });
});

describe("missionStructure (detective-facing view)", () => {
  const targets = {
    diebstahl: "schloss",
    kontakt: "wienburgpark",
    sabotage: "stadtwerke",
    flucht: "hafenpier",
  };

  it("never exposes target node ids", () => {
    for (const stage of ["diebstahl", "kontakt", "wahl", "sabotage", "flucht"] as const) {
      const structure = missionStructure({ targets, stage });
      for (const id of missionTargetIds(targets)) {
        expect(JSON.stringify(structure)).not.toContain(id);
      }
    }
  });

  it("reflects the fixed order and per-step status", () => {
    expect(missionStructure({ targets, stage: "diebstahl" })).toEqual([
      { kind: "diebstahl", status: "aktuell" },
      { kind: "kontakt", status: "offen" },
      { kind: "sabotage", status: "offen" },
      { kind: "flucht", status: "offen" },
    ]);
    expect(missionStructure({ targets, stage: "wahl" })).toEqual([
      { kind: "diebstahl", status: "erledigt" },
      { kind: "kontakt", status: "erledigt" },
      { kind: "sabotage", status: "offen" },
      { kind: "flucht", status: "offen" },
    ]);
    expect(missionStructure({ targets: { ...targets, sabotage: null }, stage: "flucht" })).toEqual([
      { kind: "diebstahl", status: "erledigt" },
      { kind: "kontakt", status: "erledigt" },
      { kind: "flucht", status: "aktuell" },
    ]);
    expect(missionStructure(null)).toEqual([]);
  });
});

describe("sabotage helpers", () => {
  it("draws effects only from the map's pool", () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const effect = drawSabotageEffect(muenster, createRng(seed));
      expect(muenster.settings.sabotageEffects).toContain(effect);
      const lb = drawSabotageEffect(luebeck, createRng(seed));
      expect(luebeck.settings.sabotageEffects).toContain(lb);
      expect(lb).not.toBe("kamera_aus");
    }
  });

  it("derives the sabotage duration from the map's event cycle", () => {
    expect(sabotageDuration(muenster)).toBe(muenster.settings.eventDefaults.cycle);
    expect(sabotageDuration(luebeck)).toBe(luebeck.settings.eventDefaults.cycle);
  });

  it("guards the node-category type", () => {
    expect(isNodeCategory("diebstahl")).toBe(true);
    expect(isNodeCategory("keks")).toBe(false);
  });
});

describe("ACTION_ROUNDS", () => {
  it("matches the spec's +3 action rounds", () => {
    expect(ACTION_ROUNDS).toBe(3);
  });
});
