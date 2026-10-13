# Plan-Review

## Ergebnis

**Status:** Vollständig umgesetzt

## Umgesetzte Planelemente

- [x] `MapGraph.tsx` + `MapGraph.module.css` — angelegt: SVG aus
  `viewBox`, Knoten mit Klarnamen, `weg`/`fahrt` unterschiedlich,
  gesperrte Kanten ausgegraut + Sperr-Glyphe, Detektiv-/Ganove-/Missions-/
  Flucht-Marker (formkodiert), interaktive Knoten mit `role="button"`,
  `tabIndex`, Enter/Space; keine Kamera-/Hinweis-Props vorhanden
- [x] `HeatBadge.tsx` + CSS — 4 Stufen, Icon (Balkenmeter) + Text + Score
- [x] `MissionPanel.tsx` + CSS — Schrittfolge/Status, aktuelles Ziel,
  `currentMissionTarget`, Sabotage-Binärwahl
- [x] `GanoveScreen.tsx` + CSS — idle → pickSpawn → playing → outcome;
  Statusbar (Runde/Limit, Phase, Hitze), Intel-Feed (nur
  `visibleEvents(…,"ganove")`), Funk-Button einmalig, Remis-Abbruch mit
  Inline-Bestätigung, `?map=`/`?seed=`/`?mission=`-URL-Parameter
- [x] `src/state/detectiveDriver.ts` — `detectiveStartsFromLog` (aus
  Log-Header), `driveDetectivePhase`, `installDetectiveDriver` mit
  Reentrancy-Guard
- [x] `aiRng` aus `AiSimulation.ts` exportiert
- [x] `App.tsx`/`App.module.css` auf `GanoveScreen` umgebaut;
  `PlaceholderPanel` entfernt; `main.tsx` exponiert `__gameStore` nur
  in DEV
- [x] `de.json`/`en.json` — alle geplanten Schlüssel paritätisch ergänzt
- [x] `vite.config.ts` (setupFiles, e2e-Exclude), `tsconfig.json`
  (e2e+playwright.config in include), `package.json` (`test:e2e`),
  `.gitignore` (`playwright-report/`), `src/test/setup.ts`,
  `playwright.config.ts`
- [x] Tests: `detectiveDriver.test.ts` (8), `MapGraph.test.tsx` (9),
  `HeatBadge.test.tsx` (5), `MissionPanel.test.tsx` (5),
  `GanoveScreen.test.tsx` (12), `App.test.tsx` angepasst (2)
- [x] E2E: `e2e/ganove.spec.ts` — 5 Playwright-Szenarien, davon eine
  komplette deterministische Münster-Partie bis `escaped` inkl. aller
  Missionsaktionen und der Sabotage-Binärwahl, ein Verlierer-Lauf,
  Asymmetrie-DOM-Assertionen, Funk/Remis, Tastaturbedienung

## Offene Aufgaben

Keine.

## Hinweise

- `mission.action.execute` ist als generischer Fallback-Schlüssel
  vorhanden; konkrete Aktionen nutzen `mission.action.<kind>`.
- Die E2E-Seeds (19 → escaped mit kompletter Mission, 4 → caught) wurden
  per headless Scan der exakt gleichen Treiber-/Klicklogik ermittelt —
  deterministisch reproduzierbar.
