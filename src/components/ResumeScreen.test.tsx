// @vitest-environment jsdom
/**
 * ResumeScreen: lists saved game states with plain-text labels, hands
 * the chosen entry to `onResume` and supports deletion.
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ResumeScreen } from "./ResumeScreen";
import { listResumeEntries, RESUME_STORAGE_KEY, saveResumeEntry } from "../logic/GameIndex";
import { buildResumeEntry } from "../logic/SaveGame";
import { useGameStore } from "../state/gameStore";
import { loadMap } from "../logic/MapLoader";

const teststadt = loadMap("teststadt");

function savedEntry(gameId: string): void {
  const store = useGameStore.getState();
  store.resetGame();
  store.startGame(teststadt, 42, { gameId, mission: "none" });
  store.moveGanove(useGameStore.getState().getLegalGanoveMoves()[0].nodeId);
  const entry = buildResumeEntry(useGameStore.getState(), "ganove", "2026-10-14T12:00:00.000Z");
  if (entry === null) {
    throw new Error("buildResumeEntry returned null");
  }
  saveResumeEntry(entry);
  useGameStore.getState().resetGame();
}

describe("ResumeScreen", () => {
  it("shows the empty state without saved games", () => {
    window.localStorage.clear();
    render(<ResumeScreen onBack={vi.fn()} onResume={vi.fn()} />);
    expect(screen.getByTestId("resume-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("resume-list")).toBeNull();
  });

  it("lists saved games with map, mode and round; selection calls onResume", () => {
    window.localStorage.clear();
    savedEntry("g-42");
    const onResume = vi.fn();
    render(<ResumeScreen onBack={vi.fn()} onResume={onResume} />);
    const list = screen.getByTestId("resume-list");
    expect(list).toHaveTextContent("Teststadt");
    expect(list).toHaveTextContent("Runde");
    fireEvent.click(screen.getByTestId("resume-load-g-42"));
    expect(onResume).toHaveBeenCalledWith(
      expect.objectContaining({ gameId: "g-42", mode: "ganove" }),
    );
  });

  it("deletes an entry and updates the list", () => {
    window.localStorage.clear();
    savedEntry("g-42");
    render(<ResumeScreen onBack={vi.fn()} onResume={vi.fn()} />);
    fireEvent.click(screen.getByTestId("resume-delete-g-42"));
    expect(screen.getByTestId("resume-empty")).toBeInTheDocument();
    expect(listResumeEntries()).toEqual([]);
    expect(window.localStorage.getItem(RESUME_STORAGE_KEY)).not.toBeNull();
  });
});
