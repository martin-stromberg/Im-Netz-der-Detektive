# Bestandsaufnahme: Spielfiguren als Meeple-Spielsteine (Design-Schritt 4)

Analyse des bestehenden Codes bezogen auf `requirement.md`: Marker-Rendering
in `MapGraph`, Glyph-Konvention aus `landmarks.tsx`, Legenden-Swatches,
Design-Tokens und Testvertrag.

## Zusammenfassung

- **Marker-Status quo:** `MapGraph.tsx` rendert Detektive als flaches
  `rect` (`detectiveShape`) mit Index-`text` (`markerText`, Inhalt
  `index + 1`) und den Ganoven als Raute (`ganoveShape`, Pfad
  `M 0 -7 L 6 0 L 0 7 L -6 0 Z`). Beide sitzen in
  `<g data-layer="markers">`, positioniert per Inline-`transform`
  `translate(node.x, node.y - NODE_RADIUS - 8)` (= `y - 16`) — die
  `markerMove`-Klasse (Transition `transform 480ms`, deaktiviert bei
  `prefers-reduced-motion`) liegt auf demselben äußeren `<g>` wie die
  `data-*`-Attribute.
- **Testvertrag:** `data-detective={index}`, `data-active-detective`,
  `data-ganove="true"` sind in `MapGraph.test.tsx` verankert; Ganove-Marker
  nur bei gesetztem `ganovePosition` (Asymmetrie-Test vorhanden).
- **Glyph-Konvention vorhanden:** `landmarks.tsx` — lokale Glyph-Box mit
  Fußpunkt am Ursprung, Platzierung per `transform` am äußeren `<g>`,
  `aria-hidden`, `stroke "#10141c"` / `strokeWidth 1.5` Comic-Kontur,
  flache Warmfarben. Exakt die geforderte Vorlage für `boardPieces.tsx`.
- **defs-Gradienten-Muster vorhanden:** `MapGraph` nutzt `useId`-basierte
  `defsId` für `grain`-Filter, `vignette`- und `tokenFace`-Gradients;
  ein Test („keeps defs ids unique…") prüft Eindeutigkeit und
  `url(#…)`-Auflösbarkeit über mehrere Map-Instanzen — neue
  Figuren-Gradients müssen dasselbe Muster nutzen.
- **Design-Tokens vollständig:** `theme.css` liefert Papier/Tinte
  (`--color-paper`, `--color-ink`, `--color-ink-soft`), Detektiv-Familie
  (`--color-detective`, `--color-map-detective-stroke`,
  `--color-map-detective-active`), Ganove (`--color-map-ganove`) und
  Amber-Akzent (`--color-map-accent`) — alle für Kontrast auf Papier
  kalibriert.
- **Orts-Tokens (Schritt 3) vorhanden:** jeder Knoten rendert
  `nodeToken`-Gruppe (Schatten/Rim/Face/Inner) am Knotenpunkt; Figuren
  müssen optisch darauf stehen (Fußpunkt ≈ Knotenzentrum).
- **Legenden:** `DetectiveMapLegend` (`DetektivScreen.tsx`) und
  `MapLegend` (`GanoveScreen.tsx`) nutzen flache Swatches:
  `legendDetective` = `rect 10×10 rx2`, `legendGanove` = Raute
  `M 6 0 L 11 6 L 6 12 L 1 6 Z`. CSS in `GanoveScreen.module.css`
  (shared für beide Legenden); Swatches haben Papier-Chip-Hintergrund
  (`.legendItem svg`).
- **jsdom-Falle dokumentiert:** Vitest nutzt Identity-Proxy für
  CSS-Module — nicht deklarierte Klassen fallen nur im Browser auf;
  neue Klassen müssen real in `.module.css` deklariert + per E2E
  geprüft werden.
- **component-usage-check:** `.githooks/component-usage-check.py` prüft
  PascalCase-`.tsx`-Komponenten auf Referenzen — `boardPieces.tsx`
  (lowercase) ist formal ausgenommen, wird aber ohnehin aus `MapGraph`
  referenziert; Anforderung „Modul referenziert" damit erfüllbar.
- **i18n:** `marker.detective` („Detektiv {index}"), `marker.ganove`
  („Du"), `legend.detective`, `legend.ganove` existieren in de+en —
  keine neuen Strings nötig.

Test-Ausgangszustand: `npm test` — 53 Dateien / 606 Tests, alle grün;
`npm run lint` + `npm run typecheck` sauber; `npx playwright test`
(design.spec.ts) 5/5 grün. Nachweis: [tests.md](inventory/tests.md) +
[test-results/](inventory/test-results/).

## Details

- [UI-Komponenten & Styling](inventory/ui.md)
- [Tests](inventory/tests.md)
