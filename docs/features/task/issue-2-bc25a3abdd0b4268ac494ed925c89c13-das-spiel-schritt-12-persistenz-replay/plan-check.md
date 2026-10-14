# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| Gespeicherter Spielstand → identischer Zustand nach Laden (vollständiger Zustandsvergleich); verbrauchte Einmal-Fähigkeiten bleiben verbraucht | `GameStateSnapshot` (alle Datenfelder ohne `map`/`log`) + `resumeGame` + `ResumeEntry` (§ Designentscheidungen, Ablauf „Partie fortsetzen") | `SaveGame.test.ts` Roundtrip mit `toEqual`-Vollvergleich; `radioUsed`-Test; Sabotage-Fenster-Test | Abgedeckt |
| Replay deterministisch: Schritt vor/zurück identische Zustände | `replayTo` neuabspielend je Schritt, Aktoreinträge über `ReplayDriver` | `ReplayPlayer.test.ts` Determinismus + vor/zurück | Abgedeckt |
| Perspektiven filtern korrekt nach `visibleTo` (Detektiv-Sicht zeigt nie den Ganoven außerhalb erlaubter Hinweise) | `ReplayScreen` rendert `ganovePosition` nur in Ganove-Perspektive; Detektiv-Perspektive nutzt `visibleEvents("detectives")`, `visibleCameras`, `deducePossiblePositions` — dasselbe Leck-Verbot wie `DetektivScreen` | `ReplayPlayer.test.ts` Filtertest + `ReplayScreen`-Komponententest + E2E-Perspektivwechsel | Abgedeckt |
| Statistik-Werte stimmen über bekannten Log-Fixtures exakt | `Statistics.ts` `aggregateStatistics` (Seite, Modus, Ø Runden/Hinweise/Kameras) | `Statistics.test.ts` mit synthetischen Fixtures | Abgedeckt |
| Log-Export/-Verwaltung inkl. automatischer localStorage-Vorhaltung | `exportGameLog` (vorhanden) + `deleteGameLog`/`getGameLog` neu + `clearGameLogs`; Auto-Persistenz via `finish()` bleibt | `Recorder.test.ts`-Erweiterung + E2E Export/Löschen | Abgedeckt |
| Save-Punkt in beiden Spiel-Screens | „Partie speichern"-Button in `GanoveScreen` + `DetektivScreen` | E2E Speichern/Fortsetzen + Komponententests | Abgedeckt |
| Menü-Punkte „Partie fortsetzen" und „Statistiken/Replay" befüllt | `ResumeScreen` + erweiterter `StatsScreen`, `App`-Wiring | Komponenten- und E2E-Tests | Abgedeckt |
| Speicherformat versioniert (`schema`) | `SAVE_SCHEMA_VERSION`, strikte Filterung | `SaveGame.test.ts`/`GameIndex.test.ts` | Abgedeckt |
| Deduction-Overlay in Replay-Detektivsicht nutzbar | `deducePossiblePositions` + `possibleNodeIds` in `MapGraph` | `ReplayScreen.test.tsx` | Abgedeckt |
| Coverage ≥70 %, kein `Math.random` in `src/logic` | nur seeded `rng.ts` verwendet; neue Module vollständig getestet | Coverage-Lauf in Schritt 10 | Abgedeckt |

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| Speichern → Fortsetzen (identischer Zustand) | `persistenz.spec.ts`: Speichern → Reload → Fortsetzen | Abgedeckt |
| Statistik-Anzeige + Log-Verwaltung | `persistenz.spec.ts`: Stats nach Dev-Batch, Löschen | Abgedeckt |
| Replay-Timeline + Perspektiven | `persistenz.spec.ts`: Replay öffnen, Schritt vor, Perspektivwechsel | Abgedeckt |
| Log-Export | `persistenz.spec.ts`: Download-Event | Abgedeckt |
| Alle löschen | `persistenz.spec.ts`: Bestätigungsflow | Abgedeckt |

## Hinweise

- „Modus" ist in der Anforderung mehrdeutig; der Plan wählt die
  gespielte Perspektive (`playerMode`) — dokumentierte Annahme in
  `requirement.md`; Einträge ohne Feld (KI/Dev) gruppieren als
  „unbekannt".
- Replay in den Singleton-Store ist bewusst gewählt (exklusive Screen-
  Nutzung); Risiko + `resetGame`-Pflicht sind im Plan benannt.
