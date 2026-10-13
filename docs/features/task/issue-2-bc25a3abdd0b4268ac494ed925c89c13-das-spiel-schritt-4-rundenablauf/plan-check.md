# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| Legale/illegale Züge korrekt validiert (Nachbarschaft, besetzte Knoten für Ganoven, gesperrte Kanten) | `validateGanoveMove`/`validateDetectiveMove` + `legalMovesFrom` mit `MoveError`-Reasons `not_adjacent`/`occupied`/`blocked_edge` | `Movement.test.ts` (`validateGanoveMove_…`, `legalMovesFrom_…`, `legalGanoveMoves_…`) | Abgedeckt |
| Detektive dürfen Knoten teilen | `legalDetectiveMoves` filtert besetzte Knoten nicht; Store-Test mit zwei Detektiven auf einem Knoten | `Movement.test.ts` (`legalDetectiveMoves_…`) + `gameStore.rounds.test.ts` (Teilen) | Abgedeckt |
| Fangprüfung nach jedem Einzelzug beendet Partie sofort | `moveDetective` Schritt 4: Sofortprüfung, `outcome "caught"`, weitere Detektive ziehen nicht | `gameStore.endings.test.ts` (`moveDetective_…Caught` inkl. Mitten-in-Phase-Nachweis) | Abgedeckt |
| Umzingelung erkannt (kein legaler Zug, keine Aktion → Detektiv-Sieg) | Automatische Prüfung beim Übergang in Phase `ganove` (Plan: Programmablauf Rundenende Schritt 3 + `startGame`) | `gameStore.endings.test.ts` (`…Surrounded`, inkl. `ganoveCanAct`-Gegenprobe) | Abgedeckt |
| Zeitlimit-Ende liefert Detektiv-Sieg; `unlimited` deaktiviert | `roundLimit` im Store, Prüfung `round >= roundLimit` beim Rundenende; `null` = unbegrenzt | `gameStore.endings.test.ts` (`…Timeout` inkl. `null`-Nachweis über viele Runden) | Abgedeckt |
| Flucht am freien Fluchtpunkt → Ganove-Sieg; besetzter Fluchtpunkt temporär illegal | `escapeNodeIds` aus `flucht`-Kategorie + `setEscapeNodeIds`-Hook; besetzt ⇒ `occupied` automatisch | `gameStore.endings.test.ts` (`…Escaped` inkl. besetztem Fluchtpunkt) | Abgedeckt |
| Abbruch als Remis (`draw`) | `abortAsDraw` → `outcome "draw"` + `result`-Log | `gameStore.endings.test.ts` (`abortAsDraw_…`) | Abgedeckt |
| Zwei-Phasen-Runden, feste Reihenfolge D1→Dn, Runden-/Phasenzähler | `moveGanove`/`moveDetective` treiben `phase`/`activeDetectiveIndex`/`round` | `gameStore.rounds.test.ts` | Abgedeckt |
| Aktionsrunde als Struktur/Prüfpunkt (Zugzwang-Ausnahme) | `ganoveCanAct`-Flag + `ganoveAction()` (stehen bleiben erlaubt, konservativ deaktiviert) | `gameStore.rounds.test.ts` (`ganoveAction_…`) + Surrounded-Gegenprobe | Abgedeckt |
| Zugzwang für alle (kein freiwilliges Stehenbleiben) | `stay_forbidden`-Reason in beiden Validatoren | `Movement.test.ts` | Abgedeckt |
| Gesperrte Kanten für beide Seiten unpassierbar | `activeEdgeBlocks` filtert in `legalMovesFrom`; gilt für beide Aktoren | `Movement.test.ts` (Grenzfälle `untilRound`) | Abgedeckt |
| Keine Fangprüfung auf Kanten | Fang nur auf Zielknoten geprüft (in `moveDetective`) | Implizit in allen Ending-Tests | Abgedeckt |
| `outcome` konsistent zu Eventlog (`result.outcome`, inkl. `draw`) | `GameOutcome`-Union + `result`-Logeintrag mit `outcome`/`rounds` | Log-Assertions in `gameStore.endings.test.ts` | Abgedeckt |
| Deterministisch über Seed, headless | Motor ohne RNG-Bedarf; Seed-Spawns bereits vorhanden; Store headless | Seed-Test besteht bereits; neue Tests rein skriptgesteuert | Abgedeckt |
| Coverage ≥ 70 % | Schwellenwert in `vite.config.ts` erzwungen; neue Dateien vollständig getestet | `npm run coverage` im QS-Schritt | Abgedeckt |
| App-Shell kompiliert/rendert weiter | Keine UI-Änderung; `App.test.tsx` unverändert gültig | Bestehende App-Tests | Abgedeckt |

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| Kein Benutzerfluss — ausdrücklich headless-Engine ohne UI-Ausbau | – | Nicht erforderlich mit Begründung: Der Rundenmotor hat keine UI-Interaktion; skriptgesteuerte Store-Partien treiben denselben Store, den später UI und KI nutzen — das ist der von der Anforderung geforderte Funktionsnachweis („skriptgesteuerte Testpartien"). |

## Hinweise

- `endDetectivePhase` wird regelbewusst (Rundenende-Sequenz) — ist im Plan als
  Seiteneffekt benannt und durch den bestehenden Phasenmaschine-Test abgesichert.
- Missionsgebundene Aktions-/Fluchtmechanik folgt in Schritt 6; die Hooks
  (`ganoveCanAct`, `setEscapeNodeIds`, `ganoveAction`) sind jetzt bewusst
  konservativ implementiert.
