# Bestandsaufnahme — Komponenten und Karten-Rendering

## `MapGraph` (React-Komponente)
Datei: `src/components/MapGraph.tsx`

Gemeinsame SVG-Karte für alle Perspektiven. Struktur (Reihenfolge im DOM):

1. `<svg className={styles.map} viewBox={map.viewBox} role="img" data-testid="map-graph">`
2. `<MapBackdrop board={map.board}>` → `<g data-layer="board" aria-hidden="true" pointerEvents="none">` — **nur wenn** `board !== undefined && board.features.length > 0`; `teststadt.json` hat kein `board`-Objekt, `muenster.json` 25 Features, `luebeck.json` ebenfalls.
3. `<g data-layer="edges">` — `<line>` pro Kante (`data-edge`, `data-edge-type` `weg`/`fahrt`, `data-blocked`), Blockade-Kreuz als zwei gekreuzte `<line>` in `styles.blockGlyph` (`data-block-glyph`).
4. `<g data-layer="landmarks" aria-hidden="true" pointerEvents="none">` — `LandmarkGlyph` je `node.landmark` (`data-landmark`).
5. `<g data-layer="nodes">` — `<g data-node-id>` je Knoten: optionale `hitArea`-`<circle>` (pointer-events), `zoneHalo`-`<circle>` (inline `fill: hsl(zoneHue 55% 60%)`, `data-zone`), `nodeDot`, `legalRing`, `possibleRing` (Diamant, `data-possible`), `categoryBadge` (`data-category`, Formen via `missionBadgePath`), `cameraGlyph` (`data-camera`, `data-camera-active`, Durchstreich-Linie), `markerPin` (`data-marker`), `escapeMarker` (Flaggen-Form, `data-escape-node`), `missionBadge` (`data-mission-target`), `nodeLabel`-`<text>`.
6. `<g data-layer="markers">` — `detectiveMarker` (`data-detective`, nummeriertes `<rect>` + `markerText`), `ganoveMarker` (Raute, `data-ganove`).

- Interaktive Knoten: `role="button"`, `tabIndex`, `onClick`/`onKeyDown` (Enter/Leertaste + Pfeiltasten-Roaming via `nextInteractiveNode`/`nodeRefs`).
- Bewegung: `markerMove` CSS-Transition auf `transform` (480 ms), deaktiviert bei `prefers-reduced-motion`.
- Props: `map`, `round`, `blockedEdges`, `flashEdges`, `detectivePositions`, `ganovePosition`, `legalTargets`, `selectableNodeIds`, `missionTargets`, `currentTargetId`, `escapeNodeIds`, `cameras`, `showCategories`, `showZones`, `activeDetectiveIndex`, `markedNodeIds`, `markableNodeIds`, `possibleNodeIds`, `onNodeSelect` — **dürfen nicht geändert werden**.
- Enthält aktuell **kein** `<defs>`; verwendet React ohne `useId`-Import (nur `KeyboardEvent`-Type-Import).
- `MapBackdrop` wird als erstes Kindelement gerendert; ein Papier-`<rect>` muss als direktes SVG-Kind davor stehen, damit Board-Features auf dem Papier liegen.

## `MapBackdrop` (React-Komponente)
Datei: `src/components/MapBackdrop.tsx`

- Rendert `board.features` als `<path d={feature.d} fillRule="evenodd" className={styles[\`feature_\${feature.style}\`]} data-board-style={feature.style}>` in `<g data-layer="board" aria-hidden="true" pointerEvents="none">`.
- Return `null` bei fehlendem `board` oder leerer `features`-Liste → `data-layer="board"` existiert dann nicht im DOM (z. B. `teststadt`).
- `BoardStyle = "water" | "park" | "rail" | "street" | "block"` (`src/logic/mapPack.ts`, validiert gegen `KNOWN_BOARD_STYLES`).

## `LandmarkGlyph` (React-Komponente)
Datei: `src/components/landmarks.tsx`

- 14 Glyphen (`dom` … `holstentor`), 36×32-Box, Fußpunkt am lokalen Ursprung.
- Stil: flache warme Füllfarben (`P`-Palette: `stone` `#c9a86a`, `brick` `#b0703c`, `plaster` `#d8c9a0`, `roof` `#8c4a3c`, `slate` `#5a6b7d`, `wood` `#8a6a45`, `stoneGrey` `#9aa4b0`, `crane` `#e8a05a`, `leaf` `#4f7a4f`) + dunkle Outlines `S` (`stroke: #10141c`, 1.5) + helle Fenster `WIN` (`#f5d76e`).
- `aria-hidden`, rein dekorativ; auf Pergament lesbar (warme Farben auf hellem Grund, dunkle Outlines). Einzig `stoneGrey`/`slate` sind kühl — noch im Vintage-Rahmen.

## Einsatzstellen von `MapGraph`

| Datei | Zweck |
|-------|-------|
| `src/components/GanoveScreen.tsx` (~Z. 191, 578) | Setup-/Spielkarte der Ganove-Perspektive |
| `src/components/DetektivScreen.tsx` (~Z. 211, 508) | Setup-/Spielkarte der Detektiv-Perspektive (mit `cameras`, `showZones`, `showCategories`, `markedNodeIds`, `possibleNodeIds`) |
| `src/components/ReplayScreen.tsx` (~Z. 276, 291) | Zwei `MapGraph`-Instanzen nebeneinander (Ganove + Detektiv) — **doppelte `id`-Vergabe in `<defs>` wäre Konflikt, `useId` nötig** |
| `src/components/MissionSelect.tsx` (~Z. 98) | Custom-Picker-Karte |

## Legenden-Swatches (dunkle Panels)

`GanoveScreen.tsx` `MapLegend` (`data-testid="map-legend"`) und `DetektivScreen.tsx` `DetectiveMapLegend` zeichnen Inline-SVGs, deren Klassen dieselben Farbtokens nutzen wie die Karte:

- `GanoveScreen.module.css`: `legendWeg`/`legendFahrt`/`legendEscape`/`legendDetective`/`legendGanove`/`legendTargetDot`/`legendTargetRing`
- `DetektivScreen.module.css`: `legendCameraBody`/`legendCameraLens`/`legendPin`/`legendDiamond`/`legendCategory` (nutzt `--color-amber`); Rest kommt aus `GanoveScreen.module.css` (`shared`)

Die Swatch-SVGs (26×8 … 14×14) liegen direkt auf dunklem Panel (`--color-panel-bg`) ohne eigenen Hintergrund.
