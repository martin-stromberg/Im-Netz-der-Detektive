// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AudioEngine } from "./AudioEngine";
import { installAudioUnlock, installGameAudio } from "./gameAudio";
import { useGameStore } from "../state/gameStore";
import { useUiPrefs } from "../state/uiPrefs";
import type { GameEvent } from "../logic/InformationSystem";
import type { MapPack } from "../logic/mapPack";

function fakeEngine() {
  const engine = {
    supported: true,
    unlock: vi.fn(),
    playHeatRise: vi.fn(),
    setAmbient: vi.fn(),
    setVolume: vi.fn(),
    setMuted: vi.fn(),
    dispose: vi.fn(),
  };
  return engine as AudioEngine & typeof engine;
}

const cameraEvent = (round: number, nodeId = "a"): GameEvent => ({
  kind: "camera",
  round,
  nodeId,
  visibleTo: "both",
});

const cleanups: (() => void)[] = [];
afterEach(() => {
  while (cleanups.length > 0) {
    cleanups.pop()!();
  }
});

describe("installGameAudio", () => {
  it("applies the persisted volume/mute live from useUiPrefs", () => {
    const engine = fakeEngine();
    cleanups.push(installGameAudio(engine));
    expect(engine.setVolume).toHaveBeenLastCalledWith(1);
    expect(engine.setMuted).toHaveBeenLastCalledWith(false);
    useUiPrefs.getState().setAudioVolume(42);
    expect(engine.setVolume).toHaveBeenLastCalledWith(0.42);
    useUiPrefs.getState().setAudioMuted(true);
    expect(engine.setMuted).toHaveBeenLastCalledWith(true);
  });

  it("plays the staged signal on every heat-level rise", () => {
    const engine = fakeEngine();
    cleanups.push(installGameAudio(engine));
    // Baseline: the current level (ruhig) does not re-signal.
    expect(engine.playHeatRise).not.toHaveBeenCalled();

    // One camera hit (weight 2) → aktiv.
    useGameStore.setState({ events: [cameraEvent(1)], round: 1 });
    expect(engine.playHeatRise).toHaveBeenLastCalledWith("aktiv");

    // A second camera hit (score 4) → erhoeht.
    useGameStore.setState({
      events: [cameraEvent(1), cameraEvent(1, "b")],
      round: 1,
    });
    expect(engine.playHeatRise).toHaveBeenLastCalledWith("erhoeht");

    // Two more hits (score ≥ 5... 8) → kritisch.
    useGameStore.setState({
      events: [cameraEvent(1), cameraEvent(1, "b"), cameraEvent(1, "c"), cameraEvent(1, "d")],
      round: 1,
    });
    expect(engine.playHeatRise).toHaveBeenLastCalledWith("kritisch");
    expect(engine.playHeatRise).toHaveBeenCalledTimes(3);
  });

  it("does not signal level drops but re-signals a later rise", () => {
    const engine = fakeEngine();
    cleanups.push(installGameAudio(engine));
    useGameStore.setState({ events: [cameraEvent(1)], round: 1 });
    expect(engine.playHeatRise).toHaveBeenCalledWith("aktiv");
    // Level drops back — no signal.
    useGameStore.setState({ events: [], round: 2 });
    expect(engine.playHeatRise).toHaveBeenCalledTimes(1);
    // Rising again from the new baseline signals again.
    useGameStore.setState({ events: [cameraEvent(2)], round: 2 });
    expect(engine.playHeatRise).toHaveBeenCalledTimes(2);
    expect(engine.playHeatRise).toHaveBeenLastCalledWith("aktiv");
  });

  it("arms the ambient while a game runs and silences it at the end", () => {
    const engine = fakeEngine();
    cleanups.push(installGameAudio(engine));
    // Idle state: no game running — the ambient never even got armed.
    expect(engine.setAmbient).not.toHaveBeenCalled();
    useGameStore.setState({ map: { id: "x" } as unknown as MapPack, outcome: null });
    expect(engine.setAmbient).toHaveBeenLastCalledWith(true);
    useGameStore.setState({ outcome: "escaped" });
    expect(engine.setAmbient).toHaveBeenLastCalledWith(false);
  });

  it("cleanup unsubscribes and silences a running ambient", () => {
    const engine = fakeEngine();
    const cleanup = installGameAudio(engine);
    useGameStore.setState({ map: { id: "x" } as unknown as MapPack, outcome: null });
    cleanup();
    expect(engine.setAmbient).toHaveBeenLastCalledWith(false);
    const calls = engine.playHeatRise.mock.calls.length;
    useGameStore.setState({ events: [cameraEvent(1)], round: 1 });
    expect(engine.playHeatRise).toHaveBeenCalledTimes(calls);
  });
});

describe("installAudioUnlock", () => {
  it("unlocks the engine once on the first user gesture", () => {
    const engine = fakeEngine();
    const cleanup = installAudioUnlock(engine);
    cleanups.push(cleanup);
    window.dispatchEvent(new Event("keydown"));
    expect(engine.unlock).toHaveBeenCalledTimes(1);
    // Subsequent gestures do not re-unlock.
    window.dispatchEvent(new Event("pointerdown"));
    expect(engine.unlock).toHaveBeenCalledTimes(1);
  });

  it("detaches its listeners on cleanup", () => {
    const engine = fakeEngine();
    const cleanup = installAudioUnlock(engine);
    cleanup();
    window.dispatchEvent(new Event("keydown"));
    expect(engine.unlock).not.toHaveBeenCalled();
  });
});
