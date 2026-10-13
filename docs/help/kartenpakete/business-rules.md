← [Zurück zur Übersicht](index.md)

# Kartenpakete — Business Rules

## Paket = verbindliche Schnittstelle

**Beschreibung:** Jede Stadt ist ein Kartenpaket
(`src/data/maps/<id>.json`) — Graph, `spawnRules` und `settings` sind
Eigenschaften des Pakets, nirgendwo hartkodiert. Neue Städte werden
allein durch eine neue JSON-Datei spielbar (Multi-Stadt-Fähigkeit).

**Bedingungen:**

- Das Paket muss das Schema aus `02-technisches-konzept.md` §4
  vollständig erfüllen; `loadMap(id)` und der Commit-Hook
  `map-schema-check.py` erzwingen dieselben Regeln.
- Der Graph muss zusammenhängen — jeder Ort ist von jedem anderen aus
  über das Wegenetz erreichbar (per Test abgesichert).
- `id` des Pakets entspricht dem Dateinamen (`muenster` ↔
  `muenster.json`).

**Umsetzung:** `MapLoader.loadMap`, `validateMapPack`, Hook
`.githooks/map-schema-check.py`.

## Münster — Strukturmetriken und Missionserfüllbarkeit

**Beschreibung:** Die Hauptkarte erfüllt die in `01-spielkonzept.md`
§2 festgelegten Maße sowie die messbaren Missions-Generierungskriterien
aus §5.2 — beides automatisiert geprüft.

**Bedingungen:**

- 45–60 Knoten (geliefert: 59), ~90–110 Kanten (101), Ø-Knotengrad 3–4
  (3,42), zusammenhängend.
- Beide Kantentypen: `weg` dicht (95), `fahrt` als seltene
  Fernverbindung (6 entlang Bus-/Bahn-Achsen).
- Jede Missionskategorie mehrfach vertreten: `diebstahl` 17,
  `kontakt` 32, `sabotage` 6, `flucht` 7.
- Missionskriterien sind auf dem Graphen **erfüllbar**: Es existieren
  Ziel-Tripel (Diebstahl → Kontakt → Flucht) mit Paardistanzen ≥ 3,
  Folgedistanzen 3–8, Fluchtpunkt ≥ 4 vom Kontaktziel und Gesamtroute
  (Start + Wege + 3 Aktionsrunden) ≤ 18 Züge; für die
  Sabotage-Variante bleibt der Umweg ≤ +4 und die Route ≤ 22.

**Umsetzung:** `src/data/maps/muenster.json`; geprüft durch
`src/logic/mapData.test.ts` (BFS-Distanzen via `buildGraph`/
`bfsDistances`/`distance`).

## Lübeck — bewusst unbalancierte Validierungskarte

**Beschreibung:** Die Altstadtinsel testet Loader und Settings-Bereiche
gegen ein strukturell anderes Paket: deutlich kleiner, enger,
schneller — und absichtlich nicht ausbalanciert.

**Bedingungen:**

- 22 Knoten, 39 Kanten, zusammenhängend; alle vier Kategorien vertreten
  (`diebstahl` 10, `kontakt` 7, `sabotage` 2, `flucht` 4).
- Unbalance ist gewollt: viele Fluchtpunkte relativ zur Fläche,
  `cameraMinGap` 1 (Kameras dürfen eng stehen), nur 2 statt 3
  Sabotage-Effekten, `eventMode` `cycle`, Detektive 5 (3–6) auf 22
  Knoten, `minDistanceToDetective` 2.
- Detektiv-Spawn nutzt den `zones`-Pfad (`mitte`/`sued`) — Gegenstück
  zu Münsters `nodes`-Liste; trotz Unbalance bleibt dem Ganoven bei
  Suggested-Konfiguration ein legaler Startkandidat (per Test
  abgesichert).

**Umsetzung:** `src/data/maps/luebeck.json`; geprüft durch
`src/logic/mapData.test.ts` und `MapLoader.test.ts`.

## Karteneigene Einstellwerte

**Beschreibung:** Alles, was mit Kartengröße oder Topologie skaliert,
liegt im Paket als `{suggested, min, max}` (bzw. `unlimited: true` beim
Zeitlimit) — die Map liefert Vorschlag und erlaubten Bereich, das Menü
überschreibt später innerhalb davon. Skalarfelder (`cameraMinGap`,
`hintZoneRadius`, `missionRules`, `eventMix`, `sabotageEffects`) sind
feste Karteneigenschaften.

**Bedingungen:**

- `suggested` muss innerhalb `[min, max]` liegen; `unlimited` ersetzt
  `max` nur bei `roundLimit`.
- `eventMix` summiert sich auf 1 (Anteile der Ereignistypen).

**Umsetzung:** `MapSettings` in `mapPack.ts` + Schema-Validierung.
