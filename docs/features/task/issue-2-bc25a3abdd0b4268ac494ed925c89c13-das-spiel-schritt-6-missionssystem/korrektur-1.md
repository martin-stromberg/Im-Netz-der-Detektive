# Korrektur 1 – `MissionCase.sabotageEffect` zur Laufzeit anwenden

## Anlass

Abnahmeprüfung `docs/projects/task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel/acceptance-schritt-6.md`:

- `validateMissionSet` (`MissionSystem.ts`) prüfte das optionale
  `sabotageEffect`-Feld eines Falls gegen `SABOTAGE_EFFECTS` und den
  Karten-Pool, doch `caseTargets` verwarf es und `newMissionState` /
  `resolveMission` (`gameStore.ts`) übernahmen es nicht in den
  Missionszustand — `advanceMission` zog den Effekt beim Kontakt stets
  neu per `drawSabotageEffect`. Feld validiert, aber nie angewendet;
  die Doku behauptete das Gegenteil.
- Semantik laut Korrekturvorgabe: Ein Fall-Katalog darf den Effekt fest
  vorgeben (Designer-Entscheidung, §5.2 „Fälle"); ohne Feld gilt
  weiterhin der Zufallszug der Spezifikation (§5.4).

## Korrektur

`src/logic/MissionSystem.ts`:

- `MissionTargets` erhält das optionale Feld `sabotageEffect?:
  SabotageEffect` (nur von vordefinierten Fällen befüllt).
- `caseTargets` trägt `entry.sabotageEffect` in die Targets über
  (bedingter Spread — kein `undefined`-Schlüssel im Objekt).
- `validateMissionSet` lehnt `sabotageEffect` ohne `sabotage`-Ziel neu
  ab (`requires a "sabotage" target node`) — ohne Sabotageknoten gibt
  es kein Angebot, das Feld wäre tote Konfiguration.

`src/state/gameStore.ts`:

- `advanceMission` (Aktion `kontakt`) nutzt
  `mission.targets.sabotageEffect ?? drawSabotageEffect(map, missionRng(seed, round))`
  — Fall-Effekt hat Vorrang, sonst unveränderter gesalzener Zufallszug.
  Der Effekt landet wie gehabt in `pendingChoice`/`offeredEffect` und
  wird bei der Sabotage-Aktion via `applySabotageEffect` ausgeführt.

`src/data/missions/muenster.json`:

- Fall `kurier-am-hafen` fixiert `sabotageEffect: "funkstille"`
  (Designer-Entscheidung; passt zur Story „Rathaus lahmlegen, damit
  die Fahndung ins Leere läuft" — `funkstille` ∈ Münster-Pool).

`docs/help/spiel-engine/business-rules.md`:

- Abschnitt „Sabotage-Effekte" beschreibt jetzt die tatsächliche
  Semantik (Zufallszug als Standard, Fall-Fixierung mit Vorrang);
  Abschnitt „Fallsammlungen" notiert die neue Konsistenzregel
  (Effekt erfordert Sabotageziel).

`src/logic/MissionSystem.test.ts`:

- `caseTargets` trägt den Effekt in die Targets / lässt das Feld bei
  Fällen ohne Effekt weg.
- `validateMissionSet` akzeptiert einen gültigen fixierten Effekt und
  weist `sabotageEffect` ohne `sabotage`-Ziel zurück.

`src/state/gameStore.mission.test.ts`:

- `kurier-am-hafen` liefert für 5 Seeds exakt `funkstille` in
  `pendingChoice`/`offeredEffect` (Zufallszug: Trefferwahrscheinlichkeit
  ~1/243) und wendet ihn bei der Sabotage-Aktion an
  (`appliedEffect`, `hintSilenceUntilRound`).
- `diebstahlserie-altstadt` (ohne Feld) liefert einen Effekt aus dem
  Karten-Pool (RNG-Pfad).

## Verifikation (lokal, Branch task/…-schritt-6-missionssystem)

| Befehl | Ergebnis |
| --- | --- |
| `npm test` | Exit 0 — 20 Dateien / 277 Tests grün (vorher 272) |
| `npm run coverage` | Exit 0 — Statements 94,09 %, Branches 88,7 %, Lines 93,75 %, Functions 99,5 % (≥ 70 %) |
| `npm run lint` | Exit 0 — keine Findings |
| `npm run format:check` | Exit 0 — „All matched files use Prettier code style!" |
| `npm run build` | Exit 0 — `tsc --noEmit` + `vite build` erfolgreich |
