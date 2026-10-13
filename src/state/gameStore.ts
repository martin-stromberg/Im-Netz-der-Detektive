import { create } from "zustand";
import type { MapPack } from "../logic/mapPack";
import { createRng } from "../logic/rng";
import {
  detectiveSpawnChoices,
  ganoveSpawnChoices,
  pickDetectiveSpawns,
  pickGanoveSpawn,
  SpawnError,
} from "../logic/SpawnSystem";

export type GamePhase = "ganove" | "detektive";
export type EventMode = "cycle" | "chance" | "tension";

/** Missionszustand (MissionEngine details arrive in a later step). */
export interface Mission {
  id: string;
  targetNodes: string[];
  currentStepIndex: number;
}

/** A hint or world event as it lands in the detectives' chronicle. */
export interface GameEvent {
  kind: string;
  round: number;
  nodeId?: string;
  zone?: string;
  visibleTo: "detectives" | "both";
}

export interface Camera {
  nodeId: string;
  active: boolean;
}

/** An edge blocked until `untilRound` (inclusive) for both sides. */
export interface BlockedEdge {
  a: string;
  b: string;
  untilRound: number;
}

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

  startGame: (map: MapPack, seed: number, options?: StartGameOptions) => void;
  resetGame: () => void;
  appendLog: (entry: Omit<LogEntry, "seq">) => void;
  endGanovePhase: () => void;
  advanceDetective: () => void;
  endDetectivePhase: () => void;
  setMission: (mission: Mission | null) => void;
  addEvent: (event: GameEvent) => void;
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
  | "setMission"
  | "addEvent"
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
  };
}

function resolveSpawnPositions(
  map: MapPack,
  seed: number,
  options?: StartGameOptions,
): { detectivePositions: string[]; ganovePosition: string } {
  const rng = createRng(seed);
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
 * Zustand store holding the game state specified in
 * `02-technisches-konzept.md` section 3. Deliberately headless-capable:
 * it carries no React dependency beyond the hook binding, so simulations
 * can drive it via `useGameStore.getState()` / `setState()` without a UI.
 */
export const useGameStore = create<GameState>((set, get) => ({
  ...initialData(),

  startGame: (map, seed, options) => {
    const { detectivePositions, ganovePosition } = resolveSpawnPositions(map, seed, options);
    set({
      ...initialData(),
      map,
      seed,
      eventMode: map.settings.eventMode,
      detektivePositions: detectivePositions,
      ganovePosition,
    });
    get().appendLog({
      round: 1,
      type: "header",
      details: {
        mapId: map.id,
        seed,
        starts: { detectives: detectivePositions, ganove: ganovePosition },
      },
    });
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

  endDetectivePhase: () =>
    set((state) =>
      state.phase === "detektive"
        ? { phase: "ganove", round: state.round + 1, activeDetectiveIndex: 0 }
        : state,
    ),

  setMission: (mission) => set({ mission }),

  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),

  setCameras: (nodeIds) => set({ cameras: nodeIds.map((nodeId) => ({ nodeId, active: true })) }),

  blockEdge: (a, b, untilRound) =>
    set((state) => ({ blockedEdges: [...state.blockedEdges, { a, b, untilRound }] })),

  unblockExpiredEdges: () =>
    set((state) => ({
      blockedEdges: state.blockedEdges.filter((edge) => edge.untilRound >= state.round),
    })),

  setTension: (value) => set({ tensionValue: value }),

  setEventMode: (mode) => set({ eventMode: mode }),
}));
