# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| Über viele Seeds erzeugte Missionen erfüllen ausnahmslos alle BFS-Kriterien — automatisiert verifiziert | `generateMission` (Rejection-Sampling) + `missionCriteriaViolations` gegen `missionRules` | `MissionSystem.test.ts`: ≥200 Seeds auf muenster/luebeck/teststadt, jede Ziehung gegen alle Kriterien geprüft | Abgedeckt |
| Feste Reihenfolge Diebstahl → Kontakt → Binärwahl; Ziele erst erreichbar/ausführbar, wenn Mission freigibt | `MissionStage`-Maschine + `executableMissionAction` + `pendingChoice`-Guard + Flucht-Gating auf `stage === "flucht"` | `gameStore.mission.test.ts` (Reihenfolge, blockierte Züge, frühes Fluchtziel ohne Escape) | Abgedeckt |
| Aktionsausführung verbraucht Bewegung, Ganove steht/verwundbar, Spur-Hinweis vor Detektivphase | `ganoveAction` emittiert `aktion`-Event `visibleTo:"detectives"` vor Phasenwechsel; Hitze-Gewicht 2 bereits verankert | `gameStore.mission.test.ts` (verharrt, Event sichtbar, Fang nach Aktionsrunde möglich) | Abgedeckt |
| Sabotage-Angebot direkt nach Kontakt-Aktion; Binärwahl endgültig; drei Effekte nachweisbar; Kontakt-Hinweis leakt Wahl nicht | Effektziehung bei Kontakt-Aktion, `pendingChoice`, `chooseMissionPath` (einmalig, kein Zurück), Effektanwendung `kamera_aus`/`funkstille`/`falsche_spur`, Event ohne Wahl-/Effektdetails | `gameStore.mission.test.ts` (alle drei Effekte, Endgültigkeit, Leak-Test) | Abgedeckt |
| Missionszielknoten garantiert kamerafrei | `cameraProtectedNodes` ∪ `missionTargetIds` in `startGame` | `gameStore.mission.test.ts` (keine Kamera auf Zielen über mehrere Seeds) | Abgedeckt |
| Fälle-Missionssets laden pro Karte, spielbar; spielerdefinierte Missionen validiert | `MissionLoader` + `src/data/missions/muenster.json` (2 Fälle) + `{type:"case"}`/`{type:"custom"}` in `StartGameOptions` | `MissionLoader.test.ts`, `missionData.test.ts` (Kriterien für jeden legalen Spawn), `gameStore.mission.test.ts` | Abgedeckt |
| `escapeNodeIds` nur gezogener Missions-Fluchtknoten | `resolveMission` setzt `[mission.targets.flucht]` | `gameStore.mission.test.ts` + angepasster `rounds`-Test | Abgedeckt |
| Umzingelung mit echter Aktionsverfügbarkeit | `checkGanoveSurrounded` nutzt `executableMissionAction` | `gameStore.mission.test.ts` Umzingelungs-Szenario | Abgedeckt |
| `visibleTo`-Disziplin: Zielknoten nicht detektivsichtbar | Ziele nur in `mission.targets` (Engine-State); öffentlich nur `missionStructure()` ohne IDs; `aktion`-Event als einzige detektivsichtbare Positionsinformation | `gameStore.mission.test.ts` (Leak-Prüfung Event-Inhalte), `MissionSystem.test.ts` (`missionStructure` ohne IDs) | Abgedeckt |

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| Kein UI-Fluss in dieser Anforderung — reine Engine-Logik; kompletter Partienfluss wird headless über `gameStore`-Tests getrieben | `gameStore.mission.test.ts` (startGame → Aktionen → Binärwahl → Flucht/Sieg) | Nicht erforderlich mit Begründung |

## Hinweise

- `teststadt` hat keinen Sabotage-Pool → `sabotage: null`-Pfad ist Pflichttest.
- Lübeck besitzt Starts ohne gültige Mission → `"auto"`-Fallback auf `mission: null` ist bewusste Designentscheidung; explizites `"random"` wirft `MissionGenerationError`.
- Sabotage-Dauer N = `eventDefaults.cycle` der Karte (Münster/teststadt 4, Lübeck 3) — dokumentiert im Plan und später in `business-rules.md`.
