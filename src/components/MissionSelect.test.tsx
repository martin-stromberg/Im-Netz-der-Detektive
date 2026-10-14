// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MissionSelect } from "./MissionSelect";
import { loadMap } from "../logic/MapLoader";
import { loadMissionSet } from "../logic/MissionLoader";

const muenster = loadMap("muenster");
const luebeck = loadMap("luebeck");
const teststadt = loadMap("teststadt");

function nodeEl(container: HTMLElement, id: string): Element {
  const el = container.querySelector(`[data-node-id="${id}"]`);
  if (el === null) {
    throw new Error(`node ${id} not rendered`);
  }
  return el;
}

describe("MissionSelect", () => {
  it("offers cases with name and mini story on maps with a mission set", () => {
    render(<MissionSelect map={muenster} onBack={vi.fn()} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByTestId("mission-case"));
    const list = screen.getByTestId("case-list");
    for (const entry of loadMissionSet(muenster).cases) {
      const card = screen.getByTestId(`case-${entry.id}`);
      expect(card).toHaveTextContent(entry.name);
      expect(card).toHaveTextContent(entry.story);
    }
    expect(list.children.length).toBeGreaterThanOrEqual(2);
  });

  it("offers no case entry on maps without a mission set", () => {
    render(<MissionSelect map={luebeck} onBack={vi.fn()} onSelect={vi.fn()} />);
    expect(screen.queryByTestId("mission-case")).toBeNull();
    expect(screen.getByTestId("mission-random")).toBeInTheDocument();
    expect(screen.getByTestId("mission-custom")).toBeInTheDocument();
    expect(screen.getByTestId("mission-none")).toBeInTheDocument();
  });

  it("selects a predefined case", () => {
    const onSelect = vi.fn();
    render(<MissionSelect map={muenster} onBack={vi.fn()} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId("mission-case"));
    fireEvent.click(screen.getByTestId("case-diebstahlserie-altstadt"));
    expect(onSelect).toHaveBeenCalledWith({ type: "case", id: "diebstahlserie-altstadt" });
  });

  it("selects random and none missions", () => {
    const onSelect = vi.fn();
    render(<MissionSelect map={muenster} onBack={vi.fn()} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId("mission-random"));
    expect(onSelect).toHaveBeenCalledWith("random");
    fireEvent.click(screen.getByTestId("mission-none"));
    expect(onSelect).toHaveBeenCalledWith("none");
  });

  it("lets only category-matching nodes be picked for a custom mission", () => {
    const { container } = render(
      <MissionSelect map={teststadt} onBack={vi.fn()} onSelect={vi.fn()} />,
    );
    fireEvent.click(screen.getByTestId("mission-custom"));
    // Step 1 is diebstahl — only diebstahl nodes are selectable.
    const diebstahlSelectable = [...container.querySelectorAll("[data-selectable]")].map((el) =>
      el.getAttribute("data-node-id"),
    );
    expect(diebstahlSelectable.sort()).toEqual(["a", "c", "f", "h"]);
    fireEvent.click(nodeEl(container, "a"));
    // Step 2 is kontakt — only kontakt nodes.
    const kontaktSelectable = [...container.querySelectorAll("[data-selectable]")].map((el) =>
      el.getAttribute("data-node-id"),
    );
    expect(kontaktSelectable.sort()).toEqual(["d", "e", "i", "j"]);
    fireEvent.click(nodeEl(container, "j"));
    // Step 3 is flucht.
    const fluchtSelectable = [...container.querySelectorAll("[data-selectable]")].map((el) =>
      el.getAttribute("data-node-id"),
    );
    expect(fluchtSelectable.sort()).toEqual(["b", "d", "g"]);
    fireEvent.click(nodeEl(container, "d"));
    // Teststadt has no sabotage category — nothing selectable, skip offered.
    expect(screen.getByTestId("custom-skip-sabotage")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-selectable]")).toHaveLength(0);
    fireEvent.click(screen.getByTestId("custom-skip-sabotage"));
    const confirm = screen.getByTestId("custom-confirm");
    expect(confirm).toBeInTheDocument();
  });

  it("shows validateCustomTargets violations and blocks confirm", () => {
    const { container } = render(
      <MissionSelect map={teststadt} onBack={vi.fn()} onSelect={vi.fn()} />,
    );
    fireEvent.click(screen.getByTestId("mission-custom"));
    // a→j (3) ok, but flucht "b" sits only 2 from kontakt "j"? —
    // pick targets that violate a criterion: diebstahl a, kontakt e,
    // flucht b (kontakt↔flucht gap 2 < 4).
    fireEvent.click(nodeEl(container, "a"));
    fireEvent.click(nodeEl(container, "e"));
    fireEvent.click(nodeEl(container, "b"));
    expect(screen.getByTestId("custom-errors")).toBeInTheDocument();
    expect(screen.getByTestId("custom-confirm")).toBeDisabled();
  });

  it("emits the custom targets when the mission is valid", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <MissionSelect map={teststadt} onBack={vi.fn()} onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByTestId("mission-custom"));
    fireEvent.click(nodeEl(container, "a"));
    fireEvent.click(nodeEl(container, "j"));
    fireEvent.click(nodeEl(container, "d"));
    fireEvent.click(screen.getByTestId("custom-skip-sabotage"));
    fireEvent.click(screen.getByTestId("custom-confirm"));
    expect(onSelect).toHaveBeenCalledWith({
      type: "custom",
      targets: { diebstahl: "a", kontakt: "j", flucht: "d", sabotage: undefined },
    });
  });
});
