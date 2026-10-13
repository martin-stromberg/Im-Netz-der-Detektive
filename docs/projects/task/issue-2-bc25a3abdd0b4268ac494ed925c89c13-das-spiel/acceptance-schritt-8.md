# Abnahmeprüfung – Entwicklungsschritt 8

**Prüfgegenstand:** Branch
`task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-8-deduktion-ki`
(HEAD `572225c`) gegen `project-plan.md` §Schritt 8 sowie
`01-spielkonzept.md` §6 und `02-technisches-konzept.md` §5/§7. Geprüft:
`src/logic/Deduction.ts`, `DetectiveAI.ts`, `GanoveAI.ts`,
`AiSimulation.ts`, `scripts/sim.ts`, `vite.sim.config.ts`, zugehörige
Tests und Doku; Diff gegen Basis-Branch: 24 Dateien, nur Engine/Skript/
Tests/Doku — keine UI-Berührung.

## Ergebnis

**Status:** Abweichungen gefunden

## Abweichungen

- [ ] **Dokumentierte API existiert nicht (Doku driftet vom Code ab).**
  `docs/help/spiel-engine/api.md` listet unter `DetectiveAI.ts` den
  Export `MOVE_TARGET_EPSILON` (api.md:351) und unter `AiSimulation.ts`
  den Typ `SimMetrics` mit den Feldern `{rounds, hintsTotal,
  camerasTriggered, sabotageOffered, sabotageChosen, radioUsed}`
  (api.md:394). Beide existieren nicht: `DetectiveAI.ts` exportiert
  keine Epsilon-Konstante, und `AiSimulation.ts` exportiert
  `SimGameResult` (Felder u. a. `sabotageOffers`, `sabotageAccepted`,
  AiSimulation.ts:53-63) sowie `BatchSummary` (:66-77). Schweregrad:
  gering — rein dokumentarisch, funktional ohne Auswirkung; die
  beschriebenen Konzepte selbst sind korrekt, nur die Bezeichner
  stimmen nicht.

## Hinweise

**Verifikationsläufe (selbst ausgeführt, Arbeitsbaum sauber):**

- `npm test` — 27 Dateien, 380 Tests, alle grün.
- `npm run coverage` — Statements 94,44 %, Lines 94,11 %, Branches
  86,29 %, Functions 100 % (≥ 70 % weit übertroffen; neue Module:
  Deduction 98,5 %, DetectiveAI 100 %, GanoveAI 92,9 %,
  AiSimulation 93,1 % Statements).
- `npm run build` — erfolgreich (`tsc --noEmit` + `vite build`).
- `npm run lint` — ohne Befund. `npm run typecheck` — ohne Befund.
- `npm run sim -- --games 5` — erfolgreich; zusätzlich eigene Serien:
  muenster Seeds 1-40 (`--detectives 3`), luebeck Seeds 1-30
  (`auto`/`none`), teststadt Seeds 1-30 (`--mission random`,
  `--detectives 2`), jeweils reguläre Endbedingungen und Summary auf
  stdout; `--out` schreibt je Partie eine vollständige JSONL-Datei
  (header…result, stichprobenartig geparst und inspiziert).

**Prüfnachweise je Akzeptanzkriterium:**

1. **Deduktion exakt korrekt und monoton.** `deducePossiblePositions`
   (Deduction.ts:124-212) ist ein Forward-Filter über Runden: `S(0)` =
   Spawn-Prior aus `ganoveSpawnChoices` (:139); jede Runde expandiert
   um genau eine Kante (Verharren nur bei `aktion`, :146-151),
   `umwelt`-Sperren greifen ab Folgerunde (`block.round < round`,
   :156-158), Belegungsfilter für den Zugzeitpunkt und das Rundenende
   (:159-168, :199-204). Das ist äquivalent zur geforderten
   Pfadinduktion über Positionshistorien — eine Position zählt nur,
   wenn eine vollständig konsistente Historie existiert (Kameratreffer
   Runde 3 begrenzt Runde 5 über Maximalreichweite; testbelegt
   Deduction.test.ts:87-101). Constraints: `camera`/`sichtbarkeit`/
   `aktion` exakt, `hinweis` Zonenball-Schnitt, Negativ-Schluss stille
   aktive Kameras in Bewegungsrunden (Deduction.ts:186-194;
   `aktion`-Runden und deaktivierte Kameras korrekt ausgenommen —
   `kamera_aus` spiegelt sich im `active`-Flag und verhindert so
   falschen Ausschluss; `funkstille` unterdrückt nur
   `sichtbarkeit`/`hinweis`, Kameratreffer feuern weiter —
   gameStore.ts:724-747, :826). Kein falscher Ausschluss ist
   instrumentiert belegt: `observe`-Hook über eine komplette
   muenster-Partie prüft je Zustand `belief ∋ ganovePosition`
   (AiSimulation.test.ts:54-81); Monotonie („mehr Hinweise → nie mehr
   Kandidaten") testbelegt (Deduction.test.ts:197-206). Skriptierte
   Szenarien mit exakten Mengen-Erwartungen: Deduction.test.ts komplett.
2. **Detektiv-KI: Druck, keine verbotenen Infos.** `DetectiveView`
   (DetectiveAI.ts:29-45) enthält strukturell weder `ganovePosition`
   noch `mission`/Zielknoten — `missionStructure` liefert nur
   `{kind, status}` ohne Node-IDs (MissionSystem.ts:449-498, `wahl`
   leakt die Wahl nicht). Campen auf Zielen ist per Konstruktion
   unmöglich. Instrumentierter Leak-Test während echter Partie:
   Feld-Abwesenheit + Serialisierungs-Check der missionStructure gegen
   gezogene Zielknoten (AiSimulation.test.ts:84-109). Heuristik =
   Minimierung der Coverage-Summe über die Glaubensmenge → automatische
   Aufteilung/Einkreisung statt Einzelverfolgung (DetectiveAI.ts:130-157;
   testbelegt DetectiveAI.test.ts:63-82), Hinweisanker + Fallback bei
   leerer Menge (`falsche_spur`). Druck messbar: muenster 100 %
   Detektiv-Siege in 45 beobachteten Partien, Fang Ø 13-16 Runden.
3. **Ganove-KI: Mission, Timing, Funk, Sabotage.** `chooseGanoveTurn`
   (GanoveAI.ts:229-328): Aktions-Timing mit `SAFE_ACTION_GAP = 2` +
   `kritisch`-Veto + Deadline-Override (`roundLimit`, :235-249),
   Zugwahl mit `MOVE_SAFE_GAP`/`EVADE_DISTANCE`/Evade-Modus,
   Funk-bekannte Kameras und ausweglose Knoten werden gemieden,
   Final-Leg-Commit. `shouldUseRadio` einmalig ab Hitze ≥ 3
   (:213-215), `chooseSabotagePath` wägt BFS-Umweg gegen
   `sabotageDetour` und Hitze (:192-206). Alles einzeln testbelegt
   (GanoveAI.test.ts).
4. **Batch-Simulation headless, regulär, reproduzierbar.**
   `runAiGame` treibt ausschließlich Store-Aktionen bis `outcome`
   (AiSimulation.ts:192-249); CLI via SSR-Bundle `dist-sim/sim.mjs`
   (vite.sim.config.ts) — kein DOM nötig. Endbedingungen regulär
   (caught/surrounded/escaped/timeout; `abortAsDraw` nur als
   Sicherheitsnetz `maxRounds`/`MAX_TURNS`). Vollständige JSONL-Logs je
   Partie (`--out`, getestet scripts/sim.test.mjs:59-76).
   Seed-Reproduzierbarkeit: bitidentisches Log testbelegt
   (AiSimulation.test.ts:43-47, sim.test.mjs:78-93); AI-Zufall via
   `mixSeed(seed ^ 0xa11ce5, round, lane)`. Aggregation
   (`summarizeBatch`): Outcome-Verteilung, Runden, Hinweise/Partie,
   Kameratreffer, Sabotage-Annahmequote, Radio-Quote —
   Balancing-nutzbar.
5. **Kein `Math.random`, kein Info-Leak.** `Math.random` kommt im
   gesamten `src/`/`scripts/` nur in einem Kommentar in `rng.ts` vor.
   Info-Trennung strukturell (Interfaces) und instrumentiert (s. o.).
6. **Balancing-Befund (Ganove ~0 % auf Münster-Standard) — Bewertung:**
   Schritt-14-Kalibrierung, keine Schritt-8-Abweichung. Begründung: Das
   Kriterium „gewinnt in einem relevanten Anteil von
   Simulationspartien" ist spielübergreifend wortlautgetreu erfüllt —
   luebeck `auto` 40 % escaped (10 Partien), luebeck `none` 93 %,
   teststadt `none` 100 %, der eigene Test fordert >0 auf luebeck.
   Schritt 14 trägt explizit die „Balancing-Kalibrierung" mit Zielkorridor
   ~40–50 % Ganove-Siegquote und dokumentierter Simulations-Auswertung.
   Einschränkung (für Schritt 14 zu adressieren, hier dokumentiert):
   **Mit** Mission gewinnt die Ganove-KI in keiner beobachteten
   Konfiguration — muenster 0/60 escaped (auch `--detectives 3`, Minimum),
   teststadt `random` 0/50; in 40 muenster-Partien wurde die
   Binärwahl nur 1× erreicht (seed 28), `escaped` nie. Die Mission wird
   also „zu Ende führen" nur mechanismusseitig belegt (Stages bis
   `wahl`/`sabotage` laufen, alle Entscheidfunktionen testiert) — eine
   durchgespielte Missions-Flucht wurde nicht beobachtet. Plausible
   Ursache: Das Aktions-Timing (`SAFE_ACTION_GAP = 2`, `kritisch`-Veto)
   ist gegen die Coverage-Minimierung der Detektiv-KI zu defensiv — die
   KI kreist ausweichend, statt die Aktionsrunde zu erzwingen
   (beobachtete Pendelzüge, z. B. sim-g-2: aasee_suedufer↔aasee_terrassen,
   Fang Runde 9). Falls Parameter-Tuning in Schritt 14 nicht reicht,
   ist das eine Heuristik-Korrektur, keine Kartendaten-Kalibrierung.
7. **Scope:** Diff enthält ausschließlich `src/logic`-Engine,
   `scripts/`, Build-Konfig (`vite.sim.config.ts`, `eslint`/`.gitignore`
   für `dist-sim/`), Tests und Doku — `Movement.ts` erhält nur
   `bfsOpenDistances`. Keine UI-Änderung, keine Scope-Überschreitung.

**Einschränkungen/Anmerkungen (keine Abweichungen):**

- `npm run sim -- --map luebeck --mission random` bricht den ganzen
  Batch mit `MissionGenerationError` ab (Lübeck kann für viele
  Spawnpunkte keine regelkonforme Mission ziehen — Karten-/Pool-Thema
  aus Schritt 3/6; `auto` fängt das wie spezifiziert auf `null`-Mission
  ab, `random` wirft per Definition). Funktional korrekt, aber ein
  Skip/Report je Seed würde die Balancing-Nutzbarkeit erhöhen.
- `DeductionInput.detectiveHistory` wird von der Detektiv-KI aktuell
  nicht befüllt (nur `detectivePositions`); historische
  Belegungs-Constraints entfallen dadurch — lockert die Glaubensmenge
  lediglich, kann keinen falschen Ausschluss erzeugen.
- `ganoveCanAct` (manueller Test-Hook) erlaubt Verharren ohne
  `aktion`-Spur; in regulären Partien entsteht der Pfad nicht (nur
  Missionsaktionen verharren und tragen stets die Spur).
