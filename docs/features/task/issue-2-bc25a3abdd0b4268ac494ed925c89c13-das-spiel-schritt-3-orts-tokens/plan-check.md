# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| Orte als plakettenartige Tokens mit Rand/Prägung, keine flachen Punkte | `nodeToken`-Gruppe (Schatten, `tokenRim`-Fassung r=8, `tokenFace` r≈6.2 mit `radialGradient`-Prägung, `tokenInner`-Innenlinie) ersetzt `nodeDot` | Vitest „renders each place as a framed plaque token"; E2E „place tokens render as embossed plaques" (Computed `fill` = `url(#…)` im Browser) | Abgedeckt |
| Labels lesbar (AA) | `nodeLabel` unverändert (`--color-ink` auf `--color-paper`, 11.6:1 dokumentiert in `theme.css`) | Bestehender E2E `design.spec.ts` „map renders as a parchment board" prüft Label-Luminanz < 0.4; läuft im Abnahmetest weiter | Abgedeckt |
| `data-*`-Attribute unverändert | Kein Attribut wird entfernt/umbenannt; alle data-* bleiben am `<g>` bzw. den Overlays | Alle bestehenden Vitest-/E2E-Attribute-Tests laufen unverändert weiter (`data-node-id`, `data-legal-target`, `data-selectable`, `data-markable`, `data-possible`, `data-zone`, `data-category`, `data-camera(-active)`, `data-marker`, `data-escape-node`, `data-mission-target`) | Abgedeckt |
| Hit-Area r=14 erhalten; nur Hit-Area fängt Pointer | `hitArea` (r=14) unverändert; Token-Gruppe `aria-hidden`, `pointer-events` weiter durch `.map :where(...)` auf none | Vitest „keeps the invisible hit area at r=14 above the token"; bestehender Dekor-`pointer-events`-Test | Abgedeckt |
| Tastatur-Roaming und `:focus-visible` wie zuvor | `onNodeKeyDown`/`nodeRefs`/`role`/`tabIndex` unverändert; Amber-Ring von `.nodeDot` auf `.tokenRim` übertragen | Vitest „roams between interactive nodes with the arrow keys" (unverändert); E2E `i18n-a11y.spec.ts` Tastaturfluss + neue Fokus-Ring-Assertion in `design.spec.ts` | Abgedeckt |
| Legenden spiegeln Token-Form | `MapLegend`-Swatch → Mini-Plakette; `DetectiveMapLegend` erhält identisches Swatch | Vitest „the legend swatch mirrors the plaque token" (beide Screens) | Abgedeckt |
| Zustände über Form + Farbe | `nodeLegal`/`nodeSelectable`: perforierter Rand + grüner gestrichelter Ring; `nodeCurrentTarget`/Fokus: Amber-Rand; `nodeGanoveHere`: Face-Füllung | Vitest „marks legal and selectable nodes with dashed ring and perforated rim" | Abgedeckt |
| Vitest/Playwright grün; keine Info-Leaks | Keine neuen Props/Render-Pfade; statisches Legenden-Swatch | Gesamtsuite im Abnahmelauf; bestehender Info-Leak-Test „renders no camera elements or hint artifacts" bleibt | Abgedeckt |

## Fehlende oder unvollständige Testanforderungen

—

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| Orts-Tokens sichtbar als Plaketten (Benutzer sieht Brett) | `e2e/design.spec.ts` „place tokens render as embossed plaques" | Abgedeckt |
| Tastatur-Roaming/Fokus (Benutzer wählt Orte per Tastatur) | Bestehender `i18n-a11y.spec.ts` „core ganove flow is completable by keyboard only" + neue `:focus-visible`-Assertion in `design.spec.ts` | Abgedeckt |
| Legenden-Konsistenz (Benutzer liest Legende) | Swatch-Struktur per Vitest; E2E-Sichtbarkeit indirekt über `map-legend` | Abgedeckt |

## Fehlende oder unvollständige Planbestandteile

—

## Hinweise

- Der Plan verzichtet begründet auf neue `theme.css`-Tokens (alle Farben aus
  `--color-paper`/`--color-paper-aged`/`--color-ink`/`--color-map-*`
  ableitbar); die Anforderung verlangt Token-Ergänzung nur bei Bedarf.
- Stationstyp-Differenzierung der Token-Form ist laut Anforderung optional
  („darf"); der Plan differenziert über Zustände — zulässig.
