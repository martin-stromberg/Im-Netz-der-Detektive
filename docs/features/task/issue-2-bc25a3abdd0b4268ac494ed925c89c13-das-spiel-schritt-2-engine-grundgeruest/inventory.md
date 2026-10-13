# Bestandsaufnahme: Engine-Grundgerüst (Kartenpakete, Graph, RNG, Startaufstellung, State)

Analyse des bestehenden Scaffold-Stands (Schritt 1) bezogen auf die
Anforderung `requirement.md`: headless-fähiger Spielkern mit
Kartenpaket-Loader/-Validator, Graph-Grundfunktionen, Seeded-RNG,
Spawn-System und erweitertem Zustand-Store.

## Zusammenfassung

- **Vorhanden:**
  - Zustand-Store `useGameStore` (`src/state/gameStore.ts`) — bisher nur
    Feld `round` und Action `advanceRound`; bereits bewusst
    headless-fähig kommentiert, aber noch nicht mit den spezifizierten
    State-Feldern.
  - i18n-Helper `t()` (`src/i18n/index.ts`) + `de.json`/`en.json`
    (Parität durch Hook geprüft).
  - App-Shell `src/App.tsx` + `PlaceholderPanel.tsx` (rendert `round`
    aus dem Store; `App.test.tsx` verlangt „Runde 1").
  - Vitest mit erzwungener 70-%-Zeilenabdeckung (`vite.config.ts`).
  - Git-Hooks unter `.githooks/`, u. a. `map-schema-check.py`
    (vollständige Kartenpaket-Schema-Definition, siehe
    [Schema](inventory/schema.md)), `no-math-random-check.py`
    (`Math.random()`-Verbot in `src/logic/`), `no-stub-check.py`,
    `component-usage-check.py`, `i18n-check.py`.
  - `src/data/maps/` existiert mit `.gitkeep`, keine Pakete vorhanden.
- **Fehlt offensichtlich:**
  - `MapPack`-Typsystem und Laufzeit-Validierung.
  - `MapLoader.ts` mit `loadMap(id)` (spec §5 verlangt dieses Modul).
  - Graph-Modul mit Nachbarschaften + BFS-Distanzen.
  - `rng.ts` als zentrale Seeded-RNG-Quelle (spec §5 benennt mulberry32
    als Beispiel).
  - `SpawnSystem.ts` (choice/free/random, Detektive-vor-Ganove).
  - Alle spezifizierten Store-Felder außer `round` (`phase`,
    Positionen, `mission`, `events`, `cameras`, `blockedEdges`,
    `eventMode`, `tensionValue`, `seed`, `log`).
  - Test-Kartenpakete unter `src/data/maps/`.

Test-Ausgangszustand: `npm test` (vitest run) — 4 Testdateien,
25 Tests, **alle erfolgreich**, keine bekannten Fehlschläge. Nachweis:
[tests.md](inventory/tests.md), Log:
[test-results/baseline-npm-test.txt](inventory/test-results/baseline-npm-test.txt).

## Details

- [Datenmodell / State](inventory/models.md)
- [Logik](inventory/logic.md)
- [Kartenpaket-Schema (Hook-Definition)](inventory/schema.md)
- [Tests](inventory/tests.md)
