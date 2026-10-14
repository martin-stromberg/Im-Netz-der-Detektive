# Plan-Review — Schritt 11: Menü, Einstellungen, Szenario-Auswahl, Startaufstellung

Prüfung der Implementierung gegen `plan.md` (Abschnitte
Designentscheidungen, Programmabläufe, Komponenten, Tests).

## Planpunkt → Umsetzung

| Planpunkt | Stand | Nachweis |
|---|---|---|
| `GameIndex.ts`: `GameSummary`, `listGameSummaries`, `ResumeEntry`, `listResumeEntries`, `RESUME_STORAGE_KEY` | ✅ umgesetzt | `src/logic/GameIndex.ts` + `GameIndex.test.ts` |
| `SpawnSystem.ganoveSpawnChoicesForMission` + `pickGanoveSpawnForMission` | ✅ umgesetzt | `src/logic/SpawnSystem.ts` (+4 Tests) |
| `MissionLoader.resolveFixedTargets(map, mission)` | ✅ umgesetzt | `src/logic/MissionLoader.ts` (+5 Tests) |
| `StartGameOptions.eventMode`/`eventDefaults`, State-Felder, `resolveEventMode`/`resolveEventDefaults`-Validierung, Header-Config | ✅ umgesetzt | `src/state/gameStore.ts` + `gameStore.events.test.ts` |
| `resolveSpawnPositions`: Ganove-Kandidaten missionsgefiltert (`resolvedMission` respektiert) | ✅ umgesetzt | `src/state/gameStore.ts` — filtert nur bei fehlender expliziter Position; Rekonstruktion via `resolvedMission.targets` |
| `Recorder.startOptionsFromHeader`: `eventMode`/`eventDefaults` | ✅ umgesetzt | `src/logic/Recorder.ts` (+Test-Anpassung) |
| `menuFlow.ts`: `Screen`-Union, `PendingGameConfig`, `MENU_MAP_IDS`, `FORTHCOMING_MAP_IDS`, `cadenceToEventDefaults`, `eventCadenceOf`, `EVENT_CADENCE_MIN/MAX` | ✅ umgesetzt | `src/components/menuFlow.ts` (Union heißt `MenuScreen`, `FORTHCOMING_MAP_IDS` statt `FORTHCOMING_MAPS` — Umbenennung für Klarheit) |
| `MainMenu.tsx`: Neue Partie / Fortsetzen (deaktiviert) / Statistiken | ✅ umgesetzt | `src/components/MainMenu.tsx`; Fortsetzen mit sichtbarem Hinweis |
| `MapSelect.tsx`: Münster + Lübeck aktiv, Hamburg + Köln „in Vorbereitung", `teststadt` unsichtbar | ✅ umgesetzt | `src/components/MapSelect.tsx`; Kartennamen/Taglines aus `MapPack` |
| `ModeSelect.tsx`: Ganove / Detektiv / Dev | ✅ umgesetzt | `src/components/ModeSelect.tsx` |
| `SettingsScreen.tsx`: korridorbegrenzte Felder, Vorschlagswerte, `unbegrenzt` nur bei `roundLimit.unlimited`, Ereignismodus + vereinheitlichte Kadenz | ✅ umgesetzt | `src/components/SettingsScreen.tsx`; `settings.range`-Hinweise |
| `MissionSelect.tsx` + `CustomMissionPicker`: Fall (Name + Mini-Story), Zufall, spielerdefiniert (Kategorie-Picks + `validateCustomTargets`), ohne Mission; kein Fall-Angebot ohne Set | ✅ umgesetzt | `src/components/MissionSelect.tsx`; Kriteriencodes als lesbare Texte |
| `DevModeScreen.tsx`: Kartenwahl, Batch-Größe, Seed, `runAiBatch` + `summarizeBatch`-Tabelle | ✅ umgesetzt | `src/components/DevModeScreen.tsx`; Aufzeichnung via `Recorder` |
| `StatsScreen.tsx`: Aufzeichnungsliste (neueste zuerst), Leerzustand | ✅ umgesetzt | `src/components/StatsScreen.tsx` |
| `App.tsx`: zustandsbasierter Fluss Menü → Karte → Modus → Einstellungen → Mission → Spiel; `?mode=` bleibt Deep-Link | ✅ umgesetzt | `src/App.tsx`; kein Router-Paket |
| `GanoveScreen`: `options`/`startImmediately`/`onExit`, `random`-Modus direkt, gefilterte Pick-Liste | ✅ umgesetzt | Props + `ganoveSpawnChoicesForMission` in `PickSpawnView` |
| `DetektivScreen`: `options`/`startImmediately`/`onExit`, `detectiveCount` aus Optionen, kriterienkonforme Ganove-Auslosung bei Fällen/Custom | ✅ umgesetzt | `pickGanoveSpawnForMission` im `startGame`-Pfad |
| i18n-Parität DE/EN für alle neuen Keys | ✅ umgesetzt | `de.json`/`en.json` je 203 Keys, Hook-geprüft |
| Assets: Pollinations-Download, lokal unter `src/assets/`, Doku | ✅ umgesetzt | `title-noir.jpg`, `map-muenster.jpg`, `map-luebeck.jpg` + `ASSETS.md` (768×768 JPEG, lokal eingebettet, keine Hotlinks) |
| Alle geplanten Testdateien | ✅ umgesetzt | s. `test-results.md`; `menuFlow.test.ts` statt `gameSetup.test.ts` (Kadenz-Helfer liegen in `menuFlow.ts`) |
| `e2e/menu.spec.ts`: Menü, Kartenwahl, beide Spielmodi, Einstellungen (unbegrenzt + ungültig), Custom-Mission, Dev-Batch, Statistik | ✅ umgesetzt | 8 Szenarien, alle grün |

## Abweichungen vom Plan — alle begründet

1. **Kadenz-Helfer in `menuFlow.ts`, Tests in `menuFlow.test.ts`:**
   `cadenceToEventDefaults`/`eventCadenceOf` gehören zum Menüfluss-
   Helper (nicht zu `gameSetup.ts`, das URL-Param-Helfer bleibt);
   Testdatei entsprechend benannt.
2. **„Partie fortsetzen" deaktiviert statt vollständig verbunden:**
   Der Struktur-Vertrag (`ResumeEntry`/`listResumeEntries`/
   `RESUME_STORAGE_KEY`) ist implementiert und getestet; es gibt noch
   keinen Schreiber — das ist plan- und anforderungskonform
   (Persistenz ist Schritt 12). Button ist disabled und zeigt einen
   sichtbaren Hinweis.
3. **„Zurück"-Navigation:** Zusätzlich zum geplanten Fluss führt jede
   Auswahlebene per „Zurück" eine Stufe höher — notwendig, damit die
   Auswahl ohne Neuladen korrigierbar bleibt.
4. **Sabotage-Optionalität im Custom-Picker:** via „Ohne Sabotage"-
   Schaltfläche gelöst (`""`-Sentinel intern, normalisiert zu `null`),
   weil die Kategorie-Picks sequenziell laufen.

## Ergebnis

**Vollständig umgesetzt** — alle Planpunkte implementiert, Abweichungen
dokumentiert und begründet.
