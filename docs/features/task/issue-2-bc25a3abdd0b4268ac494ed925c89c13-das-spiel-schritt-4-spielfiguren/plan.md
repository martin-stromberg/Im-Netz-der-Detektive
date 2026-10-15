# Umsetzungsplan: Spielfiguren als Meeple-Spielsteine (Design-Schritt 4)

## Übersicht

Neues Modul `src/components/boardPieces.tsx` liefert stehende
Meeple-Glyphen (Körper-Gradient, Schlagschatten, Sockel-Ellipse) nach der
`landmarks.tsx`-Konvention. `MapGraph` ersetzt das flache
Detektiv-`rect` und die Ganove-Raute durch die Figuren — `data-*`-
Vertrag, `markerMove`-Transition und Inline-`transform` bleiben auf dem
äußeren `<g>`. Beide Legenden zeigen Miniaturen derselben Komponenten.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| Modulstruktur | `boardPieces.tsx` exportiert `DetectivePiece` + `GanovePiece`; je eine interne Glyph-Funktion plus Wrapper `<g data-piece aria-hidden="true" focusable="false">` | 1:1 die `landmarks.tsx`-Konvention (lokale Glyph-Box, Fußpunkt am Ursprung, `aria-hidden`) |
| Körper-Volumen | `radialGradient` je Figur in einem `<defs>` innerhalb des Glyph-`<g>`; eindeutige IDs via `useId()` **in der Stück-Komponente** | Modul bleibt selbständig; IDs kollidieren weder über mehrere Detektive noch über Doppel-Mounts (`ReplayScreen`) — gleiche Garantie wie `defsId`-Muster, aber ohne Prop-Durchreichung |
| Stil-Verteilung | Füllung als `fill={`url(#…)`}`-Attribut (überschreibbar), Konturen/Details über `boardPieces.module.css`; Comic-Tusche `stroke #10141c` wie `landmarks.S` | CSS-State-Regeln dürfen Attribut-Fills überlagern (gleiches Muster wie `tokenFace`); einheitlicher Comic-Strich |
| Unterscheidung | Detektiv: aufrechte Meeple-Silhouette (Kopf + Schulter-Torso) + Index-Ziffer + Blau-Gradient; Ganove: Trenchcoat-A-Linie + Fedora (Krempe+Krone, tiefe Tinte) + Amber-Gradient, **ohne** Ziffer | Form + Farbe + Beschriftung — drei unabhängige Cues; Farbe nie alleinig |
| Aktiver Detektiv | `active`-Prop rendert zusätzliches Form-Element: auf dem Sockel gepflanzte **Fähnchen-Stange mit Wimpel** in `--color-map-accent` plus breiterer Amber-Sockelring (`pieceBaseActive`) | Form (Fahne) + Amber-Akzent erfüllt „nicht nur Farbe"; bleibt im lokalen Koordinatensystem, bricht `markerMove` nicht |
| Positionierung | `MapGraph` behält `style={{ transform: translate(node.x, node.y - 16) }}` auf dem Wrapper-`<g>`; Stücke zeichnen ab Ursprung nach oben, Schatten/Sockel reichen bis ~y+5 | Identische Ankerung wie bisher; Sockel/Schlagschatten berühren die Plaketten-Oberkante (Ort-Token, Schritt 3) |
| Legenden-Miniaturen | Dieselben Komponenten skaliert in den bestehenden Swatch-`<svg>`s (`transform="translate(…) scale(0.5)"`), ohne Index-Ziffer | „Miniaturansicht" wörtlich — gleiche Form, gleiche Bedeutung (Muster: `legendTarget*`-Plakette aus Schritt 3) |
| Wrapper-Klassen | `detectiveMarker`/`detectiveActive`/`ganoveMarker`/`markerText`/`detectiveShape`/`ganoveShape` entfallen; am Wrapper bleibt nur `styles.markerMove` | Alte Klassen hatten keine Test-/E2E-Referenzen; die Stück-Stile leben in `boardPieces.module.css`, der Wrapper braucht nur noch die Transition — keine leeren CSS-Reste (jsdom-Falle: alles Referenzierte muss deklariert sein) |

## Programmabläufe

### Rendering Detektiv-Figur

1. `MapGraph` mappt `detectivePositions` → je Eintrag Wrapper-`<g>`
   mit `style.transform = translate(node.x, node.y - 16)`,
   `className={styles.markerMove}`, `data-detective={index}`,
   `data-active-detective` (nur bei Treffer), `aria-label`
   (`marker.detective`, index + 1).
2. Darin `<DetectivePiece index={index + 1} active={index === activeDetectiveIndex} />`.
3. `DetectivePiece` zeichnet im lokalen System (Fußpunkt Ursprung):
   `<defs>`-Gradient (`useId`), Schatten-Ellipse (`pieceShadow`),
   Sockel-Ellipse (`pieceBase` + `pieceBaseDetective`, bei `active`
   zusätzlich `pieceBaseActive`), Körperpfad (`pieceBody`,
   `fill=url(#…-body)`), Kopf-Kreis, Revers-Detail (`pieceDetail`),
   Index-`<text>` (`pieceIndex`, nur wenn `index` gesetzt), bei `active`
   Fahnen-Gruppe (`pieceActiveMark`: `pieceFlagPole` + `pieceFlag`).

### Rendering Ganove-Figur

1. `MapGraph` rendert bei `ganoveNode !== undefined` das Wrapper-`<g>`
   (`markerMove`, `data-ganove="true"`, `aria-label`, `<title>`).
2. Darin `<GanovePiece />`: `<defs>`-Gradient (`useId`),
   `pieceShadow`, `pieceBase` + `pieceBaseGanove`, Mantelpfad
   (`pieceBody`, `fill=url(#…-body)`), Revers-Detail, Gesichtsschatten
   unter der Krempe, Fedora (`pieceHat`: Krempe + Krone, `pieceHatBand`).

### Legenden

1. `MapLegend` (GanoveScreen): `legendDetective`-Swatch →
   `<svg width="14" height="18"><g transform="translate(7,16.5) scale(0.5)"><DetectivePiece /></g></svg>`;
   `legendGanove`-Swatch → gleiche Hülle mit `<GanovePiece />`.
2. `DetectiveMapLegend` (DetektivScreen): identischer
   `DetectivePiece`-Swatch; kein Ganove-Swatch (Asymmetrie bleibt).
3. `GanoveScreen.module.css`: `.legendDetective`/`.legendGanove`
   entfallen (die Miniaturen stylen sich selbst);
   `.legendItem svg`-Papier-Chip bleibt.

## Neue Klassen/Dateien

| Datei | Typ | Zweck |
|-------|-----|-------|
| `src/components/boardPieces.tsx` | React-Modul | `DetectivePiece`, `GanovePiece` (Meeple-Glyphen) |
| `src/components/boardPieces.module.css` | CSS-Modul | `pieceShadow`, `pieceBase`, `pieceBaseDetective`, `pieceBaseGanove`, `pieceActiveBase`, `pieceBody`, `pieceDetail`, `pieceIndex`, `pieceHat`, `pieceHatBand`, `pieceActiveMark`, `pieceFlagPole`, `pieceFlag` |

## Änderungen an bestehenden Dateien

### `src/components/MapGraph.tsx`

- Import `DetectivePiece`, `GanovePiece` aus `./boardPieces`.
- Detektiv-Wrapper: `className={styles.markerMove}`; Inhalt
  `rect`+`text` → `<DetectivePiece index={index + 1} active={index === activeDetectiveIndex} />`.
- Ganove-Wrapper: `className={styles.markerMove}`; `path` →
  `<GanovePiece />`; `data-*`, `aria-label`, `<title>` bleiben.

### `src/components/MapGraph.module.css`

- Entfernen: `.detectiveMarker .detectiveShape`,
  `.detectiveActive .detectiveShape`, `.ganoveMarker .ganoveShape`,
  `.markerText`.
- Behalten: `.markerMove` inkl. `prefers-reduced-motion`-Block
  (unverändert).

### `src/components/GanoveScreen.tsx` (`MapLegend`)

- `rect.legendDetective` → `<DetectivePiece />` in skalierter Hülle.
- `path.legendGanove` → `<GanovePiece />` in skalierter Hülle.
- Swatch-`<svg>`-Größen ~14×18 (Stehefigur statt 12×12-Kachel).

### `src/components/DetektivScreen.tsx` (`DetectiveMapLegend`)

- `rect.legendDetective` → `<DetectivePiece />` in skalierter Hülle
  (identisch zum Ganove-Screen).

### `src/components/GanoveScreen.module.css`

- `.legendDetective` und `.legendGanove` entfernen (werden durch die
  Stück-eigenen Klassen ersetzt — `shared`-CSS wird weiterhin von
  `DetectiveMapLegend` genutzt).

### `src/components/MapGraph.test.tsx`

- Neue Suite „board pieces": Anatomie beider Figuren
  (`data-piece`, `pieceShadow`/`pieceBase`/`pieceBody`, Kopf vs. Hut,
  Index-Text nur beim Detektiv), Aktiv-Fahne nur beim aktiven Detektiv,
  Gradient-`url(#…)`-Auflösung, ID-Eindeutigkeit mit Figuren.
- Suite „Map legend swatches": `data-piece`-Miniaturen in beiden
  Legenden (Detektiv-Legende ohne `data-piece="ganove"`).
- Bestehende `data-*`-Tests bleiben unverändert grün.

### `e2e/design.spec.ts`

- Neuer Test: Figuren-Anatomie im Browser (Computed Styles: Gradient-
  Fill auf `pieceBody`, `fill-opacity` des Schattens, Hut beim Ganoven,
  Index-Text-Fill hell), `markerMove`-Transition 480 ms auf dem Wrapper,
  `prefers-reduced-motion` deaktiviert sie, Aktiv-Fahne sichtbar +
  Amber (`rgb(125, 82, 16)`), Legenden-Miniaturen vorhanden.

## Datenbankmigrationen

Keine.

## Validierungsregeln

Keine.

## Konfigurationsänderungen

Keine — ausschließlich bestehende Tokens aus `theme.css`.

## Seiteneffekte und Risiken

- **Teststadt-Überlappung:** Die Figuren (~20×30 SVG-Einheiten) überlappen
  auf der kleinen Testkarte (`viewBox 100`, Knotenabstand 10) — wie die
  Landmarken bereits; funktional irrelevant (jsdom-Tests prüfen DOM, nicht
  Layout). Auf `muenster` (min. Abstand ~21) stehen Figuren ähnlich
  proportioniert wie die Landmark-Glyphen.
- **ReplayScreen-Doppel-Mount:** zwei `MapGraph`-Instanzen → `useId`
  in jedem Stück garantiert eindeutige Gradient-IDs (Test deckt ab).
- **jsdom-Falle:** Jede in tsx referenzierte Klasse muss in
  `boardPieces.module.css` deklariert sein — E2E-Test prüft Computed
  Styles der Kernteile.
- **Textur-Lesbarkeit:** `pieceIndex`-Fill `--color-text` auf
  Detektiv-Blau ≈ 6:1 — AA-tauglich auf Papier (hell auf dunkler Figur).
- **Keine Pointer-Events:** `.map :where(g,…)` deckt alle Stückteile ab;
  in Legenden ohnehin dekorativ.

## Umsetzungsreihenfolge

1. **`src/components/boardPieces.module.css` anlegen**
   - Voraussetzungen: keine (Tokens existieren in `theme.css`)
   - Beschreibung: alle Stück-Klassen deklarieren (s. neue Dateien)

2. **`src/components/boardPieces.tsx` anlegen**
   - Voraussetzungen: Schritt 1 (Klassen)
   - Beschreibung: `DetectivePiece`, `GanovePiece` mit defs-Gradient,
     Schatten, Sockel, Silhouette, Index/Fahne

3. **`MapGraph.tsx` Marker austauschen**
   - Voraussetzungen: Schritt 2
   - Beschreibung: Import, Wrapper unverändert (`markerMove`, `data-*`,
     `aria-label`, Inline-`transform`), Inhalte durch Stücke ersetzt

4. **`MapGraph.module.css` bereinigen**
   - Voraussetzungen: Schritt 3
   - Beschreibung: tote Marker-Regeln entfernen, `markerMove` behalten

5. **Legenden umstellen** (`GanoveScreen.tsx`, `DetektivScreen.tsx`,
   `GanoveScreen.module.css`)
   - Voraussetzungen: Schritt 2
   - Beschreibung: Miniatur-Swatches, alte Legend-Klassen entfernen

6. **jsdom-Tests ergänzen** (`MapGraph.test.tsx`)
   - Voraussetzungen: Schritte 2–5
   - Beschreibung: neue Suite + Legenden-Tests

7. **E2E-Test ergänzen** (`e2e/design.spec.ts`)
   - Voraussetzungen: Schritte 2–5
   - Beschreibung: Browser-Nachweis Figuren + Transition + Reduced Motion

8. **Qualitätssicherung**
   - Voraussetzungen: Schritte 1–7
   - Beschreibung: `npm run typecheck && npm run lint && npm test &&
     npx playwright test` grün; `component-usage-check` ohne Befund für
     `boardPieces.tsx` (aus `MapGraph` referenziert)

## Tests

### Neue Tests

| Test | Testklasse | Was wird geprüft |
|------|------------|------------------|
| `renders both piece types as standing figures with volume, shadow and base` | `MapGraph — board pieces` | Pro `data-detective`: `data-piece="detective"`, `pieceShadow`-Ellipse, `pieceBase`, `pieceBody`, Kopf; Index-Text „1"/„2" |
| `renders the ganove as a distinct silhouette, not just another colour` | `MapGraph — board pieces` | `data-piece="ganove"` hat `pieceHat` (Krempe+Krone) + Mantel, keine `pieceIndex`-Ziffer, kein Kopf-Kreis |
| `marks the active detective with a flag, not only a colour` | `MapGraph — board pieces` | `[data-detective="1"][data-active-detective]` enthält `pieceActiveMark`/`pieceFlag`; `[data-detective="0"]` nicht |
| `fills piece bodies with a defs gradient that resolves` | `MapGraph — board pieces` | `fill`-Attribut `url(#…)` auf `pieceBody` zeigt auf `radialGradient` im selben Dokument |
| `keeps piece gradient ids unique across pieces and maps` | `MapGraph — board pieces` | Zwei `MapGraph`-Instanzen mit Detektiven+Ganove: alle `radialGradient[id]` eindeutig |
| `keeps the glide transition on the marker wrapper` | `MapGraph — board pieces` | Wrapper hat `[class*='markerMove']` und Inline-`transform` `translate(` |
| `the ganove legend shows both piece miniatures` | `Map legend swatches` | `MapLegend`: je 1× `data-piece="detective"` + `data-piece="ganove"` |
| `the detective legend shows only the detective miniature` | `Map legend swatches` | `DetectiveMapLegend`: 1× `data-piece="detective"`, 0× `data-piece="ganove"` |
| `game pieces render as standing meeples with volume and shadow` (E2E) | `design fundament` | Computed: `pieceBody`-Fill = `url(#…)`, `pieceShadow`-Opacity < 1, `pieceHat` beim Ganoven, `pieceIndex` hell; `transition-duration` 0,48 s; bei `prefers-reduced-motion` `none`; `pieceFlag` beim aktiven Detektiv in Amber `rgb(125, 82, 16)`; Legenden-Miniaturen sichtbar |

### Betroffene bestehende Tests

| Test / Testklasse | Grund der Anpassung |
|-------------------|---------------------|
| `renders detective markers with numbers and the ganove marker only when given` | Keine Anpassung nötig — `data-*`-Vertrag unverändert (Zahl = Textinhalt des Stücks statt eigenem `text`-Element; Assertion prüft nur Marker-Elemente) |
| `keeps defs ids unique when several maps share a document` | Bleibt grün; Figuren-Defs erweitern die ID-Menge — ggf. Assertion `>= 4` weiterhin erfüllt |

### E2E-Tests (primärer Funktionsnachweis)

| Priorität | Szenario | Testdatei | Abgedecktes Akzeptanzkriterium | Warum E2E nötig ist |
|-----------|----------|-----------|-------------------------------|---------------------|
| Pflicht | Figuren-Anatomie + Computed Styles (Gradient, Schatten, Hut, Fahne, Amber) | `e2e/design.spec.ts` „game pieces render as standing meeples…" | AC 1, 4 | CSS-Modul-Deklarationen nur im Browser verifizierbar (jsdom-Identity-Proxy-Falle) |
| Pflicht | Gleit-Transition + `prefers-reduced-motion` | `e2e/design.spec.ts` (derselbe Test, `page.emulateMedia`) | AC 3 | Transition-Computed-Style nur im Browser |
| Pflicht | Legenden-Miniaturen sichtbar | `e2e/design.spec.ts` (derselbe Test) | AC 5 | Visuelle Konsistenz Swatch ↔ Figur |

Bestehende E2E-Tests müssen nicht angepasst werden (`data-*`-Vertrag
stabil; kein Spec selektiert die alten Form-Klassen).

## Offene Punkte

Keine.
