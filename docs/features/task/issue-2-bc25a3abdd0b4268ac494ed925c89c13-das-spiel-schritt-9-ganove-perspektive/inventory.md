# Bestandsaufnahme — Schritt 9: Ganove-Perspektive

Stand: Branch `task/…-schritt-9-ganove-perspektive`, Commit `7e5f083`
(entspricht Basisbranch `task/…-das-spiel`, Schritt 8 gemergt).
Uncommittete Änderungen beim Lauf: `package.json`/`package-lock.json`
(neue devDependencies `@playwright/test`, `@testing-library/react`,
`@testing-library/user-event`, `@testing-library/dom`, `jsdom` —
vorbereitend für diesen Schritt), Feature-Docs-Verzeichnis.

## Detaildokumente

- [Store-API und Phasenmaschine](inventory/store-api.md)
- [Logik-Module (KI, Spawn, Mission, Info)](inventory/logic-modules.md)
- [UI-Bestand, i18n und Kartenpakete](inventory/ui-i18n-maps.md)
- [Test-Ausgangszustand und Infrastruktur](inventory/tests.md)

## Zusammenfassung

- Die Engine ist vollständig headless spielbar: `useGameStore`
  (`src/state/gameStore.ts`, 1414 Zeilen) enthält alle benötigten Actions
  und Getters — es ist **keine** Engine-Erweiterung für die UI nötig.
- `DetectiveAI.chooseDetectiveMove` + `AiSimulation.buildDetectiveView`/
  `aiRng` liefern alles für einen deterministischen KI-Detektiv-Treiber;
  die Detektiv-Startpositionen stehen im Log-Header
  (`log[0].starts.detectives`), sind also aus dem Store rekonstruierbar.
- UI-Bestand ist nur die Platzhalter-Shell (`App.tsx` +
  `PlaceholderPanel.tsx`); CSS-Module und `t()`-i18n sind etabliert.
- Testinfrastruktur: Vitest 5 + v8-Coverage (Schwelle 70 % Zeilen),
  neu installiert: Testing Library + jsdom (Komponententests) und
  Playwright inkl. heruntergeladenem Chromium (echte E2E).
- Qualitäts-Hooks (pre-commit): i18n-Parität/`t()`-Nutzung,
  Map-Schema, `Math.random`-Verbot in `src/logic/`, Prettier-Check auf
  gestagte Dateien.
