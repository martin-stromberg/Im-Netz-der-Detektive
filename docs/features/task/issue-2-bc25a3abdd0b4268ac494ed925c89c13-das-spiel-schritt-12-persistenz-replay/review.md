# Plan-Review — Schritt 12: Persistenz, Replay & Statistiken

Prüfung der Implementierung gegen `plan.md` (Designentscheidungen,
Programmabläufe, Module, Validierungsregeln, Tests).

## Planpunkt → Umsetzung

| Planpunkt | Stand | Nachweis |
|---|---|---|
| `gameStore.ts`: `GameStateSnapshot` (`Omit<GameData,"map"\|"log">`), `GameData` exportiert | ✅ umgesetzt | `src/state/gameStore.ts` — beide Typen exportiert, Doku-Kommentar |
| `resumeGame(map, snapshot, log)` | ✅ umgesetzt | `set({...initialData(), ...snapshot, map, log})`; kompletter `GameData`-Roundtrip in `SaveGame.test.ts` |
| `StartGameOptions.playerMode` + Header-`config.playerMode` | ✅ umgesetzt | nur bei gesetztem Wert im Header; Roundtrip-Test in `gameStore.log.test.ts` (inkl. `startOptionsFromHeader`-Durchreichung — im Review ergänzt) |
| `SaveGame.ts`: `SAVE_SCHEMA_VERSION`, `snapshotGame`, `buildResumeEntry`, Validierung | ✅ umgesetzt | Validierung als `isValidResumeEntry`-Type-Guard; plus `gameIdOf`, `resumeLogEntries` (Header-`seq`/`round`-Defaults) |
| `GameIndex.ts`: `ResumeEntry` um `schema`/`mode`/`snapshot` | ✅ umgesetzt | `src/logic/GameIndex.ts` |
| `GameIndex.ts`: `saveResumeEntry` (Upsert+FIFO), `deleteResumeEntry`, Schema-Filter | ✅ umgesetzt | `MAX_RESUME_ENTRIES` = 10, `clearResumeEntries`; Schreibpfad erhält Fremd-Schema-Einträge (Review-Nachzug, siehe `review-code.md` C2) |
| `Recorder.ts`: `deleteGameLog(index)`, `getGameLog(index)` | ✅ umgesetzt | positionsbasiert (instabile `gameId` dokumentiert); erweitert in `Recorder.test.ts` |
| `ReplayPlayer.ts`: `isReplayAction`, `replayActions`, `replayTo`, `ReplayDriver` | ✅ umgesetzt | plus `openReplay`/`ReplayError`/`ReplaySource` als Parse-Schicht; `useGameStore` erfüllt den Driver strukturell |
| `Statistics.ts`: `aggregateStatistics` (Gesamt + `byMode`) | ✅ umgesetzt | `StatsBucket` inkl. `logStats`, Modusgruppe `unbekannt` |
| `ResumeScreen.tsx` (Liste, Auswahl, Löschen) | ✅ umgesetzt | Klartext: Kartenname, Seite, Runde, Speicherzeitpunkt; `resume-delete-*`-Aktion |
| `ReplayScreen.tsx` (Timeline, Perspektiven, Deduktions-Overlay) | ✅ umgesetzt | vor/zurück/Abspielen/Pause, `visibleTo`-Perspektiven, `deducePossiblePositions`-Overlay, `DetectiveMapLegend`/`MissionPanel`/`HeatBadge`-Wiederverwendung |
| `menuFlow.ts`/`App.tsx`: Screens `resume`/`replay` | ✅ umgesetzt | `resumeGame`-Aufruf, Fehlerpfad (defekter Eintrag → gelöscht + `resumeRefresh`-Remount), `startImmediately`-Guard beim Fortsetzen |
| `MainMenu.tsx`: Resume-Button navigiert, Hinweistext | ✅ umgesetzt | `onNavigate("resume")` sobald Einträge existieren; `menu.resumeHint` = Leer-Hinweis |
| `StatsScreen.tsx`: Aggregate + Aktionen | ✅ umgesetzt | `BucketPanel`-Raster (Gesamt + 3 Modi), Replay/Export/Löschen je Zeile via `storageIndex`, „Alle löschen" mit Rückfrage, Refresh nach Mutation |
| `GanoveScreen`/`DetektivScreen`: „Partie speichern" + `playerMode` | ✅ umgesetzt | `save-button` nur bei `outcome === null`; `playerMode` im `startGame`-Aufruf |
| i18n `de.json`/`en.json` paritätisch | ✅ umgesetzt | +41 Keys je Katalog (`resume.*`, `save.*`, `replay.*`, `stats.summary.*`, `stats.mode.*`, `stats.action.*`); Parität skriptgeprüft |
| `SaveGame.test.ts` (Roundtrip, Fähigkeiten, Sabotage-Fenster) | ✅ umgesetzt | 13 Tests: Vollständigkeits-Roundtrip, `radioUsed` verbraucht, Fenster/Kameras/`blockedEdges`, `activeDetectiveIndex`, Schema/Struktur-Validierung, Deep-Copy |
| `ReplayPlayer.test.ts` (Determinismus, zurück, `visibleTo`) | ✅ umgesetzt | 9 Tests: Schrittzustände == beobachtete Originalzustände, Log bitgleich (inkl. `playerMode`-Log — Review-Nachzug), vor/zurück identisch, Clamping, kein Ganove-Leck |
| `Statistics.test.ts` (exakte Fixture-Werte) | ✅ umgesetzt | 6 Tests über JSONL-Fixtures: exakte Quoten/Schnitte je Seite und Modus, `draw`, `unbekannt`, `null` bei Leergruppen |
| `GameIndex.test.ts`/`Recorder.test.ts`/gameStore-Tests | ✅ umgesetzt | `GameIndex.test.ts` +5 (Upsert, FIFO, Schema-Filter, Fremd-Schema-Erhalt), `Recorder.test.ts` (`getGameLog`/`deleteGameLog`), `gameStore.log.test.ts` +1 (`playerMode` im Header), `MenuScreens.test.tsx` angepasst |
| `ResumeScreen`/`ReplayScreen`/`StatsScreen`-Tests | ✅ umgesetzt | `ResumeScreen.test.tsx` (3), `ReplayScreen.test.tsx` (4), Stats-Aggregate/Aktionen in `MenuScreens.test.tsx` |
| `e2e/persistenz.spec.ts` (5 Pflicht-/Optional-Szenarien) | ✅ umgesetzt | Speichern→Reload→Fortsetzen (Ganove + Detektiv), Aggregate+Löschaktionen, Export-Download, Timeline+Perspektiven (kein `[data-ganove]` in Detektiv-Sicht), Auto-Play bis Outcome |

## Abweichungen vom Plan — alle begründet

1. **`openReplay`/`ReplayError`/`ReplaySource` statt reiner
   `parseLog`-Nutzung:** Der Plan nannte `isReplayAction`/`replayActions`/
   `replayTo`; die Parse-Schicht wurde als eigene Funktion modelliert,
   damit Header-Prüfung + Start-Rekonstruktion an einer Stelle liegen
   und der Screen sie einmalig aufruft.
2. **`isValidResumeEntry` statt `validateResumeEntry`/`parseSnapshot`:**
   Type-Guard über dem ganzen Eintrag (Schema + Pflichtfelder des
   Snapshots) — deckt beide geplanten Funktionen ab und speist direkt
   den `listResumeEntries`-Filter.
3. **`startOptionsFromHeader` reicht `config.playerMode` durch:**
   Im Plan als Seiteneffekt-Annahme formuliert („bit-identische
   Rekonstruktion bleibt"), in der Implementierung zunächst
   unterblieben — im Code-Review nachgezogen (siehe `review-code.md`
   C1), ohne das Feld wäre das Replay-Header-Log menschlicher Partien
   nicht bitgleich.
4. **Schreibpfad erhält Fremd-Schema-Einträge:** `saveResumeEntry`/
   `deleteResumeEntry` arbeiten auf der rohen Liste statt der
   gefilterten — ein zukünftiges Schema wird nicht still
   wegüberschrieben (Review-Nachzug C2).
5. **`chronicle.ts`-Extraktion:** `chronicleText` liegt als
   gemeinsames Modul außerhalb der Komponentendatei
   (react-refresh-Regel „nur Komponenten-Exporte"); `MapLegend`/
   `DetectiveMapLegend` bleiben Komponenten-Exporte der Screens.
6. **`startImmediately={map === null}` beim Fortsetzen:** Der
   fortgesetzte Snapshot landet direkt in der „playing"-Ansicht;
   ohne den Guard hätte der Screen den Setup-Flow erneut gestartet.

## Ergebnis

**Vollständig umgesetzt** — alle Planpunkte implementiert und getestet;
die vier Review-Nachzüge (C1–C4 in `review-code.md`) sind behoben und
rückgetestet.
