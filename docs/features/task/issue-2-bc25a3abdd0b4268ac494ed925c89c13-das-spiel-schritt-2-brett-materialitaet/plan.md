# Umsetzungsplan: Schritt 2 — Brett-Materialität (Pergament, Papprand, Tischschatten)

## Übersicht

Die `.map`-SVG-Fläche von `MapGraph` wird zum physikalischen Spielbrett: Pergament-Grundfläche mit `feTurbulence`-Körnung und `radialGradient`-Vignette aus einem neuen `<defs>`-Block, mehrstufiger Pappenrand und Drop-Shadow via CSS auf `.map`. Gleichzeitig werden die `MapBackdrop`-Feature-Farben und sämtliche Kartenmarkierungen (Labels, Kanten, Glyphen, Marker) auf dunkle Tinten-Töne für die helle Papierfläche umgestellt — inklusive farblich abgestimmter Legenden-Swatches auf Papier-Chips. Rein präsentational: keine Props-, `data-*`-, Logik- oder Datenänderung.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| Papierfläche im DOM | Neue `<g className={styles.boardFace} aria-hidden pointerEvents="none">` mit drei `<rect>` (Papier, Grain via `filter`, Vignette via `fill`) als direkte Kinder des `<svg>` **vor** `<MapBackdrop>` | `data-layer`-Struktur bleibt unverändert (kein neuer `data-layer`); Board-Features liegen auf dem Papier; funktioniert auch für Karten ohne `board` (z. B. `teststadt`); bestehende `pointer-events:none`-Regel greift automatisch |
| Eindeutige `id`s in `<defs>` | `useId()` (sanitized auf `[a-zA-Z0-9]`) als Präfix für `filter`-/`radialGradient`-IDs | `ReplayScreen` rendert zwei `MapGraph`-Instanzen im selben Dokument — statische IDs würden kollidieren |
| Innere Papierkante | Zusätzliches gestricheltes `<rect>` (`boardSeam`, Stroke `--color-cardboard`) innerhalb der `boardFace`-Gruppe statt CSS-`inset`-`box-shadow` | `inset`-Schatten auf `<svg>` wird unter dem SVG-Inhalt gezeichnet und wäre unsichtbar; die Naht muss im SVG liegen |
| Dunkle Kartenfarben | Neue `--color-map-*`-Tokens in `theme.css` (Brettspiel-Abschnitt), statt Shared-Tokens umzufärben oder Custom-Property-Overrides auf `.map` | Shared-Tokens (`--color-amber`, `--color-green`, `--color-detective-light`, …) werden auf dunklen Panels weiterbenötigt; eigene Tokens dokumentieren Kontraste gegen `--color-paper` und bleiben referenzierbar für Legenden |
| Legenden-Swatches | `legendItem svg` erhält Papier-Chip (`background: var(--color-paper)`, `border: var(--color-cardboard)`, kleiner Radius); Swatch-Klassen nutzen dieselben `--color-map-*`-Tokens | Legende entspricht exakt den Brett-Farben und bleibt auf dunklem Panel lesbar — wie ein aus dem Brett ausgeschnittener Kartenausschnitt |
| Zonen-Halo | Inline-`hsl` auf `h 55% 45%` abdunkeln + `fill-opacity` 0.16 → 0.22 | Pastell 60 %-Helligkeit wäre auf Papier nahezu unsichtbar; Legende nennt Zonen weiterhin als Text (Farbe bleibt Sekundärcue) |
| Landmark-Glyphen | Unverändert lassen | Warme Füllfarben + `#10141c`-Outlines sind auf Pergament bereits lesbar (Anforderung: „bereits papier-tauglich") |

## Programmabläufe

### Rendern der Brettfläche (alle Perspektiven)

1. `MapGraph` rendert im `<svg>` zuerst `<defs>` mit `filter` (`feTurbulence` → `feColorMatrix` auf Tinten-Alpha → `feComposite` in `SourceAlpha` geclippt) und `radialGradient` (transparent → `--color-ink`-analoge Abdunklung, ~22 %).
2. Danach `boardFace`-Gruppe: `boardPaper`-`<rect>` (100 %×100 %, Fill `--color-paper`), `boardGrain`-`<rect>` (weiß gefüllt, `filter="url(#…)"` → clippt Rauschen auf die Fläche), `boardVignette`-`<rect>` (`fill="url(#…)"`), `boardSeam`-`<rect>` (ungefüllt, Stroke).
3. Erst danach `<MapBackdrop>` (`data-layer="board"`), gefolgt von `edges`/`landmarks`/`nodes`/`markers` — Layer-Reihenfolge unverändert.
4. `.map` (CSS): `background: var(--color-paper)`, `border: 7px solid var(--color-cardboard)`, `border-radius: 10px`, `box-shadow: 0 0 0 3px var(--color-cardboard-edge), var(--shadow-board)`.

Beteiligte Komponenten: `MapGraph`, `MapBackdrop`, `MapGraph.module.css`, `theme.css`.

## Neue Klassen

Keine neuen TS-Klassen/Module. Neue CSS-Klassen in `MapGraph.module.css`: `boardFace`, `boardPaper`, `boardGrain`, `boardVignette`, `boardSeam`. Neue Tokens in `theme.css` (siehe Konfigurationsänderungen).

## Änderungen an bestehenden Klassen

### `MapGraph` (React-Komponente, `src/components/MapGraph.tsx`)

- **Neu:** `useId`-Import; `const defsId = "mapboard-" + useId().replace(/[^a-zA-Z0-9]/g, "")`.
- **Neu im JSX:** `<defs>` + `boardFace`-Gruppe als erste Kinder des `<svg>`, vor `<MapBackdrop>`.
- **Geändert:** `zoneHue`-Inline-Style `hsl(h 55% 60%)` → `hsl(h 55% 45%)` (bessere Sichtbarkeit auf Papier). Keine Änderung an Props/`data-*`/Handlers.

### `MapGraph.module.css` (Stylesheet)

- `.map`: Papier-Background, 7-px-Cardboard-Border, `border-radius: 10px`, mehrstufiger `box-shadow` (Außenkante + `--shadow-board`).
- Neue Klassen `boardFace`/`boardPaper`/`boardGrain`/`boardVignette`/`boardSeam`.
- Umtönung auf `--color-map-*`: `.edge`/`.edgeWeg` → `--color-map-weg`; `.edgeFahrt` → `--color-map-fahrt`; `.edgeBlocked` → `--color-map-blocked`; `.edgeFlash` → `--color-map-accent`; `.blockGlyph` → `--color-map-danger`; `.nodeDot` → Fill `--color-ink`, Stroke `--color-paper`; `.nodeLabel` → `--color-ink`; Fokus/`currentTarget` → `--color-map-accent`; legal/selectable/hover/`legalRing` → `--color-map-legal`(`-hover`); `.nodeGanoveHere` → `--color-map-ganove`; `.escapeMarker`/`.mission_flucht` → `--color-map-escape`; `.mission_diebstahl` → `--color-map-ganove`; `.mission_kontakt` → `--color-map-pin`; `.mission_sabotage` → `--color-map-danger`; `.detectiveShape` Fill `--color-detective` (unverändert, 4.9:1), Stroke `--color-map-detective-stroke`; `.detectiveActive` Fill `--color-map-detective-active`, Stroke `--color-map-accent`; `.zoneHalo` `fill-opacity` 0.22; `.cameraBody`/`.cameraLens` → `--color-map-detective-stroke`/`--color-ink`-Outlines; `.cameraStrike` → `--color-map-danger`; `.markerPin` Fill `--color-map-pin`, Stroke `--color-ink`; `.possibleRing` → `--color-map-possible`; `.ganoveShape` Fill `--color-map-ganove`, Stroke `--color-ink`; `.markerText` unverändert (`--color-text` auf dunkler Figur ≈ 6:1).

### `MapBackdrop.module.css` (Stylesheet)

Nur Farbwerte über die umgestimmten `--color-feature-*`-Tokens (siehe Konfiguration); Klassen und Geometrie unverändert.

### `GanoveScreen.module.css` / `DetektivScreen.module.css` (Stylesheets)

- `GanoveScreen.module.css`: `.legendItem svg { background: var(--color-paper); border: 1px solid var(--color-cardboard); border-radius: 3px; padding: 2px }`; `legendWeg`→`--color-map-weg`, `legendFahrt`→`--color-map-fahrt`, `legendEscape`→`--color-map-escape`, `legendDetective` Fill `--color-detective` + Stroke `--color-map-detective-stroke`, `legendGanove` Fill `--color-map-ganove` + Stroke `--color-ink`, `legendTargetDot`/`legendTargetRing`→`--color-map-legal`.
- `DetektivScreen.module.css`: `legendCameraBody` Fill `--color-detective` + Stroke `--color-map-detective-stroke`, `legendCameraLens`→`--color-map-detective-stroke`, `legendPin` Fill `--color-map-pin` + Stroke `--color-ink`, `legendDiamond`→`--color-map-possible`, `legendCategory`→`--color-map-ganove`.
- Nicht-Legenden-Verwendungen der Shared-Tokens (`.phase`, `.removeButton`, `.splash_draw`, `EventBanner`-Icons) bleiben unverändert.

### `landmarks.tsx`

Keine Änderung (warme Palette + dunkle Outlines bereits papier-tauglich).

## Datenbankmigrationen

Keine.

## Validierungsregeln

Keine.

## Konfigurationsänderungen

Neue Tokens in `theme.css` (Block „Brettspiel-Tokens", mit Kontrast-Kommentaren; alle Ziel-Kontraste gegen `--color-paper` `#e8dcc0`):

| Eintrag | Typ | Standardwert | Zweck |
|---------|-----|--------------|-------|
| `--color-map-weg` | CSS-Token | `#6b5b43` (~4.7:1) | Weg-Kanten/Legende |
| `--color-map-fahrt` | CSS-Token | `#7a5228` (~4.9:1) | Fahrt-Achse/Legende |
| `--color-map-blocked` | CSS-Token | `#8f8060` | gesperrte Kante (ausgebleicht; Form-Cue trägt) |
| `--color-map-legal` | CSS-Token | `#2e7a54` (~3.8:1) | legale/selektierbare Ziele |
| `--color-map-legal-hover` | CSS-Token | `#1f5c3d` (~5.5:1) | Hover auf Zielen |
| `--color-map-accent` | CSS-Token | `#7d5210` (~4.8:1) | Fokusring, aktuelles Ziel, Kanten-Flash |
| `--color-map-danger` | CSS-Token | `#a03a30` (~4.7:1) | Blockade-Kreuz, Sabotage, Kamera-Durchstreich |
| `--color-map-escape` | CSS-Token | `#2a6280` (~4.8:1) | Flucht-Marker |
| `--color-map-pin` | CSS-Token | `#7a4d9e` (~4.5:1) | Marker-Pin, Kontakt-Kategorie |
| `--color-map-possible` | CSS-Token | `#8f6a1e` (~3.8:1) | Deduktions-Diamantring |
| `--color-map-ganove` | CSS-Token | `#8a5f12` (~4.6:1) | Ganove-Figur, Diebstahl-Kategorie |
| `--color-map-detective-stroke` | CSS-Token | `#22334d` (~11:1) | Outlines Detektiv/Kamera |
| `--color-map-detective-active` | CSS-Token | `#46648f` (~4.6:1) | aktiver Detektiv |

Geänderte Bestandswerte (nur vom MapBackdrop verbraucht): `--color-feature-water` `#a8bcc6`, `-water-stroke` `#5f7f92`, `-park` `#aeb98a`, `-park-stroke` `#74855a`, `-rail` `#8a6f4d`, `-street` `#a68e5c`, `-block` `#d9c49a`, `-block-stroke` `#9a7f52`.

## Seiteneffekte und Risiken

- **ReplayScreen (2 Instanzen):** statische `defs`-IDs würden kollidieren → `useId`-Präfix (im Plan festgeschrieben).
- **MissionSelect/teststadt:** Karte ohne `board`-Objekt bekommt die Papierfläche ebenfalls (Gruppe hängt nicht an `data-layer="board"`).
- **Kontraste:** `--color-map-blocked` (mit `stroke-opacity` 0.55) liegt unter 3:1 — bewusst: „gesperrt"-Status ist per Form kodiert (gestrichelt + X-Glyph in `--color-map-danger`), Farbe ist Sekundärcue. Zonen-Halos bleiben Sekundärcue (Zonen als Klartext in der Legende).
- **E2E `design.spec.ts`** prüft `--color-paper`/`--color-ink`-Werte hart (`#e8dcc0`/`#2b2115`) — die Tokens bleiben unverändert, der Test läuft weiter.
- **CSS-Module-Klassen:** neuer Selektor `.legendItem svg` wirkt auf beide Legenden (gemeinsame Klassen aus `GanoveScreen.module.css`).

## Umsetzungsreihenfolge

1. **`theme.css`: neue `--color-map-*`-Tokens + `--color-feature-*`-Werte umstellen**
   - Voraussetzungen: keine (Tokens aus Schritt 1 vorhanden)
   - Beschreibung: Tokens samt Kontrast-Kommentaren ergänzen; Feature-Palette auf Pergament-Geographie umstellen.
2. **`MapGraph.tsx`: `<defs>` + `boardFace`-Gruppe + `useId`, Zone-Halo-Helligkeit**
   - Voraussetzungen: Schritt 1 (Tokens für CSS-Klassen)
   - Beschreibung: Defs (Grain-Filter, Vignette-Gradient) mit eindeutigen IDs; drei Rechtecke + Seam als erste SVG-Kinder; `zoneHue`-Lightness 60 → 45.
3. **`MapGraph.module.css`: `.map` Brett-Styling + alle Kartenfarben umgetönt; `boardFace`-Klassen**
4. **`MapBackdrop.module.css`:** keine Änderung nötig, wenn Tokens bereits in Schritt 1 umgestellt (Klassen bleiben identisch) — nur Verifikation.
5. **Legenden-Swatches:** `GanoveScreen.module.css` (Chip + Farben) und `DetektivScreen.module.css` (Farben).
6. **Tests:** Unit-Assertions in `MapGraph.test.tsx` (defs/Filter/Gradient, Reihenfolge vor `data-layer="edges"`, ID-Eindeutigkeit bei 2 Instanzen); E2E-Erweiterung `e2e/design.spec.ts` (Brett-Materialität auf dem Ganove-Setup-Screen).

## Tests

### Neue Tests

| Test / Hilfsmethode | Testklasse | Was wird geprüft / bereitgestellt? |
|--------------------|------------|-------------------------------------|
| `renders a parchment board face with grain and vignette beneath all layers` | `MapGraph.test.tsx` | `svg > defs` mit `feTurbulence` + `radialGradient`; `g[class*='boardFace']` mit `boardPaper`-`rect`; liegt vor `data-layer="edges"`; `pointer-events`/`aria-hidden` gesetzt |
| `keeps defs ids unique across multiple instances` | `MapGraph.test.tsx` | zwei gerenderte `MapGraph`: alle `filter[id]`/`radialGradient[id]` eindeutig; jede `url(#…)`-Referenz existiert |
| `keeps the data-layer order with board features` | `MapGraph.test.tsx` | bestehende `illustrated`-Fixture: `:scope > g[data-layer]`-Reihenfolge = `board, edges, landmarks, nodes, markers` |
| `board materiality: parchment face, rim and shadow` | `e2e/design.spec.ts` (chromium) | `?mode=ganove&map=muenster&seed=7&mission=none`: computed `background-color` = `rgb(232,220,192)`, `box-shadow` ≠ `none`, Border ≥ 5 px, `feTurbulence`+`radialGradient` im SVG, `data-layer="board"` vorhanden, Label-Fill dunkel (AA-nahe) |

### Betroffene bestehende Tests

Keine — alle bestehenden Unit-Assertions zielen auf `data-*`-Attribute/Struktur, die unverändert bleibt; `design.spec.ts` wird nur erweitert.

### E2E-Tests (primärer Funktionsnachweis)

Es gibt **keinen neuen Benutzerfluss** — die Anforderung ist eine rein visuelle Umgestaltung ohne neue Interaktion. Als Nachweis der sichtbaren Akzeptanzkriterien dient der neue E2E-Test in `design.spec.ts` (sichtbare Brett-Materialität auf einer realen `MapGraph`-Fläche inkl. `data-layer="board"`), ergänzt durch die unverändert grünen Fluss-Specs (`ganove`, `detektiv`, `menu`, `i18n-a11y`, `persistenz`), die die Bedienbarkeit (Hit-Areas, Tastaturfluss) beweisen.

| Priorität | Szenario | Testdatei / Testklasse | Abgedecktes Akzeptanzkriterium | Warum E2E nötig ist |
|-----------|----------|------------------------|-------------------------------|-------------------|
| Pflicht | Brett-Materialität sichtbar (Papier, Rand, Schatten, Texturen, Layer) | `e2e/design.spec.ts` | Kriterien 1+2 (Papier/Rand/Schatten auf realer Karte, `data-*` intakt) | Computed Styles (box-shadow, background, border) nur im Browser prüfbar |
| Regression | Bestehende Spielflüsse laufen im neuen Look | `e2e/ganove.spec.ts`, `detektiv.spec.ts`, `menu.spec.ts`, `i18n-a11y.spec.ts`, `persistenz.spec.ts` | Kriterien 2–4 | Unverändertes Verhalten auf sämtlichen `MapGraph`-Einsätzen |

## Offene Punkte

Keine.
