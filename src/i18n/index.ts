import de from "./de.json";
import en from "./en.json";
import { useUiPrefs } from "../state/uiPrefs";

export type TranslationKey = keyof typeof de;

/** Supported UI languages — one catalog per language under `src/i18n/`. */
export type Language = "de" | "en";

export const LANGUAGES: readonly Language[] = ["de", "en"];
export const DEFAULT_LANGUAGE: Language = "de";

const catalogs: Record<Language, Record<string, string>> = { de, en };

/**
 * Minimal i18n helper. All UI-facing strings go through translation keys
 * defined in `de.json` / `en.json`; the hook check `i18n-check.py` enforces
 * key parity between the language files. `{name}` placeholders in a value
 * are replaced by `params`.
 *
 * The active language comes from `useUiPrefs` (persisted user setting,
 * switchable at runtime); `lang` overrides it for tests and non-React
 * callers. Unknown keys return the key itself — `resolveText` relies on
 * `hasTranslation` instead when a graceful fallback text exists.
 */
export function t(
  key: TranslationKey,
  params?: Record<string, string | number>,
  lang?: Language,
): string {
  const catalog = catalogs[lang ?? getLanguage()];
  let text: string = catalog[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

/** The active UI language from the preferences store (DE fallback). */
export function getLanguage(): Language {
  const language = useUiPrefs.getState().language;
  return language === "en" ? "en" : DEFAULT_LANGUAGE;
}

/** Whether `key` exists in the catalog of `lang` (default: active language). */
export function hasTranslation(key: string, lang?: Language): boolean {
  return key in catalogs[lang ?? getLanguage()];
}

/**
 * Resolves an optional i18n reference key from a data package (mission
 * set `nameKey`/`storyKey`, map `taglineKey`): the catalog text when the
 * key is defined, the literal `fallback` otherwise. Keeps data files
 * self-contained — sets without reference keys still work.
 */
export function resolveText(key: string | undefined, fallback: string, lang?: Language): string {
  if (key !== undefined && hasTranslation(key, lang)) {
    return catalogs[lang ?? getLanguage()][key];
  }
  return fallback;
}
