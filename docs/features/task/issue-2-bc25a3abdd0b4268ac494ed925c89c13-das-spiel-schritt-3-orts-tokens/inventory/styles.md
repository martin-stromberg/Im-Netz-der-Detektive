# Bestandsaufnahme: Styles und Tokens

## `src/components/MapGraph.module.css`

| Klasse | Wirkung |
|--------|---------|
| `.map` | Papier-Face (`--color-paper`), 7-px-Cardboard-Rand, `--shadow-board` |
| `.map :where(g, path, circle, rect, line, text, title)` | `pointer-events: none` — nur `.hitArea` fängt Pointer |
| `.nodeDot` | `fill: var(--color-ink)`, `stroke: var(--color-paper)`, `stroke-width: 1.5` — **wird ersetzt** |
| `.nodeLabel` | `fill: var(--color-ink)`, 10px |
| `.nodeInteractive` | `cursor: pointer`, `outline: none` |
| `.hitArea` | `fill: transparent`, `pointer-events: all`, `cursor: pointer` |
| `.nodeInteractive:focus-visible .nodeDot` | Amber-Stroke (`--color-map-accent`, 3px) — muss auf Token-Fassung übertragen werden |
| `.nodeLegal .nodeDot`, `.nodeSelectable .nodeDot` | `fill: var(--color-map-legal)` — aktuell nur Farbe |
| `.nodeInteractive:hover .nodeDot` | `fill: var(--color-map-legal-hover)` |
| `.legalRing` | `stroke: var(--color-map-legal)`, `stroke-dasharray: 3 3` |
| `.nodeCurrentTarget .nodeDot` | Amber-Stroke 3px |
| `.nodeGanoveHere .nodeDot` | `fill: var(--color-map-ganove)` |
| `.zoneHalo` | `fill-opacity: 0.22` |
| `.possibleRing` | `stroke: var(--color-map-possible)`, 1.8 |
| `.categoryBadge`, `.missionBadge`, `.mission_*` | Outline-Glyphen, Farben je Kategorie |
| `.cameraBody/-Lens/-Strike`, `.markerPin`, `.escapeMarker` | Overlay-Glyphen, unverändert zu belassen |
| `.markerMove` | 480ms-Transform-Transition (Figuren, nicht Knoten) |

## `src/components/GanoveScreen.module.css` (Legende, Zeilen 322–391)

| Klasse | Wirkung |
|--------|---------|
| `.legend`, `.legendTitle`, `.legendItem` | Flex-Legende, Papier-Chip hinter jedem Swatch (`background: var(--color-paper)`, `border: 1px solid var(--color-cardboard)`) |
| `.legendTargetDot` | `fill: var(--color-map-legal)` — flacher Punkt r=4 |
| `.legendTargetRing` | `fill: none`, `stroke: var(--color-map-legal)`, `stroke-dasharray: 2 2`, r=5.5 |

## `src/components/DetektivScreen.module.css` (Legende, Zeilen 141–167)

`legendCameraBody/-Lens`, `legendPin`, `legendDiamond`, `legendCategory` —
kein Orts-Swatch.

## `src/theme.css`

Vorhandene Brettspiel-Tokens:

- Papier/Tinte: `--color-paper` #e8dcc0, `--color-paper-aged` #d6c6a0,
  `--color-ink` #2b2115, `--color-ink-soft` #57462e,
  `--color-cardboard` #6b5335, `--color-cardboard-edge` #4a3823.
- Kartenfarben (`--color-map-*`, Kontraste gg. Papier dokumentiert):
  legal #2e7a54 (3.8:1), legal-hover #1f5c3d (5.5:1), accent #7d5210 (4.8:1),
  danger, escape, pin, possible, ganove, detective-stroke,
  detective-active, blocked.
- Schatten: `--shadow-panel`, `--shadow-board` — kein Token-Schatten.

Für die Token-Optik fehlen: Token-Fassungs-Farbe (falls von `--color-ink`
abweichend), Token-Schatten, ggf. Highlight-Ton für die Prägung.
