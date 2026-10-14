# Umsetzungsplan: Persistenz & Replay (Schritt 12)

## Übersicht

Speicherbare Partien (State-Snapshot + Log + Seed in `localStorage`),
deterministischer Replay-Player mit zwei `visibleTo`-Perspektiven und
aggregierte Statistiken über den `Recorder`-FIFO — gemäß Spec
`02-technisches-konzept.md` §8.1. Menü-Einträge „Partie fortsetzen" und
„Statistiken/Replays" werden befüllt; beide Spiel-Screens erhalten eine
„Partie speichern"-Aktion.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|------------------|------------|
| `GameStateSnapshot` | Explizite Feldliste in `gameStore.ts` als `Omit<GameData,"map"\|"log">` | Map kommt via `mapId`+`loadMap` erneut (reine JSON-Daten); das Log liegt bereits als JSONL im `ResumeEntry` — keine Doppelung, Single Source |
| Resume-Laden | `resumeGame(map, snapshot, log)` setzt den Datenbestand direkt (`set`) | Snapshot ist der einfachste, beweisbar identische Weg (vollständiger Zustandsvergleich); Replay-Rekonstruktion bleibt separatem Pfad vorbehalten |
| `ResumeEntry.mode` | `"ganove" \| "detektiv"`, vom speichernden Screen gesetzt | Fortsetzen braucht die richtige Perspektive; steht nicht im Log |
| Schema-Version | `SAVE_SCHEMA_VERSION = 1`; `listResumeEntries` filtert strikt auf die bekannte Version | Kundenvorgabe: unbekannte Versionen werden klar abgelehnt (nicht geraten interpretiert) |
| Replay-Schritt | Ein Schritt = ein **Aktoreintrag** (`move`, `action`, `sabotage_offer` mit `chosen`, `radio`); Schritt zurück = deterministisches Neuabspielen bis `n-1` | Engine-Einträge entstehen innerhalb der Aktionen identisch neu; Neuabspielen garantiert identische Zustände ohne Inverse |
| Replay-Ausführung | `ReplayDriver`-Interface, Store-Funktionen injizierbar; UI reicht `useGameStore` | Layering bleibt sauber (`logic` kennt den zustand-Store nicht); Tests fahren denselben Pfad |
| `playerMode` | Optionales Feld in `StartGameOptions`, landet in `header.config` | „Siegquote je Modus" braucht die gespielte Perspektive; alte Logs ohne Feld bilden die Gruppe „unbekannt" |
| Log-Verwaltung | `deleteGameLog(index)` (Index wie `listGameLogs`-Reihenfolge) + Export/Ansehen je Zeile in `StatsScreen` | `gameId` ist nicht eindeutig (`g-{seed}`-Default kollidiert bei gleicher Seed) — Index ist die stabile Kennung |

## Programmabläufe

### Partie speichern (Ganove-/Detektiv-Screen)

1. Klick auf „Partie speichern" (nur solange `outcome === null`)
2. `buildResumeEntry(state, mode)` erzeugt `ResumeEntry`:
   `schema`, `gameId` (aus dem Log-Header), `mapId`, `seed`, `mode`,
   `options` (aus Header via `startOptionsFromHeader`), `savedAt`
   (ISO), `log` (JSONL via `serializeLog`), `snapshot` (via
   `snapshotGame`)
3. `saveResumeEntry` schreibt in `localStorage`
   (`RESUME_STORAGE_KEY`), ersetzt gleiche `gameId`, FIFO-Limit
   `MAX_RESUME_ENTRIES`
4. UI meldet kurz „gespeichert" (Notice)

Beteiligte: `SaveGame.ts` (`snapshotGame`, `buildResumeEntry`),
`GameIndex.ts` (`saveResumeEntry`), `GanoveScreen`/`DetektivScreen`.

### Partie fortsetzen (Hauptmenü)

1. `MainMenu` aktiviert „Partie fortsetzen", sobald
   `listResumeEntries()` nicht leer ist; Klick → `resume`-Screen
2. `ResumeScreen` listet Einträge mit Klartext (Kartenname, gespielte
   Seite, Runde, Speicherzeitpunkt); Auswahl → `onResume(entry)`
3. `App` lädt `loadMap(entry.mapId)`, ruft
   `useGameStore.resumeGame(map, entry.snapshot, parseLog(entry.log))`,
   setzt `screen = "game"` mit `mode = entry.mode`
4. Der Screen sieht `map !== null` und rendert direkt die
   „playing"-Ansicht; Treiber (KI) installieren sich per Effekt
5. Löschen einzelner Einträge über `deleteResumeEntry(gameId)`

Beteiligte: `ResumeScreen`, `App.tsx`, `gameStore.resumeGame`,
`MapLoader`, `Recorder.parseLog`, `GameIndex`.

### Replay abspielen (Statistiken-Screen)

1. `StatsScreen` zeigt je Log-Eintrag „Replay"-Aktion → `onReplay(index)`
2. `App` hält den JSONL-String, öffnet `replay`-Screen
3. `ReplayScreen` parst das Log, baut die Aktionsliste
   (`isReplayAction`), zeigt Timeline
4. Schritt vor/zurück: `replayTo(driver, map, entries, n)` —
   `resetGame` + `startGame` (Header-Rekonstruktion) + die ersten `n`
   Aktoreinträge erneut ausführen; `finished()` stoppt bei `outcome`
5. Abspielen: Intervall-Timer ruft Schritt-vor bis zum Ende;
   Pause stoppt den Timer
6. Perspektiv-Umschalter `ganove|detectives`: Ganove-Sicht rendert
   `ganovePosition`, `MissionPanel`/`HeatBadge`, `visibleEvents("ganove")`;
   Detektiv-Sicht rendert Kameras, Missionsstruktur, Chronik
   (`visibleEvents("detectives")`) und Deduktions-Overlay
   (`deducePossiblePositions`) — niemals `ganovePosition`
7. „Zurück" → `resetGame` + `onBack`

Beteiligte: `ReplayScreen`, `ReplayPlayer.ts`, `App.tsx`,
`StatsScreen`, `MapGraph`, `Deduction`, `detectiveStartsFromLog`.

### Statistiken anzeigen/verwalten

1. `StatsScreen` ruft `aggregateStatistics(listGameLogs())` auf
2. Anzeige: Gesamtblock (Partien, Siegquote Ganove/Detektive/Remis,
   Ø Runden, Ø Hinweise, Ø Kameratreffer) + Aufschlüsselung je Modus
3. Pro Log-Eintrag: „Replay", „Exportieren" (`exportGameLog`),
   „Löschen" (`deleteGameLog(index)`); plus „Alle löschen"
   (`clearGameLogs`) mit Bestätigung
4. Nach Änderungen Liste neu lesen (lokaler Refresh-Zähler)

Beteiligte: `Statistics.ts`, `StatsScreen`, `Recorder`, `GameIndex`.

## Neue Klassen/Module

| Modul | Typ | Zweck |
|-------|-----|-------|
| `src/logic/SaveGame.ts` | Modul | `SAVE_SCHEMA_VERSION`, `snapshotGame`, `buildResumeEntry`, `validateResumeEntry`/`parseSnapshot` |
| `src/logic/ReplayPlayer.ts` | Modul | `isReplayAction`, `replayActions`, `replayTo`, `ReplayDriver`-Interface |
| `src/logic/Statistics.ts` | Modul | `aggregateStatistics`, `GameStatistics`, `StatsBucket` |
| `src/components/ResumeScreen.tsx` | Komponente | Liste der Speicherstände, Auswahl + Löschen |
| `src/components/ReplayScreen.tsx` | Komponente | Timeline, Perspektiven, `MapGraph`-Wiederverwendung |

## Änderungen an bestehenden Klassen

### `gameStore.ts` (Store)

- **Neuer Typ:** `GameStateSnapshot = Omit<GameData, "map" | "log">`
  (exportiert, für `SaveGame`)
- **`GameData` exportieren** (aktuell Modul-intern)
- **Neue Methode:** `resumeGame(map: MapPack, snapshot: GameStateSnapshot, log: LogEntry[])` —
  `set({...initialData(), ...snapshot, map, log})`
- **`StartGameOptions`:** neues optionales Feld `playerMode?: "ganove" | "detektiv"`
- **`startGame`:** schreibt `playerMode` in `header.config` (nur wenn gesetzt)

### `GameIndex.ts`

- **`ResumeEntry`:** neue Felder `schema: number`, `mode: "ganove" | "detektiv"`, `snapshot: GameStateSnapshot`
- **Neu:** `MAX_RESUME_ENTRIES` (10), `saveResumeEntry(entry, storage?)` (Upsert per `gameId`, FIFO), `deleteResumeEntry(gameId, storage?)`
- **`listResumeEntries`:** Filter zusätzlich `schema === SAVE_SCHEMA_VERSION` und `snapshot` vorhanden (Objekt)

### `Recorder.ts`

- **Neu:** `deleteGameLog(index: number, storage?: StorageLike | null)` — entfernt den Eintrag an Position `index` der `listGameLogs`-Reihenfolge; `getGameLog(index, storage?)` für Replay-Zugriff

### `menuFlow.ts`

- `MenuScreen` erweitert um `"resume"` und `"replay"`

### `App.tsx`

- Neue Screens `resume`/`replay` verdrahten; `resumeGame`-Aufruf;
  `ReplayScreen` bekommt das gewählte Log

### `MainMenu.tsx`

- `menu-resume` → `onNavigate("resume")`; `menu.resumeHint`-Text nur
  noch als Leer-Hinweis

### `StatsScreen.tsx`

- Aggregierte Statistik-Anzeige + je Eintrag Aktionen
  (Replay/Export/Löschen) + „Alle löschen"; Refresh nach Mutation

### `GanoveScreen.tsx` / `DetektivScreen.tsx`

- „Partie speichern"-Button (laufende Partie) mit Erfolgs-Hinweis
- `playerMode` im `startGame`-Aufruf setzen (`"ganove"`/`"detektiv"`)

### i18n

- Neue Keys in `de.json` + `en.json` (paritätisch): `resume.*`,
  `save.*`, `replay.*`, `stats.summary.*`, `stats.actions.*`,
  `menu.resumeHint` (angepasst)

## Datenbankmigrationen

Keine (localStorage-Format neu; `schema`-Feld versioniert den Eintrag).

## Validierungsregeln

| Feld / Objekt | Regel | Fehlerfall |
|---------------|-------|------------|
| `ResumeEntry.schema` | muss `SAVE_SCHEMA_VERSION` sein | Eintrag wird beim Listen ignoriert |
| `ResumeEntry.snapshot` | Objekt mit `round`/`phase`/`detektivePositions`/`events`/`cameras` Pflichtstruktur | Eintrag wird ignoriert |
| `resumeGame` | `map` aus `loadMap(entry.mapId)`; Fehler der Map-Validierung propagieren | `MapValidationError` |
| `deleteGameLog(index)` | Index außerhalb → kein Effekt | stiller No-op |
| `replayTo(n)` | `n` auf `[0, actions.length]` klemmen; `outcome` erreicht → Stopp | Abbruch ohne Fehler |
| Speichern | nur bei `outcome === null` und `map !== null` | Button ausgeblendet / `MoveError` nicht nötig (UI steuert) |

## Konfigurationsänderungen

Keine. Storage-Keys bleiben: `LOG_STORAGE_KEY`, `RESUME_STORAGE_KEY`.

## Seiteneffekte und Risiken

- **Header-Schema:** `config.playerMode` ist ein additives Feld —
  bit-identische Rekonstruktion bleibt, weil `startOptionsFromHeader`
  das Feld einfach durchreicht; bestehende Logs ohne Feld lesen weiter.
- **Replay nutzt den Singleton-Store:** während eines Replays ist der
  Live-Spielzustand überschrieben — akzeptabel, da der Replay-Screen
  exklusiv läuft und beim Verlassen `resetGame` läuft. Risiko: ein
  zuvor laufendes Spiel würde verloren gehen — die Navigation dorthin
  passiert nur aus dem Menü/Stats, nie mitten im Spiel.
- **KI-Treiber während Replay:** `installDetectiveDriver`/
  `installGanoveDriver` dürfen im Replay-Screen nicht installiert
  werden (keine Auto-Züge — nur aufgezeichnete Aktionen).
- **`activeDetectiveIndex` im Snapshot:** entscheidend für Fortsetzung
  mitten in der Detektivphase — im Snapshot enthalten.
- **Zustandsfelder-Vollständigkeit:** `GameStateSnapshot` muss alle
  Datenfelder abdecken (inkl. `hintSilenceUntilRound`,
  `falseTrailUntilRound`, `tensionValue`, `escapeNodeIds`,
  `ganoveCanAct`, `roundLimit`, `eventDefaults`) — Tests vergleichen
  den kompletten `GameData`-Bestand.

## Umsetzungsreihenfolge

1. **`gameStore.ts`: `GameStateSnapshot`-Typ + `resumeGame` + `playerMode`-Option**
   - Voraussetzungen: keine
   - Beschreibung: Typ exportieren, `GameData` exportieren, Methode
     `resumeGame`, `playerMode` in `StartGameOptions` + Header-`config`
2. **`SaveGame.ts` neu**
   - Voraussetzungen: Schritt 1
   - Beschreibung: `SAVE_SCHEMA_VERSION`, `snapshotGame(state)`,
     `buildResumeEntry(state, mode)`, Snapshot-Validierung
3. **`GameIndex.ts`: Resume-Verwaltung**
   - Voraussetzungen: Schritt 2
   - Beschreibung: `ResumeEntry`-Erweiterung, `saveResumeEntry`,
     `deleteResumeEntry`, Schema-Filter in `listResumeEntries`
4. **`Recorder.ts`: `deleteGameLog` + `getGameLog`**
   - Voraussetzungen: keine
   - Beschreibung: Indexbasiertes Löschen/Lesen in der FIFO-Liste
5. **`ReplayPlayer.ts` neu**
   - Voraussetzungen: `startOptionsFromHeader` (vorhanden)
   - Beschreibung: `isReplayAction`, `replayActions`, `replayTo` mit
     `ReplayDriver`-Interface
6. **`Statistics.ts` neu**
   - Voraussetzungen: `parseLog` (vorhanden)
   - Beschreibung: `aggregateStatistics(jsonls)` mit Gesamt + `byMode`
7. **UI: `ResumeScreen` + `ReplayScreen` neu; `menuFlow`/`App`/`MainMenu`/`StatsScreen`/`GanoveScreen`/`DetektivScreen` erweitern; i18n**
   - Voraussetzungen: Schritte 1–6
   - Beschreibung: Screens, Navigation, Save-Buttons, Statistik-Anzeige,
     Log-Verwaltung, Perspektiv-Umschalter, Deduktions-Overlay in der
     Detektiv-Perspektive (Muster: `DetektivScreen` wiederverwenden)
8. **Unit-/Komponententests**
   - Voraussetzungen: Schritte 1–7
   - Beschreibung: siehe Tabelle unten
9. **E2E-Spec `e2e/persistenz.spec.ts`**
   - Voraussetzungen: Schritt 7
   - Beschreibung: siehe E2E-Tabelle

## Tests

### Neue Tests

| Test / Hilfsmethode | Testklasse | Was wird geprüft? |
|--------------------|------------|-------------------|
| `snapshotGame`+`resumeGame` Roundtrip | `SaveGame.test.ts` | Speichern mitten im Spiel → `resetGame` → `resumeGame` → kompletter `GameData`-Vergleich identisch (`expect(...data).toEqual`) |
| Einmal-Fähigkeit verbraucht | `SaveGame.test.ts` | `useRadio` vor Speichern → nach Laden `radioUsed === true`, erneutes `useRadio` wirft |
| Sabotage-Fenster | `SaveGame.test.ts` | `hintSilenceUntilRound`/`falseTrailUntilRound`/`cameras` (deaktiviert) überleben den Snapshot |
| Schema-Version | `SaveGame.test.ts`/`GameIndex.test.ts` | Eintrag mit fremder `schema` landet nicht in `listResumeEntries` |
| Resume-Verwaltung | `GameIndex.test.ts` | `saveResumeEntry` ersetzt gleiche `gameId`, FIFO-Limit, `deleteResumeEntry` |
| Replay-Determinismus | `ReplayPlayer.test.ts` | KI-Log aufzeichnen → `replayTo(k)` == Originalzustand nach k Aktionen (inkl. Log-Vergleich bis zum Stand) |
| Schritt vor/zurück | `ReplayPlayer.test.ts` | `replayTo(n)` dann `replayTo(n-1)`/`replayTo(n)` — Zustände bit-identisch zum Vorwärtslauf |
| `visibleTo`-Filterung | `ReplayPlayer.test.ts` | Replay-Events: `visibleEvents(…,"detectives")` enthält nie `visibleTo:"ganove"`; Ganovenposition nicht in der Detektiv-Ableitung |
| `deleteGameLog`/`getGameLog` | `Recorder.test.ts` (erweitern) | Index-Löschen, No-op außerhalb, Liste bleibt stabil |
| Statistik-Exaktheit | `Statistics.test.ts` | Fixture-Logs (2–3 synthetische JSONL) → exakte Prozent-/Durchschnittswerte je Seite und Modus, Remis separat |
| `playerMode` im Header | `gameStore.log.test.ts` (erweitern) | `startGame` mit `playerMode` schreibt `config.playerMode` |
| `resumeGame` | `gameStore` Tests | Snapshot-Restore setzt `map`, `phase`, `activeDetectiveIndex`; `initialData`-Fallback für fehlende Felder |
| `ResumeScreen` | `ResumeScreen.test.tsx` | Liste rendert Klartexte, Auswahl ruft `onResume`, Löschen aktualisiert |
| `ReplayScreen` | `ReplayScreen.test.tsx` | Schritt vor ändert Runde/Positionen; Perspektive „detectives" zeigt keinen `ganovePosition`-Marker; Zurück ruft `onBack` + `resetGame` |
| `StatsScreen` | `StatsScreen.test.tsx` (erweitern/neu) | Aggregatwerte sichtbar; Löschen eines Eintrags entfernt die Zeile |

### Betroffene bestehende Tests

| Test / Testklasse | Grund der Anpassung |
|-------------------|---------------------|
| `MenuScreens.test.tsx` (ggf.) | `MainMenu`-Verhalten: Resume-Button navigiert nun; Hinweistext geändert — Erwartungen prüfen/anpassen |
| `e2e/menu.spec.ts` | „disabled resume"-Erwartung bleibt gültig für leeren Speicher — nach Spiel-Speicherung interagiert er; neue Spec deckt den aktiven Fall ab |

### E2E-Tests (primärer Funktionsnachweis)

Neue Datei `e2e/persistenz.spec.ts`:

| Priorität | Szenario | Testdatei | Abgedecktes Akzeptanzkriterium | Warum E2E nötig ist |
|-----------|----------|-----------|-------------------------------|---------------------|
| Pflicht | Speichern → Reload → „Partie fortsetzen" → identischer Spielzustand (Runde, Positionen, Radio verbraucht) | `e2e/persistenz.spec.ts` | Gespeicherter Spielstand → identischer Zustand nach Laden | Kompletter Benutzerfluss über Menü + Browser-Storage |
| Pflicht | Statistik-Screen zeigt Aggregate und Log-Liste nach aufgezeichneter Partie; Löschen entfernt Eintrag | `e2e/persistenz.spec.ts` | Statistik-Werte + Log-Verwaltung | Benutzerfluss inkl. localStorage-Vorhaltung |
| Pflicht | Replay öffnen, Schritt vor, Perspektive Detektiv zeigt keine Ganovenposition, Perspektive Ganove zeigt sie | `e2e/persistenz.spec.ts` | Replay-Timeline + `visibleTo`-Perspektiven | UI-Nachweis des Leck-Verbots |
| Pflicht | Log-Export löst Download aus | `e2e/persistenz.spec.ts` | Log-Export | Download-Ereignis nur e2e prüfbar |
| Optional | „Alle löschen" leert die Liste (nach Bestätigung) | `e2e/persistenz.spec.ts` | Log-Verwaltung | Nutzeraktion |

Bestehende E2E-Specs müssen weiterlaufen (`menu.spec.ts` prüft den
deaktivierten Resume-Button im leeren Zustand — localStorage der
Playwright-Kontexte ist pro Test frisch).

## Offene Punkte

Keine — Annahmen sind in `requirement.md` dokumentiert
(Modus-Interpretation, mehrere Speicherstände, Speichern nur bei
laufender Partie).
