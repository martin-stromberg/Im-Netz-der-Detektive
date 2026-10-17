// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { loadMap } from "../logic/MapLoader";
import { createRng } from "../logic/rng";
import { ganoveSpawnChoices, pickDetectiveSpawns } from "../logic/SpawnSystem";
import { useGameStore, type Mission } from "../state/gameStore";
import { GanoveScreen } from "./GanoveScreen";
import de from "../i18n/de.json";

const teststadt = loadMap("teststadt");

function startPlaying(
  options: Parameters<ReturnType<typeof useGameStore.getState>["startGame"]>[2] = {},
) {
  useGameStore.getState().startGame(teststadt, 7, {
    detectivePositions: ["a"],
    ganovePosition: "g",
    mission: "none",
    cameraCount: 0,
    roundLimit: 20,
    ...options,
  });
}

function nodeEl(container: HTMLElement, id: string): Element {
  const el = container.querySelector(`[data-node-id="${id}"]`);
  if (el === null) {
    throw new Error(`node ${id} not rendered`);
  }
  return el;
}

describe("GanoveScreen — setup flow", () => {
  it("starts idle, then offers the ganove spawn choice after detectives are placed", () => {
    const { container } = render(<GanoveScreen mapId="teststadt" seed={42} />);
    expect(screen.getByTestId("ganove-screen")).toHaveAttribute("data-view", "idle");

    fireEvent.click(screen.getByRole("button", { name: de["game.new"] }));

    expect(screen.getByTestId("ganove-screen")).toHaveAttribute("data-view", "pickSpawn");
    // Detectives are placed first (auto pick), the ganove chooses last.
    const expectedDetectives = pickDetectiveSpawns(
      teststadt,
      createRng(42),
      teststadt.settings.detectiveCount.suggested,
    );
    expect(container.querySelectorAll("[data-detective]")).toHaveLength(expectedDetectives.length);
    const expectedChoices = ganoveSpawnChoices(teststadt, expectedDetectives);
    expect(container.querySelectorAll("[data-selectable]")).toHaveLength(expectedChoices.length);
    // Illegal spawns are not offered.
    for (const node of teststadt.nodes) {
      const el = nodeEl(container, node.id);
      if (expectedChoices.includes(node.id)) {
        expect(el).toHaveAttribute("data-selectable", "true");
      } else {
        expect(el.getAttribute("data-selectable")).toBeNull();
        expect(el.getAttribute("role")).toBeNull();
      }
    }
  });

  it("starts the game when a legal spawn node is picked", () => {
    const { container } = render(<GanoveScreen mapId="teststadt" seed={42} />);
    fireEvent.click(screen.getByRole("button", { name: de["game.new"] }));
    const spawn = container.querySelector("[data-selectable]") as Element;
    fireEvent.click(spawn);

    expect(screen.getByTestId("ganove-screen")).toHaveAttribute("data-view", "playing");
    const state = useGameStore.getState();
    expect(state.map?.id).toBe("teststadt");
    expect(state.ganovePosition).toBe(spawn.getAttribute("data-node-id"));
    expect(container.querySelector("[data-ganove]")).not.toBeNull();
  });
});

describe("GanoveScreen — playing", () => {
  it("shows position, legal targets, detectives, mission, heat badge and radio button", () => {
    startPlaying();
    const { container } = render(<GanoveScreen autoDetectives={false} />);

    expect(screen.getByTestId("phase-indicator").textContent).toBe(de["game.phase.ganove"]);
    expect(screen.getByRole("status", { name: /Polizeiaufmerksamkeit/ }).textContent).toContain(
      de["heat.ruhig"],
    );
    expect(screen.getByTestId("radio-button")).toBeEnabled();
    expect(screen.getByText(de["mission.none"])).toBeInTheDocument();
    expect(container.querySelector("[data-ganove]")).not.toBeNull();
    expect(container.querySelectorAll("[data-detective]")).toHaveLength(1);

    // Only legal neighbour targets are interactive: from "g" → d, f, h.
    const legal = [...container.querySelectorAll("[data-legal-target]")].map((el) =>
      el.getAttribute("data-node-id"),
    );
    expect(legal.sort()).toEqual(["d", "f", "h"]);
    expect(nodeEl(container, "a").getAttribute("role")).toBeNull();
  });

  it("moves the ganove and auto-runs the detective phase", () => {
    startPlaying({ detectivePositions: ["a", "i", "j"], ganovePosition: "d" });
    const { container } = render(<GanoveScreen detectiveStepDelay={0} />);
    const before = [...useGameStore.getState().detektivePositions];

    fireEvent.click(nodeEl(container, "c"));

    const state = useGameStore.getState();
    expect(state.ganovePosition).toBe("c");
    // The driver ran synchronously — back to the ganove phase, round 2.
    expect(state.phase).toBe("ganove");
    expect(state.round).toBe(2);
    expect(state.detektivePositions).not.toEqual(before);
  });

  it("stages world events as a banner plus a flashing edge", () => {
    startPlaying({ detectivePositions: ["a"], ganovePosition: "d" });
    const { container } = render(<GanoveScreen detectiveStepDelay={0} />);
    act(() => {
      useGameStore.getState().addEvent({
        kind: "umwelt",
        round: 1,
        edge: { a: "a", b: "b" },
        untilRound: 6,
        visibleTo: "both",
      });
    });
    expect(screen.getByTestId("event-banner-stack").textContent).toContain("gesperrt");
    expect(container.querySelector('[data-edge="a-b"] [class*="edgeFlash"]')).not.toBeNull();
  });

  it("ends as escape when the ganove reaches a flucht node", () => {
    startPlaying({ ganovePosition: "f" });
    const { container } = render(<GanoveScreen detectiveStepDelay={0} />);

    fireEvent.click(nodeEl(container, "g")); // flucht, one fahrt edge away

    const outcome = screen.getByTestId("outcome-panel");
    expect(outcome).toHaveAttribute("data-outcome", "escaped");
    expect(outcome.textContent).toContain(de["outcome.escaped"]);
    expect(useGameStore.getState().outcome).toBe("escaped");
  });

  it("offers and executes the mission action at the target node", () => {
    startPlaying({ ganovePosition: "g" });
    useGameStore.getState().setMission({
      id: "random",
      targets: { diebstahl: "g", kontakt: "j", flucht: "d", sabotage: null },
      stage: "diebstahl",
      pendingChoice: null,
      offeredEffect: null,
      appliedEffect: null,
    });
    render(<GanoveScreen detectiveStepDelay={0} />);

    const actionButton = screen.getByTestId("mission-action");
    expect(actionButton.textContent).toBe(de["mission.action.diebstahl"]);
    fireEvent.click(actionButton);

    expect(useGameStore.getState().mission?.stage).toBe("kontakt");
    expect(useGameStore.getState().phase).toBe("ganove"); // detectives auto-moved
    expect(screen.getByTestId("mission-current-target").textContent).toContain("Universitaet");
  });

  it("shows the informant's binary choice and resolves it via sabotage", () => {
    startPlaying({ ganovePosition: "g" });
    const mission: Mission = {
      id: "random",
      targets: { diebstahl: "a", kontakt: "j", flucht: "d", sabotage: "f" },
      stage: "wahl",
      pendingChoice: { sabotageNode: "f", effect: "funkstille" },
      offeredEffect: "funkstille",
      appliedEffect: null,
    };
    useGameStore.getState().setMission(mission);
    const { container } = render(<GanoveScreen detectiveStepDelay={0} />);

    // While the choice is pending, no moves are offered.
    expect(container.querySelectorAll("[data-legal-target]")).toHaveLength(0);
    const choice = screen.getByTestId("mission-choice");
    fireEvent.click(within(choice).getByRole("button", { name: /Sabotage/ }));

    const state = useGameStore.getState();
    expect(state.mission?.stage).toBe("sabotage");
    expect(state.mission?.pendingChoice).toBeNull();
    expect(screen.getByTestId("mission-current-target").textContent).toContain("Schloss");
  });

  it("lets the ganove decline sabotage and head for the escape", () => {
    startPlaying({ ganovePosition: "g" });
    useGameStore.getState().setMission({
      id: "random",
      targets: { diebstahl: "a", kontakt: "j", flucht: "d", sabotage: "f" },
      stage: "wahl",
      pendingChoice: { sabotageNode: "f", effect: "kamera_aus" },
      offeredEffect: "kamera_aus",
      appliedEffect: null,
    });
    render(<GanoveScreen detectiveStepDelay={0} />);

    fireEvent.click(screen.getByRole("button", { name: /Flucht/ }));
    expect(useGameStore.getState().mission?.stage).toBe("flucht");
    expect(screen.getByTestId("mission-current-target").textContent).toContain("Hafen");
  });

  it("taps the police radio exactly once and reports the hints", () => {
    startPlaying({ ganovePosition: "f", resolvedCameras: ["e"] });
    const { container } = render(<GanoveScreen detectiveStepDelay={0} />);

    // Move onto the camera node to produce a hint the radio can report.
    fireEvent.click(nodeEl(container, "e"));
    expect(useGameStore.getState().phase).toBe("ganove");

    fireEvent.click(screen.getByTestId("radio-button"));
    expect(screen.getByTestId("radio-button")).toBeDisabled();
    expect(screen.getByText(/Kamera bei Aasee/)).toBeInTheDocument();
  });

  it("ends the game as draw after confirmation", () => {
    startPlaying();
    render(<GanoveScreen detectiveStepDelay={0} />);

    fireEvent.click(screen.getByTestId("abort-button"));
    fireEvent.click(screen.getByTestId("abort-yes"));

    expect(useGameStore.getState().outcome).toBe("draw");
    expect(screen.getByTestId("outcome-panel")).toHaveAttribute("data-outcome", "draw");
    expect(
      within(screen.getByTestId("outcome-panel")).getByText(de["outcome.draw"]),
    ).toBeInTheDocument();
  });

  it("keeps playing when the abort is declined", () => {
    startPlaying();
    render(<GanoveScreen detectiveStepDelay={0} />);

    fireEvent.click(screen.getByTestId("abort-button"));
    fireEvent.click(screen.getByRole("button", { name: de["abort.no"] }));

    expect(useGameStore.getState().outcome).toBeNull();
    expect(screen.getByTestId("abort-button")).toBeInTheDocument();
  });
});

describe("GanoveScreen — information asymmetry", () => {
  it("never renders cameras or detective-side hints on the DOM", () => {
    startPlaying({ ganovePosition: "f", resolvedCameras: ["e", "c"] });
    const { container } = render(<GanoveScreen detectiveStepDelay={0} />);
    fireEvent.click(nodeEl(container, "e")); // triggers the camera on e

    const state = useGameStore.getState();
    // The engine recorded detective-side hints...
    expect(state.events.some((e) => e.kind === "camera")).toBe(true);
    expect(state.events.some((e) => e.visibleTo === "detectives")).toBe(true);
    // ...but nothing camera/hint shaped is rendered for the ganove.
    expect(container.querySelector("[data-camera]")).toBeNull();
    expect(container.querySelector("[class*='camera']")).toBeNull();
    expect(container.querySelector("[data-hint]")).toBeNull();
    expect(container.querySelector("[data-detective]")).not.toBeNull();
    // No detective hint text leaks into the intel feed.
    const intelFeed = screen.getByTestId("ganove-screen");
    expect(intelFeed.textContent).not.toMatch(/Kamera bei|Sichtung bei/);
  });
});
