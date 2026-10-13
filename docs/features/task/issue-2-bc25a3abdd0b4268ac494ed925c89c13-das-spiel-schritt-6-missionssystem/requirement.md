# Übersetzte Anforderung: Missionssystem (Entwicklungsschritt 6)

## Fachliche Zusammenfassung

Die Engine erhält das Missionsystem aus `01-spielkonzept.md` §5: Missionen werden in fester Reihenfolge **Diebstahl → Kontakt → Binärwahl (Sabotage oder Flucht)** generiert und gespielt. Die Generierung zieht Zielknoten per Seed-RNG aus den Kategorien-Pools der Karte und verwirft Ziehungen, bis alle per BFS messbaren Kriterien (`missionRules` aus dem Kartenpaket) erfüllt sind. Am Zielknoten führt der Ganove eine Aktionsrunde aus (Betreten ≠ Aktion), die einen exakten Spur-Hinweis erzeugt; nach der Kontakt-Aktion bietet der Informant ein Sabotageziel mit zufällig gezogenem Effekt an, über das der Ganove endgültig entscheidet. Zusätzlich werden benannte vordefinierte „Fälle" als JSON-Missionssets pro Karte ausgeliefert und spielerdefinierte Missionen gegen Kategorien und Kriterien validiert.

## Betroffene Klassen und Komponenten

- **Neu `src/logic/MissionSystem.ts`:** Typen (`MissionTargets`, `MissionStage`, `MissionKind`, `MissionCase`, `MissionSet`), Fehlerklassen (`MissionGenerationError`, `MissionValidationError`), Generierung (`generateMission`), Kriterienprüfung (`missionCriteriaViolations`), Validierung spielerdefinierter Ziele (`validateCustomTargets`), Schema-Validierung für Missionssets (`validateMissionSet`), Laufzeithelfer (`executableMissionAction`, `missionStructure`, `missionTargetIds`, `drawSabotageEffect`, `sabotageDuration`).
- **Neu `src/logic/MissionLoader.ts`:** `loadMissionSet(mapId)`, `listMissionSetIds()`, `getMissionCase(...)` — Muster analog `MapLoader.ts` (`import.meta.glob` über `src/data/missions/*.json`).
- **Neu `src/data/missions/muenster.json`:** mindestens 2 benannte Fälle (`name`, `story`, Zielknoten-IDs), validiert.
- **`src/state/gameStore.ts` (Erweiterung):**
  - `Mission`-Interface: Ziele (`targets`), `stage`, `pendingChoice`, `appliedEffect` (statt bisherigem `targetNodes`/`currentStepIndex`-Hook).
  - `StartGameOptions.mission`: `"auto"` (Default) | `"random"` | `"none"` | `{ type: "case", id }` | `{ type: "custom", targets }`.
  - `startGame`: Mission auflösen nach Spawn, vor Kameraplatzierung; `escapeNodeIds` = nur gezogener Missions-Fluchtknoten; `cameraProtectedNodes` ∪ Missionsziele.
  - `moveGanove`: Flucht nur wenn `mission.stage === "flucht"`; Zug blockiert solange `pendingChoice` offen (`MoveError` `mission_choice_pending`).
  - `ganoveAction`: ausführbare Missionsaktion aus `stage` + Position ableiten, `aktion`-Spur-Event (`visibleTo: "detectives"`) vor Detektivphase, Stufenfortschritt, Sabotageeffekt-Anwendung.
  - Neue Aktion `chooseMissionPath("sabotage" | "flucht")` — endgültige Binärwahl.
  - Neue Zustandsfelder `hintSilenceUntilRound`, `falseTrailUntilRound`; `runEventRoll` unterdrückt/verfälscht Hinweise entsprechend.
  - Umzingelungsprüfung berücksichtigt echte Aktionsverfügbarkeit (`executableMissionAction`).
- **`src/logic/Movement.ts`:** `MoveRejection` um `mission_choice_pending`/`no_mission_choice` erweitern.
- **Tests:** `MissionSystem.test.ts`, `MissionLoader.test.ts`, `gameStore.mission.test.ts`; betroffene bestehende Tests anpassen (`gameStore.rounds.test.ts`, `gameStore.endings.test.ts`).

## Implementierungsansatz

- Reine, deterministische Logikmodule nach vorhandenem Muster (`EreignisEngine`, `CameraSystem`): keine Seiteneffekte, `Rng`-Parameter, kein `Math.random`.
- BFS-Kriterien über `bfsDistances`/`distance` aus `Graph.ts` gegen `settings.missionRules` (`minGap`, `maxGap`, `routeBudget`, `routeBudgetSabotage`, `sabotageDetour`) plus feste Spec-Konstanten (Flucht ≥4 vom Kontakt-, ≥3 vom Diebstahlziel, +3 Aktionsrunden).
- Rejection-Sampling: Ziehung aus Kategorien-Pools per `rng.pick`, Validierung, Verwerfen bis gültig (max. Versuche → `MissionGenerationError`).
- Sabotageeffekt wird erst bei der Kontakt-Aktion gezogen (Spec §5.4 „im selben Schritt"), über eigene RNG-Salt-Ableitung aus `mixSeed`, damit der Ereignisstrom nicht korreliert.
- Informationsasymmetrie: Missionsziele existieren nur im Engine-State; detektivsichtbar ist ausschließlich die Struktur (öffentliche Kategorien) sowie die `aktion`-Spur-Events — der Kontakt-Hinweis enthält keinerlei Wahl-/Effektinformation.
- `funkstille`: `hintSilenceUntilRound` unterdrückt `hinweis`/`sichtbarkeit`-Events für N Runden (N = `eventDefaults.cycle` der Karte); `umwelt` bleibt wirksam.
- `falsche_spur`: `falseTrailUntilRound` ersetzt `hinweis`-Zonen für N Runden durch eine konsistente, aber falsche Zone (gezogener anderer Zonenname + zugehöriger BFS-Ball).
- `kamera_aus`: bestehender `deactivateCameras`-Hook.

## Konfiguration

- `missionRules` und `sabotageEffects` liegen bereits als Map-Einstellungen vor — keine Schemaänderung am Kartenpaket.
- Neues Datenformat: Missionsset-JSON unter `src/data/missions/<mapId>.json` (`mapId`, `cases[]` mit `id`, `name`, `story`, `diebstahl`, `kontakt`, `flucht`, optional `sabotage`, `sabotageEffect`), zur Laufzeit validiert (kein Hook-Schema nötig — der Python-Map-Check deckt nur `src/data/maps/` ab).

## Offene Fragen

Keine — alle Detailfragen sind durch Spec §5/§7, `04-balancing.md` (`missionRules`, `sabotageEffects`) und die Aufgaben-Vorgaben (N = `eventDefaults.cycle`, falsche Spur = falsche Zonen-Hinweise) beantwortet.
