# Abnahmeprüfung – Entwicklungsschritt 10

**Prüfgegenstand:** Branch
`task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-10-detektiv-perspektive`
gegen `project-plan.md` §Schritt 10 sowie `02-technisches-konzept.md`
§4/§6 (Kartenpaket, UI-Aufteilung DetektiveUI) und `01-spielkonzept.md`
§6 (Detektive, Deduktions-Werkzeuge) + §1 (Asymmetrie-Tabelle).
Geprüft: Diff gegen Basis-Branch (38 Dateien: `src/components/` —
`DetektivScreen` samt CSS-Modul und jsdom-Tests neu, `MapGraph` um
Kamera-/Kategorie-/Zonen-/Marker-/Overlay-Props erweitert, `gameSetup.ts`
neu, `GanoveScreen` refactored; `src/state/ganoveDriver.ts` neu samt
Tests; `e2e/detektiv.spec.ts` neu, `e2e/ganove.spec.ts` auf
`?mode=ganove` angepasst; `App.tsx` temporärer Modus-Umschalter;
i18n-Kataloge erweitert; Hilfe-Doku/Release-Notes).

## Ergebnis

**Status:** Anforderung vollständig erfüllt

## Abweichungen

- Keine.

## Hinweise

**Selbst ausgeführte Nachweise (alle grün):**

- `npm test`: 34 Testdateien, 445 Tests — alle bestanden.
- `npm run coverage`: Statements 93,2 %, Branches 84,94 %,
  Functions 98,04 %, Lines 92,72 % — deutlich über der 70-%-Schwelle
  (DetektivScreen.tsx 83,6 %, MapGraph.tsx 96,5 %, ganoveDriver.ts
  92,9 %).
- `npm run build` (inkl. `tsc --noEmit`): erfolgreich.
- `npm run lint`: ohne Befund. `npm run typecheck`: ohne Befund.
- `python .githooks/i18n-check.py`: „2 Kataloge in Parität"; zusätzlich
  skriptseitig verglichen: `de.json`/`en.json` je 113 Schlüssel, identische
  Schlüsselmengen (kein fehlender/überzähliger Schlüssel).
- `npm run test:e2e` (Playwright, echter Chromium, Dev-Server):
  12/12 Tests bestanden — 7 neue Detektiv-Specs plus die 5 bestehenden
  Ganove-Specs unverändert grün. Die Detektiv-Vollpartie lief über reine
  DOM-Interaktion bis `outcome=timeout` (120 Züge, 13 Chronik-Einträge);
  die Ganove-Vollpartie endete mit `escaped` in Runde 21.

**Akzeptanzkriterien im Einzelnen:**

1. **Komplette Partie Mensch-Detektive vs. KI-Ganove durchspielbar** —
   `e2e/detektiv.spec.ts:248-289` spielt eine deterministische Partie
   (`?mode=detektiv&map=teststadt&seed=7&mission=random`) von der
   Startaufstellung bis zum `outcome-panel`; alle fünf Endzustände sind
   über `OUTCOME_KEY` (`DetektivScreen.tsx:67-73`) i18n-abgedeckt und
   engine-seitig in `gameStore.endings.test.ts` belegt; E2E belegt
   `timeout` (Vollpartie) und `draw` (Abbruch-Dialog, Spec `:291-297`).
2. **Hinweis-Chronik** — `DetektivScreen.tsx:557-575` listet
   `visibleEvents(events, "detectives")` in Log-Reihenfolge
   (chronologisch, append-only); jeder Eintrag trägt Runden-Badge, Typ
   (`chronicleText` für `camera`/`sichtbarkeit`/`hinweis`/`aktion`/
   `umwelt`) sowie Ort bzw. Zone. jsdom-Test `DetektivScreen.test.tsx:
   144-173` belegt Vollständigkeit der detektivsichtbaren Menge und
   filtert `polizeifunk` (Ganove-only) korrekt heraus.
3. **Marker** — Marker-Modus über `marker-toggle` macht alle Knoten
   markierbar (`markableNodeIds`), Pins (`data-marker`) plus
   Kommentar-Eingabefelder und Entfernen-Button in der Markerliste
   (`DetektivScreen.tsx:515-555`); Persistenz über Runden und
   Toggle-Entfernung belegt in `DetektivScreen.test.tsx:222-255` und E2E
   `detektiv.spec.ts:204-234`.
4. **Overlay = exakt `deducePossiblePositions`** — die UI ruft die
   Engine-Funktion mit denselben Parametern (Map, `detectiveStartsFromLog`,
   `visibleEvents`, `visibleCameras`, Runde, Detektivpositionen) auf
   (`DetektivScreen.tsx:379-388`) und rendert das Ergebnis als
   `data-possible`-Rauten. Gegenprobe in beiden Testebenen: jsdom
   (`DetektivScreen.test.tsx:198-220`) und E2E rechnen die
   Engine-Menge selbst nach und vergleichen 1:1 mit dem gerenderten DOM
   (`detektiv.spec.ts:62-74,165-202`) — über mehrere Runden.
5. **Asymmetrie** — strukturell: `DetektivScreen` empfängt nie
   `ganovePosition`/`mission.targets`; `missionStructure`
   (`MissionSystem.ts:448-498`) liefert nur Schrittart + Status, die
   Pool-Anzeige nutzt `nodesByCategory` (öffentliche Kategorien, keine
   Ziel-Ids). E2E prüft auf dem gerenderten DOM in jedem Zugschritt:
   `[data-ganove]`-Zähler 0 und `[data-mission-target]`-Zähler 0,
   inklusive des Endzustands (`detektiv.spec.ts:144-148,264-288`);
   Kamera-Icons existieren nur hier (`[data-camera]` > 0 in Detektiv-
   Spec, `= 0` weiterhin in `ganove.spec.ts:197,253`).
6. **D1→Dn, legale Ziele, Fangprüfung, KI-Ganove** — feste Reihenfolge
   über `activeDetectiveIndex` (`gameStore.ts:1197-1201`), legale Ziele
   ausschließlich aus `getLegalDetectiveMoves`/`validateDetectiveMove`,
   Fangprüfung je Zug in `moveDetective` (`gameStore.ts:1193-1195` →
   `caught`). Der `ganoveDriver` (`src/state/ganoveDriver.ts`) läuft als
   Store-Subscription synchron, löst `pendingChoice` (Sabotage-Binärwahl)
   zuerst, tippt Polizeifunk bei Hitze, wählt Züge/Aktionen über
   `chooseGanoveTurn` mit `aiRng(seed, round, 0)` — identischer Salt/Lane
   wie `AiSimulation` (Determinismus-Test `ganoveDriver.test.ts:58-66`).
7. **i18n und Scope** — alle neuen Texte über `t()`/`TranslationKey`;
   de/en paritätisch (113/113 Schlüssel). `App.tsx` enthält nur den
   dokumentierten temporären Zwei-Buttons-Switcher (`?mode=` oder
   Auswahl) — kein vollwertiges Menü; kein Persistenz-/Replay-Scope.

**Einschränkungen/Bemerkungen (keine Abweichungen):**

- `detektiv.setup.auto` ist in beiden Katalogen vorhanden, wird aber im
  Code nicht referenziert: Bei `spawnRules.detectives.mode === "random"`
  startet `beginSetup` direkt ohne Pick-View (`DetektivScreen.tsx:306-314`)
  — toter Schlüssel, paritätisch, kosmetisch.
- `sichtbarkeit`-Ereignisse erscheinen nur als Chronik-Text („Sichtung
  bei {node}"); es wird kein temporärer Ganoven-Marker gerendert. Das ist
  plan-konform („der Ganove bleibt unsichtbar") — die Information liegt
  im Chronik-Eintrag und im eingeengten Overlay.
- E2E-Klicks auf SVG-Knoten nutzen `dispatchEvent` auf das Element mit
  dem React-Handler (in der Spec begründet: überlappende Hit-Areas
  verhindern deterministische Hit-Tests) — weiterhin echte DOM-Events.
- `detektiv.phase.ganove` („Der Ganove zieht …") ist praktisch nicht
  sichtbar, da die KI-Phase synchron abläuft — harmlos.
- `?mode=`/`?map=`/`?seed=`/`?mission=`/`autoGanove` und
  `window.__gameStore` (nur DEV, `main.tsx:8-10`) sind dokumentierte
  Dev-/Test-Hooks; `Date.now()`-Seed-Fallback liegt außerhalb der
  Engine, kein `Math.random()` im Diff.
