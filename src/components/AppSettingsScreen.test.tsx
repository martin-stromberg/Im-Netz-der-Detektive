// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AppSettingsScreen } from "./AppSettingsScreen";
import { useUiPrefs, UI_PREFS_STORAGE_KEY } from "../state/uiPrefs";
import en from "../i18n/en.json";

describe("AppSettingsScreen", () => {
  it("shows the language toggle, the volume slider and the mute switch", () => {
    render(<AppSettingsScreen onBack={vi.fn()} />);
    expect(screen.getByTestId("language-de")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("language-en")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("audio-volume")).toHaveValue("100");
    expect(screen.getByTestId("audio-muted")).not.toBeChecked();
  });

  it("switches the UI language at runtime and persists it", () => {
    render(<AppSettingsScreen onBack={vi.fn()} />);
    fireEvent.click(screen.getByTestId("language-en"));
    expect(useUiPrefs.getState().language).toBe("en");
    // The screen itself re-renders in English immediately.
    expect(screen.getByTestId("app-settings-screen")).toHaveTextContent(en["appsettings.subtitle"]);
    expect(screen.getByTestId("language-en")).toHaveAttribute("aria-pressed", "true");
    const persisted = JSON.parse(window.localStorage.getItem(UI_PREFS_STORAGE_KEY) ?? "{}");
    expect(persisted.language).toBe("en");
  });

  it("changes volume and mute and persists both", () => {
    render(<AppSettingsScreen onBack={vi.fn()} />);
    fireEvent.change(screen.getByTestId("audio-volume"), { target: { value: "35" } });
    expect(useUiPrefs.getState().audioVolume).toBe(35);
    expect(screen.getByTestId("audio-volume-value")).toHaveTextContent("35");
    fireEvent.click(screen.getByTestId("audio-muted"));
    expect(useUiPrefs.getState().audioMuted).toBe(true);
    const persisted = JSON.parse(window.localStorage.getItem(UI_PREFS_STORAGE_KEY) ?? "{}");
    expect(persisted.audioVolume).toBe(35);
    expect(persisted.audioMuted).toBe(true);
  });

  it("calls onBack", () => {
    const onBack = vi.fn();
    render(<AppSettingsScreen onBack={onBack} />);
    fireEvent.click(screen.getByTestId("app-settings-back"));
    expect(onBack).toHaveBeenCalled();
  });
});
