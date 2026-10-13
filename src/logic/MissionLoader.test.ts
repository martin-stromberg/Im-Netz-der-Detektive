import { describe, expect, it } from "vitest";
import { loadMap } from "./MapLoader";
import { getMissionCase, hasMissionSet, listMissionSetIds, loadMissionSet } from "./MissionLoader";
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
