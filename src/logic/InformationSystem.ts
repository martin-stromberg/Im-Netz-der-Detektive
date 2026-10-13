/**
 * Information distribution layer (01-spielkonzept.md section 4):
 * shared event/camera data structures, the `visibleTo` asymmetry
 * (applied on the data, not in the display), the once-per-game police
 * radio summary and the 4-level heat indicator.
 *
 * The module is pure and content-free for the ganove side by
 * construction: `visibleEvents`/`visibleCameras` deliver only what a
 * side may know, and `heatLevel` reduces hint activity to weighted
 * counters per round — it never carries hint contents, so the heat
 * indicator cannot leak what or where the detectives know something.
 */

/** All event kinds the information layer can produce. */
export type GameEventKind =
  | "camera"
  | "sichtbarkeit"
  | "hinweis"
  | "umwelt"
  | "aktion"
  | "polizeifunk";

/** Who is allowed to see an event — enforced at data level. */
export type Visibility = "detectives" | "ganove" | "both";

/** The two sides whose views are filtered. */
export type ViewSide = "detectives" | "ganove";

/** A hint or world event as it lands in the chronicle. */
export interface GameEvent {
  kind: GameEventKind;
  round: number;
  /** Exact node for `camera`/`sichtbarkeit` events. */
  nodeId?: string;
  /** Named zone for `hinweis` events ("im Bereich X"). */
  zone?: string;
  /** Nodes within `hintZoneRadius` of the true position (zone hints). */
  nodeIds?: string[];
  /** Blocked edge for `umwelt` events. */
  edge?: { a: string; b: string };
  /** Last round an `umwelt` block is in effect. */
  untilRound?: number;
  visibleTo: Visibility;
  /** Free-form payload (e.g. `hints` for `polizeifunk`). */
  details?: Record<string, unknown>;
}

export interface Camera {
  nodeId: string;
  active: boolean;
}

/** What the police radio reports back to the ganove. */
export interface RadioHint {
  kind: GameEventKind;
  round: number;
  nodeId?: string;
  zone?: string;
}

export type HeatLevel = "ruhig" | "aktiv" | "erhoeht" | "kritisch";

/**
 * Event kinds that count as detective hints — camera hits, the zone
 * hint, the visibility reveal and (from the mission step onward) the
 * action trace. `umwelt` carries no position information,
 * `polizeifunk` is the ganove's own tool.
 */
export const HINT_EVENT_KINDS: readonly GameEventKind[] = [
  "camera",
  "sichtbarkeit",
  "hinweis",
  "aktion",
];

/**
 * Heat weighting per hint kind (01-spielkonzept.md section 4.6):
 * zone hint +1, camera +2, action trace +2, visibility reveal +3.
 * `aktion` is already wired so action traces count as soon as the
 * mission step emits them.
 */
export const HEAT_WEIGHTS: Readonly<Record<GameEventKind, number>> = {
  camera: 2,
  sichtbarkeit: 3,
  hinweis: 1,
  umwelt: 0,
  aktion: 2,
  polizeifunk: 0,
};

/** Window of the heat indicator: the last 3 rounds including `round`. */
export const HEAT_WINDOW = 3;

/** Events a side may see — data-level asymmetry, not a display filter. */
export function visibleEvents(
  events: readonly GameEvent[],
  side: ViewSide,
): GameEvent[] {
  return events.filter((event) => event.visibleTo === side || event.visibleTo === "both");
}

/**
 * Cameras a side may know about. The ganove never receives camera
 * objects — the only exception is the police radio, which reports
 * triggered cameras as hint data (`RadioHint`), never as `Camera`.
 */
export function visibleCameras(cameras: readonly Camera[], side: ViewSide): Camera[] {
  return side === "detectives" ? [...cameras] : [];
}

/**
 * The last `count` hints (including camera triggers) in chronological
 * order — the police radio content. Never contains untriggered cameras
 * or upcoming events, because it only summarises emitted events.
 */
export function radioHintSummary(
  events: readonly GameEvent[],
  count: number,
): RadioHint[] {
  return events
    .filter((event) => HINT_EVENT_KINDS.includes(event.kind))
    .slice(-count)
    .map((event) => ({
      kind: event.kind,
      round: event.round,
      nodeId: event.nodeId,
      zone: event.zone,
    }));
}

/**
 * The ganove's node as revealed by a `sichtbarkeit` event — valid only
 * during the round it fired in; afterwards the reveal has expired and
 * `null` is returned (the event itself stays in the chronicle).
 */
export function revealedGanovePosition(
  events: readonly GameEvent[],
  round: number,
): string | null {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (event.kind === "sichtbarkeit" && event.round === round) {
      return event.nodeId ?? null;
    }
  }
  return null;
}

/**
 * Heat indicator "Polizeiaufmerksamkeit": weighted hint activity over
 * the last `HEAT_WINDOW` rounds. Levels: 0 ruhig, 1–2 aktiv, 3–4
 * erhoeht, ≥5 kritisch. Returns only level and score — never hint
 * contents (no info-leak towards the ganove).
 */
export function heatLevel(
  events: readonly GameEvent[],
  round: number,
): { level: HeatLevel; score: number } {
  const score = events
    .filter((event) => event.round <= round && event.round > round - HEAT_WINDOW)
    .reduce((sum, event) => sum + HEAT_WEIGHTS[event.kind], 0);
  const level: HeatLevel =
    score === 0 ? "ruhig" : score <= 2 ? "aktiv" : score <= 4 ? "erhoeht" : "kritisch";
  return { level, score };
}
