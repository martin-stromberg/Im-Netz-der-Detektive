# Bestandsaufnahme: Rundenablauf und Spielende (Schritt 4)

Analyse des bestehenden Projektstands bezogen auf den headless-Rundenmotor
(Zwei-Phasen-Runden, Bewegungsregeln, Endbedingungen).

## Zusammenfassung

- Der Zustand-Store `useGameStore` (`src/state/gameStore.ts`) enthält bereits
  alle in `02-technisches-konzept.md` §3 geforderten Felder
  (`round`, `phase`, `activeDetectiveIndex`, `ganovePosition`,
  `detektivePositions`, `blockedEdges`, `log` u. a.) sowie eine rudimentäre,
  nicht validierende Phasenmaschine (`endGanovePhase`, `advanceDetective`,
  `endDetectivePhase`). Es fehlen: `outcome`, `roundLimit`, alle
  Bewegungs- und Endbedingungsregeln.
- `src/logic/` stellt die nötigen Bausteine: `buildGraph`/`neighbors`/
  `bfsDistances`/`distance` (`Graph.ts`), `MapPack`-Typen inkl.
  `EdgeType` (`weg`/`fahrt`) und `NodeCategory` (`flucht`) (`mapPack.ts`),
  `MapLoader.loadMap` und die Seeded-RNG `rng.ts` (einzige erlaubte
  Zufallsquelle — der Rundenmotor selbst benötigt keinen Zufall).
- Ein Modul `Movement.ts` existiert noch nicht, obwohl es in
  `02-technisches-konzept.md` §5 vorgesehen ist — es wird neu angelegt.
- Die Fixture-Karte `teststadt` (10 Knoten, `flucht`-Knoten `b`/`d`/`g`,
  `roundLimit` mit `unlimited: true`) ist für skriptgesteuerte Testpartien
  nutzbar; `startGame` akzeptiert bereits explizite Positionen.
- Test-Ausgangszustand: 111 Tests in 9 Dateien, alle erfolgreich
  (Nachweis: [tests.md](inventory/tests.md)).

## Details

- [Logik](inventory/logic.md) — `Graph.ts`, `SpawnSystem.ts`, `rng.ts`,
  `MapLoader.ts`, `mapPack.ts`
- [Modelle](inventory/models.md) — `GameState`, `MapPack` und beteiligte Typen
- [Enums](inventory/enums.md) — `GamePhase`, `EdgeType`, `NodeCategory` u. a.
- [Tests](inventory/tests.md) — Test-Ausgangszustand und bestehende Suites
