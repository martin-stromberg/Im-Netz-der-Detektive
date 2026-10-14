# Tasks: Persistenz & Replay (Schritt 12)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Logik | `GameStateSnapshot`-Typ + `GameData`-Export in `gameStore.ts` | Offen | — |
| 2 | Logik | `resumeGame(map, snapshot, log)` in `gameStore.ts` | Offen | — |
| 3 | Logik | `StartGameOptions.playerMode` + Header-`config.playerMode` | Offen | — |
| 4 | Logik | `SaveGame.ts`: `SAVE_SCHEMA_VERSION`, `snapshotGame`, `buildResumeEntry`, Validierung | Offen | — |
| 5 | Logik | `GameIndex.ts`: `ResumeEntry` um `schema`/`mode`/`snapshot` erweitern | Offen | — |
| 6 | Logik | `GameIndex.ts`: `saveResumeEntry` (Upsert+FIFO), `deleteResumeEntry`, Schema-Filter | Offen | — |
| 7 | Logik | `Recorder.ts`: `deleteGameLog(index)`, `getGameLog(index)` | Offen | — |
| 8 | Logik | `ReplayPlayer.ts`: `isReplayAction`, `replayActions`, `replayTo`, `ReplayDriver` | Offen | — |
| 9 | Logik | `Statistics.ts`: `aggregateStatistics` (Gesamt + `byMode`) | Offen | — |
| 10 | UI | `ResumeScreen.tsx` (Liste, Auswahl, Löschen) | Offen | — |
| 11 | UI | `ReplayScreen.tsx` (Timeline, Perspektiven, Deduktions-Overlay) | Offen | — |
| 12 | UI | `menuFlow.ts`/`App.tsx`: Screens `resume`/`replay` verdrahten | Offen | — |
| 13 | UI | `MainMenu.tsx`: Resume-Button navigiert, Hinweistext | Offen | — |
| 14 | UI | `StatsScreen.tsx`: Aggregate + Aktionen (Replay/Export/Löschen/Alle löschen) | Offen | — |
| 15 | UI | `GanoveScreen`/`DetektivScreen`: „Partie speichern" + `playerMode` | Offen | — |
| 16 | UI | i18n `de.json`/`en.json`: neue Schlüssel paritätisch | Offen | — |
| 17 | Tests | `SaveGame.test.ts` (Roundtrip, verbrauchte Fähigkeiten, Sabotage-Fenster) | Offen | — |
| 18 | Tests | `ReplayPlayer.test.ts` (Determinismus, Schritt zurück, visibleTo) | Offen | — |
| 19 | Tests | `Statistics.test.ts` (exakte Fixture-Werte) | Offen | — |
| 20 | Tests | `GameIndex.test.ts`/`Recorder.test.ts`/`gameStore`-Tests erweitern | Offen | — |
| 21 | Tests | `ResumeScreen`/`ReplayScreen`/`StatsScreen` Komponententests | Offen | — |
| 22 | E2E | `e2e/persistenz.spec.ts` (Speichern/Fortsetzen, Stats, Replay, Export, Löschen) | Offen | — |
| 23 | Doku | `docs/help/` + README + RELEASE_NOTES | Offen | — |
