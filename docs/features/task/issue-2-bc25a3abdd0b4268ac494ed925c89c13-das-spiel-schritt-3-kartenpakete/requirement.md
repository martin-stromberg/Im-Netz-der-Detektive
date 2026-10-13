# Übersetzte Anforderung: Kartenpakete Münster und Lübeck (Entwicklungsschritt 3)

## Fachliche Zusammenfassung

Es werden die beiden echten, spielbaren Kartenpakete des Prototyp-Scope
erstellt: die Hauptkarte **Münster** (~50 Knoten auf realer Topografie mit
echten, wiedererkennbaren Orten) und die kleine, bewusst unbalancierte
**Lübeck-Altstadtinsel** als Validierungskarte. Beide Pakete liegen als JSON
unter `src/data/maps/`, werden ohne Hartcodierung über `loadMap(id)` geladen
und gegen das Kartenpaket-Schema (`validateMapPack` /
`.githooks/map-schema-check.py`) validiert. Zusätzlich werden automatisierte
Tests geschrieben, die die geforderten Strukturmetriken und die grundsätzliche
Erfüllbarkeit der Missions-Generierungskriterien auf dem Münster-Graphen
absichern.

## Betroffene Klassen und Komponenten

- **Neue Datendateien:**
  - `src/data/maps/muenster.json` — Hauptkarte, 45–60 Knoten, ~90–110 Kanten.
  - `src/data/maps/luebeck.json` — Validierungskarte, ~15–25 Knoten, bewusst
    unbalanciert.
- **Neue Tests:**
  - Strukturmetriken-Test (Knoten-/Kantenzahl, Ø-Knotengrad 3–4,
    Zusammenhang, Kategorieabdeckung, mind. eine `fahrt`-Kante).
  - Missionskriterien-Erfüllbarkeits-Test (Kandidaten je Kategorie,
    BFS-Distanzstruktur: Paardistanz ≥ 3, Folgedistanz 3–8, Routenbudget
    18/22 erreichbar).
  - Loader-Test-Erweiterung (`loadMap("muenster")`, `loadMap("luebeck")`,
    `listMapIds`).
- **Unverändert wiederverwendet:** `src/logic/mapPack.ts` (Typen +
  `validateMapPack`), `src/logic/MapLoader.ts` (`loadMap`/`listMapIds` via
  `import.meta.glob`), `src/logic/Graph.ts` (`buildGraph`, `bfsDistances`,
  `distance`), `.githooks/map-schema-check.py`.
- **Keine Änderungen an:** UI-Komponenten, `gameStore`, `SpawnSystem`,
  `rng`, Doc-Viewer `docs/konzept/`.

## Implementierungsansatz

- **Münster-Graph:** Handgefertigt auf Basis echter Topografie
  (Domplatz/Prinzipalmarkt zentral; Aasee südwestlich; Hafen südlich;
  Hauptbahnhof südöstlich der Innenstadt; Schloss westlich). `weg`-Kanten
  folgen grob realer Nachbarschaft; `fahrt`-Kanten bilden Bus-/Bahn-Achsen
  ab (z. B. Hbf ↔ Innenstadt ↔ Hafen). Abstraktes Koordinatensystem für
  SVG-Rendering mit `viewBox`; Koordinaten spiegeln die reale relative
  Anordnung.
- **Kategorien/Zonen:** Jeder Knoten trägt `categories` aus
  `diebstahl|kontakt|sabotage|flucht` (je Kategorie mehrere Knoten, damit
  die Missionsgenerierung Kandidatenpools hat) sowie eine `zone`.
- **Settings Münster:** `detectiveCount` 4 (2–6), `cameraCount` 8 (0–15),
  `roundLimit` 30 (min 15, `unlimited: true`), `radioHintCount` 5 (3–10),
  `edgeBlockRounds` 3 (1–6), `cameraMinGap` 2, `hintZoneRadius` 2,
  `eventMode` `tension`, `eventDefaults` cycle 4 / chance 0.25 /
  threshold 40 / perRound 10, `eventMix` 0.25/0.45/0.30, `missionRules`
  minGap 3 / maxGap 8 / routeBudget 18 / routeBudgetSabotage 22 /
  sabotageDetour 4, `sabotageEffects` alle drei, `spawnRules.ganove`
  `free` mit `minDistanceToDetective` 3, `spawnRules.detectives` `choice`
  mit echten Knoten-IDs.
- **Lübeck-Graph:** Deutlich kleiner (~15–25 Knoten), enge Altstadtinsel
  mit Brücken als Chokepoints, bewusst unbalanciert (z. B. wenig
  Ausweichoptionen, engere/andere Settings-Bereiche und Spawn-Regeln als
  Münster), eigene echte Orte (Holstentor, Marienkirche, Rathaus,
  Trave-Ufer u. a.).
- **Tests:** Vitest-Dateien unter `src/logic/` (bzw. neben den Map-Daten);
  nutzen `loadMap`, `buildGraph`, `bfsDistances`/`distance` — keine
  Hartcodierung der Map-Ids im Loader nötig (`import.meta.glob`).

## Konfiguration

Keine zusätzliche Konfiguration nötig — sämtliche map-abhängigen Werte
liegen bereits als `settings` im Kartenpaket-Schema vor.

## Offene Fragen

Keine. Die Anforderung ist durch `02-technisches-konzept.md` §4 (exaktes
Schema), `04-balancing.md` (Münster-Startwerte und Bereiche) und
`01-spielkonzept.md` §2/§8 (Topologie-Anforderungen, Prototyp-Scope)
vollständig spezifiziert. Freiheitsgrade (konkrete Ortsliste, exakte
Kantenmenge, Lübeck-Settings) liegen in der Entwurfsverantwortung und
werden im Plan festgelegt.
