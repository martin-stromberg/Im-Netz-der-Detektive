# Abnahmeprüfung – Entwicklungsschritt 3

## Ergebnis

**Status:** Anforderung vollständig erfüllt

## Abweichungen

- [ ] Keine.

## Hinweise

**Selbst ausgeführte Prüfungen (alle grün):**

- `npm test` — 111 Tests in 9 Dateien bestanden (inkl. neuer Suite
  `src/logic/mapData.test.ts` mit 17 Tests).
- `npm run coverage` — gesamt 88,71 % Statements / 82,45 % Branches /
  100 % Funktionen; `src/logic` 86,69 %.
- `npm run build` — `tsc --noEmit` + `vite build` fehlerfrei.
- `npm run lint` — fehlerfrei.
- `python .githooks/map-schema-check.py --all --strict` — „OK: 3 all
  map package(s) valid" (muenster, luebeck, teststadt).

**1. Strukturmetriken Münster (eigenes node-Skript + Tests verifiziert):**

- 59 Knoten (Korridor 45–60 ✓), 101 Kanten (Korridor 90–110 ✓),
  Ø-Knotengrad 3,42 (Korridor 3–4 ✓, Grad min 2 / max 8).
- Zusammenhang: BFS vom ersten Knoten erreicht 59/59 Knoten.
- Kategorien mehrfach vertreten: diebstahl 17, kontakt 32, sabotage 6,
  flucht 7 (Test fordert ≥ 4 je Kategorie).
- Kantentypen: 95 `weg`, 6 `fahrt` (≥ 1 vorhanden, ≤ 10 % — Test
  `uses both edge types, with fahrt as the rare one`).
- Keine Duplikate: weder Knoten-IDs noch Kantenpaare; alle
  Kantenendpunkte referenzieren existierende Knoten.
- `weg`-Kanten sind lokal (Median ~64 Einheiten, max 153), alle 6
  `fahrt`-Kanten sind echte Fernverbindungen (189–278): hbf↔domplatz,
  hbf↔hafenpier, domplatz↔schlossplatz, domplatz↔zentrum_nord,
  hbf↔wolbeck, aegidiimarkt↔allwetterzoo — konsistent mit
  „Bus-/Bahn-Achsen".

**2. Münster-Settings (`muenster.json` Z. 1125–1177) — exakt gemäß
`04-balancing.md`:**

- Detektive 4 (2–6), Kameras 8 (0–15), Zeitlimit 30 (min 15,
  `unlimited: true`), Polizeifunk 5 (3–10), Kantensperrung 3 (1–6),
  `cameraMinGap` 2, `hintZoneRadius` 2, `eventMode` `tension`,
  `eventDefaults` {cycle 4, chance 0,25, threshold 40, perRound 10},
  `eventMix` 0,25/0,45/0,30, `missionRules` {minGap 3, maxGap 8,
  routeBudget 18, routeBudgetSabotage 22, sabotageDetour 4},
  `sabotageEffects` alle drei, `spawnRules.ganove.minDistanceToDetective`
  3. Wird zusätzlich durch den Test `carries the Muenster balancing
  defaults` vollständig per `toEqual` abgesichert.
- Stichprobe gegen die Spec-Tabelle in `04-balancing.md` Z. 45–58: alle
  Werte deckungsgleich.

**3. Lübeck:** 22 Knoten (< Hälfte von Münster), 39 Kanten (37 `weg`,
2 `fahrt`: hbf↔rathaus, burgtor↔muehlentor), Ø-Grad 3,55,
zusammenhängend. Strukturell anders: `zones`-basierte Detektiv-`choice`
(statt `nodes`-Liste), `eventMode` `cycle` (statt `tension`),
`roundLimit` mit `max` statt `unlimited`, `cameraMinGap` 1,
`minDistanceToDetective` 2, nur 2 `sabotageEffects`, abweichender
`eventMix`. Bewusst unbalanciert plausibel: 5 Detektive auf 22 Knoten
(~23 % Abdeckung vs. ~7 % in Münster), 4 Fluchtpunkte auf kleiner
Fläche. Eigene echte Orte (Holstentor, Marienkirche, Buddenbrookhaus,
Dom, Salzspeicher, Burgtor, Mühlentor u. a.) und Zonen
(westend/nord/mitte/sued). Topografie realitätsnah: Hbf westlich,
Burgtor nördlich, Dom/Mühlentor südlich.

**4. Topografie Münster:** Domplatz (485,388) und Prinzipalmarkt
(455,368) liegen am Massenzentrum (489,435); Hbf (705,505) südöstlich;
Schloss/Schlosspark westlich (x 230–350); Aasee-Knoten südlich
(y 500–690); Stadthafen südlich; Nordstadt-Knoten (Kinderhaus y 92,
A43-Abfahrt Weseler Str. y 78) im Norden; Umland-Fluchtpunkte
(Hiltrup, Wolbeck) am Kartenrand. Alle 59 Orte sind echte,
wiedererkennbare Münsteraner Örtlichkeiten; Koordinaten innerhalb
`viewBox 0 0 1000 800` (x 210–905, y 78–762).

**5. Missionskriterien-Erfüllbarkeit:** `mapData.test.ts` Z. 146–204
prüft tatsächlich auf dem Graphen — BFS-Distanzen via `distance()`,
Tripel-Enumeration Diebstahl→Kontakt→Flucht mit minGap/maxGap und den
Fluchtpunkt-Regeln (≥ 3 vom Diebstahlziel, ≥ 4 vom Kontaktziel),
Routenbudget-Check inkl. kürzester Startanfahrt + Aktionsrunden (≤ 18)
sowie Sabotage-Umweg-Check (≤ K→F + 4) gegen `routeBudgetSabotage`
22 — entspricht den messbaren Kriterien aus `01-spielkonzept.md` §5.2.
Keine bloße Behauptung.

**6. Laden ohne Hartcodierung:** `MapLoader.ts` nutzt
`import.meta.glob("../data/maps/*.json")` — keinerlei hartkodierte
Karten-IDs in `src/logic`/`src/state`/`src/App.tsx` (grep: keine
Treffer außer Tests). Ablehnungspfad intakt: `mapPack.test.ts` (19
Tests) prüft weiterhin MapValidationError für ungültige Pakete;
unbekannte IDs werfen Fehler mit verfügbarer ID-Liste.

**7. Scope:** Diff enthält nur die zwei Kartenpakete, zwei Testdateien
sowie Doku/Changelog/Release-Notes/Tasks — keine Engine-Änderungen.

**Einschränkungen / Randnotizen (keine Abweichungen):**

- Die Tasks-Datei
  (`docs/features/task/...-schritt-3-kartenpakete-tasks.md`, Task 10)
  nennt `test-results.md` als Testnachweis; die Datei liegt nicht im
  Repo — analog zum etablierten Lifecycle-Muster von Schritt 2 wurden
  Arbeitsartefakte offenbar nicht committet. Die Prüfkommandos wurden
  hier selbst ausgeführt und sind grün.
- `kontakt` ist mit 32 Knoten relativ dominant; Spec verlangt nur
  „genügend Knoten je Kategorie" — erfüllt.
- Der Tripel-Test interpretiert K→F als aufeinanderfolgendes Zielpaar
  (Obergrenze maxGap 8); die Spec nennt explizit nur „≥ 4". Strengere,
  aber vertretbare Lesart — schränkt die Erfüllbarkeit nicht ein
  (Test grün).
