# Übersetzte Anforderung: Spielfiguren als Meeple-Spielsteine (Design-Schritt 4)

## Fachliche Zusammenfassung

Die flachen Positionsmarker auf der Spielkarte (`MapGraph`) werden durch
greifbare Spielfiguren im Brettspiel-Stil ersetzt: stehende
Meeple-Silhouetten mit Volumen (Körper-Gradient), Schlagschatten und
Standfläche/Sockel-Ellipse. Ein neues Modul `src/components/boardPieces.tsx`
liefert die Glyph-Komponenten nach der `landmarks.tsx`-Konvention (lokale
Glyph-Box, Fußpunkt am Ursprung, `aria-hidden`). Detektiv- und
Ganove-Figur unterscheiden sich über **Silhouette + Farbe + Beschriftung** —
die Ganove-Figur bekommt eine eigenständige Form (z. B. Mantel-/Hut-Profil),
der Detektiv behält seinen Index-Text (D1..D5). Der aktive Detektiv erhält
eine formbasierte Hervorhebung (z. B. Sockel-Ring oder Fahne) plus
Amber-Akzent — nicht nur eine andere Farbe. Die Legenden-Symbole beider
Screens werden auf Miniaturansichten der neuen Figuren umgestellt.

## Akzeptanzkriterien

1. Beide Figurentypen wirken als greifbare Spielsteine (Volumen, Schatten,
   Standfläche) und sind über Form + Farbe + Index/Text unterscheidbar —
   Farbe ist nie alleiniges Unterscheidungsmerkmal.
2. `data-detective`, `data-active-detective`, `data-ganove` sowie die
   Sichtbarkeitslogik (`ganovePosition` nur in der Ganove-Perspektive)
   bleiben unverändert — kein Info-Leak.
3. Die Gleitanimation (`markerMove`-Transition, 480 ms) funktioniert weiter
   und respektiert `prefers-reduced-motion`; die Inline-
   `transform`-Positionierung (`translate(x, y-16)`-Muster, aktuell
   `node.y - NODE_RADIUS - 8`) bleibt auf dem äußeren `<g>`.
4. Die aktive Detektiv-Figur ist formbasiert hervorgehoben (zusätzliches
   Shape-Element wie Sockel-Ring/Fahne) plus Amber-Akzent.
5. Legenden konsistent: `legendDetective`/`legendGanove` zeigen
   Miniaturansichten der neuen Figuren (selbe Form = selbe Bedeutung).
6. Vitest und Playwright grün; `component-usage-check` erfüllt (das neue
   Modul wird referenziert).

## Betroffene Klassen und Komponenten

### Neu zu erstellen

- `src/components/boardPieces.tsx` — Meeple-Glyph-Komponenten für
  Detektiv- und Ganove-Figur (stehende Silhouette, Körper-Gradient,
  Schlagschatten, Sockel-Ellipse; lokale Glyph-Box, Fußpunkt am Ursprung,
  `aria-hidden` nach `landmarks.tsx`-Konvention). Detektiv-Glyph nimmt den
  Index (1..n) als Beschriftung entgegen; aktive Variante mit
  Form-Hervorhebung. Miniatur-Varianten für die Legenden-Swatches
  (oder dieselben Komponenten skaliert).

### Zu erweitern / anzupassen

- `src/components/MapGraph.tsx` — `detectiveMarker` (flaches `rect` +
  `markerText`) und `ganoveMarker` (Raute `ganoveShape`) durch die neuen
  Figuren ersetzen. Äußere `<g>`-Struktur mit `data-*`-Attributen,
  `aria-label`, `markerMove`-Klasse und Inline-`transform` bleibt.
  Ggf. neuer `<defs>`-Gradient für den Körper (Volumen) — `defsId`-Muster
  wie `tokenFace` wiederverwenden.
- `src/components/MapGraph.module.css` — alte Marker-Regeln
  (`detectiveShape`, `ganoveShape`, ggf. `markerText`) durch Klassen der
  Figuren-Teile ersetzen (Sockel, Körper, Hut/Mantel, Schatten,
  Aktiv-Ring). Alle neuen Klassen müssen real deklariert sein
  (jsdom-Falle aus Schritt 3: Vitest-Identity-Proxy deckt undeclared
  classes nicht auf — nur E2E/Visual fängt das).
- `src/components/DetektivScreen.tsx` (`DetectiveMapLegend`) —
  `legendDetective`-Swatch (flaches `rect`) durch Figuren-Miniatur.
- `src/components/GanoveScreen.tsx` (`MapLegend`) — `legendDetective`-
  und `legendGanove`-Swatches durch Figuren-Miniaturen.
- `src/components/GanoveScreen.module.css` — Legend-Klassen
  `legendDetective`/`legendGanove` an die Figuren-Miniaturen anpassen
  (bzw. neue Klassen für Miniatur-Teile).
- `src/components/MapGraph.test.tsx` — Tests an die neue DOM-Struktur
  anpassen/ergänzen (Figuren-Anatomie, Aktiv-Form, Legenden-Miniaturen).
- `e2e/design.spec.ts` — Figuren-Nachweis im Browser ergänzen (Gradient,
  Schatten, Form-Unterschiede, aktive Figur, Legenden-Mirror).

## Implementierungsansatz

- `boardPieces.tsx` folgt `landmarks.tsx`: jede Figur ist eine Komponente
  in einer lokalen Glyph-Box mit Fußpunkt am Ursprung; die Platzierung
  erfolgt ausschließlich über `transform` auf dem äußeren `<g>` — so bleibt
  die `markerMove`-CSS-Transition unberührt.
- Dicke Tinten-Konturen (`stroke` im Stil `#10141c` bzw. vorhandene
  Map-Tokens) passend zum Comic-Stil der Landmarks; lesbare Farben auf dem
  hellen `--color-paper`-Brett (`--color-detective`-Familie für Detektive,
  `--color-map-ganove`/dunkel für den Ganoven).
- Der Meeple steht optisch **auf** der Orts-Plakette (Schritt 3): Fußpunkt
  nahe dem Knotenzentrum, Figur nach oben ragend — Ankerung über das
  bestehende `translate(x, y - 16)`-Schema.
- Körper-Volumen über `radialGradient`/`linearGradient` in `<defs>`
  (eindeutige IDs via `useId`-Muster oder per Prop-Id), Schlagschatten als
  weiche Ellipse, Sockel-Ellipse als Standfläche.
- Unterscheidung konstruktiv: Detektiv = aufrechte Silhouette + Index-Text;
  Ganove = abweichende Silhouette (Mantel-/Hut-Profil) ohne Index oder mit
  eigenem Symbol. Aktiver Detektiv = zusätzliches Form-Element
  (Sockel-Ring/Fahne) + Amber-Akzent (`--color-map-accent`).
- Legenden: die Figuren-Glyphs als Miniatur in den vorhandenen
  Swatch-`<svg>`s — gleiche Komponenten bzw. identische Form, damit
  Symbolbedeutung konsistent bleibt.

## Konfiguration

Keine — reine Darstellungsänderung, gesteuert über bestehende
Design-Tokens (`theme.css`).

## Offene Fragen

Keine — Silhouetten-Details (genaue Hut-/Mantel-Form) sind
Gestaltungsfreiheit innerhalb der genannten Kriterien.
