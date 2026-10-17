// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SettingsScreen } from "./SettingsScreen";
import { loadMap } from "../logic/MapLoader";

const muenster = loadMap("muenster");
const luebeck = loadMap("luebeck");

describe("SettingsScreen", () => {
  it("preselects the map's suggested values", () => {
    render(<SettingsScreen map={muenster} onBack={vi.fn()} onContinue={vi.fn()} />);
    expect(screen.getByTestId("setting-detectives")).toHaveValue(
      muenster.settings.detectiveCount.suggested,
    );
    expect(screen.getByTestId("setting-cameras")).toHaveValue(
      muenster.settings.cameraCount.suggested,
    );
    expect(screen.getByTestId("setting-roundlimit")).toHaveValue(
      muenster.settings.roundLimit.suggested,
    );
    expect(screen.getByTestId("setting-radio")).toHaveValue(
      muenster.settings.radioHintCount.suggested,
    );
    expect(screen.getByTestId("setting-edgeblock")).toHaveValue(
      muenster.settings.edgeBlockRounds.suggested,
    );
    expect(screen.getByTestId("setting-eventmode")).toHaveValue(muenster.settings.eventMode);
  });

  it("offers 'unbegrenzt' only where the map allows it", () => {
    const { unmount } = render(
      <SettingsScreen map={muenster} onBack={vi.fn()} onContinue={vi.fn()} />,
    );
    expect(screen.getByTestId("setting-unlimited")).toBeInTheDocument();
    unmount();
    render(<SettingsScreen map={luebeck} onBack={vi.fn()} onContinue={vi.fn()} />);
    expect(screen.queryByTestId("setting-unlimited")).toBeNull();
  });

  it("passes the corridor values plus mission-independent options on continue", () => {
    const spy = vi.fn();
    render(<SettingsScreen map={muenster} onBack={vi.fn()} onContinue={spy} />);
    fireEvent.change(screen.getByTestId("setting-detectives"), { target: { value: "6" } });
    fireEvent.change(screen.getByTestId("setting-cameras"), { target: { value: "0" } });
    fireEvent.click(screen.getByTestId("setting-unlimited"));
    fireEvent.change(screen.getByTestId("setting-eventmode"), {
      target: { value: "cycle" },
    });
    fireEvent.change(screen.getByTestId("setting-cadence"), { target: { value: "3" } });
    fireEvent.click(screen.getByTestId("settings-continue"));
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        detectiveCount: 6,
        cameraCount: 0,
        roundLimit: null,
        radioHintCount: muenster.settings.radioHintCount.suggested,
        edgeBlockRounds: muenster.settings.edgeBlockRounds.suggested,
        eventMode: "cycle",
        eventDefaults: { cycle: 3 },
      }),
    );
  });

  it("refuses values outside the map corridor", () => {
    const spy = vi.fn();
    render(<SettingsScreen map={luebeck} onBack={vi.fn()} onContinue={spy} />);
    fireEvent.change(screen.getByTestId("setting-detectives"), { target: { value: "9" } });
    fireEvent.click(screen.getByTestId("settings-continue"));
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByTestId("settings-errors")).toBeInTheDocument();
  });

  it("refuses non-integer and out-of-corridor cadence", () => {
    const spy = vi.fn();
    render(<SettingsScreen map={luebeck} onBack={vi.fn()} onContinue={spy} />);
    fireEvent.change(screen.getByTestId("setting-cadence"), { target: { value: "99" } });
    fireEvent.click(screen.getByTestId("settings-continue"));
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByTestId("settings-errors")).toBeInTheDocument();
  });
});
