# Abnahmeprüfung – Entwicklungsschritt 1

## Ergebnis

**Status:** Abweichungen gefunden

## Abweichungen

- [ ] `npm run format:check` schlägt auf einem Windows-Checkout mit
  `core.autocrlf=true` (Git-for-Windows-Standard) fehl, weil `.gitattributes`
  `eol=lf` nur für `*.sh`/`*.yml`/`*.mjs`/Hook-Dateien pinnt, nicht für die
  Prettier-geprüften Dateitypen (`*.ts`/`*.tsx`/`*.json`/`*.js`/`*.html` u. a.).
  Konkret: `src/i18n/en.json` liegt in der Working Tree mit CRLF vor
  (`git ls-files --eol`: `i/lf w/crlf` — committeter Inhalt ist LF-sauber),
  Prettier (`endOfLine: "lf"`, `.prettierrc`) bricht mit Exit 1 ab. Auf einem
  frischen Windows-Klon wären alle `text=auto`-Dateien betroffen.
  Fundstellen: `.gitattributes` (Zeilen 5–10), `src/i18n/en.json`. In CI
  (ubuntu, LF-Checkout) unbetroffen; eingeschätzte Schwere: gering
  (einzeilige `.gitattributes`-Ergänzung), aber das Akzeptanzkriterium
  „ESLint- und Prettier-Prüfung bestehen" ist auf der Zielplattform Windows
  aktuell nicht erfüllt.

## Hinweise

Ausgeführte Befehle (lokal, Node v24.15.0 / npm 11.10.0 / Python 3.13.14,
Branch `task/...-schritt-1-scaffold-qualitaet`, Stand `5b469f0`):

- `npm ci` — Exit 0 (Lockfile konsistent, Neuinstallation erfolgreich).
- `npm run build` (`tsc --noEmit` + `vite build`) — Exit 0, `dist/` erzeugt.
- `npm test` (`vitest run`) — Exit 0, 4 Dateien / 25 Tests grün (inkl. 19
  Unit-Tests für `scripts/resolve-release-version.mjs`, davon 2
  Prerelease-Guard-Regressionen).
- `npm run typecheck` — Exit 0. `npm run lint` — Exit 0.
- `npm run coverage` — Exit 0, 100 % Zeilen; 70-%-Schwelle ist in
  `vite.config.ts` (`test.coverage.thresholds.lines: 70`, Provider v8)
  konfiguriert und wird in beiden CI-Workflows über `npm run coverage`
  erzwungen (`pr-staging-ci.yml` Zeile 116, `staging-ci.yml` Zeile 106).
- `npm run format:check` — **Exit 1**, einziger Befund: `src/i18n/en.json`
  (Working-Tree-CRLF). Gegenprobe auf den committeten Blob
  (`git show HEAD:src/i18n/en.json | prettier --check`) bestanden — der
  eingecheckte Inhalt ist korrekt, die Umgebungs-Robustheit fehlt
  (s. Abweichung oben).
- `npm audit --omit=dev` — Exit 0 (0 Vulnerabilities); `npm audit` (voll)
  meldet 12 Findings (2 moderat, 10 hoch), ausschließlich dev-seitig
  (semantic-release-/npm-/undici-Kette) — stützt die Implementierer-
  Begründung.

YAML-Validität: Alle 7 Workflows + 2 Composite Actions per `js-yaml`
geparst — 9/9 fehlerfrei.

Verdrahtungen gegen Vorlage (`refs/ci-workflows-instructions.md`) geprüft:

- `staging-to-main-promotion.yml`: `workflow_run.workflows: ["Pre-Release"]`
  verweist korrekt auf den **Display-Namen** von `staging-ci.yml`
  (`name: Pre-Release`); `branches: [staging]`, `conclusion == 'success'`.
- `release.yml`: beide Trigger (`branches: [main]` + `tags: ['v*.*.*']`),
  Resolve-Schritt → `resolve-release-version.mjs`, Tag-Checkout für
  `upload-existing` inkl. SHA-Verifikation, Release-Gate-Tests, Auto-Pfad
  via semantic-release (`RELEASE_ASSET_PATH=release.zip` ↔
  `release.config.js`), manueller Tag-Pfad via `gh release create`,
  Asset-Repair via `gh release upload --clobber`.
- `detect-backmerge` in `pr-staging-ci.yml` und `staging-ci.yml` identisch
  zur Vorlage; `no pending backmerge`-Gate blockiert reguläre PRs bei
  offenem `main`→`staging`-Backmerge; `static checks`/`build & test` laufen
  parallel (kein `needs:` untereinander) — Job-Namen entsprechen den
  geforderten Statuskontexten.
- `staging-ci.yml`: `version`-Job (semantic-release-Dry-Run mit
  `--branches staging`, `rc_tag`/`rc_version`-Outputs) und `prerelease`-Job
  für `vX.Y.Z-rc.N`; `rc_version` (nicht `version`) speist
  `build-and-package` — §11.2-Falle vermieden.
- `security-scan.yml`: nur `schedule` (Mo 04:00 UTC) + `workflow_dispatch`,
  kein `pull_request` — vorlagenkonform.
- `resolve-release-version.mjs`: `EXPECTED_ASSETS = ["release.zip"]`,
  manueller/automatischer Pfad, Repair-Fallback auf ältestes unvollständiges
  Release, **Prerelease-Guard** in `incompleteReleases()` vorhanden und
  testabgesichert (§11.1).
- `release.config.js`: `conventionalcommits`-Preset auf beiden Plugins,
  `successComment`/`failComment: false`, Dry-Run-Pluginset; lädt als ESM
  fehlerfrei. `update.json`/`release-metadata.json` entfallen wie gefordert
  (keine Referenzen, keine Dateien).
- Security-Scan-Bewertung (bekannte Einschränkung des Implementierers):
  Die Composite Action führt das volle `npm audit` für den Report aus,
  blockiert aber nur auf `npm audit --omit=dev`. **Bewertet: vertretbar.**
  Das Release-Asset ist ein statisches `vite build`-ZIP — nur Production-
  Dependencies werden ausgeliefert; das Gate bleibt damit für den
  ausgelieferten Scope blockierend (Vorlagenintention erfüllt). Ein
  blockierendes Voll-Audit wäre durch die unfixbaren
  semantic-release-Dev-Findings (aktuell 12) permanent rot — ein nutzloses
  Gate wäre schlechter. Restrisiko: dev-seitige Supply-Chain-Findings
  blockieren nie, erscheinen nur im Report-Artefakt.

Git-Hooks (lokal nachgewiesen, `core.hooksPath=.githooks` ist gesetzt):

- `pre-push`: simulierte Stdin — Push nach `main`/`staging` → Exit 1;
  Feature-Push → Exit 0 mit striktem Whole-Repo-Audit aller fünf Checks
  (`--all --strict`).
- `pre-commit`: auf `main` (temporärer Worktree) → Exit 1; gestagter
  Stub in `src/logic/` → Warnung, Exit 0 (Warnstufe); i18n-/Map-/
  Math.random-Checks blockierend — vorlagenkonform (Vorlagen-
  `translation-check` ist ebenfalls blockierend).
- Funktionale Übertragung vorhanden: `no-stub-check.py` (analog
  `no-notimplemented-check.py`), `i18n-check.py` (analog
  `translation-check.py`, Parität + Schlüsselverwendung),
  `component-usage-check.py` (analog `razor-usage-check.py`) sowie eigene
  Checks `map-schema-check.py` und `no-math-random-check.py`; alle 5 per
  `py_compile` und im `--all --strict`-Lauf verifiziert.
- Install-Skripte `install-hooks.sh`/`install-hooks.cmd` setzen
  `core.hooksPath`.

Weitere Feststellungen:

- Scaffold: Vite + React 18.3 + TS (strict) mit Feature-Slices
  (`src/components`, `src/logic`, `src/state`, `src/data/maps/.gitkeep`),
  rendernder App-Shell über i18n-Schlüssel, Zustand-Store (headless),
  CSS-Module, alle geforderten `package.json`-Skripte inkl. `release`.
- `.gitignore` Node/Vite-vollständig, `issue.md`-Eintrag erhalten.
- Lifecycle: Feature-Verzeichnis regulär am Ende gelöscht (Löschung in
  `5b469f0`), `...-tasks.md` bleibt als Nachweis erhalten; Planungsartefakte
  via `git show b84ce67` einsehbar.
- Nicht übertragene Vorlagen-Checks (`razor-l10n`, `enum-coverage`,
  `csproj-xmldoc`) sind durch die Anforderung nicht gefordert (dort
  explizit die 3+2-Menge benannt); kein Befund.
- Leeres, ungetracktes Verzeichnis `tmp_hooks_test/` im Arbeitsbaum —
  Rest eines lokalen Hook-Tests, nicht committet, ohne Auswirkung.
- Außerhalb dieser Abnahme (Projektebene): tatsächlicher `staging`-Push,
  RC-Erzeugung, erster manueller Promotion-PR, Branch-Protection-Kontexte.
