// @vitest-environment jsdom
/**
 * ReplayScreen: deterministic timeline over a recorded log, two
 * perspectives filtered by `visibleTo` — the detective view never
 * renders the ganove marker.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ReplayScreen } from "./ReplayScreen";
import { runAiGame } from "../logic/AiSimulation";
import { loadMap } from "../logic/MapLoader";
import { serializeLog } from "../logic/Recorder";
import { openReplay } from "../logic/ReplayPlayer";
import { useGameStore } from "../state/gameStore";
import de from "../i18n/de.json";

const teststadt = loadMap("teststadt");

function recordedJsonl(seed = 3): string {
  const result = runAiGame(teststadt, seed);
  if (result.outcome === "draw") {
    return recordedJsonl(seed + 1);
  }
  return serializeLog(result.log);
}

describe("ReplayScreen", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useGameStore.getState().resetGame();
  });

  it("renders the start state and steps forward through the recorded game", () => {
    const jsonl = recordedJsonl();
    const source = openReplay(jsonl);
    render(<ReplayScreen jsonl={jsonl} onBack={vi.fn()} />);

    // Step 0 = the reconstructed start (round 1, ganove phase).
    expect(screen.getByTestId("replay-position")).toHaveTextContent(de["replay.stepStart"]);
    expect(useGameStore.getState().round).toBe(1);
    expect(useGameStore.getState().log).toHaveLength(1);

    fireEvent.click(screen.getByTestId("replay-next"));
    expect(screen.getByTestId("replay-position")).toHaveTextContent(
      de["replay.stepOf"]
        .replace("{step}", "1")
        .replace("{total}", String(source.actions.length))
        .replace("{round}", String(useGameStore.getState().round)),
    );
    expect(useGameStore.getState().log.length).toBeGreaterThan(1);

    // Step back lands on the identical earlier state.
    fireEvent.click(screen.getByTestId("replay-prev"));
    expect(useGameStore.getState().log).toHaveLength(1);
    expect(useGameStore.getState().round).toBe(1);
  });

  it("shows the ganove marker only in the ganove perspective", () => {
    const { container } = render(<ReplayScreen jsonl={recordedJsonl()} onBack={vi.fn()} />);
    // Default: detective perspective — no ganove marker, cameras visible.
    expect(container.querySelector("[data-ganove]")).toBeNull();
    expect(
      screen.queryByTestId("chronicle-feed") ?? screen.queryByTestId("chronicle-empty"),
    ).not.toBeNull();

    fireEvent.click(screen.getByTestId("replay-view-ganove"));
    expect(container.querySelector("[data-ganove]")).not.toBeNull();
    expect(
      screen.queryByTestId("intel-feed") ?? screen.queryByTestId("intel-empty"),
    ).not.toBeNull();

    // Back to the detective view — the marker must disappear again.
    fireEvent.click(screen.getByTestId("replay-view-detectives"));
    expect(container.querySelector("[data-ganove]")).toBeNull();
  });

  it("plays automatically to the end and stops", () => {
    vi.useFakeTimers();
    try {
      const jsonl = recordedJsonl();
      const source = openReplay(jsonl);
      render(<ReplayScreen jsonl={jsonl} onBack={vi.fn()} />);
      fireEvent.click(screen.getByTestId("replay-play"));
      for (let i = 0; i < source.actions.length + 5; i += 1) {
        act(() => {
          vi.advanceTimersByTime(1000);
        });
      }
      expect(useGameStore.getState().outcome).not.toBeNull();
      expect(screen.getByTestId("replay-outcome")).toBeInTheDocument();
      expect(screen.getByTestId("replay-next")).toBeDisabled();
      expect(screen.getByTestId("replay-play")).toBeDisabled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("resets the store and reports invalid logs", () => {
    const onBack = vi.fn();
    const { unmount } = render(<ReplayScreen jsonl="not-json{{{" onBack={onBack} />);
    expect(screen.getByTestId("replay-error")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: de["menu.back"] }));
    expect(onBack).toHaveBeenCalled();
    expect(useGameStore.getState().map).toBeNull();

    // Unmounting a valid replay also resets the store.
    const jsonl = recordedJsonl();
    const view = render(<ReplayScreen jsonl={jsonl} onBack={vi.fn()} />);
    expect(useGameStore.getState().map).not.toBeNull();
    view.unmount();
    unmount();
    expect(useGameStore.getState().map).toBeNull();
  });
});
