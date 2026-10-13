# Tasks: Menü, Einstellungen, Szenario-Auswahl, Startaufstellung (Schritt 11)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Logik | `src/logic/GameIndex.ts` mit `GameSummary`, `listGameSummaries`, `ResumeEntry`, `listResumeEntries` anlegen | Offen | — |
| 2 | Logik | `SpawnSystem.ganoveSpawnChoicesForMission` + `pickGanoveSpawnForMission` (Kriterienfilter) | Offen | — |
| 3 | Logik | `MissionLoader.resolveFixedTargets(map, mission)` | Offen | — |
| 4 | Logik | `gameStore`: `StartGameOptions.eventMode`/`eventDefaults`, State-Feld, Validierung, Header-Config | Offen | — |
| 5 | Logik | `gameStore.resolveSpawnPositions`: Ganoven-Kandidaten missionsgefiltert | Offen | — |
| 6 | Logik | `Recorder.startOptionsFromHeader`: `eventMode`/`eventDefaults` durchreichen | Offen | — |
| 7 | UI | `menuFlow.ts` (`Screen`, `PendingGameConfig`, `MENU_MAP_IDS`, `FORTHCOMING_MAPS`, `cadenceToEventDefaults`, `eventCadenceOf`) | Offen | — |
| 8 | UI | `MainMenu.tsx` | Offen | — |
| 9 | UI | `MapSelect.tsx` (aktive Karten + „in Vorbereitung") | Offen | — |
| 10 | UI | `ModeSelect.tsx` (Ganove/Detektiv/Dev) | Offen | — |
| 11 | UI | `SettingsScreen.tsx` (Karten-Bereiche, unlimited, eventMode+Kadenz) | Offen | — |
| 12 | UI | `MissionSelect.tsx` inkl. `CustomMissionPicker` | Offen | — |
| 13 | UI | `DevModeScreen.tsx` (Batch + `summarizeBatch`-Anzeige) | Offen | — |
| 14 | UI | `StatsScreen.tsx` (Game-Summaries-Liste) | Offen | — |
| 15 | UI | `App.tsx` Zustandsfluss (Menü…Spiel, `?mode=` Deep-Link bleibt) | Offen | — |
| 16 | UI | `GanoveScreen`: `options`/`startImmediately`/`onExit`, random-Modus auto, Missionsfilter | Offen | — |
| 17 | UI | `DetektivScreen`: `options`/`startImmediately`/`onExit`, detectiveCount aus Optionen, Missionsfilter-Ganovedraw | Offen | — |
| 18 | i18n | Neue Keys in `de.json` + `en.json` paritätisch | Offen | — |
| 19 | Assets | Pollinations-Download versuchen; `src/assets/` + `ASSETS.md` oder Fallback-Doku | Offen | — |
| 20 | Tests | `GameIndex.test.ts` | Offen | — |
| 21 | Tests | `SpawnSystem.test.ts` Erweiterung (Missionsfilter) | Offen | — |
| 22 | Tests | `MissionLoader.test.ts` Erweiterung (`resolveFixedTargets`) | Offen | — |
| 23 | Tests | `gameStore.events.test.ts` (eventMode/eventDefaults, Spawn-Filter, Header) | Offen | — |
| 24 | Tests | `gameSetup.test.ts` (Kadenz-Mapping) | Offen | — |
| 25 | Tests | `SettingsScreen.test.tsx` | Offen | — |
| 26 | Tests | `MissionSelect.test.tsx` | Offen | — |
| 27 | Tests | `MenuScreens.test.tsx` (MainMenu/MapSelect/ModeSelect/Dev/Stats) | Offen | — |
| 28 | Tests | `App.test.tsx` an Menüfluss anpassen | Offen | — |
| 29 | E2E | `e2e/menu.spec.ts` (alle Pflichtszenarien) | Offen | — |
| 30 | Doku | `docs/help/` erweitern, README, RELEASE_NOTES, changes.log | Offen | — |
