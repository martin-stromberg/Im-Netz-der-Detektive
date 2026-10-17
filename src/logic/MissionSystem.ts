/**
 * Mission system (01-spielkonzept.md section 5).
 *
 * Missions are generated in the fixed order diebstahl → kontakt →
 * Binärwahl (sabotage or flucht). `generateMission` draws target nodes
 * from the map's category pools via the seeded RNG and rejects draws
 * until every BFS-measurable criterion of `settings.missionRules`
 * holds: pairwise gap ≥ `minGap`, consecutive targets within
 * `minGap`–`maxGap`, the shortest route start→diebstahl→kontakt→flucht
 * plus `ACTION_ROUNDS` within `routeBudget` (`routeBudgetSabotage` with
 * a sabotage leg), the escape point ≥ `FLUCHT_MIN_KONTAKT_GAP` from the
 * contact and ≥ `FLUCHT_MIN_DIEBSTAHL_GAP` from the theft target, and a
 * sabotage detour of at most `sabotageDetour` edges over the direct
 * kontakt→flucht leg.
 *
 * The module also validates player-defined target sets (`validateCustomTargets`)
 * and the shipped "Fälle" mission-set JSON schema (`validateMissionSet`),
 * and provides the runtime helpers the store needs: which action is
 * executable at a position/stage (`executableMissionAction`), the
 * detective-facing structure view without node ids (`missionStructure`)
 * and the sabotage offer (`drawSabotageEffect`, `sabotageDuration`). A
 * predefined "Fall" may pin the offered effect via `sabotageEffect` —
 * carried into `MissionTargets` by `caseTargets` and preferred over the
 * random draw at the kontakt action.
 * Everything is pure and deterministic — randomness only enters through
 * the injected `Rng`.
 */
import { bfsDistances, type Graph } from "./Graph";
import {
  NODE_CATEGORIES,
  SABOTAGE_EFFECTS,
  type MapPack,
  type MissionRules,
  type NodeCategory,
  type SabotageEffect,
} from "./mapPack";
import type { Rng } from "./rng";

export const MISSION_KINDS = ["diebstahl", "kontakt", "sabotage", "flucht"] as const;
export type MissionKind = (typeof MISSION_KINDS)[number];

/** Stages of the fixed mission order; "wahl" is the pending binary choice. */
export type MissionStage = "diebstahl" | "kontakt" | "wahl" | "sabotage" | "flucht";

/** The drawn mission target nodes (ganove-side knowledge only). */
export interface MissionTargets {
  diebstahl: string;
  kontakt: string;
  /** `null` when the map has no `sabotage`-category nodes. */
  sabotage: string | null;
  flucht: string;
  /**
   * Case-fixed sabotage effect (predefined "Fälle" only): when set, the
   * informant offers this effect at the kontakt action instead of a
   * random draw from `settings.sabotageEffects`.
   */
  sabotageEffect?: SabotageEffect;
}

/** A predefined "Fall" (named scenario) of a mission set. */
export interface MissionCase {
  id: string;
  name: string;
  story: string;
  /**
   * Optional i18n reference keys (spec section 11): the UI resolves
   * them via `resolveText` so `name`/`story` stay the German source
   * literals — also kept in the game log and replay — while other
   * languages get their catalog text.
   */
  nameKey?: string;
  storyKey?: string;
  diebstahl: string;
  kontakt: string;
  flucht: string;
  sabotage?: string;
  /**
   * Designer-fixed sabotage effect: takes precedence over the random
   * `drawSabotageEffect` at the kontakt action. Meaningless (and
   * rejected by `validateMissionSet`) without a `sabotage` target.
   */
  sabotageEffect?: SabotageEffect;
}

/** JSON mission-set file bundled per map under `src/data/missions/`. */
export interface MissionSet {
  mapId: string;
  cases: MissionCase[];
}

/** Action rounds added to the route budget (spec section 5.2: "+3 Aktionsrunden"). */
export const ACTION_ROUNDS = 3;
/** Escape point must be at least this many edges from the contact target. */
export const FLUCHT_MIN_KONTAKT_GAP = 4;
/** Escape point must be at least this many edges from the theft target. */
export const FLUCHT_MIN_DIEBSTAHL_GAP = 3;

/** Upper bound of rejection-sampling attempts before giving up. */
export const GENERATION_MAX_ATTEMPTS = 2000;

/**
 * Raised when no criterion-conforming mission could be drawn — either
 * because a required category pool is empty or because the attempt
 * budget was exhausted for the given start position.
 */
export class MissionGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissionGenerationError";
  }
}

/**
 * Raised when a mission set file or a chosen target list fails
 * validation. `errors` lists every finding in "path: message" form —
 * same contract as `MapValidationError`.
 */
export class MissionValidationError extends Error {
  readonly errors: readonly string[];

  constructor(errors: readonly string[]) {
    super(`invalid mission data:\n- ${errors.join("\n- ")}`);
    this.name = "MissionValidationError";
    this.errors = errors;
  }
}

/** Ids of all nodes carrying `category` (the mission target pools). */
export function nodesByCategory(map: MapPack, category: NodeCategory): string[] {
  return map.nodes.filter((node) => node.categories.includes(category)).map((node) => node.id);
}

/** All target ids of a mission (empty slots excluded) — e.g. camera protection. */
export function missionTargetIds(targets: MissionTargets): string[] {
  return [targets.diebstahl, targets.kontakt, targets.flucht, targets.sabotage].filter(
    (id): id is string => id !== null,
  );
}

/**
 * Returns the codes of every violated generation criterion for
 * `targets` — an empty list means the target set is conforming.
 * `start` is the ganove's spawn; when `null`, only the start-independent
 * part of the route budget is checked (necessary condition).
 *
 * Codes: `min_gap`, `max_gap`, `flucht_kontakt_gap`,
 * `flucht_diebstahl_gap`, `sabotage_detour`, `route_budget`,
 * `route_budget_sabotage`.
 */
export function missionCriteriaViolations(
  graph: Graph,
  rules: MissionRules,
  targets: MissionTargets,
  start: string | null,
): string[] {
  const violations: string[] = [];
  const dist = (from: string, to: string): number =>
    from === to ? 0 : (bfsDistances(graph, from).get(to) ?? Infinity);

  const legs: [string, string][] = [
    [targets.diebstahl, targets.kontakt],
    [targets.kontakt, targets.flucht],
  ];
  const present = [targets.diebstahl, targets.kontakt, targets.flucht];
  if (targets.sabotage !== null) {
    legs.push([targets.kontakt, targets.sabotage], [targets.sabotage, targets.flucht]);
    present.push(targets.sabotage);
  }

  for (let i = 0; i < present.length; i += 1) {
    for (let j = i + 1; j < present.length; j += 1) {
      if (dist(present[i], present[j]) < rules.minGap) {
        violations.push(`min_gap:${present[i]}-${present[j]}`);
      }
    }
  }
  for (const [a, b] of legs) {
    const d = dist(a, b);
    if (d > rules.maxGap) {
      violations.push(`max_gap:${a}-${b}`);
    }
  }
  if (dist(targets.kontakt, targets.flucht) < FLUCHT_MIN_KONTAKT_GAP) {
    violations.push("flucht_kontakt_gap");
  }
  if (dist(targets.diebstahl, targets.flucht) < FLUCHT_MIN_DIEBSTAHL_GAP) {
    violations.push("flucht_diebstahl_gap");
  }

  const direct = dist(targets.diebstahl, targets.kontakt) + dist(targets.kontakt, targets.flucht);
  const viaSabotage =
    targets.sabotage !== null
      ? dist(targets.diebstahl, targets.kontakt) +
        dist(targets.kontakt, targets.sabotage) +
        dist(targets.sabotage, targets.flucht)
      : null;
  const startLeg = start !== null ? dist(start, targets.diebstahl) : 0;

  if (targets.sabotage !== null) {
    if (
      dist(targets.kontakt, targets.sabotage) + dist(targets.sabotage, targets.flucht) >
      dist(targets.kontakt, targets.flucht) + rules.sabotageDetour
    ) {
      violations.push("sabotage_detour");
    }
  }
  if (startLeg + direct + ACTION_ROUNDS > rules.routeBudget) {
    violations.push("route_budget");
  }
  if (viaSabotage !== null && startLeg + viaSabotage + ACTION_ROUNDS > rules.routeBudgetSabotage) {
    violations.push("route_budget_sabotage");
  }
  return violations;
}

/**
 * Draws a criterion-conforming mission for `start` via rejection
 * sampling: diebstahl/kontakt/flucht targets come from their category
 * pools, the sabotage target from the `sabotage` pool (`null` when that
 * pool is empty). Throws `MissionGenerationError` when a required pool
 * is empty or no valid draw occurs within `maxAttempts`.
 */
export function generateMission(
  map: MapPack,
  graph: Graph,
  start: string,
  rng: Rng,
  maxAttempts: number = GENERATION_MAX_ATTEMPTS,
): MissionTargets {
  const pools: Record<"diebstahl" | "kontakt" | "flucht", string[]> = {
    diebstahl: nodesByCategory(map, "diebstahl"),
    kontakt: nodesByCategory(map, "kontakt"),
    flucht: nodesByCategory(map, "flucht"),
  };
  const sabotagePool = nodesByCategory(map, "sabotage");
  for (const kind of ["diebstahl", "kontakt", "flucht"] as const) {
    if (pools[kind].length === 0) {
      throw new MissionGenerationError(
        `map ${JSON.stringify(map.id)} has no ${kind} category nodes`,
      );
    }
  }
  let lastViolations: string[] = [];
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const targets: MissionTargets = {
      diebstahl: rng.pick(pools.diebstahl),
      kontakt: rng.pick(pools.kontakt),
      flucht: rng.pick(pools.flucht),
      sabotage: sabotagePool.length > 0 ? rng.pick(sabotagePool) : null,
    };
    // A node drawn for two roles is not a valid mission.
    if (missionTargetIds(targets).length !== new Set(missionTargetIds(targets)).size) {
      lastViolations = ["duplicate_target"];
      continue;
    }
    lastViolations = missionCriteriaViolations(graph, map.settings.missionRules, targets, start);
    if (lastViolations.length === 0) {
      return targets;
    }
  }
  throw new MissionGenerationError(
    `no conforming mission on map ${JSON.stringify(map.id)} for start ${JSON.stringify(start)} ` +
      `within ${maxAttempts} attempts (last violations: ${lastViolations.join(", ")})`,
  );
}

/**
 * Validates a player-defined target list: every id must exist, carry
 * the category of its role and satisfy all generation criteria against
 * `start`. Returns the list of findings — empty means valid.
 */
export function validateCustomTargets(
  map: MapPack,
  graph: Graph,
  targets: MissionTargets,
  start: string | null,
): string[] {
  const errors: string[] = [];
  const nodeOf = (id: string) => map.nodes.find((node) => node.id === id);
  const slots: [MissionKind, string | null][] = [
    ["diebstahl", targets.diebstahl],
    ["kontakt", targets.kontakt],
    ["sabotage", targets.sabotage],
    ["flucht", targets.flucht],
  ];
  for (const [kind, id] of slots) {
    if (id === null) {
      continue;
    }
    const node = nodeOf(id);
    if (node === undefined) {
      errors.push(`${kind}: unknown node id ${JSON.stringify(id)}`);
    } else if (!node.categories.includes(kind)) {
      errors.push(
        `${kind}: node ${JSON.stringify(id)} lacks the ${JSON.stringify(kind)} category ` +
          `(has: ${node.categories.join("|")})`,
      );
    }
  }
  const ids = missionTargetIds(targets);
  if (ids.length !== new Set(ids).size) {
    errors.push("targets: the same node is used for multiple mission roles");
  }
  if (errors.length === 0) {
    errors.push(
      ...missionCriteriaViolations(graph, map.settings.missionRules, targets, start).map(
        (code) => `criteria: ${code}`,
      ),
    );
  }
  return errors;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates raw JSON data as a mission set for `map`: shape, unique
 * case ids, known node ids with matching categories and optional
 * `sabotage`/`sabotageEffect` members inside the map's pools. Throws
 * `MissionValidationError` listing every violation otherwise.
 */
export function validateMissionSet(data: unknown, map: MapPack): MissionSet {
  const errors: string[] = [];
  if (!isRecord(data)) {
    throw new MissionValidationError(["top level: must be a JSON object"]);
  }
  if (data.mapId !== map.id) {
    errors.push(`mapId: must be ${JSON.stringify(map.id)} (got ${JSON.stringify(data.mapId)})`);
  }
  const cases = data.cases;
  if (!Array.isArray(cases) || cases.length === 0) {
    errors.push("cases: required non-empty array");
  } else {
    const caseIds = new Set<string>();
    const nodeOf = (id: string) => map.nodes.find((node) => node.id === id);
    cases.forEach((entry, i) => {
      const where = `cases[${i}]`;
      if (!isRecord(entry)) {
        errors.push(`${where}: must be an object`);
        return;
      }
      for (const field of ["id", "name", "story"] as const) {
        if (!isNonEmptyString(entry[field])) {
          errors.push(`${where}.${field}: required non-empty string`);
        }
      }
      for (const field of ["nameKey", "storyKey"] as const) {
        if (entry[field] !== undefined && !isNonEmptyString(entry[field])) {
          errors.push(`${where}.${field}: must be a non-empty string when present`);
        }
      }
      if (isNonEmptyString(entry.id)) {
        if (caseIds.has(entry.id)) {
          errors.push(`${where}.id: duplicate case id ${JSON.stringify(entry.id)}`);
        }
        caseIds.add(entry.id);
      }
      for (const kind of ["diebstahl", "kontakt", "flucht"] as const) {
        const ref = entry[kind];
        if (!isNonEmptyString(ref)) {
          errors.push(`${where}.${kind}: required node id`);
        } else {
          const node = nodeOf(ref);
          if (node === undefined) {
            errors.push(`${where}.${kind}: unknown node id ${JSON.stringify(ref)}`);
          } else if (!node.categories.includes(kind)) {
            errors.push(
              `${where}.${kind}: node ${JSON.stringify(ref)} lacks the ${JSON.stringify(kind)} category`,
            );
          }
        }
      }
      if ("sabotage" in entry && entry.sabotage !== undefined) {
        const ref = entry.sabotage;
        const node = typeof ref === "string" ? nodeOf(ref) : undefined;
        if (node === undefined) {
          errors.push(`${where}.sabotage: unknown node id ${JSON.stringify(ref)}`);
        } else if (!node.categories.includes("sabotage")) {
          errors.push(
            `${where}.sabotage: node ${JSON.stringify(ref)} lacks the "sabotage" category`,
          );
        }
      }
      if ("sabotageEffect" in entry && entry.sabotageEffect !== undefined) {
        const effect = entry.sabotageEffect;
        if (
          typeof effect !== "string" ||
          !(SABOTAGE_EFFECTS as readonly string[]).includes(effect)
        ) {
          errors.push(
            `${where}.sabotageEffect: must be one of ${SABOTAGE_EFFECTS.join("|")} ` +
              `(got ${JSON.stringify(effect)})`,
          );
        } else if (!map.settings.sabotageEffects.includes(effect as SabotageEffect)) {
          errors.push(
            `${where}.sabotageEffect: ${JSON.stringify(effect)} is not in the map's sabotageEffects pool`,
          );
        }
        // Without a sabotage node there is no offer — a fixed effect
        // would be dead data, so the combination is rejected.
        if (entry.sabotage === undefined) {
          errors.push(`${where}.sabotageEffect: requires a "sabotage" target node`);
        }
      }
    });
  }
  if (errors.length > 0) {
    throw new MissionValidationError(errors);
  }
  return data as unknown as MissionSet;
}

/**
 * Converts a `MissionCase` into `MissionTargets` (missing sabotage slot
 * → `null`). A case-fixed `sabotageEffect` is carried along and takes
 * precedence over the random draw when the kontakt action runs.
 */
export function caseTargets(entry: MissionCase): MissionTargets {
  return {
    diebstahl: entry.diebstahl,
    kontakt: entry.kontakt,
    flucht: entry.flucht,
    sabotage: entry.sabotage ?? null,
    ...(entry.sabotageEffect !== undefined ? { sabotageEffect: entry.sabotageEffect } : {}),
  };
}

/**
 * The mission action the ganove may execute standing on `position` at
 * `mission.stage` — `null` when no action is available. During `wahl`
 * (pending binary choice) and `flucht` no action round exists: the
 * choice is a decision, the escape needs no action.
 */
export function executableMissionAction(
  mission: { targets: MissionTargets; stage: MissionStage; pendingChoice: unknown } | null,
  position: string | null,
): MissionKind | null {
  if (mission === null || position === null || mission.pendingChoice !== null) {
    return null;
  }
  switch (mission.stage) {
    case "diebstahl":
      return position === mission.targets.diebstahl ? "diebstahl" : null;
    case "kontakt":
      return position === mission.targets.kontakt ? "kontakt" : null;
    case "sabotage":
      return mission.targets.sabotage !== null && position === mission.targets.sabotage
        ? "sabotage"
        : null;
    default:
      return null;
  }
}

/** Public step of the detective-facing mission structure (no node ids). */
export interface MissionStructureStep {
  kind: MissionKind;
  status: "erledigt" | "aktuell" | "offen";
}

/**
 * The mission structure the detectives may know (spec section 1):
 * the fixed order and per-step status — never the drawn target nodes.
 * `sabotage` is listed as an optional step whenever the mission carries
 * a sabotage offer; during `wahl` both remaining steps stay `offen`
 * (the choice itself is not leaked by the structure).
 */
export function missionStructure(
  mission: {
    targets: MissionTargets;
    stage: MissionStage;
  } | null,
): MissionStructureStep[] {
  if (mission === null) {
    return [];
  }
  const order: MissionKind[] = ["diebstahl", "kontakt"];
  if (mission.targets.sabotage !== null) {
    order.push("sabotage");
  }
  order.push("flucht");

  // During "wahl" no step is "aktuell": the pending choice must not leak.
  const cursor =
    mission.stage === "diebstahl"
      ? 0
      : mission.stage === "kontakt"
        ? 1
        : mission.stage === "wahl"
          ? order.indexOf("sabotage") === -1
            ? order.indexOf("flucht")
            : order.indexOf("sabotage")
          : mission.stage === "sabotage"
            ? order.indexOf("sabotage")
            : order.indexOf("flucht");
  return order.map((kind, index) => ({
    kind,
    status:
      index < cursor
        ? "erledigt"
        : index === cursor && mission.stage !== "wahl"
          ? "aktuell"
          : "offen",
  }));
}

/** Draws the sabotage effect offered by the informant from the map's pool. */
export function drawSabotageEffect(map: MapPack, rng: Rng): SabotageEffect {
  return rng.pick(map.settings.sabotageEffects);
}

/**
 * Duration in rounds of `funkstille`/`falsche_spur`: one full event
 * cycle of the map (`eventDefaults.cycle` — muenster/teststadt 4,
 * luebeck 3).
 */
export function sabotageDuration(map: MapPack): number {
  return map.settings.eventDefaults.cycle;
}

/** Whether `category` is a valid node category (guards typed callers). */
export function isNodeCategory(value: string): value is NodeCategory {
  return (NODE_CATEGORIES as readonly string[]).includes(value);
}
