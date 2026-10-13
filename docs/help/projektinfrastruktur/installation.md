← [Zurück zur Übersicht](index.md)

# Projektinfrastruktur — Installation und Konfiguration

## Voraussetzungen

- Node.js ≥ 22.14 (empfohlen: Node 24) und npm
- Python 3 (für die Qualitätsprüfungen der Git-Hooks)
- Git

## Installationsschritte

1. Repository auschecken.
2. Abhängigkeiten installieren:
   ```
   npm ci
   ```
3. Git-Hooks einmalig aktivieren:
   - Windows: `.githooks\install-hooks.cmd`
   - Linux/macOS/Git Bash: `sh .githooks/install-hooks.sh`

   Beide Skripte setzen `core.hooksPath` auf `.githooks`.

## Konfiguration

| Parameter | Typ | Standardwert | Beschreibung |
|-----------|-----|--------------|--------------|
| `engines.node` in `package.json` | Range | `>=22.14.0` | Mindest-Node-Version (semantic-release 25) |
| `coverage.thresholds.lines` in `vite.config.ts` | Zahl | `70` | Erzwungene Zeilenabdeckung von `npm run coverage` (wirkt lokal und in CI) |
| `branches` in `release.config.js` | Liste | `["main"]` | Einziger semantic-release-Branch; `staging` erzeugt RCs über den CI-Dry-Run |
| `core.hooksPath` | Git-Config | `.githooks` | Durch die Install-Skripte gesetzt |

## Befehle

| Befehl | Wirkung |
|--------|---------|
| `npm run dev` | Vite-Dev-Server |
| `npm run build` | Typprüfung + Produktions-Build nach `dist/` |
| `npm test` | Vitest-Testsuite |
| `npm run coverage` | Tests mit Coverage-Gate (70 % Zeilen) |
| `npm run lint` | ESLint |
| `npm run format` / `npm run format:check` | Prettier schreiben / prüfen |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run release` | `semantic-release` (nur in der CI-Pipeline aufgerufen) |

## Git-Hook-Prüfungen

| Skript | Stufe in `pre-commit` | Stufe in `pre-push` | Prüfung |
|--------|----------------------|---------------------|---------|
| `i18n-check.py` | blockierend (gestagte Dateien) | `--all --strict` | Schlüsselparität `src/i18n/*.json`, verwendete `t("...")`-Schlüssel definiert |
| `map-schema-check.py` | blockierend (gestagte Pakete) | `--all --strict` | Kartenpaket-Schema `src/data/maps/*.json` |
| `no-math-random-check.py` | blockierend (gestagte Dateien) | `--all --strict` | `Math.random()`-Verbot in `src/logic/**` |
| `no-stub-check.py` | Warnung | `--all --strict` | `throw new Error("not implemented")`, throw-only-Rümpfe, TODO-Stubs in `.ts`/`.tsx` |
| `component-usage-check.py` | Warnung | `--all --strict` | unreferenzierte `.tsx`-Komponenten |

Zusätzlich blockiert `pre-commit` Commits und `pre-push` Pushes direkt auf
`main` und `staging`.

## Überprüfung

Erfolgreiche Einrichtung lässt sich prüfen über:

```
git config core.hooksPath   # erwartet: .githooks
npm run typecheck && npm test && npm run lint
```
