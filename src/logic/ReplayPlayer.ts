/**
 * Replay player (spec `02-technisches-konzept.md` section 8.1):
 * a recorded JSONL event log is deterministically driven through the
 * engine again — `startOptionsFromHeader` reconstructs the identical
 * start (map + seed + resolved mission/cameras), then the recorded
 * actor entries are re-executed in `seq` order. Engine-emitted entries
 * (`hint`, `event`, `edge_unblock`, `sabotage`, the `sabotage_offer`
 * offer line and `result`) re-appear on their own, so the replayed
 * state at any step equals the recorded state at that point.
 *
 * One replay step is one actor entry. Stepping back replays from the
 * header up to `n - 1` — bit-identical by determinism, no inverse
 * operations needed. The driver is an interface so the module stays
 * headless and testable; `useGameStore` satisfies it structurally.
 */
import type { MapPack } from "./mapPack";
import type { GameOutcome, LogEntry, StartGameOptions } from "../state/gameStore";
import {
  headerFromLog,
  parseLog,
  startOptionsFromHeader,
  type ReconstructedStart,
} from "./Recorder";

/** The two replay perspectives — the same filter sides as the live views. */
export type ReplayPerspective = "ganove" | "detectives";

/**
 * The store surface a replay needs: `getState` hands out the current
 * state object carrying the action methods — `useGameStore` satisfies
 * this interface directly, and any object with the same shape (e.g. a
 * vanilla store or a test double) works just as well.
 */
export interface ReplayDriver {
  getState(): {
    outcome: GameOutcome | null;
    resetGame(): void;
    startGame(map: MapPack, seed: number, options: StartGameOptions): void;
    moveGanove(target: string): void;
    moveDetective(target: string): void;
    ganoveAction(): void;
    chooseMissionPath(choice: "sabotage" | "flucht"): void;
    useRadio(): void;
  };
}

/** A parsed replay: header reconstruction plus the full entry list. */
export interface ReplaySource {
  entries: LogEntry[];
  start: ReconstructedStart;
  /** The actor entries — one replay step each, in `seq` order. */
  actions: LogEntry[];
}

/** Raised when a log cannot be replayed (no or unusable header). */
export class ReplayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReplayError";
  }
}

/**
 * Whether an entry describes a player/AI decision that must be
 * re-executed — everything else is emitted by the engine while the
 * actor entries run. `sabotage_offer` appears twice per informant
 * choice: the offer (no `chosen`) is engine output, the answered
 * offer (`chosen` set) is the actor entry.
 */
export function isReplayAction(entry: LogEntry): boolean {
  if (entry.type === "move") {
    return entry.actor === "ganove" || entry.actor === "detective";
  }
  if (entry.type === "action") {
    return true;
  }
  if (entry.type === "sabotage_offer") {
    return entry.chosen !== undefined;
  }
  return entry.type === "radio";
}

/** The actor entries of a log in `seq` order — one per replay step. */
export function replayActions(entries: readonly LogEntry[]): LogEntry[] {
  return entries.filter(isReplayAction);
}

/**
 * Parses a JSONL log into a `ReplaySource`. Throws `ReplayError` when
 * the log has no usable `header` entry (the replay needs `mapId` +
 * `seed` + the recorded start config).
 */
export function openReplay(jsonl: string): ReplaySource {
  const entries = parseLog(jsonl) as LogEntry[];
  const header = headerFromLog(entries);
  if (header === undefined) {
    throw new ReplayError("the log has no header entry — cannot reconstruct the game start");
  }
  return { entries, start: startOptionsFromHeader(header), actions: replayActions(entries) };
}

/** Re-executes one actor entry on the driver's current state. */
function applyAction(state: ReturnType<ReplayDriver["getState"]>, entry: LogEntry): void {
  switch (entry.type) {
    case "move":
      if (entry.actor === "ganove") {
        state.moveGanove(entry.to as string);
      } else {
        state.moveDetective(entry.to as string);
      }
      return;
    case "action":
      state.ganoveAction();
      return;
    case "sabotage_offer":
      state.chooseMissionPath(entry.chosen === true ? "sabotage" : "flucht");
      return;
    case "radio":
      state.useRadio();
      return;
  }
}

/**
 * Rebuilds the recorded state after the first `stepCount` actor
 * entries: `resetGame`, `startGame` from the header reconstruction,
 * then the actor entries in order. `stepCount` clamps into
 * `[0, actions.length]`; applying stops early once the game is over
 * (a corrupt or truncated log can hold entries past `result`).
 * Replaying the same `stepCount` twice lands on identical state —
 * determinism is proven for the header reconstruction and the round
 * engine, and actor entries carry every decision.
 */
export function replayTo(
  driver: ReplayDriver,
  map: MapPack,
  source: ReplaySource,
  stepCount: number,
): void {
  const steps = Math.max(0, Math.min(stepCount, source.actions.length));
  const driverState = driver.getState();
  driverState.resetGame();
  driverState.startGame(map, source.start.seed, source.start.options);
  for (let i = 0; i < steps; i += 1) {
    if (driver.getState().outcome !== null) {
      return;
    }
    applyAction(driver.getState(), source.actions[i]);
  }
}
