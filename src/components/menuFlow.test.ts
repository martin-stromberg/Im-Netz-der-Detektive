import { describe, expect, it } from "vitest";
import type { EventDefaults } from "../logic/mapPack";
import { cadenceToEventDefaults, eventCadenceOf } from "./menuFlow";

const base: EventDefaults = { cycle: 4, chance: 0.25, threshold: 40, perRound: 10 };

describe("cadenceToEventDefaults", () => {
  it("maps the cadence to `cycle` in cycle mode", () => {
    expect(cadenceToEventDefaults("cycle", 3, base)).toEqual({ cycle: 3 });
  });

  it("maps the cadence to `1/N` chance in chance mode", () => {
    expect(cadenceToEventDefaults("chance", 4, base)).toEqual({ chance: 0.25 });
  });

  it("maps the cadence to `N · perRound` threshold in tension mode", () => {
    expect(cadenceToEventDefaults("tension", 5, base)).toEqual({ threshold: 50 });
  });
});

describe("eventCadenceOf", () => {
  it("inverts the mapping for the map's own defaults", () => {
    expect(eventCadenceOf("cycle", base)).toBe(4);
    expect(eventCadenceOf("chance", base)).toBe(4);
    expect(eventCadenceOf("tension", base)).toBe(4);
  });

  it("clamps degenerate defaults to a positive cadence", () => {
    expect(eventCadenceOf("chance", { ...base, chance: 0.9 })).toBe(1);
    expect(eventCadenceOf("tension", { ...base, threshold: 5, perRound: 10 })).toBe(1);
  });
});
