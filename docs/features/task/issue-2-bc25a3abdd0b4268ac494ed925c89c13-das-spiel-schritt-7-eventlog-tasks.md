# Tasks: Eventlog / Aufzeichnung (Schritt 7)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Datenmodell | `LogInput` einführen und `LogEntry` auf flaches Format (Indexsignatur, `visibleTo`) umstellen | Offen | — |
| 2 | Logik | `appendLog`-`seq`-Regel: `header` → `0`, Events → Anzahl Nicht-Header + 1; Ablage als `{ seq, ...input }` | Offen | — |
| 3 | Logik | `startGame`: `gameId` (Option + Default `g-${seed}`) und `config`-Objekt; Header-Eintrag im Spec-Format | Offen | — |
| 4 | Logik | `moveGanove`/`moveDetective`-Logeinträge flach + `visibleTo` (`ganove`/`both`) | Offen | — |
| 5 | Logik | `emitInfoEvent` flach (`node`, `zone`, `nodeIds`, `edge`, `untilRound`, `action` aus `event.details`) + `visibleTo` | Offen | — |
| 6 | Logik | `ganoveAction`-Logeintrag flach (`action`, `node`) + `visibleTo:"ganove"` | Offen | — |
| 7 | Logik | `advanceMission`: `sabotage_offer` beim Angebot (`offered`, `node`); `chooseMissionPath`: zweiter `sabotage_offer` mit `chosen` (ersetzt `mission_choice`) | Offen | — |
| 8 | Logik | `applySabotageEffect`-Eintrag flach + `visibleTo:"ganove"`; `useRadio`-Eintrag flach + `visibleTo:"ganove"` | Offen | — |
| 9 | Logik | `unblockExpiredEdges` schreibt `edge_unblock`-Einträge (`edge`, `visibleTo:"both"`) | Offen | — |
| 10 | Logik | `finish`: `result`-Eintrag mit `outcome`, `rounds`, `hintsTotal`, `camerasTriggered`, `visibleTo:"both"` | Offen | — |
| 11 | Recorder | `src/logic/Recorder.ts`: `serializeLog`/`serializeLogEntry` (JSONL, Header ohne `seq`/`round`) | Offen | — |
| 12 | Recorder | `headerFromLog` + `startOptionsFromHeader` (Header → `StartGameOptions` + `mapId`/`seed`) | Offen | — |
| 13 | Recorder | `StorageLike`, `defaultStorage()`, `LOG_STORAGE_KEY`, `MAX_STORED_LOGS`, `saveGameLog`/`listGameLogs`/`clearGameLogs` (FIFO, korrupt-sicher) | Offen | — |
| 14 | Recorder | `exportGameLog` (Blob + injizierbarer Download, DOM-Default nur bei `document`) | Offen | — |
| 15 | Logik | `finish` ruft `saveGameLog` (Auto-Persist); Store-Action `exportGameLog()` | Offen | — |
| 16 | Tests | Bestehende `gameStore.*.test.ts`-`details`-Assertions auf flaches Format umstellen | Offen | — |
| 17 | Tests | `src/logic/Recorder.test.ts` anlegen | Offen | — |
| 18 | Tests | `src/state/gameStore.log.test.ts` anlegen (volle Partie, Determinismus, Rekonstruktion, `visibleTo`, Metriken, Auto-Persist) | Offen | — |
