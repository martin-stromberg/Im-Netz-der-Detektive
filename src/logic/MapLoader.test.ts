import { describe, expect, it } from "vitest";
import { listMapIds, loadMap } from "./MapLoader";
import { MapValidationError } from "./mapPack";

describe("loadMap", () => {
  it("loads and validates the bundled teststadt package", () => {
    const map = loadMap("teststadt");
    expect(map.id).toBe("teststadt");
    expect(map.nodes.length).toBeGreaterThan(0);
    expect(map.edges.length).toBeGreaterThan(0);
    expect(map.spawnRules.order).toBe("detektive_first");
  });

  it("rejects an unknown map id and names the available packages", () => {
    try {
      loadMap("gibts-nicht");
      expect.unreachable("loadMap should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(MapValidationError);
      expect((e as Error).message).toContain("gibts-nicht");
      expect((e as Error).message).toContain("teststadt");
    }
  });
});

describe("listMapIds", () => {
  it("lists the bundled map packages", () => {
    expect(listMapIds()).toEqual(
      expect.arrayContaining(["luebeck", "muenster", "teststadt"]),
    );
  });
});

describe("shipped play maps", () => {
  it.each(["muenster", "luebeck"])("loads and validates %s", (id) => {
    const map = loadMap(id);
    expect(map.id).toBe(id);
    expect(map.nodes.length).toBeGreaterThan(0);
    expect(map.edges.length).toBeGreaterThan(0);
    expect(map.spawnRules.order).toBe("detektive_first");
  });
});
