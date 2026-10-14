# Checks, Hooks & Infrastruktur

## `.githooks/` (lokale Qualitäts-Checks, Python 3)

| Datei | Prüfung | pre-commit | pre-push |
|-------|---------|-----------|----------|
| `i18n-check.py` | Schlüsselparität de/en + `t("…")`-Keys definiert | staged `.ts/.tsx`, blockierend | `--all --strict`, blockierend |
| `map-schema-check.py` | Kartenpaket-Schema | staged, blockierend | `--all --strict` |
| `no-math-random-check.py` | `Math.random(`-Verbot unter `src/logic/` | staged, blockierend | `--all --strict` |
| `no-stub-check.py` | Stub-Implementierungen | Warnung | `--all --strict` |
| `component-usage-check.py` | ungenutzte `.tsx`-Komponenten | Warnung | `--all --strict` |
| `pre-commit` | Branch-Blocker (main/staging), ruft Checks, Prettier auf gestagte Dateien | – | – |
| `pre-push` | Push-Blocker, ruft alle Checks mit `--all --strict` | – | – |
| `install-hooks.cmd`/`.sh` | Hook-Installation | – | – |

**Befund:** Es existiert **kein Check gegen hartkodierte sichtbare Strings** — der neue Check folgt exakt diesem Muster (eigene `.py`-Datei, `pre-commit` staged + `pre-push --all --strict`, `EXCLUDED_DIRS`-Konvention, UTF-8-Ausgabe).

## CI (`.github/workflows/`)

`pr-staging-ci.yml`/`staging-ci.yml`: `format:check`, `lint`, `typecheck`, `npm run coverage` (Schwelle 70 % via `vite.config.ts`), Security-Scan. Die Git-Hook-Skripte laufen lokal (Installations-Skripte), CI-Verankerung erfolgt über npm-Skripte — der neue Check kann zusätzlich über `npm run`-Skript + Workflow-Step angebunden werden.

## Test-Infrastruktur

- **Vitest** (`vite.config.ts`): jsdom, Setup `src/test/setup.ts` (jest-dom-Matcher, `cleanup()`, `useGameStore.getState().resetGame()` je Test), Coverage v8 mit `lines: 70`-Schwelle, `e2e/**` exkludiert.
- **Playwright** (`playwright.config.ts`): Chromium, `webServer` `npm run dev -- --port 5173`, Specs unter `e2e/` (`menu`, `ganove`, `detektiv`, `persistenz` — 26 Tests); `window.__gameStore` in DEV-Builds exponiert (`src/main.tsx`).
- **jsdom hat kein `AudioContext`** — Audio-Engine muss fehlende API tolerieren oder Fabrik injizierbar sein.

## `StorageLike`-Boundary

`src/logic/Recorder.ts` (`StorageLike`), `src/logic/GameIndex.ts` (`resolveStorage`, `defaultStorage`) — injizierbares Persistenz-Muster für Spielstände/Logs; Vorbild für die UI-Einstellungs-Persistenz.
