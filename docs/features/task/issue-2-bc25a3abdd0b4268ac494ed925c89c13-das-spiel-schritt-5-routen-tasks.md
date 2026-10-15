# Tasks: Routen als gezeichnete Kartenwege (Schritt 5)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | UI | Casing-`<line>` (`edgeCasing`/`edgeCasingFahrt`/`edgeCasingBlocked`, `aria-hidden`) vor der semantischen Linie in `MapGraph` einfügen | Erledigt | `MapGraph.test.tsx` — „draws every edge as a cased route" |
| 2 | UI | `MapGraph.module.css`: `.edgeCasing*`-Regeln neu; `.edge`/`.edgeWeg`/`.edgeFahrt`/`.edgeBlocked` auf Kern-/Muster-Rollen umbauen | Erledigt | `e2e/design.spec.ts` — „routes draw as cased map paths with legend mirror" |
| 3 | UI | `MapLegend` (GanoveScreen.tsx): Casing-Linie in `weg`-/`fahrt`-Swatch einfügen | Erledigt | `MapGraph.test.tsx` — „the ganove legend mirrors the cased route anatomy" |
| 4 | UI | `DetectiveMapLegend` (DetektivScreen.tsx): Casing-Linie in `weg`-/`fahrt`-Swatch einfügen | Erledigt | `MapGraph.test.tsx` — „the detective legend mirrors the cased route anatomy" |
| 5 | UI | `GanoveScreen.module.css`: `legendWegCasing`/`legendFahrtCasing` neu; `legendWeg`/`legendFahrt` auf Kern-/Muster-Rollen umbauen | Erledigt | `e2e/design.spec.ts` — Legenden-Assertions im Routen-Test |
| 6 | Tests | `MapGraph.test.tsx`: Casing-Struktur-, Blockierungs- und Legenden-Spiegelungs-Tests ergänzen | Erledigt | `MapGraph.test.tsx` (36 Tests, 3 neu) |
| 7 | E2E-Tests | `e2e/design.spec.ts`: „routes draw as cased map paths with legend mirror" ergänzen | Erledigt | `e2e/design.spec.ts` (7 Tests, 1 neu) |
