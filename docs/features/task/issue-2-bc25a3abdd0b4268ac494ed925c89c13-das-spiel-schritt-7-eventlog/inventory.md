# Bestandsaufnahme: Eventlog / Aufzeichnung (Schritt 7)

Analysiert wurde der bestehende Stand der headless-Engine
(`src/logic/`, `src/state/gameStore.ts`) bezogen auf die Anforderung
„JSONL-Eventlog, Export, localStorage-Persistenz, Determinismus".

## Zusammenfassung

- Der `useGameStore` führt bereits ein internes `log: LogEntry[]` mit
  autoinkrementiertem `seq` und kapselt die Nutzdaten in `details`
  (`src/state/gameStore.ts`). Bereits geschriebene Einträge: `header`
  (mapId, seed, roundLimit, cameras, starts, mission), `move`,
  `hint`, `event` (umwelt), `action`, `sabotage_offer`,
  `mission_choice`, `sabotage`, `radio`, `result` (nur
  `outcome` + `rounds`).
- Die Informationsschicht (`InformationSystem.ts`) liefert `GameEvent`
  mit `visibleTo` (`"detectives" | "ganove" | "both"`) und die
  Metrik-Bausteine `HINT_EVENT_KINDS` / Kameratreffer über
  `kind === "camera"` — alle Vorgänge sind damit schon als Events im
  `events[]`-Array erfassbar.
- **Fehlt:** das Spec-Modul `Recorder.ts` (§2/§5) — keine
  JSONL-Serialisierung, kein Export, keine `localStorage`-Persistenz.
- **Fehlt:** `gameId` und `config` im Header; `visibleTo` auf
  Log-Einträgen; Balancing-Metriken (`hintsTotal`, `camerasTriggered`)
  im `result`-Eintrag; ein Log-Eintrag für den *Ablauf* von
  Kantensperrungen (`unblockExpiredEdges` entfernt still).
- **Abweichung vom Spec-Format:** bestehende Einträge kapseln Felder in
  `details` und verwenden `nodeId`/`missionAction`, das Spec-Beispiel
  (§8) nutzt flache Felder (`node`, `action`, `actor`, `edgeType`,
  `offered`, `chosen`).
- Determinismus ist bereits gesichert: `rng.ts` ist einzige
  Zufallsquelle (`Math.random()` in `src/logic/` per Git-Hook
  verboten), Runden-RNG via `createRng(mixSeed(seed, round))`.
- `GameOutcome` kennt bereits `"draw"`; `finish()` zentralisiert alle
  Endbedingungen — einzige Stelle für `result` + Auto-Persist.

Test-Ausgangszustand: 20 Testdateien, 277 Tests, alle erfolgreich —
keine bekannten Fehlschläge, Nachweis in
[tests.md](inventory/tests.md) bzw.
[inventory/test-results/baseline-npm-test.txt](inventory/test-results/baseline-npm-test.txt).

## Details

- [Datenmodell](inventory/models.md)
- [Logik](inventory/logic.md)
- [Enums](inventory/enums.md)
- [Tests](inventory/tests.md)
