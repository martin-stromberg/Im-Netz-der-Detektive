# Release Notes

## Important Notes Before Update

- There are no special notices.

## What's New

- Complete headless round engine: two-phase rounds (ganove first, then detectives in fixed order), all movement rules including forced movement and blocked edges, an immediate catch check after every single detective move, and all five endings — catch, surrounded, escape, round limit (incl. „unlimited") and draw via `abortAsDraw()`. The ganove's action round and the mission-bound escape are prepared as hooks (`ganoveCanAct`, `ganoveAction`, `setEscapeNodeIds`).
- Two real playable map packages: the main map **Münster** (59 real, recognisable places on an approximated topography, 101 edges with dense `weg` links plus a few `fahrt` bus/rail axes, Muenster balancing defaults and spawn rules) and the deliberately unbalanced **Lübeck Altstadt island** (22 places, 39 edges, bridge chokepoints, its own zones/settings/spawn rules) as the validation map. Both load via `loadMap(id)` with no hardcoding.
- Automated map-quality suite (`mapData.test.ts`): structural metrics (node/edge corridors, average degree, connectivity, category coverage, edge types) and mission-generation feasibility (pairwise distances, route budgets 18/22, sabotage detour) are now asserted against the shipped graphs.
- Headless game-engine core: map-package loader and full runtime validator (`loadMap(id)`), graph basics (neighbourhoods, BFS edge distances), central seeded RNG as the single source of randomness, and the spawn system (choice/free/random, detectives before the ganove, minimum distance rule).
- Headless game-state store with the specified fields (round, phase, positions, mission, events, cameras, blocked edges, event mode, tension, seed, log) and imperative actions.
- Valid `teststadt` fixture map package for engine tests.
- Project scaffold: Vite + React 18 + TypeScript app with feature-slice structure and a minimal app shell.
- Quality tooling: ESLint, Prettier, `tsc --noEmit`, Vitest with an enforced 70% line-coverage gate.
- Local Git hooks (`core.hooksPath` = `.githooks`) protecting `main`/`staging` and checking i18n key parity, map-package schema, stub implementations, orphaned components and the `Math.random()` ban in `src/logic/`.
- Full staging→main CI pipeline: PR quality gates, automatic `vX.Y.Z-rc.N` pre-releases on staging, promotion/backmerge PRs, release with asset repair, weekly security scan. Release asset: a single ZIP of the static build.

## Wichtige Hinweise vor dem Update

- Es gibt keine besonderen Hinweise.

## Neuerungen

- Kompletter headless-Rundenmotor: Zwei-Phasen-Runden (zuerst der Ganove, dann die Detektive in fester Reihenfolge), alle Bewegungsregeln inklusive Zugzwang und Kantensperrungen, Sofort-Fangprüfung nach jedem einzelnen Detektivzug und alle fünf Endbedingungen — Fang, Umzingelung, Flucht, Zeitlimit (inklusive „unbegrenzt") und Remis via `abortAsDraw()`. Die Aktionsrunde des Ganoven und die missionsgebundene Flucht sind als Hooks vorbereitet (`ganoveCanAct`, `ganoveAction`, `setEscapeNodeIds`).
- Zwei echte, spielbare Kartenpakete: die Hauptkarte **Münster** (59 echte, wiedererkennbare Orte auf angenäherter Topografie, 101 Kanten mit dichtem `weg`-Netz plus weniger `fahrt`-Fernverbindungen, Münster-Balancing-Defaults und Spawn-Regeln) und die bewusst unbalancierte **Lübecker Altstadtinsel** (22 Orte, 39 Kanten, Brücken-Engpässe, eigene Zonen/Settings/Spawn-Regeln) als Validierungskarte. Beide laden ohne Hartcodierung über `loadMap(id)`.
- Automatisierte Karten-Qualitätssuite (`mapData.test.ts`): Strukturmetriken (Knoten-/Kantenkorridor, Ø-Knotengrad, Zusammenhang, Kategorieabdeckung, Kantentypen) und Missionskriterien-Erfüllbarkeit (Paardistanzen, Routenbudgets 18/22, Sabotage-Umweg) werden gegen die ausgelieferten Graphen abgesichert.
- Headless-Spielkern: Kartenpaket-Loader mit vollständiger Laufzeit-Validierung (`loadMap(id)`), Graph-Grundfunktionen (Nachbarschaften, BFS-Kantendistanzen), zentraler Seeded-RNG als einzige Zufallsquelle und Startaufstellungs-System (choice/free/random, Detektive vor Ganove, Mindestabstand-Regel).
- Headless-fähiger Spielzustand-Store mit den spezifizierten Feldern (Runde, Phase, Positionen, Mission, Ereignisse, Kameras, gesperrte Kanten, Ereignismodus, Spannungswert, Seed, Log) und imperativen Actions.
- Gültiges `teststadt`-Fixture-Kartenpaket für Engine-Tests.
- Projekt-Scaffold: Vite- + React-18- + TypeScript-App mit Feature-Slice-Struktur und minimaler App-Shell.
- Qualitätswerkzeuge: ESLint, Prettier, `tsc --noEmit`, Vitest mit erzwungenem 70-%-Zeilenabdeckungs-Gate.
- Lokale Git-Hooks (`core.hooksPath` = `.githooks`) schützen `main`/`staging` und prüfen i18n-Schlüsselparität, Kartenpaket-Schema, Stub-Implementierungen, verwaiste Komponenten und das `Math.random()`-Verbot in `src/logic/`.
- Vollständige staging→main-CI-Pipeline: PR-Qualitätsgates, automatische `vX.Y.Z-rc.N`-Prereleases auf staging, Promotion-/Backmerge-PRs, Release mit Asset-Repair, wöchentlicher Security-Scan. Release-Asset: ein ZIP des statischen Builds.
