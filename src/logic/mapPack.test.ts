import { describe, expect, it } from "vitest";
import { MapValidationError, validateMapPack } from "./mapPack";
import teststadt from "../data/maps/teststadt.json";

function validPack(): Record<string, unknown> {
  return {
    id: "mini",
    name: "Mini",
    viewBox: "0 0 10 10",
    nodes: [
      { id: "a", name: "A", x: 0, y: 0, categories: ["diebstahl"], zone: "z1" },
      { id: "b", name: "B", x: 5, y: 5, categories: ["kontakt"], zone: "z2" },
    ],
    edges: [{ a: "a", b: "b", type: "weg" }],
    spawnRules: {
      detectives: { mode: "choice", nodes: ["a"] },
      ganove: { mode: "free", minDistanceToDetective: 2 },
      order: "detektive_first",
    },
    settings: {
      detectiveCount: { suggested: 4, min: 2, max: 6 },
      cameraCount: { suggested: 8, min: 0, max: 15 },
      roundLimit: { suggested: 30, min: 15, unlimited: true },
      radioHintCount: { suggested: 5, min: 3, max: 10 },
      edgeBlockRounds: { suggested: 3, min: 1, max: 6 },
      cameraMinGap: 2,
      hintZoneRadius: 2,
      eventMode: "tension",
      eventDefaults: { cycle: 4, chance: 0.25, threshold: 40, perRound: 10 },
      eventMix: { sichtbarkeit: 0.25, hinweis: 0.45, umwelt: 0.3 },
      missionRules: {
        minGap: 3,
        maxGap: 8,
        routeBudget: 18,
        routeBudgetSabotage: 22,
        sabotageDetour: 4,
      },
      sabotageEffects: ["kamera_aus", "funkstille", "falsche_spur"],
    },
  };
}

function errorsOf(data: unknown): string[] {
  try {
    validateMapPack(data);
  } catch (e) {
    expect(e).toBeInstanceOf(MapValidationError);
    return (e as MapValidationError).errors.slice();
  }
  throw new Error("expected MapValidationError");
}

describe("validateMapPack", () => {
  it("accepts a valid minimal package", () => {
    const pack = validateMapPack(validPack());
    expect(pack.id).toBe("mini");
    expect(pack.nodes).toHaveLength(2);
  });

  it("accepts the bundled teststadt package", () => {
    const pack = validateMapPack(teststadt);
    expect(pack.id).toBe("teststadt");
    expect(pack.edges.some((e) => e.type === "fahrt")).toBe(true);
  });

  it("rejects non-object input", () => {
    expect(() => validateMapPack(null)).toThrow(MapValidationError);
    expect(() => validateMapPack([1, 2])).toThrow(MapValidationError);
  });

  it("rejects a package with missing required fields and names them", () => {
    const pack = validPack();
    delete pack.nodes;
    delete pack.edges;
    delete pack.spawnRules;
    delete pack.settings;
    delete pack.id;
    const errors = errorsOf(pack);
    expect(errors.join("\n")).toContain("id:");
    expect(errors.join("\n")).toContain("nodes:");
    expect(errors.join("\n")).toContain("edges:");
    expect(errors.join("\n")).toContain("spawnRules:");
    expect(errors.join("\n")).toContain("settings:");
  });

  it("rejects an invalid edge type", () => {
    const pack = validPack();
    (pack.edges as { type: string }[])[0].type = "teleport";
    expect(errorsOf(pack).join("\n")).toContain("edges[0].type");
  });

  it("rejects an edge referencing an unknown node", () => {
    const pack = validPack();
    (pack.edges as { b: string }[])[0].b = "ghost";
    expect(errorsOf(pack).join("\n")).toContain("edges[0].b");
  });

  it("rejects duplicate node ids", () => {
    const pack = validPack();
    (pack.nodes as { id: string }[])[1].id = "a";
    expect(errorsOf(pack).join("\n")).toContain("duplicate node id");
  });

  it("rejects invalid node categories", () => {
    const pack = validPack();
    (pack.nodes as { categories: string[] }[])[0].categories = ["raub"];
    expect(errorsOf(pack).join("\n")).toContain("nodes[0].categories");
  });

  it("rejects a spawnRules.order other than detektive_first", () => {
    const pack = validPack();
    (pack.spawnRules as { order: string }).order = "ganove_first";
    expect(errorsOf(pack).join("\n")).toContain("spawnRules.order");
  });

  it("rejects choice mode without nodes or zones", () => {
    const pack = validPack();
    pack.spawnRules = {
      detectives: { mode: "choice" },
      ganove: { mode: "free" },
      order: "detektive_first",
    };
    expect(errorsOf(pack).join("\n")).toContain('mode "choice"');
  });

  it("rejects a choice rule with an empty zones list", () => {
    const pack = validPack();
    pack.spawnRules = {
      detectives: { mode: "choice", zones: [] },
      ganove: { mode: "free" },
      order: "detektive_first",
    };
    expect(errorsOf(pack).join("\n")).toContain("spawnRules.detectives.zones");
  });

  it("rejects a choice rule whose zones field is not an array", () => {
    const pack = validPack();
    pack.spawnRules = {
      detectives: { mode: "choice", nodes: ["a"], zones: "z1" },
      ganove: { mode: "free" },
      order: "detektive_first",
    };
    const errors = errorsOf(pack).join("\n");
    expect(errors).toContain("spawnRules.detectives.zones");
    expect(errors).toContain("must be an array");
  });

  it("rejects a choice rule with a non-string zone entry", () => {
    const pack = validPack();
    pack.spawnRules = {
      detectives: { mode: "choice", zones: [42] },
      ganove: { mode: "free" },
      order: "detektive_first",
    };
    const errors = errorsOf(pack).join("\n");
    expect(errors).toContain("spawnRules.detectives.zones");
    expect(errors).toContain("unknown zone");
  });

  it("rejects a choice rule referencing an unknown zone", () => {
    const pack = validPack();
    pack.spawnRules = {
      detectives: { mode: "choice", zones: ["nirgendwo"] },
      ganove: { mode: "choice", nodes: ["b"], zones: ["hinterm-mond"] },
      order: "detektive_first",
    };
    const errors = errorsOf(pack);
    expect(errors.join("\n")).toContain("spawnRules.detectives.zones: unknown zone");
    expect(errors.join("\n")).toContain("spawnRules.ganove.zones: unknown zone");
  });

  it("accepts a valid package using zones in choice rules", () => {
    const pack = validPack();
    pack.spawnRules = {
      detectives: { mode: "choice", zones: ["z1"] },
      ganove: { mode: "choice", nodes: ["b"], zones: ["z2"] },
      order: "detektive_first",
    };
    const validated = validateMapPack(pack);
    expect(validated.spawnRules.detectives.zones).toEqual(["z1"]);
    expect(validated.spawnRules.ganove.zones).toEqual(["z2"]);
  });

  it("rejects a suggested value outside [min, max]", () => {
    const pack = validPack();
    (pack.settings as { detectiveCount: { suggested: number } }).detectiveCount.suggested = 99;
    expect(errorsOf(pack).join("\n")).toContain("settings.detectiveCount.suggested");
  });

  it("rejects roundLimit without max and without unlimited", () => {
    const pack = validPack();
    (pack.settings as Record<string, unknown>).roundLimit = { suggested: 30, min: 15 };
    expect(errorsOf(pack).join("\n")).toContain("settings.roundLimit.max");
  });

  it("rejects invalid sabotage effects", () => {
    const pack = validPack();
    (pack.settings as { sabotageEffects: string[] }).sabotageEffects = ["verkleidung"];
    expect(errorsOf(pack).join("\n")).toContain("settings.sabotageEffects");
  });

  it("aggregates multiple violations into one error", () => {
    const pack = validPack();
    delete pack.viewBox;
    (pack.edges as { type: string }[])[0].type = "portal";
    const errors = errorsOf(pack);
    expect(errors.length).toBeGreaterThanOrEqual(2);
    expect(errors.join("\n")).toContain("viewBox");
    expect(errors.join("\n")).toContain("edges[0].type");
  });
});
