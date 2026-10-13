# Abnahmeprüfung – Entwicklungsschritt 5

**Prüfgegenstand:** Branch
`task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-5-informationssystem`
gegen `project-plan.md` §Schritt 5, `01-spielkonzept.md` §1 und §4.1–4.6 sowie
`04-balancing.md`.

## Ergebnis

**Status:** Anforderung vollständig erfüllt

## Abweichungen

- Keine.

## Hinweise

**Verifikationsläufe (selbst ausgeführt):**
- `npm test` — 16 Dateien, 208 Tests, alle grün.
- `npm run coverage` — alle Tests grün; Gesamtabdeckung 93,4 % Statements,
  100 % Funktionen; `CameraSystem.ts`, `InformationSystem.ts`, `rng.ts` bei
  100 % Statements, `EreignisEngine.ts` 98 %, `gameStore.ts` 98,6 %.
- `npm run build` — erfolgreich (tsc --noEmit + vite build).
- `npm run lint` — ohne Befund. `npm run typecheck` — ohne Befund.

**Prüfnachweise je Akzeptanzkriterium:**

1. **Kameras:** `placeCameras` (`src/logic/CameraSystem.ts:21-43`) erzwingt
   `cameraMinGap` als BFS-Kantendistanz und filtert die Ausschlussliste;
   getestet über 60 Seeds (Münster + 10 geschützte Knoten,
   `CameraSystem.test.ts:30-44`), 50 Seeds (teststadt, `:46-57`) und
   40 Seeds auf Store-Ebene (`gameStore.info.test.ts:74-97`). Eigener
   Stichprobenlauf über 200 Seeds auf Münster: stets volle 8 Kameras.
   Kameratreffer erzeugt exakten `nodeId` + `round` mit
   `visibleTo: "detectives"` (`gameStore.ts:403-424`); der Ganove erhält
   Kameras strukturell nie (`visibleCameras` → `[]`,
   `InformationSystem.ts:107-109`; Funk-Ausnahme nur als `RadioHint`-Daten).
2. **Auslösemodi:** `rollTrigger` (`EreignisEngine.ts:42-60`) — cycle
   deterministisch `[4,8,12,16]` getestet (`EreignisEngine.test.ts:20-31`);
   chance statistisch ±0,05 über 4000 Runden (`:33-45`); tension mit
   Defaults +10/40 feuert garantiert in Runden 4/8/12 und resettet auf 0
   (`:47-61`), zusätzlich auf Store-Ebene belegt
   (`gameStore.info.test.ts:173-185`).
3. **Typmischung:** `drawEventType` (`EreignisEngine.ts:66-76`) approximiert
   25/45/30 über 4000 Züge (`:64-77`). `pickBlockableEdge` (`:138-159`)
   nutzt den Konnektivitätscheck `isConnectedWithout` (`:110-128`), der
   „letzte freie Kante" und Graph-Zerteilung gemeinsam abdeckt; getestet
   über 40 Seeds × 3 Karten, mit bereits gesperrten Kanten und dem
   null-Fall auf einem Pfadgraphen (`:141-191`). Sperrung ist
   `visibleTo: "both"`, wirksam über `isEdgeBlocked` in `Movement.ts` für
   beide Seiten, Dauer `untilRound = round + edgeBlockRounds - 1`
   (`gameStore.ts:450`; Store-Test `:233-258`).
4. **Hinweisgrundsatz:** Exakte Hinweise sind vergangenheitsbezogen
   (Kamera: Knoten+Auslöserunde; Test „past-relative after the ganove
   moves on", `gameStore.info.test.ts:147-158`); Zonen-Hinweise liefern
   Zone + BFS-Ball statt exakter Position (`zoneHint`,
   `EreignisEngine.ts:84-100`). Einzige Live-Ausnahme `sichtbarkeit`
   verfällt funktional nach der Runde über `revealedGanovePosition`
   (`InformationSystem.ts:136-147`; Tests `:77-83` und
   `gameStore.info.test.ts:260-277`). Hinweise werden ausschließlich mit
   `visibleTo: "detectives"` erzeugt.
5. **Polizeifunk:** `useRadio` (`gameStore.ts:781-803`) ist genau einmal
   nutzbar (`radioUsed`-Guard + `MoveError "already_used"`) und liefert
   via `radioHintSummary` (`InformationSystem.ts:116-129`) exakt die
   letzten `radioHintCount` Hinweisereignisse inkl. Kameratreffern;
   unentdeckte Kameras und Zukünftiges sind strukturell ausgeschlossen
   (nur emittierte Events werden zusammengefasst). Tests:
   `gameStore.info.test.ts:280-310`, `InformationSystem.test.ts:55-75`.
6. **Hitze:** `HEAT_WEIGHTS` = Zonen-Hinweis +1, Kamera +2, Aktions-Spur
   +2, Sichtbarkeit +3 (`InformationSystem.ts:82-89`); 3-Runden-Fenster
   inkl. laufender Runde (`HEAT_WINDOW`, `:155-164`); Schwellen
   0/1–2/3–4/≥5 → ruhig/aktiv/erhoeht/kritisch — alle Stufen, die
   Fenstergrenze (Runde 5 zählt in Runde 7, nicht mehr in 8), `aktion`- und
   0-Gewicht-Fälle sind testbelegt (`InformationSystem.test.ts:85-138`,
   `gameStore.info.test.ts:312-331`). Rückgabe nur `{level, score}` —
   kein Info-Leak (Test auf Schlüssel).
7. **Asymmetrie datenseitig:** `visibleTo` ist Pflichtfeld auf jedem
   `GameEvent`; `visibleEvents`/`visibleCameras` filtern auf Datenebene.
   End-to-End-Test über eine gespielte Partie: Ganoven-Sicht enthält
   nie `HINT_EVENT_KINDS` und nie Kameras
   (`gameStore.info.test.ts:334-354`, `InformationSystem.test.ts:25-53`).
8. **Scope/Integration:** src-seitiger Diff beschränkt sich auf
   `CameraSystem`, `EreignisEngine`, `InformationSystem`, `rng.ts`
   (`mixSeed`), `Movement.ts` (nur `already_used`-Rejection für den Funk)
   und `gameStore.ts` — kein Missionssystem, kein JSONL-Eventlog, kein UI.
   Integration am korrekten Punkt: `moveGanove` führt Kamera- und
   Ereignisprüfung unmittelbar nach dem Ganovenzug aus, *bevor* die Phase
   auf `detektive` wechselt (`gameStore.ts:651-655`); `ganoveAction`
   läuft ohne Kameracheck (Betreten ≠ Verharren), aber mit Ereigniswurf
   (`:702-720`). Defaults stimmen mit den Karten-Settings überein
   (Münster/teststadt: 8 Kameras, minGap 2, tension +10/40, Mix 25/45/30,
   `edgeBlockRounds` 3, `radioHintCount` 5).

**Einschränkungen/Anmerkungen (keine Abweichungen):**
- `placeCameras` degradiert still (weniger Kameras), wenn die Karte die
  gewünschte Anzahl unter den Invarianzen nicht hergibt — auf allen
  gebündelten Karten wird die volle Anzahl erreicht; Verhalten ist
  dokumentiert (`business-rules.md`).
- `useRadio` ist phasenunabhängig aufrufbar — die Spezifikation macht
  dazu keine Vorgabe.
- `sichtbarkeit`-Events behalten ihr `nodeId` als historischen Eintrag in
  der Chronik — spec-konform (vergangenheitsbezogen erlaubt); das
  „Verfallen" ist über den Accessor `revealedGanovePosition` sichergestellt.
- Der Store enthält vorbereitende Hooks für spätere Schritte
  (`deactivateCameras`, `setMission`, `setGanoveCanAct`, `setCameras`,
  `blockEdge`, `setTension`, `setEventMode`, `addEvent`) — bewusst
  minimal gehalten und dokumentiert.
