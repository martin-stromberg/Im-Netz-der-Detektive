# Code-Review — Schritt 12: Persistenz, Replay & Statistiken

Review der Änderungen gegen die Anforderung: exakter
Speicherstand-Roundtrip, deterministischer Replay ohne Live-Store-
Nebenwirkungen, `visibleTo`-Asymmetrie, exakte Statistik-Aggregate,
robuste localStorage-Verwaltung.

## Geprüfte Dateien

- `src/state/gameStore.ts` — `GameData`/`GameStateSnapshot`, `resumeGame`,
  `playerMode` in `StartGameOptions` + Header-Config
- `src/logic/SaveGame.ts`, `ReplayPlayer.ts`, `Statistics.ts` — neu
- `src/logic/GameIndex.ts`, `Recorder.ts` — Resume-Verwaltung,
  `getGameLog`/`deleteGameLog`
- `src/components/ResumeScreen.tsx`, `ReplayScreen.tsx`,
  `chronicle.ts` — neu; `StatsScreen.tsx`, `MainMenu.tsx`,
  `GanoveScreen.tsx`, `DetektivScreen.tsx`, `menuFlow.ts`,
  `Menu.module.css` — erweitert
- `src/App.tsx` — `resume`/`replay`-Verdrahtung
- `src/i18n/de.json`/`en.json`, `e2e/persistenz.spec.ts`, alle
  neuen/erweiterten Tests

## Explizite Prüfpunkte

- **Snapshot-Vollständigkeit:** `GameStateSnapshot =
  Omit<GameData,"map"|"log">` — strukturell vollständig; der
  Roundtrip-Test vergleicht den gesamten `GameData`-Bestand per
  `toEqual`, inklusive `radioUsed`, `hintSilenceUntilRound`,
  `falseTrailUntilRound`, `tensionValue`, `cameras`, `blockedEdges`,
  `escapeNodeIds`, `ganoveCanAct`, `activeDetectiveIndex`, `phase`,
  `roundLimit`, `eventDefaults`. RNG-Relevanz: kein RNG lebt im
  State — Würfel werden pro Zug aus `seed`/`round`/Index neu
  abgeleitet, daher reicht der Snapshot. ✅
- **Kein Aliasing:** `snapshotGame` deep-kopiert via JSON — spätere
  Züge mutieren den gespeicherten Stand nicht (Test
  „deep-copies the state"). `resumeGame` spreadet Snapshot + `log`
  in einen frischen Bestand auf `initialData()`-Basis. ✅
- **Mission/Kameras/Hitze-Fenster:** `mission` (inkl. `targets`,
  `pendingChoice`, `appliedEffect`), `cameras` (aktiv/sabotiert),
  `events`, `tensionValue` liegen flach im Snapshot — Sabotage- und
  Funkstille-Fenster (`hintSilenceUntilRound`/`falseTrailUntilRound`)
  sind explizit getestet. ✅
- **Replay-Determinismus:** Ein Schritt = ein Aktoreintrag; Engine-
  Einträge entstehen identisch neu (Test: Zustand je Schritt ==
  beobachteter Originalzustand, Log bitgleich nach Vollabspiel —
  inklusive `playerMode`-Header nach C1-Fix). Schritt zurück =
  Neuabspielen bis `n-1` — bit-identisch ohne Inverse. ✅
- **Kein heimlicher Live-Store-Verlust:** Der Replay teilt den
  Singleton-Store bewusst (im Plan dokumentiert). Er ist nur aus
  `stats` erreichbar — nie mitten in einer Partie; `ReplayScreen`
  installiert **keine** KI-Treiber und setzt den Store doppelt
  zurück: `exit()` (`resetGame` + `onBack`) und Unmount-Cleanup.
  Beschädigte Logs landen auf `InvalidReplay` mit Zurück-Pfad. ✅
- **Kein Ganove-Leck in der Detektiv-Replay-Sicht:** Die
  `MapGraph`-Props der Detektiv-Perspektive enthalten kein
  `ganovePosition` (Struktur, nicht Filter) — Positionsinfo nur
  über `deducePossiblePositions` auf `visibleEvents(…,"detectives")`
  + `visibleCameras`. Unit- und E2E-Ebene prüfen
  `[data-ganove]`-Abwesenheit. ✅
- **Statistik-Exaktheit:** `aggregateStatistics` liest ausschließlich
  `header`/`result`; unfertige (`result` fehlt) und beschädigte
  Logs zählen nicht; Fixture-Tests prüfen exakte
  Prozent-/Durchschnittswerte je Seite und je Modus (`playerMode`
  aus `header.config`; fehlend/fremd → `unbekannt`). ✅
- **Log-Verwaltung:** `deleteGameLog`/`getGameLog` positionsbasiert
  (`g-{seed}`-Kollision dokumentiert); FIFO-Vorhaltung via
  `saveGameLog` unverändert; `StatsScreen` hält `storageIndex` pro
  Zeile und lädt nach Mutationen neu. ✅
- **Schema-Disziplin:** `isValidResumeEntry` lehnt Fremd-Versionen
  klar ab (kein Raten); Schreibpfade bewahren Fremd-Einträge (C2).
  `App.resumeSavedGame` fängt `loadMap`-/Parse-Fehler, löscht den
  defekten Eintrag und rendert die Liste neu — kein Crashpfad. ✅
- **Layering:** `SaveGame`/`ReplayPlayer`/`Statistics` bleiben
  rein/headless — der `ReplayDriver` ist ein Interface,
  `useGameStore` wird injiziert; `GameIndex`/`Recorder` kapseln die
  Storage-Grenze hinter `StorageLike`. `chronicle.ts` trennt die
  Formatierfunktion von der Komponente (react-refresh). ✅
- **i18n:** 41 neue Keys je Katalog, paritätisch (Skript-Abgleich:
  keine Fehlmengen); kein hartcodierter Anzeigetext in den neuen
  Komponenten. ✅

## Befunde und Auflösung

| # | Befund | Status |
|---|---|---|
| C1 | `startOptionsFromHeader` ließ `config.playerMode` fallen — Replay menschlicher Partien hätte einen vom Original abweichenden Header geschrieben (kein bitgleiches Log) | **behoben** — Feld wird durchgereicht; neue Tests: `playerMode`-Roundtrip (`gameStore.log.test.ts`) und bitgleiches Log für `playerMode`-Partien (`ReplayPlayer.test.ts`) |
| C2 | `saveResumeEntry`/`deleteResumeEntry` schrieben aus der schema-gefilterten Liste zurück — Einträge einer zukünftigen Schema-Version wären beim Speichern/Löschen still verloren gegangen | **behoben** — Schreibpfad arbeitet auf `readRawResumeEntries`; Upsert/FIFO/Löschen greifen nur auf `gameId`-Ebene; Regressionstest „preserves foreign-schema entries" |
| C3 | `chronicleText` aus `DetektivScreen.tsx` exportiert (Funktion neben Komponente) → `react-refresh/only-export-components`-Warnung | **behoben** — Funktion in `src/components/chronicle.ts` extrahiert, beide Nutzer importieren daraus; lint ist wieder bei 0 Befunden |
| C4 | Fehlender Testnachweis „`playerMode` im Header" (Plan-Testtabelle) | **behoben** — Test in `gameStore.log.test.ts` ergänzt (Header + Rekonstruktions-Roundtrip + Negativfall ohne Feld) |
| C5 | `act()`-Warnungen in `ReplayScreen.test.tsx` durch Store-Updates aus dem Timeline-`useEffect` | **dokumentiert** — inhärent am zustand-Pattern (Treiber-Effekt schreibt in den Singleton-Store außerhalb von `act`); keine Fachlichkeitslücke, Tests sind aussagekräftig und stabil |
| C6 | `StatsScreen`-Zeilen nutzen `storageIndex` als React-`key` | **bewusst** — `gameId` ist nicht eindeutig (Seed-Kollisionen); der Index stimmt zur Löschoperation, die Liste remounted ohnehin über `reload()` nach Mutationen |

## Restrisiken / bewusste Entscheidungen

- **Singleton-Store im Replay:** Ein zuvor laufendes Spiel würde
  überschrieben — akzeptiert, weil der Replay-Screen ausschließlich
  aus dem Menü/Stats erreichbar ist und beim Verlassen zurücksetzt
  (im Plan festgehalten).
- **`getGameLog(index)`/`storageIndex`-Semantik:** Indexbasierte
  Verwaltung ist nur solange stabil, wie die Liste zwischen Lesen
  und Löschen nicht anderweitig mutiert — die UI lädt die Liste
  nach jeder Mutation neu; parallele Tabs sind kein Szenario.
- **`MAX_RESUME_ENTRIES` = 10** geteilt mit dem Log-FIFO —
  bewusst analog; Speicherstände älterer Partien rotieren heraus.
- **Replay benötigt `teststadt`-Fixture im E2E:** Dev-Batch-Logs
  werden über die Menü-Dev-Oberfläche erzeugt — deckt den
  realen Nutzerfluss inklusive FIFO ab.

## Ergebnis

**Keine Befunde offen** — vier Punkte behoben (C1–C4, alle
rückgetestet), zwei als hinnehmbar/bewusst dokumentiert (C5, C6).
