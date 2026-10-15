# Tasks: Schritt 3 — Orts-Tokens (geprägte Plaketten statt Punkte)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | UI | `MapGraph.tsx`: `radialGradient` `{defsId}-tokenFace` in `<defs>` ergänzen | Erledigt | `MapGraph.test.tsx` „embosses the token face with a defs gradient that resolves" |
| 2 | UI | `MapGraph.tsx`: `nodeDot`-Kreis durch `nodeToken`-Gruppe (Schatten, Rim, Face, Innenlinie) ersetzen | Erledigt | `MapGraph.test.tsx` „renders each place as a framed plaque token, not a flat dot" |
| 3 | UI | `MapGraph.tsx`: `legalRing` auch bei `nodeSelectable`/`data-markable` rendern | Erledigt | `MapGraph.test.tsx` „marks legal and selectable places with the dashed ring" |
| 4 | UI | `MapGraph.module.css`: `.nodeDot` entfernen, Token-Klassen (`nodeToken`, `tokenShadow`, `tokenRim`, `tokenFace`, `tokenInner`) einführen | Erledigt | `MapGraph.test.tsx` „renders each place as a framed plaque token" (kein `nodeDot` mehr im DOM) |
| 5 | UI | `MapGraph.module.css`: Zustandsselektoren auf Token übertragen (`nodeLegal`/`nodeSelectable` Perforation+Grün, `nodeCurrentTarget`, `nodeGanoveHere`, Hover, `:focus-visible` Amber) | Erledigt | `e2e/design.spec.ts` „places render as embossed plaque tokens with legend mirror" (Fokus-Ring-Stroke = `--color-map-accent`) |
| 6 | UI | `GanoveScreen.tsx`/`GanoveScreen.module.css`: `legendTargetDot` als Mini-Plakette (Rim+Face+Innenlinie), `legendTargetRing` gestrichelt | Erledigt | `MapGraph.test.tsx` „the ganove legend shows the plaque token swatch" |
| 7 | UI | `DetektivScreen.tsx`: `DetectiveMapLegend` um identisches Token-Swatch (`legend.target`) erweitern | Erledigt | `MapGraph.test.tsx` „the detective legend shows the identical plaque token swatch" |
| 8 | Tests | `MapGraph.test.tsx`: Token-Struktur-Test (Plakette je `data-node-id`, kein `nodeDot`, Geometrie < 14) | Erledigt | Selbst der Test |
| 9 | Tests | `MapGraph.test.tsx`: Hit-Area-Test (r=14 nur bei interaktiven Knoten) | Erledigt | Selbst der Test |
| 10 | Tests | `MapGraph.test.tsx`: `legalRing` bei legal **und** selectable/markable | Erledigt | Selbst der Test |
| 11 | Tests | `MapGraph.test.tsx`: Token-Gradient-Def vorhanden/auflösbar | Erledigt | Selbst der Test |
| 12 | Tests | Screen-Tests: Legend-Swatch spiegelt Plaketten-Form (Ganove + Detektiv) | Erledigt | Selbst die Tests (in `MapGraph.test.tsx` „Map legend swatches") |
| 13 | E2E-Tests | `e2e/design.spec.ts`: Token-Optik im Browser (Gradient-Fill, Rim, Schatten) + Fokus-Ring | Erledigt | Selbst der Test (34/34 Playwright grün) |
