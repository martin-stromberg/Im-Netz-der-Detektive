# Bestandsaufnahme: Entwicklungsschritt 1 — Projekt-Scaffold und Qualitätsinfrastruktur

Analysiert wurde der komplette Repository-Bestand bezogen auf die Anforderung,
ein buildbares Vite/React/TypeScript-Gerüst samt Git-Hooks und CI-Pipeline
aufzusetzen (Greenfield).

## Zusammenfassung

- **Kein Anwendungscode vorhanden:** Es existiert kein `src/`, kein
  `package.json`, keine Build-/Test-Konfiguration — Greenfield wie in der
  Anforderung beschrieben.
- **Vorhandene Inhalte:** `README.md` (Projektbeschreibung), `LICENSE`
  (PolyForm Noncommercial 1.0.0), `issue.md` (Aufgabenbeschreibung, in
  `.gitignore` eingetragen), `start-docs.bat` und der statische Doc-Viewer
  unter `docs/konzept/` (bleibt unangetastet) sowie die Konzept-Dokumente
  unter `docs/konzept/content/`.
- **Verbindliche Vorlagen:** `docs/projects/task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel/refs/`
  enthält die CI-Workflows-Anleitung (`ci-workflows-instructions.md`), das
  Git-Hooks-Readme und die .NET-bezogenen Referenz-Prüfskripte unter
  `refs/githooks/` (`pre-commit`, `pre-push`, `install-hooks.*`,
  `no-notimplemented-check.py`, `translation-check.py`, `razor-usage-check.py`,
  `csproj-xmldoc-check.py`, `enum-coverage-check.py`, `razor-l10n-check.py`).
- **Kartenpaket-Format** ist unter `docs/konzept/content/02-technisches-konzept.md`
  §4 spezifiziert (`id`, `name`, `viewBox`, `nodes[]`, `edges[]`,
  `spawnRules`, `settings`) — Grundlage für `map-schema-check.py`.
- **Toolchain vorhanden:** Node v24.15.0, npm 11.10.0, Python 3.13.14,
  Git 2.53 (Git Bash auf Windows) — Registry-Zugriff verifiziert.
- **Remote:** `origin` = github.com/martin-stromberg/Im-Netz-der-Detektive;
  `main` und `staging` existieren remote und sind aktuell inhaltsgleich.
- `.gitignore` enthält bislang nur den Eintrag `issue.md` (muss erhalten
  bleiben und um Node/Vite-Einträge ergänzt werden).

Test-Ausgangszustand: Es existieren **keine Tests und kein Test-Framework** —
es gibt nichts auszuführen. Details und Nachweis in
[Tests](inventory/tests.md).

## Details

- [Repository-Struktur und vorhandene Artefakte](inventory/struktur.md)
- [Tests / Test-Ausgangszustand](inventory/tests.md)
