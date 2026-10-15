# Tasks: Schritt 8 — Konsistenz-Endabnahme und Polishing

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | A11y | `.primaryButton:focus-visible`: `outline: none` durch sichtbaren amber Ring ersetzen (GanoveScreen.module.css) | Erledigt | `design.spec.ts` — `focus rings stay visible on interactive controls` |
| 2 | A11y | `.numberInput`/`.selectInput` `:focus-visible`: sichtbarer amber Ring (Menu.module.css) | Erledigt | `design.spec.ts` — `focus rings stay visible on interactive controls` |
| 3 | A11y | `.removeButton:focus-visible`: sichtbarer amber Ring (DetektivScreen.module.css) | Erledigt | `design.spec.ts` — `focus rings stay visible on interactive controls` |
| 4 | Motion | `.mapArea::after` `transition: none` im `prefers-reduced-motion`-Block ergänzen (GanoveScreen.module.css) | Erledigt | Kein direkter Test (CSS-Regel im bestehenden Reduce-Block; Vitest/E2E grün) |
| 5 | Dokumentation | Kontrastzeile `#eaf0f8` auf `#10141c` (≈16,1:1, Input-Flächen) in `theme.css`- und `GanoveScreen.module.css`-Headern ergänzen | Erledigt | Kein direkter Test (Kommentar-Dokumentation) |
| 6 | E2E-Tests | `focus rings stay visible on interactive controls` in `e2e/design.spec.ts` | Erledigt | Test selbst — bestanden (40/40 E2E grün) |
| 7 | Audit | Verifikationsläufe: lint, format, vitest+Coverage, Hooks `--all --strict`, build + dist-Scan, E2E | Erledigt | `test-results.md` — alle Läufe Exit 0 |
