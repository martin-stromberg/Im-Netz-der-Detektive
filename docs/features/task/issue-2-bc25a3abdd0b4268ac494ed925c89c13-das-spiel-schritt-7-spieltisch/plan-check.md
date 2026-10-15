# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| Jeder Screen wirkt wie derselbe „Spieltisch": gleiche Tischfläche, Kartenpanels, Schmuckschrift-Titel, konsistente Ränder/Schatten — kein Rest alter flacher Dark-Box-Optik | `.screen`-Umstellung auf Tischfläche gilt über `shared.screen` für alle 12 Screens gleichzeitig (Bestandsaufnahme belegt die gemeinsame Nutzung); Edelkarten-Anatomie und `--font-display` existieren bereits auf Panels/Titeln; flache Reste (`.perspectiveToggle`, `.cardImage`, `.shell`) werden explizit überführt | E2E `game table composition`: identische Tischfläche auf `main-menu` und `ganove-screen` (bg-noir + `--color-table`) | Abgedeckt |
| Menü → Setup → Partie → Auswertung/Replay laufen unverändert durch; Overlay-Stack (EventBanner, Splash, `.mapArea::after`) bleibt korrekt geschichtet | Keine DOM-/Logikänderung geplant; `.mapArea` und der z-index-Stack werden explizit nicht angefasst; `.layout`-Rahmung ist additiv | Bestehende Fluss-Specs bleiben grün (`menu`, `ganove`, `detektiv`, `persistenz`, `i18n-a11y`); E2E prüft `z-index: 5` des Banner-Stacks und gerenderte `::after`-Vignette | Abgedeckt |
| `data-view`, alle `data-testid`s und responsive Stapelung (900 px) bleiben; Vitest/Playwright inkl. E2E-Menüspecs grün | Plan sieht ausschließlich CSS-Änderungen vor; `@media (max-width: 900px)` bleibt ausdrücklich unverändert | E2E prüft `flex-direction: column` bei 800 px; bestehende Vitest-/Playwright-Suiten als Regressionsnachweis | Abgedeckt |

## Fehlende oder unvollständige Testanforderungen

— (Status „Plan vollständig")

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| Einheitliche Tischfläche auf allen Screens | `design.spec.ts` › `game table composition` (a) | Abgedeckt |
| Gerahmte Einlage, Brett auf dem Tisch, Sidebar-Kartenfach | `design.spec.ts` › `game table composition` (b) | Abgedeckt |
| `.perspectiveToggle` neu gestylt | `design.spec.ts` › `game table composition` (c) | Abgedeckt |
| Overlay-Stack korrekt geschichtet | `design.spec.ts` › `game table composition` (d) | Abgedeckt |
| Responsive Stapelung bleibt | `design.spec.ts` › `game table composition` (e) | Abgedeckt |
| Menü → Setup → Partie → Auswertung/Replay unverändert | Bestehende Specs `menu`/`ganove`/`detektiv`/`persistenz`/`i18n-a11y` bleiben grün | Abgedeckt |

## Fehlende oder unvollständige Planbestandteile

— (Status „Plan vollständig")

## Hinweise

- Die Anforderung nennt `theme.css` als einen der Kompositionsorte; der Plan kommt ohne Token-Änderung aus, da alle benötigten Tokens (`--color-table*`, `--color-cardboard*`, `--color-inset-bg`, `--color-card-line`) aus Schritt 1/6 bereits existieren — das ist zulässig, da die Anforderung die Dateien als Ort nennt, nicht als Pflichtänderung.
- `MainMenu`-Punkt „Titelbild + Schmuckschrift-Titel" ist bereits Bestand (Schritt 14 + `--font-display`); Plan vermerkt es als bestehend.
- `MapSelect`/`MissionSelect`-„Kartenkarten im neuen Kartenlook" sind seit Schritt 6 Edelkarten; `.cardImage`-Rahmung ergänzt die Bildplatte.
