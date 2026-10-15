# Detail: Rendering-Stack (SVG-Karte)

## MapGraph (`src/components/MapGraph.tsx`, 433 Z.)

Gemeinsame, perspektiven-neutrale SVG-Karte. Signatur:

```tsx
<svg className={styles.map} viewBox={map.viewBox} role="img"
     aria-label={t("map.ariaLabel")} data-testid="map-graph">
```

`viewBox` kommt aus dem Kartenpaket (`muenster.json`: `0 0 1000 800`,
`luebeck.json`: `0 0 800 600`, `teststadt.json`: `0 0 100 100`).

### Layer-Reihenfolge (DOM, unten → oben)

1. **`<MapBackdrop board={map.board} />`** → `<g data-layer="board">`
2. **`<g data-layer="edges">`** — ein `<g data-edge="a-b">` je Kante mit
   `<line>` (Klassen `edge` + `edgeWeg|edgeFahrt` + `edgeBlocked` +
   `edgeFlash`, Attribute `data-edge-type`, `data-blocked`). Blockierte
   Kanten bekommen zusätzlich ein Kreuz-Glyph (`<g class="blockGlyph"
   data-block-glyph>` — zwei Linien ±4 um den Kantenmittelpunkt).
3. **`<g data-layer="landmarks">`** — `aria-hidden`,
   `pointerEvents="none"`; je `node.landmark` ein
   `translate(node.x, node.y - 4)`-Group mit `<LandmarkGlyph>`.
4. **`<g data-layer="nodes">`** — ein `<g data-node-id>` je Knoten,
   `translate(node.x, node.y)`. Enthält in Reihenfolge:
   - `hitArea`: `<circle r=14>` transparent, `pointer-events: all`
     (nur bei interaktiven Knoten; `NODE_RADIUS 8 + 6`)
   - `zoneHalo`: `<circle r=13>` mit `fill: hsl(zoneHue(zone) 55% 60%)`,
     `fill-opacity 0.16` — nur `showZones` (Detektiv-Perspektive);
     `zoneHue = index * 137 % 360`
   - `nodeDot`: `<circle r=8>` — der eigentliche Orts-Punkt
   - `legalRing`: `<circle r=12>` gestrichelt grün — `data-legal-target`
   - `possibleRing`: Diamant-Pfad (±15) — Deduktions-Overlay,
     `data-possible` (Detektiv)
   - `categoryBadge`: Missions-Glyph-Pfade neben dem Knoten
     (`x = 13 + i*10`), `data-category` — `showCategories` (Detektiv)
   - `cameraGlyph`: Kamera-Piktogramm (Body `rect` + Linse `path` +
     optionaler Strike-`line`), `data-camera`, `data-camera-active`
   - `markerPin`: Pin-Glyph `translate(12,-16)`, `data-marker`
     (Spieler-Marker, Detektiv)
   - `escapeMarker`: Flucht-Fahnen-Glyph `translate(10,-10)`,
     `data-escape-node` (Ganove)
   - `missionBadge`(s): Glyph-Pfade `translate(-10 - i*9, -10)`,
     `data-mission-target` (Ganove)
   - `nodeLabel`: `<text y=18 textAnchor=middle>` — Ortsname,
     `font-size 10px`
5. **`<g data-layer="markers">`** — Spielfiguren:
   - `detectiveMarker` je `detectivePositions[i]`: `<rect -6..6 rx=2>`
     + Index-`<text>`; `detectiveActive`-Variante (heller + Amber-Rand);
     `data-detective`, `data-active-detective`
   - `ganoveMarker`: Diamant-Pfad `M 0 -7 L 6 0 L 0 7 L -6 0 Z`;
     `data-ganove`; nur wenn `ganovePosition` gesetzt (Ganove-Seite)
   - Positionierung per Inline-`style.transform: translate(x, y-16)` —
     `markerMove`-Transition (480 ms `cubic-bezier`) lässt Figuren
     gleiten; `prefers-reduced-motion` schaltet sie ab.

### Formkodierte Glyphen — `missionBadgePath(kind, x, y)`

| kind | Form | Farbe |
|------|------|-------|
| `diebstahl` | Raute | `#e8b45a` |
| `kontakt` | Quadrat | `#b48ad4` |
| `sabotage` | Dreieck | `#d98c8c` |
| `flucht` | Fahne (Mast + Wimpel) | `#7fb8d4` |

Gleiche Formen werden als `categoryBadge` (Detektiv) und `escapeMarker`
wiederverwendet — „gleiche Form = gleiche Kategorie" in beiden
Perspektiven.

### Interaktion / A11y-Struktur

- Interaktive Knoten (`legalTargets`, `selectableNodeIds`,
  `markableNodeIds`) erhalten `role="button"`, `tabIndex=0`,
  `aria-label` (`node.moveTo`/`node.spawnHere`/`node.mark`), Click-
  Handler und `onKeyDown`.
- Pfeiltasten-Roaming: `nextInteractiveNode` wählt den geometrisch
  nächsten interaktiven Knoten in Pfeilrichtung (Projektion + 4×
  senkrechter Offset); Fokus springt per `nodeRefs`-Registry.
- **Pointer-Events-Konvention:** `.map :where(g,path,circle,rect,line,
  text,title) { pointer-events: none }` — ausschließlich `.hitArea`
  fängt Zeiger; sämtliche Deko (auch große Glyphen) kann nie Klicks
  abfangen. **Redesign-Regel: Deko-Elemente bleiben klickneutral.**
- Focus-visible: `.nodeInteractive:focus-visible .nodeDot` bekommt
  `#f5d76e`-Rand (3 px).
- Hover/Legal: `nodeLegal`/`nodeSelectable` färben `nodeDot` grün
  (`#7fd4a8`, Hover `#a8e8c8`).

### Props / Perspektiven-Asymmetrie (No-Leak-Vertrag)

`MapGraphProps` enthält **nur** neutrale bzw. rollenspezifisch
vom Aufrufer gefilterte Daten. Kameras (`cameras`), Kategorien/Zonen
(`showCategories`, `showZones`), Deduktions-Ring (`possibleNodeIds`),
Marker-Pins sind Detektiv-only; `ganovePosition`, `missionTargets`,
`escapeNodeIds` Ganove-only. Es gibt **keine** Props für gegnerische
Informationen — Redesign darf keine leakfähigen Render-Pfade einführen.

Verwendung in: `GanoveScreen`, `DetektivScreen`, `MissionSelect`
(Custom-Mission-Picker), `ReplayScreen` (2 Instanzen: Ganove- +
Detektiv-Perspektive).

## MapBackdrop (`src/components/MapBackdrop.tsx`, 31 Z.)

Rendert `board.features` (Kartenpaket-JSON) als `<path d>` mit Klasse
`styles["feature_<style>"]`, `data-board-style`. `aria-hidden`,
`pointerEvents="none"`. Styles in `MapBackdrop.module.css`:

| style | fill | stroke | Muster |
|-------|------|--------|--------|
| `water` | `#1d3247` | `#2d4a66` (2) | Fläche |
| `park` | `#1f3328` | `#2f4a3a` (2) | Fläche |
| `rail` | none | `#5a5148` (2.5) | `dasharray 8 4` |
| `street` | none | `#323a48` (4) | `linecap round` |
| `block` | `#202835` | `#2e3a4d` (1.5) | Gebäude-Silhouette |

Datenmodell (`src/logic/mapPack.ts`): `BoardFeature{kind:"shape",
style:BoardStyle,d}`, `BoardStyle = water|park|rail|street|block`
(geschlossene Menge, schema-validiert; `kind` offen für künftige
Feature-Arten). Nur `muenster.json`/`luebeck.json` liefern `board`;
`teststadt` nicht (Backdrop rendert dann `null`).

## landmarks.tsx (267 Z.)

`LandmarkGlyph({landmark})` → `<g data-landmark={id} aria-hidden>`.
14 handgezeichnete Comic-Glyphen, jeweils in 36×32-Box mit Fußpunkt am
lokalen Ursprung (dadurch `translate(node.x, node.y-4)`):

`dom, kirche, rathaus, schloss, bahnhof, buddenturm, tor, muehle, zoo,
kran, terrassen, museum, speicher, holstentor` — geschlossene Menge
`KNOWN_LANDMARKS` in `mapPack.ts` (Schema-Validierung der Kartenpakete).

Stil: flache warme Fills + dicke dunkle Outline (`S`: `#10141c`, 1.5,
round-join), Fenster `WIN`: `#f5d76e`. Bau-Palette `P`: stone `#c9a86a`,
brick `#b0703c`, plaster `#d8c9a0`, roof `#8c4a3c`, slate `#5a6b7d`,
wood `#8a6a45`, stoneGrey `#9aa4b0`, crane `#e8a05a`, leaf `#4f7a4f`.

## Kanten-Visualisierung (`MapGraph.module.css`)

| Klasse | Optik |
|--------|-------|
| `.edge`/`.edgeWeg` | `stroke #4a5568`, 2 px, solid |
| `.edgeFahrt` | `stroke #7a6a4f`, 3.5 px, `dasharray 10 5` |
| `.edgeBlocked` | `#3a3f4a`, 50 % Opazität, `dasharray 4 4` |
| `.edgeFlash` | `#f5d76e`, 3.5 px, `edge-flash`-Keyframe 3400 ms |
| `.blockGlyph line` | `#d98c8c`, 2.5 px, round cap |

## Marker-Optik

| Element | Optik |
|---------|-------|
| `detectiveShape` | fill `#3d5a80`, stroke `#9db8d9` 1.4 |
| `detectiveActive` | fill `#5a7db0`, stroke `#f5d76e` 2.2 |
| `ganoveShape` | fill `#e8b45a`, stroke `#10141c` 1.4 |
| `markerText` | `#eaf0f8`, 9 px, bold |
| `markerPin` | `#b48ad4` + dunkle Outline |
| `cameraGlyph` | Body `#243050`/`#9db8d9`, Strike `#d98c8c` |

## Karten-Container

`.map` (MapGraph.module.css): `display:block; width:100%; height:auto;
background:#10141c; border:1px solid #2a3240; border-radius:8px` —
das komplette „Brett" ist aktuell eine flache dunkle SVG-Fläche.
