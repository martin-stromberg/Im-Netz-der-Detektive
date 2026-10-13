# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| `npm ci` läuft fehlerfrei | Task 1, 8 (Manifest + Lockfile), Verifikationsschritt 41 | Verifikationsschritt 8 im Plan (`npm ci` clean) | Abgedeckt |
| `npm run build` läuft fehlerfrei | Task 1/3 (`build` = `tsc --noEmit && vite build`), Task 41 | Verifikationsschritt + CI-Job `build & test` | Abgedeckt |
| `npm test` läuft fehlerfrei | Task 1 (`test` = `vitest run`), Tasks 18–20, 22 | `placeholder.test.ts`, `gameStore.test.ts`, `App.test.tsx`, `resolve-release-version.test.mjs` | Abgedeckt |
| `npm run typecheck` läuft fehlerfrei | Task 1 (`typecheck` = `tsc --noEmit`), Task 2 | Verifikationsschritt 41 + CI `static checks` | Abgedeckt |
| ESLint-Prüfung besteht | Task 1 (`lint`), Task 4 | Verifikationsschritt 41 + CI `static checks` | Abgedeckt |
| Prettier-Prüfung besteht | Task 1 (`format`/`format:check`), Task 5 | Verifikationsschritt 41 + CI `static checks` | Abgedeckt |
| Hooks via Install-Skript aktivierbar | Tasks 24–26 (`.githooks/`, `install-hooks.sh`/`.cmd` setzen `core.hooksPath`) | Verifikationsschritt 42 | Abgedeckt |
| `pre-push` blockiert Push auf `main`/`staging` nachweisbar lokal | Task 25 (Ref-Filter `refs/heads/main`/`refs/heads/staging`) | Verifikationsschritt 42 (simulierte Stdin-Eingabe) | Abgedeckt |
| Alle sieben Workflow-Dateien existieren | Tasks 32–38 | Verifikationsschritt 43 (YAML-Validierung) | Abgedeckt |
| Beide Composite Actions existieren | Tasks 39–40 | Verifikationsschritt 43 (YAML-Validierung) | Abgedeckt |
| `pr-staging-ci` und `staging-ci` erzwingen 70-%-Zeilenabdeckung | Task 3 (`thresholds.lines: 70`), Tasks 33–34 (`npm run coverage` im `build & test`-Job) | Verifikationsschritt 41 (`npm run coverage` lokal) + CI-Gate | Abgedeckt |
| `release.config.js` vorhanden | Task 23 | Verifikationsschritt 41 (Lint/Node-Parse) | Abgedeckt |
| `scripts/resolve-release-version.mjs` inkl. Unit-Tests | Tasks 21–22 | `resolve-release-version.test.mjs` (8 Testgruppen) | Abgedeckt |

## Weitere Muss-Anforderungen aus der Beschreibung

| Anforderung | Umsetzung im Plan | Status |
|-------------|-------------------|--------|
| Vite + React 18 + TypeScript | Tasks 1–3, 9–12 | Abgedeckt |
| Feature-Slices `src/components`, `src/logic`, `src/state`, `src/data` mit kompilierenden Platzhaltern | Tasks 12–15 | Abgedeckt |
| Zustand + CSS-Module (kein Tailwind) | Tasks 10, 12, 14 | Abgedeckt |
| Stub-Erkennung analog `no-notimplemented-check.py` | Task 27 | Abgedeckt |
| i18n-Schlüssel-Parität analog `translation-check.py` (`de.json`↔`en.json`) | Tasks 16–17, 28 | Abgedeckt |
| Verwaiste-Komponenten-Check analog `razor-usage-check.py` | Task 29 | Abgedeckt |
| Kartenpaket-Schema-Validierung `src/data/maps/*.json` | Task 30 | Abgedeckt |
| `Math.random()`-Verbot `src/logic/**` | Task 31 | Abgedeckt |
| `pr-staging-ci` mit detect-backmerge, parallelen Jobs, `no pending backmerge` | Task 33 | Abgedeckt |
| `staging-ci` mit `version`-/`prerelease`-Job für `vX.Y.Z-rc.N` | Task 34 | Abgedeckt |
| `release` inkl. manuellem `vX.Y.Z`-Tag-Pfad und Asset-Repair | Tasks 21, 37 | Abgedeckt |
| Wöchentlicher `security-scan` | Task 38 | Abgedeckt |
| `update.json`/`release-metadata.json` entfallen | Designentscheidung: Assets = `["release.zip"]` | Abgedeckt |
| `.gitignore` Node/Vite, `issue.md` bleibt | Task 7 | Abgedeckt |
| Doc-Viewer `docs/konzept/` unangetastet | Seiteneffekte (`.prettierignore`) | Abgedeckt |
| PolyForm-Noncommercial: keine kommerzielle Abhängigkeit | Nur quelloffene OSS-Dependencies | Abgedeckt |

## Fehlende oder unvollständige Testanforderungen

Keine.

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| – (kein Benutzerfluss in der Anforderung; App-Shell ist ein nicht-interaktiver Render-Platzhalter) | – | Nicht erforderlich — begründet im Plan; Render-Nachweis über `renderToString`-Smoke-Test |

## Fehlende oder unvollständige Planbestandteile

Keine.

## Hinweise

- Die remote-seitige Verifikation (Push auf `staging`, RC-Erzeugung, erster
  manueller Promotion-PR, Branch-Protection-Kontexte) ist laut Anforderung
  explizit **nicht** Teil des Lieferumfangs und wird auf Projektebene nach dem
  Merge durchgeführt — im Plan unter „Seiteneffekte und Risiken" vermerkt.
- Der Plan wählt `npm audit` als Security-Scan-Äquivalent der Vorlage und
  ersetzt die ReportGenerator-basierte Coverage-Auswertung durch das native
  Vitest-Threshold-Gate — beides ist die von der Anforderung geforderte
  Node/Vite-Adaption.
