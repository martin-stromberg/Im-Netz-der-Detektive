/**
 * Shared types and helpers for the menu flow (spec
 * `02-technisches-konzept.md` section 6): the application frame is a
 * plain state machine in `App.tsx` — `menu → map → mode → settings →
 * mission → game`, plus `dev` (AI-vs-AI batch) and `stats` (recorded
 * games). No router package; `?mode=` stays a dev/E2E deep link.
 */
import type { EventDefaults, EventMode } from "../logic/mapPack";
import type { StartGameOptions } from "../state/gameStore";

/** Screens of the application frame. */
export type MenuScreen =
  "menu" | "map" | "mode" | "settings" | "mission" | "dev" | "stats" | "resume" | "replay" | "game";

/** Human-playable modes; `"dev"` never produces a `PendingGameConfig`. */
export type PlayerMode = "ganove" | "detektiv";

/**
 * Everything the game screens need to enter their setup flow directly:
 * the map, the chosen side and the collected `StartGameOptions`
 * (settings + mission). `seed` may be left out — the screen falls back
 * to its `?seed=`/`nextSeed()` behaviour.
 */
export interface PendingGameConfig {
  mapId: string;
  mode: PlayerMode;
  seed?: number;
  options: StartGameOptions;
}

/**
 * Playable maps offered in the map selection. `teststadt` stays a
 * dev/test fixture reachable via `?map=` and inside the dev mode —
 * it is deliberately not part of the player-facing menu.
 */
export const MENU_MAP_IDS = ["muenster", "luebeck"] as const;

/** Displayed-but-disabled future cities ("in Vorbereitung"). */
export const FORTHCOMING_MAP_IDS = ["hamburg", "koeln"] as const;

/**
 * Allowed cadence corridor for the settings form — "one event every
 * ~N rounds". The map packages carry per-mode `eventDefaults`, not a
 * range for cadence, so the menu keeps a fixed, documented corridor.
 */
export const EVENT_CADENCE_MIN = 1;
export const EVENT_CADENCE_MAX = 15;

/**
 * Translates the unified cadence value ("an event every ~N rounds")
 * into the mode-specific `eventDefaults` override the engine consumes:
 * `cycle` → `cycle = N`, `chance` → `chance = 1/N`, `tension` →
 * `threshold = N · perRound` (the per-round accumulation stays the
 * map's). `base` is the map's `settings.eventDefaults`.
 */
export function cadenceToEventDefaults(
  mode: EventMode,
  cadence: number,
  base: EventDefaults,
): Partial<EventDefaults> {
  if (mode === "cycle") {
    return { cycle: cadence };
  }
  if (mode === "chance") {
    return { chance: 1 / cadence };
  }
  return { threshold: cadence * base.perRound };
}

/**
 * Inverse of `cadenceToEventDefaults` — the cadence the settings form
 * shows for the map's current defaults of `mode`.
 */
export function eventCadenceOf(mode: EventMode, defaults: EventDefaults): number {
  if (mode === "cycle") {
    return Math.round(defaults.cycle);
  }
  if (mode === "chance") {
    return Math.max(1, Math.round(1 / defaults.chance));
  }
  return Math.max(1, Math.round(defaults.threshold / defaults.perRound));
}
