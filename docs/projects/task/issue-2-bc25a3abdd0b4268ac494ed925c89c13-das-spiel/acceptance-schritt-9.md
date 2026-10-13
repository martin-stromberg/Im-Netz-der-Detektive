# Abnahmeprüfung – Entwicklungsschritt 9

**Prüfgegenstand:** Branch
`task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-9-ganove-perspektive`
gegen `project-plan.md` §Schritt 9 sowie `01-spielkonzept.md` §1
(Asymmetrie-Tabelle) und `02-technisches-konzept.md` §4/§6
(Kartenpaket/SVG-Rendering, UI-Aufteilung GanoveUI). Geprüft: Diff
gegen Basis-Branch (40 Dateien: `src/components/` neu — `MapGraph`,
`GanoveScreen`, `HeatBadge`, `MissionPanel` samt CSS-Modulen und
jsdom-Tests; `src/state/detectiveDriver.ts` neu; `e2e/ganove.spec.ts`
neu; `src/i18n/de.json`/`en.json` erweitert; `AiSimulation.ts` nur
Export von `aiRng`; `PlaceholderPanel` entfernt; Konfig/Doku/Hooks).

## Ergebnis

**Status:** Anforderung vollständig erfüllt

## Abweichungen

- Keine.

## Hinweise

**Selbst ausgeführte Nachweise (alle grün):**

- `npm test`: 32 Testdateien, 419 Tests — alle bestanden.
- `npm run coverage`: Statements 93,99 %, Branches 85,25 %,
  Functions 99,14 %, Lines 93,60 % — deutlich über der 70-%-Schwelle.
- `npm run build` (inkl. `tsc --noEmit`): erfolgreich.
- `npm run lint`: ohne Befund. `npm run typecheck`: ohne Befund.
- `npx prettier --check src/ e2e/ playwright.config.ts`: sauber.
- `python .githooks/i18n-check.py`: „OK — 2 Kataloge in Parität".
- `npm run test:e2e` (Playwright, echter Chromium, Dev-Server):
  5/5 Tests bestanden. Die Vollspiel-Session lief deterministisch über
  echte DOM-Klicks bis `outcome=escaped` in Runde 21
  (`missionStage=flucht`, ≥3 Missionsaktionen, Sabotage-Binärwahl
  durchgespielt); eine zweite deterministische Partie endete in einem
  Nicht-Flucht-Endzustand; Remis-Abbruch über die UI verifiziert.

**Akzeptanzkriterien im Einzelnen:**

1. **Komplette Partie durchspielbar** — `e2e/ganove.spec.ts` fährt via
   `?map=`/`?seed=` deterministische Partien über reine DOM-Interaktion
   (`window.__gameStore` nur lesend, nur in DEV-Builds exponiert —
   `main.tsx:8-10`). Alle fünf Endzustände (`caught`, `surrounded`,
   `escaped`, `timeout`, `draw`) sind engine-seitig in
   `gameStore.endings.test.ts` belegt und in der UI über
   `OutcomeView`/`OUTCOME_KEY` (`GanoveScreen.tsx:51-57`) abgedeckt;
   E2E belegt Flucht-Sieg, Nicht-Flucht-Ende und Remis.
2. **Ansichts-Elemente** — eigene Position (`data-ganove`,
   `MapGraph.tsx:229-239`), legale Nachbarknoten (`data-legal-target` +
   Ring, klick-/tastaturbedienbar), alle Detektivpositionen exakt
   (`data-detective`, nummeriert), Missionsfortschritt mit fester
   Schrittreihenfolge und aktuellem Ziel (`MissionPanel.tsx`),
   gesperrte Kanten ausgegraut plus Barrieren-Glyphe
   (`MapGraph.tsx:122-145`, zusätzlich als Intel-Text „Weg gesperrt"),
   Hitze-Badge mit Icon (Signalbalken) + Text in 4 Stufen
   (`HeatBadge.tsx`), Polizeifunk-Button einmalig mit Anzeige der
   letzten Hinweise (`GanoveScreen.tsx:424-432`,
   `gameStore.useRadio`).
3. **Illegale Züge nicht angeboten** — `legalTargets` kommen
   ausschließlich aus `getLegalGanoveMoves()`
   (`Movement.ts:legalGanoveMoves` filtert besetzte/gesperrte/
   Nicht-Nachbar-Ziele); `MapGraph` setzt `role="button"`/`onClick`
   nur für legale bzw. selektierbare Knoten (`MapGraph.tsx:152-175`);
   die Engine validiert in `moveGanove`/`validateMove` zusätzlich nach.
4. **Asymmetrie** — strukturell erzwungen: `MapGraph` besitzt keine
   Kamera-/Hinweis-Props; `GanoveScreen` rendert nur
   `visibleEvents(events, "ganove")` (Umweltsperrungen + Polizeifunk-
   Bericht). Tests prüfen auf dem gerenderten DOM: keine
   `[data-camera]`-/`[data-hint]`-Elemente, keine `camera`-CSS-Klasse,
   kein Kamera-/Sichtungstext (`GanoveScreen.test.tsx:223-241`,
   `MapGraph.test.tsx:129`, E2E `:197-198`/`:253-254`). Die
   Kamera-Texte im Polizeifunk-Bericht sind die ausdrücklich
   geforderte Ausnahme „Anzeige letzter Hinweise" (Konzept §4.5).
5. **Aktionsfluss** — „Aktion ausführen" am Zielknoten neben
   Weiterziehen (`getMissionAction` + `mission-action`-Button);
   Sabotage-Binärwahl zeigt beide Optionen mit Effekt und Knoten plus
   „endgültig"-Hinweis, beide Zweige getestet (jsdom + E2E); Flucht am
   Fluchtpunkt → `escaped` (E2E + jsdom belegt).
6. **i18n** — alle sichtbaren Texte über `t()`/`TranslationKey`;
   `de.json`/`en.json` je 70 Schlüssel, Parität per Skript geprüft
   (kein fehlender Schlüssel) und durch den Hook `i18n-check.py`
   abgesichert.
7. **KI-Detektivtreiber** — `detectiveDriver.ts` läuft als
   Store-Subscription automatisch, treibt den gesamten Trupp bis zum
   Phasenrücklauf, deterministisch über `aiRng(seed, round, index+1)`
   mit identischem Salt wie `AiSimulation` (Determinismus-Test
   `detectiveDriver.test.ts:59`).
8. **Kein Scope-Überschreitung** — `App.tsx` rendert ausschließlich
   `GanoveScreen`; kein Menü, keine Detektiv-UI, keine Persistenz
   (Diff auf UI/State/i18n/E2E/Konfig/Doku beschränkt).

**Einschränkungen/Bemerkungen (keine Abweichungen):**

- `t()` (`src/i18n/index.ts`) liefert aktuell nur deutsche Texte;
  `en.json` ist paritätisch gepflegt, ein Sprachumschalter gehört zum
  Menü-/Einstellungs-Schritt (Schritt 11) und war nicht gefordert.
- Der E2E-Verlierer-Test (Seed 4) akzeptiert `caught`/`surrounded`/
  `timeout` und pinnt den konkreten Ausgang nicht fest — bei fixem
  Seed dennoch deterministisch.
- `?map=`/`?seed=`/`?mission=`/`autoDetectives` und
  `window.__gameStore` sind dokumentierte Dev-/Test-Hooks; die
  Store-Exposition greift nur in DEV-Builds.
- Der Seed-Fallback `Date.now()` in `GanoveScreen.nextSeed` liegt
  außerhalb der Engine; mit `?seed=` ist die Partie reproduzierbar —
  regelkonform, da `Math.random()` nirgends in `src/` verwendet wird.
