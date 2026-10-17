# Testergebnisse (Schritt 10)

Alle Gates lokal auf dem Feature-Branch ausgeführt.

| Gate | Ergebnis |
|------|----------|
| `npm run test` (Vitest) | **581/581 Tests grün** (50 Dateien) |
| `npm run coverage` | Statements **92.27 %**, Branches 84.81 %, Functions 94.52 %, Lines 91.92 % — Ziel ≥70 % übertroffen |
| `npm run test:e2e` (Playwright) | **29/29 Tests grün** (~17 s, chromium) |
| `npm run build` | ✅ (Vite 8, dist + dist-sim) |
| `npm run lint` | ✅ 0 Fehler/Warnungen |
| `npm run typecheck` (`tsc --noEmit`) | ✅ |
| `npm run format:check` (Prettier) | ✅ |
| `npm run check:strings` | ✅ 17 .tsx-Dateien, keine hartkodierten Strings |
| `map-schema-check.py --all` | ✅ 3 Kartenpakete valide |
| `npm run sim` (400 Seeds, Münster) | **~48 % escaped, ~50 % Sabotage-Annahme** (Details: `docs/help/spiel-engine/balancing-bericht.md`) |

## E2E-Abdeckung (Anforderungsspitzen)

- Menü → Kartenwahl → Modus → Einstellungen → Missionswahl → Startaufstellung → Partie (menu.spec)
- Komplette Partie Ganove-Perspektive inkl. Aktionen + Sabotage-Binärwahl + Flucht (ganove.spec)
- Komplette Partie Detektiv-Perspektive inkl. Hinweis-Chronik + Asymmetrie-Assertions „nichts leakt" (detektiv.spec)
- Speichern/Laden beider Perspektiven, Log-Verwaltung, Export (persistenz.spec)
- Replay: deterministisches Stepping + Abspielen bis zum Ende (persistenz.spec)
- Statistiken (menu.spec, persistenz.spec)
- Sprachwechsel live + persistiert, Lautstärke-Persistenz (i18n-a11y.spec)
- Tastatur-Bedienbarkeit (i18n-a11y.spec + detektiv.spec)

## Behobene Befunde aus dem Testlauf

- 4 E2E-Specs auf die kalibrierten Münster-Defaults angepasst
  (3 statt 4 Detektive; Verlierer-Seed 4→9, da der alte Seed nach
  Kalibrierung entkommt).
- ReplayPlayer-Harness-Bug: `observe` übersprang Radio-/Wahl-Züge —
  korrigiert, Reproduktionssicherheit wiederhergestellt.
