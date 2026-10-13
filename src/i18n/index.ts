import de from "./de.json";

export type TranslationKey = keyof typeof de;

/**
 * Minimal i18n helper. All UI-facing strings go through translation keys
 * defined in `de.json` / `en.json`; the hook check `i18n-check.py` enforces
 * key parity between the language files. `{name}` placeholders in a value
 * are replaced by `params`.
 */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  let text: string = de[key];
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}
