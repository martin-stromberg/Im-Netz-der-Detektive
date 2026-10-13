import { create } from "zustand";
import type { MapPack, RangeSetting } from "../logic/mapPack";
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
  heatLevel,
  radioHintSummary,
  type Camera,
  type GameEvent,
  type HeatLevel,
} from "../logic/InformationSystem";
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
  detectiveSpawnChoices,
  ganoveSpawnChoices,
  pickDetectiveSpawns,
  pickGanoveSpawn,
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

/** Missionszustand (MissionEngine details arrive in a later step). */
export interface Mission {
  id: string;
  targetNodes: string[];
  currentStepIndex: number;
}

export type { Camera, GameEvent, GameEventKind, HeatLevel } from "../logic/InformationSystem";

export interface LogEntry {
  seq: number;
  round: number;
  type: string;
  details?: Record<string, unknown>;
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
  tensionValue: number;
  seed: number;
  log: LogEntry[];
  /** `null` while the game runs; a `GameOutcome` once it is finished. */
  outcome: GameOutcome | null;
  /** Effective round limit; `null` = unlimited (only Fang/Flucht decide). */
  roundLimit: number | null;
  /**
   * Nodes that end the game with an escape when the ganove reaches them.
   * Initialised from the `flucht` node category; the mission system can
   * override the list via `setEscapeNodeIds` (mission-bound escape).
   */
  escapeNodeIds: string[];
  /**
   * Hook for the mission system: whether the ganove can execute an action
   * this round (Aktionsrunde — the only legal exception to Zugzwang).
   * Conservatively `false` until the mission engine fills it.
   */
  ganoveCanAct: boolean;
  /** Police radio has already been tapped (once per game). */
  radioUsed: boolean;
  /** Effective police-radio depth (how many hints `useRadio` reports). */
  radioHintCount: number;
  /** Effective `umwelt` block duration in rounds. */
  edgeBlockRounds: number;

  startGame: (map: MapPack, seed: number, options?: StartGameOptions) => void;
  resetGame: () => void;
  appendLog: (entry: Omit<LogEntry, "seq">) => void;
  endGanovePhase: () => void;
  advanceDetective: () => void;
  endDetectivePhase: () => void;
  moveGanove: (target: string) => void;
  moveDetective: (target: string) => void;
  ganoveAction: () => void;
  abortAsDraw: () => void;
  getLegalGanoveMoves: () => MoveTarget[];
  getLegalDetectiveMoves: () => MoveTarget[];
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
  | "endGanovePhase"
  | "advanceDetective"
  | "endDetectivePhase"
  | "moveGanove"
  | "moveDetective"
  | "ganoveAction"
  | "abortAsDraw"
  | "getLegalGanoveMoves"
  | "getLegalDetectiveMoves"
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
  };
}

function resolveSpawnPositions(
  map: MapPack,
  rng: Rng,
  options?: StartGameOptions,
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
    ganovePosition = pickGanoveSpawn(map, rng, detectivePositions);
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
    const { round } = get();
    set({ outcome });
    get().appendLog({ round, type: "result", details: { outcome, rounds: round } });
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
      !state.ganoveCanAct
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
      details: { kind: "camera", nodeId: camera.nodeId, visibleTo: "detectives" },
    });
  };

  /** Appends an info-layer event plus its matching log entry. */
  const emitInfoEvent = (event: GameEvent): void => {
    get().addEvent(event);
    get().appendLog({
      round: event.round,
      type: event.kind === "umwelt" ? "event" : "hint",
      details: {
        kind: event.kind,
        nodeId: event.nodeId,
        zone: event.zone,
        edge: event.edge,
        untilRound: event.untilRound,
        visibleTo: event.visibleTo,
      },
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

  /** Produces the drawn event type for the current round. */
  const emitRoundEvent = (
    type: EventTypeKind,
    map: MapPack,
    position: string,
    round: number,
    rng: Rng,
  ): void => {
    if (type === "sichtbarkeit") {
      emitInfoEvent({ kind: "sichtbarkeit", round, nodeId: position, visibleTo: "detectives" });
      return;
    }
    if (type === "hinweis") {
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
      map.settings.eventDefaults,
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
      const { detectivePositions, ganovePosition } = resolveSpawnPositions(map, rng, options);
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
      const protectedNodes = resolveCameraProtectedNodes(map, options?.cameraProtectedNodes);
      const cameras = placeCameras(
        buildGraph(map),
        rng,
        cameraCount,
        map.settings.cameraMinGap,
        protectedNodes,
      );
      set({
        ...initialData(),
        map,
        seed,
        eventMode: map.settings.eventMode,
        detektivePositions: detectivePositions,
        ganovePosition,
        roundLimit,
        escapeNodeIds: mapEscapeNodeIds(map),
        cameras,
        radioHintCount,
        edgeBlockRounds,
      });
      get().appendLog({
        round: 1,
        type: "header",
        details: {
          mapId: map.id,
          seed,
          roundLimit,
          cameras: cameras.map((camera) => camera.nodeId),
          starts: { detectives: detectivePositions, ganove: ganovePosition },
        },
      });
      // The game starts in the ganove phase — check surrounded immediately.
      checkGanoveSurrounded();
    },

    resetGame: () => set({ ...initialData() }),

    appendLog: (entry) =>
      set((state) => ({ log: [...state.log, { ...entry, seq: state.log.length + 1 }] })),

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
      const move = validateGanoveMove(moveContext(state), target);
      const from = state.ganovePosition;
      set({ ganovePosition: target });
      get().appendLog({
        round: state.round,
        type: "move",
        details: { actor: "ganove", from, to: target, edgeType: move.edgeType },
      });
      if (state.escapeNodeIds.includes(target)) {
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
        details: {
          actor: "detective",
          detectiveIndex: index,
          from,
          to: target,
          edgeType: move.edgeType,
        },
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
     * catchable. Requires `ganoveCanAct` (mission-system hook); the
     * actual action effects arrive with the mission step.
     */
    ganoveAction: () => {
      requireRunningGame("ganove");
      const state = get();
      if (!state.ganoveCanAct) {
        throw new MoveError(
          "no_action_available",
          "the ganove has no executable action this round",
        );
      }
      get().appendLog({
        round: state.round,
        type: "action",
        details: { actor: "ganove", nodeId: state.ganovePosition },
      });
      // No camera check — the ganove stays on his node (Betreten ≠
      // Verharren); the event roll still runs for this round.
      runEventRoll();
      set({ phase: "detektive", activeDetectiveIndex: 0 });
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
        details: { hintCount: hints.length },
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

    unblockExpiredEdges: () =>
      set((state) => ({
        blockedEdges: state.blockedEdges.filter((edge) => edge.untilRound >= state.round),
      })),

    setTension: (value) => set({ tensionValue: value }),

    setEventMode: (mode) => set({ eventMode: mode }),
  };
});
