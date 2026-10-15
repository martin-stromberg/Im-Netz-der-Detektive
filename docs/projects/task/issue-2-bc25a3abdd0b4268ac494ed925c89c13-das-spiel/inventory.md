# Bestandsaufnahme: Aktueller visueller Stand des Spiels

Analyse des bestehenden UI-/Rendering-Codes bezogen auf die Anforderung
„finales Brettspiel-Design" (`requirement.md`). Fokus: was ist heute
sichtbar, welche Bausteine existieren, welche Konventionen muss neuer
Design-Code einhalten, wo sind die visuellen Lücken.

## Zusammenfassung

- **Konsistentes Dunkel-Noir-Theme vorhanden, aber „Entwickler-Optik":**
  Ein einheitliches Farbsystem (tiefes Blau/Graphit + Bernstein) zieht sich
  durch alle Screens — als `shared`-Import von `GanoveScreen.module.css`
  wiederverwendet. Panels, Buttons, Badges sind flache Dark-UI-Boxen ohne
  Materialität (keine Texturen, keine Schatten, keine Rahmen-Haptik).
- **SVG-Karte ist funktional vollständig, gestalterisch „nackt":**
  `MapGraph` rendert Layer für Board-Geographie, Kanten, Landmarken,
  Knoten und Marker — aber Orte sind flache `r=8`-Punkte, Figuren flache
  Rechteck-/Rauten-Symbole, Kanten einfache Striche. Keine SVG-Filter,
  keine Gradients, keine Schatten im gesamten Codebestand.
- **Keine Schriften eingebettet:** Es gibt keine `@font-face`-Deklaration
  und keine `font-family`-Festlegung — überall Browserschrift. Für die
  geforderte Schmuckschrift muss eine lizenzierte Font-Datei neu ins Repo
  (Einbindung via Vite, Lizenz in `src/assets/ASSETS.md`).
- **Kein Design-Token-System:** Farben sind als Hex-Literale über ~10 CSS
  Module verteilt (teils mehrfach identisch). Eine Zentralisierung
  (CSS Custom Properties) wäre Neuland, ist aber keine Vorgabe.
- **Starke Bausteine schon vorhanden:** 14 handgezeichnete
  Comic-Landmark-Glyphen (`landmarks.tsx`), datengetriebene
  Board-Geographie (`MapBackdrop` + `board.features` im Kartenpaket),
  KI-generierte Noir-Rastergrafiken (Titel, Karten, Fallbilder,
  Hintergrundtextur) mit dokumentierter Lizenz, formkodierte
  Status-Symbolik (Missions-Badges, Blockade-Kreuz, Kamera, Pin).
- **Harte Einschränkungen:** strukturelle Perspektiven-Asymmetrie
  (MapGraph hat keine leakfähigen Props), Farbe nie alleiniges
  Unterscheidungsmerkmal, Tastatur-Bedienbarkeit der Knoten
  (Hit-Area `r=14`, Pfeiltasten-Roaming), `prefers-reduced-motion`,
  i18n-Zwang (`no-hardcoded-strings-check` blockiert), `data-*`-Selektoren
  sind Testvertrag (Vitest + Playwright greifen massiv darauf zu).

## 1. Rendering-Stack (SVG-Karte)

`src/components/MapGraph.tsx` (433 Z.) — gemeinsame SVG-Karte für beide
Perspektiven, Replay und Missions-Picker. Feste Layer-Reihenfolge im
`<svg viewBox={map.viewBox}>` (unten → oben):

| Layer | Element | Inhalt |
|-------|---------|--------|
| `board` | `<MapBackdrop>` | Dekorative Stadtgeographie aus `map.board.features` (water/park/rail/street/block-Pfade) |
| `edges` | `<g data-layer="edges">` | `<line>` je Kante: `weg` solid, `fahrt` dick+gestrichelt, blocked grau + Kreuz-Glyphe, `edgeFlash` Bernstein-Puls |
| `landmarks` | `<g data-layer="landmarks">` | `<LandmarkGlyph>` pro `node.landmark` — 14 Comic-Gebäude |
| `nodes` | `<g data-layer="nodes">` | `<g data-node-id>` mit unsichtbarer Hit-Area (r14), `.nodeDot` (r8), Label-`<text>`, Overlay-Ringe/Badges |
| `markers` | `<g data-layer="markers">` | Detektiv-Marker (blaues `rect` + Index-Text), Ganove-Marker (Bernstein-Raute), Inline-`transform` + `markerMove`-Transition (480 ms Gleiten) |

Details (Overlays, Glyphen-Pfade, Tastatur-Roaming, Pointer-Events-
Konvention, Backdrop/Landmark-Aufbau): [inventory/rendering.md](inventory/rendering.md)

Zugehörige CSS-Module: `MapGraph.module.css`, `MapBackdrop.module.css`.

## 2. Styling-System

- **Kein globales Stylesheet:** Es gibt kein `index.css`; `App.module.css`
  enthält nur `.shell` (`background: #0c0f16`). `index.html` bindet kein
  CSS — das Theme lebt ausschließlich in CSS-Modulen.
- **Konvention „shared-Modul":** `GanoveScreen.module.css` ist das
  Quasi-Theme und wird von fast allen Screens als `shared` importiert;
  screenspezifische Module (`DetektivScreen.module.css`, `Menu.module.css`)
  ergänzen. Header-Kommentar dokumentiert die Palette samt gemessener
  WCAG-Kontraste (alle ≥ AA).
- **Palette:** Hex-Literale, keine CSS-Variablen. Kern: `#0c0f16`
  (Screen), `#161b26` (Panel), `#10141c` (Inset/Karte), `#2a3240`
  (Border), `#eaf0f8/#c8d0dc/#8a94a6` (Text-Stufen), `#e8b45a/#f5d76e`
  (Bernstein), `#7fd4a8` (Grün), `#d98c8c` (Rot), `#3d5a80/#9db8d9`
  (Detektiv-Blau), `#b48ad4` (Violett), `#7fb8d4` (Hellblau).
- **Fonts:** keine `@font-face`, keine `font-family` — Browserschrift.
- **Assets:** `src/assets/` — 6 lokale JPGs (Noir-Titel, 2 Kartenkarten,
  Hintergrundtextur `bg-noir.jpg`, 2 Fallbilder) + `caseArt.ts`-Mapping +
  `ASSETS.md` (Pollinations.ai-Generierung, Prompts/Seeds, Lizenznotiz).
  `bg-noir.jpg` liegt als `cover`-Textur unter 93–97 % Dunkel-Overlay in
  `.screen`.

Palette komplett + Asset-Tabelle: [inventory/styling.md](inventory/styling.md)

## 3. Screens / Panels

- **Layout-Muster (beide Spiel-Screens):** `.screen` → `.header`
  (Titel + `.statusBar` mit Runde, Phase, Badges) → `.layout` (flex):
  `.mapArea` (Karte + Legende + Banner/Splash-Overlays) + `.sidebar`
  (320 px, `.panel`-Karten). Breakpoint 900 px stapelt vertikal.
- **GanoveScreen** (`GanoveScreen.tsx`, 726 Z.): Idle → Spawn-Wahl →
  Playing; Sidebar = `MissionPanel`, Missions-Button, Intel-Feed,
  Radio/Save/Abort-Buttons; `data-pursuit`-Vignette und Outcome-Splash
  über der Karte.
- **DetektivScreen** (`DetektivScreen.tsx`, 712 Z.): gleiche Hülle;
  Sidebar = Missions-Struktur (ohne Ziele), Deduktions-Tools
  (Overlay-Toggle, Marker-Modus, Kommentarliste), Chronik, Save/Abort.
- **Menüfluss** (`App.tsx` State-Maschine, kein Router): `MainMenu`,
  `MapSelect` (Kartenkarten mit Artwork), `ModeSelect`, `SettingsScreen`
  (Range-Fields), `MissionSelect` (Fallkarten + `CASE_ART` +
  Custom-Picker auf `MapGraph`), `DevModeScreen`, `StatsScreen`,
  `ResumeScreen`, `ReplayScreen` (zwei `MapGraph`-Instanzen),
  `AppSettingsScreen` — alle im selben Panel/Karten-Stil.
- **Badge-Komponenten:** `HeatBadge` (Signalbalken-Icon + Text,
  `role="status"`), `PursuitBadge` (Ring/Punkt-Icon + Text),
  `EventBanner` (absoluter Toast-Stack über `.mapArea`, 4 Töne mit
  Symbolglyphen), `MissionPanel` (Schrittliste ✓▶○ + Wahl-Buttons),
  `MapLegend`/`DetectiveMapLegend` (Inline-SVG-Legenden).

Details je Screen/Panel/Elementklasse: [inventory/screens.md](inventory/screens.md)

## 4. Tests & Infrastruktur (Design-relevante Einschränkungen)

- **Unit:** Vitest + Testing-Library; DOM-Tests per Pragma
  `// @vitest-environment jsdom` (Konvention: co-located `*.test.tsx`);
  Setup `src/test/setup.ts` (jest-dom, Store-/Prefs-Reset). Coverage-
  Threshold **70 % Lines** (`vite.config.ts`).
- **E2E:** Playwright (`e2e/*.spec.ts`, nur Chromium, Dev-Server
  auto-gestartet). Determinismus über `?map=`/`?seed=`; Store-Snapshot
  via DEV-only `window.__gameStore`; Klicks über echte DOM-Selektoren.
- **Selektor-Vertrag:** Tests/E2E adressieren `data-testid`,
  `data-node-id`, `data-edge`, `data-edge-type`, `data-blocked`,
  `data-legal-target`, `data-selectable`, `data-markable`,
  `data-mission-step`, `data-step-status`, `data-category`,
  `data-camera`, `data-marker`, `data-escape-node`, `data-detective`,
  `data-ganove`, `data-pursuit`, `data-landmark`, `data-view` u. a.
  — **beim Redesign erhalten bzw. Tests anpassen.**
- **Git-Hooks (`.githooks/`):** `i18n-check.py` (Key-Parität de/en +
  jeder `t()`-Key existiert — blockierend), `no-hardcoded-strings-
  check.py` (keine sichtbaren String-Literale/Attribute in `.tsx`;
  Escape-Hatch `i18n-allow` — blockierend), `map-schema-check.py`,
  `no-math-random-check.py`, `no-stub-check.py` (pre-push strikt),
  `component-usage-check.py` (pre-push strikt), Prettier auf staged
  Files (blockierend). Install via `install-hooks.sh/.cmd`.
- **i18n:** `src/i18n/{de,en}.json` (je 273 Z., paritätisch), `t(key,
  params)` + `resolveText` für Datenpaket-Schlüssel; Sprache aus
  `useUiPrefs`, Laufzeit-Switch.

Details + konkrete Check-Verhaltensweisen:
[inventory/conventions.md](inventory/conventions.md)

## 5. Visuelle Stärken / Schwächen (vs. Anforderung)

**Schon „brettspielig" / aufbaubar:**

- Comic-Geographie-Layer (Wasser/Park/Schienen/Straßen/Blöcke) +
  14 Landmark-Miniaturen geben der Karte Ortscharakter.
- Noir-Artworks (Titel, Karten-, Fallbilder, Textur) bereits lokal,
  lizenzdokumentiert, stilistisch einheitlich.
- Formkodierte Symbolsprache (Missions-Badges, Blockade-Kreuz, Kamera,
  Pin, Diamant-Ring) — entspricht bereits der „nicht nur Farbe"-Regel.
- Marker-Gleitanimation + Verfolgungs-Vignette + Outcome-Splash geben
  der Karte schon „Inszenierung".

**Lücken (decken sich mit den benannten Requirements):**

- **Materialität:** Karte = flache `#10141c`-Fläche mit 1-px-Border —
  keine Papier-/Pappen-Textur, kein Brett-Rahmen, kein Tisch-Schatten;
  Screens schweben frei (keine „Spieltisch"-Komposition).
- **Figuren:** Detektiv = flaches `rect`, Ganove = flache Raute — keine
  Meeple/Steine, kein Volumen, kein Schlagschatten, keine Standfläche.
- **Tokens:** Knoten sind nackte `r=8`-Kreise — keine Plaketten
  (Prägung/Rand/Fassung).
- **Wege:** Kanten sind 1–3,5-px-Striche — keine gezeichneten
  Straßen/Routen-Optik, keine doppelten Fahrbahnen etc.
- **Typografie:** keine eingebettete Schmuckschrift (kein `@font-face`
  im Repo).
- **Panels:** flache Dark-Boxen, uniformer 1-px-Border — keine
  Karten-Haptik; Badges/Buttons sind generische Pills.
- **Technisch fehlend:** keinerlei SVG-`filter`/`linearGradient`/
  `radialGradient`, `box-shadow` nur an Banner/Vignette; keine
  Texturen außer dem Screen-Hintergrundfoto.

## 6. Wiederverwendbare Bausteine

- `missionBadgePath()` in `MapGraph.tsx` — formkodierte Glyphen-Pfade
  (Raute/Quadrat/Dreieck/Fahne), parametrisierbar.
- `landmarks.tsx` — Glyph-Bibliothek + abgestimmte Bau-Palette `P`
  (Sandstein/Backstein/Schiefer/Holz …) und Stroke/Fenster-Konstanten
  `S`/`WIN`; Muster „36×32-Box, Fußpunkt am Ursprung" wiederverwendbar
  für Tokens/Figuren.
- `MapBackdrop` + `board.features`-Datenmodell — dekorative
  Kartenebenen kommen aus dem Kartenpaket-JSON (schema-validiert,
  `kind: "shape"` offen für Erweiterungen wie Textfelder).
- `caseArt.ts` — Mapping-Muster `mapId/caseId → import` für Artworks.
- `zoneHue()` — deterministische HSL-Farbe je Zone (Halo).
- `markerMove`-Transition + Inline-`transform`-Positionierung —
  Figuren gleiten entlang der Karte.
- `shared`-CSS-Modul-Importmuster — ein Theme-Modul für alle Screens.
- Raster-Assets in `src/assets/` — wiederverwendbar als
  Texturen/Rahmen-Motive (lizenzgeklärt).
- `data-*`-Attribut-Konvention + Legenden-SVG-Swatches
  (`MapLegend`, `DetectiveMapLegend`).

## Detailanlagen

- [inventory/rendering.md](inventory/rendering.md) — MapGraph-Layer,
  Knoten/Marker/Kanten im Detail, Landmark-System
- [inventory/styling.md](inventory/styling.md) — Palette (alle Werte),
  CSS-Modul-Matrix, Fonts, Assets/ASSETS.md
- [inventory/screens.md](inventory/screens.md) — Screen-/Panel-Aufbau,
  Badge-Komponenten, CSS-Klassenverzeichnis
- [inventory/conventions.md](inventory/conventions.md) — Test-Setup,
  Selektor-Vertrag, Hook-Checks, A11y-/Redesign-Regeln
