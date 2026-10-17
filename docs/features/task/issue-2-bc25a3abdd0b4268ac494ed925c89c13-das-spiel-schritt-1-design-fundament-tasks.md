# Tasks: Schritt 1 — Design-Fundament (Theme, Schmuckschrift, Farbvariablen)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Assets | `src/assets/fonts/` anlegen, `imfellenglish-regular.woff2` + `imfellenglish-italic.woff2` von Google Fonts laden | Erledigt | `e2e/design.spec.ts` „no external font requests" |
| 2 | Theme | `src/theme.css` mit `@font-face` (IM Fell English regular+italic, font-display: swap) anlegen | Erledigt | `e2e/design.spec.ts` „headings use the display font" |
| 3 | Theme | `:root`-Custom-Properties für die vollständige Bestandspalette in `theme.css` definieren | Erledigt | `e2e/design.spec.ts` „theme custom properties are defined on :root" |
| 4 | Theme | Neue Brettspiel-Tokens (Papier, Pappe, Tisch, Schatten) + `--font-display` in `theme.css` definieren | Erledigt | `e2e/design.spec.ts` „theme custom properties are defined on :root" |
| 5 | Theme | WCAG-AA-Kontrastpaarungen (≥ 4,5:1) als Kommentar in `theme.css` dokumentieren | Erledigt | Kein direkter Test (Kommentar; Werte rechnerisch verifiziert) |
| 6 | Einstieg | `import "./theme.css";` in `src/main.tsx` ergänzen | Erledigt | `e2e/design.spec.ts` „theme custom properties are defined on :root" |
| 7 | Shared-Theme | `GanoveScreen.module.css`: Farbliterale → `var()` | Erledigt | Vitest-Suite (597 Tests) unverändert grün |
| 8 | Shared-Theme | `.title` + `.panelHeading` → `font-family: var(--font-display)` | Erledigt | `e2e/design.spec.ts` „headings use the display font" |
| 9 | Module | `Menu.module.css` → `var()`; `.cardTitle`, `.statHeading` → Schmuckschrift | Erledigt | `e2e/design.spec.ts` + Vitest-Suite |
| 10 | Module | `DetektivScreen.module.css` → `var()`; `.markerHeading` → Schmuckschrift | Erledigt | Vitest-Suite unverändert grün |
| 11 | Module | `MissionPanel.module.css` → `var()`; `.heading` → Schmuckschrift | Erledigt | Vitest-Suite unverändert grün |
| 12 | Module | `EventBanner/HeatBadge/PursuitBadge/MapGraph/MapBackdrop/App.module.css` → `var()` | Erledigt | Vitest-Suite unverändert grün |
| 13 | Dokumentation | `src/assets/ASSETS.md`: Font-Eintrag (Name, Quelle, Lizenz SIL OFL, Version v14) | Erledigt | Kein direkter Test (Dokumentationsartefakt) |
| 14 | E2E-Tests | `e2e/design.spec.ts`: Schmuckschrift auf h1, keine externen Font-Requests, `:root`-Tokens aktiv | Erledigt | `npx playwright test e2e/design.spec.ts` — 3/3 bestanden |
