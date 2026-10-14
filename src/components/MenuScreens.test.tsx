// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DevModeScreen } from "./DevModeScreen";
import { MainMenu } from "./MainMenu";
import { MapSelect } from "./MapSelect";
import { ModeSelect } from "./ModeSelect";
import { StatsScreen } from "./StatsScreen";
import { useGameStore, type LogEntry } from "../state/gameStore";
import { serializeLog, LOG_STORAGE_KEY, type StorageLike } from "../logic/Recorder";

beforeEach(() => {
  useGameStore.getState().resetGame();
  window.localStorage.clear();
});

describe("MainMenu", () => {
  it("shows new game, disabled resume and stats entries", () => {
    const onNavigate = vi.fn();
    render(<MainMenu onNavigate={onNavigate} />);
    expect(screen.getByTestId("main-menu")).toBeInTheDocument();
    expect(screen.getByTestId("menu-resume")).toBeDisabled();
    fireEvent.click(screen.getByTestId("menu-new-game"));
    expect(onNavigate).toHaveBeenCalledWith("map");
    fireEvent.click(screen.getByTestId("menu-stats"));
    expect(onNavigate).toHaveBeenCalledWith("stats");
  });
});

describe("MapSelect", () => {
  it("offers muenster and luebeck and disables forthcoming cities", () => {
    const onSelect = vi.fn();
    render(<MapSelect onBack={vi.fn()} onSelect={onSelect} />);
    const muenster = screen.getByTestId("map-card-muenster");
    expect(muenster).toBeEnabled();
    expect(muenster).toHaveTextContent("Münster");
    expect(muenster).toHaveTextContent(/Fahrradstadt/);
    expect(screen.getByTestId("map-card-luebeck")).toBeEnabled();
    expect(screen.getByTestId("map-card-hamburg")).toBeDisabled();
    expect(screen.getByTestId("map-card-koeln")).toBeDisabled();
    expect(screen.queryByTestId("map-card-teststadt")).toBeNull();
    fireEvent.click(muenster);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "muenster" }));
  });
});

describe("ModeSelect", () => {
  it("offers both player modes and the dev mode", () => {
    const onSelect = vi.fn();
    render(<ModeSelect mapName="Münster" onBack={vi.fn()} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId("mode-ganove"));
    expect(onSelect).toHaveBeenCalledWith("ganove");
    fireEvent.click(screen.getByTestId("mode-detektiv"));
    expect(onSelect).toHaveBeenCalledWith("detektiv");
    fireEvent.click(screen.getByTestId("mode-dev"));
    expect(onSelect).toHaveBeenCalledWith("dev");
  });
});

describe("StatsScreen", () => {
  const header = (gameId: string): LogEntry => ({
    seq: 0,
    round: 0,
    type: "header",
    gameId,
    mapId: "muenster",
    seed: 7,
    config: {},
    mission: null,
    cameras: [],
    starts: { detectives: ["a"], ganove: "z" },
  });
  const resultEntry: LogEntry = {
    seq: 1,
    round: 9,
    type: "result",
    outcome: "escaped",
    rounds: 9,
    hintsTotal: 3,
    camerasTriggered: 1,
    visibleTo: "both",
  };

  it("shows the empty state without recorded games", () => {
    render(<StatsScreen onBack={vi.fn()} />);
    expect(screen.getByTestId("stats-empty")).toBeInTheDocument();
  });

  it("lists recorded games newest first", () => {
    const jsonl1 = serializeLog([header("g-1"), resultEntry]);
    const jsonl2 = serializeLog([header("g-2"), { ...resultEntry, outcome: "caught" }]);
    window.localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify([jsonl1, jsonl2]));
    render(<StatsScreen onBack={vi.fn()} />);
    const table = screen.getByTestId("stats-table");
    expect(table).toHaveTextContent("g-2");
    expect(table).toHaveTextContent("g-1");
    const rows = table.querySelectorAll("tbody tr");
    expect(rows[0]).toHaveTextContent("g-2");
    expect(rows[0].querySelector("[data-outcome]")).toHaveAttribute("data-outcome", "caught");
  });
});

describe("DevModeScreen", () => {
  it("runs a batch and shows the outcome distribution", () => {
    render(<DevModeScreen mapId="teststadt" onBack={vi.fn()} />);
    fireEvent.change(screen.getByTestId("dev-batch"), { target: { value: "5" } });
    fireEvent.click(screen.getByTestId("dev-run"));
    const summary = screen.getByTestId("dev-summary");
    expect(summary).toBeInTheDocument();
    const total = [...summary.querySelectorAll("tbody tr")].reduce(
      (sum, row) => sum + Number(row.querySelectorAll("td")[1]?.textContent ?? 0),
      0,
    );
    expect(total).toBe(5);
    // The recorded logs land in the storage FIFO.
    const storage: StorageLike = window.localStorage;
    expect(storage.getItem(LOG_STORAGE_KEY)).not.toBeNull();
  });
});
