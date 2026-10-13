# Abnahmeprüfung – Entwicklungsschritt 6

**Prüfgegenstand:** Branch
`task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-6-missionssystem`
gegen `project-plan.md` §Schritt 6, `01-spielkonzept.md` §1 und §5 sowie
`04-balancing.md` (Missions-Regeln, Sabotage-Umweg, Kamera-Ausschluss).

## Ergebnis

**Status:** Abweichungen gefunden

## Abweichungen

- [ ] **`sabotageEffect` in `MissionCase` wird validiert, aber nie
  angewendet.** `validateMissionSet` (`src/logic/MissionSystem.ts:363-378`)
  prüft das optionale Feld gegen `SABOTAGE_EFFECTS` und den Karten-Pool,
  doch `caseTargets` (`MissionSystem.ts:388-395`) verwirft es und
  `resolveMission`/`newMissionState` (`src/state/gameStore.ts:447-463,
  499-515`) übernehmen es nicht in den Missionszustand — `advanceMission`
  (`gameStore.ts:805-824`) zieht den Effekt beim Kontakt stets neu via
  `drawSabotageEffect`. Die mitgelieferte Doku behauptet das Gegenteil:
  „ein Fall mit fixiertem `sabotageEffect` wird beim Kontakt verwendet"
  (`docs/help/spiel-engine/business-rules.md`, Abschnitt
  „Sabotage-Effekte"). Auswirkung: gering — kein ausgelieferter Fall setzt
  das Feld; Spezifikation (§5.4: Effekt wird zufällig gezogen) ist
  erfüllt, aber Schema-Feld und Doku erzeugen falsche Erwartungen.

## Hinweise

**Verifikationsläufe (selbst ausgeführt, Arbeitsbaum sauber):**

- `npm test` — 20 Dateien, 272 Tests, alle grün.
- `npm run coverage` — Statements 94,08 %, Lines 93,73 %, Branches
  88,44 %, Functions 99,5 % (≥ 70 % weit übertroffen; `MissionSystem.ts`
  96,55 % Lines, `MissionLoader.ts` 100 %, `gameStore.ts` 96,5 %).
- `npm run build` — erfolgreich (`tsc --noEmit` + `vite build`).
- `npm run lint` — ohne Befund. `npm run typecheck` — ohne Befund.

**Prüfnachweise je Akzeptanzkriterium:**

1. **Generierungskriterien:** `missionCriteriaViolations`
   (`src/logic/MissionSystem.ts:128-192`) prüft alle Kriterien per
   `bfsDistances` auf dem echten Graphen: Paardistanz aller Ziele ≥
   `minGap`, Folge-Legs (d→k, k→f, k→s, s→f) ≤ `maxGap` (untere Schranke
   via Paarregel), Routenbudget `Start→d→k→f` + `ACTION_ROUNDS` (3) ≤
   `routeBudget` bzw. mit Sabotage ≤ `routeBudgetSabotage`, Flucht ≥ 4 vom
   Kontakt / ≥ 3 vom Diebstahl (`FLUCHT_MIN_*`, `:72-74`), Sabotage-Umweg
   ≤ `sabotageDetour` (`:177-184`). `generateMission` (`:201-243`)
   verwirft Verletzungen per Rejection-Sampling bis
   `GENERATION_MAX_ATTEMPTS`, dann `MissionGenerationError`. Tests auf
   echten Karten: 200 Seeds × 5 Starts Münster, 60 Seeds × 2 Starts
   Lübeck (inkl. „kein konformer Start"-Fall), Teststadt-Determinismus
   (`MissionSystem.test.ts:146-207`). Münster-`missionRules` = 3/8/18/22/4
   — exakt die Balancing-Werte (`muenster.json:1165-1170`,
   `04-balancing.md` Zeile „Missions-Regeln").
2. **Feste Reihenfolge:** `executableMissionAction`
   (`MissionSystem.ts:403-422`) gibt nur die Aktion der aktiven Stufe am
   aktiven Zielknoten frei — Kontakt vor Diebstahl ist nicht ausführbar
   (`gameStore.mission.test.ts:282-292`); die Binärwahl existiert nur mit
   gesetztem `pendingChoice` (`chooseMissionPath`, `gameStore.ts:1086-1102`,
   Zweitwahl → `no_mission_choice`); die Wahl ist endgültig (Sabotageknoten
   nach „flucht"-Wahl tot, `gameStore.mission.test.ts:413-430`).
3. **Aktionsrunde:** `ganoveAction` (`gameStore.ts:1042-1079`) bewegt
   nicht, wechselt in die Detektivphase und bleibt fangbar (Test fängt
   den Ganove direkt nach der Aktion, `gameStore.mission.test.ts:294-319`);
   das `aktion`-Spur-Event mit exaktem `nodeId` und
   `visibleTo: "detectives"` wird vor den Detektivzügen emittiert und
   geht mit Gewicht +2 in die Hitze ein (`HEAT_WEIGHTS.aktion`,
   `InformationSystem.ts:82`).
4. **Sabotage:** Angebot entsteht im selben Schritt wie die
   Kontakt-Aktion (`advanceMission`, `gameStore.ts:805-824`; Effektzug
   über gesalzenen `missionRng` — deterministisch). Effekte testbelegt:
   `kamera_aus` → `deactivateAll`, keine Kameratreffer mehr bis Partieende
   (`gameStore.mission.test.ts:449-465`); `funkstille` →
   `hintSilenceUntilRound` unterdrückt `sichtbarkeit`/`hinweis` für
   `sabotageDuration` (= `eventDefaults.cycle`) Runden, `umwelt` läuft
   weiter (`:467-483`); `falsche_spur` → garantiert falsche Zone mit
   konsistentem Köder-Ball, danach kehrt die wahre Zone zurück
   (`:485-510`). Das Kontakt-Spur-Event trägt nur `{action: "kontakt"}`
   und bleibt nach der Wahl unverändert (`:397-411`). Ganovenseitig sind
   `pendingChoice.sabotageNode`, `pendingChoice.effect` und
   `targets.flucht` im State vorhanden — die für die Wahl nötigen
   Informationen (UI folgt in Schritt 9).
5. **Kamerafreie Zielknoten:** `startGame` vereinigt
   `cameraProtectedNodes` mit `missionTargetIds` vor `placeCameras`
   (`gameStore.ts:879-891`) — gilt für generierte, Fall- und
   Custom-Missionen gleichermaßen; testbelegt über 25 Seeds auf Münster
   (`gameStore.mission.test.ts:171-183`).
6. **Fälle/Custom:** `muenster.json` liefert zwei benannte Fälle mit
   Mini-Story (`diebstahlserie-altstadt`, `kurier-am-hafen`);
   `MissionLoader` lädt per `import.meta.glob`-Registry synchron;
   `missionData.test.ts:32-44` verifiziert jeden Fall gegen alle Kriterien
   für **jeden** Knoten als Start — eigene unabhängige BFS-Nachrechnung
   (Python, echter Graph) bestätigt: beide Fälle ohne Verletzung für alle
   50 Starts (direkt 8–9 Kanten, via Sabotage 10–11). Fall-Start ist
   spielbar (`gameStore.mission.test.ts:229-244`); voller Missions-
   Durchlauf bis `escaped` auf Teststadt (`:333-370`).
   `validateCustomTargets` (`MissionSystem.ts:250-290`) prüft Existenz,
   Kategorie, Eindeutigkeit und alle Kriterien; Store-Test belegt
   Annahme/Ablehnung (`gameStore.mission.test.ts:254-276`).
7. **Asymmetrie:** `getMissionStructure` liefert nur `{kind, status}` —
   für jede Stufe frei von Zielknoten-IDs getestet
   (`MissionSystem.test.ts:396-403`); während `wahl` wird bewusst kein
   Schritt „aktuell" markiert (`:452-464`). Spur-Events enthalten nur den
   Tatort der bereits ausgeführten Aktion — keine zukünftigen Ziele.
8. **Missionsgebundene Flucht / Umzingelung:** `escapeNodeIds` enthält
   mit Mission nur den gezogenen Fluchtknoten und die Flucht zählt
   ausschließlich in `stage "flucht"` (`gameStore.ts:903, 981-987`;
   frühes Betreten ohne `escaped` testbelegt, `:321-331`). Ohne Mission
   bleiben alle `flucht`-Knoten Fluchtpunkte (altes Verhalten per
   `mission: "none"` abgesichert, `gameStore.rounds.test.ts`). Die
   Umzingelungsprüfung zählt eine ausführbare Missionsaktion als legalen
   Zug (`canGanoveAct` in `checkGanoveSurrounded`, `gameStore.ts:559-582`;
   Test `:516-531` — umzingelter Ganove auf dem Zielknoten gilt nicht als
   gefangen, nach Stufenwechsel schon).
9. **Scope:** Der src-Diff betrifft nur `MissionSystem.ts`,
   `MissionLoader.ts`, `Movement.ts` (zwei neue `MoveRejection`-Codes) und
   `gameStore.ts` plus Daten — kein UI, kein JSONL-Export, kein
   `localStorage`/Blob (Schritt 7 nicht vorweggenommen).

**Einschränkungen/Anmerkungen (keine Abweichungen):**

- `getMissionStructure` markiert nach getroffener Wahl den gewählten
  Zweig als „aktuell" — detektivsichtbar ist damit die *getroffene*
  Binärwahl, sobald sie fällt (nicht schon das Angebot). Das wörtliche
  Kriterium (Kontakt-*Hinweis* leakt nicht) ist erfüllt; ob die
  Strukturansicht den Fortschritt der gewählten Route offenlegen soll,
  ist eine Interpretationsfrage zu „Missionsstruktur" (§1) — ggf. in
  Schritt 9/10 klären.
- `chooseMissionPath` ist phasenunabhängig aufrufbar (`requireRunningGame`
  ohne Phase). Die Wahl muss vor dem nächsten Ganovenzug/-aktion
  beantwortet werden (`mission_choice_pending`-Guard) — die
  Spezifikation verlangt nur „keine Extra-Runde", die Blockade sichert
  das regelkonform ab.
- Der interne `log`-Eintrag `sabotage_offer` sowie der `header` enthalten
  Zielknoten/Effekt — das Log ist die omnisziente Aufzeichnung (Basis
  für Schritt 7), nicht die Detektivsicht; `visibleTo`-Filterung ist
  dort eingeplant.
- Die Untergrenze „Folgeziele ≥ 3" ist über die paarweise `minGap`-Regel
  abgedeckt; auf Lübeck ist `minGap = 2` deklariert — dort sind
  Folgedistanzen von 2 Kanten regelkonform möglich. Die Spezifikation
  überlässt die Korridore den Kartenpaketen („fest je Map",
  `04-balancing.md`) — konsistente Parametrisierung, auf Münster gelten
  die Sollwerte.
- `endGanovePhase` erzwingt weder Zug noch Wahl (Zugzwang bleibt
  Aufrufersache) — bestehendes Engine-Merkmal, kein Schritt-6-Befund.
