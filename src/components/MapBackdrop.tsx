/**
 * Comic board backdrop — renders the map pack's `board.features` as
 * decorative city geography under the graph: water surfaces, parks,
 * rail strips, street hints and building silhouettes. Purely visual:
 * `aria-hidden`, `pointer-events: none`, no game information.
 */
import type { MapBoard } from "../logic/mapPack";
import styles from "./MapBackdrop.module.css";

export interface MapBackdropProps {
  board?: MapBoard;
}

export function MapBackdrop({ board }: MapBackdropProps) {
  if (board === undefined || board.features.length === 0) {
    return null;
  }
  return (
    <g data-layer="board" aria-hidden="true" pointerEvents="none">
      {board.features.map((feature, index) => (
        <path
          key={index}
          d={feature.d}
          fillRule="evenodd"
          className={styles[`feature_${feature.style}`]}
          data-board-style={feature.style}
        />
      ))}
    </g>
  );
}
