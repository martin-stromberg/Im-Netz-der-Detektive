# Code-Review (Schritt 9)

## Geänderte Kern-Dateien

- `src/logic/GanoveAI.ts` — kalibrierte Konstanten, `SABOTAGE_ACCEPT_DETOUR`,
  Fortschritts-Pool, `cameFromNodeId`-Anti-Oszillation, `rank()`-Klemme.
- `src/logic/DetectiveAI.ts` — `DETECTIVE_INTEL_LAG`, `DETECTIVE_RANDOM_MOVE_CHANCE`
  mit Patrouillen-Momentum (`previousPositions`); `DetectiveView` optional erweitert.
- `src/logic/AiSimulation.ts` — beide Views mit Ableitung aus dem Log;
  `observe` nach Radio-/Wahl-Zügen (Harness-Fix).
- `src/data/maps/muenster.json` — kalibrierte Defaults innerhalb erlaubter Bereiche.
- `scripts/sim.ts` — `--cameras`-Override (Kalibrierungswerkzeug).
- `src/components/MissionSelect.tsx`, `src/assets/caseArt.ts`,
  `GanoveScreen.module.css` — Fall-Artworks + Hintergrundtextur.
- `src/i18n/{de,en}.json` — `mission.caseArtAlt`.
- `.github/workflows/{pr-,}staging-ci.yml` — best-effort E2E-Job.
- `e2e/{menu,persistenz,ganove}.spec.ts` — kalibrierte Defaults/Seeds.

## Befunde

1. **Informationsasymmetrie**: `DetectiveView.previousPositions` wird aus
   dem öffentlichen Log abgeleitet (Detektiv-Moves sind `visibleTo: both`)
   — kein Leak. `GanoveView.cameFromNodeId` ebenso (eigene Moves).
2. **Determinismus**: alle Zufallszüge laufen über die injizierten
   `aiRng`-Lanes; der RNG-Draw wird auch im Nicht-Patrouillen-Fall
   konsumiert → Seed-stabile Streams (Replay-Test grün).
3. **Kein toter Code**: `DANGER_ROUTE_PENALTY`-Experiment vollständig
   entfernt; `heatLevel` bleibt im View (UI-/Funk-Nutzung).
4. **React-Muster**: kein `RaiseUiActionRequested`-Pattern (Blazor-
   spezifisch, nicht anwendbar) — keine offenen Handler-Lücken.
5. **Robustheit**: `pick` auf leerem Pool verhindert (Pool-Fallback bis
   `legalMoves`; leerer Fall wirft dokumentierten `RangeError`).
6. **Neue Abhängigkeiten**: keine.

## Risiken

- `DETECTIVE_RANDOM_MOVE_CHANCE = 0.95` schwächt den Trupp spürbar —
  dokumentierte, bewusste Kalibrierung (Balancing-Bericht). Für den
  Ganove-Modus ist der Trupp damit schlagbar, bleibt aber spielbar.
- Lübeck-Sabotage-Annahme 100 % (Inselgeometrie) — dokumentiert.
