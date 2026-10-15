# Bestandsaufnahme: UI-Struktur und Styles

## Screen-Grundfläche

### `.screen` — `src/components/GanoveScreen.module.css` (Zeilen 45–58)

Von **allen** Screens als `shared.screen` genutzt (`data-testid`-Träger):

| Screen-Komponente | `data-testid` | Besonderheit |
|-------------------|---------------|--------------|
| `MainMenu` | `main-menu` | Titelbild `title-noir.jpg` via `.cardImage`, `shared.title`, `shared.subtitle`, `shared.panel` + `.menuList` |
| `MapSelect` | `map-select` | `.cardGrid` mit `.card` (Kartenkarten, `map-{id}.jpg` via `.cardImage`), `badge` für „in Vorbereitung" |
| `ModeSelect` | `mode-select-screen` | `.cardGrid` mit `.card` |
| `SettingsScreen` | `settings-screen` | `.fieldGrid`, `.numberInput`, `.selectInput`, `.rangeInput` |
| `MissionSelect` | `mission-select` | `.cardGrid` + `CustomMissionPicker` mit `MapGraph` (Brett-Vorschau!) |
| `DevModeScreen` | `devmode-screen` | `.fieldGrid`, `.summaryTable` |
| `StatsScreen` | `stats-screen` | `.statGrid`/`.statBox`, `.summaryTable`, `.confirm` |
| `ResumeScreen` | `resume-screen` | `.menuList` mit `.card` |
| `AppSettingsScreen` | `app-settings-screen` | `.perspectiveToggle` (language-toggle), `.rangeInput` |
| `GanoveScreen` | `ganove-screen` | `data-view`: `idle`/`pickSpawn`/`playing`; `.layout` nur in `playing` |
| `DetektivScreen` | `detektiv-screen` | `data-view`: `idle`/`pickSpawns`/`playing`; `.layout` nur in `playing` |
| `ReplayScreen` | `replay-screen` | `data-view`: `invalid`/`playing`; `.layout` nur in `playing`; `.perspectiveToggle` (replay-perspective) |

Aktueller Aufbau `.screen`:

```css
background:
  linear-gradient(var(--color-screen-overlay-soft), var(--color-screen-overlay-strong)),
  url("../assets/bg-noir.jpg") center / cover fixed no-repeat;
background-color: var(--color-screen-bg);
```

### `.shell` — `src/App.module.css`

`main`-Wrapper aller Screens: `min-height: 100vh; background: var(--color-screen-bg);` — nur als Overscroll-/Rand-Fläche sichtbar (`.screen` hat selbst `min-height: 100vh`).

## Spiellayout (nur Ganove/Detektiv/Replay `playing`)

### `.layout` (Zeilen 97–101)

`display: flex; gap: 16px; align-items: flex-start;` — schmucklos, keine Fläche/Rahmung.

### `.mapArea` (Zeilen 103–145)

`flex: 1 1 auto; min-width: 0; position: relative;` — enthält `MapGraph` (Brett), `EventBanner`, `.splash`, `MapLegend`.

Overlay-Stack (von unten nach oben):
1. `MapGraph` SVG — das Brett (`.map`: `--color-paper`, 7 px `--color-cardboard`-Rand, `0 0 0 3px --color-cardboard-edge`, `--shadow-board`, `border-radius: 10px`)
2. `MapLegend` — normale Flussebene
3. `.splash` — `position: absolute`, kein z-index (DOM-Position vor `::after` → Vignette liegt darüber; `pointer-events: none` irrelevant, Splash ist dekorativ)
4. `.mapArea::after` — Verfolgungs-Vignette, `position: absolute; inset: 0; pointer-events: none`, inset box-shadows (`nah`/`unmittelbar` + `pursuit-pulse`-Animation)
5. `EventBanner .stack` — `position: absolute; z-index: 5` → oberste Schicht

### `.sidebar` (Zeilen 223–228)

`flex: 0 0 320px; display: flex; flex-direction: column; gap: 12px;` — enthält `.hint`, `MissionPanel`, Buttons (`.primaryButton`/`.secondaryButton`), `.panel`-Sektionen, `.confirm`, `.notice`, `OutcomeView`. Keine Containerfläche — Panels „schweben" einzeln.

### Responsiv-Verhalten (Zeilen 488–497)

`@media (max-width: 900px)`: `.layout` → `flex-direction: column`, `.sidebar` → `flex: 1 1 auto; width: 100%`.

## Menü-Module — `src/components/Menu.module.css`

| Klasse | Zustand |
|--------|---------|
| `.card` | Edelkarte komplett (`--card-face`, Kartonrand, `--card-rim`, `--shadow-card`), Fokusring amber |
| `.cardImage` | nur `border-radius: 6px` + `background: var(--color-screen-bg)` — **flacher Rest** |
| `.perspectiveToggle` | flacher Pill-Rahmen (`border: 1px solid --color-cardboard`, schlichter Schatten); Buttons `background: var(--color-screen-bg)`, `aria-pressed` → `--color-amber` — **neu zu stylen** |
| `.badge` | geprägter Chip (border + inset highlight) — ok |
| `.summaryTable` | `--color-cardboard`-Rand + `--shadow-card` — ok |
| `.statBox` | Edelkarte — ok |
| `.numberInput`/`.selectInput` | vertiefte Kartenslots — ok |
| `.menuList`, `.cardGrid`, `.fieldGrid`, `.actions`, `.statGrid` | reine Layout-Grid/Flex — ok |

## Design-Tokens — `src/theme.css`

Vorhanden und für Schritt 7 nutzbar:

- `--color-table: #191411`, `--color-table-edge: #0e0b09` — **definiert, bisher ungenutzt** (Kontrastdokumentation in theme.css: text 15.9:1, secondary 11.8:1, muted 6.0:1, amber 9.7:1 auf `--color-table`)
- `--color-cardboard: #6b5335`, `--color-cardboard-edge: #4a3823` — Holz-/Kartonrand (Brett-Rahmen, Karten-Rims)
- `--card-face`, `--card-rim`, `--shadow-card`, `--shadow-board`, `--shadow-panel`, `--radius-card`, `--font-display`
- `--color-screen-bg: #0c0f16`, `--color-screen-overlay-soft/strong` — bisherige Flächen-Tokens; `screen-overlay-*` wird **nur** in `.screen` verwendet; `screen-bg` noch in `.shell`, `.cardImage`-Fallback, `.perspectiveToggle`-Buttons und als Textfarbe auf amber Flächen (Button-Labels, `.badge` — dort korrekt, bleibt)

## Assets — `src/assets/`

`bg-noir.jpg` (768×768, lokal generiert, in `ASSETS.md` lizenzdokumentiert) — bestehende Textur, soll als Tischflächen-Basis weiterverwendet werden. Kein neues Raster-Asset nötig (Projektentscheid).

## Weitere Module (Kontext, keine Änderung erwartet)

- `EventBanner.module.css` — `.stack` (z-index 5) + `.banner` (Edelkarten-Rim) — bleibt im Overlay-Stack
- `MissionPanel.module.css`, `HeatBadge.module.css`, `PursuitBadge.module.css` — Edelkarten/Pills, bereits im neuen Look
- `MapGraph.module.css` — Brett-Anatomie komplett (Pergament, Kartonrand, Brettschatten)
- `DetektivScreen.module.css` — Ergänzungsklassen (Marker, Legendensymbole), nutzt `shared` für Basis
- `boardPieces.module.css`, `MapBackdrop.module.css` — Figuren/Brettdekor im SVG
