/**
 * Comic landmark glyphs — hand-drawn SVG miniatures rendered behind
 * the node dots on illustrated maps (`node.landmark` in the map pack,
 * validated against `KNOWN_LANDMARKS` in mapPack). Style: flat warm
 * fills + thick dark outlines, readable at ~30 px against the dark
 * board. Pure decoration — `aria-hidden`, never interactive.
 *
 * Every glyph is authored in a 36×32 box with its foot at the local
 * origin, so `translate(node.x, node.y - 2)` plants the building on
 * its node point.
 */
import type { JSX } from "react";
import type { LandmarkId } from "../logic/mapPack";

const S = { stroke: "#10141c", strokeWidth: 1.5, strokeLinejoin: "round" } as const;
const WIN = { fill: "#f5d76e", stroke: "none" } as const;

/** Reusable wall/roof palette, muted to the night-board theme. */
const P = {
  stone: "#c9a86a", // sandstone (Dom, Lamberti)
  brick: "#b0703c", // brick gothic (rathaus, speicher, holstentor)
  plaster: "#d8c9a0", // pale plaster (schloss)
  roof: "#8c4a3c", // warm red roofs
  slate: "#5a6b7d", // slate roofs/spires
  wood: "#8a6a45", // timber (muehle)
  stoneGrey: "#9aa4b0", // grey stone (buddenturm, tor)
  crane: "#e8a05a", // harbor crane amber
  leaf: "#4f7a4f", // park trees
} as const;

function Dom() {
  // St.-Paulus-Dom: twin west towers + nave gable between them.
  return (
    <g>
      <rect x="-15" y="-30" width="11" height="30" fill={P.stone} {...S} />
      <rect x="4" y="-30" width="11" height="30" fill={P.stone} {...S} />
      <rect x="-15" y="-30" width="11" height="5" fill={P.slate} {...S} />
      <rect x="4" y="-30" width="11" height="5" fill={P.slate} {...S} />
      <path d="M -4 0 L -4 -22 L 0 -27 L 4 -22 L 4 0 Z" fill={P.stone} {...S} />
      <rect x="-12.5" y="-24" width="4" height="6" {...WIN} />
      <rect x="8.5" y="-24" width="4" height="6" {...WIN} />
      <rect x="-2" y="-14" width="4" height="8" {...WIN} />
    </g>
  );
}

function Kirche() {
  // Hall church with tall spire (Lamberti, Überwasser, Petri, Marien…).
  return (
    <g>
      <rect x="-11" y="-16" width="22" height="16" fill={P.stone} {...S} />
      <rect x="-5" y="-30" width="10" height="14" fill={P.stone} {...S} />
      <path d="M -5 -30 L 0 -37 L 5 -30 Z" fill={P.slate} {...S} />
      <path d="M -11 -16 L 11 -16 L 7 -21 L -7 -21 Z" fill={P.roof} {...S} />
      <rect x="-2" y="-27" width="4" height="6" {...WIN} />
      <rect x="-7" y="-11" width="3" height="5" {...WIN} />
      <rect x="4" y="-11" width="3" height="5" {...WIN} />
    </g>
  );
}

function Rathaus() {
  // Stepped gable front (Münster + Lübeck Rathaus silhouette).
  return (
    <g>
      <rect x="-14" y="-18" width="28" height="18" fill={P.brick} {...S} />
      <path
        d="M -14 -18 L -14 -30 L -8 -30 L -8 -26 L -4 -26 L -4 -32 L 0 -32 L 0 -26 L 4 -26 L 4 -30 L 14 -30 L 14 -18 Z"
        fill={P.brick}
        {...S}
      />
      <rect x="-10" y="-12" width="4" height="5" {...WIN} />
      <rect x="-2" y="-12" width="4" height="5" {...WIN} />
      <rect x="6" y="-12" width="4" height="5" {...WIN} />
      <rect x="-2" y="-6" width="4" height="6" fill="#10141c" stroke="none" />
    </g>
  );
}

function Schloss() {
  // Fürstbischöfliches Schloss: long facade, mansard roof, pediment.
  return (
    <g>
      <rect x="-17" y="-14" width="34" height="14" fill={P.plaster} {...S} />
      <path d="M -17 -14 L -14 -20 L 14 -20 L 17 -14 Z" fill={P.roof} {...S} />
      <path d="M -6 -14 L -6 -26 L 0 -30 L 6 -26 L 6 -14 Z" fill={P.plaster} {...S} />
      <path d="M -6 -26 L 0 -30 L 6 -26 Z" fill={P.roof} {...S} />
      <rect x="-13" y="-10" width="3" height="4" {...WIN} />
      <rect x="-8" y="-10" width="3" height="4" {...WIN} />
      <rect x="5" y="-10" width="3" height="4" {...WIN} />
      <rect x="10" y="-10" width="3" height="4" {...WIN} />
      <rect x="-2" y="-7" width="4" height="7" fill="#10141c" stroke="none" />
    </g>
  );
}

function Bahnhof() {
  // Station hall: round arch + clock gable.
  return (
    <g>
      <path d="M -16 0 L -16 -12 A 16 10 0 0 1 16 -12 L 16 0 Z" fill={P.slate} {...S} />
      <rect x="-5" y="-24" width="10" height="8" fill={P.brick} {...S} />
      <circle cx="0" cy="-20" r="2.4" fill="#eaf0f8" {...S} />
      <rect x="-11" y="-7" width="4" height="7" fill="#10141c" stroke="none" />
      <rect x="7" y="-7" width="4" height="7" fill="#10141c" stroke="none" />
    </g>
  );
}

function Buddenturm() {
  // Cylindrical defence tower with conical hat.
  return (
    <g>
      <path d="M -7 0 L -6 -22 L 6 -22 L 7 0 Z" fill={P.stoneGrey} {...S} />
      <path d="M -8 -22 L 0 -33 L 8 -22 Z" fill={P.roof} {...S} />
      <rect x="-2" y="-17" width="4" height="6" {...WIN} />
    </g>
  );
}

function Tor() {
  // City gate: two squat towers + pointed arch passage.
  return (
    <g>
      <rect x="-14" y="-18" width="9" height="18" fill={P.stoneGrey} {...S} />
      <rect x="5" y="-18" width="9" height="18" fill={P.stoneGrey} {...S} />
      <path d="M -14 -18 L -9.5 -25 L -5 -18 Z" fill={P.roof} {...S} />
      <path d="M 5 -18 L 9.5 -25 L 14 -18 Z" fill={P.roof} {...S} />
      <path d="M -5 0 L -5 -16 L 0 -20 L 5 -16 L 5 0 Z" fill={P.stoneGrey} {...S} />
      <path d="M -3.5 0 A 3.5 4 0 0 1 3.5 0 Z" fill="#10141c" stroke="none" />
    </g>
  );
}

function Muehle() {
  // Mühlenhof windmill: tapered body + four sails.
  return (
    <g>
      <path d="M -5 0 L -4 -16 L 4 -16 L 5 0 Z" fill={P.wood} {...S} />
      <g {...S} strokeLinecap="round">
        <line x1="0" y1="-18" x2="-9" y2="-30" />
        <line x1="0" y1="-18" x2="9" y2="-30" />
        <line x1="0" y1="-18" x2="-9" y2="-6" />
        <line x1="0" y1="-18" x2="9" y2="-6" />
      </g>
      <circle cx="0" cy="-18" r="1.6" fill={P.roof} {...S} />
      <rect x="-1.5" y="-8" width="3" height="8" fill="#10141c" stroke="none" />
    </g>
  );
}

function Zoo() {
  // Zoo entrance: gate arch + small tree.
  return (
    <g>
      <rect x="-13" y="-14" width="4" height="14" fill={P.stoneGrey} {...S} />
      <rect x="9" y="-14" width="4" height="14" fill={P.stoneGrey} {...S} />
      <path d="M -13 -14 A 13 7 0 0 1 13 -14" fill="none" {...S} strokeWidth={2} />
      <circle cx="-2" cy="-20" r="4.5" fill={P.leaf} {...S} />
      <rect x="-2.7" y="-16" width="1.4" height="5" fill={P.wood} {...S} />
    </g>
  );
}

function Kran() {
  // Harbor crane: mast, jib, counterweight, hook.
  return (
    <g {...S} strokeLinecap="round" fill="none">
      <line x1="-6" y1="0" x2="-6" y2="-26" />
      <line x1="-6" y1="-26" x2="14" y2="-26" />
      <line x1="-6" y1="-26" x2="-14" y2="-20" />
      <line x1="10" y1="-26" x2="10" y2="-14" />
      <line x1="-6" y1="-20" x2="2" y2="-26" />
      <path d="M 10 -14 q -3 4 0 6" stroke={P.crane} />
      <line x1="-10" y1="0" x2="-2" y2="0" />
    </g>
  );
}

function Terrassen() {
  // Aasee-Terrassen: steps descending to a water line.
  return (
    <g>
      <path
        d="M -14 -2 L -7 -2 L -7 -7 L 0 -7 L 0 -12 L 7 -12 L 7 -17 L 14 -17 L 14 -21 L -14 -21 Z"
        fill={P.stoneGrey}
        {...S}
      />
      <path
        d="M -16 0 q 4 -2.5 8 0 t 8 0 t 8 0 t 8 0"
        fill="none"
        stroke="#4f7ea8"
        strokeWidth={2}
      />
    </g>
  );
}

function Museum() {
  // Pediment + columns museum front (LWL, Stadtmuseum, Annen…).
  return (
    <g>
      <rect x="-14" y="-15" width="28" height="15" fill={P.plaster} {...S} />
      <path d="M -14 -15 L 0 -24 L 14 -15 Z" fill={P.slate} {...S} />
      <line x1="-9" y1="-15" x2="-9" y2="-4" {...S} />
      <line x1="-3" y1="-15" x2="-3" y2="-4" {...S} />
      <line x1="3" y1="-15" x2="3" y2="-4" {...S} />
      <line x1="9" y1="-15" x2="9" y2="-4" {...S} />
      <rect x="-14" y="-4" width="28" height="4" fill={P.stoneGrey} {...S} />
    </g>
  );
}

function Speicher() {
  // Harbor warehouse: brick row house with goods gable.
  return (
    <g>
      <rect x="-15" y="-18" width="30" height="18" fill={P.brick} {...S} />
      <path d="M -15 -18 L -8 -26 L -1 -18 M -1 -18 L 6 -26 L 13 -18" fill="none" {...S} />
      <rect x="-2" y="-9" width="4" height="9" fill="#10141c" stroke="none" />
      <rect x="-11" y="-14" width="4" height="4" {...WIN} />
      <rect x="7" y="-14" width="4" height="4" {...WIN} />
    </g>
  );
}

function Holstentor() {
  // Holstentor: two fat cone-roofed towers + stepped gate block.
  return (
    <g>
      <circle cx="-9" cy="-12" r="7" fill={P.brick} {...S} />
      <circle cx="9" cy="-12" r="7" fill={P.brick} {...S} />
      <path d="M -15 -17 L -9 -29 L -3 -17 Z" fill={P.slate} {...S} />
      <path d="M 3 -17 L 9 -29 L 15 -17 Z" fill={P.slate} {...S} />
      <path d="M -4 0 L -4 -18 L 0 -22 L 4 -18 L 4 0 Z" fill={P.brick} {...S} />
      <rect x="-11" y="-14" width="3" height="4" {...WIN} />
      <rect x="8" y="-14" width="3" height="4" {...WIN} />
      <path d="M -3 0 A 3 3.4 0 0 1 3 0 Z" fill="#10141c" stroke="none" />
    </g>
  );
}

const GLYPHS: Record<LandmarkId, () => JSX.Element> = {
  dom: Dom,
  kirche: Kirche,
  rathaus: Rathaus,
  schloss: Schloss,
  bahnhof: Bahnhof,
  buddenturm: Buddenturm,
  tor: Tor,
  muehle: Muehle,
  zoo: Zoo,
  kran: Kran,
  terrassen: Terrassen,
  museum: Museum,
  speicher: Speicher,
  holstentor: Holstentor,
};

export function LandmarkGlyph({ landmark }: { landmark: LandmarkId }) {
  const Glyph = GLYPHS[landmark];
  return (
    <g data-landmark={landmark} aria-hidden="true" focusable="false">
      <Glyph />
    </g>
  );
}
