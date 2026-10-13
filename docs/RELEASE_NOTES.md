# Release Notes

## Important Notes Before Update

- There are no special notices.

## What's New

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

- Headless-Spielkern: Kartenpaket-Loader mit vollständiger Laufzeit-Validierung (`loadMap(id)`), Graph-Grundfunktionen (Nachbarschaften, BFS-Kantendistanzen), zentraler Seeded-RNG als einzige Zufallsquelle und Startaufstellungs-System (choice/free/random, Detektive vor Ganove, Mindestabstand-Regel).
- Headless-fähiger Spielzustand-Store mit den spezifizierten Feldern (Runde, Phase, Positionen, Mission, Ereignisse, Kameras, gesperrte Kanten, Ereignismodus, Spannungswert, Seed, Log) und imperativen Actions.
- Gültiges `teststadt`-Fixture-Kartenpaket für Engine-Tests.
- Projekt-Scaffold: Vite- + React-18- + TypeScript-App mit Feature-Slice-Struktur und minimaler App-Shell.
- Qualitätswerkzeuge: ESLint, Prettier, `tsc --noEmit`, Vitest mit erzwungenem 70-%-Zeilenabdeckungs-Gate.
- Lokale Git-Hooks (`core.hooksPath` = `.githooks`) schützen `main`/`staging` und prüfen i18n-Schlüsselparität, Kartenpaket-Schema, Stub-Implementierungen, verwaiste Komponenten und das `Math.random()`-Verbot in `src/logic/`.
- Vollständige staging→main-CI-Pipeline: PR-Qualitätsgates, automatische `vX.Y.Z-rc.N`-Prereleases auf staging, Promotion-/Backmerge-PRs, Release mit Asset-Repair, wöchentlicher Security-Scan. Release-Asset: ein ZIP des statischen Builds.
