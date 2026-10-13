# Bestandsaufnahme: Kartenpakete Münster und Lübeck (Schritt 3)

Analysiert wurde der bestehende Stand des Kartenpaket-Formats, des Loaders,
der Graph-Engine und der Testinfrastruktur — bezogen auf die Anforderung,
zwei echte Kartenpakete (`muenster`, `luebeck`) anzulegen und deren
Strukturmetriken sowie die Erfüllbarkeit der Missionskriterien automatisiert
zu prüfen.

## Zusammenfassung

- **Vollständig vorhanden:** Das gesamte benötigte Format- und Engine-Fundament
  aus Schritt 2 — `MapPack`-Typsystem + `validateMapPack`
  (`src/logic/mapPack.ts`), `loadMap`/`listMapIds` via `import.meta.glob`
  (`src/logic/MapLoader.ts`), ungerichteter Graph mit BFS
  (`src/logic/Graph.ts`), Fixture-Karte `src/data/maps/teststadt.json`,
  gespiegelter Hook `.githooks/map-schema-check.py`.
- **Kein Code zu ändern:** Der Loader findet neue Pakete automatisch über
  `import.meta.glob("../data/maps/*.json")` — kein Hartcodieren nötig.
- **Fehlt:** Die beiden Kartendateien selbst sowie Tests für
  Strukturmetriken und Missionskriterien-Erfüllbarkeit.
- **Referenzwerte:** `04-balancing.md` liefert alle Münster-Settings;
  `02-technisches-konzept.md` §4 das exakte JSON-Schema mit Beispiel;
  `01-spielkonzept.md` §5.2 die messbaren Missionskriterien.
- **Test-Ausgangszustand:** `npm test` — 8 Dateien / 92 Tests, alle grün;
  `python .githooks/map-schema-check.py --all --strict` — 1 Paket valide
  (Details: [inventory/tests.md](inventory/tests.md)).

## Details

- [Datenmodell](inventory/models.md) — `MapPack` und Untertypen
- [Logik](inventory/logic.md) — `MapLoader`, `Graph`, `SpawnSystem`
- [Tests](inventory/tests.md) — bestehende Tests + Ausgangszustand
