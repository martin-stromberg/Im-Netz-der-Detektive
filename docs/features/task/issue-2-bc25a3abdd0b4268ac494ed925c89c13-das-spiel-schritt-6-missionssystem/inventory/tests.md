# Bestandsaufnahme: Tests (Ausgangszustand)

## Lauf-Protokoll

| Datum/Zeit (UTC) | Branch | Commit | Befehl | Arbeitsverzeichnis | Exit | Ergebnis |
|------------------|--------|--------|--------|--------------------|------|----------|
| 2026-10-13 18:50 | `task/issue-2-…-schritt-6-missionssystem` | `e07025a` (clean tree) | `npx vitest run` | Repo-Root | 0 | 16 Dateien, **208 Tests bestanden**, 0 fehlgeschlagen, 0 übersprungen |
| 2026-10-13 18:52 | dto. | `e07025a` (clean tree) | `npx vitest run --coverage` | Repo-Root | 0 | 208 grün; Lines **93,06 %** (Schwelle 70 %) |

Runtime: Node v24.15.0, Vitest 5.x, Provider v8. Nachweise: `test-results/baseline-vitest.txt`, `test-results/baseline-coverage.txt`.

Keine fehlgeschlagenen, nicht ausführbaren oder deaktivierten Tests. Build-/Setup-Fehler: keine.

## Relevante bestehende Tests

- `src/state/gameStore.rounds.test.ts` — Zugzwang, `ganoveAction`-Hook (`no_action_available`, `setGanoveCanAct(true)`), `setEscapeNodeIds`, **Zeile 79: `escapeNodeIds` = `["b","d","g"]`** (alle `flucht`-Knoten von teststadt — wird durch missionsgebundene Liste obsolet).
- `src/state/gameStore.endings.test.ts` — `escaped` über `flucht`-Kategorie-Knoten (teststadt `b`), `surrounded` inkl. Action-Hook (`setGanoveCanAct(true)` auf `lineMap`), `caught`, `timeout`, `draw`. Nutzt Inline-`MapPack`s (`tinyMap`, `lineMap`) **ohne** `diebstahl`-/`flucht`-Kategorien.
- `src/state/gameStore.info.test.ts` — `startGame`-Helper `detectivePositions:["a","i"], ganovePosition:"d"` auf teststadt; Kameras, Ereignismodi, Polizeifunk, Hitze; nutzt `escapeNodeIds` zur Fluchtpunkt-Vermeidung.
- `src/state/gameStore.test.ts` — Initial-State (`mission: null`, `escapeNodeIds: []`, `ganoveCanAct: false`).
- `src/logic/mapData.test.ts` — Datenintegrität der drei Kartenpakete.
- `src/logic/*.test.ts` — Modultests nach `describe/it`-Konvention; Inline-`MapPack`-Fixtures in `gameStore.endings.test.ts` als Muster.

## Lücken (für Schritt 6 neu zu schreiben)

- `MissionSystem.test.ts` (Generierung, Kriterien, Validierung, Laufzeithelfer)
- `MissionLoader.test.ts` (Fälle-Schema/Laden)
- `missionData.test.ts` (Integrität der ausgelieferten `src/data/missions/*.json` — Muster `mapData.test.ts`)
- `gameStore.mission.test.ts` (Store-Integration: Reihenfolge, Aktionsrunde, Binärwahl, Sabotageeffekte, missionsgebundene Flucht, Umzingelung mit Aktion)
- Anpassungen: `gameStore.rounds.test.ts` (escapeNodeIds-Erwartung), `gameStore.endings.test.ts` (`escaped`-Fälle)
