# Abnahmeprüfung – Entwicklungsschritt 11

## Ergebnis

**Status:** Anforderung vollständig erfüllt

## Abweichungen

- [ ] Keine.

## Hinweise

Geprüft auf Branch `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-11-menue-einstellungen`, Commit `c0d4388`, gegen `project-plan.md` §„Schritt 11" (Zeilen 515–563).

**Qualitätsgates (selbst ausgeführt):**
- `npm test`: 40 Dateien / 494 Tests — alle grün.
- `npm run coverage`: 92,28 % Statements, 84,67 % Branches, 96,53 % Functions, 91,89 % Lines — Schwelle ≥ 70 % deutlich überschritten.
- `npm run build`: erfolgreich; die drei JPEGs werden lokal ins Bundle eingebettet.
- `npm run lint`: ohne Befund. `npm run typecheck`: ohne Befund.
- `npm run test:e2e`: 20/20 Tests grün, darunter die neue `e2e/menu.spec.ts` (Menüflow, „unbegrenzt"-Seiten, Custom-Mission, Dev-Modus, Statistik).

**Akzeptanzkriterien im Einzelnen:**
1. **Einstellungen auf Karten-Bereiche begrenzt:** `src/components/SettingsScreen.tsx` (Z. 34–38, 94–120) prüft jedes Feld gegen `{min,max}` und verweigert `onContinue` bei Verstoß (Fehlerliste `settings-errors`). „unbegrenzt" wird nur gerendert, wenn `roundLimit.unlimited === true` (Z. 92, 176–190): Münster (`unlimited: true`) zeigt die Checkbox, Lübeck (`max: 30`) nicht — beide Seiten durch Unit-Test (`SettingsScreen.test.tsx` Z. 31–39) und E2E (`menu.spec.ts` Z. 91–112) abgedeckt. Unter-Minimum-Ablehnung ist zusätzlich store-seitig abgesichert und getestet (`gameStore.rounds.test.ts` Z. 58–66; `inRange` prüft symmetrisch min/max). Ereignismodus/-kadenz werden in `resolveEventMode`/`resolveEventDefaults` (`gameStore.ts` Z. 487–532) erneut validiert (`GameConfigError`-Tests in `gameStore.events.test.ts` Z. 45–54).
2. **Auswahl → Spielstart:** `App.tsx` (Z. 70–154) implementiert den Flow menu → map → mode → settings → mission → game; E2E führt beide Perspektiven bis `data-view="playing"`. Fälle mit Name + Mini-Story: Münster liefert 2 Fälle (`src/data/missions/muenster.json`), gerendert in `MissionSelect.tsx` Z. 198–213, verifiziert in `MissionSelect.test.tsx` Z. 21–31. Spielerdefinierte Missionen laufen über `CustomMissionPicker` mit Kategoriebeschränkung und echter Kriterien-Validierung via `validateCustomTargets` (verbotene Kombis → `custom-errors` + deaktivierter Confirm, `MissionSelect.test.tsx` Z. 89–102).
3. **Spawn-Flow:** `spawnRules.order: "detektive_first"` in beiden Karten; `spawnSequence`/`pickDetectiveSpawns` → Ganove zuletzt (`SpawnSystem.ts` Z. 75–99). `ganoveSpawnChoices` filtert BFS-Positionen unter `minDistanceToDetective` (Z. 58–69), `ganoveSpawnChoicesForMission` zusätzlich nach Missionskriterien (Z. 110–124). GanoveScreen: Detektive gesetzt → nur legale Ganovenwahl angeboten; DetektivScreen: D1→Dn interaktiv, Ganove zuletzt gezogen. Bei `random` automatisch.
4. **Weitere Städte:** Hamburg/Köln nur als deaktivierte „in Vorbereitung"-Karten (`menuFlow.ts` Z. 39, `MapSelect.tsx` Z. 66–78); `teststadt` erscheint nicht im Menü (negativ getestet).
5. **i18n:** `de.json`/`en.json` jeweils exakt 200 Schlüssel, programmatisch verglichen — Parität ohne Lücken; sämtliche Menütexte über `t()`/typisierte `TranslationKey`s.
6. **Rasterassets:** Drei JPEGs lokal unter `src/assets/` (`title-noir.jpg`, `map-muenster.jpg`, `map-luebeck.jpg`), via Vite-Import eingebunden — Grep über `src/**/*.{ts,tsx,css,json}` findet keine `http(s)://`-Referenz; Pollinations nur in der Doku (`ASSETS.md` mit Prompts, Seeds, Sicht-/Lizenzvermerk). Hugging-Face-Token war nicht erforderlich (Pollinations.ai ohne Key) — Kriterium ist konditional und damit erfüllt.
7. **Dev-Modus:** `DevModeScreen.tsx` ruft `runAiBatch`/`summarizeBatch` aus `AiSimulation`, zeigt Outcome-Verteilung + aggregierte Metriken; Unit- und E2E-Tests grün.
8. **Asymmetrie:** Missionswahl erfolgt vollständig vor `startGame`; `DetektivScreen` erhält nie `mission.targets` (nur `missionStructure`), Custom-Picker existiert nur im Menü. E2E „nothing leaks" bleibt grün.
9. **Kein Scope-Creep:** `GameIndex.ts` legt nur die `ResumeEntry`-Struktur + `RESUME_STORAGE_KEY` fest — nichts schreibt Einträge, „Partie fortsetzen" bleibt deaktiviert; `StatsScreen` listet die bereits vom `Recorder` vorgehaltenen Logs, Replay-Abspielung ist nicht implementiert (korrekt für Schritt 12).

**Einschränkungen/Anmerkungen (keine Abweichungen):**
- In der Detektiv-Perspektive kann die Option „spielerdefiniert" gewählt werden; wer die Ziele selbst setzt, kennt sie anschließend — für die Detektivseite inhaltlich wenig sinnvoll, aber regelkonform (Auswahl liegt vor Spielstart, Kriterium erfüllt; Plan verlangt keine modusabhängige Einschränkung).
- `ASSETS.md` Z. 10–16 dokumentiert die Sichtprüfung und verweist die lizenzrechtliche Endprüfung explizit auf Schritt 14 — als dokumentierte Einschränkung akzeptabel.
- `README.md`, `changes.log`, `docs/RELEASE_NOTES.md` und die Hilfeseiten unter `docs/help/spieloberflaeche/` wurden im Diff mitgepflegt.
