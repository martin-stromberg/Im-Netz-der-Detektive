# Test-Ergebnisse

## Ergebnis

**Status:** Keine Fehler

## Fehlgeschlagene Tests

— (Status `Keine Fehler`)

## Zusammenfassung

- Gesamt: 87
- Bestanden: 87
- Fehlgeschlagen: 0
- Übersprungen: 0

Befehl: `npm run coverage` (`vitest run --coverage`), Repo-Root,
Exit-Code 0. Nachweis: [final-coverage.txt](inventory/test-results/final-coverage.txt).

## Testabdeckung

**Abdeckung:** 87,87 % Zeilen (Schwelle: 70 % — erfüllt)

| Datei | Abdeckung (Zeilen) |
|-------|--------------------|
| `src/logic/mapPack.ts` | 77,84 % |
| `src/logic/SpawnSystem.ts` | 97,56 % |
| `src/logic/Graph.ts` | 100 % |
| `src/logic/MapLoader.ts` | 100 % |
| `src/logic/rng.ts` | 100 % |
| `src/state/gameStore.ts` | 100 % |
| `src/App.tsx`, `src/components/PlaceholderPanel.tsx`, `src/i18n/index.ts` | 100 % |

Unter 80 %: nur `src/logic/mapPack.ts` — die ungedeckten Zeilen sind
verteilte Fehlerpfade der Schema-Prüfung; die Kernbranches
(Pflichtfelder, Typfehler, Referenzen, Ranges) sind getestet.

## Fehlende Tests

Keine Quelldatei mit 0 % Abdeckung; keine Quelldatei ohne
korrespondierende Testdatei (Quelle: Coverage-Daten).
