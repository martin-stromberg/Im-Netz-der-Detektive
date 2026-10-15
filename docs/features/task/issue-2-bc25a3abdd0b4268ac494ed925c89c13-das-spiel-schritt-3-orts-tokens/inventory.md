# Bestandsaufnahme: Orts-Tokens — Knoten als geprägte Plaketten (Schritt 3)

Analyse der Knoten-Darstellung in `MapGraph`, der Legenden-Swatches und der
Theme-Tokens, bezogen auf die Anforderung „Orts-Tokens/Plaketten statt
`nodeDot`-Kreise" (Schritt 3 des Projektplans „Finales Brettspiel-Design").

## Zusammenfassung

- `MapGraph.tsx` rendert jeden Ort als flachen `<circle r="8" className={styles.nodeDot}>`
  (Tintenpunkt mit Papier-Outline). Es fehlt die geforderte Plaketten-Struktur
  (Fassung/Rand, `radialGradient`-Prägung, Schatten).
- `<defs>` existiert bereits mit `defsId`-Muster (`useId`) für Grain-Filter und
  Vignette — der Token-Gradient kann dort eingehängt werden.
- Die unsichtbare Hit-Area ist `<circle r="14" className={styles.hitArea}>`
  (`NODE_RADIUS + 6`); `.map :where(...)` setzt `pointer-events: none` auf alle
  Kartenkinder — nur `.hitArea` hat `pointer-events: all`.
- Zustandsklassen am `<g>`: `nodeInteractive`, `nodeLegal`, `nodeSelectable`,
  `nodeCurrentTarget`, `nodeGanoveHere`; wirken aktuell nur auf `nodeDot`
  (Fill/Stroke) — keine Formdifferenzierung außer dem gestrichelten
  `legalRing` (nur bei `nodeLegal`).
- Overlays mit festen Positionen: `zoneHalo` (r=13), `legalRing` (r=12,
  `stroke-dasharray: 3 3`), `possibleRing`-Diamant (r=15), `categoryBadge`,
  `cameraGlyph` (translate -14,-15), `markerPin` (translate 12,-16),
  `escapeMarker`, `missionBadge`, `nodeLabel` (y=18).
- Legenden: `MapLegend` (GanoveScreen.tsx:102) besitzt das Target-Swatch
  `legendTargetDot` + `legendTargetRing` (flacher Punkt + gestrichelter Ring).
  `DetectiveMapLegend` (DetektivScreen.tsx:110) hat kein Orts-Swatch — nur
  Kamera, Pin, Diamant, Kategorie, Zonen.
- Theme: `--color-map-*`-Tinten-Tokens und `--color-ink`/`--color-paper`/
  `--color-paper-aged` vorhanden; für Token-Schatten/Prägung ggf. Ergänzung
  nötig.
- Test-Ausgangszustand: Vitest 600/600 grün, Playwright 33/33 grün —
  Details in [Tests](inventory/tests.md).

## Details

- [UI-Komponenten](inventory/ui.md)
- [Styles und Tokens](inventory/styles.md)
- [Tests](inventory/tests.md)
