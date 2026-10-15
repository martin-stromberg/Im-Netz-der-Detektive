# Detail: Styling-System

## Globale Struktur

- **Kein globales Stylesheet.** `index.html` lädt kein CSS;
  `src/main.tsx` importiert kein CSS. Es existiert **kein** `index.css`
  o. ä. — das komplette Erscheinungsbild liegt in CSS-Modulen.
- `src/App.module.css` (5 Z.): nur `.shell { min-height: 100vh;
  background: #0c0f16 }` als App-Rahmen.
- **CSS-Modules-Konvention:** `<Komponente>.module.css` neben der
  Komponente, `import styles from "./X.module.css"`. Besonderheit:
  `GanoveScreen.module.css` fungiert als **Shared-Theme** und wird von
  nahezu allen Screens als `import shared from "./GanoveScreen.module.css"`
  eingebunden (Basis-Klassen `screen`, `header`, `title`, `subtitle`,
  `statusBar`, `layout`, `mapArea`, `sidebar`, `panel`, `panelHeading`,
  `primaryButton`, `secondaryButton`, `dangerButton`, `confirm`,
  `intelList`, `hint`, `notice`, `legend*`, `outcomeText`).

## CSS-Modul-Matrix

| Modul | Rolle | Verwendet von |
|-------|-------|---------------|
| `GanoveScreen.module.css` (394 Z.) | Shared-Theme + Ganove-Layout | GanoveScreen + alle anderen Screens als `shared` |
| `DetektivScreen.module.css` (167 Z.) | Detektiv-Ergänzungen (steps, markers, inputs, legend swatches) | DetektivScreen, ReplayScreen (`detektivStyles`) |
| `Menu.module.css` (234 Z.) | Menü-Elemente: menuList, cardGrid/card, fieldGrid, Inputs, statGrid, summaryTable, replayControls, perspectiveToggle | MainMenu, MapSelect, ModeSelect, SettingsScreen, MissionSelect, DevModeScreen, StatsScreen, ResumeScreen, ReplayScreen, AppSettingsScreen |
| `MapGraph.module.css` (246 Z.) | SVG-Karte | MapGraph |
| `MapBackdrop.module.css` (34 Z.) | Board-Features | MapBackdrop |
| `MissionPanel.module.css` (98 Z.) | Missions-Panel | MissionPanel |
| `HeatBadge.module.css` (45 Z.) | Heat-Badge | HeatBadge |
| `PursuitBadge.module.css` (51 Z.) | Verfolgungs-Badge | PursuitBadge |
| `EventBanner.module.css` (72 Z.) | Banner-Stack | EventBanner |
| `App.module.css` (5 Z.) | App-Shell | App |

## Theme-Palette (Hex-Literale, keine CSS-Variablen)

Quelle: `GanoveScreen.module.css` Header-Kommentar + Module. Die
Header-Kommentare dokumentieren **gemessene WCAG-AA-Kontraste**
(4,5:1+) — neue Farbpaarungen sollten dieses Niveau halten.

| Token (informell) | Wert | Verwendung |
|-------------------|------|-----------|
| screen-bg | `#0c0f16` | Seitenhintergrund, primärer Button-Text |
| panel-bg | `#161b26` | Panels, Cards, Badges |
| inset-bg | `#10141c` | Kartenfläche, Inputs, Outlines |
| surface-2 | `#1d2534` | Secondary-Button, Notice-BG |
| surface-3 | `#243050` | Hover secondary, Kamera-Body |
| border | `#2a3240` | Standard-Rahmen |
| border-soft | `#3a3f4a` | Neben-Rahmen, blocked edge |
| text | `#eaf0f8` | Haupttext |
| text-2 | `#c8d0dc` | Sekundärtext, nodeDot-Fill |
| muted | `#8a94a6` | Hinweise, Labels, offene Steps |
| accent-blue | `#9db8d9` | Karten-Text, Phase, Detektiv-Outline |
| amber | `#e8b45a` | Titel, Headings, Primary, Ganove, Diebstahl |
| amber-hi | `#f5d76e` | Fokus, aktueller Status, Flash, Fenster |
| green | `#7fd4a8` | Legal/Success/„ruhig" |
| green-hi | `#a8e8c8` | Hover legal |
| red | `#d98c8c` | Gefahr, Block-Glyph, Strike |
| red-bg | `#4a2326`/`#5c2c30` | Danger-Button |
| red-text | `#f0c8c8` / `#e88a7a` | Danger-Label, Fehlerliste |
| det-blue | `#3d5a80` | Detektiv-Figur |
| violet | `#b48ad4` | Marker-Pin, Kontakt |
| info-blue | `#7fb8d4` | Flucht/Info |
| edge-weg | `#4a5568` | Weg-Kanten |
| edge-fahrt | `#7a6a4f` | Fahrt-Kanten |
| orange | `#e8a05a` | „erhöht"/„nah", Kran |
| deduction | `#d4a94f` | possibleRing-Diamant |

Landmark-Palette (`landmarks.tsx` `P`): stone `#c9a86a`, brick `#b0703c`,
plaster `#d8c9a0`, roof `#8c4a3c`, slate `#5a6b7d`, wood `#8a6a45`,
stoneGrey `#9aa4b0`, crane `#e8a05a`, leaf `#4f7a4f`; Outline/Fenster
`#10141c`/`#f5d76e`. Backdrop-Palette: siehe rendering.md.

**Feststellung:** Die Palette ist einheitlich, aber über alle Module
als Literale verstreut — eine Token-Ebene (Custom Properties) existiert
nicht und wäre eine sinnvolle, aber nicht geforderte Zentralisierung.

## Schriften

- **Keine `@font-face`-Deklaration im gesamten Repo** (`grep` negativ).
- **Keine `font-family`-Festlegung** — überall Browser-Default;
  lediglich `font: inherit`-Resets auf Formularelementen.
- Für die geforderte Schmuckschrift: Font-Datei muss neu unter
  `src/assets/` abgelegt, per `@font-face` eingebunden und in
  `src/assets/ASSETS.md` lizenzdokumentiert werden (kein CDN/Hotlink —
  Akzeptanzkriterium 7).

## Assets (`src/assets/`)

| Datei | Verwendung | Einbindung |
|-------|-----------|------------|
| `title-noir.jpg` (768×768) | Titelbild Hauptmenü | `MainMenu.tsx` Import, `.cardImage` |
| `map-muenster.jpg`, `map-luebeck.jpg` (768×768) | Karten-Auswahlkarten | `MapSelect.tsx` `MAP_ART`-Mapping |
| `bg-noir.jpg` (768×768) | Screen-Hintergrundtextur | `GanoveScreen.module.css` `.screen`: `linear-gradient(rgba(12,15,22,.93),rgba(12,15,22,.97)), url(...) center/cover fixed` |
| `case-diebstahlserie-altstadt.jpg`, `case-kurier-am-hafen.jpg` (768×432) | Fallkarten Missionswahl | `caseArt.ts` `CASE_ART["<map>/<case>"]` → `MissionSelect` |

`ASSETS.md` dokumentiert: Generierung via Pollinations.ai (kostenlos,
lokal eingebettet, keine Hotlinks), gemeinsamer Stil-Präfix „noir
detective board game illustration, flat stylized art, deep blue
graphite palette with amber lantern accents, night city atmosphere",
Prompts+Seeds je Datei, Sichtprüfung, Fallback-Strategie. Neue Assets
müssen dort ebenfalls dokumentiert werden.

## Motion / Effekte (Ist-Bestand)

- `markerMove`: 480 ms Transform-Transition (Figuren gleiten).
- `edge-flash` Keyframe 3400 ms; `pursuit-pulse` 1100 ms;
  `splash-in` 2600 ms; `banner-in` 220 ms.
- `box-shadow` nur: EventBanner (`0 4px 16px`), Verfolgungs-Vignette
  (`.mapArea::after` inset). **Keine SVG-Filter, keine Gradients** —
  sämtliche Volumen-/Tiefenwirkung fehlt.
- Alle Animationen respektieren `@media (prefers-reduced-motion:
  reduce)` (vorhanden in MapGraph-, GanoveScreen-, EventBanner-Modulen;
  neue Animationen müssen das fortsetzen — Akzeptanzkriterium 5).
