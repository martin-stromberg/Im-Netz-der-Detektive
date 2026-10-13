# Repository-Struktur und vorhandene Artefakte

Stand: Branch `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-1-scaffold-qualitaet`,
Commit `0d12e9b`.

## Repo-Root

| Datei | Inhalt | Relevanz für die Anforderung |
|-------|--------|------------------------------|
| `.gitignore` | enthält nur `issue.md` | um Node/Vite-Einträge zu ergänzen, `issue.md` bleibt |
| `LICENSE` | PolyForm Noncommercial 1.0.0 | keine kommerziellen Abhängigkeiten einführen; kein Lizenzheader nötig |
| `README.md` | Projektbeschreibung, Konzept-Verweis, Lizenz | in Schritt 12b zu aktualisieren |
| `issue.md` | Aufgabenbeschreibung des Gesamtprojekts | unverändert |
| `start-docs.bat` | startet den Doc-Viewer (Port 8899) | unverändert |

## `docs/`

| Pfad | Inhalt | Relevanz |
|------|--------|----------|
| `docs/konzept/` | statischer Markdown-Doc-Viewer (`index.html`, `assets/`) + `content/*.md` | bleibt unangetastet; `content/02-technisches-konzept.md` spezifiziert Modulstruktur (§2), State (§3), Kartenpaket-Format (§4), Styling via CSS-Module (§9), i18n-Vorgabe (§11) |
| `docs/projects/task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel/` | Projektplan, Schrittliste, Referenzvorlagen | `project-plan.md` Schritt 1 = diese Anforderung; `refs/` = verbindliche Vorlagen |

## Referenzvorlagen unter `refs/`

### `refs/ci-workflows-instructions.md`

Beschreibt die sieben Workflow-Dateien (`verify-pr-source.yml`,
`pr-staging-ci.yml`, `staging-ci.yml`, `staging-to-main-promotion.yml`,
`sync-staging-with-main.yml`, `release.yml`, `security-scan.yml`), die zwei
Composite Actions (`build-and-package`, `security-scan`), `release.config.js`
und `scripts/resolve-release-version.mjs` samt Troubleshooting (§11) und
Checkliste (§12). .NET-bezogen — Befehle und Asset-Form sind auf Node/Vite zu
mappen; Struktur, Job-Namen (`static checks`, `build & test`,
`no pending backmerge`), RC-Schema `vX.Y.Z-rc.N`, Trigger und die
Promotion-/Backmerge-Mechanik bleiben unverändert.

### `refs/githooks/`

| Datei | Funktion (Vorlage, .NET) | Adaption für dieses Projekt |
|-------|--------------------------|-----------------------------|
| `pre-commit` | Blockt Commits auf `main`/`staging`; führt Translation-/XmlDoc-/L10n-Checks (blockierend) sowie Usage-/Stub-/Enum-Checks (warnend) aus | Branch-Block übernehmen; Checks durch TS-Äquivalente ersetzen |
| `pre-push` | Blockt Pushes auf `main`/`staging`; `--all --strict`-Audit | identisch strukturieren, TS-Prüfskripte aufrufen |
| `install-hooks.sh` / `install-hooks.cmd` | setzen `core.hooksPath` auf `.githooks` | nahezu unverändert übernehmen |
| `no-notimplemented-check.py` | findet `NotImplementedException` und throw-only-Stubs in `.cs` | → `no-stub-check.py` für `.ts`/`.tsx` (`throw new Error("not implemented")`, TODO-Stubs) |
| `translation-check.py` | resx-Schlüsselabgleich | → `i18n-check.py` für `src/i18n/de.json`↔`en.json` + verwendete Schlüssel |
| `razor-usage-check.py` | findet unreferenzierte `.razor`-Komponenten | → `component-usage-check.py` für ungenutzte `.tsx`-Komponenten |
| `csproj-xmldoc-check.py`, `enum-coverage-check.py`, `razor-l10n-check.py` | .NET-/Razor-spezifisch | entfallen ohne Äquivalent (nicht gefordert) |

Nicht aus der Vorlage stammende, geforderte Projektprüfungen:
`map-schema-check.py` (Kartenpaket-Schema für `src/data/maps/*.json` gemäß
Konzept §4) und `no-math-random-check.py` (`Math.random()`-Verbot in
`src/logic/**`, Determinismus-Vorgabe des Projektplans).

## Laufzeitumgebung (verifiziert)

| Werkzeug | Version |
|----------|---------|
| Node | v24.15.0 |
| npm | 11.10.0 |
| Python | 3.13.14 |
| Git | 2.53.0.windows.2 (Git Bash verfügbar) |

npm-Registry erreichbar (`npm ping` erfolgreich).
