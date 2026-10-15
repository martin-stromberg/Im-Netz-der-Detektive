# Bestandsaufnahme: UI-Flächen und CSS-Module

## `src/theme.css` — Design-Tokens

Vorhandene, für diesen Schritt relevante Tokens (`:root`):

| Token | Wert | Zweck |
| ----- | ---- | ----- |
| `--color-panel-bg` | `#161b26` | Panel-/Kartenfläche (dunkel) |
| `--color-inset-bg` | `#10141c` | Vertiefte Flächen, Button-Text auf Amber |
| `--color-surface-raised` | `#1d2534` | Erhöhte Fläche (secondaryButton, notice) |
| `--color-surface-hover` | `#243050` | Hover-Hintergrund |
| `--color-border` | `#2a3240` | Standard-Border |
| `--color-text` / `--color-text-secondary` / `--color-text-muted` | `#eaf0f8` / `#c8d0dc` / `#8a94a6` | Textpalette |
| `--color-amber` / `--color-amber-bright` | `#e8b45a` / `#f5d76e` | Akzent, Headings, Primary-Button, Fokus |
| `--color-green` / `--color-heat-raised` / `--color-danger` | `#7fd4a8` / `#e8a05a` / `#d98c8c` | Level-Farbcodierung ruhig→kritisch |
| `--color-danger-surface` / `--color-danger-surface-hover` / `--color-danger-text` | `#4a2326` / `#5c2c30` / `#f0c8c8` | Danger-Button |
| `--color-detective` / `--color-detective-light` | `#3d5a80` / `#9db8d9` | Sekundär-Akzent |
| `--color-cardboard` / `--color-cardboard-edge` | `#6b5335` / `#4a3823` | Brett-Kantenband (Fassungs-Referenz) |
| `--color-table` / `--color-table-edge` | `#191411` / `#0e0b09` | Tischfläche |
| `--color-splash-good-bg` / `--color-splash-bad-bg` / `--color-splash-draw-bg` | rgba-Töne | Splash-Overlay-Hintergründe |
| `--color-banner-bg` | `rgb(16 20 28 / 92%)` | EventBanner-Hintergrund |
| `--color-shadow-soft` | `rgb(0 0 0 / 45%)` | Weicher Schatten |
| `--shadow-panel` | `0 2px 8px rgb(0 0 0 / 40%)` | Panel-Schatten (deklariert, bisher ungenutzt) |
| `--shadow-board` | `0 12px 40px rgb(0 0 0 / 55%)` | Brett-Schatten |
| `--font-display` | IM Fell English + Serif-Fallbacks | Schmuckschrift (lokal via `@font-face`) |

Der Header-Kommentar dokumentiert bereits gemessene WCAG-Kontraste aller
Textfarben — neue Kombinationen müssen dort ergänzt werden.

## `src/components/GanoveScreen.module.css` — Shared-Theme

Wird als `shared` importiert von: `AppSettingsScreen`, `DetektivScreen`,
`DevModeScreen`, `GanoveScreen`, `MainMenu`, `MapSelect`, `MissionSelect`,
`ModeSelect`, `ReplayScreen`, `ResumeScreen`, `SettingsScreen`,
`StatsScreen` (12 Screens — jede UI-Fläche des Spiels).

| Klasse | Ist-Zustand | Verwendung |
| ------ | ----------- | ---------- |
| `.panel` | `background: var(--color-panel-bg); border: 1px solid var(--color-border); border-radius: 8px; padding: 14px` — flach, kein Schatten | `start-panel`, outcome/intel-Panels, alle Sidebar-Sections |
| `.panelHeading` | `font-family: var(--font-display)` bereits gesetzt; amber, uppercase | Panel-Überschriften |
| `.primaryButton` | flach: `background: var(--color-amber)`, 1px-Border, Radius 6; hover+focus tauschen nur Hintergrund | Primäraktionen (z. B. „Neue Partie") |
| `.secondaryButton` | flach: `surface-raised`, 1px-Border `detective`; hover+focus = bg-Tausch + amber-Outline | Sekundäraktionen |
| `.dangerButton` | flach: `danger-surface`; hover+focus analog secondary | Abbruch-/Löschaktionen |
| `.confirm` | `1px dashed var(--color-danger)`, Radius 6 — kein Panel-Look | `abort-confirm`-Rückfrage |
| `.notice` | `border-left: 3px solid danger` + `surface-raised` — Banner-Streifen, kein Kartenlook | `role="alert"`-Hinweise |
| `.splash` + `.splash_escaped/_caught/_surrounded/_timeout/_draw` | Overlay mit 2px-Farbborder, Radius 12, rgba-Hintergrund — kein Schatten | One-shot-Ergebnisansage auf der Karte |
| `.legendItem svg` | Papier-Chip (`--color-paper`-Hintergrund + `--color-cardboard`-Border) — muss erhalten bleiben | Legenden-Swatches |

Fokus-Vertrag: `:focus-visible` liefert Amber-Outlines
(`outline: 2px solid var(--color-amber-bright)`) bzw. Farbtausch —
darf nicht verändert werden.

## `src/components/Menu.module.css` — Menü-/Auswahl-Module

Importiert von allen Menü-Screens (`MainMenu`, `ModeSelect`, `MapSelect`,
`MissionSelect`, `ResumeScreen`, `SettingsScreen`, `AppSettingsScreen`,
`DevModeScreen`, `StatsScreen`, `ReplayScreen`).

| Klasse | Ist-Zustand | Verwendung |
| ------ | ----------- | ---------- |
| `.card` | flach wie `.panel` (panel-bg, 1px-Border, Radius 8); `:hover`/`:focus-visible` färben nur den Border amber; `:focus-visible` zusätzlich amber-Outline | Klickbare Auswahl-Karten (Modus, Karte, Mission, Resume) — `data-testid="map-card-*"` |
| `.cardTitle` | `font-display` bereits gesetzt | Kartentitel |
| `.badge` | kleiner grauer Pill-Tag (`text-muted` bg, `screen-bg` Text) | „dev"-/„forthcoming"-Badge auf Karten |
| `.fieldGrid` | Grid-Layout für Einstellungen | Settings-/AppSettings-/DevMode-Formulare |
| `.numberInput`, `.selectInput` | `screen-bg`-Fläche, 1px-Border, Radius 6; `:focus-visible` = Border amber | Zahlen-/Auswahl-Inputs |
| `.rangeInput` | `accent-color: amber`; `:focus-visible`-Outline | Lautstärke-Slider |
| `.summaryTable` | `border-collapse`, Zellen 1px-Border | DevMode-Verteilung, Stats-Tabelle |
| `.statBox` | flach wie `.panel` | Statistik-Kacheln (`stats-summary`) |
| `.perspectiveToggle` + `button` | Rahmen-Container; Buttons `screen-bg`; `aria-pressed="true"` = amber bg | Ganove/Detektiv-Umschalter (`replay-perspective`, AppSettings) |

## `src/components/MissionPanel.module.css`

| Klasse | Ist-Zustand |
| ------ | ----------- |
| `.panel` | identisch flach wie shared `.panel` |
| `.heading` | `font-display` bereits gesetzt (amber, uppercase) |
| `.choiceButton` | flach wie `secondaryButton` (surface-raised, detective-Border) |
| `.choice` | dashed Top-Border als Trenner |

## `src/components/HeatBadge.module.css` / `PursuitBadge.module.css`

- `.badge`: inline-flex Pill (`border-radius: 999px`), 1px-Border,
  `panel-bg`, `role="status"` im Markup, `data-heat-level` /
  `data-pursuit-level` am Element.
- `.level_ruhig/_aktiv|spuerbar/_erhoeht|nah/_kritisch|unmittelbar`:
  Farbcodierung `green → amber-bright → heat-raised → danger`; die
  kritische Stufe setzt zusätzlich `border-color: danger`
  (form+farbe-kodiert via Balken-/Ring-Glyphen im SVG).
- `.barDim`/`.barLit`, `.ring`/`.dot`/`.ringLit`: SVG-Glyph-Klassen.

## `src/components/EventBanner.module.css`

- `.stack`: absolute Overlay-Liste (`data-testid="event-banner-stack"`,
  `aria-live="polite"`).
- `.banner`: rgba-Hintergrund `--color-banner-bg`, 1px-Border, Radius 8,
  bereits `box-shadow: 0 4px 16px var(--color-shadow-soft)` — einzige
  Fläche mit Schatten.
- `.tone_info/_warn/_alarm/_good`: Icon-Farben; `.tone_alarm` färbt
  zusätzlich den Border (form+farbe).

## `src/components/DetektivScreen.module.css`

- `.commentInput`, `.removeButton`: flache Inputs/Buttons in der
  Marker-Liste (kartenfern — nur im Rahmen der Konsistenz betroffen).
- Legenden-Swatch-Klassen (`legendCamera*`, `legendPin`, `legendDiamond`,
  `legendCategory`): SVG-Fills — nicht Teil der Kartenhaptik.

## Gestalterisches Vorbild im eigenen Code

`MapGraph.module.css .map` zeigt die projekteigene
Mehrschicht-Rand-Technik: `border: 7px solid var(--color-cardboard)` +
`box-shadow: 0 0 0 3px var(--color-cardboard-edge), var(--shadow-board)`
(äußerer Ring via `0 0 0`-Spread + Tischschatten). `.tokenRim`/`.tokenFace`
liefern die Fassungs-/Präge-Metapher (gefasster Rand + erhabene Fläche).
