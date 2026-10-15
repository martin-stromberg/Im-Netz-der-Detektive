# Bestandsaufnahme: Routen als gezeichnete Kartenwege (Schritt 5)

Analyse des Kanten-Renderings in `MapGraph` sowie der Legenden-Swatches `legendWeg`/`legendFahrt`, bezogen auf die Anforderung „Routen als gezeichnete Kartenwege".

## Zusammenfassung

- `MapGraph` rendert jede Karte derzeit als **eine** `<line>` mit den Klassen `edge edgeWeg|edgeFahrt [edgeBlocked] [edgeFlash]`; `weg` = 2 px Vollstrich in `--color-map-weg`, `fahrt` = 3,5 px Strich in `--color-map-fahrt` mit `stroke-dasharray: 10 5` — beides klassische „Drahtlinien" ohne Kartencharakter.
- Blockierte Kanten sind bereits gedimmt (`--color-map-blocked`, Opazität 0,55, `dasharray: 4 4`) und formkodiert per `data-block-glyph`-Kreuz (zwei Linien, `--color-map-danger`).
- `edgeFlash` pulsiert per `@keyframes edge-flash` (3400 ms, `stroke-opacity` 1 → 0,5) in `--color-map-accent` und ist unter `@media (prefers-reduced-motion: reduce)` bereits deaktiviert.
- Der `data-*`-Testvertrag (`data-edge`, `data-edge-type`, `data-blocked`, `data-block-glyph`) ist in Vitest-Tests abgesichert; die DOM-Struktur `<g data-edge>` → `<line>` + Block-Glyph muss erhalten bleiben, zusätzliche dekorative Striche innerhalb der Gruppe sind zulässig.
- `legendWeg`/`legendFahrt` existieren nur in `GanoveScreen.module.css` (als `shared` von `DetectiveMapLegend` mitbenutzt); Swatch-Markup steht in `GanoveScreen.tsx` (`MapLegend`) und `DetektivScreen.tsx` (`DetectiveMapLegend`) — je eine einzelne `<line>` auf einem Papierchip (`background: var(--color-paper)`).
- Alle Kanten fangen keine Pointer-Events (`.map :where(g, path, …) { pointer-events: none }`) — zusätzliche Strich-Layer beeinflussen Hit-Tests nicht.
- Farb-Tokens `--color-map-*` in `theme.css` sind für WCAG AA gegen `--color-paper` kalibriert und dokumentiert.

Test-Ausgangszustand: Vitest 614/614 grün, `typecheck`/`lint`/`format:check`/`check:strings` fehlerfrei; Playwright-Baseline siehe [tests.md](inventory/tests.md).

## Details

- [UI / Komponenten](inventory/ui.md) — `MapGraph`-Kanten, CSS-Klassen, Legenden, Theme-Tokens
- [Tests](inventory/tests.md) — bestehende Testabdeckung und Baseline-Ergebnisse
