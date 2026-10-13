# Abnahmeprüfung – Entwicklungsschritt 1

## Ergebnis

**Status:** Anforderung vollständig erfüllt

## Abweichungen

- [ ] Keine.

## Hinweise

Dies ist der **2. Abnahmedurchlauf** (Nachprüfung). Durchlauf 1 ist
archiviert unter
`docs/projects/task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel/acceptance-schritt-1.1.md`
und fand genau eine Abweichung: `.gitattributes` pinnte `eol=lf` nicht für
alle Prettier-geprüften Dateitypen, sodass `npm run format:check` auf
Windows-Klonen mit `core.autocrlf=true` fehlschlug. Die Korrektur erfolgte
in Commit `7846d2a` (Nachweis:
`docs/features/task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-1-scaffold-qualitaet/korrektur-1.md`).

Prüfumgebung: Windows-Checkout mit `core.autocrlf=true` (exakt die
Umgebung des Durchlauf-1-Befunds), Node v24.15.0 / npm 11.10.0, Branch
`task/...-schritt-1-scaffold-qualitaet`, Stand `7846d2a`.

### Verifikation der Korrektur

- `.gitattributes` gelesen: globale Regel `* text=auto eol=lf` vorhanden;
  explizite `eol=lf`-Regeln für `.githooks/*`, `*.sh`, `*.yml`, `*.mjs`
  als Absicherung beibehalten; binäre Ausnahmen (`*.png`, `*.woff*`,
  `*.pdf` u. a.) ergänzt.
- `git ls-files --eol` — Stichprobe aller Prettier-geprüften Typen
  (`.ts`, `.tsx`, `.json`, `.css`, `.html`, `.md`, `.mjs`): sämtlich
  `i/lf w/lf`. Vollprüfung: von allen getrackten Dateien zeigt nur das
  leere `src/data/maps/.gitkeep` `i/none w/none` (inhaltslos, kein
  EOL-Befund).
- `npm run format:check` — **Exit 0** („All matched files use Prettier
  code style!"); in Durchlauf 1 Exit 1 mit Befund `src/i18n/en.json`.

### Erneute Nachweise

| Befehl | Ergebnis |
| --- | --- |
| `npm run build` (`tsc --noEmit` + `vite build`) | Exit 0, `dist/` erzeugt (index.html 0.40 kB, CSS 0.47 kB, JS 142.72 kB) |
| `npm test` (`vitest run`) | Exit 0, 4 Testdateien / 25 Tests grün |
| `npm run typecheck` (`tsc --noEmit`) | Exit 0 |
| `npm run lint` (`eslint .`) | Exit 0 |
| `npm run coverage` (`vitest run --coverage`) | Exit 0, 100 % Zeilen/Zweige/Funktionen |

Coverage-Schwelle: `vite.config.ts` Zeile 12–14 setzt
`test.coverage.thresholds.lines: 70` (Provider v8) — die 70-%-Schwelle
ist konfiguriert und wird über `npm run coverage` in den CI-Workflows
erzwungen (`staging-ci.yml` Zeile 106).

### Workflow-Verdrahtung (Stichprobe)

- Alle 7 Workflows in `.github/workflows/` (`pr-staging-ci.yml`,
  `release.yml`, `security-scan.yml`, `staging-ci.yml`,
  `staging-to-main-promotion.yml`, `sync-staging-with-main.yml`,
  `verify-pr-source.yml`) und beide Composite Actions in
  `.github/actions/` (`build-and-package`, `security-scan`) per
  YAML-Parser validiert — 9/9 fehlerfrei.
- `staging-ci.yml`: `version`-Job (Zeile 116) mit Output `rc_version`
  (Zeile 126, zusammen mit `changed`, `version`, `rc_tag`) und
  `prerelease`-Job (Zeile 182), der `needs.version.outputs.rc_version`
  an `build-and-package` weitergibt (Zeile 195) — korrekt.
- `staging-to-main-promotion.yml`: `workflow_run`-Trigger (Zeile 8–11)
  auf `workflows: ["Pre-Release"]` — verweist auf den Display-Namen von
  `staging-ci.yml` (`name: Pre-Release`, Zeile 1); `branches: [staging]`,
  Job-Guard `conclusion == 'success'` (Zeile 24) — korrekt.

Nicht prüfbar/außerhalb dieser Abnahme (Projektebene): tatsächlicher
`staging`-Push, RC-Erzeugung, Promotion-PR, Branch-Protection-Kontexte.
