/**
 * Shared SVG map component (spec `02-technisches-konzept.md` section 4):
 * renders the map pack's `viewBox`, nodes as labelled points, both edge
 * types (`weg` solid, `fahrt` as a doubled/dashed line), blocked edges
 * greyed out and marked by a barrier glyph (shape-coded, not just
 * colour). Detective markers and — only when the caller passes
 * `ganovePosition` — the ganove marker are drawn on top.
 *
 * Perspective asymmetry is structural: there are no props for cameras
 * or hint/event data, so a ganove-side usage cannot leak them. Node
 * interactivity (legal move targets or spawn choices) is expressed via
 * `legalTargets`/`selectableNodeIds` and fired through `onNodeSelect`;
 * selectable nodes are keyboard-operable (`role="button"`, Tab/Enter)
 * and additionally roamable with the arrow keys — the focus wanders to
 * the geometrically nearest interactive node in the pressed direction
 * (spec `02-technisches-konzept.md` section 11: full keyboard play).
 */
import type { KeyboardEvent } from "react";
import type { Camera } from "../logic/InformationSystem";
import type { MissionKind } from "../logic/MissionSystem";
import { isEdgeBlocked, type BlockedEdge, type MoveTarget } from "../logic/Movement";
import type { MapNode, MapPack } from "../logic/mapPack";
import { t } from "../i18n";
import styles from "./MapGraph.module.css";

export interface MapGraphProps {
  map: MapPack;
  /** Current round — needed to evaluate `untilRound` of blocked edges. */
  round?: number;
  blockedEdges?: readonly BlockedEdge[];
  detectivePositions?: readonly string[];
  /** Ganove marker — only pass it in the ganove perspective. */
  ganovePosition?: string | null;
  /** Legal move targets of the ganove phase (clickable, highlighted). */
  legalTargets?: readonly MoveTarget[];
  /** Additional selectable nodes (e.g. legal spawn choices). */
  selectableNodeIds?: readonly string[];
  /** Known mission target nodes per role (ganove-side only). */
  missionTargets?: Partial<Record<MissionKind, string | null>>;
  /** The currently active mission target node id. */
  currentTargetId?: string | null;
  /** Escape point node ids (flag marker). */
  escapeNodeIds?: readonly string[];
  /** Squad cameras — only pass them in the detective perspective. */
  cameras?: readonly Camera[];
  /** Render node-category badges on every node (detective perspective). */
  showCategories?: boolean;
  /** Render a zone halo behind every node (detective perspective). */
  showZones?: boolean;
  /** Highlights the marker of the currently moving detective. */
  activeDetectiveIndex?: number | null;
  /** Player-set marker pins (detective deduction tool). */
  markedNodeIds?: readonly string[];
  /** Nodes selectable in marker mode — toggles a marker pin on click. */
  markableNodeIds?: readonly string[];
  /** "Possible positions" deduction overlay ring (detective perspective). */
  possibleNodeIds?: readonly string[];
  onNodeSelect?: (nodeId: string) => void;
}

const NODE_RADIUS = 8;
const MISSION_KINDS: readonly MissionKind[] = ["diebstahl", "kontakt", "sabotage", "flucht"];

/** Arrow-key directions in SVG coordinates (y grows downward). */
const ARROW_DIRS: Record<string, readonly [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

function nodeById(map: MapPack, id: string): MapNode | undefined {
  return map.nodes.find((node) => node.id === id);
}

/**
 * Geometric arrow-key navigation between interactive nodes: the best
 * candidate has a positive projection on the pressed direction; ties
 * prefer alignment over distance (perpendicular offset weighs 4×).
 * Returns `null` when nothing lies in that direction.
 */
function nextInteractiveNode(
  map: MapPack,
  fromId: string,
  key: string,
  interactiveIds: ReadonlySet<string>,
): string | null {
  const dir = ARROW_DIRS[key];
  const from = nodeById(map, fromId);
  if (dir === undefined || from === undefined) {
    return null;
  }
  let best: string | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const candidate of map.nodes) {
    if (candidate.id === fromId || !interactiveIds.has(candidate.id)) {
      continue;
    }
    const dx = candidate.x - from.x;
    const dy = candidate.y - from.y;
    const projection = dx * dir[0] + dy * dir[1];
    if (projection <= 0) {
      continue;
    }
    const perpendicular = Math.abs(dx * dir[1] - dy * dir[0]);
    const score = projection + 4 * perpendicular;
    if (score < bestScore) {
      bestScore = score;
      best = candidate.id;
    }
  }
  return best;
}

/** Shape-coded mission-target badge offsets around the node. */
function missionBadgePath(kind: MissionKind, x: number, y: number): string {
  switch (kind) {
    case "diebstahl":
      // diamond
      return `M ${x} ${y - 4} L ${x + 4} ${y} L ${x} ${y + 4} L ${x - 4} ${y} Z`;
    case "kontakt":
      // square
      return `M ${x - 3.5} ${y - 3.5} H ${x + 3.5} V ${y + 3.5} H ${x - 3.5} Z`;
    case "sabotage":
      // triangle
      return `M ${x} ${y - 4.5} L ${x + 4} ${y + 3} L ${x - 4} ${y + 3} Z`;
    case "flucht":
      // flag: pole + banner
      return `M ${x} ${y + 4} V ${y - 5} H ${x + 5} L ${x + 3} ${y - 3} L ${x + 5} ${y - 1} H ${x} Z`;
  }
}

export function MapGraph({
  map,
  round = 1,
  blockedEdges = [],
  detectivePositions = [],
  ganovePosition = null,
  legalTargets = [],
  selectableNodeIds = [],
  missionTargets = {},
  currentTargetId = null,
  escapeNodeIds = [],
  cameras = [],
  showCategories = false,
  showZones = false,
  activeDetectiveIndex = null,
  markedNodeIds = [],
  markableNodeIds = [],
  possibleNodeIds = [],
  onNodeSelect,
}: MapGraphProps) {
  const legalTargetIds = new Set(legalTargets.map((target) => target.nodeId));
  const selectableIds = new Set(selectableNodeIds);
  const escapeIds = new Set(escapeNodeIds);
  const cameraByNode = new Map(cameras.map((camera) => [camera.nodeId, camera.active]));
  const markedIds = new Set(markedNodeIds);
  const markableIds = new Set(markableNodeIds);
  const possibleIds = new Set(possibleNodeIds);
  // Zone halos get a deterministic hue per zone — colour is only the
  // secondary cue; the legend names every zone explicitly.
  const zones = [...new Set(map.nodes.map((node) => node.zone))].sort();
  const zoneHue = (zone: string): number => (zones.indexOf(zone) * 137) % 360;
  const missionKinds = new Map<string, MissionKind[]>();
  for (const kind of MISSION_KINDS) {
    const targetId = missionTargets[kind];
    if (targetId != null) {
      missionKinds.set(targetId, [...(missionKinds.get(targetId) ?? []), kind]);
    }
  }

  const selectNode = (nodeId: string) => {
    if (legalTargetIds.has(nodeId) || selectableIds.has(nodeId) || markableIds.has(nodeId)) {
      onNodeSelect?.(nodeId);
    }
  };

  const interactiveIds = new Set<string>([...legalTargetIds, ...selectableIds, ...markableIds]);
  // Focus registry for the arrow-key roaming — filled by ref callbacks
  // on the interactive node groups below.
  const nodeRefs = new Map<string, SVGGElement>();

  const onNodeKeyDown = (event: KeyboardEvent, nodeId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectNode(nodeId);
      return;
    }
    if (event.key in ARROW_DIRS) {
      event.preventDefault();
      const next = nextInteractiveNode(map, nodeId, event.key, interactiveIds);
      if (next !== null) {
        nodeRefs.get(next)?.focus();
      }
    }
  };

  const ganoveNode = ganovePosition !== null ? nodeById(map, ganovePosition) : undefined;

  return (
    <svg
      className={styles.map}
      viewBox={map.viewBox}
      role="img"
      aria-label={t("map.ariaLabel", { name: map.name })}
      data-testid="map-graph"
    >
      <g data-layer="edges">
        {map.edges.map((edge) => {
          const a = nodeById(map, edge.a);
          const b = nodeById(map, edge.b);
          if (!a || !b) {
            return null;
          }
          const blocked = isEdgeBlocked(edge.a, edge.b, blockedEdges, round);
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          return (
            <g key={`${edge.a}-${edge.b}`} data-edge={`${edge.a}-${edge.b}`}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={`${styles.edge} ${edge.type === "fahrt" ? styles.edgeFahrt : styles.edgeWeg} ${blocked ? styles.edgeBlocked : ""}`}
                data-edge-type={edge.type}
                data-blocked={blocked ? "true" : undefined}
              />
              {blocked ? (
                <g
                  className={styles.blockGlyph}
                  data-block-glyph={`${edge.a}-${edge.b}`}
                  aria-hidden="true"
                >
                  <line x1={midX - 4} y1={midY - 4} x2={midX + 4} y2={midY + 4} />
                  <line x1={midX - 4} y1={midY + 4} x2={midX + 4} y2={midY - 4} />
                </g>
              ) : null}
            </g>
          );
        })}
      </g>
      <g data-layer="nodes">
        {map.nodes.map((node) => {
          const interactive =
            legalTargetIds.has(node.id) || selectableIds.has(node.id) || markableIds.has(node.id);
          const ariaLabel = legalTargetIds.has(node.id)
            ? t("node.moveTo", { name: node.name })
            : selectableIds.has(node.id)
              ? t("node.spawnHere", { name: node.name })
              : markableIds.has(node.id)
                ? t("node.mark", { name: node.name })
                : node.name;
          const kinds = missionKinds.get(node.id) ?? [];
          const cameraActive = cameraByNode.get(node.id);
          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              className={`${styles.node} ${interactive ? styles.nodeInteractive : ""} ${
                legalTargetIds.has(node.id) ? styles.nodeLegal : ""
              } ${selectableIds.has(node.id) ? styles.nodeSelectable : ""} ${
                markableIds.has(node.id) ? styles.nodeSelectable : ""
              } ${node.id === currentTargetId ? styles.nodeCurrentTarget : ""} ${
                node.id === ganovePosition ? styles.nodeGanoveHere : ""
              }`}
              data-node-id={node.id}
              data-legal-target={legalTargetIds.has(node.id) ? "true" : undefined}
              data-selectable={selectableIds.has(node.id) ? "true" : undefined}
              data-markable={markableIds.has(node.id) ? "true" : undefined}
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? ariaLabel : undefined}
              ref={
                interactive
                  ? (element) => {
                      if (element !== null) {
                        nodeRefs.set(node.id, element);
                      } else {
                        nodeRefs.delete(node.id);
                      }
                    }
                  : undefined
              }
              onClick={interactive ? () => selectNode(node.id) : undefined}
              onKeyDown={interactive ? (event) => onNodeKeyDown(event, node.id) : undefined}
            >
              {interactive ? (
                // Generous invisible hit area — r=8 dots are small targets.
                <circle r={NODE_RADIUS + 6} className={styles.hitArea} />
              ) : null}
              {showZones ? (
                <circle
                  r={NODE_RADIUS + 5}
                  className={styles.zoneHalo}
                  style={{ fill: `hsl(${zoneHue(node.zone)} 55% 60%)` }}
                  data-zone={node.zone}
                  aria-hidden="true"
                />
              ) : null}
              <circle r={NODE_RADIUS} className={styles.nodeDot} />
              {legalTargetIds.has(node.id) ? (
                <circle r={NODE_RADIUS + 4} className={styles.legalRing} aria-hidden="true" />
              ) : null}
              {possibleIds.has(node.id) ? (
                // Deduction overlay: diamond ring — a shape distinct from
                // the dashed legal-target circle.
                <path
                  d={`M 0 ${-(NODE_RADIUS + 7)} L ${NODE_RADIUS + 7} 0 L 0 ${NODE_RADIUS + 7} L ${-(NODE_RADIUS + 7)} 0 Z`}
                  className={styles.possibleRing}
                  data-possible="true"
                  aria-hidden="true"
                />
              ) : null}
              {showCategories
                ? node.categories.map((category, index) => (
                    <path
                      key={category}
                      d={missionBadgePath(category, 13 + index * 10, 5)}
                      className={`${styles.categoryBadge} ${styles[`mission_${category}`]}`}
                      data-category={category}
                    >
                      <title>{t(`category.${category}`)}</title>
                    </path>
                  ))
                : null}
              {cameraActive !== undefined ? (
                <g
                  className={styles.cameraGlyph}
                  transform="translate(-14, -15)"
                  data-camera="true"
                  data-camera-active={cameraActive ? "true" : "false"}
                >
                  <title>{t("camera.ariaLabel", { name: node.name })}</title>
                  <rect x={0} y={0} width={9} height={7} rx={1.5} className={styles.cameraBody} />
                  <path d="M 9 2.5 L 13 0.5 V 6.5 L 9 4.5 Z" className={styles.cameraLens} />
                  {cameraActive ? null : (
                    <line x1={-1} y1={8} x2={14} y2={-1} className={styles.cameraStrike} />
                  )}
                </g>
              ) : null}
              {markedIds.has(node.id) ? (
                <g
                  className={styles.markerPin}
                  transform="translate(12, -16)"
                  data-marker="true"
                  aria-hidden="true"
                >
                  <path d="M 0 -2 A 4.5 4.5 0 1 1 -0.01 -2 Z M 0 3 L -2.8 -1 L 2.8 -1 Z" />
                </g>
              ) : null}
              {escapeIds.has(node.id) ? (
                <path
                  d={missionBadgePath("flucht", 10, -10)}
                  className={styles.escapeMarker}
                  aria-label={t("marker.escape")}
                  data-escape-node="true"
                />
              ) : null}
              {kinds.map((kind, i) => (
                <path
                  key={kind}
                  d={missionBadgePath(kind, -10 - i * 9, -10)}
                  className={`${styles.missionBadge} ${styles[`mission_${kind}`]}`}
                  data-mission-target={kind}
                />
              ))}
              <text className={styles.nodeLabel} y={NODE_RADIUS + 10} textAnchor="middle">
                {node.name}
              </text>
            </g>
          );
        })}
      </g>
      <g data-layer="markers">
        {detectivePositions.map((position, index) => {
          const node = nodeById(map, position);
          if (!node) {
            return null;
          }
          return (
            <g
              key={`detective-${index}`}
              transform={`translate(${node.x}, ${node.y - NODE_RADIUS - 8})`}
              className={`${styles.detectiveMarker} ${
                index === activeDetectiveIndex ? styles.detectiveActive : ""
              }`}
              data-detective={index}
              data-active-detective={index === activeDetectiveIndex ? "true" : undefined}
              aria-label={t("marker.detective", { index: index + 1 })}
            >
              <rect x={-6} y={-6} width={12} height={12} rx={2} className={styles.detectiveShape} />
              <text className={styles.markerText} y={3.5} textAnchor="middle">
                {index + 1}
              </text>
            </g>
          );
        })}
        {ganoveNode !== undefined ? (
          <g
            transform={`translate(${ganoveNode.x}, ${ganoveNode.y - NODE_RADIUS - 8})`}
            className={styles.ganoveMarker}
            data-ganove="true"
            aria-label={t("marker.ganove")}
          >
            <path d="M 0 -7 L 6 0 L 0 7 L -6 0 Z" className={styles.ganoveShape} />
            <title>{t("marker.ganove")}</title>
          </g>
        ) : null}
      </g>
    </svg>
  );
}
