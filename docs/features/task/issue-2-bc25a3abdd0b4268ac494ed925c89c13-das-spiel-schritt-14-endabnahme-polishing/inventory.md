# Bestandsaufnahme — Schritt 14: Endabnahme & Polishing

## Projektstand

Vollständiges Spiel „Im Netz der Detektive" (React 18 + TypeScript + Vite,
Zustand-Store, headless-simulierbare Engine). Beide Perspektiven
(Ganove/Detektiv), Menü, Persistenz, Replay, i18n (de/en), a11y, Audio —
Schritte 1–13 abgeschlossen.

## Relevante Bestandteile

### Engine / KI

- `src/state/gameStore.ts` (1561 Z.) — Spielzustand, Phasenmaschine,
  Missionswahl (`pendingChoice` / `chooseMissionPath`), Sabotage-Effekte.
- `src/logic/GanoveAI.ts` (328 Z.) — Ganove-KI mit Heuristik-Konstanten:
  `SAFE_ACTION_GAP = 2` (Z. 28), `RADIO_HEAT_THRESHOLD = 3` (Z. 30),
  `EVADE_DISTANCE = 2` (Z. 35), `MOVE_SAFE_GAP = 3` (Z. 40).
  Aktionslogik: Aktion nur bei `dangerAt(pos) >= SAFE_ACTION_GAP` und
  Heat ≠ kritisch (außer Deadline). Zug-Scoring als lexikografisches Tupel.
- `src/logic/DetectiveAI.ts` (173 Z.) — Detektiv-KI.
- `src/logic/AiSimulation.ts` — `runAiGame`/`runAiBatch`/`summarizeBatch`
  (Outcome-Verteilung, Runden, Hinweise, Kameratreffer, Sabotage-Quoten,
  Radio-Nutzung).
- `scripts/sim.ts` — Batch-CLI (`npm run sim`, SSR-Build via
  `vite.sim.config.ts` → `dist-sim/sim.mjs`); Optionen: `--map`, `--games`,
  `--seeds`, `--detectives`, `--round-limit`, `--mission`, `--out`.

### Karten / Balancing-Parameter

- `src/data/maps/muenster.json` — 59 Knoten/101 Kanten; Settings:
  detectiveCount 4 (2–6), cameraCount 8 (0–15), roundLimit 30 (≥15/unbegrenzt),
  radioHintCount 5, edgeBlockRounds 3, eventMode „tension",
  eventMix (sichtbarkeit .25/hinweis .45/umwelt .3), missionRules
  (sabotageDetour 4 u. a.).
- `src/data/maps/luebeck.json` — 22 Knoten/39 Kanten; detectiveCount 5,
  cameraCount 6, roundLimit 20.
- `src/data/missions/muenster.json` — vordefinierte Fälle.
- `src/data/maps/teststadt.json` — Testkarte.

### E2E

- `e2e/` — 5 Spec-Dateien, 29 Tests: `menu.spec.ts` (8), `ganove.spec.ts` (5),
  `detektiv.spec.ts` (7), `persistenz.spec.ts` (6), `i18n-a11y.spec.ts` (3).
- `playwright.config.ts` — testDir `e2e`, chromium, trace `retain-on-failure`,
  webServer `npm run dev -- --port 5173`, baseURL `http://localhost:5173`.
- **Noch nicht in CI verdrahtet.**

### CI

- `.github/workflows/pr-staging-ci.yml` + `staging-ci.yml` — Jobs:
  detect-backmerge, static-checks, build-and-test (inkl. Coverage-Upload);
  staging zusätzlich version/prerelease. Kein E2E-Job.
- CI-Template: `docs/projects/task/.../refs/ci-workflows-instructions.md`
  Abschnitt 4 („best-effort test category", `continue-on-error`) und 11.4
  (Trace-Upload `if: always()`).
- `.githooks/` — pre-commit/pre-push inkl. Checks (i18n, map-schema,
  no-hardcoded-strings, no-math-random, no-stub).

### Assets

- `src/assets/` — `ASSETS.md`, `title-noir.jpg` (Hauptmenü,
  `MainMenu.tsx`), `map-muenster.jpg` + `map-luebeck.jpg`
  (`MapSelect.tsx`). Alle 768×768 JPEG, Pollinations.ai, lokal.
- Fehlend lt. Anforderung: Texturen/Hintergründe, Fall-Artworks für
  vordefinierte Fälle (`src/data/missions/muenster.json`).

### UI / i18n

- `src/components/` — 14 Screens/Komponenten + CSS-Module; `MainMenu`,
  `MapSelect` nutzen bereits Rasterassets.
- `src/i18n/de.json` + `en.json` — je 259 Zeilen, paritätisch.

### Qualitäts-Gates

- `npm run test` (vitest, jsdom), `npm run coverage` (≥70 % lines,
  `vite.config.ts`), `npm run lint`, `npm run typecheck`,
  `npm run format:check`, `npm run build`, `npm run test:e2e`,
  `npm run check:strings`.

## Baseline-Messung (dieser Lauf, vor Kalibrierung)

`npm run sim -- --map muenster --games 100 --seed-start 1`:

- caught 84 % · surrounded 10 % · escaped 0 % · timeout 6 % · draw 0 %
- Detektiv-Siege 100 % | Ganove-Siege 0 % (Ziel: 40–50 %)
- Runden Ø 11.2 (3–30) | Hinweise Ø 3.4 | Kameras Ø 1.5
- Sabotage-Annahmequote — (Binärwahl praktisch nie erreicht) | Radio 53 %

→ Bestätigt den Schritt-8-Befund: Münster-Standard zu detektiv-lastig.

## Risiken / Hinweise

- `chooseSabotagePath` akzeptiert nur bei Detour ≤ `sabotageDetour` (4) und
  Heat ≠ kritisch — Annahmequote hängt an Missionsgeometrie, nicht nur am
  Schwellwert; ggf. `sabotageDetour`/`missionRules` im erlaubten Rahmen prüfen.
- Pollinations-Verfügbarkeit ist extern; Fallback dokumentieren.
- E2E-Laufzeit lokal beachten (29 Specs, dev-server-basiert).
