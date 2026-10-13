# Release Notes

## Important Notes Before Update

- There are no special notices.

## What's New

- Project scaffold: Vite + React 18 + TypeScript app with feature-slice structure and a minimal app shell.
- Quality tooling: ESLint, Prettier, `tsc --noEmit`, Vitest with an enforced 70% line-coverage gate.
- Local Git hooks (`core.hooksPath` = `.githooks`) protecting `main`/`staging` and checking i18n key parity, map-package schema, stub implementations, orphaned components and the `Math.random()` ban in `src/logic/`.
- Full staging→main CI pipeline: PR quality gates, automatic `vX.Y.Z-rc.N` pre-releases on staging, promotion/backmerge PRs, release with asset repair, weekly security scan. Release asset: a single ZIP of the static build.

## Wichtige Hinweise vor dem Update

- Es gibt keine besonderen Hinweise.

## Neuerungen

- Projekt-Scaffold: Vite- + React-18- + TypeScript-App mit Feature-Slice-Struktur und minimaler App-Shell.
- Qualitätswerkzeuge: ESLint, Prettier, `tsc --noEmit`, Vitest mit erzwungenem 70-%-Zeilenabdeckungs-Gate.
- Lokale Git-Hooks (`core.hooksPath` = `.githooks`) schützen `main`/`staging` und prüfen i18n-Schlüsselparität, Kartenpaket-Schema, Stub-Implementierungen, verwaiste Komponenten und das `Math.random()`-Verbot in `src/logic/`.
- Vollständige staging→main-CI-Pipeline: PR-Qualitätsgates, automatische `vX.Y.Z-rc.N`-Prereleases auf staging, Promotion-/Backmerge-PRs, Release mit Asset-Repair, wöchentlicher Security-Scan. Release-Asset: ein ZIP des statischen Builds.
