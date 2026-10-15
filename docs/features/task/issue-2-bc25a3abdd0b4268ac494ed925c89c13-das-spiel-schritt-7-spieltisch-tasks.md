# Tasks: Spieltisch (Schritt 7, „Finales Brettspiel-Design")

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | UI/Tischfläche | `.screen` in `GanoveScreen.module.css` zur Tischfläche umstellen (bg-noir-Basis + Tisch-Gradienten, `background-color: var(--color-table)`) | Erledigt | `design.spec.ts` › all screens share the same table surface and card controls |
| 2 | UI/Tischfläche | `.shell` in `App.module.css` auf `--color-table-edge` umstellen | Erledigt | Kein direkter Test (Overscroll-Fläche, hinter `.screen` verdeckt) |
| 3 | UI/Einlage | `.layout` in `GanoveScreen.module.css` als gerahmte Spieleinlage gestalten (Kartonrand, Schnittkante, Inset-Vertiefung, Innenlinie) | Erledigt | `design.spec.ts` › the board sits in a framed table inset with card well and intact overlay stack |
| 4 | UI/Kartenstapel | `.sidebar` in `GanoveScreen.module.css` als vertieftes Kartenfach gestalten | Erledigt | `design.spec.ts` › the board sits in a framed table inset with card well and intact overlay stack |
| 5 | UI/Zählleiste | `.statusBar` in `GanoveScreen.module.css` als vertiefte Zählleiste gestalten | Erledigt | Kein direkter Test (rein visuelle Fläche; kein Funktionsvertrag) |
| 6 | UI/Reste | `.perspectiveToggle` in `Menu.module.css` als Schalterplatte mit Messing-Segment neu stylen | Erledigt | `design.spec.ts` › all screens share the same table surface and card controls |
| 7 | UI/Reste | `.cardImage` in `Menu.module.css` als gerahmte Bildplatte gestalten | Erledigt | Kein direkter Test (rein visuelle Rahmung; Sichtbarkeit des Titelbilds via `menu.spec.ts` › main menu) |
| 8 | E2E-Tests | Testblock „game table composition" in `e2e/design.spec.ts` ergänzen (Tischfläche, Einlage, Kartenfach, Toggle, Overlay-Stack, Responsiv-Stapelung) | Erledigt | `design.spec.ts` › 2 neue Tests, beide bestanden |
| 9 | Tests | Vitest, Typecheck, Lint und Playwright-Suite ausführen und grün halten | Erledigt | Vitest 617/617, Playwright 39/39, `tsc`/`eslint` fehlerfrei |
