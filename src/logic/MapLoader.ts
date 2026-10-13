/**
 * Loads and validates map packages (Kartenpakete) bundled under
 * `src/data/maps/<id>.json`. Packages are statically imported into the
 * build, so `loadMap` is synchronous and works headless (no fetch).
 */
import { MapValidationError, validateMapPack, type MapPack } from "./mapPack";

const registry = import.meta.glob<unknown>("../data/maps/*.json", {
  eager: true,
  import: "default",
});

function pathFor(id: string): string {
  return `../data/maps/${id}.json`;
}

/** Sorted ids of all bundled map packages. */
export function listMapIds(): string[] {
  return Object.keys(registry)
    .map((path) => path.replace(/^.*\//, "").replace(/\.json$/, ""))
    .sort();
}

/**
 * Returns the validated map package for `id`.
 * Throws `MapValidationError` listing the available ids when `id` is
 * unknown, or listing every schema violation when the package is invalid.
 */
export function loadMap(id: string): MapPack {
  const data = registry[pathFor(id)];
  if (data === undefined) {
    const available = listMapIds().join(", ") || "none";
    throw new MapValidationError([
      `unknown map id ${JSON.stringify(id)} (available: ${available})`,
    ]);
  }
  return validateMapPack(data);
}
