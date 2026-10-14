/**
 * Persisted application preferences (spec `02-technisches-konzept.md`
 * section 11): UI language and audio settings. Unlike `useGameStore`
 * these survive across games and screens — the state is mirrored into
 * `localStorage` under `UI_PREFS_STORAGE_KEY` behind an injectable
 * `StorageLike` boundary (same pattern as `GameIndex`/`Recorder`), so
 * tests can swap or disable persistence.
 *
 * The game screens never read this store for rules — it only feeds
 * `t()` (language) and the `AudioEngine` (volume/mute).
 */
import { create } from "zustand";
import type { StorageLike } from "../logic/Recorder";
import type { Language } from "../i18n";

/** `localStorage` key holding the persisted preferences object. */
export const UI_PREFS_STORAGE_KEY = "indd.ui-prefs";

/** Persisted preferences (subset of the store state). */
export interface PersistedUiPrefs {
  language?: string;
  audioVolume?: number;
  audioMuted?: boolean;
}

export interface UiPrefsState {
  /** Active UI language — read by `t()` via `getLanguage()`. */
  language: Language;
  /** Master volume 0–100 (percent). */
  audioVolume: number;
  /** Master mute switch — overrides the volume. */
  audioMuted: boolean;
  setLanguage: (language: Language) => void;
  setAudioVolume: (volume: number) => void;
  setAudioMuted: (muted: boolean) => void;
}

export const DEFAULT_UI_PREFS = {
  language: "de",
  audioVolume: 100,
  audioMuted: false,
} as const;

function defaultStorage(): StorageLike | null {
  if (typeof window === "undefined" || window.localStorage == null) {
    return null;
  }
  return window.localStorage;
}

function resolveStorage(storage: StorageLike | null | undefined): StorageLike | null {
  return storage === undefined ? defaultStorage() : storage;
}

/** Reads the persisted prefs; `null` storage or corrupt data → `{}`. */
export function readUiPrefs(storage?: StorageLike | null): PersistedUiPrefs {
  const resolved = resolveStorage(storage);
  if (resolved === null) {
    return {};
  }
  try {
    const raw = resolved.getItem(UI_PREFS_STORAGE_KEY);
    if (raw === null) {
      return {};
    }
    const data: unknown = JSON.parse(raw);
    return typeof data === "object" && data !== null ? (data as PersistedUiPrefs) : {};
  } catch {
    return {};
  }
}

/** Writes the persisted prefs; `null` storage or quota errors → ignored. */
export function writeUiPrefs(
  prefs: Required<PersistedUiPrefs>,
  storage?: StorageLike | null,
): void {
  const resolved = resolveStorage(storage);
  if (resolved === null) {
    return;
  }
  try {
    resolved.setItem(UI_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Quota or denied storage: the session keeps working without persistence.
  }
}

function sanitizeLanguage(value: unknown): Language {
  return value === "en" ? "en" : "de";
}

function sanitizeVolume(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_UI_PREFS.audioVolume;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Initial state from the persisted prefs with per-field fallback. */
function initialPrefs(): Pick<UiPrefsState, "language" | "audioVolume" | "audioMuted"> {
  const persisted = readUiPrefs();
  return {
    language: sanitizeLanguage(persisted.language),
    audioVolume: sanitizeVolume(persisted.audioVolume),
    audioMuted: persisted.audioMuted === true,
  };
}

function persist(state: Pick<UiPrefsState, "language" | "audioVolume" | "audioMuted">): void {
  writeUiPrefs({
    language: state.language,
    audioVolume: state.audioVolume,
    audioMuted: state.audioMuted,
  });
}

export const useUiPrefs = create<UiPrefsState>((set, get) => ({
  ...initialPrefs(),
  setLanguage: (language) => {
    set({ language: sanitizeLanguage(language) });
    persist(get());
  },
  setAudioVolume: (volume) => {
    set({ audioVolume: sanitizeVolume(volume) });
    persist(get());
  },
  setAudioMuted: (muted) => {
    set({ audioMuted: muted });
    persist(get());
  },
}));
