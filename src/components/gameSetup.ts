/**
 * Shared setup helpers for the game screens (`GanoveScreen`,
 * `DetektivScreen`): dev/test URL-parameter overrides (`?map=`,
 * `?seed=`, `?mission=`), mission-option parsing and the fallback seed.
 */
import type { MissionOption } from "../state/gameStore";

export function readParams(): URLSearchParams {
  return typeof window === "undefined"
    ? new URLSearchParams()
    : new URLSearchParams(window.location.search);
}

/** Parses `?mission=` — `auto | random | none | case:<id>` (default `random`). */
export function resolveMissionOption(raw: string | null): MissionOption {
  if (raw === null || raw === "random") {
    return "random";
  }
  if (raw === "auto" || raw === "none") {
    return raw;
  }
  if (raw.startsWith("case:")) {
    return { type: "case", id: raw.slice("case:".length) };
  }
  return "random";
}

/** Time-derived fallback seed when neither prop nor `?seed=` is set. */
export function nextSeed(): number {
  return Date.now() % 0x80000000;
}
