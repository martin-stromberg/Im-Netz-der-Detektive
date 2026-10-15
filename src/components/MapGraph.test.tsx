// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { loadMap } from "../logic/MapLoader";
import { MapGraph } from "./MapGraph";
import { MapLegend } from "./GanoveScreen";
import { DetectiveMapLegend } from "./DetektivScreen";
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

  it("draws every edge as a cased route: dark casing under the semantic core", () => {
    const { container } = render(<MapGraph map={map} />);
    const groups = container.querySelectorAll("[data-edge]");
    expect(groups).toHaveLength(map.edges.length);
    for (const group of groups) {
      // Exactly two sibling strokes: the decorative casing painted
      // first, then the core line that carries the data-* contract.
      const lines = group.querySelectorAll(":scope > line");
      expect(lines).toHaveLength(2);
      const [casing, core] = [...lines];
      expect(casing.className.baseVal).toContain("edgeCasing");
      expect(casing.getAttribute("aria-hidden")).toBe("true");
      expect(core.getAttribute("data-edge-type")).not.toBeNull();
      expect((casing.compareDocumentPosition(core) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0).toBe(
        true,
      );
    }
    // The fahrt edge f–g rides on the wider track-bed casing.
    const fahrt = container.querySelector('[data-edge="f-g"]');
    expect(fahrt?.querySelector(":scope > line")?.className.baseVal).toContain("edgeCasingFahrt");
  });

  it("greys out blocked edges and marks them with a barrier glyph", () => {
    const { container } = render(
      <MapGraph map={map} round={2} blockedEdges={[{ a: "f", b: "g", untilRound: 3 }]} />,
    );
    const edge = container.querySelector('[data-edge="f-g"] [data-blocked="true"]');
    expect(edge).not.toBeNull();
    expect(container.querySelector('[data-block-glyph="f-g"]')).not.toBeNull();
    // The blocked route keeps a recognisable pattern: muted casing,
    // broken core — the cross glyph stays the shape cue.
    const group = container.querySelector('[data-edge="f-g"]') as Element;
    const casing = group.querySelector(":scope > line") as Element;
    expect(casing.className.baseVal).toContain("edgeCasingBlocked");
    expect((edge as Element).className.baseVal).toContain("edgeBlocked");
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

  it("renders each place as a framed plaque token, not a flat dot", () => {
    const { container } = render(<MapGraph map={map} />);
    const nodes = container.querySelectorAll("[data-node-id]");
    expect(nodes).toHaveLength(map.nodes.length);
    for (const node of nodes) {
      const token = node.querySelector("[class*='nodeToken']") as Element;
      expect(token).not.toBeNull();
      expect(token.getAttribute("aria-hidden")).toBe("true");
      expect(token.querySelector("[class*='tokenRim']")).not.toBeNull();
      expect(token.querySelector("[class*='tokenFace']")).not.toBeNull();
      expect(token.querySelector("[class*='tokenInner']")).not.toBeNull();
      expect(token.querySelector("[class*='tokenShadow']")).not.toBeNull();
      // The whole visible plaque stays inside the r=14 hit area.
      for (const el of token.querySelectorAll("circle, ellipse")) {
        const r = Number(el.getAttribute("r") ?? el.getAttribute("rx"));
        expect(r).toBeLessThan(14);
      }
    }
    // The flat ink pip is gone.
    expect(container.querySelectorAll("[class*='nodeDot']")).toHaveLength(0);
  });

  it("keeps the invisible hit area at r=14 around the token", () => {
    const { container } = render(
      <MapGraph map={map} legalTargets={[{ nodeId: "h", edgeType: "weg" }]} />,
    );
    const hitArea = container.querySelector("[data-node-id='h'] [class*='hitArea']");
    expect(hitArea).not.toBeNull();
    expect(hitArea).toHaveAttribute("r", "14");
    // Non-interactive nodes never get a pointer-catching hit area.
    expect(container.querySelector("[data-node-id='a'] [class*='hitArea']")).toBeNull();
  });

  it("marks legal and selectable places with the dashed ring", () => {
    const { container } = render(
      <MapGraph
        map={map}
        legalTargets={[{ nodeId: "h", edgeType: "weg" }]}
        selectableNodeIds={["f"]}
        markableNodeIds={["g"]}
      />,
    );
    // Same shape = same meaning: legal targets, spawn choices and
    // markable nodes all wear the dashed ring plus the perforated rim
    // (rim styling is CSS-only, asserted via class presence).
    for (const id of ["h", "f", "g"]) {
      const node = container.querySelector(`[data-node-id="${id}"]`) as Element;
      expect(node.querySelector("[class*='legalRing']")).not.toBeNull();
      expect(node.querySelector("[class*='nodeToken'] [class*='tokenRim']")).not.toBeNull();
    }
    expect(container.querySelector("[data-node-id='a'] [class*='legalRing']")).toBeNull();
  });

  it("embosses the token face with a defs gradient that resolves", () => {
    const { container } = render(<MapGraph map={map} />);
    const grad = container.querySelector("radialGradient[id$='-tokenFace']");
    expect(grad).not.toBeNull();
    const face = container.querySelector("[class*='tokenFace']") as Element;
    const ref = (face.getAttribute("fill") ?? "").match(/url\(#([^)]+)\)/)?.[1];
    expect(ref).toBe(grad?.id);
  });

  it("renders a parchment board face beneath every data layer", () => {
    const { container } = render(<MapGraph map={map} />);
    const svg = container.querySelector('[data-testid="map-graph"]') as SVGSVGElement;
    // Procedural grain + vignette come from <defs>.
    const defs = svg.querySelector("defs");
    expect(defs).not.toBeNull();
    expect(defs?.querySelector("filter feTurbulence")).not.toBeNull();
    expect(defs?.querySelector("radialGradient")).not.toBeNull();
    // The board face group is painted before the first data layer.
    const face = svg.querySelector("g[class*='boardFace']");
    expect(face).not.toBeNull();
    expect(face?.querySelector("rect[class*='boardPaper']")).not.toBeNull();
    expect(face?.getAttribute("aria-hidden")).toBe("true");
    const edges = svg.querySelector('[data-layer="edges"]') as Element;
    expect(
      face !== null &&
        (face.compareDocumentPosition(edges) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
    ).toBe(true);
  });

  it("keeps defs ids unique when several maps share a document", () => {
    const { container } = render(
      <>
        <MapGraph map={map} />
        <MapGraph map={map} />
      </>,
    );
    const ids = [...container.querySelectorAll("filter[id], radialGradient[id]")].map(
      (el) => el.id,
    );
    expect(ids.length).toBeGreaterThanOrEqual(4);
    expect(new Set(ids).size).toBe(ids.length);
    // Every url(#…) reference resolves to a def inside the same document.
    const idSet = new Set(ids);
    for (const ref of container.querySelectorAll("[filter^='url('], [fill^='url(']")) {
      const target = (ref.getAttribute("filter") ?? ref.getAttribute("fill") ?? "").match(
        /url\(#([^)]+)\)/,
      )?.[1];
      expect(target !== undefined && idSet.has(target)).toBe(true);
    }
  });

  it("keeps the data-layer order intact", () => {
    const illustrated = {
      ...map,
      board: {
        features: [{ kind: "shape" as const, style: "water" as const, d: "M 0 0 L 10 10 Z" }],
      },
    };
    const { container } = render(<MapGraph map={illustrated} />);
    const svg = container.querySelector('[data-testid="map-graph"]') as SVGSVGElement;
    const layers = [...svg.querySelectorAll(":scope > g[data-layer]")].map((g) =>
      g.getAttribute("data-layer"),
    );
    expect(layers).toEqual(["board", "edges", "landmarks", "nodes", "markers"]);
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

describe("MapGraph — board pieces", () => {
  // The markers are standing meeple figures (boardPieces.tsx): volume
  // gradient body, drop shadow, pedestal — anchored inside the same
  // moving wrapper that carries data-* and the markerMove transition.
  it("renders detective markers as standing figures with volume, shadow and a base", () => {
    const { container } = render(<MapGraph map={map} detectivePositions={["a", "i"]} />);
    const markers = container.querySelectorAll("[data-detective]");
    expect(markers).toHaveLength(2);
    markers.forEach((marker, i) => {
      const piece = marker.querySelector("[data-piece='detective']") as Element;
      expect(piece).not.toBeNull();
      expect(piece.getAttribute("aria-hidden")).toBe("true");
      expect(piece.querySelector("[class*='pieceShadow']")).not.toBeNull();
      expect(piece.querySelector("[class*='pieceBase']")).not.toBeNull();
      expect(piece.querySelector("[class*='pieceBody']")).not.toBeNull();
      expect(piece.querySelector("[class*='pieceHead']")).not.toBeNull();
      expect(piece.querySelector("[class*='pieceIndex']")?.textContent).toBe(String(i + 1));
    });
    // The flat rect chip is gone.
    expect(container.querySelectorAll("[class*='detectiveShape']")).toHaveLength(0);
  });

  it("renders the ganove as its own silhouette — coat and hat, not a diamond", () => {
    const { container } = render(<MapGraph map={map} ganovePosition="g" />);
    const piece = container.querySelector("[data-ganove] [data-piece='ganove']") as Element;
    expect(piece).not.toBeNull();
    expect(piece.querySelector("[class*='pieceHat']")).not.toBeNull();
    expect(piece.querySelector("[class*='pieceBody']")).not.toBeNull();
    // Distinct by label too: no head circle, no index numeral.
    expect(piece.querySelector("[class*='pieceHead']")).toBeNull();
    expect(piece.querySelector("[class*='pieceIndex']")).toBeNull();
    // The flat diamond is gone.
    expect(container.querySelectorAll("[class*='ganoveShape']")).toHaveLength(0);
  });

  it("marks the active detective with a pennant, not colour alone", () => {
    const { container } = render(
      <MapGraph map={map} detectivePositions={["a", "i"]} activeDetectiveIndex={1} />,
    );
    const active = container.querySelector('[data-detective="1"]') as Element;
    expect(active).toHaveAttribute("data-active-detective", "true");
    expect(active.querySelector("[class*='pieceActiveMark']")).not.toBeNull();
    expect(active.querySelector("[class*='pieceFlag']")).not.toBeNull();
    expect(active.querySelector("[class*='pieceActiveBase']")).not.toBeNull();
    const idle = container.querySelector('[data-detective="0"]') as Element;
    expect(idle.querySelector("[class*='pieceActiveMark']")).toBeNull();
    expect(idle.querySelector("[class*='pieceActiveBase']")).toBeNull();
  });

  it("fills every piece body with a defs gradient that resolves", () => {
    const { container } = render(
      <MapGraph map={map} detectivePositions={["a"]} ganovePosition="g" />,
    );
    const bodies = container.querySelectorAll("[class*='pieceBody']");
    expect(bodies.length).toBeGreaterThanOrEqual(2);
    for (const body of bodies) {
      const ref = (body.getAttribute("fill") ?? "").match(/url\(#([^)]+)\)/)?.[1];
      expect(ref).toBeDefined();
      expect(container.querySelector(`radialGradient[id='${ref}']`)).not.toBeNull();
    }
  });

  it("keeps piece gradient ids unique across pieces and maps", () => {
    const { container } = render(
      <>
        <MapGraph map={map} detectivePositions={["a", "i"]} ganovePosition="g" />
        <MapGraph map={map} detectivePositions={["b"]} ganovePosition="h" />
      </>,
    );
    const ids = [...container.querySelectorAll("radialGradient[id]")].map((el) => el.id);
    expect(ids.length).toBeGreaterThanOrEqual(6);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps the glide transition on the marker wrapper", () => {
    const { container } = render(
      <MapGraph map={map} detectivePositions={["a"]} ganovePosition="g" />,
    );
    const markers = container.querySelectorAll("[data-detective], [data-ganove]");
    expect(markers).toHaveLength(2);
    for (const marker of markers) {
      expect(marker.getAttribute("class")).toContain("markerMove");
      expect((marker as HTMLElement).style.transform).toContain("translate(");
    }
  });
});

describe("Map legend swatches", () => {
  // Same shape = same meaning: both legends render the place token as a
  // miniature plaque (dashed ring + perforated rim + inner line) so the
  // swatch matches what `nodeLegal`/`nodeSelectable` tokens look like.
  const plaqueSwatch = (container: HTMLElement) => {
    const legend = container.querySelector('[data-testid="map-legend"]') as HTMLElement;
    const rings = legend.querySelectorAll("[class*='legendTargetRing']");
    const dots = legend.querySelectorAll("[class*='legendTargetDot']");
    const inners = legend.querySelectorAll("[class*='legendTargetInner']");
    return { rings, dots, inners };
  };

  it("the ganove legend shows the plaque token swatch", () => {
    const { container } = render(<MapLegend />);
    const { rings, dots, inners } = plaqueSwatch(container);
    expect(rings).toHaveLength(1);
    expect(dots).toHaveLength(1);
    expect(inners).toHaveLength(1);
  });

  it("the ganove legend shows both piece miniatures", () => {
    const { container } = render(<MapLegend />);
    const legend = container.querySelector('[data-testid="map-legend"]') as HTMLElement;
    // Same glyph = same meaning: the swatches are the very pieces
    // rendered on the board, scaled down.
    expect(legend.querySelectorAll("[data-piece='detective']")).toHaveLength(1);
    expect(legend.querySelectorAll("[data-piece='ganove']")).toHaveLength(1);
    // Hat parts (crown, brim, band) — `pieceHat`/`pieceHatBand`.
    expect(legend.querySelectorAll("[class*='pieceHat']").length).toBeGreaterThanOrEqual(2);
  });

  it("the detective legend shows only the detective miniature", () => {
    const { container } = render(<DetectiveMapLegend map={map} />);
    const legend = container.querySelector('[data-testid="map-legend"]') as HTMLElement;
    expect(legend.querySelectorAll("[data-piece='detective']")).toHaveLength(1);
    // Asymmetry holds in the legend too — no ganove glyph here.
    expect(legend.querySelectorAll("[data-piece='ganove']")).toHaveLength(0);
  });

  it("the detective legend shows the identical plaque token swatch", () => {
    const { container } = render(<DetectiveMapLegend map={map} />);
    const { rings, dots, inners } = plaqueSwatch(container);
    expect(rings).toHaveLength(1);
    expect(dots).toHaveLength(1);
    expect(inners).toHaveLength(1);
  });

  // Same shape = same meaning: the route swatches are miniatures of the
  // board's cased-line anatomy — a dark casing line behind the bright
  // core, identical in both legends.
  const routeSwatches = (container: HTMLElement) => {
    const legend = container.querySelector('[data-testid="map-legend"]') as HTMLElement;
    const pairs: [string, string][] = [
      ["legendWegCasing", "legendWeg"],
      ["legendFahrtCasing", "legendFahrt"],
    ];
    return pairs.map(([casingClass, coreClass]) => ({
      casing: legend.querySelector(`line[class*='${casingClass}']`),
      core: legend.querySelector(`line[class*='${coreClass}']:not([class*='Casing'])`),
    }));
  };

  it("the ganove legend mirrors the cased route anatomy", () => {
    const { container } = render(<MapLegend />);
    for (const { casing, core } of routeSwatches(container)) {
      expect(casing).not.toBeNull();
      expect(core).not.toBeNull();
      expect(casing?.parentElement).toBe(core?.parentElement);
      expect(
        (casing!.compareDocumentPosition(core!) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
      ).toBe(true);
    }
  });

  it("the detective legend mirrors the cased route anatomy", () => {
    const { container } = render(<DetectiveMapLegend map={map} />);
    for (const { casing, core } of routeSwatches(container)) {
      expect(casing).not.toBeNull();
      expect(core).not.toBeNull();
      expect(casing?.parentElement).toBe(core?.parentElement);
      expect(
        (casing!.compareDocumentPosition(core!) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
      ).toBe(true);
    }
  });
});
