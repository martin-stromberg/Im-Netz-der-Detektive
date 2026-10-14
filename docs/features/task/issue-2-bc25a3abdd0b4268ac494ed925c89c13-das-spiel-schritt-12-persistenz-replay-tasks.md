# Tasks: Persistenz & Replay (Schritt 12)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Logik | `GameStateSnapshot`-Typ + `GameData`-Export in `gameStore.ts` | Erledigt | `SaveGame.test.ts` Roundtrip |
| 2 | Logik | `resumeGame(map, snapshot, log)` in `gameStore.ts` | Erledigt | `SaveGame.test.ts` (kompletter `GameData`-Vergleich) |
| 3 | Logik | `StartGameOptions.playerMode` + Header-`config.playerMode` | Erledigt | `gameStore.log.test.ts` Header-Roundtrip |
| 4 | Logik | `SaveGame.ts`: `SAVE_SCHEMA_VERSION`, `snapshotGame`, `buildResumeEntry`, Validierung | Erledigt | `SaveGame.test.ts` (13 Tests) |
| 5 | Logik | `GameIndex.ts`: `ResumeEntry` um `schema`/`mode`/`snapshot` erweitern | Erledigt | `GameIndex.test.ts` Schema-Filter |
| 6 | Logik | `GameIndex.ts`: `saveResumeEntry` (Upsert+FIFO), `deleteResumeEntry`, Schema-Filter | Erledigt | `GameIndex.test.ts` (Upsert, FIFO, Fremd-Schema-Erhalt) |
| 7 | Logik | `Recorder.ts`: `deleteGameLog(index)`, `getGameLog(index)` | Erledigt | `Recorder.test.ts` (positionsbasiert, No-op) |
| 8 | Logik | `ReplayPlayer.ts`: `isReplayAction`, `replayActions`, `replayTo`, `ReplayDriver` | Erledigt | `ReplayPlayer.test.ts` (9 Tests, Determinismus) |
| 9 | Logik | `Statistics.ts`: `aggregateStatistics` (Gesamt + `byMode`) | Erledigt | `Statistics.test.ts` (exakte Fixture-Werte) |
| 10 | UI | `ResumeScreen.tsx` (Liste, Auswahl, Löschen) | Erledigt | `ResumeScreen.test.tsx` (3) |
| 11 | UI | `ReplayScreen.tsx` (Timeline, Perspektiven, Deduktions-Overlay) | Erledigt | `ReplayScreen.test.tsx` (4) |
| 12 | UI | `menuFlow.ts`/`App.tsx`: Screens `resume`/`replay` verdrahten | Erledigt | E2E `persistenz.spec.ts` (Resume-/Replay-Flüsse) |
| 13 | UI | `MainMenu.tsx`: Resume-Button navigiert, Hinweistext | Erledigt | `MenuScreens.test.tsx` + E2E |
| 14 | UI | `StatsScreen.tsx`: Aggregate + Aktionen (Replay/Export/Löschen/Alle löschen) | Erledigt | `MenuScreens.test.tsx` + E2E |
| 15 | UI | `GanoveScreen`/`DetektivScreen`: „Partie speichern" + `playerMode` | Erledigt | E2E Speichern→Fortsetzen beider Modi |
| 16 | UI | i18n `de.json`/`en.json`: neue Schlüssel paritätisch | Erledigt | Paritätsabgleich (41 Keys je Katalog) |
| 17 | Tests | `SaveGame.test.ts` (Roundtrip, verbrauchte Fähigkeiten, Sabotage-Fenster) | Erledigt | vitest grün |
| 18 | Tests | `ReplayPlayer.test.ts` (Determinismus, Schritt zurück, visibleTo) | Erledigt | vitest grün |
| 19 | Tests | `Statistics.test.ts` (exakte Fixture-Werte) | Erledigt | vitest grün |
| 20 | Tests | `GameIndex.test.ts`/`Recorder.test.ts`/`gameStore`-Tests erweitern | Erledigt | vitest grün |
| 21 | Tests | `ResumeScreen`/`ReplayScreen`/`StatsScreen` Komponententests | Erledigt | vitest grün |
| 22 | E2E | `e2e/persistenz.spec.ts` (Speichern/Fortsetzen, Stats, Replay, Export, Löschen) | Erledigt | Playwright 26/26 grün |
| 23 | Doku | `docs/help/` + README + RELEASE_NOTES | Erledigt | `api.md`, `business-rules.md`, `ablauf-anwender/-technisch.md`, `index.md`, `README.md`, `RELEASE_NOTES.md`, `changes.log` |
