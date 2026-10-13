# Tasks: Kartenpakete Münster und Lübeck (Schritt 3)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Daten | `src/data/maps/muenster.json` erstellen (~50–55 Knoten, 8+ Zonen, echte Orte, ~100 Kanten, `weg`/`fahrt`, Münster-Settings/Spawn-Regeln) | Erledigt | `mapData.test.ts` (Strukturmetriken, Settings), `map-schema-check.py --all --strict` |
| 2 | Daten | `src/data/maps/luebeck.json` erstellen (~18–22 Knoten, Altstadtinsel, bewusst unbalanciert, eigene Orte/Zonen/Settings/Spawn-Regeln) | Erledigt | `mapData.test.ts` (Lübeck-Sanity), `map-schema-check.py --all --strict` |
| 3 | Tests | `src/logic/mapData.test.ts`: beide Pakete laden via `loadMap` vollständig | Erledigt | `loads complete MapPack objects for muenster and luebeck` |
| 4 | Tests | `src/logic/mapData.test.ts`: Münster-Strukturmetriken (45–60 Knoten, 90–110 Kanten, Ø-Grad 3–4, zusammenhängend) | Erledigt | `has 45-60 nodes and ~90-110 edges`, `average node degree`, `is connected` |
| 5 | Tests | `src/logic/mapData.test.ts`: Kategorieabdeckung + beide Kantentypen (Münster) | Erledigt | `multiple candidate nodes for every mission category`, `uses both edge types` |
| 6 | Tests | `src/logic/mapData.test.ts`: Settings-Format beider Karten (`{suggested,min,max}` bzw. Skalare/Gruppen) | Erledigt | `keeps range settings in {suggested, min, max} form`, `carries the Muenster balancing defaults` |
| 7 | Tests | `src/logic/mapData.test.ts`: Missionskriterien-Erfüllbarkeit Münster (Tripel, Paardistanz ≥3, Folge 3–8, Budget 18/22, Sabotage-Umweg) | Erledigt | `distance-compliant target triples`, `full route within the mission budget`, `sabotage detour within the sabotage budget` |
| 8 | Tests | `src/logic/mapData.test.ts`: Lübeck-Strukturprüfung (zusammenhängend, Kategorien, Spawn-Kandidaten nicht-leer) | Erledigt | `small but connected island map`, `covers every mission category`, `legal spawn at suggested settings` |
| 9 | Tests | `MapLoader.test.ts` um `muenster`/`luebeck` Assertions erweitern | Erledigt | `lists the bundled map packages`, `loads and validates %s` |
| 10 | Verifikation | `map-schema-check.py --all --strict`, `npm test`, `npm run coverage`, `npm run lint`, `npm run build` grün | Erledigt | `test-results.md` |
