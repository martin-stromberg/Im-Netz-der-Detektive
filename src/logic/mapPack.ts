/**
 * Map package (Kartenpaket) type system and runtime validation.
 * The validator mirrors `.githooks/map-schema-check.py` — both enforce
 * the schema defined in `docs/konzept/content/02-technisches-konzept.md`
 * section 4 — so commit-time checks and engine validation cannot drift.
 */

export const NODE_CATEGORIES = ["diebstahl", "kontakt", "sabotage", "flucht"] as const;
export type NodeCategory = (typeof NODE_CATEGORIES)[number];

export const EDGE_TYPES = ["weg", "fahrt"] as const;
export type EdgeType = (typeof EDGE_TYPES)[number];

export const SPAWN_MODES = ["choice", "free", "random"] as const;
export type SpawnMode = (typeof SPAWN_MODES)[number];

export const EVENT_MODES = ["cycle", "chance", "tension"] as const;
export type EventMode = (typeof EVENT_MODES)[number];

export const SABOTAGE_EFFECTS = ["kamera_aus", "funkstille", "falsche_spur"] as const;
export type SabotageEffect = (typeof SABOTAGE_EFFECTS)[number];

export interface MapNode {
  id: string;
  name: string;
  x: number;
  y: number;
  categories: NodeCategory[];
  zone: string;
}

export interface MapEdge {
  a: string;
  b: string;
  type: EdgeType;
  /** Reserved for weighted routing; unused by current engines. */
  cost?: number;
}

export interface SpawnRule {
  mode: SpawnMode;
  /** Allowed node ids (mode `choice`). */
  nodes?: string[];
  /** Allowed zones (mode `choice`, alternative to `nodes`). */
  zones?: string[];
  minDistanceToDetective?: number;
}

export interface SpawnRules {
  detectives: SpawnRule;
  ganove: SpawnRule;
  order: "detektive_first";
}

/** Setting whose value scales with the map's topology. */
export interface RangeSetting {
  suggested: number;
  min: number;
  max?: number;
  /** Only meaningful for `roundLimit`: game has no time limit. */
  unlimited?: boolean;
}

export interface EventDefaults {
  cycle: number;
  chance: number;
  threshold: number;
  perRound: number;
}

export interface EventMix {
  sichtbarkeit: number;
  hinweis: number;
  umwelt: number;
}

export interface MissionRules {
  minGap: number;
  maxGap: number;
  routeBudget: number;
  routeBudgetSabotage: number;
  sabotageDetour: number;
}

export interface MapSettings {
  detectiveCount: RangeSetting;
  cameraCount: RangeSetting;
  roundLimit: RangeSetting;
  radioHintCount: RangeSetting;
  edgeBlockRounds: RangeSetting;
  cameraMinGap: number;
  hintZoneRadius: number;
  eventMode: EventMode;
  eventDefaults: EventDefaults;
  eventMix: EventMix;
  missionRules: MissionRules;
  sabotageEffects: SabotageEffect[];
}

export interface MapPack {
  id: string;
  name: string;
  tagline?: string;
  viewBox: string;
  nodes: MapNode[];
  edges: MapEdge[];
  spawnRules: SpawnRules;
  settings: MapSettings;
}

/**
 * Raised when a map package (or a map id) fails validation.
 * `errors` lists every finding in "path: message" form so callers can
 * present all problems at once instead of failing on the first one.
 */
export class MapValidationError extends Error {
  readonly errors: readonly string[];

  constructor(errors: readonly string[]) {
    super(`invalid map package:\n- ${errors.join("\n- ")}`);
    this.name = "MapValidationError";
    this.errors = errors;
  }
}

const RANGE_SETTINGS = [
  "detectiveCount",
  "cameraCount",
  "radioHintCount",
  "edgeBlockRounds",
] as const;
const SCALAR_SETTINGS = ["cameraMinGap", "hintZoneRadius"] as const;
const EVENT_DEFAULT_KEYS = ["cycle", "chance", "threshold", "perRound"] as const;
const EVENT_MIX_KEYS = ["sichtbarkeit", "hinweis", "umwelt"] as const;
const MISSION_RULE_KEYS = [
  "minGap",
  "maxGap",
  "routeBudget",
  "routeBudgetSabotage",
  "sabotageDetour",
] as const;

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checkRange(value: unknown, where: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${where}: must be an object {suggested, min, max}`);
    return;
  }
  if (!isNumber(value.suggested)) {
    errors.push(`${where}.suggested: required number`);
  }
  if (!isNumber(value.min)) {
    errors.push(`${where}.min: required number`);
  }
  if ("unlimited" in value) {
    if (value.unlimited !== true) {
      errors.push(`${where}.unlimited: must be true when present`);
    }
    if ("max" in value && !isNumber(value.max)) {
      errors.push(`${where}.max: must be a number when present`);
    }
  } else if (!isNumber(value.max)) {
    errors.push(`${where}.max: required number (or "unlimited": true)`);
  }
  if (isNumber(value.min) && isNumber(value.max)) {
    if (value.min > value.max) {
      errors.push(`${where}: min must not exceed max`);
    }
    if (isNumber(value.suggested) && (value.suggested < value.min || value.suggested > value.max)) {
      errors.push(`${where}.suggested: must be within [min, max]`);
    }
  } else if (!isNumber(value.max) && isNumber(value.min) && isNumber(value.suggested)) {
    if (value.suggested < value.min) {
      errors.push(`${where}.suggested: must be >= min`);
    }
  }
}

function checkSpawnRule(
  rule: unknown,
  nodeIds: ReadonlySet<string>,
  where: string,
  errors: string[],
): void {
  if (!isRecord(rule)) {
    errors.push(`${where}: must be an object`);
    return;
  }
  const mode = rule.mode;
  if (typeof mode !== "string" || !(SPAWN_MODES as readonly string[]).includes(mode)) {
    errors.push(
      `${where}.mode: must be one of ${SPAWN_MODES.join("|")} (got ${JSON.stringify(mode)})`,
    );
  }
  if (mode === "choice") {
    const nodes = rule.nodes;
    const zones = rule.zones;
    if (!Array.isArray(nodes) && !Array.isArray(zones)) {
      errors.push(`${where}: mode "choice" requires a "nodes" or "zones" list`);
    }
    if (Array.isArray(nodes)) {
      if (nodes.length === 0) {
        errors.push(`${where}.nodes: must not be empty`);
      }
      for (const ref of nodes) {
        if (typeof ref !== "string" || !nodeIds.has(ref)) {
          errors.push(`${where}.nodes: unknown node id ${JSON.stringify(ref)}`);
        }
      }
    }
  }
  if ("minDistanceToDetective" in rule && !isNumber(rule.minDistanceToDetective)) {
    errors.push(`${where}.minDistanceToDetective: must be a number`);
  }
}

function checkNodes(data: Record<string, unknown>, nodeIds: Set<string>, errors: string[]): void {
  const nodes = data.nodes;
  if (!Array.isArray(nodes) || nodes.length === 0) {
    errors.push("nodes: required non-empty array");
    return;
  }
  nodes.forEach((node, i) => {
    const where = `nodes[${i}]`;
    if (!isRecord(node)) {
      errors.push(`${where}: must be an object`);
      return;
    }
    const nid = node.id;
    if (!isNonEmptyString(nid)) {
      errors.push(`${where}.id: required non-empty string`);
    } else if (nodeIds.has(nid)) {
      errors.push(`${where}.id: duplicate node id ${JSON.stringify(nid)}`);
    } else {
      nodeIds.add(nid);
    }
    if (!isNonEmptyString(node.name)) {
      errors.push(`${where}.name: required non-empty string`);
    }
    for (const coord of ["x", "y"] as const) {
      if (!isNumber(node[coord])) {
        errors.push(`${where}.${coord}: required number`);
      }
    }
    const categories = node.categories;
    if (!Array.isArray(categories) || categories.length === 0) {
      errors.push(`${where}.categories: required non-empty array`);
    } else {
      for (const cat of categories) {
        if (typeof cat !== "string" || !(NODE_CATEGORIES as readonly string[]).includes(cat)) {
          errors.push(
            `${where}.categories: invalid category ${JSON.stringify(cat)} ` +
              `(allowed: ${NODE_CATEGORIES.join("|")})`,
          );
        }
      }
    }
    if (!isNonEmptyString(node.zone)) {
      errors.push(`${where}.zone: required non-empty string`);
    }
  });
}

function checkEdges(
  data: Record<string, unknown>,
  nodeIds: ReadonlySet<string>,
  errors: string[],
): void {
  const edges = data.edges;
  if (!Array.isArray(edges) || edges.length === 0) {
    errors.push("edges: required non-empty array");
    return;
  }
  edges.forEach((edge, i) => {
    const where = `edges[${i}]`;
    if (!isRecord(edge)) {
      errors.push(`${where}: must be an object`);
      return;
    }
    for (const endpoint of ["a", "b"] as const) {
      const ref = edge[endpoint];
      if (typeof ref !== "string" || !nodeIds.has(ref)) {
        errors.push(`${where}.${endpoint}: unknown node id ${JSON.stringify(ref)}`);
      }
    }
    if (typeof edge.type !== "string" || !(EDGE_TYPES as readonly string[]).includes(edge.type)) {
      errors.push(
        `${where}.type: must be one of ${EDGE_TYPES.join("|")} (got ${JSON.stringify(edge.type)})`,
      );
    }
    if ("cost" in edge && edge.cost !== undefined && !isNumber(edge.cost)) {
      errors.push(`${where}.cost: must be a number when present`);
    }
  });
}

function checkSpawnRules(spawn: unknown, nodeIds: ReadonlySet<string>, errors: string[]): void {
  if (!isRecord(spawn)) {
    errors.push("spawnRules: required object");
    return;
  }
  if (spawn.order !== "detektive_first") {
    errors.push('spawnRules.order: must be "detektive_first"');
  }
  for (const side of ["detectives", "ganove"] as const) {
    if (!(side in spawn)) {
      errors.push(`spawnRules.${side}: required`);
    } else {
      checkSpawnRule(spawn[side], nodeIds, `spawnRules.${side}`, errors);
    }
  }
}

function checkSettings(settings: unknown, errors: string[]): void {
  if (!isRecord(settings)) {
    errors.push("settings: required object");
    return;
  }
  for (const name of RANGE_SETTINGS) {
    if (!(name in settings)) {
      errors.push(`settings.${name}: required range object`);
    } else {
      checkRange(settings[name], `settings.${name}`, errors);
    }
  }
  if (!("roundLimit" in settings)) {
    errors.push("settings.roundLimit: required range object");
  } else {
    checkRange(settings.roundLimit, "settings.roundLimit", errors);
  }
  for (const name of SCALAR_SETTINGS) {
    if (!isNumber(settings[name])) {
      errors.push(`settings.${name}: required number`);
    }
  }
  const eventMode = settings.eventMode;
  if (typeof eventMode !== "string" || !(EVENT_MODES as readonly string[]).includes(eventMode)) {
    errors.push(
      `settings.eventMode: must be one of ${EVENT_MODES.join("|")} (got ${JSON.stringify(eventMode)})`,
    );
  }
  for (const [group, keys] of [
    ["eventDefaults", EVENT_DEFAULT_KEYS],
    ["eventMix", EVENT_MIX_KEYS],
    ["missionRules", MISSION_RULE_KEYS],
  ] as const) {
    const value = settings[group];
    if (!isRecord(value)) {
      errors.push(`settings.${group}: required object`);
      continue;
    }
    for (const key of keys) {
      if (!isNumber(value[key])) {
        errors.push(`settings.${group}.${key}: required number`);
      }
    }
  }
  const effects = settings.sabotageEffects;
  if (!Array.isArray(effects) || effects.length === 0) {
    errors.push("settings.sabotageEffects: required non-empty array");
    return;
  }
  for (const effect of effects) {
    if (typeof effect !== "string" || !(SABOTAGE_EFFECTS as readonly string[]).includes(effect)) {
      errors.push(
        `settings.sabotageEffects: invalid effect ${JSON.stringify(effect)} ` +
          `(allowed: ${SABOTAGE_EFFECTS.join("|")})`,
      );
    }
  }
}

/**
 * Validates raw JSON data against the map package schema. Returns the
 * data typed as `MapPack` when valid; throws `MapValidationError` listing
 * every violation otherwise.
 */
export function validateMapPack(data: unknown): MapPack {
  if (!isRecord(data)) {
    throw new MapValidationError(["top level: must be a JSON object"]);
  }

  const errors: string[] = [];
  for (const field of ["id", "name", "viewBox"] as const) {
    if (!isNonEmptyString(data[field])) {
      errors.push(`${field}: required non-empty string`);
    }
  }
  if ("tagline" in data && data.tagline !== undefined && !isNonEmptyString(data.tagline)) {
    errors.push("tagline: must be a non-empty string when present");
  }

  const nodeIds = new Set<string>();
  checkNodes(data, nodeIds, errors);
  checkEdges(data, nodeIds, errors);
  checkSpawnRules(data.spawnRules, nodeIds, errors);
  checkSettings(data.settings, errors);

  if (errors.length > 0) {
    throw new MapValidationError(errors);
  }
  return data as unknown as MapPack;
}
