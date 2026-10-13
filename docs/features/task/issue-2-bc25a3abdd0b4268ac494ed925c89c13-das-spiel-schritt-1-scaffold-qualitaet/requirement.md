# Übersetzte Anforderung: Entwicklungsschritt 1 — Projekt-Scaffold und Qualitätsinfrastruktur

## Fachliche Zusammenfassung

Greenfield-Aufsetzen des Anwendungsgerüsts für das Browser-Spiel „Im Netz der
Detektive": Ein Vite + React 18 + TypeScript-Projekt mit Feature-Slice-Modulstruktur
(`src/components`, `src/logic`, `src/state`, `src/data`), minimaler rendernder
App-Shell, Zustand als State-Bibliothek und CSS-Modulen. Zusätzlich wird die
komplette Qualitätsinfrastruktur errichtet: ESLint, Prettier, `tsc --noEmit`,
Vitest mit erzwungener 70-%-Zeilenabdeckung, auf TypeScript adaptierte lokale
Git-Hooks (`.githooks/` mit `core.hooksPath`-Install-Skripten) und die
vollständige auf Node/Vite gemappte CI-Pipeline (sieben Workflows + zwei
Composite Actions + `release.config.js` + `scripts/resolve-release-version.mjs`)
nach `docs/projects/task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel/refs/ci-workflows-instructions.md`.
Release-Asset ist genau ein ZIP des statischen Builds; `update.json` und
`release-metadata.json` entfallen (kein Self-Update).

## Betroffene Klassen und Komponenten

- **Projektgerüst (neu):** `package.json` (Skripte `dev`, `build`, `test`,
  `lint`, `format`, `typecheck`, `coverage`, `release`), `package-lock.json`,
  `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore` (Node/Vite-
  Ergänzung, bestehender `issue.md`-Eintrag bleibt), ESLint-Flat-Config,
  `.prettierrc`/`.prettierignore`.
- **App-Shell / Feature-Slices (neu):** `src/main.tsx`, `src/App.tsx`,
  `src/App.module.css`, `src/vite-env.d.ts`; Platzhalter-Module in
  `src/components/`, `src/logic/`, `src/state/` (Zustand-Store), `src/data/`
  (`src/data/maps/` für Kartenpakete), die alle kompilieren.
- **i18n-Basis (neu):** `src/i18n/de.json`, `src/i18n/en.json` mit
  Schlüsselparität sowie ein minimaler `t()`-Helper; App-Shell-Texte laufen
  bereits über Schlüssel (Vorgabe „i18n von Beginn an" aus dem Konzept).
- **Git-Hooks (neu, `.githooks/`):** `pre-commit` (Commit-Block auf
  `main`/`staging`, Warnstufe auf gestagten Dateien), `pre-push` (Push-Block
  auf `main`/`staging` + striktes Whole-Repo-Audit), `install-hooks.sh` und
  `install-hooks.cmd` (setzen `core.hooksPath`), plus Python-Prüfskripte:
  `no-stub-check.py` (analog `no-notimplemented-check.py` für
  `throw new Error("not implemented")`/TODO-Stubs in `.ts`/`.tsx`),
  `i18n-check.py` (analog `translation-check.py` für `de.json`↔`en.json`),
  `component-usage-check.py` (analog `razor-usage-check.py` für ungenutzte
  `.tsx`-Komponenten), `map-schema-check.py` (Kartenpaket-Schema-Validierung
  für `src/data/maps/*.json`), `no-math-random-check.py`
  (`Math.random()`-Verbot in `src/logic/**`).
- **CI/CD (neu, `.github/`):** Workflows `verify-pr-source.yml`,
  `pr-staging-ci.yml` (detect-backmerge, parallele `static checks` /
  `build & test`, `no pending backmerge`), `staging-ci.yml` (`version`-Job
  via semantic-release-Dry-Run + `prerelease`-Job für `vX.Y.Z-rc.N`),
  `staging-to-main-promotion.yml`, `sync-staging-with-main.yml`,
  `release.yml` (Push auf `main` + manueller `vX.Y.Z`-Tag-Pfad +
  Asset-Repair), `security-scan.yml` (wöchentlich); Composite Actions
  `.github/actions/build-and-package` (`npm ci` + `vite build` + ein
  ZIP-Asset `release.zip`) und `.github/actions/security-scan`
  (`npm audit`, blockierend).
- **Release-Tooling (neu):** `release.config.js` (conventionalcommits-Preset,
  `successComment`/`failComment: false`), `scripts/resolve-release-version.mjs`
  inkl. Unit-Tests und Prerelease-Guard (nie ein altes Prerelease zur Reparatur
  auswählen, Vorlage §8.2/§11.1).
- **Tests (neu):** Vitest-Setup inkl. Coverage-Konfiguration (70 % Zeilen,
  erzwungen in `pr-staging-ci` und `staging-ci`), erster Beispieltest,
  Unit-Tests für `resolve-release-version.mjs`.

## Implementierungsansatz

- Vite-React-TS-Standardgerüst manuell ausgelegt (kein Generator-Lauf nötig):
  `npm`-Manifest mit React 18, `zustand`, `vite`, `@vitejs/plugin-react`,
  `typescript`, `vitest` + `@vitest/coverage-v8`, ESLint-Flat-Config
  (typescript-eslint + react-hooks + react-refresh + eslint-config-prettier),
  Prettier sowie die semantic-release-DevDependencies aus der Vorlage.
- CI-Mapping der .NET-Vorlage auf Node/Vite: `npm ci` statt `dotnet restore`,
  `prettier --check` + `eslint` + `tsc --noEmit` als statische Checks,
  `vitest run --coverage` mit `coverage.thresholds.lines: 70` als
  Coverage-Gate (ersetzt ReportGenerator-Auswertung), `npm audit` als
  Security-Scan, ein `vite build`-ZIP (`release.zip`) als einziges Asset.
- `resolve-release-version.mjs`: Rein logischer Kern mit injizierten
  Abhängigkeiten (`getGitHubRelease`, `listGitHubReleases`,
  `runSemanticReleaseDryRun`), erwartete Assets = `["release.zip"]`,
  Outputs `released`, `reason`, `version`, `tag`, `release_kind`,
  `release_action` via `GITHUB_OUTPUT`; Prerelease-Guard in
  `incompleteReleases()`.
- Hook-Check-Skripte bleiben Python 3 (plattformübergreifend vorhanden;
  Vorlage ist Python), werden über die sh-Hooks aufgerufen; Install-Skripte
  als `.sh` und `.cmd`.
- Remote: `github.com/martin-stromberg/Im-Netz-der-Detektive` mit Branches
  `main` + `staging`; Workflows passen zur staging→main-Topologie.

## Konfiguration

- `vitest`-Coverage: Provider `v8`, `thresholds.lines: 70` (Wirkebene
  `npm run coverage`, in CI als Gate).
- `release.config.js`: `branches: ["main"]`, `tagFormat: "v${version}"`,
  Plugins gemäß Vorlage (Assets über `RELEASE_ASSET_PATH`-Env, ein ZIP).
- Git-Hooks aktiviert über `core.hooksPath=.githooks` (Install-Skripte).
- `GITHUB_TOKEN`/Standard-Permissions der Workflows; Labels
  `automated-promotion`/`automated-backmerge` werden von den Workflows
  bei Bedarf angelegt.

## Offene Fragen

Keine — alle Punkte sind durch die Kundenanforderung, den Projektplan
(`docs/projects/.../project-plan.md`, Schritt 1) und die Referenzvorlagen
ausreichend spezifiziert. Hinweis der Anforderung: Der tatsächliche Push auf
`staging`, die RC-Erzeugung, der manuelle Promotion-PR und das Setzen der
Branch-Protection-Kontexte erfolgen auf Projektebene nach dem Merge und sind
nicht Teil des Lieferumfangs.
