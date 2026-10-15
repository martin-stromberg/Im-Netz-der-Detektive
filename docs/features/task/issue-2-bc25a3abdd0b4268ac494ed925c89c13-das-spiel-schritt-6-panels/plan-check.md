# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
| ------------------ | ----------------- | -------------------- | ------ |
| Panels, Karten, Buttons und Badges zeigen einheitliche Kartenhaptik (Rand, Schatten, Materialität) auf allen Screens | Card-Anatomie (Border `--color-cardboard` + Inset-Line + Kantenring `--color-cardboard-edge` + `--shadow-card`) wird auf `.panel`, `.card`, `.statBox`, `.banner`, `.badge`, `.notice`, `.confirm`, `.splash` in Shared-Theme und Komponenten-Modulen angewandt; Shared-Theme deckt alle 12 Screens ab | E2E-Test „panels, cards, buttons and badges share the dark-card look" prüft Border/Radius/box-shadow-Stapel auf Panel, Card, Button, Badge | Abgedeckt |
| `:focus-visible`- und Hover-Zustände unverändert | Plan schreibt explizit vor, Hover-/Focus-Regeln nicht anzutasten; nur Basisdeklarationen ändern sich | E2E-Test prüft Amber-Outline auf fokussierter `.card` via Tastatur | Abgedeckt |
| Zielgrößen nicht verkleinert | Keine Padding-/Border-Verkleinerung geplant; äußerer Ring via `box-shadow` (layoutneutral); `overflow:hidden`-Sonderfall `.perspectiveToggle` benannt | E2E-Suite (vorhandene Tests auf Klickbarkeit/Fokus) + visueller Card-Test | Abgedeckt |
| Kontraste ≥ AA dokumentiert | Neue Tokens werden im `theme.css`-Header mit Messwerten dokumentiert; Textfarben/-flächen unverändert AA | Kommentar-Doku + E2E (bestehende Kontrast-Checks) | Abgedeckt |
| Keine neuen sichtbaren Strings | Plan sieht ausschließlich CSS-Änderungen vor — `.tsx` unberührt | `check:strings` + `i18n-check.py --all` in Verifikation | Abgedeckt |
| `data-testid`/`data-view`/`data-heat-level`/`data-pursuit-level` unverändert | Keine `.tsx`-Änderungen im Plan | Bestehende Vitest-/E2E-Suite (36 E2E-Tests greifen auf `data-*`) | Abgedeckt |
| Vitest/Playwright grün | Verifikationsschritt 6 führt beide Suiten aus | test-results-Nachweis | Abgedeckt |
| Badges bleiben `role="status"`-Pills, Level-Farbcodierung form+farbe | Pill-Radius 999px bleibt, `.level_*` unverändert, Glyph-Klassen unberührt | E2E prüft `data-heat-level` + Pill-Radius | Abgedeckt |
| Legenden-Swatches nicht brechen | `legendItem svg`/`legend*`-Klassen explizit unverändert | Bestehender E2E „legend mirror"-Assertions | Abgedeckt |
| reduced-motion | Keine neuen Animationen; bestehende `@media (prefers-reduced-motion)`-Blöcke unberührt | Bestehender E2E-Check | Abgedeckt |
| Headings in Schmuckschrift | `.choiceTitle` erhält `font-display`; alle anderen Headings nutzen sie bereits | E2E prüft Display-Font auf Headings | Abgedeckt |
| Buttons metallic/embossed, Farbcodierung + Text bleiben | Gradient + Inset-Licht + Schatten; Hover/Focus-Verhalten unverändert | E2E prüft `background-image`-Gradient + `box-shadow` | Abgedeckt |

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
| ---------------------------------- | ------------------ | ------ |
| Edelkarten-Haptik auf allen Screens | Neuer Test in `e2e/design.spec.ts` (Panel/Card/Button/Badge via `getComputedStyle`) | Abgedeckt |
| `:focus-visible` unverändert | Tab-Fokus auf `.card`, Amber-Outline geprüft | Abgedeckt |
| Keine neuen sichtbaren Strings | Repo-Checks `check:strings`/`i18n-check` (kein E2E nötig — statischer Check) | Abgedeckt |
| Splash-/Notice-/Confirm-Flächen | Deckt der Card-Test nicht pixelgenau ab — jedoch kein eigener Benutzerfluss (reine Materialität, über dieselbe Card-Anatomie abgesichert); die bestehenden E2E-Fluss-Tests (abort→confirm, outcome→splash) bleiben als Regression grün | Abgedeckt |

## Hinweise

- Die in `plan.md` genannten Klassennamen wurden gegen die
  Bestandsaufnahme (`inventory/ui.md`) abgeglichen — alle existieren.
- `overflow: hidden` auf `.perspectiveToggle` wurde als Schatten-Risiko
  im Plan berücksichtigt (Ring via `outline` statt `box-shadow`-Spread).
- Die preexisting `tsc`-Fehler in `MapGraph.test.tsx` sind dokumentiert
  und bleiben unberührt; sie blockieren `npm run build` bereits vor
  diesem Schritt.
