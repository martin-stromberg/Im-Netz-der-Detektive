# Umsetzungsplan: Entwicklungsschritt 1 — Projekt-Scaffold und Qualitätsinfrastruktur

## Übersicht

Greenfield-Aufsetzen eines Vite + React 18 + TypeScript-Projekts für „Im Netz
der Detektive" mit Feature-Slice-Struktur (`src/components`, `src/logic`,
`src/state`, `src/data`), minimaler App-Shell, Zustand-Store und CSS-Modulen —
plus kompletter Qualitätsinfrastruktur: ESLint, Prettier, `tsc --noEmit`,
Vitest mit 70-%-Coverage-Gate, TS-adaptierte Git-Hooks unter `.githooks/` und
die vollständige sieben-Workflow-CI-Pipeline nach Vorlage. Release-Asset ist
genau ein `release.zip` des statischen Builds; `update.json`/
`release-metadata.json` entfallen.

Basisbranch: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel`

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| Projektgerüst | Manuell ausgelegtes Vite-React-TS-Setup (kein `npm create vite`-Generatorlauf) | Volle Kontrolle über Dateien/Versionen; reproduzierbar; Generatoren erzeugen Template-Überhang (Demo-Assets, Counter), der nicht angefordert ist |
| TypeScript-Konfiguration | Eine einzelne `tsconfig.json` (statt Template-Projekt-Referenzen `tsconfig.app.json`/`tsconfig.node.json`) | Nur ein Package, kein Multi-Projekt-Bedarf; `tsc --noEmit` deckt `src/` und `vite.config.ts` in einem Lauf ab — weniger Config-Oberfläche |
| `npm run build` | `tsc --noEmit && vite build` | Build schlägt bei Typfehlern fehl (analog `dotnet build` mit TreatWarningsAsErrors); `typecheck`-Skript bleibt separat aufrufbar |
| State-Bibliothek | `zustand` mit minimalem Store (`round`, `advanceRound`), der `src/logic` aufruft | Explizite Vorgabe; Zustand-Stores laufen headless (Voraussetzung für KI-vs.-KI ab Schritt 2) |
| Coverage-Gate | `vitest --coverage` mit `coverage.thresholds.lines: 70` in `vite.config.ts` | Vitest erzwingt Schwellen nativ — ersetzt die ReportGenerator-Auswertung der Vorlage; identischer Mechanismus lokal und in CI |
| Coverage-Scope | `include: src/**/*.{ts,tsx}`, `exclude: src/main.tsx` (Einstiegspunkt) | `main.tsx` ist der Bootstrap-Einstiegspunkt (analog `Program.cs`-Ausnahme in `run-tests.md`); alle übrigen Dateien sind testpflichtig |
| React-Render-Test | `renderToString` aus `react-dom/server` statt jsdom/Testing-Library | Deckt App-Shell-Zeilen ohne DOM-Abhängigkeit; minimale DevDependencies |
| Hook-Skriptsprache | Python 3 für alle Checks (wie Vorlage), aufgerufen aus sh-Hooks | Vorlage ist Python; Python 3.13 ist vorgegebenes Tooling; kein zweiter Interpreter-Stack nötig |
| Warn- vs. Block-Stufe im `pre-commit` | Fachliche Verbots-/Korrektheits-Checks blockieren (`i18n-check`, `map-schema-check`, `no-math-random-check`), Aufwands-/Fortschritts-Checks warnen (`no-stub-check`, `component-usage-check`) | Spiegelt die Vorlage (translation-/xmldoc-/l10n-Checks blockierten dort, usage-/stub-/enum-Checks warnten); die Anforderung „Warnstufe auf gestagten Dateien" trifft die Stub-/Orphan-Checks, ein versehentlicher `Math.random()`- oder i18n-Verstoß soll aber gar nicht erst committet werden |
| `security-scan` Composite | `npm audit` (Exitcode ≠ 0 bei Findings → blockierend), Input `artifact-name` | Vorlage scannte NuGet inkl. Transitivs; `npm audit` ist das npm-Äquivalent. Der Input `solution-path` der Vorlage entfällt (npm braucht keinen Solution-Pfad) |
| `build-and-package` Composite | `npm ci` + `npm run build` + `zip` von `dist/` → `release.zip`; Inputs `release-version`/`release-tag` bleiben (Schnittstellenkompatibilität zur Vorlage), Asset-Name fest | Release-Asset = genau ein ZIP des statischen Builds; feste Asset-Namen sind Voraussetzung für die Asset-Repair-Logik (erwartete Assetliste) |
| Erwartete Release-Assets | `["release.zip"]` in `resolve-release-version.mjs` | `update.json` entfalten (kein Self-Update im Browser-Spiel); genau ein ZIP laut Anforderung |
| ESLint | Flat Config (`eslint.config.js`): `@eslint/js` + `typescript-eslint` + `react-hooks` + `react-refresh` + `eslint-config-prettier` | Aktueller ESLint-9-Standard; deckt React-/TS-Qualität ab ohne Prettier-Konflikte |
| E2E-Tests | Keine | Die Anforderung berührt keinen Benutzerfluss — die App-Shell ist ein nicht-interaktiver Platzhalter ohne Aktionen, Navigation oder Formulare; es gibt nichts über UI Erreichbares, das einen E2E-Nachweis erforderte. UI-/E2E-Tests sind für die späteren Spiel-Schritte vorgesehen |

## Programmabläufe

### Lokaler Entwicklungsfluss

1. `npm ci` installiert alle Dependencies.
2. `npm run dev` startet den Vite-Dev-Server; `main.tsx` rendert `App`.
3. `npm run build` führt `tsc --noEmit` und `vite build` aus → `dist/`.
4. `npm test` / `npm run coverage` führen Vitest (Coverage mit 70-%-Gate) aus.
5. `npm run lint`, `npm run format`, `npm run typecheck` sind die
   Qualitätsbefehle; `npm run release` ruft `semantic-release` (nur in CI).

### Git-Hook-Fluss

1. `install-hooks.sh` / `install-hooks.cmd` setzen `core.hooksPath=.githooks`.
2. `pre-commit` (sh): bricht Commits auf `main`/`staging` ab; führt auf
   gestagten Dateien `i18n-check.py` (blockierend), `map-schema-check.py`
   (blockierend, nur wenn Map-Dateien betroffen), `no-math-random-check.py`
   (blockierend) sowie `no-stub-check.py` und `component-usage-check.py`
   (nur Warnung) aus.
3. `pre-push` (sh): blockiert Pushes auf `main`/`staging`; führt alle fünf
   Checks im `--all --strict`-Modus über das ganze Repo aus (blockierend).

### CI-Fluss (staging→main-Topologie)

1. `verify-pr-source.yml`: lehnt PRs nach `main` ab, die nicht von `staging`
   kommen.
2. `pr-staging-ci.yml` (PR → `staging`): `detect-backmerge` erkennt reine
   `main`→`staging`-PRs; `static checks` (Prettier-Check, Security-Scan,
   ESLint, `tsc --noEmit`) und `build & test` (`npm ci`, `npm run build`,
   `npm run coverage` mit 70-%-Gate) laufen parallel; `no pending backmerge`
   blockiert reguläre PRs bei offenem Backmerge; `back-merge-skip` meldet
   übersprungene Backmerge-PRs.
3. `staging-ci.yml` (Push → `staging`): dasselbe Trio, danach `version`
   (semantic-release-Dry-Run → `vX.Y.Z`, RC-Nummer aus `git tag --list
   "vX.Y.Z-rc.*"`) und `prerelease` (`build-and-package` mit `rc_version` +
   `rc_tag`, `gh release create --prerelease` mit `release.zip`).
4. `staging-to-main-promotion.yml`: nach erfolgreichem `Pre-Release`-Lauf
   (`workflow_run`) automatischer Draft-PR `staging`→`main` mit Label
   `automated-promotion`.
5. `sync-staging-with-main.yml`: bei jedem Push auf `main` automatischer
   Backmerge-PR `main`→`staging` mit Label `automated-backmerge`.
6. `release.yml` (Push `main` oder Tag `v*.*.*`):
   `resolve-release-version.mjs` klassifiziert den Ref, prüft
   Release-Existenz/Vollständigkeit, steuert create/upload-existing/skip;
   Release-Gate-Tests (`npm test`), `build-and-package`, Release-Erstellung
   via `npm run release` (automatisch) bzw. `gh release create`
   (manueller Tag) bzw. `gh release upload --clobber` (Repair).
7. `security-scan.yml`: wöchentlicher Cron + `workflow_dispatch`, nutzt die
   Composite Action.

## Neue Klassen / Dateien

| Datei | Typ | Zweck |
|-------|-----|-------|
| `package.json` | Manifest | Skripte `dev`, `build`, `test`, `lint`, `format`, `format:check`, `typecheck`, `coverage`, `release`; Deps: `react` 18, `react-dom` 18, `zustand`; Devs: `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `@vitest/coverage-v8`, ESLint-Stack, `prettier`, `@types/react(-dom)`, semantic-release-Stack (`semantic-release`, `@semantic-release/commit-analyzer`, `-notes-generator`, `-github`, `conventional-changelog-conventionalcommits`) |
| `tsconfig.json` | Konfig | strict TS, `jsx: react-jsx`, `resolveJsonModule`, `moduleResolution: bundler`, noEmit; include `src`, `vite.config.ts` |
| `vite.config.ts` | Konfig | React-Plugin + Vitest-Coverage (v8, include `src/**`, exclude `src/main.tsx`, `src/vite-env.d.ts`, `*.test.*`; `thresholds.lines: 70`) |
| `index.html` | Einstieg | Vite-HTML-Einstieg (`/src/main.tsx`) |
| `eslint.config.js` | Konfig | Flat-Config wie oben |
| `.prettierrc` | Konfig | Format-Regeln |
| `.prettierignore` | Konfig | `dist`, `coverage`, `docs/konzept`, `package-lock.json` u. a. |
| `src/main.tsx` | Einstieg | StrictMode-Bootstrap |
| `src/App.tsx` | Komponente | Minimale Shell: Titel/Untertitel aus i18n, `PlaceholderPanel`, aktuelle Runde aus dem Store |
| `src/App.module.css` | CSS-Modul | Shell-Styles |
| `src/vite-env.d.ts` | Typen | `vite/client`-Referenz (CSS-Module-Typen) |
| `src/components/PlaceholderPanel.tsx` (+ `.module.css`) | Komponente | Minimaler Platzhalter, wird von `App` referenziert (demonstrates Usage-Check) |
| `src/logic/placeholder.ts` | Logik-Modul | `advanceRound(round)` — minimale, echte Funktion; vom Store genutzt |
| `src/state/gameStore.ts` | Store | Zustand-Store `{ round, advanceRound() }`, headless-fähig |
| `src/data/maps/.gitkeep` | Platzhalter | Zielverzeichnis der Kartenpakete (ab Schritt 2/3) |
| `src/i18n/de.json`, `src/i18n/en.json` | i18n | `app.title`, `app.subtitle`, `app.placeholder` — parallele Schlüssel |
| `src/i18n/index.ts` | i18n | `t(key)`-Helper auf Basis `de.json` |
| `src/logic/placeholder.test.ts` | Test | Beispieltest |
| `src/state/gameStore.test.ts` | Test | Headless-Store-Test |
| `src/App.test.tsx` | Test | `renderToString`-Smoke-Test der Shell |
| `scripts/resolve-release-version.mjs` | Skript | Release-Version-Auflösung (Klassifikation, Existenzprüfung, Repair-Fallback, Prerelease-Guard), Outputs via `GITHUB_OUTPUT` |
| `scripts/resolve-release-version.test.mjs` | Test | Unit-Tests inkl. Prerelease-Guard-Regression |
| `release.config.js` | Konfig | conventionalcommits-Preset, `branches: ["main"]`, `tagFormat v${version}`, Assets via `RELEASE_ASSET_PATH`, `successComment`/`failComment: false`, `RESOLVE_DRY_RUN`-Dry-Run-Plugins |
| `.githooks/pre-commit` | Hook | wie beschrieben |
| `.githooks/pre-push` | Hook | wie beschrieben |
| `.githooks/install-hooks.sh`, `install-hooks.cmd` | Installer | `git config --local core.hooksPath .githooks` |
| `.githooks/no-stub-check.py` | Check | `throw new Error("not implemented")`, throw-only-Bodies, TODO-Stubs in `.ts`/`.tsx`; Default staged warn, `--all --strict` |
| `.githooks/i18n-check.py` | Check | Schlüsselparität aller `src/i18n/*.json` + verwendete `t("...")`-Schlüssel müssen definiert sein; blockierend |
| `.githooks/component-usage-check.py` | Check | ungenutzte `.tsx`-Komponenten (Ausnahmen: `main.tsx`, `App.tsx`, Kleinschreibung, Tests, `.d.ts`); Default warn, `--all --strict` |
| `.githooks/map-schema-check.py` | Check | Kartenpaket-Schema für `src/data/maps/*.json` (Pflichtfelder, Knoten-/Kanten-/Spawn-/Settings-Regeln gemäß Konzept §4); blockierend |
| `.githooks/no-math-random-check.py` | Check | `Math.random`-Verbot in `src/logic/**`; blockierend |
| `.github/workflows/*.yml` | CI | sieben Workflows wie oben |
| `.github/actions/build-and-package/action.yml` | Action | `npm ci`, `npm run build`, `zip` → `release.zip` |
| `.github/actions/security-scan/action.yml` | Action | `npm audit` blockierend + Report-Upload |

## Änderungen an bestehenden Klassen/Dateien

### `.gitignore`

- **Bestehender Eintrag bleibt:** `issue.md`
- **Neue Einträge:** `node_modules/`, `dist/`, `coverage/`, `test-results/`,
  `.env` + `.env.*` (mit `!.env.example`), OS-/Editor-Dateien
  (`.DS_Store`, `Thumbs.db`, `.vscode/`, `.idea/`)

Keine weiteren bestehenden Dateien werden geändert (README/RELEASE_NOTES/
changes.log folgen in den Lifecycle-Dokumentationsschritten).

## Datenbankmigrationen

Keine.

## Validierungsregeln

| Feld / Objekt | Regel | Fehlerfall |
|---------------|-------|------------|
| `src/data/maps/*.json` | Pflichtfelder `id`, `name`, `viewBox`, `nodes`, `edges`, `spawnRules`, `settings`; Knoten `id`/`name`/`x`/`y`/`categories`/`zone`, Kategorien ∈ `diebstahl|kontakt|sabotage|flucht`, eindeutige `id`; Kanten `a`/`b` referenzieren Knoten, `type` ∈ `weg|fahrt`; `spawnRules` Modi ∈ `choice|free|random`, `choice` verlangt `nodes`, `order = detektive_first`; `settings` Range-Objekte `{suggested,min,max}` für `detectiveCount`/`cameraCount`/`radioHintCount`/`edgeBlockRounds`, `roundLimit` mit `unlimited`, Skalare `cameraMinGap`/`hintZoneRadius`, `eventMode` ∈ `cycle|chance|tension`, `eventDefaults`, `eventMix`, `missionRules`, `sabotageEffects` ⊆ `kamera_aus|funkstille|falsche_spur` | `map-schema-check.py` meldet jede Verletzung mit Datei + Pfad und schlägt fehl |
| `src/i18n/*.json` | identische Schlüsselmenge je Sprachdatei; verwendete `t("...")`-Schlüssel definiert | `i18n-check.py` schlägt fehl |
| `src/logic/**` | kein `Math.random` | `no-math-random-check.py` schlägt fehl |
| `.ts`/`.tsx` | keine `throw new Error("not implemented")`-/throw-only-/TODO-Stubs | `no-stub-check.py` (pre-commit: warn, pre-push: blockierend) |
| `.tsx` | keine unreferenzierten Komponenten | `component-usage-check.py` (pre-commit: warn, pre-push: blockierend) |
| Git | kein Commit/Push direkt auf `main`/`staging` | `pre-commit`/`pre-push` blockieren |

## Konfigurationsänderungen

| Eintrag | Typ | Standardwert | Zweck |
|---------|-----|--------------|-------|
| `vite.config.ts → test.coverage.thresholds.lines` | Zahl | `70` | Erzwungene Zeilenabdeckung |
| `package.json → engines.node` | Range | `>=22.14.0` | Mindest-Node für semantic-release 25 |
| `release.config.js → branches` | Liste | `["main"]` | semantic-release nur auf `main`; `staging` wird per CLI-Override dry-run-behandelt |
| `core.hooksPath` | Git-Config | `.githooks` | Aktivierung der Hooks via Install-Skripte |

## Seiteneffekte und Risiken

- **Doc-Viewer `docs/konzept/`:** unberührt; `.prettierignore` nimmt ihn aus
  der Prettier-Prüfung, damit fremde Vendor-Assets nicht scheitern.
- **`docs/`/`scripts/`/`*.md` etc.:** Prettier `--check .` prüft Repo-weit —
  `.prettierignore` muss alle nicht formatierten Bereiche abdecken
  (Lockfile, `dist`, `coverage`, `docs/konzept`, `.agents`).
- **Erste CI-Nutzung:** Promotion-/Backmerge-Workflows und Statuskontexte
  wirken erst nach Merge auf `staging`/`main` (bekannter Cold-Start, Vorlage
  §11.5) — remote-seitige Verifikation liegt außerhalb dieses Schritts.
- **Neue npm-Dependencies:** Audit-Gate (`npm audit`, blockierend) kann bei
  künftig disclosed CVEs PRs blockieren — gewolltes Verhalten.

## Umsetzungsreihenfolge

1. **npm-Manifest + Toolchain-Config** (`package.json`, `tsconfig.json`,
   `vite.config.ts`, `eslint.config.js`, `.prettierrc`, `.prettierignore`,
   `.gitignore`, `index.html`)
   - Voraussetzungen: Node/npm vorhanden
2. **`npm install`** → `package-lock.json`
   - Voraussetzungen: Schritt 1
3. **App-Shell und Feature-Slices** (`src/main.tsx`, `App.tsx`, CSS-Module,
   `vite-env.d.ts`, `PlaceholderPanel`, `logic/placeholder.ts`,
   `state/gameStore.ts`, `i18n/*`, `data/maps/.gitkeep`)
   - Voraussetzungen: Schritt 1 (Konfigurationen)
4. **Tests** (`placeholder.test.ts`, `gameStore.test.ts`, `App.test.tsx`)
   - Voraussetzungen: Schritt 3
5. **Release-Version-Skript + Tests** (`scripts/resolve-release-version.mjs`,
   `scripts/resolve-release-version.test.mjs`, `release.config.js`)
   - Voraussetzungen: Schritt 2 (semantic-release-Devs installiert)
6. **Git-Hooks** (`.githooks/` komplett)
   - Voraussetzungen: Schritt 3 (i18n-Dateien, Komponenten für realistische
     Checks)
7. **CI-Pipeline** (`.github/workflows/*`, `.github/actions/*`)
   - Voraussetzungen: Schritte 1–5 (Skriptnamen/Job-Verdrahtung)
8. **Lokale Verifikation:** `npm ci` (clean), `npm run build`, `npm test`,
   `npm run coverage`, `npm run lint`, `npm run format:check`,
   `npm run typecheck`; Hook-Installation + Funktionsnachweise
   (pre-push-Block via simuliertem Stdin, Check-Skripte manuell);
   YAML-Validierung aller Workflows
   - Voraussetzungen: Schritte 1–7

## Tests

### Neue Tests

| Test / Hilfsmethode | Testklasse / -datei | Was wird geprüft? |
|--------------------|---------------------|---------------------|
| `advanceRound` inkrementiert | `src/logic/placeholder.test.ts` | Beispieltest: `advanceRound(1) === 2`, `0 → 1` |
| Store: Initialzustand + `advanceRound` | `src/state/gameStore.test.ts` | headless Zustand-Store startet bei `round = 1`, Action nutzt `logic/placeholder.ts` |
| App-Shell rendert | `src/App.test.tsx` | `renderToString(<App />)` enthält Titel/Untertitel aus `de.json` |
| `parseManualTag` | `scripts/resolve-release-version.test.mjs` | gültige/ungültige `vX.Y.Z`-Tags (inkl. Prerelease-Suffix-Ablehnungsfälle und `v`-Präfix-Pflicht) |
| `classifyWorkflowRef` | dto. | Tag → manual, Branch `main` → automatic, andere Refs → Fehler |
| `releaseHasExpectedAsset` | dto. | `release.zip` muss `uploaded` + `size > 0` sein |
| `incompleteReleases`-Guard | dto. | Prereleases werden **nie** für Repair ausgewählt — selbst ohne Assets und ohne anstehendes Release (Regression §11.1) |
| `resolveReleaseVersion`-Flüsse | dto. | automatic ohne releasable Commits → `released=false`; komplettes Release → skip; fehlendes Asset → `upload-existing`; fehlendes Release → `create`; Fallback-Scan wählt ältestes unvollständiges **Non-Prerelease** |

### Betroffene bestehende Tests

Keine — es existieren keine Tests.

### E2E-Tests (primärer Funktionsnachweis)

Nicht erforderlich: Die Anforderung definiert keinen Benutzerfluss und keine
über die UI erreichbare Interaktion — die App-Shell ist ein nicht-interaktiver
Render-Platzhalter. Es gibt keinen auslösenden Nutzeraktionen folgenden
sichtbaren Effekt, den ein E2E-Test nachweisen müsste. Der gerenderte
Platzhalter wird stattdessen durch den `renderToString`-Smoke-Test
(`App.test.tsx`) abgesichert; UI-/E2E-Abdeckung ist ab den echten
Spielbildschirm-Schritten (Schritte 9 ff.) vorgesehen.

## Offene Punkte

Keine.
