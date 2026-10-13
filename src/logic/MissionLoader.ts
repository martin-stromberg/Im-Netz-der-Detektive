/**
 * Loads and validates mission sets ("Fälle" — named scenarios with a
 * mini story, spec section 5.2/OT-33) bundled under
 * `src/data/missions/<mapId>.json`. Files are statically imported into
 * the build, so `loadMissionSet` is synchronous and works headless —
 * the same pattern as `MapLoader`.
 */
import type { MapPack } from "./mapPack";
import {
  MissionValidationError,
  validateMissionSet,
  type MissionCase,
  type MissionSet,
} from "./MissionSystem";

const registry = import.meta.glob<unknown>("../data/missions/*.json", {
  eager: true,
  import: "default",
});

function pathFor(mapId: string): string {
  return `../data/missions/${mapId}.json`;
}

/** Sorted map ids of all bundled mission sets. */
export function listMissionSetIds(): string[] {
  return Object.keys(registry)
    .map((path) => path.replace(/^.*\//, "").replace(/\.json$/, ""))
    .sort();
}

/** Whether a mission set exists for `mapId` (maps without "Fälle" return `false`). */
export function hasMissionSet(mapId: string): boolean {
  return registry[pathFor(mapId)] !== undefined;
}

/**
 * Returns the validated mission set for `map`.
 * Throws `MissionValidationError` when no set is bundled for the map or
 * when the file fails schema/category validation.
 */
export function loadMissionSet(map: MapPack): MissionSet {
  const data = registry[pathFor(map.id)];
  if (data === undefined) {
    const available = listMissionSetIds().join(", ") || "none";
    throw new MissionValidationError([
      `no mission set bundled for map ${JSON.stringify(map.id)} (available: ${available})`,
    ]);
  }
  return validateMissionSet(data, map);
}

/**
 * Returns the case `caseId` of `set`. Throws `MissionValidationError`
 * for an unknown id, naming the available cases.
 */
export function getMissionCase(set: MissionSet, caseId: string): MissionCase {
  const entry = set.cases.find((candidate) => candidate.id === caseId);
  if (entry === undefined) {
    const available = set.cases.map((candidate) => candidate.id).join(", ") || "none";
    throw new MissionValidationError([
      `unknown case id ${JSON.stringify(caseId)} in mission set ${JSON.stringify(set.mapId)} ` +
        `(available: ${available})`,
    ]);
  }
  return entry;
}
