# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| Routen wirken wie gezeichnete Wege (Breite, Kontur, Muster), nicht wie 1-px-Drahtlinien | Casing+Kern-Zweistrich in `MapGraph.tsx` + `.edgeCasing*`/`.edge`-Umbau (`linecap: round`, Fassung 4.6/6 px, Kern 2.2/3.4 px) — Umsetzungsreihenfolge Schritte 1–2 | Vitest „edges draw as cased map routes" + E2E „routes draw as cased map paths with legend mirror" (Computed Styles) | Abgedeckt |
| `weg`/`fahrt`/blockiert über Muster+Form+Farbe unterscheidbar | `weg`: Vollkern in Sepia-Fassung; `fahrt`: Schwellen-Dash (`butt`-Caps) auf breiterer Brauntönung-Fassung; blockiert: gesprengtes Kern-Muster + gedimmte Fassung + Kreuz-Glyph — jeweils Muster+Form+Farbe | Vitest-Klassenprüfung + E2E Computed Styles (Dasharray, Breiten, Farben) | Abgedeckt |
| `data-edge`, `data-edge-type`, `data-blocked`, `data-block-glyph` und Kanten-DOM-Struktur bleiben | Plan hält `<g data-edge>` + semantische Kern-Linie + Block-Glyph; Casing ist zusätzliche `aria-hidden`-Dekoration | Bestehende Vitest-Assertions bleiben unverändert gültig (13 `data-edge`, 1 `fahrt`, `data-blocked`, `data-block-glyph`, Layer-Reihenfolge) | Abgedeckt |
| `edgeFlash` funktioniert und respektiert Reduced Motion | `.edgeFlash` + `@keyframes edge-flash` + `@media (prefers-reduced-motion: reduce)` bleiben unverändert; Flash auf Kern-Linie weiter sichtbar (Amber auf dunkler Fassung) | Bestehender `GanoveScreen.test.tsx`-Flash-Test bleibt; Reduced-Motion-Regel statisch unverändert | Abgedeckt |
| Legenden-Swatches aktualisiert | Casing-Linie in beiden `weg`/`fahrt`-Swatches (`MapLegend`, `DetectiveMapLegend`); `legendWegCasing`/`legendFahrtCasing` neu | Vitest „legend swatches mirror the cased route anatomy" + E2E-Legenden-Mirror | Abgedeckt |
| WCAG-Lesbarkeit auf Papier-Untergrund | Fassung in AA-kalibrierten `--color-map-*`-Tinten (4.7–4.9:1), Kern `--color-paper`; Kontrastdokumentation in `theme.css` trifft weiter zu | E2E-Test enthält Farbwert-Assertions (`rgb(232, 220, 192)`-Kern, `--color-map-weg`-Fassung) | Abgedeckt |
| Vitest/Playwright grün | Neue Tests + unveränderte bestehende Suite; Baseline 614 + 35 dokumentiert | `test-results.md` (Schritt 10) | Abgedeckt |

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| Kartenansicht (Ganove-Spielbrett): geränderte `weg`-Routen, breite `fahrt`-Trasse mit Schwellen-Muster, Legenden-Spiegelung | `e2e/design.spec.ts`: „routes draw as cased map paths with legend mirror" | Abgedeckt |
| Blockierte Kante: Muster + Kreuz-Glyph | In E2E enthalten, soweit deterministisch auslösbar; Hauptsicherung via Vitest (`greys out blocked edges…` + neuer Casing-Block-Test auf `f–g`, der einzigen `fahrt`-Kante) | Abgedeckt |
| `edgeFlash` + Reduced Motion | Kein neuer E2E-Test — der Mechanismus bleibt unverändert (bestehende CSS-Media-Regel + bestehender Vitest-Nachweis der Klasse); ein E2E-Auslöser für `flashEdges` existiert nicht deterministisch | Nicht erforderlich mit Begründung |

## Hinweise

- Der `weg`-Kern in `--color-paper` ist identisch zur Papierfläche — die Lesbarkeit entsteht durch die dunkle Fassung (Kontrast 4.7:1). Das ist die intendierte „cased line"-Technik und vom plan-check als erfüllt gewertet.
- `stroke-linecap: butt` auf dem `fahrt`-Kern erzeugt rechteckige Schwellen; `round` würde Tupfen ergeben — die Festlegung ist bewusst.
- `check:strings` bleibt betroffenfrei (keine neuen sichtbaren Strings).
