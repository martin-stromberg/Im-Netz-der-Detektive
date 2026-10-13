# Tasks: Entwicklungsschritt 1 — Projekt-Scaffold und Qualitätsinfrastruktur

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Toolchain | `package.json` mit Skripten `dev`, `build`, `test`, `lint`, `format`, `format:check`, `typecheck`, `coverage`, `release` und allen Dependencies/DevDependencies (React 18, zustand, Vite, TS, Vitest+Coverage, ESLint-Stack, Prettier, semantic-release-Stack) anlegen | Erledigt | `npm ci`/`npm test` lokal grün |
| 2 | Toolchain | `tsconfig.json` (strict, `jsx: react-jsx`, `resolveJsonModule`, include `src` + `vite.config.ts`) anlegen | Erledigt | `npm run typecheck` grün |
| 3 | Toolchain | `vite.config.ts` mit React-Plugin und Vitest-Coverage (v8, `thresholds.lines: 70`, include/exclude) anlegen | Erledigt | `npm run coverage` grün (100 % Zeilen) |
| 4 | Toolchain | `eslint.config.js` (Flat Config: js + typescript-eslint + react-hooks + react-refresh + eslint-config-prettier) anlegen | Erledigt | `npm run lint` grün |
| 5 | Toolchain | `.prettierrc` und `.prettierignore` anlegen | Erledigt | `npm run format:check` grün |
| 6 | Toolchain | `index.html` (Vite-Einstieg auf `/src/main.tsx`) anlegen | Erledigt | `npm run build` grün |
| 7 | Toolchain | `.gitignore` um Node/Vite-Einträge ergänzen (`issue.md` bleibt) | Erledigt | `git status` zeigt `node_modules/`/`dist/`/`coverage/` als ignored |
| 8 | Toolchain | `npm install` ausführen, `package-lock.json` erzeugen | Erledigt | `npm ci` clean erfolgreich |
| 9 | App-Shell | `src/main.tsx` (StrictMode-Bootstrap) anlegen | Erledigt | `npm run build` grün |
| 10 | App-Shell | `src/App.tsx` + `src/App.module.css` (Shell mit i18n-Texten, `PlaceholderPanel`, Rundenanzeige aus Store) anlegen | Erledigt | `App.test.tsx` (renderToString) |
| 11 | App-Shell | `src/vite-env.d.ts` anlegen | Erledigt | `npm run typecheck` grün |
| 12 | Komponenten | `src/components/PlaceholderPanel.tsx` + `.module.css` anlegen | Erledigt | `App.test.tsx` (enthält Placeholder-Text) |
| 13 | Logik | `src/logic/placeholder.ts` (`advanceRound`) anlegen | Erledigt | `placeholder.test.ts` |
| 14 | State | `src/state/gameStore.ts` (Zustand-Store `round`/`advanceRound`, headless) anlegen | Erledigt | `gameStore.test.ts` |
| 15 | Daten | `src/data/maps/.gitkeep` anlegen | Erledigt | Kein direkter Test |
| 16 | i18n | `src/i18n/de.json` + `src/i18n/en.json` mit parallelen Schlüsseln anlegen | Erledigt | `i18n-check.py` (Parität) + `App.test.tsx` |
| 17 | i18n | `src/i18n/index.ts` (`t()`-Helper mit Interpolation) anlegen | Erledigt | `App.test.tsx`, Coverage 100 % |
| 18 | Tests | `src/logic/placeholder.test.ts` schreiben | Erledigt | 2 Tests grün |
| 19 | Tests | `src/state/gameStore.test.ts` (headless) schreiben | Erledigt | 2 Tests grün |
| 20 | Tests | `src/App.test.tsx` (`renderToString`-Smoke-Test) schreiben | Erledigt | 2 Tests grün |
| 21 | Release-Tooling | `scripts/resolve-release-version.mjs` (Klassifikation, Existenz-/Asset-Prüfung, Repair-Fallback, Prerelease-Guard, `GITHUB_OUTPUT`) erstellen | Erledigt | `resolve-release-version.test.mjs` (18 Tests) |
| 22 | Release-Tooling | `scripts/resolve-release-version.test.mjs` (inkl. Prerelease-Guard-Regression) schreiben | Erledigt | 18 Tests grün |
| 23 | Release-Tooling | `release.config.js` (conventionalcommits, Assets via `RELEASE_ASSET_PATH`, `successComment`/`failComment: false`, Dry-Run-Plugins) erstellen | Erledigt | `node -e import(...)`-Ladetest, Plugin-Anzahl verifiziert |
| 24 | Git-Hooks | `.githooks/pre-commit` (Branch-Block + blockierende i18n-/Map-/Random-Checks + warnende Stub-/Usage-Checks) erstellen | Erledigt | Commit-Block auf `main` im Worktree nachgewiesen (exit 1); grüner Lauf auf Feature-Branch |
| 25 | Git-Hooks | `.githooks/pre-push` (Push-Block `main`/`staging` + `--all --strict`-Audit aller fünf Checks) erstellen | Erledigt | simulierte Stdin: Push auf `main`/`staging` → exit 1, Feature-Push → exit 0 |
| 26 | Git-Hooks | `.githooks/install-hooks.sh` + `install-hooks.cmd` (`core.hooksPath`) erstellen | Erledigt | `install-hooks.sh` ausgeführt, `git config core.hooksPath` = `.githooks` |
| 27 | Git-Hooks | `.githooks/no-stub-check.py` (TS-Stub-Erkennung) erstellen | Erledigt | Negativ-Test: Stub erkannt (warn), `--strict` exit 1 |
| 28 | Git-Hooks | `.githooks/i18n-check.py` (de↔en-Parität + verwendete Schlüssel) erstellen | Erledigt | Negativ-Test: undefinierter Schlüssel + Paritätsbruch → exit 1 |
| 29 | Git-Hooks | `.githooks/component-usage-check.py` (ungenutzte `.tsx`) erstellen | Erledigt | Negativ-Test: Orphan erkannt (warn), `--strict` exit 1 |
| 30 | Git-Hooks | `.githooks/map-schema-check.py` (Kartenpaket-Schema `src/data/maps/*.json`) erstellen | Erledigt | Negativ-Test: Schema-Verletzungen exit 1; Positiv-Test: valides Paket exit 0 |
| 31 | Git-Hooks | `.githooks/no-math-random-check.py` (`Math.random`-Verbot `src/logic/**`) erstellen | Erledigt | Negativ-Test: `Math.random()` erkannt → exit 1 |
| 32 | CI | `.github/workflows/verify-pr-source.yml` erstellen | Erledigt | YAML-valide |
| 33 | CI | `.github/workflows/pr-staging-ci.yml` (detect-backmerge, parallele `static checks`/`build & test`, `no pending backmerge`, `back-merge-skip`, 70-%-Gate) erstellen | Erledigt | YAML-valide; Gate via `npm run coverage` |
| 34 | CI | `.github/workflows/staging-ci.yml` (gleiche Gates + `version`/`prerelease` für `vX.Y.Z-rc.N`) erstellen | Erledigt | YAML-valide; `rc_version`→`release-version` verdrahtet |
| 35 | CI | `.github/workflows/staging-to-main-promotion.yml` (`workflow_run` auf `Pre-Release`) erstellen | Erledigt | YAML-valide |
| 36 | CI | `.github/workflows/sync-staging-with-main.yml` (Backmerge-PR bei Push auf `main`) erstellen | Erledigt | YAML-valide |
| 37 | CI | `.github/workflows/release.yml` (Push `main` + Tag `v*.*.*`, resolve-Version, Release-Gate, create/upload-existing) erstellen | Erledigt | YAML-valide |
| 38 | CI | `.github/workflows/security-scan.yml` (wöchentlicher Cron + `workflow_dispatch`) erstellen | Erledigt | YAML-valide |
| 39 | CI | `.github/actions/build-and-package/action.yml` (`npm ci` + `npm run build` + `release.zip`) erstellen | Erledigt | YAML-valide; `npm run build` lokal grün |
| 40 | CI | `.github/actions/security-scan/action.yml` (`npm audit`, blockierend, Report-Upload) erstellen | Erledigt | YAML-valide; `npm audit --omit=dev` lokal exit 0 |
| 41 | Verifikation | `npm ci`, `npm run build`, `npm test`, `npm run coverage`, `npm run lint`, `npm run format:check`, `npm run typecheck` lokal grün | Erledigt | alle Befehle exit 0; 24 Tests, 100 % Zeilen |
| 42 | Verifikation | Hooks via Install-Skript aktiviert; `pre-push`-Block auf `main`/`staging` lokal nachgewiesen; alle Check-Skripte verifiziert | Erledigt | alle Checks positiv + negativ getestet |
| 43 | Verifikation | Alle sieben Workflows + zwei Composite Actions YAML-valide | Erledigt | PyYAML-Validierung aller 9 Dateien |
