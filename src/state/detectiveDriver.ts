/**
 * Store-bound driver for the AI detective phase (requirement step 9):
 * the human ganove triggers a turn via the UI, the engine rules the
 * rest. `installDetectiveDriver` subscribes to `useGameStore`; whenever
 * the phase flips to `"detektive"` it runs the whole squad
 * (`chooseDetectiveMove` + `moveDetective` per active index) until the
 * phase hands back or an `outcome` ends the game.
 *
 * Determinism matches the headless simulation exactly: draws come from
 * `aiRng(seed, round, index + 1)` (same salt, same lanes as
 * `AiSimulation`), and the deduction prior `detectiveStarts` is
 * recovered from the log header — no UI bookkeeping involved. The
 * driver never fires on a `pendingChoice` question (that blocks ganove
 * moves, not the detective phase) and never acts outside the
 * detektive phase.
 */
import { chooseDetectiveMove } from "../logic/DetectiveAI";
import { aiRng, buildDetectiveView } from "../logic/AiSimulation";
import { useGameStore, type LogEntry } from "./gameStore";

/**
 * Detective starting positions from the log header — the same values
 * `runAiGame` captures right after `startGame`. Falls back to the
 * current positions when no header exists (e.g. hand-built state).
 */
export function detectiveStartsFromLog(log: readonly LogEntry[]): string[] {
  const header = log.find((entry) => entry.type === "header");
  const starts = header?.starts as { detectives?: unknown } | undefined;
  if (Array.isArray(starts?.detectives)) {
    return starts.detectives.filter((id): id is string => typeof id === "string");
  }
  return [...useGameStore.getState().detektivePositions];
}

/**
 * Runs the detective phase to completion: every active detective picks
 * via `chooseDetectiveMove` and executes via `moveDetective` — the
 * store's catch check, round increment and outcome handling apply
 * inside the loop. No-op unless `phase === "detektive"` on a running
 * game.
 */
export function driveDetectivePhase(): void {
  const store = useGameStore;
  const detectiveStarts = detectiveStartsFromLog(store.getState().log);
  for (;;) {
    const state = store.getState();
    if (state.map === null || state.phase !== "detektive" || state.outcome !== null) {
      return;
    }
    const index = state.activeDetectiveIndex;
    const target = chooseDetectiveMove(
      buildDetectiveView(state, detectiveStarts),
      index,
      state.getLegalDetectiveMoves(),
      aiRng(state.seed, state.round, index + 1),
    );
    state.moveDetective(target);
  }
}

let driving = false;

/**
 * Subscribes to the store and drives every detective phase
 * automatically. Returns the unsubscribe function — idempotent per
 * subscription; a re-entrancy guard prevents nested notifications
 * (each `moveDetective` publishes again) from re-entering the loop.
 */
export function installDetectiveDriver(): () => void {
  return useGameStore.subscribe((state) => {
    if (driving || state.map === null || state.phase !== "detektive" || state.outcome !== null) {
      return;
    }
    driving = true;
    try {
      driveDetectivePhase();
    } finally {
      driving = false;
    }
  });
}
