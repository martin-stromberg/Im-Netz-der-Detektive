# Übersetzte Anforderung: Eventlog / Aufzeichnung (Schritt 7)

## Fachliche Zusammenfassung

Jede Partie wird vollständig als JSONL-Eventlog aufgezeichnet (event-sourced,
Spezifikation `02-technisches-konzept.md` §8): eine `header`-Zeile mit
`gameId`, `mapId`, `seed`, `config`, `mission`, `cameras`, `starts`, danach
sequenzierte Events (`seq`, `round`, `type`, `actor`, `visibleTo`, …) für alle
Spielvorgänge, abschließend eine `result`-Zeile mit `outcome` (inkl. `"draw"`)
und Balancing-Metriken (Rundenzahl, Hinweise gesamt, Kameratreffer). Das Log
ist über `seed` deterministisch rekonstruierbar (gleicher Seed + gleiche
Eingaben → identische Zustände und bitgleiche Logs), per Blob-Download
exportierbar und die letzten N Partien werden automatisch in `localStorage`
vorgehalten (FIFO). Das bisherige interne `log`-Feld des `useGameStore`
(`LogEntry` mit `details`-Kapselung) wird auf das neue Format gehoben. Neues
Modul `src/logic/Recorder.ts` (JSONL-Eventlog, Export, localStorage der
letzten N Partien) gemäß §2/§5 der Spezifikation.

## Betroffene Klassen und Komponenten

- **Neue Logikklasse/Modul:** `src/logic/Recorder.ts` — JSONL-Serialisierung
  (`toJsonl`/`serializeLog`), Header-Startoptionen-Rekonstruktion, Export als
  Datei (Blob-Download), `localStorage`-FIFO der letzten N Partien.
- **Datenmodell:** `LogEntry` in `src/state/gameStore.ts` — flaches Format
  ohne `details`-Kapselung; `visibleTo` auf allen Spielereignissen.
- **Logik / Store:** `useGameStore` (`src/state/gameStore.ts`) —
  `appendLog`-Aufrufstellen auf flaches Format umstellen, `gameId` und
  `config` im Header ergänzen, Ablauf von Kantensperrungen als Event
  aufzeichnen, `result`-Zeile um Balancing-Metriken (`hintsTotal`,
  `camerasTriggered`) erweitern, automatisches Vorhalten des Logs beim
  Partieende.
- **Interfaces/Grenzen:** Browser-Grenze für Blob-Download und
  `localStorage` — injizierbar bzw. nur aktiv, wenn `window`/`document`
  existieren (Store bleibt headless-fähig).
- **Enums/Typen:** `GameOutcome` existiert bereits inkl. `"draw"`;
  `Visibility` (`"detectives" | "ganove" | "both"`) aus
  `InformationSystem.ts` wird auf den Log-Einträgen geführt.
- **Tests:** neue `src/logic/Recorder.test.ts` sowie
  `src/state/gameStore.log.test.ts` (o. ä.); Anpassung bestehender
  `gameStore.*.test.ts`-Erwartungen ans neue Log-Format.
- **Keine UI-Komponenten:** der „Partie exportieren"-Mechanismus wird als
  aufrufbare Funktion bereitgestellt (Browser-Download hinter Grenze);
  ein Button ist nicht Teil dieses Schritts.

## Implementierungsansatz

- `Recorder.ts` ist ein reines Modul ohne React-Abhängigkeit: Serialisierung
  der `LogEntry[]` zu JSONL (eine JSON-Zeile pro Eintrag, Header ohne
  `seq`/`round`, Events mit `seq`/`round`/`type` und flachen Feldern,
  `result` mit `outcome` + Metriken), `localStorage`-Zugriff über einen
  injizierbaren Storage-Adapter (Default: `window.localStorage`, falls
  vorhanden), Blob-Download über injizierbare Download-Funktion (Default:
  DOM-Anker, nur wenn `document` existiert).
- `useGameStore.startGame` schreibt den `header`-Eintrag mit `gameId`
  (deterministisch, z. B. aus `seed` abgeleitet oder als Option übergebbar),
  `config` (effektive Auflösung der Startoptionen), `mission`, `cameras`,
  `starts`.
- `finish()` im Store berechnet die Balancing-Metriken aus `events`
  (`hintsTotal` über `HINT_EVENT_KINDS`, `camerasTriggered` über
  `kind === "camera"`) und schreibt die `result`-Zeile; danach
  Auto-Persistierung über `Recorder` (no-op ohne `localStorage`).
- `unblockExpiredEdges` protokolliert abgelaufene Kantensperrungen als
  eigene Log-Einträge (Sichtbarkeit `both`).
- Determinismus bleibt gewahrt: `rng.ts` ist weiterhin einzige
  Zufallsquelle; keine Zeit-/Zufallsabhängigkeit in Log-Einträgen
  (`gameId` deterministisch).
- Rekonstruktion: Header liefert `seed` + vollständige Startparameter;
  ein Helper bildet den Header auf `StartGameOptions` ab, sodass
  `startGame` denselben Anfangszustand reproduziert (Testnachweis).

## Konfiguration

- Anzahl der vorgehaltenen Logs N: Konstante in `Recorder.ts`
  (Vorschlag `10`), als Parameter übersteuerbar.
- `localStorage`-Schlüssel: Konstante in `Recorder.ts`.

## Akzeptanzkriterien (aus der Anforderung)

1. Vollständige Testpartien erzeugen valide JSONL-Logs mit Header, allen
   Event-Typen und `result`-Summary inkl. Metriken + `outcome`.
2. Gleicher Seed + gleiche Eingaben → bitgleiches Log;
   Zustandsrekonstruktion aus Header + Seed stimmt mit Originalzustand
   überein.
3. `visibleTo` auf allen Events korrekt (Grundlage für
   Perspektiven-Wiedergabe).
4. Export erzeugt herunterladbare JSONL-Datei; `localStorage` hält letzte
   N Logs (FIFO), sitzungsübergreifend.
5. `result`-Event enthält Balancing-Metriken in auswertbarer Form
   (Runden bis Fang/Flucht, Hinweise/Partie, Kameratreffer).

## Offene Fragen

Keine — alle Entscheidungen sind aus Anforderung und Spezifikation (§8)
ableitbar; Annahmen werden im Plan als Designentscheidungen festgehalten.
