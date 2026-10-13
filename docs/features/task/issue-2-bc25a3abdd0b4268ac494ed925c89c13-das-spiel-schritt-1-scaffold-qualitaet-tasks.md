# Tasks: Entwicklungsschritt 1 — Projekt-Scaffold und Qualitätsinfrastruktur

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Toolchain | `package.json` mit Skripten `dev`, `build`, `test`, `lint`, `format`, `format:check`, `typecheck`, `coverage`, `release` und allen Dependencies/DevDependencies (React 18, zustand, Vite, TS, Vitest+Coverage, ESLint-Stack, Prettier, semantic-release-Stack) anlegen | Offen | — |
| 2 | Toolchain | `tsconfig.json` (strict, `jsx: react-jsx`, `resolveJsonModule`, include `src` + `vite.config.ts`) anlegen | Offen | — |
| 3 | Toolchain | `vite.config.ts` mit React-Plugin und Vitest-Coverage (v8, `thresholds.lines: 70`, include/exclude) anlegen | Offen | — |
| 4 | Toolchain | `eslint.config.js` (Flat Config: js + typescript-eslint + react-hooks + react-refresh + eslint-config-prettier) anlegen | Offen | — |
| 5 | Toolchain | `.prettierrc` und `.prettierignore` anlegen | Offen | — |
| 6 | Toolchain | `index.html` (Vite-Einstieg auf `/src/main.tsx`) anlegen | Offen | — |
| 7 | Toolchain | `.gitignore` um Node/Vite-Einträge ergänzen (`issue.md` bleibt) | Offen | — |
| 8 | Toolchain | `npm install` ausführen, `package-lock.json` erzeugen | Offen | — |
| 9 | App-Shell | `src/main.tsx` (StrictMode-Bootstrap) anlegen | Offen | — |
| 10 | App-Shell | `src/App.tsx` + `src/App.module.css` (Shell mit i18n-Texten, `PlaceholderPanel`, Rundenanzeige aus Store) anlegen | Offen | — |
| 11 | App-Shell | `src/vite-env.d.ts` anlegen | Offen | — |
| 12 | Komponenten | `src/components/PlaceholderPanel.tsx` + `.module.css` anlegen | Offen | — |
| 13 | Logik | `src/logic/placeholder.ts` (`advanceRound`) anlegen | Offen | — |
| 14 | State | `src/state/gameStore.ts` (Zustand-Store `round`/`advanceRound`, headless) anlegen | Offen | — |
| 15 | Daten | `src/data/maps/.gitkeep` anlegen | Offen | — |
| 16 | i18n | `src/i18n/de.json` + `src/i18n/en.json` mit parallelen Schlüsseln anlegen | Offen | — |
| 17 | i18n | `src/i18n/index.ts` (`t()`-Helper) anlegen | Offen | — |
| 18 | Tests | `src/logic/placeholder.test.ts` schreiben | Offen | — |
| 19 | Tests | `src/state/gameStore.test.ts` (headless) schreiben | Offen | — |
| 20 | Tests | `src/App.test.tsx` (`renderToString`-Smoke-Test) schreiben | Offen | — |
| 21 | Release-Tooling | `scripts/resolve-release-version.mjs` (Klassifikation, Existenz-/Asset-Prüfung, Repair-Fallback, Prerelease-Guard, `GITHUB_OUTPUT`) erstellen | Offen | — |
| 22 | Release-Tooling | `scripts/resolve-release-version.test.mjs` (inkl. Prerelease-Guard-Regression) schreiben | Offen | — |
| 23 | Release-Tooling | `release.config.js` (conventionalcommits, Assets via `RELEASE_ASSET_PATH`, `successComment`/`failComment: false`, Dry-Run-Plugins) erstellen | Offen | — |
| 24 | Git-Hooks | `.githooks/pre-commit` (Branch-Block + blockierende i18n-/Map-/Random-Checks + warnende Stub-/Usage-Checks) erstellen | Offen | — |
| 25 | Git-Hooks | `.githooks/pre-push` (Push-Block `main`/`staging` + `--all --strict`-Audit aller fünf Checks) erstellen | Offen | — |
| 26 | Git-Hooks | `.githooks/install-hooks.sh` + `install-hooks.cmd` (`core.hooksPath`) erstellen | Offen | — |
| 27 | Git-Hooks | `.githooks/no-stub-check.py` (TS-Stub-Erkennung) erstellen | Offen | — |
| 28 | Git-Hooks | `.githooks/i18n-check.py` (de↔en-Parität + verwendete Schlüssel) erstellen | Offen | — |
| 29 | Git-Hooks | `.githooks/component-usage-check.py` (ungenutzte `.tsx`) erstellen | Offen | — |
| 30 | Git-Hooks | `.githooks/map-schema-check.py` (Kartenpaket-Schema `src/data/maps/*.json`) erstellen | Offen | — |
| 31 | Git-Hooks | `.githooks/no-math-random-check.py` (`Math.random`-Verbot `src/logic/**`) erstellen | Offen | — |
| 32 | CI | `.github/workflows/verify-pr-source.yml` erstellen | Offen | — |
| 33 | CI | `.github/workflows/pr-staging-ci.yml` (detect-backmerge, parallele `static checks`/`build & test`, `no pending backmerge`, `back-merge-skip`, 70-%-Gate) erstellen | Offen | — |
| 34 | CI | `.github/workflows/staging-ci.yml` (gleiche Gates + `version`/`prerelease` für `vX.Y.Z-rc.N`) erstellen | Offen | — |
| 35 | CI | `.github/workflows/staging-to-main-promotion.yml` (`workflow_run` auf `Pre-Release`) erstellen | Offen | — |
| 36 | CI | `.github/workflows/sync-staging-with-main.yml` (Backmerge-PR bei Push auf `main`) erstellen | Offen | — |
| 37 | CI | `.github/workflows/release.yml` (Push `main` + Tag `v*.*.*`, resolve-Version, Release-Gate, create/upload-existing) erstellen | Offen | — |
| 38 | CI | `.github/workflows/security-scan.yml` (wöchentlicher Cron + `workflow_dispatch`) erstellen | Offen | — |
| 39 | CI | `.github/actions/build-and-package/action.yml` (`npm ci` + `npm run build` + `release.zip`) erstellen | Offen | — |
| 40 | CI | `.github/actions/security-scan/action.yml` (`npm audit`, blockierend, Report-Upload) erstellen | Offen | — |
| 41 | Verifikation | `npm ci`, `npm run build`, `npm test`, `npm run coverage`, `npm run lint`, `npm run format:check`, `npm run typecheck` lokal grün | Offen | — |
| 42 | Verifikation | Hooks via Install-Skript aktiviert; `pre-push`-Block auf `main`/`staging` lokal nachgewiesen (simulierte Stdin); alle Check-Skripte manuell verifiziert | Offen | — |
| 43 | Verifikation | Alle sieben Workflows + zwei Composite Actions YAML-valide | Offen | — |
