// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import de from "./de.json";
import en from "./en.json";
import { getLanguage, hasTranslation, resolveText, t, type TranslationKey } from "./index";
import { useUiPrefs } from "../state/uiPrefs";

describe("t()", () => {
  it("resolves the German catalog by default", () => {
    expect(t("app.title")).toBe(de["app.title"]);
  });

  it("follows the persisted language from useUiPrefs", () => {
    useUiPrefs.getState().setLanguage("en");
    expect(t("app.title")).toBe(en["app.title"]);
    useUiPrefs.getState().setLanguage("de");
    expect(t("app.title")).toBe(de["app.title"]);
  });

  it("accepts an explicit lang override for non-React callers", () => {
    expect(t("app.title", undefined, "en")).toBe(en["app.title"]);
    // The store language stays untouched by the override.
    expect(useUiPrefs.getState().language).toBe("de");
  });

  it("replaces named placeholders in both languages", () => {
    expect(t("game.round", { round: 7 })).toBe(de["game.round"].replace("{round}", "7"));
    expect(t("game.round", { round: 7 }, "en")).toBe(en["game.round"].replace("{round}", "7"));
  });

  it("returns the key itself for unknown keys", () => {
    // Built dynamically: the i18n hook scans literal t() calls only.
    const unknownKey = `no.such.${"key"}`;
    expect(t(unknownKey as TranslationKey)).toBe(unknownKey);
  });
});

describe("getLanguage / hasTranslation", () => {
  it("reports the store language", () => {
    expect(getLanguage()).toBe("de");
    useUiPrefs.getState().setLanguage("en");
    expect(getLanguage()).toBe("en");
  });

  it("detects defined keys per language", () => {
    expect(hasTranslation("app.title")).toBe(true);
    expect(hasTranslation("app.title", "en")).toBe(true);
    expect(hasTranslation("does.not.exist")).toBe(false);
  });
});

describe("resolveText", () => {
  it("resolves a defined reference key in the active language", () => {
    expect(resolveText("menu.back", "fallback")).toBe(de["menu.back"]);
    useUiPrefs.getState().setLanguage("en");
    expect(resolveText("menu.back", "fallback")).toBe(en["menu.back"]);
  });

  it("falls back to the literal when no key or an unknown key is given", () => {
    expect(resolveText(undefined, "literal")).toBe("literal");
    expect(resolveText("missing.key", "literal")).toBe("literal");
  });
});
