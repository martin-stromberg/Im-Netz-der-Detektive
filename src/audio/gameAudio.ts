/**
 * Store-bound audio wiring (spec `02-technisches-konzept.md` section
 * 11): keeps the `AudioEngine` in sync with the game and the persisted
 * preferences —
 *
 * - `installGameAudio` watches `getHeatLevel()`: every *rise* of the
 *   level index triggers the staged `playHeatRise` signal, and a
 *   running game (`map !== null && outcome === null`) arms the quiet
 *   police-activity ambient. Volume and mute follow `useUiPrefs` live.
 * - `installAudioUnlock` obeys the autoplay policy: the engine's
 *   `unlock()` runs once on the first `pointerdown`/`keydown`.
 *
 * `installGameAudio` is mounted by the ganove screen only — the
 * ambient bed is the ganove's tension channel and never plays in the
 * detective view. Both installers return cleanup functions and are
 * StrictMode/idempotent-safe.
 */
import { useGameStore } from "../state/gameStore";
import { useUiPrefs } from "../state/uiPrefs";
import { createAudioEngine, type AudioEngine } from "./AudioEngine";
import type { HeatLevel } from "../logic/InformationSystem";
import { pursuitStatus, type PursuitLevel } from "../logic/Pursuit";

const LEVEL_ORDER: readonly HeatLevel[] = ["ruhig", "aktiv", "erhoeht", "kritisch"];

/** Pursuit levels that trigger the alarm cue when *reached*. */
const ALARM_PURSUIT: readonly PursuitLevel[] = ["nah", "unmittelbar"];
const PURSUIT_ORDER: readonly PursuitLevel[] = ["ruhig", "spuerbar", "nah", "unmittelbar"];

let defaultEngine: AudioEngine | null = null;

/** Lazily created shared engine — production screens always use this one. */
export function getDefaultAudioEngine(): AudioEngine {
  defaultEngine ??= createAudioEngine();
  return defaultEngine;
}

/**
 * One-shot gesture listener for the autoplay policy: the first
 * `pointerdown` or `keydown` unlocks the engine, then the listeners
 * remove themselves. Returns a cleanup that detaches them early.
 * Without a `window` (SSR/tests) it is a no-op.
 */
export function installAudioUnlock(engine: AudioEngine = getDefaultAudioEngine()): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  let done = false;
  const unlock = () => {
    if (done) {
      return;
    }
    done = true;
    engine.unlock();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
  return () => {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
}

/**
 * Drives heat signals and the ambient bed off the game store and
 * applies the persisted audio preferences live. Returns the cleanup:
 * unsubscribes everything and silences the ambient.
 */
export function installGameAudio(engine: AudioEngine = getDefaultAudioEngine()): () => void {
  // Level at install time is the baseline — no signal for existing heat
  // (e.g. a resumed game does not replay old alarms).
  let lastLevelIndex = LEVEL_ORDER.indexOf(useGameStore.getState().getHeatLevel().level);
  let lastPursuitIndex = -1;
  let lastEventCount = useGameStore.getState().events.length;
  let lastOutcome = useGameStore.getState().outcome;
  let ambientOn = false;

  const syncGame = () => {
    const state = useGameStore.getState();
    const levelIndex = LEVEL_ORDER.indexOf(state.getHeatLevel().level);
    if (levelIndex > lastLevelIndex) {
      engine.playHeatRise(state.getHeatLevel().level);
    }
    lastLevelIndex = levelIndex;

    // New ganove-visible world events get the quiet "news" cue.
    if (state.events.length > lastEventCount) {
      const fresh = state.events.slice(lastEventCount);
      if (fresh.some((event) => event.visibleTo !== "detectives")) {
        engine.playEventCue("news");
      }
    }
    lastEventCount = state.events.length;

    // Reaching the close-pursuit tiers plays the alarm — easing back
    // to calm resets the baseline so a re-approach re-arms it.
    const pursuit =
      state.map !== null && state.ganovePosition !== null && state.outcome === null
        ? pursuitStatus(
            state.map,
            state.blockedEdges,
            state.round,
            state.ganovePosition,
            state.detektivePositions,
          )
        : null;
    const pursuitIndex = pursuit === null ? -1 : PURSUIT_ORDER.indexOf(pursuit.level);
    if (
      pursuit !== null &&
      pursuitIndex > lastPursuitIndex &&
      ALARM_PURSUIT.includes(pursuit.level)
    ) {
      engine.playEventCue("alarm");
    }
    lastPursuitIndex = pursuitIndex;

    // Outcome motif once on the transition (ganove view: escape wins).
    if (lastOutcome === null && state.outcome !== null) {
      engine.playEventCue(state.outcome === "escaped" ? "win" : "loss");
    }
    lastOutcome = state.outcome;

    const running = state.map !== null && state.outcome === null;
    if (running !== ambientOn) {
      ambientOn = running;
      engine.setAmbient(running);
    }
  };

  const applyPrefs = () => {
    const prefs = useUiPrefs.getState();
    engine.setVolume(prefs.audioVolume / 100);
    engine.setMuted(prefs.audioMuted);
  };

  const unsubscribeGame = useGameStore.subscribe(syncGame);
  const unsubscribePrefs = useUiPrefs.subscribe(applyPrefs);
  syncGame();
  applyPrefs();

  return () => {
    unsubscribeGame();
    unsubscribePrefs();
    if (ambientOn) {
      ambientOn = false;
      engine.setAmbient(false);
    }
  };
}
