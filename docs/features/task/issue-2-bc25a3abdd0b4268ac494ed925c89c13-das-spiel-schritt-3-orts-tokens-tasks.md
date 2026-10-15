# Tasks: Schritt 3 — Orts-Tokens (geprägte Plaketten statt Punkte)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | UI | `MapGraph.tsx`: `radialGradient` `{defsId}-tokenFace` in `<defs>` ergänzen | Offen | — |
| 2 | UI | `MapGraph.tsx`: `nodeDot`-Kreis durch `nodeToken`-Gruppe (Schatten, Rim, Face, Innenlinie) ersetzen | Offen | — |
| 3 | UI | `MapGraph.tsx`: `legalRing` auch bei `nodeSelectable` rendern | Offen | — |
| 4 | UI | `MapGraph.module.css`: `.nodeDot` entfernen, Token-Klassen (`nodeToken`, `tokenShadow`, `tokenRim`, `tokenFace`, `tokenInner`) einführen | Offen | — |
| 5 | UI | `MapGraph.module.css`: Zustandsselektoren auf Token übertragen (`nodeLegal`/`nodeSelectable` Perforation+Grün, `nodeCurrentTarget`, `nodeGanoveHere`, Hover, `:focus-visible` Amber) | Offen | — |
| 6 | UI | `GanoveScreen.tsx`/`GanoveScreen.module.css`: `legendTargetDot` als Mini-Plakette (Rim+Face+Innenlinie), `legendTargetRing` gestrichelt | Offen | — |
| 7 | UI | `DetektivScreen.tsx`: `DetectiveMapLegend` um identisches Token-Swatch (`legend.target`) erweitern | Offen | — |
| 8 | Tests | `MapGraph.test.tsx`: Token-Struktur-Test (Plakette je `data-node-id`, kein `nodeDot`, Geometrie < 14) | Offen | — |
| 9 | Tests | `MapGraph.test.tsx`: Hit-Area-Test (r=14 nur bei interaktiven Knoten) | Offen | — |
| 10 | Tests | `MapGraph.test.tsx`: `legalRing` bei legal **und** selectable | Offen | — |
| 11 | Tests | `MapGraph.test.tsx`: Token-Gradient-Def vorhanden/auflösbar | Offen | — |
| 12 | Tests | Screen-Tests: Legend-Swatch spiegelt Plaketten-Form (Ganove + Detektiv) | Offen | — |
| 13 | E2E-Tests | `e2e/design.spec.ts`: Token-Optik im Browser (Gradient-Fill, Rim, Schatten) + Fokus-Ring | Offen | — |
