# Tasks: Eventlog / Aufzeichnung (Schritt 7)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Datenmodell | `LogInput` einführen und `LogEntry` auf flaches Format (Indexsignatur, `visibleTo`) umstellen | Erledigt | `gameStore.log.test.ts` (alle Einträge flach + `visibleTo`) |
| 2 | Logik | `appendLog`-`seq`-Regel: `header` → `0`, Events → Anzahl Nicht-Header + 1; Ablage als `{ seq, ...input }` | Erledigt | `gameStore.log.test.ts` (seq 1..n sequenziell), `gameStore.test.ts` (`increasing seq`) |
| 3 | Logik | `startGame`: `gameId` (Option + Default `g-${seed}`) und `config`-Objekt; Header-Eintrag im Spec-Format | Erledigt | `Recorder.test.ts` (`header without seq/round`), `gameStore.test.ts` (`header log entry`) |
| 4 | Logik | `moveGanove`/`moveDetective`-Logeinträge flach + `visibleTo` (`ganove`/`both`) | Erledigt | `gameStore.rounds.test.ts`, `gameStore.log.test.ts` (`visibleTo` je Actor) |
| 5 | Logik | `emitInfoEvent` flach (`node`, `zone`, `nodeIds`, `edge`, `untilRound`, `action` aus `event.details`) + `visibleTo` | Erledigt | `gameStore.log.test.ts` (sichtbarkeit/hinweis/umwelt/aktion-Einträge) |
| 6 | Logik | `ganoveAction`-Logeintrag flach (`action`, `node`) + `visibleTo:"ganove"` | Erledigt | `gameStore.rounds.test.ts` (`logs the action`) |
| 7 | Logik | `advanceMission`: `sabotage_offer` beim Angebot (`offered`, `node`); `chooseMissionPath`: zweiter `sabotage_offer` mit `chosen` (ersetzt `mission_choice`) | Erledigt | `gameStore.log.test.ts` (zwei `sabotage_offer`-Records) |
| 8 | Logik | `applySabotageEffect`-Eintrag flach + `visibleTo:"ganove"`; `useRadio`-Eintrag flach + `visibleTo:"ganove"` | Erledigt | `gameStore.log.test.ts` (`visibleTo` je Typ, alle Typen vorhanden) |
| 9 | Logik | `unblockExpiredEdges` schreibt `edge_unblock`-Einträge (`edge`, `visibleTo:"both"`) | Erledigt | `gameStore.log.test.ts` (`logs the expiry of an edge block`) |
| 10 | Logik | `finish`: `result`-Eintrag mit `outcome`, `rounds`, `hintsTotal`, `camerasTriggered`, `visibleTo:"both"` | Erledigt | `gameStore.log.test.ts` (Metriken caught/draw), `gameStore.endings.test.ts` |
| 11 | Recorder | `src/logic/Recorder.ts`: `serializeLog`/`serializeLogEntry` (JSONL, Header ohne `seq`/`round`) | Erledigt | `Recorder.test.ts` (`serializeLog (JSONL format)`) |
| 12 | Recorder | `headerFromLog` + `startOptionsFromHeader` (Header → `StartGameOptions` + `mapId`/`seed`) | Erledigt | `Recorder.test.ts`, `gameStore.log.test.ts` (`reconstructs the same starting state`) |
| 13 | Recorder | `StorageLike`, `defaultStorage()`, `LOG_STORAGE_KEY`, `MAX_STORED_LOGS`, `saveGameLog`/`listGameLogs`/`clearGameLogs` (FIFO, korrupt-sicher) | Erledigt | `Recorder.test.ts` (`localStorage FIFO`) |
| 14 | Recorder | `exportGameLog` (Blob + injizierbarer Download, DOM-Default nur bei `document`) | Erledigt | `Recorder.test.ts` (`exportGameLog`), `gameStore.log.test.ts` (`exports the running game log`) |
| 15 | Logik | `finish` ruft `saveGameLog` (Auto-Persist); Store-Action `exportGameLog()` | Erledigt | `gameStore.log.test.ts` (`auto-persists the finished log`) |
| 16 | Tests | Bestehende `gameStore.*.test.ts`-`details`-Assertions auf flaches Format umstellen | Erledigt | Gesamtsuite grün (309 Tests) |
| 17 | Tests | `src/logic/Recorder.test.ts` anlegen | Erledigt | 19 Tests grün |
| 18 | Tests | `src/state/gameStore.log.test.ts` anlegen (volle Partie, Determinismus, Rekonstruktion, `visibleTo`, Metriken, Auto-Persist) | Erledigt | 13 Tests grün |
