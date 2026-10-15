# Umsetzungsplan: Orts-Tokens — Knoten als geprägte Plaketten (Schritt 3)

## Übersicht

Der flache `nodeDot`-Kreis (r=8) in `MapGraph` wird durch ein plakettenartiges
Orts-Token ersetzt: Schatten, eingefasste Kappe mit doppeltem Ring und
`radialGradient`-Prägung auf Papier-/Sepia-Tönen. Zustände (`nodeLegal`,
`nodeSelectable`, `nodeCurrentTarget`, `nodeGanoveHere`, Fokus) wechseln Rand
und Füllung des Tokens und bleiben zusätzlich über die bestehenden
Form-Overlays erkennbar. Die Legenden-Swatches beider Perspektiven zeigen
dieselbe Token-Form.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| Token-Geometrie | Vier gestapelte Primitive in einer `g.nodeToken`-Gruppe: `ellipse.tokenShadow`, `circle.tokenRim` (r=8, Fassung), `circle.tokenFace` (r≈6.2, `fill=url(#{defsId}-tokenFace)`), `circle.tokenInner` (r≈4.4, feine Innenlinie) | Plakette mit Fassung + eingravierter Innenlinie liest wie eine gedruckte Kartenplakette; alles innerhalb der Hit-Area r=14 |
| Prägung | `radialGradient {defsId}-tokenFace` im bestehenden `<defs>` (Stops über `style={{ stopColor: "var(--color-paper)" }}` → `var(--color-paper-aged)` wie bei `-vignette`) | `defsId`-Muster garantiert Kollisionsfreiheit bei mehreren `MapGraph`-Instanzen; CSS-`fill` auf `.tokenFace` kann die url-Füllung in Zuständen überschreiben |
| Zustands-Formcodierung | `nodeLegal`/`nodeSelectable`: `tokenRim` bekommt `stroke-dasharray`-Perforation (Briefmarkenrand) + `--color-map-legal`-Stroke; der gestrichelte `legalRing` (r=12) wird auch für `nodeSelectable` gerendert (gleiche Bedeutung „wählbar"); `nodeCurrentTarget`/`focus-visible`: Amber-Rand auf `tokenRim`; `nodeGanoveHere`: `tokenFace`-Füllung `--color-map-ganove` | Form (Perforation/Ring) + Farbe — Farbe nie alleiniges Merkmal; Parität legal/selectable wie bisher |
| Schatten | Flache `ellipse` hinter dem Token (`fill: var(--color-ink)`, niedrige `fill-opacity`, leicht nach unten versetzt) statt SVG-`filter`-Schatten | Kein zusätzlicher Filter nötig, performant, reduziert-motion-sicher |
| Tokens ohne neue Farbtokens | Bestehende `--color-paper`, `--color-paper-aged`, `--color-ink`, `--color-ink-soft`, `--color-map-*` reichen aus; Schatten-Alpha via `fill-opacity` in der Klasse | Keine fehlenden Tokens — `theme.css` bleibt unverändert |
| Legend-Swatches | `MapLegend`: `legendTargetDot` wird zur Mini-Plakette (Rim + Face + Innenlinie, legal-grüne Perforationsfassung), `legendTargetRing` bleibt gestrichelter Außenring; `DetectiveMapLegend`: neues identisches Token-Swatch mit `t("legend.target")` | „Gleiche Form = gleiche Bedeutung" zwischen Karte und Legende in beiden Perspektiven |

## Programmabläufe

### Rendering eines Ortes

1. `MapGraph` iteriert `map.nodes` und rendert je Knoten ein `<g>` mit
   den bestehenden Zustandsklassen und `data-*`-Attributen (unverändert).
2. Innerhalb des `<g>`: bei interaktiven Knoten zuerst die `hitArea`
   (r=14), dann `zoneHalo` (falls `showZones`), dann `nodeToken`-Gruppe
   (Schatten → Rim → Face → Innenlinie), dann die Overlays
   (`legalRing` nun bei `nodeLegal` **oder** `nodeSelectable`,
   `possibleRing`, `categoryBadge`, `cameraGlyph`, `markerPin`,
   `escapeMarker`, `missionBadge`, `nodeLabel`).

Beteiligte Komponenten: `MapGraph.tsx`, `MapGraph.module.css`

### Legenden-Synchronisation

1. `MapLegend` (GanoveScreen) zeigt das Token-Swatch in der gleichen
   Form wie `nodeLegal`-/`nodeSelectable`-Tokens auf der Karte.
2. `DetectiveMapLegend` (DetektivScreen) erhält ein identisches Swatch
   (`legend.target`-Label bereits als i18n-Key vorhanden).

Beteiligte Komponenten: `GanoveScreen.tsx/.module.css`,
`DetektivScreen.tsx/.module.css`

## Neue Klassen

Keine — die Änderung ist rein darstellend (SVG-Struktur + CSS).

## Änderungen an bestehenden Klassen

### `MapGraph` (`src/components/MapGraph.tsx`)

- **`<defs>` erweitern:** `radialGradient` `{defsId}-tokenFace` (Stopps via
  `style`-`stopColor` auf `var(--color-paper)`/`var(--color-paper-aged)`),
  Muster wie `-vignette`.
- **Knoten-Rendering:** `<circle className={styles.nodeDot}>` ersetzen durch
  `<g className={styles.nodeToken} aria-hidden="true">` mit `tokenShadow`,
  `tokenRim`, `tokenFace` (`fill={\`url(#${defsId}-tokenFace)\`}`) und
  `tokenInner`. Die Geometrie bleibt ≤ r≈9 (Schattenversatz) < 14.
- **`legalRing`:** Render-Bedingung von `legalTargetIds.has(node.id)` auf
  `nodeLegal || nodeSelectable` erweitern (Klasse bleibt `styles.legalRing`).

### `MapGraph.module.css`

- `.nodeDot` und seine Zustandsselektoren entfernen; neue Klassen:
  `.nodeToken` (pointer-events bleibt none via `.map :where`),
  `.tokenShadow` (`fill: var(--color-ink)`, `fill-opacity` ≈ 0.25),
  `.tokenRim` (`fill: var(--color-paper-aged)`, `stroke: var(--color-ink)`),
  `.tokenFace` (Fallback-`fill: var(--color-paper)` — url-Fill kommt als
  Attribut), `.tokenInner` (`fill: none`, `stroke: var(--color-ink-soft)`,
  dünn).
- Zustände: `.nodeLegal .tokenRim`/`.nodeSelectable .tokenRim`
  (Stroke `--color-map-legal`, `stroke-dasharray`-Perforation),
  `.nodeInteractive:hover .tokenFace` (`--color-map-legal-hover`),
  `.nodeCurrentTarget .tokenRim` (Amber, dicker),
  `.nodeGanoveHere .tokenFace` (`--color-map-ganove`),
  `.nodeInteractive:focus-visible .tokenRim` (Amber-Ring 3px — wie bisher).

### `MapLegend` (`src/components/GanoveScreen.tsx`)

- Target-Swatch: `legendTargetDot`-Kreis durch Mini-Plakette ersetzen
  (Rim-Kreis + Face-Kreis + Innenlinie), `legendTargetRing` bleibt
  gestrichelter Außenring.

### `DetectiveMapLegend` (`src/components/DetektivScreen.tsx`)

- Neues `legendItem` mit identischem Mini-Token-Swatch +
  `t("legend.target")` — Position vor dem Zonen-Eintrag.

### `GanoveScreen.module.css`

- `legendTargetDot` → Plaketten-Styling (Rim: `fill: var(--color-paper-aged)`,
  `stroke: var(--color-map-legal)`, `stroke-dasharray`-Perforation);
  neue `.legendTargetFace`/`.legendTargetInner` analog zu
  `.tokenFace`/`.tokenInner` (statisch, kein Gradient nötig — Papier-Fill);
  `.legendTargetRing` bleibt gestrichelt grün.

### `DetektivScreen.module.css`

- Keine neuen Klassen nötig, wenn das Swatch die `shared`-Klassen
  (`legendTargetDot` etc. aus `GanoveScreen.module.css`) nutzt —
  `DetectiveMapLegend` importiert `shared` bereits.

### `src/theme.css`

- Keine Änderung — alle benötigten Tokens vorhanden (siehe
  Designentscheidung).

## Datenbankmigrationen

Keine.

## Validierungsregeln

Keine — keine neue oder geänderte Eingabe.

## Konfigurationsänderungen

Keine.

## Seiteneffekte und Risiken

- **ReplayScreen:** Zwei `MapGraph`-Instanzen — `defsId` stellt eindeutige
  Gradienten-IDs sicher (bestehender Test deckt das).
- **Overlay-Geometrie:** `zoneHalo` (r=13) liegt über dem Token-Rand — Halo
  bleibt sichtbar hinter/unter dem Token-Rim (r=8); `legalRing` (r=12),
  `possibleRing` (r=15) und Labels unverändert positioniert.
- **Info-Leaks:** Keine neuen Props/Render-Pfade — das Swatch in
  `DetectiveMapLegend` ist statisch und enthält keine Spieldaten.
- **Hover-Selektor:** `.nodeInteractive:hover .tokenFace` überschreibt die
  `url()`-Füllung — bewusst gewollt, identisch zur alten Hover-Mechanik.

## Umsetzungsreihenfolge

1. **`MapGraph.tsx`: Token-Gradient + Token-Gruppe**
   - Voraussetzungen: Keine (defs/`defsId` existieren).
   - Beschreibung: `radialGradient` in `<defs>`; `nodeDot` durch
     `nodeToken`-Gruppe ersetzen; `legalRing` auch bei `nodeSelectable`.
2. **`MapGraph.module.css`: Token-Klassen + Zustände**
   - Voraussetzungen: Schritt 1.
   - Beschreibung: `.nodeDot`-Regeln entfernen, Token-Klassen und
     Zustandsselektoren einführen; `:focus-visible`-Amber auf `.tokenRim`.
3. **Legenden (`GanoveScreen.tsx`, `DetektivScreen.tsx`, `GanoveScreen.module.css`)**
   - Voraussetzungen: Schritt 2 (Klassennamen spiegeln).
   - Beschreibung: Mini-Plakette in `MapLegend`; identisches Swatch in
     `DetectiveMapLegend` hinzufügen.
4. **Vitest-Tests erweitern (`MapGraph.test.tsx`, ggf. Screen-Tests)**
   - Voraussetzungen: Schritte 1–3.
   - Beschreibung: Token-Struktur, Hit-Area r=14, defs-Eindeutigkeit
     (bestehender Test erfasst neue `fill=url`-Referenzen automatisch),
     Legend-Swatch-Spiegelung.
5. **E2E-Test (`e2e/design.spec.ts`)**
   - Voraussetzungen: Schritte 1–3.
   - Beschreibung: Token-Optik auf dem Brett (Gradient-Fill, Rim,
     Schatten, keine `nodeDot`-Klasse) + Legend-Swatch.

## Tests

### Neue Tests

| Test / Hilfsmethode | Testklasse | Was wird geprüft / bereitgestellt? |
|--------------------|------------|-------------------------------------|
| `renders each place as a framed plaque token` | `MapGraph.test.tsx` | Pro `[data-node-id]` Token-Gruppe mit Rim/Face/Innenlinie/Schatten; kein `nodeDot` mehr; Token-Geometrie < 14 |
| `keeps the invisible hit area at r=14 above the token` | `MapGraph.test.tsx` | `hitArea`-Kreis r=14 nur bei interaktiven Knoten |
| `marks legal and selectable nodes with dashed ring and perforated rim` | `MapGraph.test.tsx` | `legalRing` bei `data-legal-target` **und** `data-selectable` |
| `the token embossing gradient lives in defs and resolves` | `MapGraph.test.tsx` | `radialGradient`-Def `*-tokenFace` vorhanden; `fill=url(#…)`-Referenzen auflösbar (Erweiterung des bestehenden ID-Tests abgedeckt) |
| `the legend swatch mirrors the plaque token` | `GanoveScreen.test.tsx` / `DetektivScreen.test.tsx` | Swatch enthält Plaketten-Struktur (Rim + Face + Ring) in beiden Legenden |

### Betroffene bestehende Tests

| Test / Testklasse | Grund der Anpassung |
|-------------------|---------------------|
| `keeps defs ids unique when several maps share a document` (`MapGraph.test.tsx`) | Zählt `radialGradient[id]` — jetzt ≥6 statt ≥4; Assertion `toBeGreaterThanOrEqual(4)` bleibt gültig, keine Anpassung nötig |

### E2E-Tests (primärer Funktionsnachweis)

| Priorität | Szenario | Testdatei / Testklasse | Abgedecktes Akzeptanzkriterium | Warum E2E nötig ist |
|-----------|----------|------------------------|-------------------------------|-------------------|
| Pflicht | Orte erscheinen als geprägte Plaketten (Token-Elemente + Gradient im gerenderten Browser) | `e2e/design.spec.ts` „place tokens render as embossed plaques" | Plaketten-Rendering, Labels lesbar | Nur im Browser auflösbare `url(#…)`-Füllung und Computed Styles |
| Pflicht | Tastatur-Roaming + `:focus-visible`-Ring am Token | `e2e/design.spec.ts` (Fokus-Ring-Assertion; Roaming durch bestehenden `i18n-a11y.spec.ts`-Fluss) | Fokus-Verhalten unverändert | Sichtbares Fokusverhalten ist UI-only |

Bestehende E2E-Tests (`ganove.spec.ts`, `detektiv.spec.ts`,
`i18n-a11y.spec.ts`) decken den Benutzerfluss (Spawn-Wahl, Züge,
Pfeiltasten-Roaming, Marker) unverändert ab — keine Anpassung nötig.

Welche bestehenden E2E-Tests müssen angepasst werden? **Keine.**

## Offene Punkte

Keine.
