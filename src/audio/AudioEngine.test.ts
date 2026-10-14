// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { createAudioEngine, type AudioContextLike } from "./AudioEngine";

/**
 * Minimal fake WebAudio context: records created nodes so tests can
 * count scheduled tones without real audio hardware. jsdom has no
 * `AudioContext` — the injectable factory is also what keeps the
 * engine silent in non-browser tests.
 */
function fakeAudioContext() {
  const created = {
    oscillators: [] as {
      type: string;
      frequency: { value: number };
      start: ReturnType<typeof vi.fn>;
      stop: ReturnType<typeof vi.fn>;
    }[],
    gains: [] as {
      gain: { value: number };
      connect: ReturnType<typeof vi.fn>;
      disconnect: ReturnType<typeof vi.fn>;
    }[],
    sources: [] as {
      buffer: unknown;
      loop: boolean;
      start: ReturnType<typeof vi.fn>;
      stop: ReturnType<typeof vi.fn>;
    }[],
  };
  const ctx = {
    currentTime: 0,
    destination: { connect: vi.fn(), disconnect: vi.fn() },
    createOscillator: vi.fn(() => {
      const osc = {
        type: "",
        frequency: { value: 0 },
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      created.oscillators.push(osc);
      return osc;
    }),
    createGain: vi.fn(() => {
      const gain = {
        gain: {
          value: 0,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      created.gains.push(gain);
      return gain;
    }),
    createBiquadFilter: vi.fn(() => ({
      type: "",
      frequency: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
    createBuffer: vi.fn((_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    })),
    createBufferSource: vi.fn(() => {
      const source = {
        buffer: null,
        loop: false,
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      created.sources.push(source);
      return source;
    }),
    resume: vi.fn(),
  };
  return { ctx: ctx as unknown as AudioContextLike, created };
}

function engine(options: { factory?: () => AudioContextLike | null } = {}) {
  const fake = fakeAudioContext();
  const intervalCallbacks: (() => void)[] = [];
  const clearSpy = vi.fn();
  const audio = createAudioEngine({
    contextFactory: options.factory ?? (() => fake.ctx),
    setIntervalFn: (fn) => {
      intervalCallbacks.push(fn);
      return fn as unknown as ReturnType<typeof setInterval>;
    },
    clearIntervalFn: clearSpy,
  });
  return { audio, fake, intervalCallbacks, clearSpy };
}

describe("createAudioEngine", () => {
  it("reports support via the injected factory/probe and never touches real audio", () => {
    expect(engine().audio.supported).toBe(true);
    const unsupported = createAudioEngine({
      isSupported: () => false,
      contextFactory: () => null,
    });
    expect(unsupported.supported).toBe(false);
    // Every method is a silent no-op without a context.
    unsupported.unlock();
    unsupported.playHeatRise("kritisch");
    unsupported.setAmbient(true);
    unsupported.setVolume(0.5);
    unsupported.setMuted(true);
    unsupported.dispose();
  });

  it("stays silent before unlock() (autoplay policy)", () => {
    const { audio, fake } = engine();
    audio.playHeatRise("aktiv");
    audio.setAmbient(true);
    expect(fake.created.oscillators).toHaveLength(0);
    expect(fake.created.sources).toHaveLength(0);
  });

  it("creates and resumes the context on unlock, armed ambient follows", () => {
    const { audio, fake } = engine();
    audio.setAmbient(true); // armed only
    audio.unlock();
    expect(fake.ctx.resume).toHaveBeenCalled();
    // The armed ambient now actually starts.
    expect(fake.created.sources).toHaveLength(1);
    expect(fake.created.sources[0].loop).toBe(true);
    expect(fake.created.sources[0].start).toHaveBeenCalled();
  });

  it("plays a distinct staged signal per heat level", () => {
    const { audio, fake } = engine();
    audio.unlock();
    audio.playHeatRise("aktiv");
    expect(fake.created.oscillators).toHaveLength(1);
    audio.playHeatRise("erhoeht");
    expect(fake.created.oscillators).toHaveLength(3);
    audio.playHeatRise("kritisch");
    expect(fake.created.oscillators).toHaveLength(6);
    // Every tone was started through an envelope.
    for (const osc of fake.created.oscillators) {
      expect(osc.start).toHaveBeenCalled();
      expect(osc.stop).toHaveBeenCalled();
    }
    // Rising pitch across the levels: kritisch tones sit highest.
    const aktivFreq = fake.created.oscillators[0].frequency.value;
    const kritischFreqs = fake.created.oscillators.slice(3).map((osc) => osc.frequency.value);
    expect(Math.max(...kritischFreqs)).toBeGreaterThan(aktivFreq);
  });

  it("applies volume and mute to the master gain", () => {
    const { audio, fake } = engine();
    audio.unlock();
    const master = fake.created.gains[0];
    audio.setVolume(0.4);
    expect(master.gain.value).toBeCloseTo(0.4);
    audio.setMuted(true);
    expect(master.gain.value).toBe(0);
    audio.setMuted(false);
    expect(master.gain.value).toBeCloseTo(0.4);
    // Out-of-range volumes are clamped.
    audio.setVolume(3);
    expect(master.gain.value).toBe(1);
    audio.setVolume(-1);
    expect(master.gain.value).toBe(0);
  });

  it("runs ambient noise plus seeded blips and stops both cleanly", () => {
    const { audio, fake, intervalCallbacks, clearSpy } = engine();
    audio.unlock();
    const oscBefore = fake.created.oscillators.length;
    audio.setAmbient(true);
    // Noise buffer loop is running …
    expect(fake.created.sources).toHaveLength(1);
    // … and the blip scheduler is armed.
    expect(intervalCallbacks).toHaveLength(1);
    intervalCallbacks[0]();
    expect(fake.created.oscillators.length).toBeGreaterThan(oscBefore);
    audio.setAmbient(false);
    expect(fake.created.sources[0].stop).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalledWith(intervalCallbacks[0]);
  });

  it("dispose silences everything", () => {
    const { audio, fake } = engine();
    audio.unlock();
    audio.setAmbient(true);
    audio.dispose();
    expect(fake.created.sources[0].stop).toHaveBeenCalled();
    audio.playHeatRise("kritisch");
    // Locked again — nothing scheduled.
    expect(fake.created.oscillators.length).toBeLessThanOrEqual(3);
  });
});
