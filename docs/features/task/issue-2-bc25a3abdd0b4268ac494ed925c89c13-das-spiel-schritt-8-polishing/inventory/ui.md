# Detail: UI-/Styling-Auditfläche (Schritt 8)

## CSS-Module und Header-Kontrasttabellen

| Modul | Rolle | Header-Tabelle |
|-------|-------|----------------|
| `src/theme.css` | Design-Tokens (`:root`), `@font-face` IM Fell English (2 Schnitte) | Vollständige WCAG-Tabelle inkl. Board- (`--color-map-*` auf `--color-paper`) und Edelkarte-Paare |
| `GanoveScreen.module.css` | Shared-Theme + Ganove-Layout + Spieltisch-Komposition | Tabelle der Text-Paare + Edelkarte-Paare (Schritt 6) |
| `Menu.module.css` | Menü-Elemente, Karten, Inputs | Verweis auf theme.css/GanoveScreen-Tabelle |
| `DetektivScreen.module.css` | Detektiv-Ergänzungen | Kurz-Header, keine eigene Tabelle |
| `MapGraph.module.css` | SVG-Karte (Pergament, cased Routen, Plaketten, Glyphen) | Header erklärt Formkodierung |
| `boardPieces.module.css` | Meeple-Figuren | Header erklärt Silhouettenkodierung |
| `MapBackdrop.module.css` | Board-Features | Kurz-Header |
| `MissionPanel/HeatBadge/PursuitBadge/EventBanner.module.css` | Panels/Badges/Banner | kurze Header |

## `:focus-visible`-Matrix (Ist)

| Element | Regel | Fokus-Cue |
|---------|-------|-----------|
| `.primaryButton` | GanoveScreen.module.css:310 | `outline: none` + Background-Swap auf `--color-amber-bright` — **nur Farbe** |
| `.secondaryButton` | GanoveScreen.module.css:336 | `outline: 2px solid --color-amber-bright` |
| `.dangerButton` | GanoveScreen.module.css:369 | `outline: 2px solid --color-danger` |
| `.card` | Menu.module.css:40/45 | Border-Recolor + `outline: 2px solid --color-amber-bright` |
| `.numberInput`/`.selectInput` | Menu.module.css:131 | `outline: none` + Border-Recolor — **nur Farbe** |
| `.rangeInput` | Menu.module.css:142 | `outline: 2px solid --color-amber-bright` |
| `.choiceButton` | MissionPanel.module.css:105 | `outline: 2px solid --color-amber-bright` |
| `.commentInput` | DetektivScreen.module.css:116 | `outline: 2px solid --color-amber-bright` |
| `.removeButton` | DetektivScreen.module.css:144 | `outline: none` + Border-Recolor — **nur Farbe** |
| SVG-Knoten (`.nodeInteractive`) | MapGraph.module.css:176/189 | `outline: none` auf `<g>` (SVG kann keine CSS-Outline); Fokus = `tokenRim`-Stroke auf `--color-map-accent`, 3 px — **Form+Farbe**, ok |
| `.toolToggle input` (Checkbox) | DetektivScreen.module.css:57 | kein `outline: none` → Browser-Default-Ring greift |

## Motion-Matrix (Ist)

| Effekt | Ort | reduced-motion |
|--------|-----|----------------|
| `edge-flash` 3400 ms | MapGraph.module.css:106 | ja (:123) |
| `markerMove` Transition 480 ms | MapGraph.module.css:262 | ja (:265) |
| `pursuit-pulse` 1100 ms | GanoveScreen.module.css:158 | ja (:176) |
| `splash-in` 2600 ms | GanoveScreen.module.css:196 | ja (:225, opacity 0.85) |
| `banner-in` 220 ms | EventBanner.module.css:34 | ja (:49) |
| `box-shadow` Transition 400 ms `.mapArea::after` | GanoveScreen.module.css:147 | **nein — Lücke** |

## Perspektiven-Filter (Info-Leak-Prüfung)

- `GanoveScreen` → `MapGraph`: `blockedEdges`, `flashEdges`,
  `detectivePositions`, `ganovePosition`, `legalTargets`,
  `missionTargets`, `currentTargetId`, `escapeNodeIds` — **keine**
  `cameras`, keine `markedNodeIds`/`possibleNodeIds`.
- `DetektivScreen` → `MapGraph`: `blockedEdges`, `detectivePositions`,
  `activeDetectiveIndex`, `legalTargets`, `markableNodeIds`,
  `markedNodeIds`, `possibleNodeIds`, `cameras` (via `visibleCameras`),
  `showCategories`, `showZones` — **keine** `ganovePosition`,
  `missionTargets`, `escapeNodeIds`.
- `MissionSelect` → `MapGraph`: nur `selectableNodeIds` (Custom-Picker).
- `ReplayScreen` → 2 × `MapGraph` (Ganove-/Detektiv-Sicht getrennt,
  `data-testid="replay-view-*"`).

## Sonstige Vertrags-Stichproben

- `data-*`-Checkliste aus `inventory/conventions.md`: alle gelisteten
  Attribute kommen im Quellcode vor (`data-layer`, `data-edge*`,
  `data-node-*`, `data-detective`, `data-ganove`, `data-view`,
  `data-outcome`, `data-pursuit*`, `data-heat-level`,
  `data-mission-step`, `data-step-status`, `data-choice`,
  `data-radio-report`, `data-marker-item`, `data-hint-event`); E2E
  (39 Tests) prüft sie funktional.
- Hit-Area-Konvention: `.hitArea` `r = NODE_RADIUS + 6 = 14` >
  Token-Geometrie (`r = 8` + legalRing `r = 12`); nur Hit-Area fängt
  Zeiger (`.map :where(...)` pointer-events-Regel).
- `useId()`-Präfixe für defs/Gradienten (`defsId`, `piece-*-body`) —
  doppelte Map-Mounts (ReplayScreen) kollisionsfrei.
