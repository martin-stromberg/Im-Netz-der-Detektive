# Tasks: Schritt 1 — Design-Fundament (Theme, Schmuckschrift, Farbvariablen)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Assets | `src/assets/fonts/` anlegen, `imfellenglish-regular.woff2` + `imfellenglish-italic.woff2` von Google Fonts laden | Offen | — |
| 2 | Theme | `src/theme.css` mit `@font-face` (IM Fell English regular+italic, font-display: swap) anlegen | Offen | — |
| 3 | Theme | `:root`-Custom-Properties für die vollständige Bestandspalette in `theme.css` definieren | Offen | — |
| 4 | Theme | Neue Brettspiel-Tokens (Papier, Pappe, Tisch, Schatten) + `--font-display` in `theme.css` definieren | Offen | — |
| 5 | Theme | WCAG-AA-Kontrastpaarungen (≥ 4,5:1) als Kommentar in `theme.css` dokumentieren | Offen | — |
| 6 | Einstieg | `import "./theme.css";` in `src/main.tsx` ergänzen | Offen | — |
| 7 | Shared-Theme | `GanoveScreen.module.css`: Farbliterale → `var()` | Offen | — |
| 8 | Shared-Theme | `.title` + `.panelHeading` → `font-family: var(--font-display)` | Offen | — |
| 9 | Module | `Menu.module.css` → `var()`; `.cardTitle`, `.statHeading` → Schmuckschrift | Offen | — |
| 10 | Module | `DetektivScreen.module.css` → `var()`; `.markerHeading` → Schmuckschrift | Offen | — |
| 11 | Module | `MissionPanel.module.css` → `var()`; `.heading` → Schmuckschrift | Offen | — |
| 12 | Module | `EventBanner/HeatBadge/PursuitBadge/MapGraph/MapBackdrop/App.module.css` → `var()` | Offen | — |
| 13 | Dokumentation | `src/assets/ASSETS.md`: Font-Eintrag (Name, Quelle, Lizenz SIL OFL, Version v14) | Offen | — |
| 14 | E2E-Tests | `e2e/design.spec.ts`: Schmuckschrift auf h1, keine externen Font-Requests, `:root`-Tokens aktiv | Offen | — |
