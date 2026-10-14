# Tasks: i18n final, Barrierefreiheit, Audio (Schritt 13)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | i18n | `src/i18n/index.ts` um `Language`, `getLanguage`, `hasTranslation`, `resolveText` und `lang`-Parameter in `t()` erweitern | Offen | — |
| 2 | UI-State | `src/state/uiPrefs.ts` (language/audioVolume/audioMuted + `StorageLike`-Persistenz) anlegen | Offen | — |
| 3 | i18n | `App`-Subscription auf `language` + `document.documentElement.lang`-Sync | Offen | — |
| 4 | UI | `AppSettingsScreen.tsx` anlegen (Sprach-Toggle, Lautstärke, Mute) | Offen | — |
| 5 | UI | `MenuScreen`-Union um `"appSettings"` erweitern, `menu.settings`-Button in `MainMenu`, Route in `App` | Offen | — |
| 6 | i18n-Daten | `MissionCase.nameKey`/`storyKey` + Validierung (`MissionSystem.ts`), Keys in `muenster.json` + Kataloge | Offen | — |
| 7 | i18n-Daten | `MapPack.taglineKey` + Validierung (`mapPack.ts`), Keys in `muenster`/`luebeck.json` + Kataloge | Offen | — |
| 8 | i18n | `resolveText` in `MissionSelect` (name/story) und `MapSelect` (tagline) einsetzen | Offen | — |
| 9 | i18n | Neue Katalogschlüssel DE+EN (`appsettings.*`, `menu.settings`, `map.tagline.*`, `mission.case.*`, `map.keyboardHint`) | Offen | — |
| 10 | Check | `.githooks/no-hardcoded-strings-check.py` erstellen | Offen | — |
| 11 | Check | Check in `pre-commit`/`pre-push` verdrahten + `check:strings` npm-Skript | Offen | — |
| 12 | Check | Vom Check gemeldete Restverstöße beheben | Offen | — |
| 13 | A11y | `MapGraph`-Pfeiltasten-Wanderung über interaktive Knoten (Ref-Registry + Richtungswahl) | Offen | — |
| 14 | A11y | `role="alert"`/`aria-live`-Regionen für Notices/Status/Outcome in den Screens | Offen | — |
| 15 | A11y | `MissionPanel .status_erledigt` Kontrastfix + `:focus-visible`-Outlines + Paletten-Doku-Kommentar | Offen | — |
| 16 | Audio | `src/audio/AudioEngine.ts` (Fabrik, Unlock-Gating, Hitze-Signale, Ambient, Volume/Mute, no-op ohne AudioContext) | Offen | — |
| 17 | Audio | `src/audio/gameAudio.ts` (Store-Binding: Stufenanstieg→Signal, Spielzustand→Ambient) + Installation in `App`/`GanoveScreen` | Offen | — |
| 18 | Tests | `src/test/setup.ts` um uiPrefs-Reset + Persistenz-Key-Entfernung erweitern | Offen | — |
| 19 | Tests | `uiPrefs.test.ts`, `i18n`-Tests, `AudioEngine.test.ts`, `gameAudio.test.ts` | Offen | — |
| 20 | Tests | `AppSettingsScreen.test.tsx`, `MapGraph`-Pfeiltasten-Test, `MissionSelect`/`MenuScreens`/`App.test`-Ergänzungen | Offen | — |
| 21 | E2E | `e2e/i18n-a11y.spec.ts`: Sprachwechsel-Laufzeit, Tastatur-Kernflow, Audio-/Sprach-Persistenz | Offen | — |
