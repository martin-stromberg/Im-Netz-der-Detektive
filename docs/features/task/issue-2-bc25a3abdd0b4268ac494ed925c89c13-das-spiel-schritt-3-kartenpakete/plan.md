# Umsetzungsplan: Kartenpakete Münster und Lübeck (Schritt 3)

## Übersicht

Es werden zwei echte Kartenpakete als JSON-Dateien angelegt
(`src/data/maps/muenster.json`, `src/data/maps/luebeck.json`) sowie eine
neue Testdatei, die die geforderten Strukturmetriken und die
grundsätzliche Erfüllbarkeit der Missions-Generierungskriterien
automatisiert prüft. Es gibt **keine Code-Änderungen**: Loader
(`MapLoader`), Validator (`mapPack.ts`), Graph (`Graph.ts`) und Hook
(`map-schema-check.py`) aus Schritt 2 werden unverändert wiederverwendet.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| Münster-Topologie | Handgefertigter Graph auf realer Topografie: Innenstadt (Domplatz/Prinzipalmarkt) zentral, Schloss/Schlosspark westlich, Aasee südwestlich, Hafen südlich, Kreuzviertel südlich der Altstadt, Hbf/Bahnhofsviertel südöstlich, Mauritzviertel östlich, Geistviertel nordwestlich, Nordstadt nördlich | `01-spielkonzept.md` §8 schreibt handgefertigte Karten auf Basis echter Topografie vor (volle Designkontrolle; OSM-Extraktion explizit später) |
| Koordinatensystem | `viewBox "0 0 1000 800"` (Münster) bzw. `"0 0 800 600"` (Lübeck), `x` = Ost, `y` = Süd (SVG-Konvention); Orte liegen in erkennbarer realer relativer Anordnung | Schema verlangt abstraktes SVG-Koordinatensystem; Anforderung verlangt „plausible `x`/`y` auf echter Topografie" |
| `fahrt`-Kanten | ~5–8 Kanten entlang Bus-/Bahn-Achsen: Hbf ↔ Innenstadt ↔ Hafen, Hbf ↔ Weseler Straße, Hbf ↔ Wolbecker Straße, Innenstadt ↔ Schlossplatz | `fahrt` = seltene Fernverbindungen, vorhersagbar (§2); `weg` bleibt dicht |
| Fluchtpunkte | Randknoten: `hbf`, `zob`, `hafenpier`, `weseler_strasse` (A43-Nord), `kinderhaus`, `hiltrup` (Süd) | §8: wenige Randknoten als Fluchtpunkte; reale Ausfallrichtungen |
| Kategorie-Verteilung | `diebstahl` konzentriert in Innenstadt/Schlosspark (Museen, Kirchen, Kaufhäuser), `kontakt` verteilt (Aasee, Hafen, Märkte, Bahnhofsumfeld), `sabotage` auf Infrastruktur (Polizeipräsidium, Stadtwerke, WDR-Studio, Landgericht), `flucht` nur Randknoten — je Kategorie ≥ 5 Knoten | Missions-Pools je Kategorie; Distanzkriterien verlangen genügend weit gestreute Kandidaten |
| Lübeck-Unbalance | Kleine Insel (~20 Knoten), hoher Knotengrad auf engem Raum + ungewöhnlich viele Fluchtpunkte (Holstentor, Burgtor, Hbf über Brücke, Mühlentor) + enge Settings-Bereiche (viele Kameras/Detektive relativ zur Knotenzahl, `minDistanceToDetective` 2) | „Bewusst unbalanciert" laut Anforderung; strukturell anderes Paket testet Loader/Settings gegen zweite Realität |
| Test-Struktur | Eine neue Datei `src/logic/mapData.test.ts`: parametrisiert über beide Pakete (Schema-/Metrik-Tests) + Münster-spezifische Missionskriterien-Tests; nutzt `loadMap`, `buildGraph`, `bfsDistances` | Kein neues Produktivmodul nötig; Kriterien sind Eigenschaften des Graphs, nicht einer Engine — Test direkt auf Daten/Graph |

## Programmabläufe

### Laden eines Kartenpakets (Bestand, unverändert)

1. `import.meta.glob("../data/maps/*.json", { eager: true })` in
   `MapLoader.ts` nimmt `muenster.json`/`luebeck.json` beim Build in die
   Registry auf.
2. `loadMap("muenster")` liest aus der Registry und ruft
   `validateMapPack` → liefert `MapPack` oder wirft
   `MapValidationError`.

Beteiligte Klassen/Komponenten: `MapLoader`, `mapPack` (`validateMapPack`,
`MapValidationError`).

### Missionskriterien-Erfüllbarkeit (nur Test, keine Engine)

1. Test lädt `muenster` via `loadMap`, baut `buildGraph`.
2. Pro Kategorie-Knotenmenge: BFS-Distanzmatrix via `bfsDistances`.
3. Geprüft wird: Existenz von Kandidaten-Tripeln (Diebstahl d,
   Kontakt k, Flucht f) mit `dist(d,k) ∈ [minGap, maxGap]` für
   aufeinanderfolgende Ziele, Paardistanz aller Ziele ≥ `minGap`,
   Fluchtpunkt ≥ 4 vom Kontaktziel, Route `dist(start,d)+dist(d,k)+dist(k,f)+3`
   ≤ `routeBudget` bzw. mit Sabotage ≤ `routeBudgetSabotage`
   (Sabotage-Umweg-Bedingung aus `01-spielkonzept.md` §5.2).

Beteiligte Klassen/Komponenten: `MapLoader`, `Graph`, `mapData.test.ts`.

## Neue Klassen

Keine. Neue Dateien sind Datendateien und eine Testdatei:

| Datei | Typ | Zweck |
|--------|-----|-------|
| `src/data/maps/muenster.json` | Daten (MapPack-JSON) | Hauptkarte Münster, ~50–55 Knoten |
| `src/data/maps/luebeck.json` | Daten (MapPack-JSON) | Validierungskarte Lübeck-Altstadtinsel, ~18–22 Knoten, unbalanciert |
| `src/logic/mapData.test.ts` | Test | Strukturmetriken + Missionskriterien-Erfüllbarkeit beider/der Münster-Karte |

## Änderungen an bestehenden Klassen

Keine. `MapLoader.test.ts` wird nur um Assertions für `muenster`/`luebeck`
in den bestehenden `listMapIds`/`loadMap`-Tests ergänzt (gleiche Datei,
gleiche Muster).

## Datenbankmigrationen

Keine.

## Validierungsregeln

Keine neuen Validierungsregeln — die Kartendaten müssen das bestehende
Schema erfüllen; `validateMapPack` und `map-schema-check.py` prüfen es
bereits. Die neuen Tests dokumentieren zusätzliche fachliche Invarianten
(Metriken, Missionskriterien), die nicht Teil des Schemas sind.

## Konfigurationsänderungen

Keine — die Settings sind Inhalt der Kartenpakete selbst (Münster-Werte
aus `04-balancing.md`; Lübeck bewusst abweichend).

## Seiteneffekte und Risiken

- **`MapLoader`/`listMapIds`:** `listMapIds()` liefert künftig
  `["luebeck", "muenster", "teststadt"]`; der bestehende Test nutzt
  `toContain`, bricht nicht.
- **Bundle-Größe:** zwei zusätzliche statisch gebündelte JSON-Dateien —
  vernachlässigbar.
- **`gameStore`/`SpawnSystem`:** unberührt; `assignSpawns` wird erst in
  späteren Schritten gegen die Karten laufen (die Spawn-Tests laufen
  weiterhin gegen `teststadt`).
- **Risiko Unbalance Lübeck:** `pickGanoveSpawn` könnte bei
  unglücklicher Detektivaufstellung keinen Kandidaten finden — der
  Missions-/Spawn-Test prüft für Lübeck nur Schema/Metriken, nicht die
  Missionskriterien (Anforderung verlangt Erfüllbarkeit nur für Münster);
  für Lübeck wird zusätzlich geprüft, dass `ganoveSpawnChoices` bei der
  Suggested-Konfiguration nicht-leer bleibt.

## Umsetzungsreihenfolge

1. **`src/data/maps/muenster.json` erstellen**
   - Voraussetzungen: Schema aus `mapPack.ts`, Münster-Settings aus
     `04-balancing.md` (alles vorhanden).
   - Beschreibung: ~50–55 Knoten in 8 Zonen (innenstadt, schlosspark,
     geist, aasee, kreuzviertel, hafen, bahnhofsviertel, mauritzviertel,
     nordstadt) mit realen Orten und plausiblen Koordinaten; ~95–105
     `weg`-Kanten entlang realer Nachbarschaft + ~5–8 `fahrt`-Kanten
     (Bus-/Bahn-Achsen); `spawnRules` (detectives `choice` mit echten
     Knoten-IDs, ganove `free` + `minDistanceToDetective` 3); `settings`
     exakt nach Münster-Startwerten.

2. **`src/data/maps/luebeck.json` erstellen**
   - Voraussetzungen: Schema aus `mapPack.ts` (vorhanden).
   - Beschreibung: ~18–22 Knoten Altstadtinsel mit echten Orten
     (Holstentor, Marienkirche, Rathaus, Dom, Burgtor, Salzspeicher,
     Trave-Ufer u. a.), Brücken als Chokepoints, eigene Zonen
     (westend/altstadt/mitte/suedend/inselnord o. ä.), unbalancierte
     Settings (z. B. `eventMode` `cycle`, höhere Kameradichte relativ
     zur Kartengröße, `minDistanceToDetective` 2), eigene Spawn-Regeln.

3. **`src/logic/mapData.test.ts` schreiben**
   - Voraussetzungen: Schritte 1–2, `loadMap`/`buildGraph`/`bfsDistances`
     (vorhanden).
   - Beschreibung: (a) beide Pakete laden via `loadMap` vollständig;
     (b) Münster-Metriken: 45–60 Knoten, 90–110 Kanten, Ø-Grad 3–4,
     zusammenhängend, je Kategorie mehrere Knoten, ≥1 `fahrt`-Kante,
     ≥1 `weg`-Kante; (c) Settings-Format beider Karten (Range-Objekte
     `suggested`/`min`/`max` bzw. `unlimited`, Skalare, Gruppenfelder);
     (d) Münster-Missionskriterien: Kandidatenpools je Kategorie,
     Existenz erfüllbarer Ziel-Tripel inkl. Sabotage-Variante und
     Routenbudgets 18/22; (e) Lübeck: zusammenhängend, Schema valide
     (via `loadMap`), `ganoveSpawnChoices` nicht-leer.

4. **`MapLoader.test.ts` ergänzen**
   - Voraussetzungen: Schritte 1–2.
   - Beschreibung: `listMapIds` enthält `muenster`/`luebeck`;
     `loadMap("muenster")`/`loadMap("luebeck")` liefern Pakete mit
     korrekter `id`.

5. **Verifikation**
   - Voraussetzungen: Schritte 1–4.
   - Beschreibung: `python .githooks/map-schema-check.py --all --strict`,
     `npm test`, `npm run coverage` (Schwelle 70 %), `npm run lint`,
     `npm run build` — alle grün.

## Tests

### Neue Tests

| Test / Hilfsmethode | Testklasse | Was wird geprüft / bereitgestellt? |
|--------------------|------------|-------------------------------------|
| `loadMap returns complete packages for both maps` | `mapData.test.ts` | `loadMap("muenster")`/`loadMap("luebeck")`: vollständige `MapPack`-Objekte (Felder vorhanden, `id` korrekt) |
| `muenster has 45-60 nodes and 90-110 edges` | `mapData.test.ts` | Knoten-/Kantenkorridor |
| `muenster average node degree is 3-4` | `mapData.test.ts` | Ø-Grad aus `buildGraph` |
| `muenster graph is connected` | `mapData.test.ts` | BFS vom ersten Knoten erreicht alle Knoten |
| `every category has multiple candidates` | `mapData.test.ts` | ≥ 4 Knoten je `NodeCategory` (genug Pool für Auswahl mit Distanzregeln) |
| `muenster has both edge types` | `mapData.test.ts` | ≥ 1 `weg`, ≥ 1 `fahrt` (sowie `fahrt`-Anteil klein) |
| `both maps satisfy settings format` | `mapData.test.ts` | Range-Objekte/Scalar/Gruppen konsistent (doppelt zu Schema, aber fachlich: `suggested` im Bereich, Münster-Startwerte exakt) |
| `muenster mission criteria are feasible` | `mapData.test.ts` | Existenz von Tripeln (Diebstahl, Kontakt, Flucht): Paardistanz ≥ 3, Folgedistanz 3–8, Flucht ≥ 4 vom Kontakt, Route + 3 ≤ 18 |
| `muenster sabotage detour is feasible` | `mapData.test.ts` | Existenz Sabotage-Kandidat: `dist(k,s)+dist(s,f) ≤ dist(k,f)+4` und Gesamtroute ≤ 22 |
| `luebeck is structurally different but valid` | `mapData.test.ts` | Zusammenhängend, kleiner (< 25 Knoten), alle Kategorien vertreten, Spawn-Kandidaten nicht-leer |
| `listMapIds / loadMap assertions` | `MapLoader.test.ts` (erweitert) | IDs `muenster`/`luebeck` enthalten und ladbar |

### Betroffene bestehende Tests

| Test / Testklasse | Grund der Anpassung |
|-------------------|---------------------|
| `listMapIds` (`MapLoader.test.ts`) | Ergänzung um `muenster`/`luebeck` |

### E2E-Tests (primärer Funktionsnachweis)

Keine E2E-Tests erforderlich: Die Anforderung berührt keinen Benutzerfluss
— es werden ausschließlich Datendateien und automatisierte
Daten-/Strukturtests erstellt. Es gibt keine UI-Interaktion (Kartenauswahl
und Spielfeld-Rendering sind spätere Schritte); der Nachweis erfolgt über
Loader-Validierung und die Metrik-Tests, die exakt die geforderten
Akzeptanzkriterien automatisieren.

## Offene Punkte

Keine.
