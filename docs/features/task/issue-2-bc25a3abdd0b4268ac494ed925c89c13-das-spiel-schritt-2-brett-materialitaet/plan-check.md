# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| Papier-Textur, Pappenrand, Schlagschatten auf allen `MapGraph`-Einsätzen (Ganove, Detektiv, Replay×2, MissionSelect) | `boardFace`-Gruppe + `<defs>` sind fester Teil des `MapGraph`-Renderbaums → wirkt auf allen 4 Einsatzstellen automatisch; `.map`-Border/`box-shadow` in `MapGraph.module.css`; Replay-Doppelinstanz über `useId`-Präfix abgesichert | Unit-Test (defs/Filter/Gradient vorhanden, vor `data-layer="edges"`, ID-Eindeutigkeit bei 2 Instanzen) + E2E `design.spec.ts` (Computed Styles: `background-color`, `box-shadow`, Border) | Abgedeckt |
| `data-layer`-Struktur, `data-testid`, `viewBox`, `data-board-style`, Knoten-/Kanten-Attribute unverändert | Plan sieht ausschließlich neue Klassen/Elemente ohne `data-*` vor; Paper-Gruppe ist kein `data-layer`; bestehende Attribute/Props explizit unverändert | Neuer Unit-Test prüft `:scope > g[data-layer]`-Reihenfolge (`board, edges, landmarks, nodes, markers`); alle 28 bestehenden `MapGraph`-Assertions bleiben im Lauf enthalten | Abgedeckt |
| Labels, Zonen-Halos, Overlay-Glyphen WCAG AA; Blockade-Kreuz/Kategorien formkodiert | Neue `--color-map-*`-Tokens mit dokumentierten Kontrasten ≥3:1 (Glyphen) bzw. ≥4.5:1 (nahe dran: Label `--color-ink` 11.6:1, Pins/Glyphen 3.8–4.8:1); Halo-Lightness 45 % + Opacity 0.22; Formkodierung (`stroke-dasharray`, Glyph-Geometrien) unverändert | E2E prüft dunklen Label-Fill; Unit-Tests zu `data-block-glyph`/`data-category` bleiben bestehen | Abgedeckt |
| Keine neuen sichtbaren Strings; keine Logik-/Datenänderung; Tests + `map-schema-check` grün; `prefers-reduced-motion` unverändert | Plan enthält keinerlei Text-/i18n-/Daten-/Logik-Änderung; keine neuen Animationen (bestehende Guards unberührt); Karten-JSONs unverändert | Lauf von `npm test`, `check:strings`, `i18n-check`, `map-schema-check`, `no-math-random-check`, komplette Playwright-Suite im Testschritt | Abgedeckt |

## Fehlende oder unvollständige Testanforderungen

— (Status „Plan vollständig")

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| Brett-Materialität sichtbar (AK 1+2) | `e2e/design.spec.ts` — neuer Test „board materiality" auf `?mode=ganove&map=muenster&seed=7&mission=none` (prüft `background-color`, `box-shadow`, Border-Breite, `feTurbulence`, `radialGradient`, `data-layer="board"`, dunkle Label-Farbe) | Abgedeckt |
| Bestehende Spielflüsse unverändert (AK 2–4) | Bestehende Specs `ganove`, `detektiv`, `menu`, `i18n-a11y`, `persistenz` laufen unverändert mit | Abgedeckt (Regression) |
| Neuer Benutzerfluss | — nicht vorhanden: rein visuelle Umgestaltung, keine neue Interaktion; Begründung im Plan explizit | Nicht erforderlich mit Begründung |

## Fehlende oder unvollständige Planbestandteile

— (Status „Plan vollständig")

## Hinweise

- `useId()` liefert Doppelpunkt-IDs; der Plan schreibt die Sanitization (`replace(/[^a-zA-Z0-9]/g, "")`) vor, damit `url(#…)`-Fragmente robust bleiben.
- `inset`-`box-shadow` auf `<svg>` liegt unter dem SVG-Inhalt — die innere Papiernaht ist daher bewusst als `boardSeam`-`<rect>` im SVG geplant, nicht als CSS-Inset.
- `--color-map-blocked` (mit `stroke-opacity`) unterschreitet 3:1 bewusst: „gesperrt" ist per Dash + X-Glyph formkodiert; dokumentiert unter „Seiteneffekte".
