# Detail: Screens, Panels, Badge-Komponenten

## Screen-Inventar

| Komponente | Datei (Z.) | Rolle | Styling |
|------------|-----------|-------|---------|
| `MainMenu` | `components/MainMenu.tsx` (81) | Einstieg: Titelbild + Menüliste (Neu/Fortsetzen/Stats/Einstellungen) | `shared` + `Menu` |
| `MapSelect` | `components/MapSelect.tsx` (90) | Kartenwahl: `.cardGrid` aus `.card`-Buttons mit `MAP_ART`-Bildern; disabled „in Vorbereitung"-Karten | `shared` + `Menu` |
| `ModeSelect` | `components/ModeSelect.tsx` (63) | Moduswahl (Ganove/Detektiv/Dev) | `shared` + `Menu` |
| `SettingsScreen` | `components/SettingsScreen.tsx` (256) | Partie-Optionen: `RangeField`-Grid (detectiveCount, roundLimit, events) | `shared` + `Menu` |
| `MissionSelect` | `components/MissionSelect.tsx` (254) | Missionswahl: Fallkarten mit `CASE_ART`, Custom-Picker **auf `MapGraph`** | `shared` + `Menu` |
| `GanoveScreen` | `components/GanoveScreen.tsx` (726) | Spielhülle Ganove (s. u.) | `GanoveScreen.module.css` |
| `DetektivScreen` | `components/DetektivScreen.tsx` (712) | Spielhülle Detektiv (s. u.) | `shared` + `DetektivScreen` |
| `DevModeScreen` | `components/DevModeScreen.tsx` (163) | KI-vs-KI-Batch-Übersicht | `shared` + `Menu` |
| `StatsScreen` | `components/StatsScreen.tsx` (241) | Statistik-Boxen + Partienliste + Replay-Einstieg | `shared` + `Menu` |
| `ResumeScreen` | `components/ResumeScreen.tsx` (101) | Gespeicherte Partien | `shared` + `Menu` |
| `ReplayScreen` | `components/ReplayScreen.tsx` (418) | Replay-Player: zwei `MapGraph`-Instanzen (Ganove-/Detektiv-Sicht), `.perspectiveToggle`, `.replayControls` | `shared` + `Menu` + `detektivStyles` |
| `AppSettingsScreen` | `components/AppSettingsScreen.tsx` (104) | App-Einstellungen (Sprache, Lautstärke) | `shared` + `Menu` |

Navigation: State-Maschine in `App.tsx` (`MenuScreen`-Union aus
`menuFlow.ts`), kein Router. Deep-Links `?mode=ganove|detektiv` für
Dev/E2E.

## Spielhüllen-Aufbau (Ganove & Detektiv identisch)

```
div.screen[data-testid][data-view]
├─ header.header
│   ├─ h1.title            (amber, letter-spacing)
│   ├─ p.subtitle          (nur Idle/Setup)
│   └─ div.statusBar       (span.round, span.phase[aria-live],
│                          HeatBadge/PursuitBadge — nur Ganove)
├─ div.layout
│   ├─ div.mapArea[data-pursuit?]
│   │   ├─ MapGraph
│   │   ├─ EventBanner     (absoluter Toast-Stack)
│   │   ├─ div.splash      (Outcome-Ansage, nur Ganove)
│   │   └─ MapLegend / DetectiveMapLegend
│   └─ aside.sidebar       (flex 0 0 320px, .panel-Stapel)
└─ (responsive @900px: Spaltenlayout kollabiert)
```

## Panel-/Element-Klassen (Shared-Theme)

| Klasse | Optik |
|--------|-------|
| `.panel` | `background #161b26; border 1px #2a3240; radius 8px; padding 14px` — flache Dark-Box |
| `.panelHeading` | 0.95 rem, `#e8b45a`, uppercase, letter-spacing .04em |
| `.primaryButton` | Amber solid (`#e8b45a`/`#10141c` Text), 6 px radius; Hover `#f5d76e` |
| `.secondaryButton` | `#1d2534` auf `#3d5a80`-Border; Hover `#243050` + `#f5d76e`-Outline |
| `.dangerButton` | `#4a2326`/`#d98c8c`-Border/`#f0c8c8`-Text |
| `.confirm` | gestrichelte `#d98c8c`-Box (Abort-Bestätigung) |
| `.notice` | linker 3-px-`#d98c8c`-Balken auf `#1d2534` |
| `.hint` | 0.8 rem `#8a94a6` |
| `.intelList` | Chronik-/Feed-Liste |
| `.legend*` | Inline-SVG-Swatches + Text (Weg/Fahrt/Flucht/Detektiv/Ganove/Ziel) |
| `.card` (Menu) | Panel-Optik als `<button>`; Hover amber Border; `:focus-visible` amber Outline; `.cardImage` 16:9 `object-fit: cover` |
| `.fieldGrid`/`.numberInput`/`.selectInput`/`.rangeInput` | Form-Raster; `accent-color: #e8b45a` |
| `.statBox`/`.statList` | Statistik-Kärtchen, dl-Raster |
| `.perspectiveToggle` | Segment-Control, aktiv = amber |
| `.summaryTable` | Tabelle mit `#2a3240`-Zelllinien, amber `th` |
| `.splash*` | Outcome-Overlay über `.mapArea` (escaped/caught/surrounded/timeout/draw — Farbe + Border je Ton) |
| `.mapArea::after` | Verfolgungs-Vignette via `data-pursuit` (inset box-shadow 3–5 px + Glow) |

## Badge-/Feedback-Komponenten

### `HeatBadge` (`HeatBadge.tsx` + `.module.css`)
Pill-Badge `role="status"`, `data-heat-level`. Icon = Inline-SVG
Signalbalken (4 Stufen, `barLit`/`barDim`) + Text „Polizeiaufmerksamkeit:
<Stufe> (Score)". Level-Klassen `level_ruhig|aktiv|erhoeht|kritisch`
(grün → amber → orange → rot; kritisch zusätzlich farbiger Border).

### `PursuitBadge` (`PursuitBadge.tsx` + `.module.css`)
Gleiches Pill-Gehäuse, `data-pursuit-level`. Icon = Zielscheibe (Ring
schrumpft je Nähe; `unmittelbar` = gefüllter Punkt). Levels
`ruhig|spuerbar|nah|unmittelbar`, Text inkl. Detektiv + Distanz.

### `EventBanner` (`EventBanner.tsx` + `.module.css`)
`.stack` absolut oben zentriert über `.mapArea` (`z-index 5`,
`pointer-events: none`, `aria-live="polite"`,
`data-testid="event-banner-stack"`). `.banner` = dunkle Pille
(`rgb(16 20 28 / 92%)`, `box-shadow 0 4px 16px`, 220-ms-Einflug).
Töne `info|warn|alarm|good` mit Symbolglyphen `ℹ ◆ ▲ ✓` — Farbe nie
alleiniges Merkmal. Lebenszyklus (Push + 3600-ms-Expiry, max 3) liegt
im Screen.

### `MissionPanel` (`MissionPanel.tsx` + `.module.css`)
`<section class="panel">` mit eigener Panel-Klasse (Optik parallel zu
`.panel`). Schrittliste `.steps`: Marker `✓ ▶ ○` + Status-Klassen
`status_erledigt` (durchgestrichen!), `status_aktuell`, `status_offen`
— Form + Farbe + Textdeko kombiniert. `.currentTarget`, `.choice`
(Sabotage/Flucht-Binärwahl als volle Breite `.choiceButton`s).
Exportiert zusätzlich `currentMissionTarget()` für das Map-Highlight.

### `MapLegend` / `DetectiveMapLegend`
In `GanoveScreen.tsx` bzw. `DetektivScreen.tsx` definiert; Inline-SVG-
Swatches, die exakt die `MapGraph`-Glyphen spiegeln (`legendWeg`,
`legendFahrt`, `legendEscape`, `legendDetective`, `legendGanove`,
`legendTargetDot/Ring`; Detektiv: `legendCameraBody/Lens`, `legendPin`,
`legendDiamond`, `legendCategory`). **Redesign-Regel:** Legenden müssen
neue Token-/Figuren-Optik nachziehen — sie sind Teil des
„gleiche Form = gleiche Bedeutung"-Vertrags.

## Weitere UI-Details

- `IdleView`/`PickSpawnView`/`OutcomeView` als lokale Sub-Komponenten
  in beiden Spiel-Screens; `data-view="idle|pickSpawn|playing"`.
- Detektiv-Tools: `.toolToggle` (Checkbox `accent-color: #e8b45a`),
  `.markerList`/`.commentInput` (dunkle Textinputs), `.removeButton`.
- Outcome-Splash `.splash_<outcome>` farbcodiert + farbiger Border
  (nicht farb-only).
