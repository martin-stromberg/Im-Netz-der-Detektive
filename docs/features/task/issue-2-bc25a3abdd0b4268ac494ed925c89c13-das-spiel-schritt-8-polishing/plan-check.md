# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| (a) Design-Konsistenz: kein Screen im alten Stil; Legenden spiegeln Token-/Figuren-/Routen-Formen; Badge/Splash/Outcome form+farbe-kodiert | Audit durchgeführt, ohne Befund (inventory.md, inventory/ui.md) — keine Code-Änderung nötig | Bestehende E2E `design.spec.ts` (Plaketten, cased Routen + Legenden-Mirror, Meeple, Edelkarten, Tisch) | Abgedeckt |
| (b) A11y: Tab-Reihenfolge, `:focus-visible` überall, ARIA unverändert, keine Info nur über Farbe, WCAG-AA-Tabelle aktualisiert | Drei `:focus-visible`-Fixes (primaryButton, numberInput/selectInput, removeButton) + Kontrasttabellen-Ergänzung in `theme.css`/`GanoveScreen.module.css` | Neuer E2E `focus rings stay visible…`; Bestand `i18n-a11y.spec.ts` (Tastatur-Flow) | Abgedeckt |
| (c) Motion: jede neue/geänderte Animation/Transition unter `prefers-reduced-motion` | `transition: none` für `.mapArea::after` im Reduce-Block; alle übrigen Effekte bereits abgedeckt (Inventory-Matrix) | Bestand E2E + Modul-Matrix in inventory/ui.md | Abgedeckt |
| (d) Verträge: `data-*` unverändert, keine leakfähigen MapGraph-Props, kein `Math.random()`, i18n-Parität, Hooks `--all` grün | Audit ohne Befund; Verifikationslauf Hook-Checks eingeplant | Baseline-Nachweise + Bestand-E2E (Selektoren) | Abgedeckt |
| (e) Build: `npm run build` grün, `dist` ohne externe Referenzen, Font lokal WOFF2, Coverage ≥ 70 % | Audit ohne Befund; Verifikationslauf eingeplant | Baseline-Build + dist-Scan in inventory/tests.md + coverage-Lauf | Abgedeckt |
| (f) `ASSETS.md` vollständig | Audit ohne Befund (Font-Sektion + alle Rasterassets dokumentiert) | Sichtprüfung Datei | Abgedeckt |
| Alle acht fachlichen Anforderungen sichtbar erfüllt | Audit bestätigt Umsetzung der Schritte 1–7 | `e2e/design.spec.ts` (8 design-Tests) | Abgedeckt |
| Vitest inkl. Coverage ≥ 70 % + Playwright-E2E grün; Hook-Checks ohne Befund | Verifikationsschritt 4 im Plan | Baseline-Logs in inventory/test-results/ | Abgedeckt |

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| Tastaturfokus auf interaktive Controls zeigt sichtbaren Ring | `e2e/design.spec.ts` — `focus rings stay visible on interactive controls` | Abgedeckt |
| Kompletter Menü-/Spiel-Flow per Tastatur | `e2e/i18n-a11y.spec.ts` (Bestand) | Abgedeckt |
| Design-Verträge (Brett, Tokens, Figuren, Routen, Panels, Komposition, Font) | `e2e/design.spec.ts` (Bestand, 8 Tests) | Abgedeckt |

## Hinweise

- Der Schritt ist bewusst audit-dominiert; die einzige neue Testartefakt-
  Zeile ist der Fokusring-E2E-Test. Vitest/jsdom kann CSS-Module nicht
  auswerten — E2E ist hier der richtige Nachweis.
- Die temporäre `playwright.local.config.ts` bleibt uncommittet und wird
  nach den E2E-Läufen gelöscht.
