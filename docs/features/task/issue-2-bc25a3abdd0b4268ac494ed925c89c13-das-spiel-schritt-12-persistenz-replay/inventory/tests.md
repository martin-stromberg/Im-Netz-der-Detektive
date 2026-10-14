# Tests — Ausgangszustand

## Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt (mit Zeitzone): Baseline-Lauf zu Beginn des Schritts (lokale Zeit, Windows)
- Branch und Commit-ID: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-12-persistenz-replay` @ `5602df3` („docs: Schritt 12 in Arbeit gesetzt")
- Uncommittete Änderungen im getesteten Stand: nur Lifecycle-Artefakte unter `docs/features/…schritt-12…/` (kein Produktivcode)
- Testumgebung und Runtime: Node ≥22.14, Vitest 5 + jsdom, Playwright 1.64

### Testläufe

| Lauf | Befehl | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------|--------------------|-----------|-------------|----------------|--------------|----------|
| Baseline Unit | `npm test` (vitest run) | Repo-Wurzel | 0 | 494 (40 Dateien) | 0 | 0 | [Log](test-results/vitest-baseline.txt) |

E2E-Baseline: 20 Tests in `e2e/menu.spec.ts` (8), `e2e/detektiv.spec.ts`
(7), `e2e/ganove.spec.ts` (5). Werden im Test-Schritt mit `npm run
test:e2e` erneut ausgeführt (dev-server-basiert, hier nicht im
Baseline-Lauf enthalten).

### Nachgewiesene bestehende Testfehler

Keine — alle 494 Unit-Tests erfolgreich.

### Testlücken und Ausführungsprobleme

- E2E-Basislauf wurde in der Bestandsaufnahme nicht wiederholt; die
  Suite ist grün dokumentiert (Schritt-11-Merge) und wird in Schritt 10
  vollständig nachgewiesen.
- Persistenz-Funktionen (`SaveGame`, `ReplayPlayer`, `Statistics`,
  `deleteGameLog`, Resume-Schreibpfad) existieren noch nicht — keine
  Tests dafür (Neuentwicklung).

## Testklassen (relevant für diesen Schritt)

### `gameStore.log.test.ts`
- „state reconstruction from header + seed (real maps)" — belegt
  bit-identische Rekonstruktion via `startOptionsFromHeader` +
  `resolvedMission`/`resolvedCameras` über mehrere Seeds und beide
  realen Karten.

### `Recorder.test.ts`
- Serialize/Parse-Roundtrip, FIFO-Grenze, `StorageLike`-Injection,
  Export-Blob, Degradierung ohne DOM.

### `GameIndex.test.ts`
- `summarizeLog`/`listGameSummaries`/`listResumeEntries` inkl.
  Schrott-Toleranz.

### `gameStore.test.ts`, `gameStore.rounds.test.ts`, `gameStore.events.test.ts`, `gameStore.mission.test.ts`, `gameStore.endings.test.ts`
- Phasenmaschine, Züge, Events, Mission, Enden; nutzen direkt
  `useGameStore.getState()` — Muster für Snapshot-Vergleichstests.

### Screen-Tests
- `MenuScreens.test.tsx`, `GanoveScreen.test.tsx`,
  `DetektivScreen.test.tsx` — Testing-Library gegen `useGameStore`;
  zeigen Render-/Interaktionsmuster für die neuen Screens.

## Hilfsmethoden

- `runAiGame(map, seed)` (`AiSimulation.ts`) — erzeugt vollständige,
  deterministische Logs als Test-Fixtures.
- `detectiveStartsFromLog(log)` — Spawn-Prior aus Header.
- `StorageLike`-Fake in `Recorder.test.ts` — injizierbarer Speicher.
