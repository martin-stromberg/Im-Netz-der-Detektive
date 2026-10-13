# Tasks: Kartenpakete Münster und Lübeck (Schritt 3)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Daten | `src/data/maps/muenster.json` erstellen (~50–55 Knoten, 8+ Zonen, echte Orte, ~100 Kanten, `weg`/`fahrt`, Münster-Settings/Spawn-Regeln) | Offen | — |
| 2 | Daten | `src/data/maps/luebeck.json` erstellen (~18–22 Knoten, Altstadtinsel, bewusst unbalanciert, eigene Orte/Zonen/Settings/Spawn-Regeln) | Offen | — |
| 3 | Tests | `src/logic/mapData.test.ts`: beide Pakete laden via `loadMap` vollständig | Offen | — |
| 4 | Tests | `src/logic/mapData.test.ts`: Münster-Strukturmetriken (45–60 Knoten, 90–110 Kanten, Ø-Grad 3–4, zusammenhängend) | Offen | — |
| 5 | Tests | `src/logic/mapData.test.ts`: Kategorieabdeckung + beide Kantentypen (Münster) | Offen | — |
| 6 | Tests | `src/logic/mapData.test.ts`: Settings-Format beider Karten (`{suggested,min,max}` bzw. Skalare/Gruppen) | Offen | — |
| 7 | Tests | `src/logic/mapData.test.ts`: Missionskriterien-Erfüllbarkeit Münster (Tripel, Paardistanz ≥3, Folge 3–8, Budget 18/22, Sabotage-Umweg) | Offen | — |
| 8 | Tests | `src/logic/mapData.test.ts`: Lübeck-Strukturprüfung (zusammenhängend, Kategorien, Spawn-Kandidaten nicht-leer) | Offen | — |
| 9 | Tests | `MapLoader.test.ts` um `muenster`/`luebeck` Assertions erweitern | Offen | — |
| 10 | Verifikation | `map-schema-check.py --all --strict`, `npm test`, `npm run coverage`, `npm run lint`, `npm run build` grün | Offen | — |
