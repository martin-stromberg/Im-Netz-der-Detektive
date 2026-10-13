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
 * selectable nodes are keyboard-operable (`role="button"`, Tab/Enter).
 */
import type { KeyboardEvent } from "react";
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
  onNodeSelect?: (nodeId: string) => void;
}

const NODE_RADIUS = 8;
const MISSION_KINDS: readonly MissionKind[] = ["diebstahl", "kontakt", "sabotage", "flucht"];

function nodeById(map: MapPack, id: string): MapNode | undefined {
  return map.nodes.find((node) => node.id === id);
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
  onNodeSelect,
}: MapGraphProps) {
  const legalTargetIds = new Set(legalTargets.map((target) => target.nodeId));
  const selectableIds = new Set(selectableNodeIds);
  const escapeIds = new Set(escapeNodeIds);
  const missionKinds = new Map<string, MissionKind[]>();
  for (const kind of MISSION_KINDS) {
    const targetId = missionTargets[kind];
    if (targetId != null) {
      missionKinds.set(targetId, [...(missionKinds.get(targetId) ?? []), kind]);
    }
  }

  const selectNode = (nodeId: string) => {
    if (legalTargetIds.has(nodeId) || selectableIds.has(nodeId)) {
      onNodeSelect?.(nodeId);
    }
  };

  const onNodeKeyDown = (event: KeyboardEvent, nodeId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectNode(nodeId);
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
          const interactive = legalTargetIds.has(node.id) || selectableIds.has(node.id);
          const ariaLabel = legalTargetIds.has(node.id)
            ? t("node.moveTo", { name: node.name })
            : selectableIds.has(node.id)
              ? t("node.spawnHere", { name: node.name })
              : node.name;
          const kinds = missionKinds.get(node.id) ?? [];
          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              className={`${styles.node} ${interactive ? styles.nodeInteractive : ""} ${
                legalTargetIds.has(node.id) ? styles.nodeLegal : ""
              } ${selectableIds.has(node.id) ? styles.nodeSelectable : ""} ${
                node.id === currentTargetId ? styles.nodeCurrentTarget : ""
              } ${node.id === ganovePosition ? styles.nodeGanoveHere : ""}`}
              data-node-id={node.id}
              data-legal-target={legalTargetIds.has(node.id) ? "true" : undefined}
              data-selectable={selectableIds.has(node.id) ? "true" : undefined}
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? ariaLabel : undefined}
              onClick={interactive ? () => selectNode(node.id) : undefined}
              onKeyDown={interactive ? (event) => onNodeKeyDown(event, node.id) : undefined}
            >
              {interactive ? (
                // Generous invisible hit area — r=8 dots are small targets.
                <circle r={NODE_RADIUS + 6} className={styles.hitArea} />
              ) : null}
              <circle r={NODE_RADIUS} className={styles.nodeDot} />
              {legalTargetIds.has(node.id) ? (
                <circle r={NODE_RADIUS + 4} className={styles.legalRing} aria-hidden="true" />
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
              className={styles.detectiveMarker}
              data-detective={index}
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
