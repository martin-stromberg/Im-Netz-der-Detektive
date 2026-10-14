// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { loadMap } from "../logic/MapLoader";
import { MapGraph } from "./MapGraph";
import de from "../i18n/de.json";

const map = loadMap("teststadt");

describe("MapGraph", () => {
  it("renders every node with its clear name and every edge", () => {
    const { container } = render(<MapGraph map={map} />);
    expect(container.querySelectorAll("[data-node-id]")).toHaveLength(map.nodes.length);
    for (const node of map.nodes) {
      expect(container.querySelector(`[data-node-id="${node.id}"]`)?.textContent).toContain(
        node.name,
      );
    }
    expect(container.querySelectorAll("[data-edge]")).toHaveLength(map.edges.length);
  });

  it("marks fahrt edges differently from weg edges", () => {
    const { container } = render(<MapGraph map={map} />);
    expect(container.querySelectorAll('[data-edge-type="fahrt"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-edge-type="weg"]')).toHaveLength(map.edges.length - 1);
  });

  it("greys out blocked edges and marks them with a barrier glyph", () => {
    const { container } = render(
      <MapGraph map={map} round={2} blockedEdges={[{ a: "f", b: "g", untilRound: 3 }]} />,
    );
    const edge = container.querySelector('[data-edge="f-g"] [data-blocked="true"]');
    expect(edge).not.toBeNull();
    expect(container.querySelector('[data-block-glyph="f-g"]')).not.toBeNull();
    // An expired block is not rendered as blocked.
    const expired = render(
      <MapGraph map={map} round={5} blockedEdges={[{ a: "f", b: "g", untilRound: 3 }]} />,
    );
    expect(expired.container.querySelector('[data-blocked="true"]')).toBeNull();
  });

  it("offers legal targets as clickable, keyboard-operable nodes", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <MapGraph
        map={map}
        legalTargets={[
          { nodeId: "h", edgeType: "weg" },
          { nodeId: "d", edgeType: "weg" },
        ]}
        onNodeSelect={onSelect}
      />,
    );
    const legal = container.querySelector('[data-node-id="h"]');
    expect(legal).toHaveAttribute("role", "button");
    expect(legal).toHaveAttribute("tabindex", "0");
    expect(legal).toHaveAttribute(
      "aria-label",
      de["node.moveTo"].replace("{name}", "Prinzipalmarkt"),
    );

    fireEvent.click(container.querySelector('[data-node-id="h"]') as Element);
    expect(onSelect).toHaveBeenCalledWith("h");

    fireEvent.keyDown(container.querySelector('[data-node-id="d"]') as Element, {
      key: "Enter",
    });
    expect(onSelect).toHaveBeenCalledWith("d");

    fireEvent.keyDown(container.querySelector('[data-node-id="h"]') as Element, {
      key: " ",
    });
    expect(onSelect).toHaveBeenCalledTimes(3);
  });

  it("does not offer non-legal nodes for selection", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <MapGraph
        map={map}
        legalTargets={[{ nodeId: "h", edgeType: "weg" }]}
        onNodeSelect={onSelect}
      />,
    );
    const other = container.querySelector('[data-node-id="a"]') as Element;
    expect(other.getAttribute("role")).toBeNull();
    fireEvent.click(other);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders detective markers with numbers and the ganove marker only when given", () => {
    const { container, rerender } = render(<MapGraph map={map} detectivePositions={["a", "i"]} />);
    expect(container.querySelectorAll("[data-detective]")).toHaveLength(2);
    expect(container.querySelector("[data-ganove]")).toBeNull();

    rerender(<MapGraph map={map} detectivePositions={["a"]} ganovePosition="g" />);
    expect(container.querySelector("[data-ganove]")).not.toBeNull();
  });

  it("marks mission targets, the current target and escape points by shape", () => {
    const { container } = render(
      <MapGraph
        map={map}
        missionTargets={{ diebstahl: "a", kontakt: "e", flucht: "g" }}
        currentTargetId="a"
        escapeNodeIds={["g"]}
      />,
    );
    expect(
      container.querySelector('[data-node-id="a"] [data-mission-target="diebstahl"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-node-id="e"] [data-mission-target="kontakt"]'),
    ).not.toBeNull();
    expect(container.querySelector('[data-node-id="g"] [data-escape-node="true"]')).not.toBeNull();
  });

  it("renders spawn choices via selectableNodeIds", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <MapGraph map={map} selectableNodeIds={["f", "g", "h"]} onNodeSelect={onSelect} />,
    );
    const node = container.querySelector('[data-node-id="f"]') as Element;
    expect(node).toHaveAttribute("data-selectable", "true");
    fireEvent.click(node);
    expect(onSelect).toHaveBeenCalledWith("f");
  });

  it("renders no camera elements or hint artifacts — asymmetric by construction", () => {
    const { container } = render(
      <MapGraph
        map={map}
        detectivePositions={["a"]}
        ganovePosition="g"
        legalTargets={[{ nodeId: "h", edgeType: "weg" }]}
      />,
    );
    expect(container.querySelector("[data-camera]")).toBeNull();
    expect(container.querySelector("[class*='camera']")).toBeNull();
    expect(container.querySelector("[data-hint]")).toBeNull();
    expect(container.textContent).not.toMatch(/Kamera|Hinweis|Sichtung/);
  });
});

describe("MapGraph — detective perspective props", () => {
  it("renders camera glyphs with an active flag and a strike when inactive", () => {
    const { container } = render(
      <MapGraph
        map={map}
        cameras={[
          { nodeId: "a", active: true },
          { nodeId: "b", active: false },
        ]}
      />,
    );
    expect(container.querySelectorAll("[data-camera]")).toHaveLength(2);
    expect(
      container.querySelector('[data-node-id="a"] [data-camera-active="true"]'),
    ).not.toBeNull();
    const inactive = container.querySelector('[data-node-id="b"] [data-camera]');
    expect(inactive).toHaveAttribute("data-camera-active", "false");
    expect(inactive?.querySelector("line")).not.toBeNull();
  });

  it("renders category badges and zone halos on demand", () => {
    const plain = render(<MapGraph map={map} />);
    expect(plain.container.querySelectorAll("[data-category]")).toHaveLength(0);
    expect(plain.container.querySelectorAll("[data-zone]")).toHaveLength(0);

    const { container } = render(<MapGraph map={map} showCategories showZones />);
    const expectedCategories = map.nodes.reduce((sum, node) => sum + node.categories.length, 0);
    expect(container.querySelectorAll("[data-category]")).toHaveLength(expectedCategories);
    expect(container.querySelectorAll("[data-zone]")).toHaveLength(map.nodes.length);
    const zones = new Set(map.nodes.map((node) => node.zone));
    for (const zone of zones) {
      expect(container.querySelectorAll(`[data-zone="${zone}"]`)).not.toHaveLength(0);
    }
  });

  it("highlights the active detective marker", () => {
    const { container } = render(
      <MapGraph map={map} detectivePositions={["a", "i"]} activeDetectiveIndex={1} />,
    );
    expect(container.querySelector('[data-detective="1"]')).toHaveAttribute(
      "data-active-detective",
      "true",
    );
    expect(
      container.querySelector('[data-detective="0"]')?.getAttribute("data-active-detective"),
    ).toBeNull();
  });

  it("renders marker pins and the deduction overlay ring", () => {
    const { container } = render(
      <MapGraph map={map} markedNodeIds={["a", "c"]} possibleNodeIds={["g", "h"]} />,
    );
    expect(container.querySelectorAll("[data-marker]")).toHaveLength(2);
    expect(container.querySelectorAll("[data-possible]")).toHaveLength(2);
    expect(container.querySelector('[data-node-id="g"] [data-possible]')).not.toBeNull();
  });

  it("offers markable nodes as keyboard-operable marker toggles", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <MapGraph
        map={map}
        markableNodeIds={map.nodes.map((node) => node.id)}
        onNodeSelect={onSelect}
      />,
    );
    expect(container.querySelectorAll("[data-markable]")).toHaveLength(map.nodes.length);
    const node = container.querySelector('[data-node-id="e"]') as Element;
    expect(node).toHaveAttribute("role", "button");
    const nodeE = map.nodes.find((n) => n.id === "e");
    expect(node).toHaveAttribute(
      "aria-label",
      de["node.mark"].replace("{name}", nodeE?.name ?? "?"),
    );
    fireEvent.keyDown(node, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("e");
  });

  it("roams between interactive nodes with the arrow keys", () => {
    const { container } = render(
      <MapGraph
        map={map}
        legalTargets={[
          { nodeId: "a", edgeType: "weg" },
          { nodeId: "b", edgeType: "weg" },
          { nodeId: "e", edgeType: "weg" },
        ]}
        onNodeSelect={vi.fn()}
      />,
    );
    const a = container.querySelector('[data-node-id="a"]') as HTMLElement;
    const b = container.querySelector('[data-node-id="b"]') as HTMLElement;
    const e = container.querySelector('[data-node-id="e"]') as HTMLElement;
    a.focus();
    expect(a).toHaveFocus();
    // a(10,10) → right: b(20,10) is perfectly aligned, e(20,30) farther off-axis.
    fireEvent.keyDown(a, { key: "ArrowRight" });
    expect(b).toHaveFocus();
    // b → down: e(20,30) sits directly below.
    fireEvent.keyDown(b, { key: "ArrowDown" });
    expect(e).toHaveFocus();
    // e → left: a(10,10) is the only candidate left of e.
    fireEvent.keyDown(e, { key: "ArrowLeft" });
    expect(a).toHaveFocus();
    // e → up: b(20,10) is above; ArrowRight from a with no rightward
    // candidate keeps the focus put.
    fireEvent.keyDown(e, { key: "ArrowUp" });
    expect(b).toHaveFocus();
    fireEvent.keyDown(b, { key: "ArrowLeft" });
    expect(a).toHaveFocus();
    fireEvent.keyDown(a, { key: "ArrowLeft" });
    expect(a).toHaveFocus();
  });

  it("renders the comic board layer and landmark glyphs when the pack provides them", () => {
    const illustrated = {
      ...map,
      board: {
        features: [
          { kind: "shape" as const, style: "water" as const, d: "M 0 0 L 10 10 Z" },
          { kind: "shape" as const, style: "park" as const, d: "M 1 1 L 2 2 Z" },
        ],
      },
      nodes: map.nodes.map((node) =>
        node.id === "a" ? { ...node, landmark: "dom" as const } : node,
      ),
    };
    const { container } = render(<MapGraph map={illustrated} />);
    expect(container.querySelectorAll("[data-board-style]")).toHaveLength(2);
    expect(container.querySelectorAll("[data-landmark='dom']")).toHaveLength(1);
    // Decoration never intercepts input.
    expect(container.querySelector('[data-layer="board"]')?.getAttribute("pointer-events")).toBe(
      "none",
    );
    expect(
      container.querySelector('[data-layer="landmarks"]')?.getAttribute("pointer-events"),
    ).toBe("none");
  });
});
