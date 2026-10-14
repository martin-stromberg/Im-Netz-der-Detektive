// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import { useGameStore } from "./state/gameStore";
import de from "./i18n/de.json";

function setSearch(search: string) {
  window.history.pushState({}, "", `/${search}`);
}

describe("App", () => {
  beforeEach(() => {
    setSearch("");
    useGameStore.getState().resetGame();
  });

  it("renders the main menu without a mode parameter", () => {
    render(<App />);
    expect(screen.getByTestId("main-menu")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: de["app.title"] })).toBeInTheDocument();
    expect(screen.getByTestId("menu-new-game")).toBeInTheDocument();
    expect(screen.getByTestId("menu-resume")).toBeDisabled();
    expect(screen.getByTestId("menu-stats")).toBeInTheDocument();
  });

  it("walks menu → map → mode → settings → mission → ganove spawn pick", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("menu-new-game"));
    expect(screen.getByTestId("map-select")).toBeInTheDocument();
    // Forthcoming cities are disabled placeholders.
    expect(screen.getByTestId("map-card-hamburg")).toBeDisabled();
    fireEvent.click(screen.getByTestId("map-card-muenster"));
    expect(screen.getByTestId("mode-select-screen")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("mode-ganove"));
    expect(screen.getByTestId("settings-screen")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("settings-continue"));
    expect(screen.getByTestId("mission-select")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("mission-none"));
    expect(screen.getByTestId("ganove-screen")).toHaveAttribute("data-view", "pickSpawn");
  });

  it("walks the detektiv flow into the detective spawn picks", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("menu-new-game"));
    fireEvent.click(screen.getByTestId("map-card-luebeck"));
    fireEvent.click(screen.getByTestId("mode-detektiv"));
    fireEvent.click(screen.getByTestId("settings-continue"));
    fireEvent.click(screen.getByTestId("mission-random"));
    expect(screen.getByTestId("detektiv-screen")).toHaveAttribute("data-view", "pickSpawns");
  });

  it("opens the stats view from the main menu", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("menu-stats"));
    expect(screen.getByTestId("stats-screen")).toBeInTheDocument();
  });

  it("opens the app settings and re-renders every screen on a language switch", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("menu-settings"));
    expect(screen.getByTestId("app-settings-screen")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("language-en"));
    // <html lang> follows the preference …
    expect(document.documentElement.lang).toBe("en");
    // … and every screen the user lands on is English immediately.
    fireEvent.click(screen.getByTestId("app-settings-back"));
    expect(screen.getByTestId("menu-new-game")).toHaveTextContent("New game");
  });

  it("renders the ganove screen directly with ?mode=ganove", () => {
    setSearch("?mode=ganove");
    render(<App />);
    expect(screen.getByTestId("ganove-screen")).toHaveAttribute("data-view", "idle");
  });

  it("renders the detektiv screen directly with ?mode=detektiv", () => {
    setSearch("?mode=detektiv");
    render(<App />);
    expect(screen.getByTestId("detektiv-screen")).toHaveAttribute("data-view", "idle");
  });
});
