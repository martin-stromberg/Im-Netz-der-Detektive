# Tasks: Schritt 4 — Spielfiguren als Meeple-Spielsteine

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | UI | `src/components/boardPieces.module.css` anlegen (alle Stück-Klassen deklariert) | Erledigt | `e2e/design.spec.ts` „game pieces stand as shaded meeples…" (Computed Styles) |
| 2 | UI | `src/components/boardPieces.tsx`: `DetectivePiece` (Gradient via `useId`, Schatten, Sockel, Silhouette+Kopf, Revers, Index-Text, Aktiv-Fahne) | Erledigt | `MapGraph.test.tsx` „renders detective markers as standing figures…" |
| 3 | UI | `src/components/boardPieces.tsx`: `GanovePiece` (Mantel-A-Linie, Fedora Krempe+Krone+Band, Gesichtsschatten, ohne Ziffer) | Erledigt | `MapGraph.test.tsx` „renders the ganove as its own silhouette…" |
| 4 | UI | `MapGraph.tsx`: Detektiv-Marker auf `<DetectivePiece>` umstellen (`markerMove`, `data-*`, `aria-label`, Inline-`transform` unverändert) | Erledigt | `MapGraph.test.tsx` „keeps the glide transition on the marker wrapper" + Bestandstests `data-detective`/`data-active-detective` |
| 5 | UI | `MapGraph.tsx`: Ganove-Marker auf `<GanovePiece>` umstellen (`data-ganove`, `<title>` unverändert) | Erledigt | `MapGraph.test.tsx` „renders the ganove as its own silhouette…" |
| 6 | UI | `MapGraph.module.css`: tote Marker-Regeln (`detectiveShape`, `ganoveShape`, `markerText`, Marker-Scoping) entfernen, `markerMove` behalten | Erledigt | `MapGraph.test.tsx` (kein `detectiveShape`/`ganoveShape` mehr im DOM; Transition-Test) |
| 7 | UI | `GanoveScreen.tsx` `MapLegend`: `legendDetective`/`legendGanove` → Figuren-Miniaturen (skalierte Hülle) | Erledigt | `MapGraph.test.tsx` „the ganove legend shows both piece miniatures" |
| 8 | UI | `DetektivScreen.tsx` `DetectiveMapLegend`: `legendDetective` → `DetectivePiece`-Miniatur | Erledigt | `MapGraph.test.tsx` „the detective legend shows only the detective miniature" |
| 9 | UI | `GanoveScreen.module.css`: `.legendDetective`/`.legendGanove` entfernen | Erledigt | `MapGraph.test.tsx` Miniatur-Tests (`data-piece` statt alter Klassen) |
| 10 | Tests | `MapGraph.test.tsx`: Suite „board pieces" — Anatomie, Silhouetten-Unterschied, Aktiv-Fahne, Gradient-Auflösung, ID-Eindeutigkeit, `markerMove` | Erledigt | Selbst die Tests (6 neue Tests, 33/33 grün) |
| 11 | Tests | `MapGraph.test.tsx`: Legenden-Miniaturen (`data-piece` in beiden Legenden; Detektiv-Legende ohne Ganove) | Erledigt | Selbst die Tests (2 neue Tests) |
| 12 | E2E-Tests | `e2e/design.spec.ts`: Figuren im Browser — Computed Styles (Gradient-Fill, Schatten-Opacity, Hat, Index-Fill, Amber-Fahne), Transition 480 ms, `prefers-reduced-motion`, Legenden-Miniaturen | Erledigt | Selbst der Test (6/6 design.spec grün; 35/35 gesamt) |
| 13 | QS | `npm run typecheck && npm run lint && npm test && npx playwright test` grün; `component-usage-check` ohne Befund | Erledigt | typecheck ✓, lint ✓, 614 Vitest ✓, 35 Playwright ✓, usage-check „no orphans" |
