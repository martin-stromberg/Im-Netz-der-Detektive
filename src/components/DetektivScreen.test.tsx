// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { loadMap } from "../logic/MapLoader";
import { deducePossiblePositions } from "../logic/Deduction";
import { detectiveSpawnChoices } from "../logic/SpawnSystem";
import { visibleCameras, visibleEvents } from "../logic/InformationSystem";
import { useGameStore, type GameState } from "../state/gameStore";
import { detectiveStartsFromLog } from "../state/detectiveDriver";
import { driveGanovePhase } from "../state/ganoveDriver";
import { DetektivScreen } from "./DetektivScreen";
import de from "../i18n/de.json";

const teststadt = loadMap("teststadt");

type StartOptions = Parameters<GameState["startGame"]>[2];

function startPlaying(options: StartOptions = {}) {
  useGameStore.getState().startGame(teststadt, 7, {
    detectivePositions: ["a"],
    ganovePosition: "g",
    mission: "none",
    cameraCount: 2,
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

/** Node ids currently carrying the deduction overlay ring. */
function overlayNodeIds(container: HTMLElement): string[] {
  return [...container.querySelectorAll("[data-possible]")].map(
    (el) => el.closest("[data-node-id]")?.getAttribute("data-node-id") ?? "?",
  );
}

afterEach(() => {
  act(() => {
    useGameStore.getState().resetGame();
  });
});

describe("DetektivScreen — setup flow", () => {
  it("starts idle, then offers one pick per detective from the legal candidates", () => {
    const { container } = render(<DetektivScreen mapId="teststadt" seed={42} autoGanove={false} />);
    expect(screen.getByTestId("detektiv-screen")).toHaveAttribute("data-view", "idle");

    fireEvent.click(screen.getByRole("button", { name: de["game.new"] }));

    expect(screen.getByTestId("detektiv-screen")).toHaveAttribute("data-view", "pickSpawns");
    const expected = detectiveSpawnChoices(teststadt);
    expect(container.querySelectorAll("[data-selectable]")).toHaveLength(expected.length);
    for (const node of teststadt.nodes) {
      const el = nodeEl(container, node.id);
      if (expected.includes(node.id)) {
        expect(el).toHaveAttribute("data-selectable", "true");
      } else {
        expect(el.getAttribute("data-selectable")).toBeNull();
      }
    }
  });

  it("starts the game after D1→Dn picks and keeps the ganove start hidden", () => {
    const { container } = render(<DetektivScreen mapId="teststadt" seed={42} autoGanove={false} />);
    fireEvent.click(screen.getByRole("button", { name: de["game.new"] }));

    const count = teststadt.settings.detectiveCount.suggested;
    const picks: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const target = container.querySelector("[data-selectable]") as Element;
      picks.push(target.getAttribute("data-node-id") ?? "?");
      fireEvent.click(target);
    }

    expect(screen.getByTestId("detektiv-screen")).toHaveAttribute("data-view", "playing");
    const state = useGameStore.getState();
    expect(state.map?.id).toBe("teststadt");
    expect(state.detektivePositions).toEqual(picks);
    // The ganove start was drawn secretly — and is never rendered.
    expect(state.ganovePosition).not.toBeNull();
    expect(container.querySelector("[data-ganove]")).toBeNull();
    expect(container.querySelector("[data-node-id]")).not.toBeNull();
  });
});

describe("DetektivScreen — playing", () => {
  it("shows the detective map: cameras, categories, zones, squad — never the ganove", () => {
    startPlaying();
    const { container } = render(<DetektivScreen autoGanove={false} />);

    const state = useGameStore.getState();
    expect(container.querySelectorAll("[data-camera]")).toHaveLength(state.cameras.length);
    const categories = teststadt.nodes.reduce((sum, node) => sum + node.categories.length, 0);
    expect(container.querySelectorAll("[data-category]")).toHaveLength(categories);
    expect(container.querySelectorAll("[data-zone]")).toHaveLength(teststadt.nodes.length);
    expect(container.querySelectorAll("[data-detective]")).toHaveLength(1);
    // Structural asymmetry: no ganove marker, no drawn mission targets.
    expect(container.querySelector("[data-ganove]")).toBeNull();
    expect(container.querySelectorAll("[data-mission-target]")).toHaveLength(0);
    expect(container.querySelectorAll("[data-detective]")).toHaveLength(
      state.detektivePositions.length,
    );
  });

  it("drives the AI ganove turn automatically when enabled", () => {
    render(<DetektivScreen autoGanove />);
    act(() => {
      startPlaying();
    });
    // The subscription fired inside startGame: ganove already moved.
    const state = useGameStore.getState();
    expect(state.phase).toBe("detektive");
    expect(state.ganovePosition).not.toBe("g");
  });

  it("moves the active detective on a legal target click and advances the round", () => {
    startPlaying();
    const { container } = render(<DetektivScreen autoGanove={false} />);
    act(() => {
      driveGanovePhase();
    });
    expect(useGameStore.getState().phase).toBe("detektive");

    const legal = useGameStore.getState().getLegalDetectiveMoves();
    const targets = container.querySelectorAll("[data-legal-target]");
    expect(targets).toHaveLength(legal.length);
    expect(container.querySelector("[data-active-detective]")).not.toBeNull();

    fireEvent.click(nodeEl(container, legal[0].nodeId));
    const state = useGameStore.getState();
    expect(state.detektivePositions).toEqual([legal[0].nodeId]);
    // Single-detective squad: after the move the ganove phase begins.
    expect(state.phase).toBe("ganove");
    expect(state.round).toBe(2);
  });

  it("lists only detective-visible events in the chronicle with round and place", () => {
    startPlaying();
    const { container } = render(<DetektivScreen autoGanove={false} />);
    act(() => {
      useGameStore.setState({
        events: [
          { kind: "camera", round: 2, nodeId: "g", visibleTo: "detectives" },
          { kind: "polizeifunk", round: 2, visibleTo: "ganove" },
          { kind: "hinweis", round: 3, zone: "nord", nodeIds: ["g"], visibleTo: "detectives" },
          {
            kind: "umwelt",
            round: 3,
            edge: { a: "a", b: "b" },
            untilRound: 5,
            visibleTo: "both",
          },
        ],
      });
    });

    const entries = container.querySelectorAll("[data-hint-event]");
    expect(entries).toHaveLength(3);
    expect(container.querySelector('[data-hint-event="polizeifunk"]')).toBeNull();
    const text = screen.getByTestId("chronicle-feed").textContent ?? "";
    expect(text).toContain("Kamera");
    expect(text).toContain("Bereich");
    expect(text).toContain("gesperrt");
    // Every entry carries its round badge.
    expect(text.match(/Runde/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("shows the mission structure with pools — never the drawn target nodes", () => {
    startPlaying({
      resolvedMission: {
        id: "custom",
        targets: { diebstahl: "a", kontakt: "e", flucht: "b", sabotage: null },
      },
    });
    const { container } = render(<DetektivScreen autoGanove={false} />);

    const steps = container.querySelectorAll("[data-mission-step]");
    expect(steps).toHaveLength(3);
    const text = screen.getByTestId("mission-structure").textContent ?? "";
    expect(text).toContain("Diebstahl");
    expect(text).toContain("Pool");
    // The drawn target nodes must not leak into the structure view.
    const targetNames = ["a", "e", "b"].map(
      (id) => teststadt.nodes.find((node) => node.id === id)?.name ?? "",
    );
    for (const name of targetNames) {
      expect(text).not.toContain(name);
    }
  });

  it("renders exactly the engine-computed possible positions in the overlay", () => {
    startPlaying();
    const { container } = render(<DetektivScreen autoGanove={false} />);
    act(() => {
      useGameStore.getState().moveGanove("h");
    });

    const state = useGameStore.getState();
    const expected = deducePossiblePositions({
      map: teststadt,
      detectiveStarts: detectiveStartsFromLog(state.log),
      events: visibleEvents(state.events, "detectives"),
      cameras: visibleCameras(state.cameras, "detectives"),
      round: state.round,
      detectivePositions: state.detektivePositions,
    });
    expect(overlayNodeIds(container).sort()).toEqual([...expected].sort());

    // Toggling the checkbox hides the overlay and its counter.
    fireEvent.click(screen.getByTestId("overlay-toggle"));
    expect(overlayNodeIds(container)).toHaveLength(0);
    expect(screen.queryByTestId("overlay-count")).toBeNull();
  });

  it("sets, comments and keeps markers across rounds", () => {
    startPlaying();
    const { container } = render(<DetektivScreen autoGanove={false} />);

    fireEvent.click(screen.getByTestId("marker-toggle"));
    // Marker mode offers every node for marking.
    expect(container.querySelectorAll("[data-markable]")).toHaveLength(teststadt.nodes.length);
    fireEvent.click(nodeEl(container, "c"));
    expect(container.querySelectorAll("[data-marker]")).toHaveLength(1);
    const item = container.querySelector('[data-marker-item="c"]');
    expect(item).not.toBeNull();

    const input = item?.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Verdacht Richtung Norden" } });
    expect(input.value).toBe("Verdacht Richtung Norden");

    // Back to move mode, play a full round — the marker must persist.
    fireEvent.click(screen.getByTestId("marker-toggle"));
    act(() => {
      driveGanovePhase();
    });
    const legal = useGameStore.getState().getLegalDetectiveMoves();
    fireEvent.click(nodeEl(container, legal[0].nodeId));
    expect(useGameStore.getState().round).toBe(2);
    expect(container.querySelectorAll("[data-marker]")).toHaveLength(1);
    expect(
      (container.querySelector('[data-marker-item="c"] input') as HTMLInputElement).value,
    ).toBe("Verdacht Richtung Norden");

    // Clicking the marked node again removes it.
    fireEvent.click(screen.getByTestId("marker-toggle"));
    fireEvent.click(nodeEl(container, "c"));
    expect(container.querySelectorAll("[data-marker]")).toHaveLength(0);
  });

  it("ends the game as a draw via the abort confirmation", () => {
    startPlaying();
    render(<DetektivScreen autoGanove={false} />);
    fireEvent.click(screen.getByTestId("abort-button"));
    fireEvent.click(screen.getByTestId("abort-yes"));

    const outcome = screen.getByTestId("outcome-panel");
    expect(outcome).toHaveAttribute("data-outcome", "draw");
    expect(outcome.textContent).toContain(de["detektiv.outcome.draw"]);
  });
});
