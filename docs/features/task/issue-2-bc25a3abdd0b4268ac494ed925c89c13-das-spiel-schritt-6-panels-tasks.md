# Tasks: Kartenartige Panels und UI-Elemente (Schritt 6)

| # | Bereich | Aufgabe | Status | Testnachweis |
| - | ------- | ------- | ------ | ------------ |
| 1 | Tokens | Edelkarten-Tokens in `theme.css` ergänzen (`--color-card-line`, `--color-card-face-top`, `--color-amber-deep`, `--color-surface-deep`, `--color-danger-surface-deep`, `--shadow-card`, `--radius-card`, `--card-face`, `--card-rim`) + Kontrastdoku | Erledigt | `design.spec.ts` › „panels, cards, buttons and badges share the dark-card look" |
| 2 | Shared-Theme | `.panel` in `GanoveScreen.module.css` zur Edelkarte (Border+Inset+Ring+Schatten+Eckenprägung) | Erledigt | `design.spec.ts` › „dark-card look" (start-panel) |
| 3 | Shared-Theme | `.primaryButton` metallic/embossed (Amber-Gradient + Inset-Licht + Schatten) | Erledigt | `design.spec.ts` › „dark-card look" (Neue Partie) |
| 4 | Shared-Theme | `.secondaryButton` embossed (Surface-Gradient + Schatten) | Erledigt | Kein direkter Test — E2E-Flüsse nutzen den Button weiter grün |
| 5 | Shared-Theme | `.dangerButton` embossed (Danger-Gradient + Schatten) | Erledigt | `ganove.spec.ts` › „abort ends the game as a draw" (nutzt abort-button) |
| 6 | Shared-Theme | `.confirm` als Danger-Karte (solider Rand + Inset + Schatten) | Erledigt | `ganove.spec.ts`/`detektiv.spec.ts` › abort-confirm-Fluss grün |
| 7 | Shared-Theme | `.notice` als Mini-Karte mit Danger-Leiste + Schatten | Erledigt | Kein direkter Test — CSS-only, `role="alert"` unverändert |
| 8 | Shared-Theme | `.splash` + `.splash_*` mit Kartenradius + Kantenring + Tischschatten | Erledigt | `ganove.spec.ts` › complete game (Splash im Outcome-Fluss) |
| 9 | Menü-Modul | `.card` in `Menu.module.css` zur Edelkarte | Erledigt | `design.spec.ts` › „dark-card look" (map-card-muenster) |
| 10 | Menü-Modul | `.statBox` zur Edelkarte | Erledigt | `persistenz.spec.ts` › stats view (stats-summary) |
| 11 | Menü-Modul | `.numberInput`/`.selectInput` als Inset-Karten-Slots | Erledigt | `menu.spec.ts` › settings out-of-range (Inputs bedienbar) |
| 12 | Menü-Modul | `.summaryTable` mit Kartenrand + Schatten | Erledigt | `menu.spec.ts` › dev mode batch + stats view (summaryTable sichtbar) |
| 13 | Menü-Modul | `.perspectiveToggle` mit Kartenrahmen | Erledigt | `persistenz.spec.ts` › replay-perspective-Fluss grün |
| 14 | Menü-Modul | `.badge` als Mini-Pill mit Inset-Line | Erledigt | `menu.spec.ts` › forthcoming-Karten (Badge sichtbar) |
| 15 | Komponenten | `MissionPanel.module.css`: `.panel` Edelkarte, `.choiceButton` embossed, `.choiceTitle` Schmuckschrift | Erledigt | `design.spec.ts` › „dark-card look" (Mission-Heading Display-Font) |
| 16 | Komponenten | `HeatBadge.module.css`: `.badge` Pill-Kartenlook | Erledigt | `design.spec.ts` › „dark-card look" (data-heat-level) |
| 17 | Komponenten | `PursuitBadge.module.css`: `.badge` Pill-Kartenlook | Erledigt | Kein direkter Test — identische Deklaration wie HeatBadge |
| 18 | Komponenten | `EventBanner.module.css`: `.banner` Kartenrand + Schatten | Erledigt | `detektiv.spec.ts` › hint chronicle (Banner erscheint) |
| 19 | Komponenten | `DetektivScreen.module.css`: `.commentInput` Inset-Look, `.removeButton` embossed | Erledigt | `detektiv.spec.ts` › „markers are set, commented" (Inputs/Buttons bedienbar) |
| 20 | E2E-Tests | Neuer Test „panels, cards, buttons and badges share the dark-card look" in `e2e/design.spec.ts` | Erledigt | Selbst der Test — 37/37 Playwright grün |
