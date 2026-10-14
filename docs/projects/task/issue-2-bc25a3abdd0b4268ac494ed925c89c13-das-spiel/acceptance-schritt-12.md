# Abnahmeprüfung – Entwicklungsschritt 12

## Ergebnis

**Status:** Abweichungen gefunden

## Abweichungen

- [ ] **Replay einer beendeten Partie schreibt ein Duplikat in die automatische `localStorage`-Log-Vorhaltung** — `gameStore.ts` Z. 762 ruft `saveGameLog(get().log)` in `finish()` bedingungslos auf; `replayTo` (`src/logic/ReplayPlayer.ts` Z. 134–150) treibt den echten `useGameStore` und es gibt keinen Persist-Schalter. Sobald das Replay den spielbeendenden Actor-Eintrag (letzter `move`/`action` vor `result`) ausführt, wird das bit-identische Log erneut an `im-netz-der-detektive:game-logs` angehängt (`Recorder.ts` Z. 189–202, ohne Dubletten-Prüfung). Folgen: die Statistik-Tabelle listet die abgespielte Partie doppelt und alle Aggregate (Siegquoten, Ø-Werte) zählen sie doppelt; wiederholtes Abspielen desselben Logs füllt die FIFO (MAX_STORED_LOGS = 10) mit Kopien und verdrängt andere aufgezeichnete Partien. Trifft Akzeptanzkriterium „Log-Export/-Verwaltung funktioniert inkl. der automatischen `localStorage`-Vorhaltung" — die Vorhaltung zeichnet Replay-Durchläufe als neue Partien auf, obwohl keine neue Partie stattfand. Weder Unit- noch E2E-Tests prüfen die Abwesenheit von Duplikaten.

## Hinweise

Geprüft auf Branch `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-12-persistenz-replay`, HEAD `84f3d4b`, gegen `project-plan.md` §„Schritt 12" (Z. 565–601) und `02-technisches-konzept.md` §8/§8.1 (Z. 156–188).

**Qualitätsgates (selbst ausgeführt):**
- `npm test`: 45 Dateien / 539 Tests — alle grün.
- `npm run coverage`: 91,28 % Statements, 83,53 % Branches, 94,10 % Functions, 90,82 % Lines — Schwelle ≥ 70 % deutlich überschritten (neue Module: `Statistics.ts` 100 % Stmts, `SaveGame.ts` 96 %, `GameIndex.ts` 93,9 %, `ReplayPlayer.ts` 74,3 %).
- `npm run build`: erfolgreich (`tsc --noEmit` + `vite build`).
- `npm run lint`: ohne Befund. `npm run typecheck`: ohne Befund.
- `npm run test:e2e`: 26/26 grün, darunter die neue `e2e/persistenz.spec.ts` (Save/Resume beider Modi nach `page.reload()` mit Zustandsvergleich, Log-Verwaltung mit Löschen/Export/„Alle löschen", Replay-Timeline vor/zurück, Perspektiven-Leak-Check `[data-ganove]` = 0 in Detektiv-Sicht, Auto-Play bis zum Outcome).

**Akzeptanzkriterien im Einzelnen:**
1. **Save/Load:** `SaveGame.ts` baut `ResumeEntry` = Snapshot + JSONL-Log + Seed + Optionen (`buildResumeEntry`, Z. 60–85); `resumeGame` (`gameStore.ts` Z. 1192–1194) stellt `initialData + snapshot + map + log` wieder her. Roundtrip-Test existiert und ist vollständig: `SaveGame.test.ts` Z. 144–158 vergleicht **alle** Datenfelder via `toEqual` (Positionen, Phase, `activeDetectiveIndex`, Mission, Kameras, Sperrungen, Events/Hinweise, `radioUsed`, Hitze-Fenster `hintSilenceUntilRound`/`falseTrailUntilRound`, `tensionValue`, `escapeNodeIds`, `outcome`) plus bit-identisches Log (`serializeLog`-Vergleich); Einmal-Fähigkeit Funk bleibt verbraucht (Z. 160–168, `useRadio` wirft danach). Mid-Detective-Phase-Resume mit Index (Z. 184–203) und E2E-Reload-Roundtrip belegt.
2. **Replay:** `ReplayPlayer.ts` rekonstruiert via `startOptionsFromHeader` inkl. `resolvedMission`/`resolvedCameras` (verbatim, keine RNG-Züge); Schritt zurück = Re-Replay bis n−1 — `ReplayPlayer.test.ts` belegt identische Zustände an jedem Schritt gegen mitprotokollierte Snapshots (Z. 82–91), bit-identisches Gesamtlog (Z. 93–98, inkl. `playerMode`-Header-Z. 100–119) und Vor/Zurück-Identität (Z. 121–136). Perspektiven über `visibleTo`-Filter auf Daten-Ebene (`visibleEvents`/`visibleCameras`); die Detektiv-`MapGraph` erhält `ganovePosition` konstruktiv nie (`ReplayScreen.tsx` Z. 290–302) — einzige Positionsinformation ist das Deduction-Overlay (`deducePossiblePositions`, erlaubte Hinweisinformation). E2E belegt.
3. **Statistiken:** `Statistics.ts` aggregiert Siegquote je Seite und Modus (`ganove`/`detektiv`/`unbekannt` aus `header.config.playerMode`), Ø Runden, Ø Hinweise/Partie, Ø Kameratreffer; `Statistics.test.ts` Z. 84–118 assertiert exakte Werte über bekannten Fixtures (inkl. Remis, unvollständige/beschädigte Logs fallen heraus).
4. **Log-Verwaltung:** `StatsScreen.tsx` bietet Ansehen (Tabelle mit Summary + Replay-Einstieg), Export (Blob-Download, `Recorder.exportGameLog`), Einzel-Löschen und „Alle löschen" mit Bestätigung; automatische FIFO-Vorhaltung der letzten 10 Logs via `finish → saveGameLog`, Resume-Einträge separat FIFO auf 10 (`GameIndex.ts` Z. 171–185). Einheits- und E2E-getestet — mit der oben genannten Abweichung bei Replay-Repersistierung.
5. **Versionierung:** `SAVE_SCHEMA_VERSION = 1` (`SaveGame.ts` Z. 18) landet in jedem `ResumeEntry`; `isValidResumeEntry` lehnt Fremdschemata und beschädigte Snapshots ab, `listResumeEntries` filtert sie, Schreibzugriffe erhalten Fremdschema-Einträge (`GameIndex.test.ts` Z. 190–202).
6. **Asymmetrie:** Replay-Detektivsicht leckfrei konstruiert (keine `ganovePosition`-Prop, nur detektiv-sichtbare Events/Kameras, `missionStructure` ohne Ziel-IDs, Heat-Badge nur in Ganove-Sicht); Resume routet `entry.mode` in den passenden Screen (`App.tsx` Z. 60–70, 183–206) — jede Seite sieht nur ihre Sicht.
7. **Scope-Creep:** Diff auf Persistenz/Replay/Statistik begrenzt; `chronicle.ts`-Extraktion und `MapLegend`-Export sind Wiederverwendung für die Replay-Ansicht; `playerMode` im Header dient der geforderten Modus-Statistik. Kein Creep.

**Weitere Anmerkungen (keine Abweichungen):**
- `MainMenu.tsx` Z. 21–22 trägt noch einen veralteten Kommentar („nothing writes them before the persistence step, so the button stays disabled") — Einträge werden inzwischen geschrieben; funktional ohne Auswirkung.
- Der Sabotage-Fenster-Roundtrip (`hintSilenceUntilRound`/`falseTrailUntilRound` ≠ 0) ist durch den Vollvergleich formal abgedeckt, aber kein Test setzt die Felder explizit auf Nicht-Null-Werte — funktional risikolos, da `snapshotGame` per JSON-Deepcopy alle `GameData`-Felder erfasst.
- `ReplayScreen.test.tsx` erzeugt React-`act()`-Warnings (Zustandsupdates im `useEffect` außerhalb von `act`); Tests bleiben grün.
- `i18n`: `de.json`/`en.json` programmatisch verglichen — 238/238 Schlüssel, vollständig paritätisch.
- Die JSONL-Logs selbst (`game-logs`) sind nicht schema-versioniert — der Plan verlangt Versionierung nur des Speicherformats (ResumeEntry), §8 definiert das Log-Format fest.
