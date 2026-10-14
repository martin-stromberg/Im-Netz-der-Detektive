import { create } from "zustand";
import { EVENT_MODES, type EventDefaults, type MapPack, type RangeSetting } from "../logic/mapPack";
import { createRng, mixSeed, type Rng } from "../logic/rng";
import { buildGraph } from "../logic/Graph";
import { deactivateAll, placeCameras, triggeredCamera } from "../logic/CameraSystem";
import {
  drawEventType,
  pickBlockableEdge,
  rollTrigger,
  zoneHint,
  type EventTypeKind,
} from "../logic/EreignisEngine";
import {
  HINT_EVENT_KINDS,
  heatLevel,
  radioHintSummary,
  type Camera,
  type GameEvent,
  type HeatLevel,
  type Visibility,
} from "../logic/InformationSystem";
import { exportGameLog as exportGameLogFile, saveGameLog } from "../logic/Recorder";
import {
  legalDetectiveMoves,
  legalGanoveMoves,
  mapEscapeNodeIds,
  MoveError,
  validateDetectiveMove,
  validateGanoveMove,
  type BlockedEdge,
  type MoveContext,
  type MoveTarget,
} from "../logic/Movement";
import {
  caseTargets,
  drawSabotageEffect,
  executableMissionAction,
  generateMission,
  MissionGenerationError,
  missionCriteriaViolations,
  missionTargetIds,
  missionStructure,
  sabotageDuration,
  validateCustomTargets,
  type MissionKind,
  type MissionStage,
  type MissionStructureStep,
  type MissionTargets,
} from "../logic/MissionSystem";
import { getMissionCase, loadMissionSet, resolveFixedTargets } from "../logic/MissionLoader";
import type { SabotageEffect } from "../logic/mapPack";
import {
  detectiveSpawnChoices,
  ganoveSpawnChoices,
  pickDetectiveSpawns,
  pickGanoveSpawnForMission,
  SpawnError,
} from "../logic/SpawnSystem";

export type GamePhase = "ganove" | "detektive";
export type EventMode = "cycle" | "chance" | "tension";
export type GameOutcome = "caught" | "surrounded" | "escaped" | "timeout" | "draw";

export type { BlockedEdge } from "../logic/Movement";

/**
 * Raised when `startGame` options conflict with the map settings —
 * e.g. `roundLimit: null` on a map that does not allow `unlimited`,
 * or a round limit outside the map's `[min, max]` corridor.
 */
export class GameConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameConfigError";
  }
}

/**
 * Running mission state (spec section 5). `targets` is ganove-side
 * knowledge only — detective-facing views may expose the structure
 * (`missionStructure`) and the `aktion` trace events, never the drawn
 * target nodes.
 */
export interface Mission {
  /** `"random"`, `"custom"` or the case id of a bundled "Fall". */
  id: string;
  /** Display name and mini story (predefined cases only). */
  name?: string;
  story?: string;
  targets: MissionTargets;
  stage: MissionStage;
  /**
   * Pending binary choice after the kontakt action: the offered
   * sabotage node and the drawn effect. `null` in every other stage;
   * while set, ganove moves are blocked until `chooseMissionPath`.
   */
  pendingChoice: { sabotageNode: string; effect: SabotageEffect } | null;
  /** The effect the informant offered (kept after the choice, ganove-side info). */
  offeredEffect: SabotageEffect | null;
  /** Effect executed at the sabotage node (for the ganove's own info). */
  appliedEffect: SabotageEffect | null;
}

/**
 * How `startGame` resolves the mission:
 * - `"auto"` (default): generate when the map's pools and the spawn
 *   allow a conforming mission, otherwise play without one
 * - `"random"`: generate; `MissionGenerationError` when impossible
 * - `"none"`: no mission — every `flucht` node is an escape point
 * - `{ type: "case", id }`: a predefined "Fall" from the map's mission set
 * - `{ type: "custom", targets }`: player-defined targets, validated
 *   against categories and the generation criteria
 */
export type MissionOption =
  | "auto"
  | "random"
  | "none"
  | { type: "case"; id: string }
  | {
      type: "custom";
      targets: { diebstahl: string; kontakt: string; flucht: string; sabotage?: string };
    };

/**
 * A mission fully resolved at record time — the shape the log `header`
 * carries (`{id, name?, story?, targets}`). `startOptionsFromHeader`
 * feeds it back through `StartGameOptions.resolvedMission` so the
 * reconstruction applies the recorded mission verbatim instead of
 * redrawing it from the RNG stream.
 */
export interface RecordedMission {
  /** `"random"`, `"custom"` or the case id of a bundled "Fall". */
  id: string;
  name?: string;
  story?: string;
  targets: MissionTargets;
}

export type {
  Camera,
  GameEvent,
  GameEventKind,
  HeatLevel,
  Visibility,
} from "../logic/InformationSystem";

/**
 * A log entry as the caller describes it — `seq` is assigned by
 * `appendLog`. Fields are flat (JSONL shape of spec section 8), every
 * entry carries `visibleTo` so later perspective replays can filter at
 * data level.
 */
export interface LogInput {
  round: number;
  type: string;
  visibleTo?: Visibility;
  [field: string]: unknown;
}

/**
 * One line of the event log. The `header` is the only entry with
 * `seq: 0` — it is serialized without `seq`/`round` (spec section 8:
 * events count 1..n, the header precedes them).
 */
export interface LogEntry extends LogInput {
  seq: number;
}

export interface StartGameOptions {
  /** Number of detectives; defaults to `settings.detectiveCount.suggested`. */
  detectiveCount?: number;
  /** Explicit detective spawns — validated against `detectiveSpawnChoices`. */
  detectivePositions?: string[];
  /** Explicit ganove spawn — validated against `ganoveSpawnChoices`. */
  ganovePosition?: string;
  /**
   * Round limit for the timeout ending; `null` disables it and requires
   * `settings.roundLimit.unlimited`. Defaults to `roundLimit.suggested`.
   */
  roundLimit?: number | null;
  /** Camera count override inside `cameraCount.[min,max]`; defaults to `suggested`. */
  cameraCount?: number;
  /** Nodes that may never carry a camera (e.g. mission targets). */
  cameraProtectedNodes?: string[];
  /** Police-radio depth override inside `radioHintCount.[min,max]`. */
  radioHintCount?: number;
  /** `umwelt` block duration override inside `edgeBlockRounds.[min,max]`. */
  edgeBlockRounds?: number;
  /**
   * Event trigger mode override (menu "Ereignismodus"); defaults to
   * `settings.eventMode`. Must be one of `cycle|chance|tension`.
   */
  eventMode?: EventMode;
  /**
   * Event cadence override (menu "Kadenz"): merged over
   * `settings.eventDefaults`, so callers only pass the keys they change
   * (e.g. `{ cycle: 4 }`). Merged values must stay positive numbers —
   * `cycle` an integer ≥ 1, `chance` inside (0, 1].
   */
  eventDefaults?: Partial<EventDefaults>;
  /** Mission to play; defaults to `"auto"` (see `MissionOption`). */
  mission?: MissionOption;
  /**
   * Fully resolved mission to apply verbatim — the log-reconstruction
   * path (`startOptionsFromHeader`) feeds the recorded `header.mission`
   * here; `null` means the recorded game ran without a mission. Takes
   * precedence over `mission` for the game state and performs no RNG
   * draws (the `mission` option still lands in the header `config` for
   * provenance). Target node ids are checked against the map
   * (`GameConfigError`); the generation criteria held at record time
   * and are not re-checked.
   */
  resolvedMission?: RecordedMission | null;
  /**
   * Fully resolved camera nodes to apply verbatim — the reconstruction
   * path feeds the recorded `header.cameras` here. Takes precedence
   * over `placeCameras` (no RNG draws); every camera starts active.
   * Unknown node ids raise `GameConfigError`.
   */
  resolvedCameras?: readonly string[];
  /**
   * Id recorded in the log header; defaults to `g-{seed}`. Must be
   * part of the inputs when bit-identical logs are required.
   */
  gameId?: string;
}

export interface GameState {
  map: MapPack | null;
  round: number;
  phase: GamePhase;
  activeDetectiveIndex: number;
  ganovePosition: string | null;
  detektivePositions: string[];
  mission: Mission | null;
  events: GameEvent[];
  cameras: Camera[];
  blockedEdges: BlockedEdge[];
  eventMode: EventMode;
  /** Effective event cadence (map defaults merged with the override). */
  eventDefaults: EventDefaults;
  tensionValue: number;
  seed: number;
  log: LogEntry[];
  /** `null` while the game runs; a `GameOutcome` once it is finished. */
  outcome: GameOutcome | null;
  /** Effective round limit; `null` = unlimited (only Fang/Flucht decide). */
  roundLimit: number | null;
  /**
   * Nodes that end the game with an escape when the ganove reaches them.
   * With a running mission this is exactly the drawn mission escape
   * node (mission-bound escape — and only while `stage === "flucht"`);
   * without a mission it is every `flucht`-category node. Overridable
   * via `setEscapeNodeIds` (test hook).
   */
  escapeNodeIds: string[];
  /**
   * Manual hook: whether the ganove may execute an action round this
   * round (Aktionsrunde — the only legal exception to Zugzwang).
   * The effective availability additionally covers the mission action
   * at his position (see `getMissionAction`) — a mission needs no flag.
   */
  ganoveCanAct: boolean;
  /** Police radio has already been tapped (once per game). */
  radioUsed: boolean;
  /** Effective police-radio depth (how many hints `useRadio` reports). */
  radioHintCount: number;
  /** Effective `umwelt` block duration in rounds. */
  edgeBlockRounds: number;
  /** `funkstille` sabotage: hint events suppressed up to this round (0 = off). */
  hintSilenceUntilRound: number;
  /** `falsche_spur` sabotage: `hinweis` events falsified up to this round (0 = off). */
  falseTrailUntilRound: number;

  startGame: (map: MapPack, seed: number, options?: StartGameOptions) => void;
  resetGame: () => void;
  appendLog: (entry: LogInput) => void;
  /** "Partie exportieren": the log as a downloadable JSONL Blob. */
  exportGameLog: () => Blob | null;
  endGanovePhase: () => void;
  advanceDetective: () => void;
  endDetectivePhase: () => void;
  moveGanove: (target: string) => void;
  moveDetective: (target: string) => void;
  ganoveAction: () => void;
  chooseMissionPath: (choice: "sabotage" | "flucht") => void;
  abortAsDraw: () => void;
  getLegalGanoveMoves: () => MoveTarget[];
  getLegalDetectiveMoves: () => MoveTarget[];
  /** The mission action executable this round at the ganove's position. */
  getMissionAction: () => MissionKind | null;
  /** Detective-facing mission structure: steps + status, never node ids. */
  getMissionStructure: () => MissionStructureStep[];
  setEscapeNodeIds: (nodeIds: string[]) => void;
  setGanoveCanAct: (canAct: boolean) => void;
  setMission: (mission: Mission | null) => void;
  addEvent: (event: GameEvent) => void;
  useRadio: () => void;
  deactivateCameras: () => void;
  getHeatLevel: () => { level: HeatLevel; score: number };
  setCameras: (nodeIds: readonly string[]) => void;
  blockEdge: (a: string, b: string, untilRound: number) => void;
  unblockExpiredEdges: () => void;
  setTension: (value: number) => void;
  setEventMode: (mode: EventMode) => void;
}

type GameData = Omit<
  GameState,
  | "startGame"
  | "resetGame"
  | "appendLog"
  | "exportGameLog"
  | "endGanovePhase"
  | "advanceDetective"
  | "endDetectivePhase"
  | "moveGanove"
  | "moveDetective"
  | "ganoveAction"
  | "chooseMissionPath"
  | "abortAsDraw"
  | "getLegalGanoveMoves"
  | "getLegalDetectiveMoves"
  | "getMissionAction"
  | "getMissionStructure"
  | "setEscapeNodeIds"
  | "setGanoveCanAct"
  | "setMission"
  | "addEvent"
  | "useRadio"
  | "deactivateCameras"
  | "getHeatLevel"
  | "setCameras"
  | "blockEdge"
  | "unblockExpiredEdges"
  | "setTension"
  | "setEventMode"
>;

/** Fresh data state — new array instances on every call. */
function initialData(): GameData {
  return {
    map: null,
    round: 1,
    phase: "ganove",
    activeDetectiveIndex: 0,
    ganovePosition: null,
    detektivePositions: [],
    mission: null,
    events: [],
    cameras: [],
    blockedEdges: [],
    eventMode: "tension",
    eventDefaults: { cycle: 0, chance: 0, threshold: 0, perRound: 0 },
    tensionValue: 0,
    seed: 0,
    log: [],
    outcome: null,
    roundLimit: null,
    escapeNodeIds: [],
    ganoveCanAct: false,
    radioUsed: false,
    radioHintCount: 0,
    edgeBlockRounds: 0,
    hintSilenceUntilRound: 0,
    falseTrailUntilRound: 0,
  };
}

function resolveSpawnPositions(
  map: MapPack,
  rng: Rng,
  options?: StartGameOptions,
  missionTargets?: MissionTargets | null,
): { detectivePositions: string[]; ganovePosition: string } {
  const count =
    options?.detectiveCount ??
    options?.detectivePositions?.length ??
    map.settings.detectiveCount.suggested;

  let detectivePositions: string[];
  if (options?.detectivePositions !== undefined) {
    const allowed = new Set(detectiveSpawnChoices(map));
    for (const pos of options.detectivePositions) {
      if (!allowed.has(pos)) {
        throw new SpawnError(`detective spawn ${JSON.stringify(pos)} is not an allowed node`);
      }
    }
    detectivePositions = [...options.detectivePositions];
  } else {
    detectivePositions = pickDetectiveSpawns(map, rng, count);
  }

  let ganovePosition: string;
  if (options?.ganovePosition !== undefined) {
    if (!ganoveSpawnChoices(map, detectivePositions).includes(options.ganovePosition)) {
      throw new SpawnError(
        `ganove spawn ${JSON.stringify(options.ganovePosition)} violates spawnRules ` +
          `(not allowed or below minDistanceToDetective)`,
      );
    }
    ganovePosition = options.ganovePosition;
  } else {
    // Fixed-target missions (case/custom/recorded) additionally exclude
    // spawn positions that violate the mission criteria — a drawn start
    // that would immediately fail `resolveMission` is never picked.
    ganovePosition = pickGanoveSpawnForMission(map, rng, detectivePositions, missionTargets);
  }

  return { detectivePositions, ganovePosition };
}

/**
 * Effective round limit for a new game. `null` (unlimited) requires
 * `settings.roundLimit.unlimited`; numbers must be integers inside the
 * map's `[min, max]` corridor — otherwise `GameConfigError` is thrown.
 */
function resolveRoundLimit(map: MapPack, option: number | null | undefined): number | null {
  const setting = map.settings.roundLimit;
  const value = option === undefined ? setting.suggested : option;
  if (value === null) {
    if (setting.unlimited !== true) {
      throw new GameConfigError(
        `roundLimit: unlimited games are not allowed on map ${JSON.stringify(map.id)}`,
      );
    }
    return null;
  }
  if (
    !Number.isInteger(value) ||
    value < setting.min ||
    (setting.max !== undefined && value > setting.max)
  ) {
    const max = setting.max === undefined ? "∞" : setting.max;
    throw new GameConfigError(
      `roundLimit ${value} is outside the allowed range [${setting.min}, ${max}]`,
    );
  }
  return value;
}

/**
 * Resolves a plain `{suggested, min, max}` map setting against an
 * optional override — the integer must lie inside the allowed corridor,
 * otherwise `GameConfigError` is thrown (same contract as
 * `resolveRoundLimit`, which additionally handles `unlimited`).
 */
function resolveRangeSetting(
  setting: RangeSetting,
  option: number | undefined,
  label: string,
): number {
  const value = option ?? setting.suggested;
  if (
    !Number.isInteger(value) ||
    value < setting.min ||
    (setting.max !== undefined && value > setting.max)
  ) {
    const max = setting.max === undefined ? "∞" : setting.max;
    throw new GameConfigError(
      `${label} ${value} is outside the allowed range [${setting.min}, ${max}]`,
    );
  }
  return value;
}

/**
 * Validates the camera exclusion list: every id must exist on the map,
 * otherwise `GameConfigError` is thrown.
 */
function resolveCameraProtectedNodes(map: MapPack, option: string[] | undefined): string[] {
  if (option === undefined) {
    return [];
  }
  const known = new Set(map.nodes.map((node) => node.id));
  for (const id of option) {
    if (!known.has(id)) {
      throw new GameConfigError(
        `cameraProtectedNodes: node ${JSON.stringify(id)} does not exist on map ${JSON.stringify(map.id)}`,
      );
    }
  }
  return [...option];
}

/**
 * Effective event trigger mode for a new game: the map's
 * `settings.eventMode` unless an option override names another valid
 * mode (`GameConfigError` otherwise).
 */
function resolveEventMode(map: MapPack, option: EventMode | undefined): EventMode {
  if (option === undefined) {
    return map.settings.eventMode;
  }
  if (!(EVENT_MODES as readonly string[]).includes(option)) {
    throw new GameConfigError(
      `eventMode ${JSON.stringify(option)} is not one of ${EVENT_MODES.join("|")}`,
    );
  }
  return option;
}

/**
 * Effective event cadence for a new game: `settings.eventDefaults`
 * merged with the optional override. Every merged value must stay a
 * positive number — `cycle` an integer ≥ 1, `chance` inside (0, 1],
 * `threshold`/`perRound` > 0 — otherwise `GameConfigError` is thrown.
 */
function resolveEventDefaults(
  map: MapPack,
  option: Partial<EventDefaults> | undefined,
): EventDefaults {
  const merged: EventDefaults = { ...map.settings.eventDefaults, ...option };
  if (!Number.isInteger(merged.cycle) || merged.cycle < 1) {
    throw new GameConfigError(`eventDefaults.cycle ${merged.cycle} must be an integer >= 1`);
  }
  if (
    typeof merged.chance !== "number" ||
    !Number.isFinite(merged.chance) ||
    merged.chance <= 0 ||
    merged.chance > 1
  ) {
    throw new GameConfigError(`eventDefaults.chance ${merged.chance} must be inside (0, 1]`);
  }
  for (const key of ["threshold", "perRound"] as const) {
    const value = merged[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      throw new GameConfigError(`eventDefaults.${key} ${value} must be a positive number`);
    }
  }
  return merged;
}

/**
 * Salt that separates mission runtime draws (sabotage effect, falsified
 * trail zones) from the event-roll stream of the same round — both use
 * `mixSeed(seed, round)` as their base, so the draws stay deterministic
 * but uncorrelated.
 */
const MISSION_RNG_SALT = 0x5ab07a6e;

function missionRng(seed: number, round: number): Rng {
  return createRng(mixSeed(seed ^ MISSION_RNG_SALT, round));
}

/** Every node id that may carry a mission target — empty without pools. */
function missionPoolsPresent(map: MapPack): boolean {
  const categories = new Set(map.nodes.flatMap((node) => node.categories));
  return categories.has("diebstahl") && categories.has("kontakt") && categories.has("flucht");
}

/**
 * Resolves the mission for a new game (spec section 5.2). The RNG
 * position is after the spawn draws and before camera placement, so a
 * given seed always produces the same mission.
 *
 * - `"auto"` generates when the category pools exist and a conforming
 *   mission can be drawn for the ganove's spawn — otherwise `null`.
 * - `"random"` always tries to generate and rethrows
 *   `MissionGenerationError` when impossible.
 * - `{ type: "case" }` takes the targets of a bundled "Fall" and checks
 *   them against the generation criteria for the actual spawn
 *   (`GameConfigError` on violation).
 * - `{ type: "custom" }` validates the chosen targets against
 *   categories and criteria (`GameConfigError` listing the findings).
 * - `"none"` disables the mission (all `flucht` nodes stay escape points).
 */
function resolveMission(
  map: MapPack,
  graph: ReturnType<typeof buildGraph>,
  ganovePosition: string,
  rng: Rng,
  option: MissionOption | undefined,
): Mission | null {
  const choice = option ?? "auto";
  if (choice === "none") {
    return null;
  }
  if (typeof choice === "object" && choice.type === "case") {
    const entry = getMissionCase(loadMissionSet(map), choice.id);
    const targets = caseTargets(entry);
    const violations = missionCriteriaViolations(
      graph,
      map.settings.missionRules,
      targets,
      ganovePosition,
    );
    if (violations.length > 0) {
      throw new GameConfigError(
        `mission case ${JSON.stringify(choice.id)} violates generation criteria ` +
          `for start ${JSON.stringify(ganovePosition)}: ${violations.join(", ")}`,
      );
    }
    return newMissionState(choice.id, targets, entry.name, entry.story);
  }
  if (typeof choice === "object" && choice.type === "custom") {
    const targets: MissionTargets = {
      diebstahl: choice.targets.diebstahl,
      kontakt: choice.targets.kontakt,
      flucht: choice.targets.flucht,
      sabotage: choice.targets.sabotage ?? null,
    };
    const errors = validateCustomTargets(map, graph, targets, ganovePosition);
    if (errors.length > 0) {
      throw new GameConfigError(`custom mission rejected:\n- ${errors.join("\n- ")}`);
    }
    return newMissionState("custom", targets);
  }
  if (choice !== "auto" && choice !== "random") {
    throw new GameConfigError(`unknown mission option ${JSON.stringify(choice)}`);
  }
  if (!missionPoolsPresent(map)) {
    if (choice === "random") {
      throw new MissionGenerationError(
        `map ${JSON.stringify(map.id)} lacks a required mission category pool`,
      );
    }
    return null;
  }
  try {
    const targets = generateMission(map, graph, ganovePosition, rng);
    return newMissionState("random", targets);
  } catch (error) {
    if (choice === "auto" && error instanceof MissionGenerationError) {
      return null;
    }
    throw error;
  }
}

function newMissionState(
  id: string,
  targets: MissionTargets,
  name?: string,
  story?: string,
): Mission {
  return {
    id,
    name,
    story,
    targets,
    stage: "diebstahl",
    pendingChoice: null,
    offeredEffect: null,
    appliedEffect: null,
  };
}

/**
 * Log-reconstruction path: applies the mission recorded in the `header`
 * verbatim — `null` means the recorded game ran without a mission (the
 * `mission` option `"none"`, or `"auto"` without a generatable draw).
 * Every target node id must exist on the map (`GameConfigError`
 * otherwise); the generation criteria held at record time and are not
 * re-checked. A case-fixed `sabotageEffect` inside `targets` travels
 * along untouched.
 */
function resolveRecordedMission(map: MapPack, recorded: RecordedMission | null): Mission | null {
  if (recorded === null) {
    return null;
  }
  const known = new Set(map.nodes.map((node) => node.id));
  for (const id of missionTargetIds(recorded.targets)) {
    if (!known.has(id)) {
      throw new GameConfigError(
        `resolvedMission: target node ${JSON.stringify(id)} does not exist on map ${JSON.stringify(map.id)}`,
      );
    }
  }
  return newMissionState(recorded.id, recorded.targets, recorded.name, recorded.story);
}

/**
 * Log-reconstruction path: applies the camera node ids recorded in the
 * `header` verbatim (all active). Unknown ids raise `GameConfigError`.
 */
function resolveRecordedCameras(map: MapPack, nodeIds: readonly string[]): Camera[] {
  const known = new Set(map.nodes.map((node) => node.id));
  for (const id of nodeIds) {
    if (!known.has(id)) {
      throw new GameConfigError(
        `resolvedCameras: node ${JSON.stringify(id)} does not exist on map ${JSON.stringify(map.id)}`,
      );
    }
  }
  return nodeIds.map((nodeId) => ({ nodeId, active: true }));
}

function moveContext(state: {
  map: MapPack | null;
  round: number;
  blockedEdges: BlockedEdge[];
  ganovePosition: string | null;
  detektivePositions: string[];
}): MoveContext {
  return {
    // `moveContext` is only called while a game is running.
    graph: buildGraph(state.map as MapPack),
    round: state.round,
    blockedEdges: state.blockedEdges,
    ganovePosition: state.ganovePosition as string,
    detektivePositions: state.detektivePositions,
  };
}

/**
 * Zustand store holding the game state specified in
 * `02-technisches-konzept.md` section 3. Deliberately headless-capable:
 * it carries no React dependency beyond the hook binding, so simulations
 * can drive it via `useGameStore.getState()` / `setState()` without a UI.
 *
 * The round engine (`01-spielkonzept.md` sections 3 and 7) lives in the
 * move actions: `moveGanove`/`moveDetective` validate via `Movement.ts`,
 * run the catch check after every single detective move and drive the
 * phase machine; `ganoveAction` is the action-round hook; the game ends
 * via `outcome` (caught / surrounded / escaped / timeout / draw).
 */
export const useGameStore = create<GameState>((set, get) => {
  const finish = (outcome: GameOutcome): void => {
    const { round, events } = get();
    // Balancing metrics of the result line (spec section 8): hints the
    // detectives received and how many cameras fired this game.
    const hintsTotal = events.filter((event) => HINT_EVENT_KINDS.includes(event.kind)).length;
    const camerasTriggered = events.filter((event) => event.kind === "camera").length;
    set({ outcome });
    get().appendLog({
      round,
      type: "result",
      outcome,
      rounds: round,
      hintsTotal,
      camerasTriggered,
      visibleTo: "both",
    });
    // Auto-persist the finished log — a no-op where localStorage is
    // unavailable (headless runs, tests), so the store stays pure.
    saveGameLog(get().log);
  };

  /**
   * Whether the ganove may spend this round on an action — either via
   * the manual `ganoveCanAct` test hook or through an executable
   * mission action at his position (spec sections 5.3 and 7: a ganove
   * on the current target node is NOT surrounded).
   */
  const canGanoveAct = (): boolean => {
    const state = get();
    return (
      state.ganoveCanAct || executableMissionAction(state.mission, state.ganovePosition) !== null
    );
  };

  /**
   * Surrounded check — runs "at the start of the ganove's phase"
   * (spec section 7): no legal move AND no executable action ⇒ caught.
   */
  const checkGanoveSurrounded = (): void => {
    const state = get();
    if (
      state.map !== null &&
      state.ganovePosition !== null &&
      state.outcome === null &&
      state.phase === "ganove" &&
      legalGanoveMoves(moveContext(state)).length === 0 &&
      !canGanoveAct()
    ) {
      finish("surrounded");
    }
  };

  /**
   * Round-end sequence once the last detective has moved: timeout check,
   * then round increment + expired edge unblocking + surrounded check.
   */
  const completeDetectivePhase = (): void => {
    const state = get();
    if (state.map !== null && state.roundLimit !== null && state.round >= state.roundLimit) {
      finish("timeout");
      return;
    }
    set((s) => ({ phase: "ganove", round: s.round + 1, activeDetectiveIndex: 0 }));
    get().unblockExpiredEdges();
    checkGanoveSurrounded();
  };

  /**
   * Camera check after the ganove entered a node (spec section 3.1):
   * an active camera on his new node produces a detective-only hint
   * with the exact node and the triggering round.
   */
  const runCameraCheck = (): void => {
    const state = get();
    const position = state.ganovePosition;
    if (position === null) {
      return;
    }
    const camera = triggeredCamera(state.cameras, position);
    if (camera === undefined) {
      return;
    }
    get().addEvent({
      kind: "camera",
      round: state.round,
      nodeId: camera.nodeId,
      visibleTo: "detectives",
    });
    get().appendLog({
      round: state.round,
      type: "hint",
      kind: "camera",
      node: camera.nodeId,
      visibleTo: "detectives",
    });
  };

  /** Appends an info-layer event plus its matching log entry. */
  const emitInfoEvent = (event: GameEvent): void => {
    get().addEvent(event);
    get().appendLog({
      round: event.round,
      type: event.kind === "umwelt" ? "event" : "hint",
      kind: event.kind,
      node: event.nodeId,
      zone: event.zone,
      nodeIds: event.nodeIds,
      edge: event.edge,
      untilRound: event.untilRound,
      ...event.details,
      visibleTo: event.visibleTo,
    });
  };

  /** `umwelt` event: blocks a connectivity-safe edge for both sides. */
  const emitUmwelt = (map: MapPack, round: number, rng: Rng): void => {
    const state = get();
    const edge = pickBlockableEdge(buildGraph(map), map.edges, state.blockedEdges, round, rng);
    if (edge === null) {
      return;
    }
    const untilRound = round + state.edgeBlockRounds - 1;
    get().blockEdge(edge.a, edge.b, untilRound);
    emitInfoEvent({
      kind: "umwelt",
      round,
      edge: { a: edge.a, b: edge.b },
      untilRound,
      visibleTo: "both",
    });
  };

  /**
   * `falsche_spur` sabotage: emits a zone hint that is formally valid
   * but deliberately wrong — the mission RNG picks a different zone and
   * a node inside it, and the `nodeIds` ball is computed around that
   * decoy so the hint stays internally consistent.
   */
  const emitFalseTrailHint = (map: MapPack, position: string, round: number): void => {
    const state = get();
    const graph = buildGraph(map);
    const trueZone = map.nodes.find((node) => node.id === position)?.zone;
    const zones = [...new Set(map.nodes.map((node) => node.zone))].filter(
      (zone) => zone !== trueZone,
    );
    if (zones.length === 0) {
      return;
    }
    const rng = missionRng(state.seed, round);
    const zone = rng.pick(zones);
    const decoys = map.nodes.filter((node) => node.zone === zone).map((node) => node.id);
    const hint = zoneHint(rng.pick(decoys), map, graph, map.settings.hintZoneRadius);
    if (hint !== null) {
      emitInfoEvent({
        kind: "hinweis",
        round,
        zone: hint.zone,
        nodeIds: hint.nodeIds,
        visibleTo: "detectives",
      });
    }
  };

  /** Produces the drawn event type for the current round. */
  const emitRoundEvent = (
    type: EventTypeKind,
    map: MapPack,
    position: string,
    round: number,
    rng: Rng,
  ): void => {
    const state = get();
    // funkstille sabotage: hint-giving events are suppressed for the
    // duration; umwelt is world state (visible to both) and stays.
    if ((type === "sichtbarkeit" || type === "hinweis") && round <= state.hintSilenceUntilRound) {
      return;
    }
    if (type === "sichtbarkeit") {
      emitInfoEvent({ kind: "sichtbarkeit", round, nodeId: position, visibleTo: "detectives" });
      return;
    }
    if (type === "hinweis") {
      if (round <= state.falseTrailUntilRound) {
        emitFalseTrailHint(map, position, round);
        return;
      }
      const hint = zoneHint(position, map, buildGraph(map), map.settings.hintZoneRadius);
      if (hint !== null) {
        emitInfoEvent({
          kind: "hinweis",
          round,
          zone: hint.zone,
          nodeIds: hint.nodeIds,
          visibleTo: "detectives",
        });
      }
      return;
    }
    emitUmwelt(map, round, rng);
  };

  /**
   * Event roll once per ganove turn (spec sections 4.2/4.3). The RNG is
   * derived from `seed`+`round`, so replays stay deterministic and the
   * serializable state carries no RNG instance. `hinweis`/`sichtbarkeit`
   * land in the detectives' chronicle before their moves; `umwelt`
   * blocks an edge for both sides for `edgeBlockRounds` rounds.
   */
  const runEventRoll = (): void => {
    const state = get();
    const map = state.map;
    const position = state.ganovePosition;
    if (map === null || position === null || state.outcome !== null) {
      return;
    }
    const rng = createRng(mixSeed(state.seed, state.round));
    const trigger = rollTrigger(
      state.eventMode,
      state.round,
      state.tensionValue,
      state.eventDefaults,
      rng,
    );
    if (trigger.tensionValue !== state.tensionValue) {
      set({ tensionValue: trigger.tensionValue });
    }
    if (!trigger.fires) {
      return;
    }
    emitRoundEvent(drawEventType(map.settings.eventMix, rng), map, position, state.round, rng);
  };

  /**
   * Applies the executed sabotage effect (spec section 5.4):
   * `kamera_aus` kills every camera for the rest of the game,
   * `funkstille` suppresses hint events for `sabotageDuration` rounds,
   * `falsche_spur` falsifies zone hints for the same window. Both
   * windows start the round after the action round.
   */
  const applySabotageEffect = (effect: SabotageEffect): void => {
    const state = get();
    const map = state.map as MapPack;
    const untilRound = state.round + sabotageDuration(map);
    if (effect === "kamera_aus") {
      get().deactivateCameras();
    } else if (effect === "funkstille") {
      set({ hintSilenceUntilRound: untilRound });
    } else {
      set({ falseTrailUntilRound: untilRound });
    }
    get().appendLog({
      round: state.round,
      type: "sabotage",
      effect,
      untilRound: effect === "kamera_aus" ? null : untilRound,
      visibleTo: "ganove",
    });
  };

  /**
   * Advances the mission stage after an executed action:
   * diebstahl → kontakt → (sabotage offer | direct flucht) →
   * sabotage → flucht. The kontakt action determines the offered effect
   * in the same step (spec section 5.4): a case-fixed
   * `targets.sabotageEffect` wins, otherwise `drawSabotageEffect` pulls
   * from the map's pool. On maps without a sabotage pool there is no
   * offer and the mission goes straight to "flucht".
   */
  const advanceMission = (action: MissionKind): void => {
    const state = get();
    const mission = state.mission;
    const map = state.map;
    if (mission === null || map === null) {
      return;
    }
    if (action === "diebstahl") {
      set({ mission: { ...mission, stage: "kontakt" } });
      return;
    }
    if (action === "kontakt") {
      if (mission.targets.sabotage === null) {
        set({ mission: { ...mission, stage: "flucht" } });
        return;
      }
      // A case-fixed sabotageEffect (predefined "Fälle") takes
      // precedence over the seeded random draw.
      const effect =
        mission.targets.sabotageEffect ??
        drawSabotageEffect(map, missionRng(state.seed, state.round));
      set({
        mission: {
          ...mission,
          stage: "wahl",
          pendingChoice: { sabotageNode: mission.targets.sabotage, effect },
          offeredEffect: effect,
        },
      });
      get().appendLog({
        round: state.round,
        type: "sabotage_offer",
        offered: effect,
        node: mission.targets.sabotage,
        visibleTo: "ganove",
      });
      return;
    }
    if (action === "sabotage") {
      const effect = mission.offeredEffect;
      if (effect !== null) {
        applySabotageEffect(effect);
      }
      set({
        mission: { ...mission, stage: "flucht", appliedEffect: effect },
      });
    }
  };

  const requireRunningGame = (phase?: GamePhase): void => {
    const state = get();
    if (state.map === null) {
      throw new MoveError("no_game", "no game is running");
    }
    if (state.outcome !== null) {
      throw new MoveError("game_over", `the game is already finished (${state.outcome})`);
    }
    if (phase !== undefined && state.phase !== phase) {
      throw new MoveError(
        "wrong_phase",
        `action requires phase ${JSON.stringify(phase)} but phase is ${JSON.stringify(state.phase)}`,
      );
    }
  };

  return {
    ...initialData(),

    startGame: (map, seed, options) => {
      // One RNG stream per game: spawns first (unchanged draw order),
      // then the camera placement — same seed, same game.
      const rng = createRng(seed);
      // Fixed mission targets are known before the spawn draw — they
      // constrain which ganove spawns may be drawn (criteria-checked).
      const fixedTargets =
        options?.resolvedMission !== undefined
          ? (options.resolvedMission?.targets ?? null)
          : resolveFixedTargets(map, options?.mission);
      const { detectivePositions, ganovePosition } = resolveSpawnPositions(
        map,
        rng,
        options,
        fixedTargets,
      );
      const roundLimit = resolveRoundLimit(map, options?.roundLimit);
      const cameraCount = resolveRangeSetting(
        map.settings.cameraCount,
        options?.cameraCount,
        "cameraCount",
      );
      const radioHintCount = resolveRangeSetting(
        map.settings.radioHintCount,
        options?.radioHintCount,
        "radioHintCount",
      );
      const edgeBlockRounds = resolveRangeSetting(
        map.settings.edgeBlockRounds,
        options?.edgeBlockRounds,
        "edgeBlockRounds",
      );
      const eventMode = resolveEventMode(map, options?.eventMode);
      const eventDefaults = resolveEventDefaults(map, options?.eventDefaults);
      const graph = buildGraph(map);
      // Log-reconstruction path: a recorded mission/camera list is
      // applied verbatim and performs no draws, so the reconstructed
      // start is identical to the recorded one regardless of how many
      // RNG draws the original spawn resolution consumed.
      const mission =
        options?.resolvedMission !== undefined
          ? resolveRecordedMission(map, options.resolvedMission)
          : resolveMission(map, graph, ganovePosition, rng, options?.mission);
      // Public rule (spec section 4.1): mission target nodes never
      // carry a camera — they join the caller's exclusion list.
      const cameraProtectedNodes = resolveCameraProtectedNodes(map, options?.cameraProtectedNodes);
      const cameras =
        options?.resolvedCameras !== undefined
          ? resolveRecordedCameras(map, options.resolvedCameras)
          : placeCameras(graph, rng, cameraCount, map.settings.cameraMinGap, [
              ...cameraProtectedNodes,
              ...(mission !== null ? missionTargetIds(mission.targets) : []),
            ]);
      // The gameId is deterministic (`g-{seed}` default): same seed and
      // same inputs must produce a bit-identical log (spec section 8).
      const gameId = options?.gameId ?? `g-${seed}`;
      set({
        ...initialData(),
        map,
        seed,
        eventMode,
        eventDefaults,
        detektivePositions: detectivePositions,
        ganovePosition,
        roundLimit,
        mission,
        // Mission-bound escape: only the drawn mission escape node ends
        // the game (without a mission every flucht node does).
        escapeNodeIds: mission !== null ? [mission.targets.flucht] : mapEscapeNodeIds(map),
        cameras,
        radioHintCount,
        edgeBlockRounds,
      });
      get().appendLog({
        round: 0,
        type: "header",
        gameId,
        mapId: map.id,
        seed,
        config: {
          detectiveCount: detectivePositions.length,
          roundLimit,
          cameraCount,
          radioHintCount,
          edgeBlockRounds,
          eventMode,
          eventDefaults,
          mission: options?.mission ?? "auto",
          cameraProtectedNodes,
        },
        mission:
          mission !== null
            ? {
                id: mission.id,
                name: mission.name,
                story: mission.story,
                targets: mission.targets,
              }
            : null,
        cameras: cameras.map((camera) => camera.nodeId),
        starts: { detectives: detectivePositions, ganove: ganovePosition },
        visibleTo: "both",
      });
      // The game starts in the ganove phase — check surrounded immediately.
      checkGanoveSurrounded();
    },

    resetGame: () => set({ ...initialData() }),

    appendLog: (entry) =>
      set((state) => ({
        log: [
          ...state.log,
          {
            // The header carries `seq: 0` and is serialized without it —
            // event seqs count 1..n across the game (spec section 8).
            seq:
              entry.type === "header" ? 0 : state.log.filter((e) => e.type !== "header").length + 1,
            ...entry,
          },
        ],
      })),

    exportGameLog: () => exportGameLogFile(get().log),

    endGanovePhase: () =>
      set((state) =>
        state.phase === "ganove" ? { phase: "detektive", activeDetectiveIndex: 0 } : state,
      ),

    advanceDetective: () =>
      set((state) =>
        state.phase === "detektive"
          ? { activeDetectiveIndex: state.activeDetectiveIndex + 1 }
          : state,
      ),

    endDetectivePhase: () => {
      const state = get();
      if (state.phase !== "detektive" || state.outcome !== null) {
        return;
      }
      if (state.map === null) {
        set({ phase: "ganove", round: state.round + 1, activeDetectiveIndex: 0 });
        return;
      }
      completeDetectivePhase();
    },

    /**
     * Ganove moves to `target` (one edge, any type). Illegal targets throw
     * `MoveError`. Reaching a node in `escapeNodeIds` ends the game with
     * `escaped`; otherwise the detektive phase begins.
     */
    moveGanove: (target) => {
      requireRunningGame("ganove");
      const state = get();
      if (state.mission?.pendingChoice != null) {
        throw new MoveError(
          "mission_choice_pending",
          "the informant's sabotage offer must be answered (chooseMissionPath) before moving",
        );
      }
      const move = validateGanoveMove(moveContext(state), target);
      const from = state.ganovePosition;
      set({ ganovePosition: target });
      get().appendLog({
        round: state.round,
        type: "move",
        actor: "ganove",
        from,
        to: target,
        edgeType: move.edgeType,
        // The ganove's position stays hidden from the detectives.
        visibleTo: "ganove",
      });
      // Mission-bound escape: the drawn escape node only wins once the
      // mission reached its "flucht" stage — earlier visits are plain
      // moves. Without a mission every escape node wins on arrival.
      if (
        state.escapeNodeIds.includes(target) &&
        (state.mission === null || state.mission.stage === "flucht")
      ) {
        finish("escaped");
        return;
      }
      // Info checks run internally right after the ganove's move
      // (spec section 3.1) — hints reach the detectives before theirs.
      runCameraCheck();
      runEventRoll();
      set({ phase: "detektive", activeDetectiveIndex: 0 });
    },

    /**
     * The active detective (fixed order D1→Dn) moves to `target`.
     * The catch check runs immediately after this single move — when the
     * detective lands on the ganove's node the game ends right away, even
     * with detectives still queued. Otherwise the next detective moves or
     * the round completes after the last one.
     */
    moveDetective: (target) => {
      requireRunningGame("detektive");
      const state = get();
      const index = state.activeDetectiveIndex;
      const move = validateDetectiveMove(moveContext(state), index, target);
      const from = state.detektivePositions[index];
      set((s) => ({
        detektivePositions: s.detektivePositions.map((pos, i) => (i === index ? target : pos)),
      }));
      get().appendLog({
        round: state.round,
        type: "move",
        actor: "detective",
        detectiveIndex: index,
        from,
        to: target,
        edgeType: move.edgeType,
        // The ganove sees all detective positions exactly.
        visibleTo: "both",
      });
      if (target === state.ganovePosition) {
        finish("caught");
        return;
      }
      if (index === state.detektivePositions.length - 1) {
        completeDetectivePhase();
      } else {
        set({ activeDetectiveIndex: index + 1 });
      }
    },

    /**
     * Action round of the ganove — the only legal exception to Zugzwang
     * (spec section 5.3): the ganove stays put and remains fully
     * catchable. A mission action emits its exact trace hint before the
     * detectives move (`aktion` event, weight +2 in the heat
     * indicator), then advances the mission stage: the kontakt action
     * produces the informant's sabotage offer (`pendingChoice`), the
     * sabotage action applies its effect.
     */
    ganoveAction: () => {
      requireRunningGame("ganove");
      const state = get();
      if (state.mission?.pendingChoice != null) {
        throw new MoveError(
          "mission_choice_pending",
          "the informant's sabotage offer must be answered (chooseMissionPath) before acting",
        );
      }
      const action = executableMissionAction(state.mission, state.ganovePosition);
      if (action === null && !state.ganoveCanAct) {
        throw new MoveError(
          "no_action_available",
          "the ganove has no executable action this round",
        );
      }
      get().appendLog({
        round: state.round,
        type: "action",
        actor: "ganove",
        node: state.ganovePosition,
        action,
        visibleTo: "ganove",
      });
      if (action !== null) {
        // Exact trace hint, visible to the detectives before their
        // moves of the same round — never carries the binary choice.
        emitInfoEvent({
          kind: "aktion",
          round: state.round,
          nodeId: state.ganovePosition ?? undefined,
          visibleTo: "detectives",
          details: { action },
        });
        advanceMission(action);
      }
      // No camera check — the ganove stays on his node (Betreten ≠
      // Verharren); the event roll still runs for this round.
      runEventRoll();
      set({ phase: "detektive", activeDetectiveIndex: 0 });
    },

    /**
     * The ganove's final binary choice after the kontakt action (spec
     * section 5.4): accept the informant's sabotage offer or head
     * straight for the escape point — no way back.
     */
    chooseMissionPath: (choice) => {
      requireRunningGame();
      const state = get();
      const pending = state.mission?.pendingChoice;
      if (state.mission === null || pending == null) {
        throw new MoveError("no_mission_choice", "there is no pending sabotage offer to answer");
      }
      const stage: MissionStage = choice === "sabotage" ? "sabotage" : "flucht";
      set({
        mission: { ...state.mission, stage, pendingChoice: null },
      });
      get().appendLog({
        round: state.round,
        // The resolved offer reuses the spec's record shape
        // (section 8 example: sabotage_offer with offered + chosen).
        type: "sabotage_offer",
        offered: pending.effect,
        node: pending.sabotageNode,
        chosen: choice === "sabotage",
        visibleTo: "ganove",
      });
    },

    /** Ends a running game as a draw (Remis, spec section 7). */
    abortAsDraw: () => {
      requireRunningGame();
      finish("draw");
    },

    getLegalGanoveMoves: () => {
      const state = get();
      if (
        state.map === null ||
        state.ganovePosition === null ||
        state.outcome !== null ||
        state.phase !== "ganove"
      ) {
        return [];
      }
      return legalGanoveMoves(moveContext(state));
    },

    getLegalDetectiveMoves: () => {
      const state = get();
      if (state.map === null || state.outcome !== null || state.phase !== "detektive") {
        return [];
      }
      return legalDetectiveMoves(moveContext(state), state.activeDetectiveIndex);
    },

    /** Mission action executable right now at the ganove's position. */
    getMissionAction: () => {
      const state = get();
      if (state.phase !== "ganove" || state.outcome !== null) {
        return null;
      }
      return executableMissionAction(state.mission, state.ganovePosition);
    },

    /** Detective-facing mission structure (no target node ids). */
    getMissionStructure: () => missionStructure(get().mission),

    /**
     * Overrides the escape-node list (mission-bound escape targets).
     * Unknown node ids raise `GameConfigError`.
     */
    setEscapeNodeIds: (nodeIds) => {
      const state = get();
      if (state.map !== null) {
        const known = new Set(state.map.nodes.map((node) => node.id));
        for (const id of nodeIds) {
          if (!known.has(id)) {
            throw new GameConfigError(
              `escape node ${JSON.stringify(id)} does not exist on map ${JSON.stringify(state.map.id)}`,
            );
          }
        }
      }
      set({ escapeNodeIds: [...nodeIds] });
    },

    /** Mission-system hook: marks whether the ganove may act this round. */
    setGanoveCanAct: (canAct) => set({ ganoveCanAct: canAct }),

    setMission: (mission) => set({ mission }),

    addEvent: (event) => set((state) => ({ events: [...state.events, event] })),

    /**
     * Police radio (spec section 4.5): once per game the ganove taps the
     * detectives' channel and learns the last `radioHintCount` hints —
     * including camera triggers. The report lands as a `ganove`-visible
     * event; untriggered cameras and future events are never included.
     */
    useRadio: () => {
      requireRunningGame();
      const state = get();
      if (state.radioUsed) {
        throw new MoveError("already_used", "the police radio can only be tapped once per game");
      }
      const hints = radioHintSummary(state.events, state.radioHintCount);
      set({ radioUsed: true });
      get().addEvent({
        kind: "polizeifunk",
        round: state.round,
        visibleTo: "ganove",
        details: { hints },
      });
      get().appendLog({
        round: state.round,
        type: "radio",
        hintCount: hints.length,
        visibleTo: "ganove",
      });
    },

    /** Sabotage hook: permanently disables every camera. */
    deactivateCameras: () => set((state) => ({ cameras: deactivateAll(state.cameras) })),

    /**
     * Heat indicator for the ganove — level and score only, no hint
     * contents (info-leak safe by construction).
     */
    getHeatLevel: () => heatLevel(get().events, get().round),

    setCameras: (nodeIds) => set({ cameras: nodeIds.map((nodeId) => ({ nodeId, active: true })) }),

    blockEdge: (a, b, untilRound) =>
      set((state) => ({ blockedEdges: [...state.blockedEdges, { a, b, untilRound }] })),

    unblockExpiredEdges: () => {
      const { blockedEdges, round } = get();
      const expired = blockedEdges.filter((edge) => edge.untilRound < round);
      if (expired.length === 0) {
        return;
      }
      set((state) => ({
        blockedEdges: state.blockedEdges.filter((edge) => edge.untilRound >= state.round),
      }));
      // Expiry of an edge block is a world event both sides observe.
      for (const edge of expired) {
        get().appendLog({
          round,
          type: "edge_unblock",
          edge: { a: edge.a, b: edge.b },
          visibleTo: "both",
        });
      }
    },

    setTension: (value) => set({ tensionValue: value }),

    setEventMode: (mode) => set({ eventMode: mode }),
  };
});
