# Abnahmeprüfung – Entwicklungsschritt 4

## Ergebnis

**Status:** Anforderung vollständig erfüllt

## Abweichungen

- [ ] Keine.

## Hinweise

**Geprüfter Stand:** Branch `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-4-rundenablauf`, HEAD `6624376`. Diff zum Basisbranch: 16 Dateien, +1553/−85; Kern: `src/logic/Movement.ts` (neu, 169 Z.), `src/state/gameStore.ts` (+~380 Z.), drei neue Testdateien (`Movement.test.ts`, `gameStore.rounds.test.ts`, `gameStore.endings.test.ts`).

**Quality Gates (selbst ausgeführt):**
- `npm test`: 163/163 Tests grün (12 Dateien)
- `npm run coverage`: 91,53 % Lines, 91,95 % Stmts, 100 % Funcs (≥ 70 % erfüllt)
- `npm run build`, `npm run typecheck`, `npm run lint`: jeweils fehlerfrei

**Prüfnachweise zu den Akzeptanzkriterien:**

1. **Rundenstruktur:** `phase` `"ganove" → "detektive"`, `activeDetectiveIndex` erzwingt feste Reihenfolge D1→Dn (`moveDetective` nutzt ausschließlich den aktiven Index, `gameStore.ts:431-460`); `round` startet bei 1 und inkrementiert erst nach dem letzten Detektivzug (`completeDetectivePhase`, `gameStore.ts:315-324`). Test: `moveDetective fixed order and round completion` (`gameStore.rounds.test.ts:142`).
2. **Bewegung:** 1 Zug = 1 Kante via Adjazenzprüfung (`adjacentTarget`, `Movement.ts:101`), beide Kantentypen akzeptiert (`fahrt`-Logging belegt, `gameStore.rounds.test.ts:101`); Zugzwang via `stay_forbidden` (`Movement.ts:116`); Ganove→besetzter Knoten `occupied` (`Movement.ts:142`); Detektiv-Sharing erlaubt und getestet (`gameStore.rounds.test.ts:160`); Kantensperren beidseitig (`isEdgeBlocked` prüft beide Richtungen, `Movement.ts:64-68`) und für beide Seiten via `validateSharedMove`; keine Fangprüfung auf Kanten — Fang nur über Knotengleichheit nach Zugende (`gameStore.ts:451`).
3. **Fang:** Sofortprüfung in `moveDetective` vor Index-Vorschub (`gameStore.ts:451-454`); Test belegt Partieende mitten in der Detektivphase — `phase` bleibt `"detektive"`, `activeDetectiveIndex: 2`, D4 kann nicht mehr ziehen (`gameStore.endings.test.ts:87-116`).
4. **Umzingelung:** `checkGanoveSurrounded` zu Phasenbeginn — in `startGame` und nach `completeDetectivePhase` (`gameStore.ts:297-309, 321-323`); Bedingung „kein legaler Zug ∧ ¬ganoveCanAct" → `outcome: "surrounded"`; Aktions-Hook `ganoveCanAct`/`setGanoveCanAct`/`ganoveAction` vorhanden und getestet (`gameStore.endings.test.ts:190-211`), Befüllung korrekt Schritt 6 vorbehalten.
5. **Zeitlimit:** Aus Map-Settings aufgelöst — Default `suggested`, Korridor `min`/`max` erzwungen, `null` nur bei `unlimited: true` (`resolveRoundLimit`, `gameStore.ts:233-255`); `unlimited` deaktiviert die Bedingung nachweisbar (8 Runden über Limit ohne Ende, `gameStore.endings.test.ts:256-265`); Lübeck (kein `unlimited`) lehnt `null` korrekt ab.
6. **Flucht:** Freier Fluchtpunkt (Kategorie `flucht` → `escapeNodeIds`, `mapEscapeNodeIds`/`gameStore.ts:356`) → `outcome: "escaped"`; besetzter Fluchtpunkt scheitert bereits an der `occupied`-Validierung vor der Fluchtprüfung (`gameStore.endings.test.ts:229-236`) — exakt wie spezifiziert („nur illegales Zugziel").
7. **Remis:** `abortAsDraw` → `outcome: "draw"` auf laufender Partie, doppelter Abbruch → `game_over` (`gameStore.ts:486-489`, Test `gameStore.endings.test.ts:268-286`). `GameOutcome = caught|surrounded|escaped|timeout|draw` konsistent mit `02-technisches-konzept.md` §8 (`"caught"` + `"draw"` namentlich genannt; übrige Werte abbilden §7-Enden).
8. **Determinismus:** Kein `Math.random`/`Date.now`/`randomUUID` in `src/` (Fundstelle nur Kommentar im `rng.ts`-Verbotshinweis); `Movement.ts` ist rein funktional, sämtliche Bewegungslogik seed-frei deterministisch, Spawns seed-getrieben (`createRng(seed)`, `gameStore.ts:193`).
9. **Scope:** Keine Kamera-/Ereignis-/Missionslogik implementiert — nur passive Hooks/Setter (`setCameras`, `addEvent`, `setTension`, `setEventMode`, `setMission`, `setEscapeNodeIds`, `setGanoveCanAct`, `blockEdge`).

**Einschränkungen/Anmerkungen (keine Abweichungen):**
- Die aus Schritt 2 stammenden Low-Level-Aktionen `endGanovePhase`/`advanceDetective`/`endDetectivePhase` können bei direktem Aufruf den erzwungenen Fluss umgehen (z. B. `endDetectivePhase` mitten in der Phase überspringt noch nicht gezogene Detektive). Die regelerzwingende API (`moveGanove`/`moveDetective`/`ganoveAction`) hält alle Regeln strikt ein; die manuellen Aktionen sind dokumentierte imperative Steuerung für Treiber/Skripte.
- Bei Gleichzeitigkeit von Zeitlimit und Umzingelung am Rundenende gewinnt `timeout` (Prüfung vor Umzingelungs-Check, `gameStore.ts:317`); beides Detektiv-Siege, spezifikationskonform.
- Zeitlimit-Semantik: `round >= roundLimit` nach dem letzten Detektivzug ⇒ es werden genau `roundLimit` volle Runden gespielt; Flucht innerhalb der Limit-Runde gewinnt noch (Flucht vor Timeout geprüft) — plausible Lesart von „Ablauf ohne Flucht".
- Log-Einträge kapseln Nutzdaten in `details` — das flache JSONL-Format gemäß §8 ist bewusst Schritt 7 (Eventlog) vorbehalten.
