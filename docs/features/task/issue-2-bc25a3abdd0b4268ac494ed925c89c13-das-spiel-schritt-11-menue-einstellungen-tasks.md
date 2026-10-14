# Tasks: Menü, Einstellungen, Szenario-Auswahl, Startaufstellung (Schritt 11)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Logik | `src/logic/GameIndex.ts` mit `GameSummary`, `listGameSummaries`, `ResumeEntry`, `listResumeEntries` anlegen | Erledigt | `GameIndex.test.ts` (8) |
| 2 | Logik | `SpawnSystem.ganoveSpawnChoicesForMission` + `pickGanoveSpawnForMission` (Kriterienfilter) | Erledigt | `SpawnSystem.test.ts` +4 |
| 3 | Logik | `MissionLoader.resolveFixedTargets(map, mission)` | Erledigt | `MissionLoader.test.ts` +5 |
| 4 | Logik | `gameStore`: `StartGameOptions.eventMode`/`eventDefaults`, State-Feld, Validierung, Header-Config | Erledigt | `gameStore.events.test.ts` (6) |
| 5 | Logik | `gameStore.resolveSpawnPositions`: Ganoven-Kandidaten missionsgefiltert | Erledigt | `gameStore.events.test.ts` (6) |
| 6 | Logik | `Recorder.startOptionsFromHeader`: `eventMode`/`eventDefaults` durchreichen | Erledigt | `Recorder.test.ts` |
| 7 | UI | `menuFlow.ts` (`Screen`, `PendingGameConfig`, `MENU_MAP_IDS`, `FORTHCOMING_MAPS`, `cadenceToEventDefaults`, `eventCadenceOf`) | Erledigt | `menuFlow.test.ts` (5) |
| 8 | UI | `MainMenu.tsx` | Erledigt | `MenuScreens.test.tsx` + `App.test.tsx` |
| 9 | UI | `MapSelect.tsx` (aktive Karten + „in Vorbereitung") | Erledigt | `MenuScreens.test.tsx` + `e2e/menu.spec.ts` |
| 10 | UI | `ModeSelect.tsx` (Ganove/Detektiv/Dev) | Erledigt | `MenuScreens.test.tsx` |
| 11 | UI | `SettingsScreen.tsx` (Karten-Bereiche, unlimited, eventMode+Kadenz) | Erledigt | `SettingsScreen.test.tsx` (5) + E2E |
| 12 | UI | `MissionSelect.tsx` inkl. `CustomMissionPicker` | Erledigt | `MissionSelect.test.tsx` (7) + E2E |
| 13 | UI | `DevModeScreen.tsx` (Batch + `summarizeBatch`-Anzeige) | Erledigt | `MenuScreens.test.tsx` + E2E |
| 14 | UI | `StatsScreen.tsx` (Game-Summaries-Liste) | Erledigt | `MenuScreens.test.tsx` + E2E |
| 15 | UI | `App.tsx` Zustandsfluss (Menü…Spiel, `?mode=` Deep-Link bleibt) | Erledigt | `App.test.tsx` (6) + E2E |
| 16 | UI | `GanoveScreen`: `options`/`startImmediately`/`onExit`, random-Modus auto, Missionsfilter | Erledigt | `GanoveScreen.test.tsx` + E2E |
| 17 | UI | `DetektivScreen`: `options`/`startImmediately`/`onExit`, detectiveCount aus Optionen, Missionsfilter-Ganovedraw | Erledigt | `DetektivScreen.test.tsx` + E2E |
| 18 | i18n | Neue Keys in `de.json` + `en.json` paritätisch | Erledigt | i18n-Hook + App.test.tsx |
| 19 | Assets | Pollinations-Download versuchen; `src/assets/` + `ASSETS.md` oder Fallback-Doku | Erledigt | `src/assets/ASSETS.md` (3 JPEGs lokal) |
| 20 | Tests | `GameIndex.test.ts` | Erledigt | `GameIndex.test.ts` (8 Tests) |
| 21 | Tests | `SpawnSystem.test.ts` Erweiterung (Missionsfilter) | Erledigt | `SpawnSystem.test.ts` (+4 Tests) |
| 22 | Tests | `MissionLoader.test.ts` Erweiterung (`resolveFixedTargets`) | Erledigt | `MissionLoader.test.ts` (+5 Tests) |
| 23 | Tests | `gameStore.events.test.ts` (eventMode/eventDefaults, Spawn-Filter, Header) | Erledigt | `gameStore.events.test.ts` (6 Tests) |
| 24 | Tests | `gameSetup.test.ts` (Kadenz-Mapping) | Erledigt | `menuFlow.test.ts` (5 Tests) |
| 25 | Tests | `SettingsScreen.test.tsx` | Erledigt | `SettingsScreen.test.tsx` (5 Tests) |
| 26 | Tests | `MissionSelect.test.tsx` | Erledigt | `MissionSelect.test.tsx` (7 Tests) |
| 27 | Tests | `MenuScreens.test.tsx` (MainMenu/MapSelect/ModeSelect/Dev/Stats) | Erledigt | `MenuScreens.test.tsx` (6 Tests) |
| 28 | Tests | `App.test.tsx` an Menüfluss anpassen | Erledigt | `App.test.tsx` (6 Tests) |
| 29 | E2E | `e2e/menu.spec.ts` (alle Pflichtszenarien) | Erledigt | `e2e/menu.spec.ts` (8 Szenarien) |
| 30 | Doku | `docs/help/` erweitern, README, RELEASE_NOTES, changes.log | Erledigt | `docs/help/spieloberflaeche/*`, README, RELEASE_NOTES, changes.log |
