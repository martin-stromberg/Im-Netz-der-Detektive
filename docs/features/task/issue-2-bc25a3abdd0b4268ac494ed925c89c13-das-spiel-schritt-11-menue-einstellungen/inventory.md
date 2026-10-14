# Bestandsaufnahme: Menü, Einstellungen, Szenario-Auswahl, Startaufstellung (Schritt 11)

Analysiert wurde der bestehende Anwendungsrahmen (`App.tsx`,
Spielbildschirme, `gameStore`, Spawn-/Missions-System, `AiSimulation`,
`Recorder`, i18n) bezogen auf die Anforderung „vollständiger
Anwendungsrahmen mit Hauptmenü, Karten-/Modus-/Missions-Auswahl,
kartenbegrenzten Einstellungen und Startaufstellungs-Flow".

## Zusammenfassung

- **Vorhanden:** Voll funktionsfähige Engine (`useGameStore.startGame`
  mit `StartGameOptions`: `detectiveCount`, `detectivePositions`,
  `ganovePosition`, `roundLimit` inkl. `null`/`unlimited`,
  `cameraCount`, `cameraProtectedNodes`, `radioHintCount`,
  `edgeBlockRounds`, `mission`, `resolvedMission`, `resolvedCameras`,
  `gameId`), Map-Loader (`listMapIds`/`loadMap`), Mission-Loader
  (`loadMissionSet`/`listMissionSetIds`/`getMissionCase`/`hasMissionSet`),
  Spawn-System (`detectiveSpawnChoices`/`ganoveSpawnChoices`/
  `pickDetectiveSpawns`/`pickGanoveSpawn`/`spawnSequence`/`assignSpawns`),
  Missions-System inkl. `validateCustomTargets`,
  `missionCriteriaViolations`, `nodesByCategory`, `caseTargets`,
  KI-vs.-KI-Batch (`runAiGame`/`runAiBatch`/`summarizeBatch`),
  Recorder mit `localStorage`-FIFO (`listGameLogs`/`saveGameLog`/
  `exportGameLog`/`parseLog`/`headerFromLog`/`startOptionsFromHeader`).
- **Vorhanden (UI):** `GanoveScreen` und `DetektivScreen` mit
  eigenständigem Idle→Spawn-Pick→Playing-Fluss, `MapGraph`
  (selektierbare Knoten, Kategorien, Zonen, Marker), `MissionPanel`,
  `HeatBadge`; `?mode=`-/`?map=`-/`?seed=`-/`?mission=`-URL-Parameter
  als Dev-/E2E-Einstieg; `window.__gameStore` nur in DEV.
- **Fehlt:** Hauptmenü, Karten-Auswahl mit „in Vorbereitung"-Städten,
  Einstellungs-Formular mit Karten-Bereichen, Missions-Auswahl
  (Fall/Zufall/spielerdefiniert), Dev-Modus-UI, Fortsetzen-/
  Statistik-Einträge (Struktur), `eventMode`/`eventDefaults` als
  `StartGameOptions`, missionsscharfe Ganoven-Spawnfilterung.
- **Karten:** `muenster` (choice-Detektive über Knotenliste,
  free-Ganove minDist 3, roundLimit unlimited erlaubt, eventMode
  tension), `luebeck` (choice-Detektive über Zonen, free-Ganove
  minDist 2, roundLimit [10,30], eventMode cycle), `teststadt`
  (Fixture, nicht für das Menü vorgesehen). Missionsset existiert nur
  für `muenster` (2 Fälle mit Name + Story); `luebeck` besitzt alle
  vier Kategorie-Pools, aber keine Fälle.
- **Test-Ausgangszustand:** `npm test` 445/445 grün (34 Dateien),
  `npm run test:e2e` 12/12 grün — Details in
  [Tests](inventory/tests.md).

## Details

- [UI-Komponenten und Navigation](inventory/ui.md)
- [Logik und State](inventory/logic.md)
- [Daten: Kartenpakete und Missionssets](inventory/data.md)
- [Tests](inventory/tests.md)
