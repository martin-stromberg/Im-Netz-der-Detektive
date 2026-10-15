/**
 * Board-piece glyphs — standing meeple figures rendered on top of the
 * place tokens. Same convention as `landmarks.tsx`: every figure is
 * authored in a local glyph box with its foot at the local origin, so
 * `translate(node.x, node.y - 16)` plants the piece on its plaque.
 * Tangible game pieces need volume, a shadow and a stand: a per-piece
 * `radialGradient` shades the body (ids via `useId`, unique across
 * pieces and double-mounted maps), a soft ellipse throws the drop
 * shadow and a darker pedestal grounds the figure.
 *
 * Detective and ganove differ by silhouette + colour + label — never
 * by colour alone: the detective is an upright meeple wearing his
 * squad index, the ganove a trench coat and fedora without a numeral.
 * The active detective plants an amber pennant on his pedestal.
 *
 * Pure decoration — `aria-hidden`, never interactive; the outer
 * marker `<g>` in `MapGraph` carries `data-*`, `aria-label` and the
 * `markerMove` glide transition.
 */
import { useId } from "react";
import styles from "./boardPieces.module.css";

function BodyGradient({ id, stops }: { id: string; stops: readonly [string, string, string] }) {
  // Light upper-left → saturated mid → dark rim, like the plaque face.
  return (
    <radialGradient id={id} cx="42%" cy="32%" r="80%">
      <stop offset="0%" style={{ stopColor: stops[0], stopOpacity: 1 }} />
      <stop offset="60%" style={{ stopColor: stops[1], stopOpacity: 1 }} />
      <stop offset="100%" style={{ stopColor: stops[2], stopOpacity: 1 }} />
    </radialGradient>
  );
}

/**
 * Upright meeple silhouette — squad blue, index numeral on the chest.
 * `index` is omitted only in the legend miniature. `active` adds the
 * amber pennant + pedestal ring (a shape cue, not just a colour swap).
 */
export function DetectivePiece({ index, active = false }: { index?: number; active?: boolean }) {
  const id = `piece-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <g data-piece="detective" aria-hidden="true" focusable="false">
      <defs>
        <BodyGradient
          id={`${id}-body`}
          stops={[
            "var(--color-detective-active)",
            "var(--color-detective)",
            "var(--color-map-detective-stroke)",
          ]}
        />
      </defs>
      <ellipse cx="1.2" cy="4.4" rx="8.6" ry="2.7" className={styles.pieceShadow} />
      <ellipse
        cy="1.2"
        rx="6.8"
        ry="2.4"
        className={`${styles.pieceBase} ${styles.pieceBaseDetective} ${
          active ? styles.pieceActiveBase : ""
        }`}
      />
      {/* Standing torso: tapered body flaring into shoulders. */}
      <path
        d="M -5.4 0 L -5.4 -4 C -5.4 -9 -6.6 -10 -6.6 -13 C -6.6 -14.8 -5.2 -16 -3.4 -16 L 3.4 -16 C 5.2 -16 6.6 -14.8 6.6 -13 C 6.6 -10 5.4 -9 5.4 -4 L 5.4 0 Z"
        fill={`url(#${id}-body)`}
        className={styles.pieceBody}
      />
      <circle cy="-19.8" r="4.2" fill={`url(#${id}-body)`} className={styles.pieceHead} />
      {/* Collar V — a hint of shirt and tie at the neckline. */}
      <path d="M -1.9 -15.6 L 0 -13.2 L 1.9 -15.6" className={styles.pieceDetail} />
      {index !== undefined ? (
        <text className={styles.pieceIndex} y="-5" textAnchor="middle">
          {index}
        </text>
      ) : null}
      {active ? (
        <g className={styles.pieceActiveMark}>
          <line x1="6.8" y1="0.6" x2="6.8" y2="-16.5" className={styles.pieceFlagPole} />
          <path d="M 6.8 -16.5 L 13 -14.2 L 6.8 -11.9 Z" className={styles.pieceFlag} />
        </g>
      ) : null}
    </g>
  );
}

/**
 * Incognito silhouette — a flared trench coat plus fedora (brim, crown,
 * band); the face stays in shadow. No numeral: distinct from the
 * detective by shape and label, not only by its amber-dark colour.
 */
export function GanovePiece() {
  const id = `piece-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <g data-piece="ganove" aria-hidden="true" focusable="false">
      <defs>
        <BodyGradient id={`${id}-body`} stops={["#c08d2e", "var(--color-map-ganove)", "#503709"]} />
      </defs>
      <ellipse cx="1.2" cy="4.4" rx="8.4" ry="2.6" className={styles.pieceShadow} />
      <ellipse
        cy="1.2"
        rx="7"
        ry="2.4"
        className={`${styles.pieceBase} ${styles.pieceBaseGanove}`}
      />
      {/* Trench coat: shoulders tapering into a flared A-line. */}
      <path
        d="M -6.6 0 L -5.6 -1.4 L -4.8 -10.5 L -4.4 -14.8 C -4.2 -15.4 -3.4 -15.6 -2.6 -15.7 L 2.6 -15.7 C 3.4 -15.6 4.2 -15.4 4.4 -14.8 L 4.8 -10.5 L 5.6 -1.4 L 6.6 0 Z"
        fill={`url(#${id}-body)`}
        className={styles.pieceBody}
      />
      {/* Coat lapels. */}
      <path d="M -2.6 -15.2 L 0 -11.8 L 2.6 -15.2" className={styles.pieceDetail} />
      {/* Face kept in shadow under the brim. */}
      <ellipse cy="-16.6" rx="3.2" ry="1.6" className={styles.pieceFace} />
      {/* Fedora: crown first, then the amber band, the brim on top. */}
      <path
        d="M -3.6 -18.2 L -2.9 -23.6 C -2.7 -24.8 -1.5 -25.4 -0.2 -25.4 C 1.3 -25.4 2.6 -24.8 2.8 -23.6 L 3.5 -18.2 Z"
        className={styles.pieceHat}
      />
      <path d="M -3.5 -19.9 L 3.4 -19.9" className={styles.pieceHatBand} />
      <ellipse cy="-18" rx="6.7" ry="1.7" className={styles.pieceHat} />
    </g>
  );
}
