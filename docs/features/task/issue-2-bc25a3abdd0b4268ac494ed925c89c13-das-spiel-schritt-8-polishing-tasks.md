# Tasks: Schritt 8 — Konsistenz-Endabnahme und Polishing

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | A11y | `.primaryButton:focus-visible`: `outline: none` durch sichtbaren amber Ring ersetzen (GanoveScreen.module.css) | Offen | — |
| 2 | A11y | `.numberInput`/`.selectInput` `:focus-visible`: sichtbarer amber Ring (Menu.module.css) | Offen | — |
| 3 | A11y | `.removeButton:focus-visible`: sichtbarer amber Ring (DetektivScreen.module.css) | Offen | — |
| 4 | Motion | `.mapArea::after` `transition: none` im `prefers-reduced-motion`-Block ergänzen (GanoveScreen.module.css) | Offen | — |
| 5 | Dokumentation | Kontrastzeile `#eaf0f8` auf `#10141c` (≈16,1:1, Input-Flächen) in `theme.css`- und `GanoveScreen.module.css`-Headern ergänzen | Offen | — |
| 6 | E2E-Tests | `focus rings stay visible on interactive controls` in `e2e/design.spec.ts` | Offen | — |
| 7 | Audit | Verifikationsläufe: lint, format, vitest+Coverage, Hooks `--all --strict`, build + dist-Scan, E2E | Offen | — |
