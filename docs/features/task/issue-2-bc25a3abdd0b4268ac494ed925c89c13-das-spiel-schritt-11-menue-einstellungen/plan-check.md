# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| Einstellungen auf Karten-Bereiche begrenzt; ungültige Werte verweigert | `SettingsScreen` liest `{suggested,min,max}` aus `MapPack.settings`; `gameStore` validiert (`GameConfigError`) | `SettingsScreen.test.tsx`, `gameStore.events.test.ts`, E2E „unbegrenzt"/Korridor | Abgedeckt |
| „unbegrenzt" wählbar wo erlaubt | `roundLimit: null` nur bei `settings.roundLimit.unlimited` (UI-Angebot + Store-Validierung) | `SettingsScreen.test.tsx`, E2E Münster vs. Lübeck | Abgedeckt |
| Karten-/Modus-/Missions-Auswahl führen in den Spielstart | `App`-Zustandsfluss + `PendingGameConfig` + `startImmediately` | E2E Happy Path Ganove + Detektiv | Abgedeckt |
| Fälle mit Name + Mini-Story | `MissionSelect` listet `loadMissionSet`-Fälle mit `name`/`story` | `MissionSelect.test.tsx`, E2E Detektiv-Fluss | Abgedeckt |
| Spielerdefinierte Missionen validiert | `CustomMissionPicker` (Kategorien) + `validateCustomTargets` (Kriterien) | `MissionSelect.test.tsx`, E2E Custom-Flow | Abgedeckt |
| Spawn-Flow: Detektive zuerst, Ganove zuletzt, kein Unter-Mindestabstand-Angebot | `spawnSequence`-Ordnung bleibt; `ganoveSpawnChoicesForMission` filtert `minDistanceToDetective` + Kriterien | `SpawnSystem.test.ts`, `gameStore.events.test.ts`, E2E | Abgedeckt |
| Weitere Städte nur „in Vorbereitung" | `FORTHCOMING_MAPS` disabled-Karten | `MenuScreens.test.tsx`, E2E | Abgedeckt |
| Menütexte i18n (DE/EN paritätisch) | alle Strings über `t()`, beide Kataloge, Hook `i18n-check.py` | bestehender Hook + Komponententests | Abgedeckt |
| Rasterassets gesichtet, lizenzgeprüft, lokal, keine Hotlinks | Download in `src/assets/`, `ASSETS.md` mit Prompt/Lizenz, sonst dokumentierter Fallback | Sichtprüfung + `ASSETS.md` | Abgedeckt |
| Hauptmenü: neue Partie, Partie fortsetzen, Statistiken/Replay (Eintragstruktur) | `MainMenu` + `GameIndex` (`GameSummary`, `ResumeEntry`) | `GameIndex.test.ts`, `MenuScreens.test.tsx`, E2E | Abgedeckt |
| Modus-Auswahl inkl. Dev-Modus (KI-vs.-KI mit Aufzeichnung) | `ModeSelect` + `DevModeScreen` auf `runAiBatch`/`summarizeBatch`; Aufzeichnung via `saveGameLog`-Auto-Persist | `MenuScreens.test.tsx`, E2E Dev-Batch | Abgedeckt |
| Ereignismodus + Kadenz einstellbar | `StartGameOptions.eventMode`/`eventDefaults`, `cadenceToEventDefaults` | `gameStore.events.test.ts`, `gameSetup.test.ts`, `SettingsScreen.test.tsx` | Abgedeckt |

## Fehlende oder unvollständige Testanforderungen

— (Status „Plan vollständig")

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| Kompletter Menü→Spielstart-Fluss (Ganove) | `menu.spec.ts` Happy Path | Abgedeckt |
| Menü→Spielstart (Detektiv) inkl. Fall + Story | `menu.spec.ts` | Abgedeckt |
| Settings-Bereiche + „unbegrenzt" | `menu.spec.ts` | Abgedeckt |
| Custom-Mission-Validierung | `menu.spec.ts` | Abgedeckt |
| „In Vorbereitung"-Städte | `menu.spec.ts` | Abgedeckt |
| Dev-Modus-Batch + Outcome-Verteilung | `menu.spec.ts` | Abgedeckt |
| Stats/Fortsetzen-Einträge | `menu.spec.ts` | Abgedeckt |
| `?mode=` Deep-Links (Bestand) | `ganove.spec.ts`/`detektiv.spec.ts` unverändert grün | Abgedeckt |

## Fehlende oder unvollständige Planbestandteile

— (Status „Plan vollständig")

## Hinweise

- `custom`-Mission ohne Kategoriepools wäre unspielbar — beide
  Spielekarten besitzen alle vier Pools (Bestandsaufnahme `data.md`).
- Die `teststadt`-Fixture bleibt über `?map=` erreichbar, erscheint aber
  nicht im Menü (`MENU_MAP_IDS` kuratiert); im Dev-Modus ist sie als
  schnelle Fixture zugelassen und als solche gekennzeichnet.
- Dev-Modus-Entscheidung „Batch-Auslöser mit Zusammenfassung" (statt
  Live-Beobachtung) ist im Plan als Designentscheidung begründet.
