# Umsetzungsplan: Missionssystem (Schritt 6)

## Übersicht

Neues Modul `MissionSystem.ts` (Generierung mit BFS-Kriterien + Rejection-Sampling, Laufzeit-Stufenlogik, Fälle-Schema/Validierung), `MissionLoader.ts` (lädt `src/data/missions/*.json` analog `MapLoader`), Fall-Datei `muenster.json` mit 2 benannten Fällen, und die Verdrahtung in `gameStore.ts` (Missionsauflösung in `startGame`, Aktionsrunde mit Spur-Event, Binärwahl, Sabotageeffekte, missionsgebundene Flucht, Umzingelung mit echter Aktionsverfügbarkeit). Keine UI-Änderungen — die Engine bleibt headless.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| `StartGameOptions.mission` | Union `"auto"` (Default) \| `"random"` \| `"none"` \| `{type:"case",id}` \| `{type:"custom",targets}` | „auto" generiert, wenn die Kategorien-Pools und der Spawn es hergeben, sonst missionslos — nötig, weil auf `luebeck` nicht für jeden Start eine gültige Route existiert und Test-Fixture-Maps ganz ohne Pools auskommen müssen. Explizites `"random"` wirft stattdessen `MissionGenerationError`. |
| Sabotageziel-Ziehzeitpunkt | Beim Generieren mitvalidiert (Umweg-Kriterium braucht das Ziel); beim Kontakt nur *angeboten* | Das Umweg-Kriterium (`sabotageDetour`) ist eine Generierungsregel und die Kamerafreiheit gilt für alle Missionsziele — das Sabotageziel muss also schon bei `startGame` feststehen. |
| Sabotageeffekt-Ziehzeitpunkt | Bei der Kontakt-Aktion (nicht beim Generieren) | Spec §5.4: „bietet der Informant im selben Schritt … mit zufällig gezogenem Effekt" — die Ziehung gehört zum Angebot. |
| RNG für Missionslaufzeit-Ziehungen | `createRng(mixSeed(seed, round) ^ MISSION_RNG_SALT)` mit Konstante `0x5AB0TA6E`-musterhaft `0x5ab07a6e` | Entkoppelt Effektziehung/Falsche-Spur-Ziehung vom Ereignisstrom gleicher Runde, bleibt deterministisch und serialisierungsfrei. |
| Sabotage-Dauer N (`funkstille`, `falsche_spur`) | `map.settings.eventDefaults.cycle` | Kartenskalierter Wert: genau ein Ereigniszyklus Stille/Falschspur (Münster/teststadt 4, Lübeck 3) — dokumentiert in business-rules. |
| `falsche_spur` Verhalten | Während Fenster werden `hinweis`-Events durch eine **andere, konsistente** Zone ersetzt: RNG wählt falsche Zone ≠ wahre Zone + einen Knoten darin, `zoneHint` um diesen Knoten liefert den passenden `nodeIds`-Ball | Testbar („Zone ≠ wahre Zone", `nodeIds` plausibel) und glaubwürdig — der Hinweis bleibt formal ein Zonen-Hinweis. `sichtbarkeit` und `umwelt` werden nicht verfälscht. |
| `funkstille` Verhalten | Während Fenster werden `hinweis`- und `sichtbarkeit`-Events unterdrückt (Trigger würfelt weiter, Spannung resettet normal); `umwelt` bleibt wirksam | „keine hinweisgebenden Ereignisse" — Weltzustandsänderungen sind keine Hinweise und für beide Seiten sichtbar. |
| Effekt-Fenster | `untilRound = actionRound + N` (wirkt ab der Folgerunde) | Die Aktionsrunde selbst ist verbraucht; N volle Folgerunden Wirkung. |
| `ganoveCanAct`-Hook | Feld bleibt als Test-Hook; effektive Verfügbarkeit = `ganoveCanAct \|\| executableMissionAction(...) !== null` | Abwärtskompatibel zu Schritt-4/5-Tests; Missionslogik erzwingt die Freigabe strukturell. |
| `escapeNodeIds` + Flucht-Gating | `escapeNodeIds = [mission.targets.flucht]`; `escaped` nur wenn `mission === null \|\| mission.stage === "flucht"` | Missionsgebundene Flucht; ein frühes Betreten des Fluchtknotens ist ein normaler Zug. Ohne Mission (Legacy/Test-Modus) bleiben alle `flucht`-Knoten Endziele. |
| Binärwahl-Mechanik | `pendingChoice` im `mission`-State; `moveGanove`/`ganoveAction` werfen `MoveError("mission_choice_pending")` bis `chooseMissionPath` auflöst | „kein Zurück" und erzwungener Entscheidungspunkt — strukturell statt konventionell. |
| Leerer Sabotage-Pool | `targets.sabotage = null`; Kontakt-Aktion geht direkt in `stage "flucht"` (kein `pendingChoice`) | `teststadt` hat keine `sabotage`-Knoten; dort muss eine Mission trotzdem spielbar sein. |
| Sichtbarkeit | `mission.targets` liegt nur im Engine-State; Detektiv-sichtbar sind ausschließlich `aktion`-Spur-Events und die öffentliche Struktur (`missionStructure()` ohne Knoten-IDs) | §1-Asymmetrie: Detektive kennen Struktur/Pools, nie die gezogenen Zielknoten. |

## Programmabläufe

### Missionsauflösung in `startGame`

1. `resolveSpawnPositions` wie bisher (RNG-Strom-Reihenfolge unverändert: erst Spawns).
2. `resolveMission` (neu, intern): je nach `options.mission` (`"auto"` Default) —
   - Pools `diebstahl`/`kontakt`/`flucht` vorhanden → `generateMission(map, graph, ganovePosition, rng)`; `"auto"` fängt `MissionGenerationError`/leere Pools → `mission: null`; `"random"` wirft.
   - `{type:"case"}` → `getMissionCase(loadMissionSet(map.id), id)` → `MissionTargets` aus dem Fall → `missionCriteriaViolations` mit echtem Start prüfen → Verletzung = `GameConfigError`.
   - `{type:"custom"}` → `validateCustomTargets` (Kategorien + Kriterien mit Start) → Verletzung = `GameConfigError` mit Liste.
   - `"none"` → `mission: null`.
3. `escapeNodeIds = mission ? [mission.targets.flucht] : mapEscapeNodeIds(map)`.
4. `protectedNodes = options.cameraProtectedNodes ∪ missionTargetIds(mission.targets)` → `placeCameras` (RNG-Strom danach).
5. `set` mit `mission` (`stage: "diebstahl"`, `pendingChoice: null`, `appliedEffect: null`), Header-Log mit `mission.id`/`stage` (Ziele intern, wie Ganovenstart auch).

Beteiligte Klassen: `gameStore`, `MissionSystem`, `MissionLoader`, `CameraSystem`.

### Aktionsrunde (`ganoveAction`)

1. `requireRunningGame("ganove")`; `pendingChoice`-Guard (`mission_choice_pending`).
2. `action = executableMissionAction(mission, ganovePosition)`; wenn `!action && !ganoveCanAct` → `no_action_available`.
3. Bei `action`: `aktion`-Event `{round, nodeId, visibleTo:"detectives", details:{action}}` emittieren + Log; Stufenfortschritt —
   - `diebstahl` → `stage: "kontakt"`
   - `kontakt` → bei `targets.sabotage === null` direkt `stage: "flucht"`; sonst Effekt via Mission-RNG ziehen, `stage: "wahl"`, `pendingChoice = {sabotageNode, effect}`
   - `sabotage` → Effekt anwenden (`kamera_aus` → `deactivateCameras`; `funkstille` → `hintSilenceUntilRound`; `falsche_spur` → `falseTrailUntilRound`), `appliedEffect` setzen, `stage: "flucht"`
4. `runEventRoll()` (beachtet Stille-/Falschspur-Fenster), Phase → `detektive`.

Beteiligte Klassen: `gameStore`, `MissionSystem`, `InformationSystem`, `EreignisEngine`.

### Binärwahl (`chooseMissionPath`)

1. `requireRunningGame()`; `mission?.pendingChoice` muss gesetzt sein, sonst `MoveError("no_mission_choice")`.
2. `"sabotage"` → `stage: "sabotage"`; `"flucht"` → `stage: "flucht"`; `pendingChoice = null`; Log-Eintrag `mission_choice`.
3. Wahl endgültig: nach `"flucht"` ist das Sabotageziel nicht mehr ausführbar (Stufe nie rückwärts).

### Flucht (`moveGanove`)

Zusätzlich zur bestehenden Validierung: `pendingChoice`-Guard; `escaped` nur wenn Ziel in `escapeNodeIds` **und** `mission === null || mission.stage === "flucht"`.

### Umzingelung

`checkGanoveSurrounded` feuert nur wenn `legalGanoveMoves === 0 && !ganoveCanAct && executableMissionAction(...) === null`.

### Ereignisse unter Sabotage (`runEventRoll`)

- `round <= hintSilenceUntilRound`: gezogene `hinweis`/`sichtbarkeit` werden nicht emittiert (`umwelt` normal).
- `round <= falseTrailUntilRound`: `hinweis` wird mit falscher Zone emittiert (Mission-RNG: andere Zone + Knoten darin → `zoneHint` darum).

## Neue Klassen

| Klasse | Typ | Zweck |
|--------|-----|-------|
| `MissionSystem.ts` | Modul | Generierung, Kriterien, Fälle-Schema, Laufzeithelfer |
| `MissionKind` | Type (`"diebstahl"\|"kontakt"\|"sabotage"\|"flucht"`) | Aktions-/Stufenart |
| `MissionTargets` | Interface | `{diebstahl, kontakt, flucht, sabotage: string\|null}` |
| `MissionStage` | Type | `"diebstahl"\|"kontakt"\|"wahl"\|"sabotage"\|"flucht"` |
| `MissionCase` / `MissionSet` | Interfaces | Fälle-JSON-Schema |
| `MissionGenerationError` / `MissionValidationError` | Klassen | Generierungsversagen / Schema- & Kriterienfehler (`errors[]`-Muster) |
| `generateMission` | Funktion | Rejection-Sampling bis alle Kriterien erfüllt |
| `missionCriteriaViolations` | Funktion | Liefert Liste verletzter Kriterien-Codes |
| `validateCustomTargets` | Funktion | Kategorie- + Kriterienprüfung spielerdefinierter Ziele |
| `validateMissionSet` | Funktion | Schema-Validierung (`mapId`, `cases`, IDs, Kategorien) |
| `executableMissionAction` | Funktion | Welche Aktion ist an Position/Stufe ausführbar |
| `missionStructure` | Funktion | Öffentliche Stufenliste ohne Knoten-IDs |
| `missionTargetIds` | Funktion | Ziel-IDs (Kameraschutz) |
| `drawSabotageEffect` / `sabotageDuration` | Funktionen | Effektziehung aus Karten-Pool / N aus `eventDefaults.cycle` |
| `MissionLoader.ts` | Modul | `loadMissionSet`, `listMissionSetIds`, `getMissionCase` |
| `src/data/missions/muenster.json` | Daten | ≥2 benannte Fälle |

## Änderungen an bestehenden Klassen

### `gameStore.ts` (Zustand/Actions)

- **`Mission`-Interface** ersetzt: `{id, name?, story?, targets: MissionTargets, stage: MissionStage, pendingChoice: {sabotageNode, effect}|null, appliedEffect: SabotageEffect|null}`.
- **Neue Felder:** `hintSilenceUntilRound: number`, `falseTrailUntilRound: number`.
- **`StartGameOptions`:** `mission?: MissionOption` (Union oben).
- **`startGame`:** `resolveMission` zwischen Spawn und Kameras; `escapeNodeIds` missionsgebunden; `cameraProtectedNodes` ∪ Ziele.
- **`moveGanove`:** `pendingChoice`-Guard, Flucht-Gating auf `stage === "flucht"`.
- **`ganoveAction`:** Missionsaktion + Spur-Event + Stufenfortschritt + Effektanwendung.
- **Neu `chooseMissionPath(choice)`**; neu `getMissionAction()` (Seletor der aktuell ausführbaren Aktion).
- **`checkGanoveSurrounded`:** `executableMissionAction` einbeziehen.
- **`runEventRoll`/`emitRoundEvent`:** Stille-/Falschspur-Fenster.
- **`initialData`/`GameData`/`GameState`:** neue Felder/Actions ergänzen.

### `Movement.ts`

- `MoveRejection` um `"mission_choice_pending"` und `"no_mission_choice"` erweitern.

## Validierungsregeln

| Feld / Objekt | Regel | Fehlerfall |
|---------------|-------|------------|
| `MissionSet` JSON | `mapId` = Karten-ID; `cases` non-empty; je Fall `id`/`name`/`story` non-empty; `diebstahl`/`kontakt`/`flucht` bekannte IDs mit passender Kategorie; `sabotage` optional bekannt+sabotage-Kategorie; `sabotageEffect` optional ∈ `settings.sabotageEffects`; Fall-IDs eindeutig | `MissionValidationError.errors[]` |
| `custom.targets` | bekannte IDs + Kategorie je Ziel + alle BFS-Kriterien (mit Start) | `GameConfigError` mit Verletzungsliste |
| Fall-Ziele beim Spielstart | `missionCriteriaViolations` mit echtem Start leer | `GameConfigError` |
| `options.mission` | Form der Union | `GameConfigError` bei unbekannter Form |

## Seiteneffekte und Risiken

- **RNG-Strom:** Missionsziehung nach Spawn, vor Kameras → Kamerapositionen verschieben sich gegenüber Schritt 5 bei gleichem Seed (Determinismus bleibt). Auf Maps ohne Missionspools (`tinyMap`, `lineMap`) bleibt der Strom identisch.
- **`escaped`-Verhalten:** Auf teststadt (mit Mission) endet ein Zug auf `b`/`g` nicht mehr automatisch — betroffene Tests werden angepasst.
- **`escapeNodeIds`:** Semantik ändert sich (missionsgebunden); `setEscapeNodeIds`-Hook bleibt für Tests erhalten.
- **Lübeck:** Manche Starts haben keine gültige Mission → `"auto"` erzeugt `mission: null` (freies Spiel, alle `flucht`-Knoten aktiv) — dokumentiert.
- **`pendingChoice`-Deadlock:** Wahl blockiert Ganovenzüge, nicht Detektivzüge — kein Hänger möglich, da `chooseMissionPath` phasenunabhängig aufrufbar ist.

## Umsetzungsreihenfolge

1. **`src/logic/MissionSystem.ts`** — Typen, Fehler, Kriterien, Generierung, Custom-/Set-Validierung, Laufzeithelfer.
   - Voraussetzungen: `Graph.ts`, `mapPack.ts`, `rng.ts` (vorhanden).
2. **`src/logic/MissionLoader.ts` + `src/data/missions/muenster.json`** — Loader + 2 Fälle (für alle legalen Ganovenspawns gültig).
   - Voraussetzungen: Schritt 1.
3. **`src/logic/Movement.ts`** — `MoveRejection`-Erweiterung.
   - Voraussetzungen: keine.
4. **`src/state/gameStore.ts`** — `Mission`-Interface, `MissionOption`, `resolveMission`, Aktions-/Wahl-/Effekt-Logik, Stille-/Falschspur-Fenster, Umzingelung.
   - Voraussetzungen: Schritte 1–3.
5. **Neue Tests** — `MissionSystem.test.ts`, `MissionLoader.test.ts`, `missionData.test.ts`, `gameStore.mission.test.ts`.
   - Voraussetzungen: Schritte 1–4.
6. **Bestehende Tests anpassen** — `gameStore.rounds.test.ts`, `gameStore.endings.test.ts`.
   - Voraussetzungen: Schritt 4.

## Tests

### Neue Tests

| Test / Hilfsmethode | Testklasse | Was wird geprüft / bereitgestellt? |
|--------------------|------------|-------------------------------------|
| `missionCriteriaViolations` | `MissionSystem.test.ts` | jede Regel einzeln auslösbar (minGap, maxGap, routeBudget, routeBudgetSabotage, flucht-Abstände, detour), gültiges Target-Set → `[]` |
| `generateMission` | `MissionSystem.test.ts` | **≥200 Seeds auf muenster + luebeck + teststadt: jede erzeugte Mission erfüllt alle Kriterien**; gleicher Seed → gleiche Mission; Pools leer/unmöglich → `MissionGenerationError` (bei `"random"`-Semantik); teststadt → `sabotage: null` |
| `validateCustomTargets` | `MissionSystem.test.ts` | falsche Kategorie/unbekannte ID/Kriterienverletzung → Fehlerliste; gültig → `[]` |
| `executableMissionAction`, `missionStructure`, `missionTargetIds` | `MissionSystem.test.ts` | Stufenmatrix, Struktur ohne Knoten-IDs, Ziel-ID-Liste |
| `validateMissionSet`, `loadMissionSet`, `getMissionCase` | `MissionLoader.test.ts` | Schemafehler (fehlende Felder, unbekannte IDs, falsche Kategorien, doppelte Fall-ID), Laden, unbekannte mapId/Fall-ID |
| Datenintegrität Münster-Fälle | `missionData.test.ts` | ≥2 Fälle; jeder Fall: Kategorien korrekt, **alle BFS-Kriterien für jeden legalen Ganovenspawn** |
| `startGame` mit Mission | `gameStore.mission.test.ts` | `mission` gesetzt (stage `diebstahl`), `escapeNodeIds` = nur Missions-Flucht, keine Kamera auf Missionszielen, `mission:"none"`/`"case"`/`"custom"`-Pfade |
| Aktionsrunde | `gameStore.mission.test.ts` | `ganoveAction` am falschen Knoten → `no_action_available`; am Ziel → verharrt, verwundbar, `aktion`-Event `visibleTo:"detectives"` vor Detektivphase, Hitze +2 |
| Reihenfolge + Binärwahl | `gameStore.mission.test.ts` | kontakt vor diebstahl nicht ausführbar; nach kontakt `pendingChoice`; Züge blockiert (`mission_choice_pending`); `chooseMissionPath` endgültig; Kontakt-Event leakt Wahl nicht |
| Sabotageeffekte | `gameStore.mission.test.ts` | `kamera_aus` → Kameras inaktiv; `funkstille` → N Runden keine `hinweis`/`sichtbarkeit`, `umwelt` weiter; `falsche_spur` → `hinweis` mit falscher Zone |
| Flucht | `gameStore.mission.test.ts` | frühes Betreten des Fluchtknotens ≠ `escaped`; nach Stufe `flucht` → `escaped` |
| Umzingelung | `gameStore.mission.test.ts` | Ganove ohne Zug, aber auf aktuellem Zielknoten → kein `surrounded` |

### Betroffene bestehende Tests

| Test / Testklasse | Grund der Anpassung |
|-------------------|---------------------|
| `gameStore.rounds.test.ts` „initialises … escapeNodeIds" (`["b","d","g"]`) | teststadt bekommt Auto-Mission → `escapeNodeIds` = gezogener Fluchtknoten (`"d"`, einzig gültige Ziehung) oder `mission:"none"` |
| `gameStore.endings.test.ts` „escaped"-Fälle | missionsgebundene Flucht: `mission:"none"` für Legacy-Verhalten bzw. Durchspielen der Mission |
| `gameStore.test.ts` Initial-State | neue Felder `hintSilenceUntilRound`, `falseTrailUntilRound` |

### E2E-Tests (primärer Funktionsnachweis)

Keine — die Anforderung ist ein reines Engine-/Logik-Feature ohne UI-Fluss: Der gesamte Benutzerfluss (Generieren → Aktionsrunde → Binärwahl → Sabotage → Flucht) läuft im headless `gameStore` und wird durch `gameStore.mission.test.ts` auf Store-Ebene end-to-end getrieben (Start bis Sieg). Es existiert noch keine UI-Schicht für Spielzüge; die UI-Erschließung ist späteren Schritten vorbehalten.

## Offene Punkte

Keine.
