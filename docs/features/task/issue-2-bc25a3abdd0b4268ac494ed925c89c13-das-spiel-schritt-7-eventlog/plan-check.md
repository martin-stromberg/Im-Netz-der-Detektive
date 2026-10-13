# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| Vollständige Testpartien erzeugen valide JSONL-Logs mit Header, allen Event-Typen und `result`-Summary inkl. Metriken + `outcome` | Umsetzungsschritte 1–3 (Header mit `gameId`/`config`/`mission`/`cameras`/`starts`, alle Vorgänge als flache Einträge, `result` mit `outcome`/`rounds`/`hintsTotal`/`camerasTriggered`) | `serializeLog produces spec-format lines`, `full game log contains all event types`, `result carries balancing metrics` | Abgedeckt |
| Gleicher Seed + gleiche Eingaben → bitgleiches Log; Rekonstruktion aus Header + Seed stimmt mit Originalzustand überein | `gameId` deterministisch (`g-${seed}`/Option), `config` enthält alle wirksamen Eingaben inkl. `mission`-Option; `startOptionsFromHeader` + erneutes `startGame` | `same seed + same inputs → identical JSONL`, `reconstruct start state from header + seed` | Abgedeckt |
| `visibleTo` auf allen Events korrekt | `visibleTo` ist Pflichtfeld-Konvention auf jedem Eintrag inkl. Header/`result`; Belegung folgt §1-Asymmetrie (Designentscheidungstabelle) | `every event carries correct visibleTo` | Abgedeckt |
| Export erzeugt herunterladbare JSONL-Datei; `localStorage` hält letzte N Logs (FIFO), sitzungsübergreifend | `exportGameLog` (Blob + injizierbarer Download), `saveGameLog`/`listGameLogs` (FIFO, `MAX_STORED_LOGS`), Auto-Persist in `finish` | `exportGameLog returns Blob + calls downloader`, `saveGameLog keeps last N (FIFO)`, `auto-save on finish` | Abgedeckt |
| `result`-Event enthält Balancing-Metriken in auswertbarer Form (Runden bis Fang/Flucht, Hinweise/Partie, Kameratreffer) | `finish` berechnet `rounds`, `hintsTotal` (über `HINT_EVENT_KINDS`), `camerasTriggered` (`kind === "camera"`) | `result carries balancing metrics` (inkl. `draw`-Ende) | Abgedeckt |

## Fehlende oder unvollständige Testanforderungen

— (Status `Plan vollständig`)

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| „Partie exportieren" | — | Nicht erforderlich — kein UI-Benutzerfluss existiert (Engine-Schritt); Download-Wirkung per injiziertem Spy nachgewiesen (`exportGameLog returns Blob + calls downloader`) |
| Automatische Ablage letzter N Partien | — | Nicht erforderlich — kein Benutzerfluss; Unit-Tests mit Fake-`StorageLike` (`saveGameLog keeps last N`, `auto-save on finish`) |
| JSONL-Log-Vollständigkeit/Determinismus | — | Nicht erforderlich — rein programmatisches Verhalten; Integrationsnachweis über `gameStore.log.test.ts` |

## Fehlende oder unvollständige Planbestandteile

— (Status `Plan vollständig`)

## Hinweise

- Die Aufteilung von „Sabotage-Angebot und -Wahl" in zwei
  `sabotage_offer`-Records (Angebot ohne `chosen`, Wahl mit `chosen`)
  ist im Plan explizit begründet: Die Engine trennt beide Zeitpunkte;
  der zweite Record trägt exakt das Spec-Feldbild.
- Bestehende `details`-Assertions in den `gameStore.*.test.ts`-Dateien
  werden durch die Formatumstellung brechen — als betroffene Tests
  vollständig erfasst.
- `gameStore` importiert `Recorder` (Auto-Persist, `exportGameLog`);
  `Recorder` importiert aus `gameStore` ausschließlich Typen
  (`import type`) — keine Laufzeit-Zirkularität.
