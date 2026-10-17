import { describe, expect, it } from "vitest";
import { loadMap } from "./MapLoader";
import {
  getMissionCase,
  hasMissionSet,
  listMissionSetIds,
  loadMissionSet,
  resolveFixedTargets,
} from "./MissionLoader";
import { MissionValidationError } from "./MissionSystem";

const muenster = loadMap("muenster");
const teststadt = loadMap("teststadt");

describe("listMissionSetIds / hasMissionSet", () => {
  it("lists bundled mission sets and reports availability per map", () => {
    expect(listMissionSetIds()).toContain("muenster");
    expect(hasMissionSet("muenster")).toBe(true);
    expect(hasMissionSet("luebeck")).toBe(false);
    expect(hasMissionSet("teststadt")).toBe(false);
  });
});

describe("loadMissionSet", () => {
  it("loads and validates the muenster mission set", () => {
    const set = loadMissionSet(muenster);
    expect(set.mapId).toBe("muenster");
    expect(set.cases.length).toBeGreaterThanOrEqual(2);
    for (const entry of set.cases) {
      expect(entry.id).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.story).toBeTruthy();
    }
  });

  it("throws MissionValidationError for a map without a bundled set", () => {
    expect(() => loadMissionSet(teststadt)).toThrow(MissionValidationError);
    try {
      loadMissionSet(teststadt);
    } catch (error) {
      expect((error as MissionValidationError).errors[0]).toContain("muenster");
    }
  });
});

describe("getMissionCase", () => {
  const set = loadMissionSet(muenster);

  it("returns the named case", () => {
    const entry = getMissionCase(set, "diebstahlserie-altstadt");
    expect(entry.name).toContain("Altstadt");
    expect(entry.diebstahl).toBe("schloss");
  });

  it("throws for an unknown case id, naming the available cases", () => {
    expect(() => getMissionCase(set, "gibts-nicht")).toThrow(MissionValidationError);
    try {
      getMissionCase(set, "gibts-nicht");
    } catch (error) {
      expect((error as MissionValidationError).errors[0]).toContain("diebstahlserie-altstadt");
    }
  });
});

describe("resolveFixedTargets", () => {
  it("returns the case targets for a case option", () => {
    const targets = resolveFixedTargets(muenster, {
      type: "case",
      id: "diebstahlserie-altstadt",
    });
    expect(targets?.diebstahl).toBe("schloss");
    expect(targets?.flucht).toBe("hafenpier");
  });

  it("returns the player's picks verbatim for a custom option", () => {
    const targets = resolveFixedTargets(teststadt, {
      type: "custom",
      targets: { diebstahl: "a", kontakt: "j", flucht: "d" },
    });
    expect(targets).toEqual({ diebstahl: "a", kontakt: "j", flucht: "d", sabotage: null });
  });

  it("returns null for drawn/disabled missions and no option", () => {
    expect(resolveFixedTargets(muenster, "auto")).toBeNull();
    expect(resolveFixedTargets(muenster, "random")).toBeNull();
    expect(resolveFixedTargets(muenster, "none")).toBeNull();
    expect(resolveFixedTargets(muenster, undefined)).toBeNull();
  });

  it("throws MissionValidationError for a case on a map without a set", () => {
    expect(() =>
      resolveFixedTargets(teststadt, { type: "case", id: "diebstahlserie-altstadt" }),
    ).toThrow(MissionValidationError);
  });

  it("throws MissionValidationError for an unknown case id", () => {
    expect(() => resolveFixedTargets(muenster, { type: "case", id: "gibts-nicht" })).toThrow(
      MissionValidationError,
    );
  });
});
