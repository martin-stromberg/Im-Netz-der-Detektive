# Plan-Review (Schritt 7, bedingt)

## Gegenprüfung Plan vs. Umsetzung

| Planpunkt | Umgesetzt | Anmerkung |
|-----------|-----------|-----------|
| E2E-Lücken schließen + `npm run test:e2e` verbindlich | ✅ | Suite war weitgehend vollständig; 4 Specs auf kalibrierte Defaults angepasst (Detektivzahl 3, Verlierer-Seed 9). Alle 29 Tests grün. |
| E2E-Job in beide Workflows (`continue-on-error`, Playwright-Browser installieren, Trace-Upload `if: always()`) | ✅ | `e2e`-Job in `pr-staging-ci.yml` + `staging-ci.yml` nach CI-Template §4. |
| Balancing 40–50 % Ganove-Siege, ~50/50 Sabotage über ≥100 Seeds | ✅ | ~48 % Escapes / ~50 % Annahme über 400 Seeds Münster; Lübeck 47 % Escapes (Sabotage dort 100 % — dokumentierte Abweichung, Inselkarte erzeugt nur billige Umwege). |
| Heuristik zuerst, Kartenwerte nur im erlaubten Bereich | ✅ | GanoveAI (EVADE/MOVE/RADIO/SABOTAGE_ACCEPT) + DetectiveAI (INTEL_LAG, RANDOM_MOVE_CHANCE mit Momentum); Münster-Defaults innerhalb `min`/`max`. `minDistanceToDetective=4` getestet → zurückgenommen (SpawnError bei voller Besetzung — Bereichsverletzung). |
| Rasterassets: Titel/Karten/Fall-Artworks/Textur via Pollinations, lokal, ASSETS.md | ✅ | 3 neue Dateien (bg-noir, 2 Fall-Artworks) + Einbindung (Screen-Hintergrund, Fallkarten). Rate-Limit (402) → Retry mit Pausen. |
| Sim-Bericht `docs/help/` mit Vorher/Nachher | ✅ | `docs/help/spiel-engine/balancing-bericht.md`. |
| `docs/konzept/` unberührt | ✅ | Kein Diff dort. |
| Kein Merge/Push/PR | ✅ | – |

## Befunde während der Umsetzung (behoben)

1. `Infinity−Infinity = NaN` in der Zugbewertung → `rank()`-Klemme.
2. `observe`-Hook in `runAiGame` übersprang Radio-/Wahl-Züge → Snapshot-Stream driftete (ReplayPlayer-Test) → observe nach jedem Actor-Turn.
3. Vordefinierte Fälle verletzten `maxGap 4`/`routeBudget 15` (GameConfigError) → `maxGap 5`, Budgets zurück auf 18/22.
4. `minDistanceToDetective = 4` → kein legaler Ganoven-Start bei voller Detektivbesetzung → zurück auf 3.

## Entscheidung

Keine weitere Iteration nötig — alle Gates grün, kein Schleifenabbruch, daher **kein `continue.md`**.
