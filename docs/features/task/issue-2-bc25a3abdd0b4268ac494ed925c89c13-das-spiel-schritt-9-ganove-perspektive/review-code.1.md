# Code-Review

## Ergebnis

**Status:** Befunde vorhanden

## Befunde

### `src/components/GanoveScreen.tsx`

- **Doppelter Code** — `moveGanove`, `runAction` und `tapRadio`
  wiederholen denselben try/catch-`setNotice`-Block (je ~6 Zeilen).

  Empfehlung: Helfer `runGuarded(fn)` extrahieren.

- **Fehlerbehandlung** — In `pickSpawn` ist der Fallback-`startGame`
  (`mission: "auto"`) nicht abgesichert: wirft auch dieser Aufruf, ist
  der Fehler unbehandelt.

  Empfehlung: Beide `startGame`-Aufrufe in `runGuarded` kapseln.

- **God-Komponente (leicht)** — Die Datei trägt drei vollständige
  Ansichten (idle, pickSpawn, playing+outcome) inline; ~340 Zeilen.

  Empfehlung: `IdleView`, `PickSpawnView` und `OutcomeView` als interne
  Teilkomponenten in derselben Datei extrahieren (kein neues File
  nötig) — erhöht Lesbarkeit ohne neue Abstraktion.

### `src/components/MapGraph.tsx`

- **Lesbarkeit** — Der Ganove-Marker ist als Inline-IIFE im JSX
  verschachtelt (`{ganovePosition !== null ? (() => {...})() : null}`).

  Empfehlung: Marker-Element vor dem `return` als Variable berechnen.

### `e2e/ganove.spec.ts`

- **Hinweis (kein Befund)** — `snapshot()` castet den Store über
  `as unknown as` — bewusste Test-Instrumentierung, akzeptabel.

## Geprüfte Dateien

- `src/components/MapGraph.tsx` / `MapGraph.module.css`
- `src/components/HeatBadge.tsx` / `HeatBadge.module.css`
- `src/components/MissionPanel.tsx` / `MissionPanel.module.css`
- `src/components/GanoveScreen.tsx` / `GanoveScreen.module.css`
- `src/state/detectiveDriver.ts`
- `src/App.tsx`, `src/App.module.css`, `src/main.tsx`
- `src/logic/AiSimulation.ts` (Export-Änderung)
- `src/test/setup.ts`
- `vite.config.ts`, `tsconfig.json`, `playwright.config.ts`,
  `package.json`, `.gitignore`
- `src/state/detectiveDriver.test.ts`, `src/components/*.test.tsx`,
  `src/App.test.tsx`, `e2e/ganove.spec.ts`
