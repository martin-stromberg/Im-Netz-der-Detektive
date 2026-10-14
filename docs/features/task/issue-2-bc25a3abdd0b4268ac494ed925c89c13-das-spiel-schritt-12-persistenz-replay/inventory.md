# Bestandsaufnahme: Persistenz & Replay (Schritt 12)

Analyse der Persistenz-, Replay- und Statistik-relevanten Bereiche,
bezogen auf `requirement.md` (Spec `02-technisches-konzept.md` §8/§8.1).

## Zusammenfassung

- **Eventlog ist vollständig:** `appendLog` schreibt `header` (seq 0),
  sequenzierte Events mit `visibleTo` und abschließend `result` mit
  Balancing-Metriken (`rounds`, `hintsTotal`, `camerasTriggered`).
  `Recorder.ts` serialisiert JSONL, verwaltet `localStorage` FIFO (10)
  und exportiert als Blob. `finish()` persistiert automatisch.
- **Rekonstruktion existiert:** `startOptionsFromHeader` +
  `resolvedMission`/`resolvedCameras` in `StartGameOptions` — die
  Header-Rekonstruktion ist nachweislich bit-identisch
  (`gameStore.log.test.ts` „state reconstruction from header + seed").
- **Resume-Struktur vorgesehen:** `ResumeEntry` + `RESUME_STORAGE_KEY`
  + `listResumeEntries` in `GameIndex.ts` — aber **kein Schreibpfad**
  und **kein State-Snapshot-Feld** vorhanden; „Partie fortsetzen" ist
  im `MainMenu` deaktiviert verdrahtet.
- **StatsScreen ist Stub:** listet `listGameSummaries`, keine
  Aggregation, keine Verwaltung, kein Replay-Einstieg.
- **Kein Replay-Player:** keine Timeline-/Perspektiv-Komponente; die
  benötigten Bausteine (`visibleEvents`, `visibleCameras`,
  `deducePossiblePositions`, `MapGraph`) existieren.
- **Gespielte Perspektive wird nicht protokolliert:** der Log-`header`
  kennt kein `playerMode` — „Siegquote je Modus" benötigt eine
  Header-Erweiterung (optionales `config.playerMode`).
- **Log-Verwaltung unvollständig:** `listGameLogs`, `clearGameLogs`,
  `exportGameLog` vorhanden; einzelnes Löschen fehlt.

Test-Ausgangszustand: 40 Testdateien, **494 Tests, alle erfolgreich**;
20 Playwright-E2E-Tests in 3 Spec-Dateien. Nachweis:
[inventory/tests.md](inventory/tests.md).

## Details

- [Datenmodell](inventory/models.md) — `GameState`, `LogEntry`,
  `ResumeEntry`, `GameSummary`, `MapPack`
- [Logik](inventory/logic.md) — `gameStore`, `Recorder`, `GameIndex`,
  `InformationSystem`, `Deduction`, `AiSimulation`
- [UI](inventory/ui.md) — `App`, `menuFlow`, `MainMenu`, `StatsScreen`,
  `GanoveScreen`, `DetektivScreen`, `MapGraph`
- [Tests](inventory/tests.md) — Ausgangszustand + bestehende
  Testabdeckung
