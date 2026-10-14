// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import type { StorageLike } from "../logic/Recorder";
import {
  DEFAULT_UI_PREFS,
  readUiPrefs,
  UI_PREFS_STORAGE_KEY,
  useUiPrefs,
  writeUiPrefs,
} from "./uiPrefs";

function fakeStorage(initial?: Record<string, string>): StorageLike & {
  data: Map<string, string>;
} {
  const data = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe("uiPrefs", () => {
  it("starts with the defaults (de, volume 100, unmuted)", () => {
    expect(useUiPrefs.getState().language).toBe(DEFAULT_UI_PREFS.language);
    expect(useUiPrefs.getState().audioVolume).toBe(DEFAULT_UI_PREFS.audioVolume);
    expect(useUiPrefs.getState().audioMuted).toBe(DEFAULT_UI_PREFS.audioMuted);
  });

  it("persists every setter to localStorage", () => {
    useUiPrefs.getState().setLanguage("en");
    useUiPrefs.getState().setAudioVolume(40);
    useUiPrefs.getState().setAudioMuted(true);
    const persisted = JSON.parse(window.localStorage.getItem(UI_PREFS_STORAGE_KEY) ?? "{}");
    expect(persisted).toEqual({ language: "en", audioVolume: 40, audioMuted: true });
  });

  it("clamps the volume into 0–100", () => {
    useUiPrefs.getState().setAudioVolume(140);
    expect(useUiPrefs.getState().audioVolume).toBe(100);
    useUiPrefs.getState().setAudioVolume(-5);
    expect(useUiPrefs.getState().audioVolume).toBe(0);
    useUiPrefs.getState().setAudioVolume(62.7);
    expect(useUiPrefs.getState().audioVolume).toBe(63);
  });
});

describe("readUiPrefs / writeUiPrefs (StorageLike boundary)", () => {
  it("round-trips prefs through an injected storage", () => {
    const storage = fakeStorage();
    writeUiPrefs({ language: "en", audioVolume: 55, audioMuted: true }, storage);
    expect(readUiPrefs(storage)).toEqual({ language: "en", audioVolume: 55, audioMuted: true });
    expect(storage.data.get(UI_PREFS_STORAGE_KEY)).toBeDefined();
  });

  it("returns an empty object for null storage and corrupt JSON", () => {
    expect(readUiPrefs(null)).toEqual({});
    const storage = fakeStorage({ [UI_PREFS_STORAGE_KEY]: "{broken json" });
    expect(readUiPrefs(storage)).toEqual({});
    const storage2 = fakeStorage({ [UI_PREFS_STORAGE_KEY]: '"just a string"' });
    expect(readUiPrefs(storage2)).toEqual({});
  });

  it("ignores quota errors on write", () => {
    const failing: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: () => {},
    };
    expect(() =>
      writeUiPrefs({ language: "en", audioVolume: 10, audioMuted: false }, failing),
    ).not.toThrow();
  });
});
