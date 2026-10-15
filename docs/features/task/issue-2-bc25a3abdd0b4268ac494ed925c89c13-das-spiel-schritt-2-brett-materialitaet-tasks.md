# Tasks: Schritt 2 — Brett-Materialität (Pergament, Papprand, Tischschatten)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Tokens | `--color-map-*`-Tinten-Tokens in `theme.css` ergänzen (13 Tokens mit Kontrast-Kommentaren) | Erledigt | `e2e/design.spec.ts` „theme custom properties"/„board materiality" (Tokens auf `:root` + Paper-Background im Browser) |
| 2 | Tokens | `--color-feature-*`-Werte in `theme.css` auf Pergament-Geographie umstellen (8 Tokens) | Erledigt | `e2e/design.spec.ts` „board materiality" (`data-layer="board"` rendert auf Papier) |
| 3 | UI | `MapGraph.tsx`: `useId`-Import + `defsId` | Erledigt | `MapGraph.test.tsx` „keeps defs ids unique when several maps share a document" |
| 4 | UI | `MapGraph.tsx`: `<defs>` mit `feTurbulence`-Grain-Filter und `radialGradient`-Vignette | Erledigt | `MapGraph.test.tsx` „renders a parchment board face beneath every data layer" |
| 5 | UI | `MapGraph.tsx`: `boardFace`-Gruppe (Papier/Grain/Vignette/Seam-Rechtecke) als erstes SVG-Kind vor `<MapBackdrop>` | Erledigt | `MapGraph.test.tsx` „renders a parchment board face beneath every data layer" (DOM-Position via `compareDocumentPosition`) |
| 6 | UI | `MapGraph.tsx`: Zonen-Halo-Inline-Farbe auf `hsl(h 55% 45%)` abdunkeln | Erledigt | `MapGraph.test.tsx` „renders category badges and zone halos on demand" (`data-zone` unverändert) |
| 7 | UI | `MapGraph.module.css`: `.map` Papier-Background, 7-px-Cardboard-Rand, `border-radius`, mehrstufiger `box-shadow` | Erledigt | `e2e/design.spec.ts` „board materiality" (computed `background-color`, `box-shadow`, `border-width`, `border-radius`) |
| 8 | UI | `MapGraph.module.css`: neue Klassen `boardFace`/`boardPaper`/`boardGrain`/`boardVignette`/`boardSeam` | Erledigt | `MapGraph.test.tsx` „renders a parchment board face beneath every data layer" (`[class*='boardFace']`, `[class*='boardPaper']`) |
| 9 | UI | `MapGraph.module.css`: alle Kartenfarben auf `--color-map-*`/Ink umstellen (Edges, Labels, Glyphen, Marker, Halo-Opacity) | Erledigt | `e2e/design.spec.ts` „board materiality" (Label-Fill-Luminanz < 0.4) + bestehende `MapGraph`-Strukturtests |
| 10 | UI | `GanoveScreen.module.css`: Papier-Chip hinter Legenden-Swatches + Swatch-Farben auf Map-Tokens | Erledigt | Kein direkter Test (reine Optik; Strukturtests `map-legend` unverändert) |
| 11 | UI | `DetektivScreen.module.css`: Legenden-Swatch-Farben auf Map-Tokens | Erledigt | Kein direkter Test (reine Optik) |
| 12 | Tests | `MapGraph.test.tsx`: Brettfläche-Test (defs, Filter, Gradient, Reihenfolge, aria-hidden/pointer-events) | Erledigt | Selbst der Test |
| 13 | Tests | `MapGraph.test.tsx`: ID-Eindeutigkeit bei zwei Instanzen + `data-layer`-Reihenfolge mit Board | Erledigt | Selbst die Tests |
| 14 | E2E-Tests | `e2e/design.spec.ts`: Brett-Materialität (Computed Styles + defs + Label-Farbwert) | Erledigt | Selbst der Test (4/4 grün) |
