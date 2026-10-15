# Tasks: Schritt 4 — Spielfiguren als Meeple-Spielsteine

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | UI | `src/components/boardPieces.module.css` anlegen (alle Stück-Klassen deklariert) | Offen | — |
| 2 | UI | `src/components/boardPieces.tsx`: `DetectivePiece` (Gradient via `useId`, Schatten, Sockel, Silhouette+Kopf, Revers, Index-Text, Aktiv-Fahne) | Offen | — |
| 3 | UI | `src/components/boardPieces.tsx`: `GanovePiece` (Mantel-A-Linie, Fedora Krempe+Krone+Band, Gesichtsschatten, ohne Ziffer) | Offen | — |
| 4 | UI | `MapGraph.tsx`: Detektiv-Marker auf `<DetectivePiece>` umstellen (`markerMove`, `data-*`, `aria-label`, Inline-`transform` unverändert) | Offen | — |
| 5 | UI | `MapGraph.tsx`: Ganove-Marker auf `<GanovePiece>` umstellen (`data-ganove`, `<title>` unverändert) | Offen | — |
| 6 | UI | `MapGraph.module.css`: tote Marker-Regeln (`detectiveShape`, `ganoveShape`, `markerText`, Marker-Scoping) entfernen, `markerMove` behalten | Offen | — |
| 7 | UI | `GanoveScreen.tsx` `MapLegend`: `legendDetective`/`legendGanove` → Figuren-Miniaturen (skalierte Hülle) | Offen | — |
| 8 | UI | `DetektivScreen.tsx` `DetectiveMapLegend`: `legendDetective` → `DetectivePiece`-Miniatur | Offen | — |
| 9 | UI | `GanoveScreen.module.css`: `.legendDetective`/`.legendGanove` entfernen | Offen | — |
| 10 | Tests | `MapGraph.test.tsx`: Suite „board pieces" — Anatomie, Silhouetten-Unterschied, Aktiv-Fahne, Gradient-Auflösung, ID-Eindeutigkeit, `markerMove` | Offen | — |
| 11 | Tests | `MapGraph.test.tsx`: Legenden-Miniaturen (`data-piece` in beiden Legenden; Detektiv-Legende ohne Ganove) | Offen | — |
| 12 | E2E-Tests | `e2e/design.spec.ts`: Figuren im Browser — Computed Styles (Gradient-Fill, Schatten-Opacity, Hat, Index-Fill, Amber-Fahne), Transition 480 ms, `prefers-reduced-motion`, Legenden-Miniaturen | Offen | — |
| 13 | QS | `npm run typecheck && npm run lint && npm test && npx playwright test` grün; `component-usage-check` ohne Befund | Offen | — |
