// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MissionPanel, currentMissionTarget } from "./MissionPanel";
import type { Mission } from "../state/gameStore";
import de from "../i18n/de.json";

const names: Record<string, string> = {
  a: "Alter Markt",
  e: "Aasee",
  g: "Autobahn",
  s1: "Stadtwerke",
};
const nodeName = (id: string) => names[id] ?? id;

function missionAt(stage: Mission["stage"], overrides?: Partial<Mission>): Mission {
  return {
    id: "random",
    targets: { diebstahl: "a", kontakt: "e", flucht: "g", sabotage: "s1" },
    stage,
    pendingChoice: null,
    offeredEffect: null,
    appliedEffect: null,
    ...overrides,
  };
}

describe("MissionPanel", () => {
  it("explains the no-mission case", () => {
    render(<MissionPanel mission={null} nodeName={nodeName} />);
    expect(screen.getByText(de["mission.none"])).toBeInTheDocument();
  });

  it("lists the fixed step order with the current step marked", () => {
    const { container } = render(
      <MissionPanel mission={missionAt("kontakt")} nodeName={nodeName} />,
    );
    const steps = [...container.querySelectorAll("[data-mission-step]")];
    expect(steps.map((el) => el.getAttribute("data-mission-step"))).toEqual([
      "diebstahl",
      "kontakt",
      "sabotage",
      "flucht",
    ]);
    expect(container.querySelector('[data-mission-step="diebstahl"]')).toHaveAttribute(
      "data-step-status",
      "erledigt",
    );
    expect(container.querySelector('[data-mission-step="kontakt"]')).toHaveAttribute(
      "data-step-status",
      "aktuell",
    );
    expect(screen.getByTestId("mission-current-target").textContent).toContain("Aasee");
  });

  it("omits the sabotage step when the mission has no sabotage target", () => {
    const mission = missionAt("diebstahl");
    mission.targets = { diebstahl: "a", kontakt: "e", flucht: "g", sabotage: null };
    const { container } = render(<MissionPanel mission={mission} nodeName={nodeName} />);
    expect(container.querySelector('[data-mission-step="sabotage"]')).toBeNull();
  });

  it("offers the final binary choice while pendingChoice is set", () => {
    const onChoose = vi.fn();
    const mission = missionAt("wahl", {
      pendingChoice: { sabotageNode: "s1", effect: "funkstille" },
      offeredEffect: "funkstille",
    });
    render(<MissionPanel mission={mission} nodeName={nodeName} onChooseMissionPath={onChoose} />);

    const sabotage = screen.getByRole("button", { name: /Sabotage/ });
    expect(sabotage.textContent).toContain("Funkstille");
    expect(sabotage.textContent).toContain("Stadtwerke");
    const flucht = screen.getByRole("button", { name: /Flucht/ });
    expect(flucht.textContent).toContain("Autobahn");

    fireEvent.click(sabotage);
    expect(onChoose).toHaveBeenCalledWith("sabotage");
    fireEvent.click(flucht);
    expect(onChoose).toHaveBeenCalledWith("flucht");

    expect(screen.getByText(de["mission.choice.final"])).toBeInTheDocument();
  });

  it("resolves the current target per stage", () => {
    expect(currentMissionTarget(missionAt("diebstahl"))).toBe("a");
    expect(currentMissionTarget(missionAt("kontakt"))).toBe("e");
    expect(currentMissionTarget(missionAt("sabotage"))).toBe("s1");
    expect(currentMissionTarget(missionAt("flucht"))).toBe("g");
    expect(currentMissionTarget(missionAt("wahl"))).toBeNull();
    expect(currentMissionTarget(null)).toBeNull();
  });
});
