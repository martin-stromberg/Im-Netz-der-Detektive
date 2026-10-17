/**
 * Procedural WebAudio engine for the ganove's sound dramaturgy (spec
 * `02-technisches-konzept.md` section 11): everything is synthesised —
 * no audio files. The engine provides
 *
 * - `playHeatRise(level)`: a staged signal per heat-level *rise*
 *   (aktiv → single blip, erhoeht → rising two-tone, kritisch →
 *   urgent triple pulse; ruhig → soft low tick),
 * - `setAmbient(on)`: a very quiet "police activity" bed — filtered
 *   noise plus occasional faint radio blips,
 * - `setVolume`/`setMuted`: master gain control fed from `useUiPrefs`.
 *
 * Autoplay policy: the `AudioContext` is created lazily and only
 * `unlock()` (wired to the first user gesture via `installAudioUnlock`
 * in `gameAudio.ts`) resumes it; calls before the unlock stay silent.
 * Environments without WebAudio (jsdom, old browsers) get
 * `supported === false` and every method is a no-op — tests never
 * crash; a `contextFactory` can inject a fake for unit tests.
 *
 * Randomness: the ambient texture uses the central seeded RNG
 * (`createRng`), not `Math.random` — the blip pattern is deterministic
 * per engine instance and documented here as audio-scope randomness.
 */
import type { HeatLevel } from "../logic/InformationSystem";
import { createRng, type Rng } from "../logic/rng";

/** Minimal context surface the engine needs — real `AudioContext` or a test fake. */
export interface AudioContextLike {
  readonly currentTime: number;
  readonly destination: AudioNode;
  createOscillator(): OscillatorNode;
  createGain(): GainNode;
  createBiquadFilter(): BiquadFilterNode;
  createBuffer(channels: number, length: number, sampleRate: number): AudioBuffer;
  createBufferSource(): AudioBufferSourceNode;
  resume(): Promise<void> | void;
}

export interface AudioEngineOptions {
  /** Factory for the context — injectable for tests; default: `window.AudioContext`. */
  contextFactory?: () => AudioContextLike | null;
  /** Support probe — default checks the `AudioContext` constructor, an injected
      factory counts as supported unless stated otherwise. */
  isSupported?: () => boolean;
  /** Seeded RNG for the ambient blip pattern (audio-scope, deterministic). */
  rng?: Rng;
  /** Scheduler for ambient blips — injectable for tests. */
  setIntervalFn?: (fn: () => void, ms: number) => ReturnType<typeof setInterval>;
  clearIntervalFn?: (id: ReturnType<typeof setInterval>) => void;
}

/**
 * Short event cues layered on top of the heat signals: a soft ping for
 * world news, an urgent pattern when pursuit closes in, a confirm for
 * finished mission actions and one motif per outcome side.
 */
export type EventCue = "news" | "alarm" | "action" | "win" | "loss";

export interface AudioEngine {
  /** `false` when no `AudioContext` API is available — all methods no-op. */
  readonly supported: boolean;
  /** Creates/resumes the context — call from a user-gesture handler. */
  unlock(): void;
  /** Staged signal for a heat-level *rise* to `level`. */
  playHeatRise(level: HeatLevel): void;
  /** Short cue for game events — banner moments, pursuit, outcomes. */
  playEventCue(cue: EventCue): void;
  /** Turns the quiet police-activity ambience on or off. */
  setAmbient(on: boolean): void;
  /** Master volume 0–1. */
  setVolume(volume: number): void;
  /** Master mute — overrides the volume without losing it. */
  setMuted(muted: boolean): void;
  /** Stops all sound and releases the context reference. */
  dispose(): void;
}

/** Order of the heat levels — index drives the signal intensity. */
const LEVEL_ORDER: readonly HeatLevel[] = ["ruhig", "aktiv", "erhoeht", "kritisch"];

/** Master gain ceiling for ambient noise — deliberately barely audible. */
const AMBIENT_GAIN = 0.035;
/** Interval range (ms) for the ambient radio blips. */
const AMBIENT_BLIP_MIN_MS = 2600;
const AMBIENT_BLIP_SPREAD_MS = 2400;

function contextCtor(): (new () => AudioContextLike) | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return (window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
    (new () => AudioContextLike) | undefined;
}

function defaultContextFactory(): AudioContextLike | null {
  const ctor = contextCtor();
  if (ctor === undefined) {
    return null;
  }
  try {
    return new ctor();
  } catch {
    return null;
  }
}

interface ToneSpec {
  frequency: number;
  /** Offset from "now" in seconds. */
  offset: number;
  duration: number;
  peak: number;
  type: OscillatorType;
}

/**
 * Signal motifs per reached heat level — rising pitch, count and
 * tempo with the level (4 staged signals, spec section 11).
 */
function heatSignal(level: HeatLevel): ToneSpec[] {
  switch (LEVEL_ORDER.indexOf(level)) {
    case 1:
      return [{ frequency: 392, offset: 0, duration: 0.14, peak: 0.16, type: "sine" }];
    case 2:
      return [
        { frequency: 440, offset: 0, duration: 0.11, peak: 0.18, type: "sine" },
        { frequency: 587, offset: 0.12, duration: 0.14, peak: 0.18, type: "sine" },
      ];
    case 3:
      return [
        { frequency: 660, offset: 0, duration: 0.09, peak: 0.22, type: "square" },
        { frequency: 660, offset: 0.11, duration: 0.09, peak: 0.22, type: "square" },
        { frequency: 880, offset: 0.22, duration: 0.16, peak: 0.24, type: "square" },
      ];
    default:
      return [{ frequency: 196, offset: 0, duration: 0.18, peak: 0.1, type: "sine" }];
  }
}

/** Tone pattern per event cue — short, quiet, distinct from heat rises. */
function eventCueSignal(cue: EventCue): ToneSpec[] {
  switch (cue) {
    case "news":
      return [{ frequency: 523, offset: 0, duration: 0.12, peak: 0.12, type: "sine" }];
    case "alarm":
      return [
        { frequency: 740, offset: 0, duration: 0.08, peak: 0.2, type: "square" },
        { frequency: 740, offset: 0.1, duration: 0.08, peak: 0.2, type: "square" },
      ];
    case "action":
      return [
        { frequency: 494, offset: 0, duration: 0.09, peak: 0.15, type: "sine" },
        { frequency: 659, offset: 0.09, duration: 0.13, peak: 0.15, type: "sine" },
      ];
    case "win":
      return [
        { frequency: 523, offset: 0, duration: 0.12, peak: 0.16, type: "sine" },
        { frequency: 659, offset: 0.12, duration: 0.12, peak: 0.16, type: "sine" },
        { frequency: 784, offset: 0.24, duration: 0.22, peak: 0.16, type: "sine" },
      ];
    case "loss":
      return [
        { frequency: 330, offset: 0, duration: 0.14, peak: 0.16, type: "sine" },
        { frequency: 262, offset: 0.14, duration: 0.14, peak: 0.16, type: "sine" },
        { frequency: 196, offset: 0.28, duration: 0.26, peak: 0.18, type: "sine" },
      ];
  }
}

export function createAudioEngine(options: AudioEngineOptions = {}): AudioEngine {
  const contextFactory = options.contextFactory ?? defaultContextFactory;
  const rng = options.rng ?? createRng(0xa0d10);
  const setIntervalFn = options.setIntervalFn ?? setInterval;
  const clearIntervalFn = options.clearIntervalFn ?? clearInterval;

  // Support is probed on the constructor, not by instantiating a context —
  // a context created before the unlock gesture would just sit suspended.
  const supported =
    options.isSupported !== undefined
      ? options.isSupported()
      : options.contextFactory !== undefined
        ? true
        : contextCtor() !== undefined;

  let ctx: AudioContextLike | null = null;
  let master: GainNode | null = null;
  let unlocked = false;
  let volume = 1;
  let muted = false;

  let ambientOn = false;
  let ambientNodes: { stop: () => void } | null = null;
  let ambientTimer: ReturnType<typeof setInterval> | null = null;

  const applyMaster = () => {
    if (master !== null) {
      master.gain.value = muted ? 0 : volume;
    }
  };

  /** Creates the context + master gain on demand; `null` when unsupported. */
  const ensureContext = (): AudioContextLike | null => {
    if (ctx !== null) {
      return ctx;
    }
    const next = contextFactory();
    if (next === null) {
      return null;
    }
    ctx = next;
    master = ctx.createGain();
    applyMaster();
    master.connect(ctx.destination);
    return ctx;
  };

  /** Schedules one enveloped oscillator tone through the master gain. */
  const playTone = (context: AudioContextLike, spec: ToneSpec) => {
    const osc = context.createOscillator();
    const envelope = context.createGain();
    const start = context.currentTime + spec.offset;
    osc.type = spec.type;
    osc.frequency.value = spec.frequency;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(spec.peak, start + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + spec.duration);
    osc.connect(envelope);
    envelope.connect(master as GainNode);
    osc.start(start);
    osc.stop(start + spec.duration + 0.05);
  };

  /** Short filtered-noise buffer for the ambient bed (deterministic via `rng`). */
  const createNoiseBuffer = (context: AudioContextLike): AudioBuffer => {
    const length = Math.floor(22050 * 0.5);
    const buffer = context.createBuffer(1, length, 22050);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = rng.next() * 2 - 1;
    }
    return buffer;
  };

  const startAmbient = () => {
    const context = ensureContext();
    if (context === null || ambientNodes !== null) {
      return;
    }
    const source = context.createBufferSource();
    source.buffer = createNoiseBuffer(context);
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 520;
    const gain = context.createGain();
    gain.gain.value = AMBIENT_GAIN;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master as GainNode);
    source.start();
    // Faint radio blips at seeded (deterministic) intervals.
    ambientTimer = setIntervalFn(
      () => {
        if (ctx !== null && master !== null) {
          playTone(ctx, {
            frequency: 1180 + rng.next() * 480,
            offset: 0,
            duration: 0.05,
            peak: 0.02,
            type: "sine",
          });
        }
      },
      AMBIENT_BLIP_MIN_MS + rng.nextInt(0, AMBIENT_BLIP_SPREAD_MS),
    );
    ambientNodes = {
      stop: () => {
        try {
          source.stop();
        } catch {
          // Already stopped — harmless.
        }
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      },
    };
  };

  const stopAmbient = () => {
    if (ambientTimer !== null) {
      clearIntervalFn(ambientTimer);
      ambientTimer = null;
    }
    ambientNodes?.stop();
    ambientNodes = null;
  };

  return {
    get supported() {
      return supported;
    },
    unlock() {
      unlocked = true;
      const context = ensureContext();
      context?.resume();
      if (ambientOn) {
        startAmbient();
      }
    },
    playHeatRise(level) {
      if (!unlocked) {
        return;
      }
      const context = ensureContext();
      if (context === null || master === null) {
        return;
      }
      context.resume();
      for (const spec of heatSignal(level)) {
        playTone(context, spec);
      }
    },
    playEventCue(cue) {
      if (!unlocked) {
        return;
      }
      const context = ensureContext();
      if (context === null || master === null) {
        return;
      }
      context.resume();
      for (const spec of eventCueSignal(cue)) {
        playTone(context, spec);
      }
    },
    setAmbient(on) {
      ambientOn = on;
      if (!on) {
        stopAmbient();
        return;
      }
      if (!unlocked) {
        return; // armed — starts for real on unlock()
      }
      startAmbient();
    },
    setVolume(next) {
      volume = Math.min(1, Math.max(0, next));
      applyMaster();
    },
    setMuted(next) {
      muted = next;
      applyMaster();
    },
    dispose() {
      stopAmbient();
      ambientOn = false;
      unlocked = false;
      master?.disconnect();
      master = null;
      ctx = null;
    },
  };
}
