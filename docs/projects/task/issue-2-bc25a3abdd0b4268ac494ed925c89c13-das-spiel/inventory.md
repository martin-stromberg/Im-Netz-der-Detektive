# Bestandsaufnahme — Das Spiel (Issue #2)

> Inventur des Repository-Stands auf Branch
> `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel`.
> Grundlage: `requirement.md` (39 FA aus `issue.md` + `docs/konzept/`).
> Alle Aussagen sind per Datei-Lektüre oder ausgeführtem Befehl verifiziert.

## Vorhandener Stand

Das Repository enthält **keinerlei Anwendungscode** für das Spiel.
Verifiziert per `find` über den gesamten Working Tree (`.git` ausgenommen):

- **Kein `src/`** — nicht vorhanden.
- **Kein `package.json`**, kein `node_modules/`, keine Lockfiles.
- **Keine Tests** — keine Testdateien, kein Test-Runner, keine Konfiguration.
- **Kein `.github/`** — keine Workflows, keine Composite Actions.
- **Keine Build-/Linter-/Formatter-Konfiguration** (kein `tsconfig.json`,
  `.eslintrc`, `.prettierrc`, `vite.config.*` o. Ä.).

**Einziger vorhandener Code:** der statische Markdown-Doc-Viewer unter
`docs/konzept/`:

| Datei | Umfang | Funktion |
|---|---|---|
| `docs/konzept/index.html` | 32 Zeilen | Shell mit Sidebar (`#sidebar`, `#nav`, `#progress-box`) und `<article id="doc">`; lädt `marked.min.js`, `purify.min.js`, `app.js` als klassische Skripte |
| `docs/konzept/assets/app.js` | 67 Zeilen | Vanilla-JS-IIFE: lädt `content/manifest.json` per `fetch`, baut Navigation aus `manifest.docs`, Hash-Routing (`#/<datei>`), rendert Markdown via `marked.parse` + `DOMPurify.sanitize`, zählt Checkboxen (`- [ ]` / `- [x]`) über alle Docs für einen Fortschrittsbalken |
| `docs/konzept/assets/style.css` | 217 Zeilen | Dunkles Theme via CSS-Variablen (`:root`), 280-px-Sticky-Sidebar, keine Frameworks |
| `docs/konzept/assets/vendor/marked.min.js` | minifiziert | marked **v12.0.2** (MIT, Header-Kommentar) |
| `docs/konzept/assets/vendor/purify.min.js` | minifiziert | DOMPurify **3.2.4** (Apache-2.0/MPL-2.0, Header-Kommentar) |
| `docs/konzept/content/manifest.json` | 11 Zeilen | `{ "project": "Im Netz der Detektive", "docs": [...] }` mit 6 Einträgen |

**Wiederverwendbarkeit des Viewers:** Der Viewer ist frameworkfrei
(kein Build nötig), manifest-getrieben — ein neues Dokument erscheint durch
einen Manifest-Eintrag plus Markdown-Datei. Er benötigt zwingend einen
lokalen HTTP-Server (`fetch` schlägt unter `file://` fehl; `app.js` Zeile
14–16 zeigt dafür eine eigene Fehlermeldung). Er ist fachlich an
`docs/konzept/` gebunden (fester `content/`-Pfad, Fortschrittsbalken
speziell für Checkbox-Zählung der „Offenen Themen"), aber als Muster für
eine spätere Spiel-Dokumentations-Anzeige direkt kopierbar. Die vendored
Libs (marked, DOMPurify) könnten auch im Spiel selbst genutzt werden,
falls dort Markdown gerendert wird — als npm-Dependency statt vendor copy.

## Dokumentation und Konventionen

- **`docs/konzept/content/`** — verbindliche Spezifikation, 6 Markdown-Dateien
  (Zeilenzahlen per `wc -l`):
  - `00-uebersicht.md` (53 Zeilen): Status-Tabelle — alle Bereiche
    „festgelegt" außer Balancing („kalibrieren") und Multiplayer („später");
    „Nächste Schritte" nennen explizit Projekt-Scaffolding als ausstehend.
  - `01-spielkonzept.md` (271 Zeilen): vollständiges Regelwerk.
  - `02-technisches-konzept.md` (219 Zeilen): Architektur, Stack,
    Kartenpaket-Format, Eventlog.
  - `03-offene-themen.md` (148 Zeilen): Entscheidungsarchiv OT-01 bis OT-36.
  - `04-balancing.md` (80 Zeilen): Startwerte und Kalibrierungsmetriken.
  - `05-website.md` (61 Zeilen): Beschreibung des Doc-Viewers selbst.
- **`README.md`** (39 Zeilen): Projektbeschreibung, Aufruf des Doc-Viewers
  via `start-docs.bat` → `http://localhost:8899` bzw. manuell
  `cd docs/konzept && python -m http.server 8899`, Lizenz-Hinweis.
- **`LICENSE`**: PolyForm Noncommercial License 1.0.0 (118 Zeilen).
  Sachverhalt aus dem Lizenztext: Erlaubt ist jede nicht-kommerzielle
  Nutzung (§ „Noncommercial Purposes", „Personal Uses", „Noncommercial
  Organizations"); kommerzielle Nutzung ist nicht lizenziert. Distribution
  erfordert Mitgabe der Lizenzbedingungen (§ „Notices"). README Zeile
  38–39: „Kommerzielle Nutzung erfordert eine gesonderte Lizenzierung."
- **`.gitignore`** (1 Zeile): enthält nur `issue.md`. Keine Einträge für
  `node_modules/`, `dist/`, Coverage, `.env`, OS- oder Editor-Dateien —
  für ein Node/Vite-Projekt unzureichend.
- **`start-docs.bat`** (11 Zeilen): `cd docs\konzept`, öffnet Browser auf
  `localhost:8899`, startet `python -m http.server 8899`; Kommentar nennt
  `npx serve -l 8899` als Alternative.
- **`issue.md`** (Repo-Root, 18 Zeilen, gitignored): verlinkte Aufgabe #2
  „Das Spiel", Verweis auf die Pattern-Collection-URLs für CI und Hooks.
- **`docs/projects/task/issue-2-…-das-spiel/`** (untracked):
  `requirement.md` (533 Zeilen, 39 FA + offene Fragen), `todo.md`
  (Checkliste, „Bestandsaufnahme" als offener Punkt), `refs/` mit den
  Vorlagen (siehe „Wiederverwendbare Bausteine").
- **`.agents/skills/`** (untracked): Skills `lifecycle/` (15 Dateien) und
  `project/` (6 Dateien) als ASCII-Markdown — Arbeitskonventionen des
  Agenten-Workflows.

## Git- und Remote-Zustand

- **Remote:** `origin` = `https://github.com/martin-stromberg/Im-Netz-der-Detektive`
  (fetch + push, verifiziert via `git remote -v`). Repo laut
  `gh api repos/…`: **public**, `default_branch: main`.
- **Lokale Branches** (`git branch -vv`): `main`, `staging`,
  `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel` — alle drei
  auf Commit `fa788d5`; der Task-Branch hat **kein** Upstream (nicht
  gepusht).
- **Remote-Branches:** `origin/main`, `origin/staging`
  (`origin/HEAD → origin/main`). Nur diese zwei Branches existieren remote
  (`gh api …/branches`).
- **Commit-Historie:** 2 Commits — `bc86423` „Spielkonzept 'Im Netz der
  Detektive' als dokumentierte Website", `fa788d5` „README und
  PolyForm-Noncommercial-Lizenz fuer oeffentliches Repo".
- **Working Tree:** clean bis auf untracked `.agents/` und
  `docs/projects/` (gitignored `issue.md` ist untracked by design).
- **Branch Protection** (`gh api repos/…/branches/{main,staging}/protection`,
  beide Abrufe erfolgreich, HTTP 200): Schutz ist auf **beiden** Branches
  **gesetzt**, mit identischer Konfiguration:
  - `required_pull_request_reviews`: `required_approving_review_count: 1`,
    `dismiss_stale_reviews: false`, `require_code_owner_reviews: false`.
  - `required_status_checks`: `strict: true`, aber **`contexts: []` leer**
    — aktuell sind keine konkreten Checks als Pflicht hinterlegt.
  - `enforce_admins: false`, `required_signatures: false`,
    `required_linear_history: false`, `allow_force_pushes: false`,
    `allow_deletions: false`, `required_conversation_resolution: false`.
- **Labels** (`gh label list`): nur die 10 GitHub-Standardlabels —
  `accessibility`, `bug`, `documentation`, `duplicate`, `enhancement`,
  `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`.
  Keine projektspezifischen Labels.

## Werkzeug-Verfügbarkeit

Verifiziert durch direkte Ausführung auf dem Entwicklungssystem (Windows,
Git Bash):

| Werkzeug | Version | Befehl |
|---|---|---|
| Node.js | **v24.15.0** | `node --version` |
| npm | **11.10.0** | `npm --version` |
| Python | **3.13.14** | `python --version` |
| Git | **2.53.0.windows.2** | `git --version` |
| GitHub CLI | **2.92.0** | `gh --version` (authentifiziert; API-Aufrufe erfolgreich) |
| .NET SDK (`dotnet`) | nicht geprüft/nicht benötigt | — |

Damit sind Scaffold (Vite/npm), Python-basierte Git-Hooks und
CI-Dateierstellung lokal verifizierbar; die CI-Pipeline selbst läuft
remote auf GitHub Actions.

## Relevante Schnittstellen

Zentrale Daten-Schnittstellen und harte Vorgaben aus
`docs/konzept/content/02-technisches-konzept.md` (verbindlich):

- **Kartenpaket-Format (§4, Zeilen 60–122):** JSON-Pakete unter
  `/src/data/maps/<stadt>.json`, geladen/validiert via
  `MapLoader.loadMap(id)`. Pflichtfelder: `nodes[]` (`id`, `name`, `x`,
  `y`, `categories[]`, `zone`), `edges[]` (`a`, `b`, `type` ∈
  `weg`/`fahrt`), `spawnRules` (Modi `choice`/`free`/`random`, optionales
  `minDistanceToDetective`, `order: "detektive_first"`), `settings`.
  Topologieskalierende Settings als `{ suggested, min, max }` (bzw.
  `roundLimit` mit `unlimited: true`); feste Skalarfelder
  (`cameraMinGap`, `hintZoneRadius`, `missionRules`, `eventMix`,
  `sabotageEffects`) sind Karteneigenschaft. `viewBox` für SVG-Rendering.
  Reine Spielregeln bleiben global (nicht im Paket). `cost`-Feld an
  Kanten reserviert.
- **JSONL-Eventlog (§8, Zeilen 156–188):** Event-sourced;
  `header`-Zeile (`gameId`, `mapId`, `seed`, `config`, `mission`,
  `cameras`, `starts`), dann sequenzierte Events (`seq`, `round`, `type`,
  `actor`, `visibleTo`, …), Abschluss `type: "result"` mit `outcome`
  (inkl. `"draw"`, OT-29) und Balancing-Metriken. Rekonstruierbar via
  Seed; `rng.ts` ist einzige Zufallsquelle (kein `Math.random()` in
  Engines). Export per Blob-Download + `localStorage`-Auto-Speicherung.
  §8.1: Save = State-Snapshot + Log + Seed; Replay-Player spielt Logs
  deterministisch ab (zwei Perspektiven über `visibleTo`).
- **Headless-Store (§3, Zeilen 48–58):** Zustand-Store mit imperativen
  Actions, lauffähig ohne UI (KI-vs.-KI treibt denselben Store).
  State-Felder: `round`, `phase` (`"ganove" | "detektive"`),
  `activeDetectiveIndex`, `ganovePosition`, `detektivePositions[]`,
  `mission`, `events[]`, `cameras[]`, `blockedEdges[]`, `eventMode`
  (`cycle | chance | tension`), `tensionValue`, `seed`, `log[]`.
- **i18n/A11y/Audio (§11, Zeilen 202–213):** alle Texte über Schlüssel
  (DE/EN) ab Beginn, keine hartkodierten Strings; nie nur Farbkodierung;
  vollständige Tastaturbedienung; dezente Sound-Dramaturgie.
- **Geplante Modulstruktur (§2/§5 — nicht vorhanden):**
  - `src/components/`: `MapGraph.tsx`, `GanoveUI.tsx`, `DetektiveUI.tsx`,
    `EventPanel.tsx`, `MissionPanel.tsx`
  - `src/logic/`: `Movement.ts`, `EreignisEngine.ts`, `MissionEngine.ts`,
    `CameraSystem.ts`, `DetectiveAI.ts`, `GanoveAI.ts`, `Deduction.ts`,
    `SpawnSystem.ts`, `Recorder.ts`, `ReplayPlayer.ts`, `SaveGame.ts`,
    `MapLoader.ts`, `rng.ts`
  - `src/state/`: `GameState.ts`
  - `src/data/`: `maps/muenster.json`, `maps/luebeck.json`,
    `actions.json`
  - `src/App.tsx`, `src/main.tsx`
- **Weitere Vorgaben:** Stack React 18 + TypeScript + Vite, CSS-Module
  (kein Tailwind) (§1, §9); statischer Build via `vite build` (§10);
  zwei UI-Ansichten GanoveUI/DetektiveUI mit geteilter `MapGraph`
  (§4/§6); Betriebsmodi Mensch-vs.-KI beidseitig + KI-vs.-KI-Dev-Modus,
  später Multiplayer (§7).

## Wiederverwendbare Bausteine

- **Doc-Viewer (`docs/konzept/`):** siehe „Vorhandener Stand" — kann
  später die Spiel-Dokumentation anzeigen; `manifest.json` erlaubt
  beliebige Doc-Listen. `02-technisches-konzept.md` §12 (Zeile 219)
  führt ihn explizit als „Doc-Viewer (Repo-Root): statische
  Markdown-Anzeige der `docs/`".
- **Konzept als Testorakel:** `01-spielkonzept.md` +
  `02-technisches-konzept.md` + `04-balancing.md` enthalten messbare
  Regeln (BFS-Generierungskriterien §5.2 der Requirement, Startwerte,
  Event-Mischungen, Schwellen des Hitze-Indikators), die direkt als
  Test-Assertions dienen können.
- **CI-Vorlage:** `refs/ci-workflows-instructions.md` (1210 Zeilen) —
  Pattern-Collection-Anleitung für eine **.NET-basierte** Pipeline:
  7 Workflows (`verify-pr-source`, `pr-staging-ci`, `staging-ci`,
  `staging-to-main-promotion`, `sync-staging-with-main`, `release`,
  `security-scan`), Composite Actions (`build-and-package`,
  `security-scan`), `update.json`-Manifest, optional
  `release-metadata.json` (msTools.Updater), Skript
  `scripts/resolve-release-version.mjs`, `release.config.js` für
  semantic-release. Struktur/Branchmodell direkt übertragbar, die
  konkreten Schritte (`dotnet …`, Publish-ZIPs) nicht.
- **Git-Hooks-Vorlage:** `refs/git-hooks-readme.md` (38 Zeilen) +
  `refs/githooks/` (11 Dateien):
  - `pre-commit` (72 Zeilen, POSIX `sh`): blockiert Commits auf
    `main`/`staging`; ruft Python-Checks mit fixem Pfad
    `.githooks/` auf; erfordert `dotnet` im PATH und sucht
    `.sln`/`.slnx` — ohne Solution werden die .NET-Checks
    (`SecretScan.csproj`, `MarkdownLinkCheck.csproj`) übersprungen.
  - `pre-push` (26 Zeilen): blockiert direkte Pushes auf
    `main`/`staging`; führt `no-notimplemented-check.py`,
    `razor-usage-check.py`, `enum-coverage-check.py` mit
    `--all --strict` aus.
  - Python-Checks (alle **.NET-/Blazor-spezifisch**):
    `translation-check.py` (275 Z.), `csproj-xmldoc-check.py` (488 Z.),
    `razor-l10n-check.py` (171 Z.), `razor-usage-check.py` (171 Z.),
    `no-notimplemented-check.py` (204 Z.), `enum-coverage-check.py`
    (201 Z.). Die **Muster** (Warnstufe gestagt vs. striktes
    Whole-Repo-Audit, `--all --strict`-Schalter) sind auf TS/React
    übertragbar, die Implementierungen nicht.
  - `install-hooks.cmd`/`.sh` (je 4 Zeilen): setzen
    `git config --local core.hooksPath .githooks` — Verzeichnisname in
    der Vorlage ist `.githooks` (nicht `githooks`).
- **Skill-Konventionen:** `.agents/skills/lifecycle/` enthält u. a.
  `inventory.md`, `implement.md`, `write-tests.md`, `run-tests.md` —
  beschreiben den erwarteten Projekt-Lebenszyklus (untracked,
  Arbeitswerkzeug).

## Einschränkungen und Risiken

- **Komplett fehlend (Neuaufbau nötig):** gesamte Anwendung (`src/`),
  `package.json`/Lockfile/TS-/Vite-/Lint-/Format-Konfiguration, alle
  Tests, alle CI-Workflows (`.github/`), Git-Hooks (`githooks/` oder
  `.githooks/`), `release.config.js`,
  `scripts/resolve-release-version.mjs`, beide Kartenpakete
  (`muenster.json`, `luebeck.json`), i18n-Ressourcen, Audio-Assets.
- **`.gitignore` unzureichend:** deckt nur `issue.md`; `node_modules/`,
  `dist/`, Coverage-Reports, `localStorage`-Exports o. Ä. fehlen.
- **Vorlagen sind .NET-spezifisch:** Der `pre-commit`-Hook verlangt
  `dotnet` und `.sln`/`.slnx` (Zeilen 40–52) und würde in diesem Repo
  scheitern bzw. alle Checks überspringen; die Python-Checks prüfen
  `.cs`/`.csproj`/`.razor`-Dateien und wären hier wirkungslos. Adaption
  auf TS/React (z. B. ESLint/`tsc`, i18n-Schlüssel-Vollständigkeit,
  Stub-Erkennung) ist Bestandteil der Anforderung (FA-38/FA-39), nicht
  fertig vorhanden.
- **Branch Protection gesetzt, aber ohne Pflicht-Checks:** `main` und
  `staging` verlangen 1 approving Review; `required_status_checks` ist
  `strict: true` mit **leerer** `contexts`-Liste — sobald CI-Jobs
  existieren, müssen deren Kontexte ggf. ergänzt werden.
- **Lizenz-Einschränkung:** PolyForm Noncommercial 1.0.0 — keine
  kommerzielle Nutzung; bei Distribution (z. B. deploytes Spiel,
  Release-Assets) müssen Lizenztext/URL mitgeliefert werden
  (§ „Notices"/„Distribution License"). Repo ist **public**.
- **Task-Branch noch nicht remote:** kein Upstream; die
  Prerelease-Pipeline (FA-37) setzt Pushes/PRs auf `staging` voraus.
- **Lizenz der vendored Libs beachten:** marked (MIT), DOMPurify
  (Apache-2.0/MPL-2.0) — Header-Kommentare in den Dateien.

## Zusammenfassung

Das Repository ist ein **Greenfield**: Neben dem Spielkonzept
(`docs/konzept/`, 832 Zeilen verbindliche Spezifikation inkl.
Kartenpaket- und Eventlog-Format), dem statischen Markdown-Doc-Viewer
(einziger Code, ~320 Zeilen Eigenleistung + 2 vendored Libs), README,
PolyForm-NC-Lizenz und den Pattern-Collection-Vorlagen unter
`refs/` existiert **kein** lauffähiger Code, kein Build, keine Tests,
keine CI, keine Hooks. Git-Seitig sind `main` und `staging` lokal wie
remote auf demselben Stand (`fa788d5`), beide remote geschützt
(1 Review, keine Status-Check-Kontexte); der Task-Branch ist nur lokal.
Alle benötigten Werkzeuge (Node 24, npm 11, Python 3.13, Git 2.53,
gh 2.92) sind verfügbar. Der kritischste Adaptionsbedarf liegt in den
.NET-spezifischen CI-/Hook-Vorlagen und dem minimalen `.gitignore`;
die zentralen Daten-Schnittstellen (Kartenpaket §4, JSONL-Eventlog §8,
headless Store §3) sind spezifiziert, aber unimplementiert.
