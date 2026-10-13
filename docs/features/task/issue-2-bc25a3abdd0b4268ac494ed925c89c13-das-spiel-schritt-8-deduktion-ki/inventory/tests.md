# Bestandsaufnahme — Tests

## Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt (mit Zeitzone): 2026-10-13T20:44:15Z (UTC)
- Branch und Commit-ID: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-8-deduktion-ki` @ `1839f80137ed59346b73148aa7e642d9b5ea54f6`
- Uncommittete Änderungen im getesteten Stand: nur neue Lifecycle-Artefakte unter `docs/features/.../` (keine Quellcode-Änderungen)
- Testumgebung und Runtime: Node v24.15.0, npm 11.10.0, Vitest 5.0.4, Windows (Git Bash)
- Ermittelte Testsuiten: `npm test` (`vitest run`) — alle `*.test.ts(x)` unter `src/`

### Testläufe

| Lauf | Befehl inkl. Filter | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------------------|--------------------|-----------|-------------|----------------|--------------|----------|
| Baseline | `npm test` | Repo-Root | 0 | 326 | 0 | 0 | [Log](test-results/npm-test-baseline.log) |

### Nachgewiesene bestehende Testfehler

Keine — alle 326 Tests in 22 Dateien bestanden.

### Testlücken und Ausführungsprobleme

- `Deduction.ts`, `DetectiveAI.ts`, `GanoveAI.ts`, Simulations-Treiber:
  noch nicht vorhanden — keine Tests (sind Gegenstand dieser Anforderung).
- Keine E2E/UI-Tests im Projekt; die Anforderung betrifft keinen
  Benutzerfluss (headless Dev-Modus) — E2E nicht anwendbar.

## Testklassen (bestehend, relevante)

### `gameStore.rounds.test.ts`
- Rundenmotor: Zugzwang, Phasenwechsel, Fang nach Einzelzug, Umzingelung, Timeout, Remis.

### `gameStore.mission.test.ts`
- Missionsablauf im Store: Aktionen, Sabotage-Angebot/Binärwahl, Flucht-Sieg.

### `gameStore.info.test.ts`
- Sichtbarkeitsfilterung, Hitze-Indikator, Polizeifunk.

### `gameStore.log.test.ts` / `gameStore.endings.test.ts`
- Eventlog-Format, Rekonstruktion aus Header+Seed, alle Endbedingungen.

### Modultests
- `Graph.test.ts`, `Movement.test.ts`, `InformationSystem.test.ts`,
  `EreignisEngine.test.ts`, `CameraSystem.test.ts`, `SpawnSystem.test.ts`,
  `MissionSystem.test.ts`, `MissionLoader.test.ts`, `MapLoader.test.ts`,
  `mapPack.test.ts`, `mapData.test.ts`, `missionData.test.ts`,
  `rng.test.ts`, `Recorder.test.ts`.

## Hilfsmethoden

- `loadMap("teststadt" | "muenster" | "luebeck")` — Fixture-Karten in den Modultests.
- `createRng(seed)` — deterministische Zufallsstreams in Tests.
- Store-Pattern in `gameStore.*.test.ts`: `useGameStore.getState().startGame(map, seed, options)`, explizite `detectivePositions`/`ganovePosition`, `mission: "none"`/`{type:"custom",…}` für skriptierte Szenarien.
