# Tests — Bestandsaufnahme

## Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt (mit Zeitzone): 2026-10-13, ~22:04 (lokale Systemzeit)
- Branch und Commit-ID: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-7-eventlog` @ `72f2a460b32719465828d4726b329f19a627f011`
- Uncommittete Änderungen im getesteten Stand: nur neue, nicht gestagte Artefakte unter `docs/features/task/...-schritt-7-eventlog/` (kein Produktivcode)
- Testumgebung und Runtime-/SDK-Versionen: Node v24.15.0, npm 11.10.0, Vitest 5 (Node-Umgebung, kein jsdom), Coverage via `@vitest/coverage-v8` mit 70-%-Zeilen-Gate (`vite.config.ts`)
- Ermittelte Testsuiten und Quellen der Testbefehle: `npm test` = `vitest run`; `npm run coverage` = `vitest run --coverage` (aus `package.json`)

### Testläufe

| Lauf | Befehl inkl. Filter | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------------------|--------------------|-----------|-------------|----------------|--------------|----------|
| Baseline | `npm test` | Repo-Root | 0 | 277 | 0 | 0 | [baseline-npm-test.txt](test-results/baseline-npm-test.txt) |

### Nachgewiesene bestehende Testfehler

Keine — der Ausgangslauf ist vollständig grün (277/277).

### Testlücken und Ausführungsprobleme

Keine. Alle 20 Testdateien liefen durch. Es existiert noch keine
Testdatei für einen Recorder (Modul existiert nicht).

## Testklassen (logrelevant)

### `src/state/gameStore.test.ts`
- `initializes positions, seed, eventMode and the header log entry` — prüft `log[0]` auf `{ seq: 1, round: 1, type: "header" }`
- `appends log entries with increasing seq` — prüft `appendLog`-Seq-Vergabe `[1, 2]`
- `resets to a clean state` / weitere — prüfen `log` leer nach Reset

### `src/state/gameStore.rounds.test.ts`
- Log-Assertions auf `move`-Einträge mit `details: { actor, from, to, edgeType }` (Zeilen ~110, ~128)
- `action`-Eintrag mit `details: { actor: "ganove", nodeId: "d" }` (Zeile ~248)

### `src/state/gameStore.endings.test.ts`
- `result`-Einträge: `toMatchObject({ ..., details: { outcome: ..., rounds: ... } })` für caught/surrounded/escaped/timeout/draw (Zeilen ~109, ~166, ~227, ~255, ~282)

### `src/state/gameStore.info.test.ts`
- `is deterministic and records cameras in the header log` — `log[0].details?.cameras` (Zeile ~115)
- `hint`-Einträge im Log (Zeile ~136); `radio`-Eventdetails `details.hints` (Zeile ~290, `GameEvent`-Ebene)

### `src/state/gameStore.mission.test.ts`
- `aktion`-Event-`details` (`{ action: "kontakt" }`, Zeilen ~404, ~410 — `GameEvent`-Ebene)
- `result`-Eintrag `details: { outcome: "escaped", rounds: 12 }` (Zeile ~367)
- `details: { action: "diebstahl" }` (Zeile ~312 — `aktion`-`GameEvent`)

## Hilfsmethoden

Keine dedizierte Test-Helper-Datei; die Store-Tests definieren lokale
Fixtures (u. a. `teststadt`-Karte via `loadMap`/`mapPack`-Literal) und
eine `store()`-Zugriffsfunktion (`useGameStore.getState()`).
