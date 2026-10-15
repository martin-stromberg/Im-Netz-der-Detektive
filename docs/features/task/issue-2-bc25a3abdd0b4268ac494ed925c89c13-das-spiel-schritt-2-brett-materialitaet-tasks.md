# Tasks: Schritt 2 — Brett-Materialität (Pergament, Papprand, Tischschatten)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Tokens | `--color-map-*`-Tinten-Tokens in `theme.css` ergänzen (13 Tokens mit Kontrast-Kommentaren) | Offen | — |
| 2 | Tokens | `--color-feature-*`-Werte in `theme.css` auf Pergament-Geographie umstellen (8 Tokens) | Offen | — |
| 3 | UI | `MapGraph.tsx`: `useId`-Import + `defsId` | Offen | — |
| 4 | UI | `MapGraph.tsx`: `<defs>` mit `feTurbulence`-Grain-Filter und `radialGradient`-Vignette | Offen | — |
| 5 | UI | `MapGraph.tsx`: `boardFace`-Gruppe (Papier/Grain/Vignette/Seam-Rechtecke) als erstes SVG-Kind vor `<MapBackdrop>` | Offen | — |
| 6 | UI | `MapGraph.tsx`: Zonen-Halo-Inline-Farbe auf `hsl(h 55% 45%)` abdunkeln | Offen | — |
| 7 | UI | `MapGraph.module.css`: `.map` Papier-Background, 7-px-Cardboard-Rand, `border-radius`, mehrstufiger `box-shadow` | Offen | — |
| 8 | UI | `MapGraph.module.css`: neue Klassen `boardFace`/`boardPaper`/`boardGrain`/`boardVignette`/`boardSeam` | Offen | — |
| 9 | UI | `MapGraph.module.css`: alle Kartenfarben auf `--color-map-*`/Ink umstellen (Edges, Labels, Glyphen, Marker, Halo-Opacity) | Offen | — |
| 10 | UI | `GanoveScreen.module.css`: Papier-Chip hinter Legenden-Swatches + Swatch-Farben auf Map-Tokens | Offen | — |
| 11 | UI | `DetektivScreen.module.css`: Legenden-Swatch-Farben auf Map-Tokens | Offen | — |
| 12 | Tests | `MapGraph.test.tsx`: Brettfläche-Test (defs, Filter, Gradient, Reihenfolge, aria-hidden/pointer-events) | Offen | — |
| 13 | Tests | `MapGraph.test.tsx`: ID-Eindeutigkeit bei zwei Instanzen + `data-layer`-Reihenfolge mit Board | Offen | — |
| 14 | E2E-Tests | `e2e/design.spec.ts`: Brett-Materialität (Computed Styles + defs + Label-Farbwert) | Offen | — |
