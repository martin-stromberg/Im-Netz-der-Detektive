# Bestandsaufnahme: UI-Komponenten

## `MapGraph` (`src/components/MapGraph.tsx`)

Gemeinsame SVG-Kartenkomponente für alle Perspektiven (Ganove, Detektiv,
Replay). Keine Props für gegnerische Informationen — Perspektiv-Asymmetrie ist
konstruktiv (keine Kamera-/Hint-Props in Ganove-Nutzung).

### Knoten-Rendering (`<g data-layer="nodes">`, Zeilen 306–437)

Pro `MapNode` ein `<g transform="translate(x,y)">` mit:

| Element | Geometrie | Zweck / data-* |
|---------|-----------|----------------|
| `circle.hitArea` | `r = NODE_RADIUS + 6` = 14 | unsichtbare Hit-Area, `pointer-events: all`, nur bei interaktiven Knoten |
| `circle.zoneHalo` | `r = 13`, Inline-`fill: hsl(hue 55% 45%)`, `fill-opacity: 0.22` | Zonenfärbung (Detektiv), `data-zone`, nur bei `showZones` |
| `circle.nodeDot` | `r = 8` | **flacher Tintenpunkt — wird ersetzt** |
| `circle.legalRing` | `r = 12`, `stroke-dasharray: 3 3` | nur bei `legalTargetIds` |
| `path.possibleRing` | Diamant r=15 | `data-possible`, Deduktions-Overlay |
| `path.categoryBadge` | `missionBadgePath()` an x=13+i·10, y=5 | `data-category`, nur bei `showCategories` |
| `g.cameraGlyph` | `translate(-14,-15)` | `data-camera`, `data-camera-active` |
| `g.markerPin` | `translate(12,-16)` | `data-marker`, Deduktions-Pin |
| `path.escapeMarker` | `missionBadgePath("flucht",10,-10)` | `data-escape-node` |
| `path.missionBadge` | `missionBadgePath(kind,-10-i·9,-10)` | `data-mission-target` |
| `text.nodeLabel` | `y = 18` | Ortsname, `--color-ink` |

Zustandsklassen am `<g>`: `nodeInteractive`, `nodeLegal`, `nodeSelectable`
(sowohl `selectableNodeIds` als auch `markableNodeIds` erhalten
`nodeSelectable`), `nodeCurrentTarget`, `nodeGanoveHere`.

Interaktion: `role="button"`, `tabIndex=0`, `aria-label` (i18n
`node.moveTo`/`node.spawnHere`/`node.mark`), `onClick`, `onKeyDown`
(Enter/Space wählt, Pfeiltasten roamen via `nextInteractiveNode` +
`nodeRefs`-Fokus).

### `<defs>` (Zeilen 221–244)

`defsId = "mapboard-" + useId()` (sanitisiert). Bereits vorhanden:
`{defsId}-grain` (`feTurbulence`-Filter) und `{defsId}-vignette`
(`radialGradient`). Neue Token-Gradienten kommen hier mit demselben Muster
hinein; Test „keeps defs ids unique" fordert Eindeutigkeit über zwei Instanzen
und prüft, dass jede `url(#…)`-Referenz (auch `fill="url(…)"`) im selben
Dokument auflöst.

### Marker-Layer (`data-layer="markers"`)

`detectiveMarker` (rect + Index-Text) und `ganoveMarker` (Raute) — **nicht**
Teil dieser Anforderung (Schritt 4).

## `MapLegend` (`src/components/GanoveScreen.tsx`, Zeilen 101–148)

Legende unter der Ganove-Karte. Swatches als 12×12-SVGs auf Papier-Chip
(`.legendItem svg`: `--color-paper`-Hintergrund, `--color-cardboard`-Rand).
Das Target-Swatch (Zeilen 137–139): `circle.legendTargetDot` (r=4,
`--color-map-legal`-Fill) + `circle.legendTargetRing` (r=5.5, gestrichelt) —
flacher Punkt, kein Token.

## `DetectiveMapLegend` (`src/components/DetektivScreen.tsx`, Zeilen 109–170)

Nutzt `shared = GanoveScreen.module.css` für Legend-Basisklassen plus eigene
Swatch-Klassen (`legendCameraBody`, `legendPin`, `legendDiamond`,
`legendCategory` aus `DetektivScreen.module.css`). **Kein Orts-/Ziel-Swatch**
vorhanden — „gleiche Form = gleiche Bedeutung" verlangt ein Token-Swatch
für die markierbaren/selektierbaren Orte.

## `ReplayScreen` (`src/components/ReplayScreen.tsx`)

Rendert zwei `MapGraph`-Instanzen (Ganove- + Detektiv-Perspektive) plus
`MapLegend`/`DetectiveMapLegend` — `defsId`-Eindeutigkeit ist hier relevant.

## Datenmodell (`src/logic/mapPack.ts`)

`MapNode`: `id`, `name`, `x`, `y`, `categories: NodeCategory[]`,
`zone: string`, `landmark?: LandmarkId`.
`NodeCategory` = `"diebstahl" | "kontakt" | "sabotage" | "flucht"` —
kategorien werden heute als separate Badges gerendert, nicht als Token-Form.
