# Projektplan — Finales Brettspiel-Design „Im Netz der Detektive"

## Übersicht

**Titel:** Finales Brettspiel-Design (Projektabschluss)

**Gesamtziel:** Das Spiel „Im Netz der Detektive" (React 18 + TypeScript +
Vite, SVG-Kartenrendering in `MapGraph`, CSS-Module ohne globales
Stylesheet) erhält einen durchgängigen, vollständigen Brettspiel-Look nach
dem Vorbild moderner Brettspiel-Computervarianten. Konkret werden die
sechs benannten Lücken geschlossen — Papier-/Pappen-Materialität des
Bretts, greifbare Meeple-Figuren statt abstrakter Marker, Orts-Tokens
statt nackter Punkte, gezeichnete Routen statt technischer Linien, lokal
eingebettete Schmuckschrift, kartenartige Panels — plus die
Gesamtkomposition als „Spieltisch" und durchgehende Konsistenz über alle
Screens. Spielmechanik, Datenmodell und der `data-*`-Selektor-Vertrag der
Tests bleiben unangetastet.

**Bereiche:**

- SVG-Kartenrendering: `src/components/MapGraph.tsx`,
  `MapGraph.module.css`, `MapBackdrop.tsx`/`MapBackdrop.module.css`,
  `landmarks.tsx`, neue Glyph-/Defs-Module.
- Panel-/UI-Komponenten und Screen-Hüllen: `GanoveScreen`,
  `DetektivScreen`, alle Menü-/Meta-Screens (`MainMenu`, `MapSelect`,
  `ModeSelect`, `SettingsScreen`, `MissionSelect`, `DevModeScreen`,
  `StatsScreen`, `ResumeScreen`, `ReplayScreen`, `AppSettingsScreen`),
  Badge-Komponenten (`HeatBadge`, `PursuitBadge`, `EventBanner`,
  `MissionPanel`, Legenden).
- Styling-Infrastruktur: neues globales Theme-Stylesheet,
  `GanoveScreen.module.css` (Shared-Theme), `Menu.module.css`,
  `App.module.css`.
- Assets: `src/assets/fonts/` (neue WOFF2), `src/assets/ASSETS.md`.
- Tests: `src/test/`, co-located `*.test.tsx`, `e2e/` — nur anpassen,
  wo der Selektor-Vertrag tangiert ist (Ziel: gar nicht).

## Grobe Vorgehensentscheidungen

1. **Prozedurale SVG-Texturen/Gradients statt Raster-Assets.**
   Papier-Körnung, Prägung und Volumen werden über SVG-`<defs>`
   (`feTurbulence`-basierte Noise-Filter, `linearGradient`/
   `radialGradient`, ggf. dezenter `feDropShadow`) erzeugt, nicht über
   eingebettete Rasterbilder. Begründung: kein Lizenzrisiko und kein
   Asset-Gewicht, perfekte Skalierung auf die drei unterschiedlichen
   `viewBox`-Größen der Kartenpakete (1000×800, 800×600, 100×100),
   stilistisch konsistent mit den bereits vorhandenen handgezeichneten
   Landmark-Glyphen. Fallback (falls Performance-Probleme auf schwachen
   Geräten auftreten): lokal generierte PNG-Textur mit dokumentierter
   Herkunft — kein Hotlink.

2. **Zentrales Theme-Stylesheet mit CSS Custom Properties.** Es gibt
   heute kein globales Stylesheet (`index.html` lädt kein CSS;
   `main.tsx` importiert keins); Farben liegen als Hex-Literale über
   ~10 CSS-Module verstreut. Es wird ein neues `src/theme.css`
   angelegt und in `src/main.tsx` importiert, das die komplette
   bestehende Palette **unverändert** als Custom Properties auf
   `:root` definiert und um Brettspiel-Tokens (Papier-, Pappen-,
   Tisch-Töne, Schatten) erweitert. CSS-Module werden dort auf
   `var()` umgestellt, wo ein Schritt sie ohnehin anfasst — keine
   Big-Bang-Migration. Begründung: verhindert Farb-Drift beim
   Redesign, macht die dokumentierten WCAG-AA-Paare zentral
   nachvollziehbar, bricht keinen Selektor (reine Wert-Ebene).

3. **Schmuckschrift als lokale WOFF2 unter `src/assets/fonts/`.**
   Eine OFL-lizenzierte Serifen-/Karten-Schrift (Zielkandidat:
   „IM Fell English" oder „Playfair Display" — beide SIL OFL) wird als
   WOFF2-Datei ins Repo gelegt, per `@font-face` in `theme.css`
   eingebunden und auf Titel/Überschriften angewendet; Fließtext
   bleibt Systemschrift (Lesbarkeit). Lizenz und Herkunft werden in
   `src/assets/ASSETS.md` dokumentiert. Begründung: Akzeptanzkriterium
   verlangt lokale Einbettung ohne CDN/Hotlink; OFL ist risikofrei und
   etabliert.

4. **Wiederverwendbares Glyph-/Token-Modul nach dem
   `landmarks.tsx`-Muster.** Meeple-Figuren, Orts-Tokens und ggf.
   Routen-Bausteine werden in einem neuen Modul (z. B.
   `src/components/boardPieces.tsx`) als parametrisierte SVG-Glyphen
   gebaut — gleiche Konvention wie `landmarks.tsx` (lokale Box,
   Fußpunkt am Ursprung, `aria-hidden`-Deko) plus einem pro
   `MapGraph`-Instanz eingebundenen `<defs>`-Block für Filter/
   Gradients. Begründung: hält `MapGraph.tsx` lesbar, macht die
   neuen Formen für die Legenden (`MapLegend`/`DetectiveMapLegend`
   spiegeln die Karten-Glyphen 1:1) direkt wiederverwendbar. Das
   Datenmodell (`mapPack.ts`, `board.features`, `logic/`) bleibt
   vollständig unverändert — Tokens/Figuren sind reine Darstellung.

5. **Layer-für-Layer-Einführung unter Wahrung des
   `data-*`-Testvertrags.** Die Layer-Reihenfolge von `MapGraph`
   (`board` → `edges` → `landmarks` → `nodes` → `markers`) und alle
   `data-*`-Attribute bleiben identisch; das Redesign ersetzt die
   **innere** Geometrie der Elemente (z. B. `nodeDot` wird zur
   Plakette, `detectiveMarker` zum Meeple), ohne Attribute,
   Hit-Areas oder Interaktionsstruktur zu ändern. Neue Deko-Elemente
   tragen keine kollidierenden Selektoren, sind `aria-hidden` und
   folgen der Pointer-Events-Konvention (nur `.hitArea` fängt Zeiger).
   Begründung: Vitest + Playwright greifen massiv auf `data-testid`,
   `data-node-id`, `data-edge(-type)`, `data-detective`,
   `data-ganove`, `data-layer` u. a. zu — Strukturerhalt macht das
   Redesign testneutral.

6. **Spieltisch-Komposition primär über CSS, nicht über
   DOM-Umbau.** Tischfläche, Brett-Rahmen und Panel-Kartenhaptik
   werden über `box-shadow`, mehrfach gestaffelte Borders/Outlines,
   Border-Radien und die vorhandene `bg-noir`-Textur (oder eine
   lokale/generierte Alternative) erreicht. Die Screen-Hülle
   (`.screen → .header → .layout → .mapArea + .sidebar`, Breakpoint
   900 px) bleibt strukturell bestehen. Begründung: minimiert das
   Risiko, `data-view`/`data-testid`-Träger oder die
   Tastatur-Fokus-Reihenfolge zu verletzen.

7. **Verhaltens-Contracts sind nicht verhandelbar und gelten pro
   Schritt:** keine Info-Leaks (keine neuen Render-Pfade für
   gegnerische Informationen; `MapGraph` bekommt keine leakfähigen
   Props), Farbe nie alleiniges Unterscheidungsmerkmal (neue
   Tokens/Figuren zusätzlich über Form/Symbol/Label), Hit-Area
   (r = 14) bleibt größer als sichtbare Geometrie,
   `prefers-reduced-motion` für alle neuen Animationen, i18n-Parität
   ohne hartcodierte sichtbare Strings, kein `Math.random()`,
   keine neuen Laufzeit-Dependencies, WCAG-AA-Kontraste halten und
   in den Header-Kommentaren dokumentieren.

## Entwicklungsschritte

### Schritt 1: Design-Fundament — Theme-Stylesheet, CSS-Variablen und eingebettete Schmuckschrift

**Beschreibung:** Lege ein globales Stylesheet `src/theme.css` an und
importiere es in `src/main.tsx` (aktuell existiert kein globales CSS).
Definiere darin auf `:root` CSS Custom Properties für die vollständige
Bestandspalette — Werte unverändert aus `GanoveScreen.module.css`
übernehmen (u. a. `#0c0f16` screen-bg, `#161b26` panel-bg, `#10141c`
inset-bg, `#2a3240` border, `#eaf0f8`/`#c8d0dc`/`#8a94a6` Text-Stufen,
`#e8b45a`/`#f5d76e` amber, `#7fd4a8` grün, `#d98c8c` rot, `#3d5a80`/
`#9db8d9` detektiv-blau) — ergänzt um neue Brettspiel-Tokens
(Papier-, Pappen-, Tisch-, Schatten-Töne; Dokumentation der WCAG-AA-
konformen Paarungen ≥ 4,5:1 als Kommentar, analog zum Bestand).
Bette eine OFL-lizenzierte Schmuckschrift als WOFF2 ein: Datei unter
`src/assets/fonts/` ablegen, `@font-face` in `theme.css`, Anwendung auf
Titel/Überschriften (`.title`, `.panelHeading`, Menü-Titel und
vergleichbare Headings) mit Serifen-/System-Fallback; Fließtext bleibt
unverändert Systemschrift. Dokumentiere Font-Name, Quelle, Lizenz
(SIL OFL) und Version in `src/assets/ASSETS.md`. Stelle die Shared-
Theme-Datei `GanoveScreen.module.css` und dort, wo sinnvoll, weitere
Module schrittweise auf `var()` um — ohne Klassennamen, Struktur oder
`data-*`-Attribute zu ändern.

**Akzeptanzkriterien:**

- `theme.css` wird in `main.tsx` importiert; Custom Properties sind auf
  `:root` gesetzt und werden mindestens im Shared-Theme verwendet.
- Schmuckschrift ist auf Titeln/Überschriften aller Screens sichtbar;
  WOFF2 liegt lokal im Repo; kein CDN-/Hotlink-Font-Request.
- `src/assets/ASSETS.md` enthält einen Eintrag mit Font-Name, Quelle,
  Lizenz und Version.
- Kein sichtbarer hartcodierter Text neu eingeführt; keine Änderung an
  `data-*`-Attributen, Layout-Struktur oder Spiellogik; bestehende
  Vitest-Suite und Hook-Checks (i18n, no-hardcoded-strings) grün.
- Neue/angepasste Text-Fläche-Paarungen erreichen WCAG AA (≥ 4,5:1)
  und sind als Kommentar dokumentiert.

**Abhängigkeiten:** —

**Betroffene Bereiche:** `src/theme.css` (neu), `src/main.tsx`,
`src/assets/fonts/` (neu), `src/assets/ASSETS.md`,
`src/components/GanoveScreen.module.css` (Shared-Theme), ggf. weitere
CSS-Module.

### Schritt 2: Brett-Materialität — Papierfläche, Pappenrand und Tischschatten der SVG-Karte

**Beschreibung:** Verwandle die `.map`-Fläche von `MapGraph`
(`data-testid="map-graph"`, `viewBox` aus dem Kartenpaket) in ein
physikalisch wirkendes Spielbrett: Papier-getönte Grundfläche mit
prozeduraler Körnung über einen SVG-`<defs>`-Block
(`feTurbulence`-Noise, dezente Vignette via `radialGradient`),
sichtbarer Pappen-/Holzrand (kräftige, mehrstufige Umrandung) und
Drop-Shadow, sodass das Brett „auf dem Tisch liegt" (`box-shadow` auf
`.map`-Ebene). Passe die `MapBackdrop`-Palette (`water`/`park`/`rail`/
`street`/`-block`-Styles) an die neue Brett-Tönung an, sodass die
Geographie lesbar bleibt. Ziel-Stilrichtung: detektivisch-vintage
(alte Stadt-/Pergamentkarte), abgestimmt auf die vorhandenen
warmen Landmark-Farben und das Noir-Artwork. Layer `data-layer="board"`
und die übrige Layer-Reihenfolge bleiben; keine Änderung an
Hit-Areas, `data-*`-Attributen oder Props. Ortslabels und Overlays
müssen auf der neuen Fläche kontraststark bleiben (Textfarbe ggf.
angleichen). Alle Änderungen wirken automatisch auf beiden
Perspektiven, dem Replay (2 Instanzen) und dem
MissionSelect-Custom-Picker, da alle `MapGraph` nutzen.

**Akzeptanzkriterien:**

- Die Karte zeigt sichtbar Papier-Textur, Pappenrand und Schlagschatten
  auf allen `MapGraph`-Einsätzen (Ganove, Detektiv, Replay×2,
  MissionSelect).
- `data-layer`-Struktur, `data-testid="map-graph"`, `viewBox`,
  `data-board-style` und sämtliche Knoten-/Kanten-Attribute unverändert.
- Ortslabels, Zonen-Halos und Overlay-Glyphen erfüllen weiterhin
  WCAG AA; Blockade-Kreuz und Kategorien bleiben formkodiert erkennbar.
- Keine neuen sichtbaren Strings; keine Logik-/Datenänderung; Tests
  und `map-schema-check` grün; `prefers-reduced-motion`-Verhalten
  unverändert.

**Abhängigkeiten:** 1

**Betroffene Bereiche:** `src/components/MapGraph.tsx`,
`MapGraph.module.css`, `MapBackdrop.tsx`/`MapBackdrop.module.css`,
`src/theme.css`.

### Schritt 3: Orts-Tokens — Knoten als geprägte Plaketten statt Punkte

**Beschreibung:** Ersetze die nackten `r=8`-`nodeDot`-Kreise in
`MapGraph` durch Orts-Tokens/Plaketten mit Kartenhaptik: Fassung/Rand
(z. B. doppelter Ring oder eingefasste Kappe), Volumen via
`radialGradient`-Prägung, dezenter Schatten; pro Stationstyp bzw. Zustand
darf die Form zusätzlich differenziert werden (Farbe bleibt nie
alleiniges Merkmal). Die unsichtbare Hit-Area (`r=14`,
`pointer-events: all`) bleibt unverändert und größer als die sichtbare
Token-Geometrie; alle Overlays behalten Position und Funktion:
`zoneHalo` (r = 13), `legalRing`, `possibleRing`-Diamant,
`categoryBadge`, `cameraGlyph`, `markerPin`, `escapeMarker`,
`missionBadge`, `nodeLabel`. Zustände `nodeLegal`/`nodeSelectable`/
Fokus bleiben über Form + Farbe erkennbar (gestrichelter/grüner Ring
plus Rand-Wechsel), `:focus-visible` behält den amber-Ring. Passe die
Legenden-Swatches in `MapLegend`/`DetectiveMapLegend`
(`legendTargetDot`/`legendTargetRing`) an die Token-Optik an —
„gleiche Form = gleiche Bedeutung" muss zwischen Karte und Legende
gelten.

**Akzeptanzkriterien:**

- Orte werden als plakettenartige Tokens mit Rand/Prägung gerendert,
  nicht als flache Punkte; Labels bleiben lesbar (AA).
- `data-node-id`, `data-legal-target`, `data-selectable`,
  `data-markable`, `data-possible`, `data-zone`, `data-category`,
  `data-camera(-active)`, `data-marker`, `data-escape-node`,
  `data-mission-target` unverändert; Hit-Area `r=14` erhalten; nur
  Hit-Area fängt Pointer.
- Tastatur-Roaming (Pfeiltasten) und `:focus-visible` funktionieren wie
  zuvor; Legenden spiegeln die neue Token-Form.
- Vitest/Playwright grün; keine Info-Leaks (keine neuen gegnerischen
  Render-Pfade).

**Abhängigkeiten:** 2

**Betroffene Bereiche:** `src/components/MapGraph.tsx`,
`MapGraph.module.css`, Legenden in `GanoveScreen.tsx`/
`DetektivScreen.tsx`, ggf. neues Glyph-Modul `boardPieces.tsx`,
`src/theme.css`.

### Schritt 4: Spielfiguren — Detektive und Ganove als Meeple-Spielsteine

**Beschreibung:** Baue in einem neuen Modul `src/components/boardPieces.tsx`
(nach `landmarks.tsx`-Konvention: lokale Glyph-Box, Fußpunkt am
Ursprung, `aria-hidden`) Meeple-Figuren: stehende Figuren-Silhouetten
mit Körper-Gradient (Volumen), Schlagschatten und Standfläche/Sockel-
Ellipse. Detektiv- und Ganove-Figur unterscheiden sich über
**Silhouette + Farbe + Beschriftung** (Detektiv behält den Index-Text,
Ganove eine eigene Form, z. B. Mantel-/Hut-Profil statt Raute) — Farbe
ist nie alleiniges Merkmal. Ersetze in `MapGraph` den `detectiveMarker`
(flaches `rect`) und den `ganoveMarker` (Raute) durch die neuen
Figuren, behalte aber Attribute (`data-detective`,
`data-active-detective`, `data-ganove`), die Inline-`transform`-
Positionierung (`translate(x, y-16)`) und die `markerMove`-Transition
(480 ms Gleiten, deaktiviert bei `prefers-reduced-motion`) bei.
`detectiveActive` bekommt eine deutliche, formbasierte
Hervorhebung (z. B. zusätzlicher Sockel-Ring/Fahne) plus amber-Akzent.
Aktualisiere die Legenden-Icons (`legendDetective`, `legendGanove`)
auf Miniaturansichten der neuen Figuren.

**Akzeptanzkriterien:**

- Beide Figurentypen wirken als greifbare Spielsteine (Volumen,
  Schatten, Standfläche) und sind über Form + Farbe + Index/Text
  unterscheidbar.
- `data-detective`, `data-active-detective`, `data-ganove` sowie die
  Sichtbarkeitslogik (`ganovePosition` nur Ganove-Perspektive) bleiben
  unverändert — kein Info-Leak.
- Gleitanimation funktioniert weiter und respektiert
  `prefers-reduced-motion`; aktive Detektiv-Figur nicht nur über Farbe
  erkennbar; Legenden konsistent.
- Vitest/Playwright grün; `component-usage-check` erfüllt (neues Modul
  referenziert).

**Abhängigkeiten:** 2

**Betroffene Bereiche:** `src/components/boardPieces.tsx` (neu),
`src/components/MapGraph.tsx`, `MapGraph.module.css`, Legenden in
`GanoveScreen.tsx`/`DetektivScreen.tsx`, `src/theme.css`.

### Schritt 5: Routen als gezeichnete Wege statt technischer Linien

**Beschreibung:** Gestalte die Kanten in `MapGraph`
(`<g data-edge>`, `data-edge-type="weg|fahrt"`) als gezeichnete
Kartenwege: `weg` als lesbarer Straßen-/Pfadstrich mit Kartencharakter
(z. B. heller Grundstrich mit dunkler Kontur oder konturiertem
Doppelstrich, `linecap: round`, angemessen erhöhte Strichstärke),
`fahrt` als kräftigere, anders gemusterte Verbindung (z. B. Trasse/
Kutschenroute — breiter, eigenes Muster statt bloßem `dasharray`).
Blockierte Kanten behalten das formkodierte Kreuz-Glyph
(`data-block-glyph`) und erkennbare Musterung; `edgeFlash`-Puls bleibt
und respektiert `prefers-reduced-motion`. Kantentypen bleiben über
Muster **und** Form **und** Farbe unterscheidbar (nicht farb-only).
Handdrawn-Anmutung dezent und deterministisch — kein `Math.random()`,
kein `feTurbulence`-Displacement, falls es Performance oder
Hit-Test-Stabilität gefährdet (Kanten fangen ohnehin keine Pointer).
Passe `legendWeg`/`legendFahrt`-Swatches in beiden Legenden an.

**Akzeptanzkriterien:**

- Routen wirken wie gezeichnete Wege auf einer Karte (Breite, Kontur,
  Muster), nicht wie 1-px-Drahtlinien; `weg`/`fahrt`/blockiert bleiben
  über Muster+Form+Farbe unterscheidbar.
- `data-edge`, `data-edge-type`, `data-blocked`, `data-block-glyph`
  und die Kanten-DOM-Struktur bleiben; `edgeFlash` funktioniert und
  respektiert Reduced Motion.
- Legenden-Swatches aktualisiert; WCAG-relevante Lesbarkeit auf dem
  Papier-Untergrund gegeben; Vitest/Playwright grün.

**Abhängigkeiten:** 2

**Betroffene Bereiche:** `src/components/MapGraph.tsx`,
`MapGraph.module.css`, Legenden in `GanoveScreen.tsx`/
`DetektivScreen.tsx`, `src/theme.css`.

### Schritt 6: Kartenartige Panels und UI-Elemente (Shared-Theme)

**Beschreibung:** Gib allen UI-Flächen Karten-/Spielkartenhaptik im
Shared-Theme `GanoveScreen.module.css` und den Spezial-Modulen:
`.panel`, `.panelHeading`, `.card` (Menu), Buttons
(`primaryButton`/`secondaryButton`/`dangerButton`), `.confirm`,
`.notice`, `.statBox`, `.fieldGrid`-Inputs, `.summaryTable`,
`.perspectiveToggle`, Splash-Overlays sowie die Komponenten-Module
`MissionPanel.module.css`, `HeatBadge.module.css`,
`PursuitBadge.module.css`, `EventBanner.module.css` und
`Menu.module.css`. Gestaltung: Kartonkarton-/Papier-Anmutung bzw.
dunkle „Edelkarte" mit mehrschichtigem Kartenrand (Border + Inset-
Line/Outline), konsistenten Radien, Schatten (Karte liegt auf dem
Tisch) und optional dezenter Ecken-Prägung; Headings in der
Schmuckschrift aus Schritt 1. Badges bleiben `role="status"`-Pills,
bekommen aber denselben Kartenlook; Symbolglyphen und
Level-Farbcodierung (ruhig→kritisch) bleiben form+farbe-kodiert.
Alle Änderungen sind CSS-seitig — Klassennamen, DOM-Struktur,
`data-*`-Attribute und Fokus-Styles (`:focus-visible`) bleiben;
Kontraste der neuen Paarungen ≥ AA und im Header-Kommentar
dokumentiert.

**Akzeptanzkriterien:**

- Panels, Karten, Buttons und Badges zeigen einheitliche Kartenhaptik
  (Rand, Schatten, Materialität) auf allen Screens.
- `:focus-visible`- und Hover-Zustände unverändert vorhanden;
  Zielgrößen nicht verkleinert; Kontraste ≥ AA dokumentiert.
- Keine neuen sichtbaren Strings (i18n-/Hardcoded-Checks grün);
  `data-testid`/`data-view`/`data-heat-level`/`data-pursuit-level`
  etc. unverändert; Vitest/Playwright grün.

**Abhängigkeiten:** 1

**Betroffene Bereiche:** `src/components/GanoveScreen.module.css`,
`Menu.module.css`, `MissionPanel.module.css`, `HeatBadge.module.css`,
`PursuitBadge.module.css`, `EventBanner.module.css`,
`DetektivScreen.module.css`, `src/theme.css`.

### Schritt 7: Spieltisch-Komposition — alle Screens zu einem stimmigen Tischbild

**Beschreibung:** Fasse die Gesamtkomposition zu einem „Spieltisch":
`.screen` wird zur Tischfläche (vorhandene `bg-noir`-Textur als Basis;
Tisch-/Filz-/Holz-Anmutung über lokale, lizenzdokumentierte Mittel —
bevorzugt CSS/Gradient, bei Bedarf ein weiteres lokal generiertes
Raster-Asset mit ASSETS.md-Eintrag). Die Spielhüllen
(`.layout`: `.mapArea` + `.sidebar`) werden als gerahmte Einheit
komponiert (Ränder, Abstände, Brett steht visuell auf dem Tisch,
Sidebar als Kartenstapel). Überführe anschließend **alle** Screens in
dasselbe System: `MainMenu` (Titelbild + Schmuckschrift-Titel),
`MapSelect`/`MissionSelect` (Kartenkarten im neuen Kartenlook),
`ModeSelect`, `SettingsScreen`, `DevModeScreen`, `StatsScreen`,
`ResumeScreen`, `ReplayScreen` (beide Boards auf dem Tisch,
`.perspectiveToggle` neu gestylt), `AppSettingsScreen`.
Responsiv-Verhalten (Breakpoint 900 px, vertikales Stapeln) bleibt;
`data-view`- und `data-testid`-Träger sowie die DOM-Hierarchie
werden nicht umgebaut — die Komposition erfolgt über CSS
(`App.module.css`, `theme.css`, Screen-Module).

**Akzeptanzkriterien:**

- Jeder Screen wirkt wie derselbe „Spieltisch": gleiche Tischfläche,
  Kartenpanels, Schmuckschrift-Titel, konsistente Ränder/Schatten —
  kein Rest alter flacher Dark-Box-Optik.
- Menü → Setup → Partie → Auswertung/Replay laufen unverändert durch;
  Overlay-Stack (EventBanner, Splash, Verfolgungs-Vignette
  `.mapArea::after`) bleibt korrekt geschichtet.
- `data-view`, alle `data-testid`s und die responsive Stapelung
  bleiben; Vitest/Playwright inkl. E2E-Menüspecs grün.

**Abhängigkeiten:** 2, 6

**Betroffene Bereiche:** `src/App.module.css`, `src/theme.css`,
`GanoveScreen.module.css` (`.screen`/`.layout`/`.mapArea`),
`Menu.module.css`, alle Screen-Komponenten CSS-seitig, ggf.
`src/assets/` + `ASSETS.md` (Tischtextur).

### Schritt 8: Konsistenz-Endabnahme und Polishing

**Beschreibung:** Vollständiger Abnahme-Durchgang des fertigen
Designs über alle Screens und Verträge: (a) Design-Konsistenz-Audit —
kein Screen mehr im alten „nackten" Stil; Legenden spiegeln exakt die
finalen Token-/Figuren-/Routen-Formen; Badge-, Splash- und
Outcome-Farbcodierungen form+farbe-kodiert. (b) A11y-Audit —
Tab-Reihenfolge, `:focus-visible` auf allen neuen/flächen Elementen,
ARIA/rollen unverändert, keine Info ausschließlich über Farbe,
WCAG-AA-Kontrasttabelle in den Header-Kommentaren aktualisiert.
(c) Motion-Audit — jede neue/geänderte Animation und Transition
unter `@media (prefers-reduced-motion: reduce)`. (d) Vertrags-Audit —
`data-*`-Selektoren unverändert (Stichprobe gegen die Checkliste in
`docs/.../inventory/conventions.md`), keine leakfähigen `MapGraph`-
Props, kein `Math.random()`, i18n-Parität de/en, alle Git-Hook-Checks
im `--all`-Modus grün. (e) Build-Audit — `npm run build`, `dist`
enthält keine externen Referenzen (CDN/Hotlink-Funde prüfen), Font
als lokale WOFF2 ausgeliefert; Coverage-Threshold ≥ 70 % Lines hält.
(f) `ASSETS.md` vollständig (Font + evtl. neue Texturen). Gefundene
Abweichungen werden in diesem Schritt behoben.

**Akzeptanzkriterien:**

- Alle acht fachlichen Anforderungen der Requirement (Materialität,
  Figuren, Tokens, Routen, Schmuckschrift, Karten-Panels, Komposition,
  Konsistenz) sind auf den spielrelevanten Screens sichtbar erfüllt.
- Vitest-Suite inkl. Coverage ≥ 70 % und Playwright-E2E komplett grün;
  Hook-Checks (`--all`/`--strict` wie vorgesehen) ohne Befund.
- Kein Info-Leak (Perspektiven-Asymmetrie-Assertions grün),
  Barrierefreiheit nicht schlechter als zuvor, Reduced Motion wirksam,
  i18n-Parität gegeben, `dist` frei von externen Referenzen,
  `ASSETS.md` vollständig.

**Abhängigkeiten:** 3, 4, 5, 7

**Betroffene Bereiche:** gesamtes `src/` (Audit + Nachbesserung),
`e2e/`, `src/assets/ASSETS.md`, `docs/` (ggf. Aktualisierung der
Inventur-Notizen).

## Übersichtstabelle

| # | Titel | Abhängigkeiten | Betroffene Bereiche |
|---|-------|----------------|---------------------|
| 1 | Design-Fundament: Theme-Stylesheet, CSS-Variablen, Schmuckschrift | — | `theme.css` (neu), `main.tsx`, `src/assets/fonts/`, `ASSETS.md`, Shared-Theme-CSS |
| 2 | Brett-Materialität: Papier, Papprand, Schatten | 1 | `MapGraph.tsx/.module.css`, `MapBackdrop.module.css`, `theme.css` |
| 3 | Orts-Tokens: Knoten als geprägte Plaketten | 2 | `MapGraph.tsx/.module.css`, Legenden, ggf. `boardPieces.tsx` |
| 4 | Spielfiguren als Meeple-Spielsteine | 2 | `boardPieces.tsx` (neu), `MapGraph.tsx/.module.css`, Legenden |
| 5 | Routen als gezeichnete Wege | 2 | `MapGraph.tsx/.module.css`, Legenden |
| 6 | Kartenartige Panels und UI-Elemente | 1 | Shared-Theme + Badge-/Panel-/Menu-CSS-Module |
| 7 | Spieltisch-Komposition über alle Screens | 2, 6 | `App.module.css`, `theme.css`, Screen-Module, ggf. Assets |
| 8 | Konsistenz-Endabnahme und Polishing | 3, 4, 5, 7 | gesamtes `src/`, `e2e/`, `ASSETS.md`, `docs/` |

## Offene Punkte

1. **Stilrichtung des Bretts — ENTSCHIEDEN: Pergament-Brett + dunkle Umgebung.**
   Vorschlag: helles, gealtertes Pergament/Papier (detektivisch-vintage),
   weil „Papier/Pappe" natürlich hell liest, die warmen Landmark-Farben
   und die Noir-Artworks gut trägt und sich stark vom bisherigen Flat-
   Dark abhebt. Risiko: Kontraste der Labels/Overlays müssen neu
   abgesichert werden — deshalb als Akzeptanzkriterium in Schritt 2
   verankert; falls die Lesbarkeit leidet, Fallback auf dunkel getönte
   „Nachtkarten"-Pappe bei gleicher Textur-Mechanik.
2. **Konkrete Schmuckschrift.** Vorschlag: „IM Fell English" (SIL OFL,
   historischer Karten-Charakter, passt zum Detektiv-Genre); Alternative
   „Playfair Display" (ebenfalls OFL), falls IM Fell auf kleinen
   Überschriften zu unruhig wirkt. Entscheidung in Schritt 1 durch
   Sichtprobe auf Titel + `panelHeading`.
3. **Visuelle Abnahme vor „fertig".** Vorschlag: ja — nach Schritt 7
   ein Screenshot-Review (alle Screens, beide Perspektiven) als
   Iterationsfenster, bevor Schritt 8 die Endabnahme formalisiert;
   billig, da E2E-Dev-Server ohnehin deterministische Zustände
   (`?map=`/`?seed=`) liefern kann.
4. **Zusätzliches Raster-Asset für die Tischfläche.** Vorschlag:
   primär ohne neues Asset auskommen (bestehende `bg-noir`-Textur +
   CSS-Gradients); falls das Tischbild zu flach bleibt, eine lokal
   generierte Tisch-/Filztextur im gleichen Pollinations-Verfahren
   erzeugen und in `ASSETS.md` dokumentieren — kein externer Bezug.


---

### Behandlung der offenen Punkte (Projektleiter)

1. **Stilrichtung:** Nutzerentscheidung — *Pergament-Brett auf dunklem
   Tisch*. Helles, gealtertes Papier/Pappe für den Spielplan; die
   App-Umgebung (Sidebar, Panels, Hintergrund) bleibt dunkler
   Noir-„Tisch". Konsequenz für Schritt 2: Board-Layer hell und warm,
   `mapArea`/`screen`-Umfeld dunkel; Kontrast-Anforderung gilt für
   helle Fläche (dunkle Labels/Marker auf Pergament, Icons mit
   Outline). Für Schritt 7: Tischfläche = bestehendes Noir-Dunkel +
   Gradients, kein neues Asset nötig (Punkt 4 damit erledigt).
2. **Schmuckschrift:** Vorschlag übernommen — „IM Fell English" (OFL),
   Sichtprobe in Schritt 1; Fallback „Playfair Display".
3. **Visuelle Abnahme:** übernommen — nach Schritt 7 Screenshot-Review
   beider Perspektiven/Maps vor Schritt 8.
4. **Tischtextur:** entfällt — dunkle Umgebung reicht aus bestehenden
   CSS-Mitteln.

**Status:** Alle offenen Punkte behandelt — Plan ist aktuell.
