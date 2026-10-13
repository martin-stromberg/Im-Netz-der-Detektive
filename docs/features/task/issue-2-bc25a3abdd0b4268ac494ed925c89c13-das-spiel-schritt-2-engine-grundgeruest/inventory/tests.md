# Tests — Bestand und Ausgangszustand

## Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt (mit Zeitzone): 2026-10-13 18:42 (UTC+2) / 16:42 UTC
- Branch und Commit-ID: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-2-engine-grundgeruest`, `8b83d50eb8a006301ee4dc8b9d432db657388e1d`
- Uncommittete Änderungen im getesteten Stand: nur Lifecycle-Artefakte
  unter `docs/features/task/...schritt-2-engine-grundgeruest/`
  (untracked); kein produktiver Code geändert
- Testumgebung und Runtime-/SDK-Versionen: Node v24.15.0, npm 11.10.0,
  Python 3.13.14, Windows (Git Bash), Vitest 5.0.4
- Ermittelte Testsuiten und Quellen der Testbefehle: `package.json`
  `scripts.test` = `vitest run`; `scripts.coverage` =
  `vitest run --coverage` mit 70-%-Zeilenschwelle (`vite.config.ts`)

### Testläufe

| Lauf | Befehl inkl. Filter | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------------------|--------------------|-----------|-------------|----------------|--------------|----------|
| Baseline 1 | `npm test` (`vitest run`) | Repo-Root | 0 | 25 (4 Dateien) | 0 | 0 | [baseline-npm-test.txt](test-results/baseline-npm-test.txt) |

### Nachgewiesene bestehende Testfehler

Keine — der Baseline-Lauf ist vollständig grün.

### Testlücken und Ausführungsprobleme

Keine Ausführungsprobleme. Inhaltliche Lücke: sämtliche
Engine-Module der Anforderung (Loader, Graph, RNG, SpawnSystem) haben
noch keine Tests, da sie noch nicht existieren.

## Testklassen

### `placeholder.test.ts` (`src/logic/`)
- `advanceRound` — „increments the round number by one",
  „advances from the initial round 0 to round 1"

### `gameStore.test.ts` (`src/state/`)
- `useGameStore` — „starts at round 1",
  „advances the round via the headless store action"

### `App.test.tsx` (`src/`)
- `App` — „renders the application shell with the localized title",
  „renders the current round from the game store" (erwartet
  `Runde 1` im gerenderten HTML)

### `resolve-release-version.test.mjs` (`scripts/`)
- 19 Tests zum Release-Version-Resolver (nicht anforderungsrelevant)

## Hilfsmethoden

Keine projektspezifischen Testhelper vorhanden.
