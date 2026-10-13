# Korrektur 1 – api.md an die tatsächliche Engine-API angeglichen

## Anlass

Abnahmeprüfung `docs/projects/task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel/acceptance-schritt-8.md`
(Abweichung 1, Schweregrad gering — rein dokumentarisch):

- `docs/help/spiel-engine/api.md` dokumentierte unter `DetectiveAI.ts`
  den Export `MOVE_TARGET_EPSILON` — `DetectiveAI.ts` exportiert keine
  Epsilon-Konstante (nur `DetectiveView` und `chooseDetectiveMove`).
- Unter `AiSimulation.ts` war der Typ `SimMetrics` mit den Feldern
  `{rounds, hintsTotal, camerasTriggered, sabotageOffered,
  sabotageChosen, radioUsed}` beschrieben — existiert nicht; tatsächlich
  exportiert das Modul `SimGameResult` (`{seed, outcome, rounds, log,
  hintsTotal, camerasTriggered, sabotageOffers, sabotageAccepted,
  radioUsed}`) und `BatchSummary`.

## Korrektur

`docs/help/spiel-engine/api.md` — nur Dokumentation, kein Code:

- `DetectiveAI.ts`-Tabelle: Zeile `MOVE_TARGET_EPSILON` entfernt; die
  Beschreibung der Coverage-Heuristik oberhalb trägt das Konzept bereits.
- `AiSimulation.ts`-Tabelle: `runAiGame`-Rückgabe korrigiert (flaches
  `SimGameResult`, kein verschachteltes `metrics`-Feld), `runAiBatch`
  auf `SimGameResult[]` präzisiert, `SimMetrics`-Zeile durch die realen
  Typen `SimGameResult` und `BatchSummary` (Feldlisten aus
  `src/logic/AiSimulation.ts`) ersetzt; `sabotageAcceptanceRate` als
  `null`-fähig vermerkt.
- Mitgefundene Drift im selben Abschnitt: `DeductionInput` trägt das
  optionale Feld `detectiveHistory?` (Deduction.ts:67) — ergänzt;
  `lastHintAnchor` liefert das `GameEvent` selbst (exakter `nodeId`-
  oder Zonenball-`nodeIds`-Anker), nicht `{round, nodeIds}` —
  präzisiert.

Unverändert verifiziert: `GanoveAI.ts`-Konstanten
(`SAFE_ACTION_GAP`/`RADIO_HEAT_THRESHOLD`/`EVADE_DISTANCE`/
`MOVE_SAFE_GAP`), `GanoveView`/`GanoveTurn`-Signaturen und die
übrigen Tabellen des Abschnitts.

## Verifikation (lokal, Branch task/…-schritt-8-deduktion-ki)

| Befehl | Ergebnis |
| --- | --- |
| `npm run format:check` | Exit 0 — „All matched files use Prettier code style!" |
| `npm run lint` | Exit 0 — keine Findings |
