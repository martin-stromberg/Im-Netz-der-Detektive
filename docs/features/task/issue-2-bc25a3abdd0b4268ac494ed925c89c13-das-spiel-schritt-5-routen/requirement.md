# Übersetzte Anforderung: Routen als gezeichnete Kartenwege (Brettspiel-Redesign Schritt 5)

## Fachliche Zusammenfassung

Die Kanten des Wegenetzes in `MapGraph` (`<g data-edge>`, `data-edge-type="weg|fahrt"`) werden von einfachen 1–2-px-Drahtlinien zu gezeichneten Kartenwegen weiterentwickelt. `weg`-Kanten erscheinen als lesbarer Straßen-/Pfadstrich mit Kartencharakter (heller Kern mit dunkler Kontur — die klassische „cased line"-Kartentechnik), `fahrt`-Kanten als kräftigere, eigenständig gemusterte Trasse/Kutschenroute. Die Änderung ist rein visuell: `data-*`-Vertrag, DOM-Struktur der Kantengruppe und das `edgeFlash`-Pulsieren (inkl. `prefers-reduced-motion`-Respekt) bleiben erhalten; blockierte Kanten behalten das formkodierte Kreuz-Glyph (`data-block-glyph`) plus erkennbare Musterung. Die Legenden-Swatches `legendWeg`/`legendFahrt` in `MapLegend` (Ganove) und `DetectiveMapLegend` (Detektiv) werden an das neue Erscheinungsbild angeglichen.

## Betroffene Klassen und Komponenten

- `src/components/MapGraph.tsx` — Kanten-Rendering innerhalb `<g data-layer="edges">` / `<g data-edge>`: zusätzliche dekorative Strich-Layer pro Kante (z. B. Kontur-Strich unter dem Kern-Strich); die semantische Linie mit `data-edge-type`/`data-blocked` bleibt.
- `src/components/MapGraph.module.css` — Umbau der Klassen `edge`, `edgeWeg`, `edgeFahrt`, `edgeBlocked`, `edgeFlash`, `blockGlyph`; neue Strich-Layer-Klassen (z. B. `edgeCasing`, `edgeCasingFahrt`).
- `src/components/GanoveScreen.tsx` (`MapLegend`) und `src/components/DetektivScreen.tsx` (`DetectiveMapLegend`) — Swatch-Markup für `legendWeg`/`legendFahrt` (ggf. zweite Linie für Kontur+Kern).
- `src/components/GanoveScreen.module.css` — `legendWeg`/`legendFahrt`-Stile (werden von beiden Legenden als `shared` genutzt); neue Swatch-Klassen.
- `src/theme.css` — ggf. neue `--color-map-*`-Tokens, falls für Kern/Rand der Routen weitere Tinten-/Papierwerte nötig sind (bestehende Tokens: `--color-map-weg`, `--color-map-fahrt`, `--color-map-blocked`, `--color-paper`, `--color-paper-aged`, `--color-ink`, `--color-ink-soft`).
- Tests: `src/components/MapGraph.test.tsx` (neue Struktur-/Konsistenztests), `e2e/design.spec.ts` (E2E-Nachweis der Routen-Optik inkl. Legenden-Spiegelung und Reduced Motion).

## Implementierungsansatz

- Klassische Kartentechnik mit übereinanderliegenden SVG-Strichen: ein breiterer dunkler Kontur-/„Casing"-Strich darunter, ein schmalerer heller bzw. gemusterter Kern-Strich darüber — `stroke-linecap: round`. `weg`: dunkler Sepia-Rand + papierheller Kern (befestigter Weg). `fahrt`: breitere Trasse in `--color-map-fahrt` mit eigenem Muster (z. B. helle Quer-„Schwellen" durch gestrichelten Kern oder ein Doppelstrich-Muster) — nicht bloß ein geändertes `dasharray` auf der Drahtlinie.
- Handdrawn-Anmutung dezent und deterministisch: kein `Math.random()`, kein `feTurbulence`-Displacement auf Kanten (Performance/Hit-Test-Stabilität); Kanten fangen ohnehin keine Pointer-Events (`pointer-events: none` via `.map :where(...)`).
- Blockierte Kante: `data-blocked` und `data-block-glyph` unverändert; Musterung bleibt erkennbar (Kern-Muster + Kreuz-Glyph), Farbe `--color-map-blocked`, zusätzlich gedämpft.
- `edgeFlash`: bleibt als pulsierende Amber-Markierung (`--color-map-accent`) auf der semantischen Linie; Animation weiterhin unter `@media (prefers-reduced-motion: reduce)` abgeschaltet.
- Unterscheidbarkeit `weg`/`fahrt`/blockiert über Muster **und** Form (Strichstärke, Kern vs. Schwellen-Muster, Kreuz-Glyph) **und** Farbe — nie farb-only.
- WCAG: dunkle Tinten-/Sepia-Töne gegen `--color-paper`-Untergrund (Tokens in `theme.css` dokumentieren Kontraste).

## Konfiguration

Keine — rein visuelles Design-Feature ohne Konfigurationsbedarf.

## Offene Fragen

Keine — die Anforderung benennt Technik (Casing/Doppelstrich, Muster, Reduced Motion), Akzeptanzkriterien und den zu erhaltenden `data-*`-Vertrag ausreichend konkret.
