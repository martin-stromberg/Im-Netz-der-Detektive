# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| Beide Figurentypen als greifbare Spielsteine (Volumen, Schatten, Standfläche), unterscheidbar über Form + Farbe + Index/Text | `boardPieces.tsx`: defs-`radialGradient` je Figur, `pieceShadow`-Ellipse, `pieceBase`-Sockel; Detektiv = Meeple-Silhouette+Kopf+Index vs. Ganove = Mantel+Fedora ohne Ziffer | jsdom „Anatomie", „distinct silhouette"; E2E „Computed Styles" | Abgedeckt |
| `data-detective`, `data-active-detective`, `data-ganove`, Sichtbarkeitslogik (`ganovePosition` nur Ganove-Perspektive) unverändert — kein Info-Leak | Wrapper-`<g>` in `MapGraph` bleibt mit allen `data-*`/bedingtem Rendering; Detektiv-Legende ohne Ganove-Swatch | Bestehende `data-*`-Tests + Asymmetrie-Test bleiben unverändert; Legenden-Test „detective legend shows only the detective miniature" | Abgedeckt |
| Gleitanimation weiter funktionsfähig + `prefers-reduced-motion`; aktive Figur nicht nur über Farbe | `markerMove` (480 ms + Media-Query) bleibt auf Wrapper; Aktiv = Fahnen-Gruppe (`pieceFlagPole`/`pieceFlag`) + `pieceBaseActive` (Form + Amber) | jsdom „active detective with a flag", „keeps the glide transition"; E2E: Transition-Computed-Style + `page.emulateMedia` | Abgedeckt |
| Legenden konsistent (`legendDetective`/`legendGanove` = Miniaturen der neuen Figuren) | Dieselben Komponenten in skalierter Hülle in `MapLegend` + `DetectiveMapLegend` | jsdom „legend shows both piece miniatures" / „only the detective miniature"; E2E Legenden-Mirror | Abgedeckt |
| Vitest/Playwright grün; `component-usage-check` erfüllt (Modul referenziert) | QS-Schritt 8: volle Suite; `boardPieces` wird aus `MapGraph` + beiden Screens importiert | Schritt-10-Testlauf | Abgedeckt |

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| Figuren-Anatomie real gerendert (Gradient, Schatten, Silhouetten, Fahne, Amber-Akzent) — AC 1, 4 | `design.spec.ts`: „game pieces render as standing meeples with volume and shadow" | Abgedeckt |
| Gleit-Transition + Reduced Motion — AC 3 | Derselbe Test mit `page.emulateMedia({ reducedMotion: "reduce" })` | Abgedeckt |
| Legenden-Miniaturen konsistent — AC 5 | Derselbe Test (Legenden-Ausschnitt) | Abgedeckt |
| Sichtbarkeitsregeln (kein Info-Leak) — AC 2 | Bestehende Asymmetrie-E2E (`ganove.spec.ts`/`detektiv.spec.ts`: „nothing leaks") + jsdom-Asymmetrie-Test — bleiben unverändert grün | Abgedeckt |

## Hinweise

- Neuer sichtbarer Inhalt ist rein dekorativ (kein neuer Bedienfluss);
  die Pflicht-E2E-Nachweise liegen in `design.spec.ts`, da dort die
  Design-Schritte 2/3 ihre visuellen Nachweise führen — konsistent.
- Die einzige bewusst eingegangene visuelle Abweichung: Überlappung auf
  der winzigen Testkarte (im Plan als Seiteneffekt dokumentiert).
