# Umsetzungsplan: Rundenablauf und Spielende (Schritt 4)

## Übersicht

Der komplette headless-Rundenmotor nach `01-spielkonzept.md` §3/§7 wird umgesetzt:
ein neues, reines Logikmodul `src/logic/Movement.ts` (Zugvalidierung, legale
Züge, Fluchtpunkte) und die Verdrahtung im `useGameStore` (Zwei-Phasen-Runden
mit fester Detektivreihenfolge, Fangprüfung nach jedem Einzelzug, alle fünf
Endbedingungen). Die Aktionsrunde des Ganoven und die missionsgebundene Flucht
werden als benannte Hooks/Prüfpunkte vorgesehen und vom Missionsschritt befüllt.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| Zugvalidierung | Reines Modul `src/logic/Movement.ts` ohne Store-Abhängigkeit (`MoveContext` = Graph + Positionen + `blockedEdges` + `round`) | `02-technisches-konzept.md` §5 sieht genau dieses Modul vor; rein funktional = deterministisch und ohne UI testbar |
| Fehler bei illegalen Zügen | `MoveError` mit maschinenlesbarem `reason`-Code (`MoveRejection`-Union) statt `boolean` | Skriptgesteuerte Partien und spätere UI/KI können den Ablehngrund unterscheiden (z. B. `occupied` vs. `blocked_edge`) |
| Spielergebnis | Neues Store-Feld `outcome: GameOutcome \| null` mit `"caught" \| "surrounded" \| "escaped" \| "timeout" \| "draw"` | Deckt sich mit `result.outcome` des Eventlog-Formats (`02-technisches-konzept.md` §8 inkl. `"draw"`); `outcome !== null` = Partie beendet, alle Zug-Actions werden dann abgelehnt |
| Aktionsverfügbarkeit des Ganoven | Store-Flag `ganoveCanAct: boolean` + Setter `setGanoveCanAct()`; Umzingelungs-Prüfung fragt das Flag; `ganoveAction()` erfordert es | Serielisierbarer, expliziter Prüfpunkt — das Missionssystem setzt das Flag beim Erreichen eines Aktionsziels; konservativer Default `false` = „keine Aktion" |
| Fluchtpunkte | Store-Feld `escapeNodeIds: string[]`, bei `startGame` aus Knotenkategorie `flucht` befüllt; Setter `setEscapeNodeIds()` als Missions-Hook | Schritt 6 kann die missionsgebundene Flucht anschließen, ohne den Bewegungsmotor zu ändern; besetzte Fluchtpunkte sind automatisch illegale Ziele (besetzt ⇒ illegal) |
| Umzingelungs-Zeitpunkt | Automatische Prüfung beim Übergang in Phase `ganove` (in `startGame` und beim Rundenende) — exakt „zu Beginn seiner Phase" | Spec §7; damit kann kein Treiber die Prüfung vergessen |
| Zeitlimit | Store-Feld `roundLimit: number \| null` (`null` = unbegrenzt); Auflösung bei `startGame` aus `options.roundLimit` bzw. `map.settings.roundLimit.suggested`; Prüfung beim Abschluss der Detektivphase (`round >= roundLimit` ⇒ `timeout`) | `roundLimit.unlimited` der Map erlaubt `null`; Runde 1..limit werden gespielt, `roundLimit` bleibt der Zähler der letzten Runde |
| Phasenmaschine | `moveGanove`/`moveDetective`/`ganoveAction` treiben die Phasen vollständig; die bisherigen Primitiven (`endGanovePhase`, `advanceDetective`, `endDetectivePhase`) bleiben erhalten, `endDetectivePhase` führt ebenfalls die Rundenende-Prüfungen aus | Low-level-Actions sind von bestehenden Tests belegt und bleiben für spätere Engine-Schritte nutzbar; die Regel-Actions sind der normale Einstieg |

## Programmabläufe

### Ganovenzug

1. `moveGanove(target)`: Voraussetzungen prüfen (`map` gesetzt, `outcome === null`,
   `phase === "ganove"`) — sonst `MoveError` (`no_game` / `game_over` / `wrong_phase`).
2. `validateGanoveMove(ctx, target)` → `MoveTarget` (wirft `MoveError` mit
   `reason`: `stay_forbidden`, `not_adjacent`, `blocked_edge`, `occupied`).
3. `ganovePosition = target`; Logeintrag `{type:"move", details:{actor:"ganove", from, to, edgeType}}`.
4. Fluchtprüfung: `escapeNodeIds` enthält `target` → `outcome = "escaped"`,
   `result`-Logeintrag, Phase bleibt `ganove` (Partie beendet).
5. Sonst: `phase = "detektive"`, `activeDetectiveIndex = 0`.

### Detektivzug (fester Reihenfolge D1→Dn)

1. `moveDetective(target)`: Voraussetzungen (`map`, `outcome === null`,
   `phase === "detektive"`, `activeDetectiveIndex < detektivePositions.length`).
2. `validateDetectiveMove(ctx, activeDetectiveIndex, target)` → `MoveTarget`
   (besetzte Knoten sind für Detektive erlaubt — Teilen ist legal).
3. `detektivePositions[activeDetectiveIndex] = target`; `move`-Logeintrag mit
   `actor:"detective"` + `detectiveIndex`.
4. **Fangprüfung sofort:** `target === ganovePosition` → `outcome = "caught"`,
   `result`-Logeintrag; weitere Detektive ziehen nicht mehr.
5. Sonst: war es der letzte Detektiv → Rundenende (s. u.); sonst
   `activeDetectiveIndex + 1`.

### Rundenende (nach dem letzten Detektivzug bzw. `endDetectivePhase`)

1. Zeitlimit: `roundLimit !== null && round >= roundLimit` → `outcome = "timeout"`,
   `result`-Logeintrag, `round` bleibt der Limit-Runde.
2. Sonst: `round + 1`, `phase = "ganove"`, `activeDetectiveIndex = 0`,
   `unblockExpiredEdges` (gesperrte Kanten mit `untilRound < round` fallen weg).
3. Umzingelungsprüfung: `legalGanoveMoves` leer **und** `ganoveCanAct === false`
   → `outcome = "surrounded"`, `result`-Logeintrag.

### Aktionsrunde des Ganoven (Struktur/Prüfpunkt)

1. `ganoveAction()`: nur bei `phase === "ganove"`, `outcome === null` und
   `ganoveCanAct === true` — sonst `MoveError` (`no_action_available`).
2. Der Ganove bleibt stehen (einzige Zugzwang-Ausnahme); Logeintrag
   `{type:"action", details:{actor:"ganove"}}`; `phase = "detektive"`,
   `activeDetectiveIndex = 0`. Der Ganove bleibt voll fangbar (Fangprüfung
   läuft in der Detektivphase normal).

### Remis

1. `abortAsDraw()`: bei laufender Partie (`map` gesetzt, `outcome === null`)
   → `outcome = "draw"`, `result`-Logeintrag.

## Neue Klassen

| Klasse | Typ | Zweck |
|--------|-----|-------|
| `Movement.ts` | Logikmodul (`src/logic/`) | Reine Zugregeln: `MoveContext`, `MoveTarget`, `MoveError`, `legalMovesFrom`, `legalGanoveMoves`, `legalDetectiveMoves`, `validateGanoveMove`, `validateDetectiveMove`, `mapEscapeNodeIds` |
| `MoveError` | Fehlerklasse | `reason: MoveRejection` — `no_game`, `game_over`, `wrong_phase`, `not_active_detective`, `stay_forbidden`, `not_adjacent`, `blocked_edge`, `occupied`, `no_action_available` |
| `MoveContext` | Interface | `{graph, round, blockedEdges, ganovePosition, detektivePositions}` |
| `MoveTarget` | Interface | `{nodeId, edgeType}` — legale/validierte Ziele inkl. Kantentyp für das Log |
| `GameOutcome` | Type-Alias | `"caught" \| "surrounded" \| "escaped" \| "timeout" \| "draw"` |
| `GameConfigError` | Fehlerklasse | Ungültige `startGame`-Optionen (z. B. `roundLimit: null` ohne `unlimited`, Wert außerhalb `min`/`max`) |

## Änderungen an bestehenden Klassen

### `useGameStore` / `GameState` (`src/state/gameStore.ts`)

- **Neue Eigenschaften:** `outcome: GameOutcome | null`; `roundLimit: number | null`;
  `escapeNodeIds: string[]`; `ganoveCanAct: boolean`
- **Neue Methoden:** `moveGanove(target: string): void` — validierter Ganovenzug
  inkl. Fluchtprüfung und Phasenübergang; `moveDetective(target: string): void` —
  Zug des aktiven Detektivs inkl. Sofort-Fangprüfung und Rundenende;
  `ganoveAction(): void` — Aktionsrunde (Zugzwang-Ausnahme, erfordert
  `ganoveCanAct`); `abortAsDraw(): void`; `getLegalGanoveMoves(): MoveTarget[]`;
  `getLegalDetectiveMoves(): MoveTarget[]` (für `activeDetectiveIndex`);
  `setEscapeNodeIds(ids: string[]): void` (Missions-Hook);
  `setGanoveCanAct(flag: boolean): void` (Aktions-Hook)
- **Geänderte Methoden:** `startGame` — `StartGameOptions.roundLimit?: number | null`,
  validiert gegen `settings.roundLimit` (`null` nur bei `unlimited: true`),
  initialisiert `escapeNodeIds` aus `flucht`-Knoten, `ganoveCanAct = false`,
  `outcome = null`, und führt die initiale Umzingelungsprüfung durch;
  `endDetectivePhase` — führt die vollständige Rundenende-Sequenz aus
  (Timeout → Runde+1 → Kanten-Ablauf → Umzingelung), sobald eine Karte geladen ist
- **Neue Typen:** `GameOutcome`, `GameConfigError`, `StartGameOptions.roundLimit`

### `BlockedEdge` (`src/state/gameStore.ts` → Definition nach `Movement.ts`)

- `BlockedEdge` wird in `Movement.ts` definiert ( dort fachlich angesiedelt) und
  aus `gameStore.ts` re-exportiert — öffentliche API bleibt kompatibel.

## Datenbankmigrationen

Keine.

## Validierungsregeln

| Feld / Objekt | Regel | Fehlerfall |
|---------------|-------|------------|
| `moveGanove`/`moveDetective`/`ganoveAction` | Partie läuft (`map`, `outcome === null`), korrekte Phase | `MoveError` `no_game`/`game_over`/`wrong_phase` |
| Zugziel | `target !== aktuelle Position` (Zugzwang) | `MoveError` `stay_forbidden` |
| Zugziel | Nachbarknoten über **ungesperrte** Kante | `MoveError` `not_adjacent` / `blocked_edge` |
| Ganovenziel | nicht von Detektiv besetzt | `MoveError` `occupied` |
| `ganoveAction` | `ganoveCanAct === true` | `MoveError` `no_action_available` |
| `startGame` `roundLimit` | `null` nur bei `settings.roundLimit.unlimited`; Zahl in `[min, max?]` | `GameConfigError` |
| `abortAsDraw` | nur bei laufender Partie | `MoveError` `no_game`/`game_over` |
| `moveDetective` | nur der aktive Detektiv (`activeDetectiveIndex`) zieht — implizit durch die Signatur | – |

## Konfigurationsänderungen

Keine — `roundLimit` wird pro Partie über `StartGameOptions` aufgelöst
(map-seitige Defaults bleiben im Kartenpaket).

## Seiteneffekte und Risiken

- **`endDetectivePhase` wird regelbewusst:** Ruft jetzt Timeout-/Ablauf-/
  Umzingelungsprüfung auf, sobald `map` gesetzt ist. Bestehender Test
  (Runde 1 → 2 auf `teststadt`) bleibt grün (Limit 30, Ganove hat Züge).
  Ohne geladene Karte bleibt das bisherige Minimalverhalten.
- **`MoveError` bei `wrong_phase` für `moveDetective`:** Skripte, die
  Detektivzüge außerhalb der Detektivphase aufrufen, schlagen jetzt fehl —
  gewollt, bisher existieren keine solchen Aufrufer.
- **Keine UI-Auswirkung:** `App.tsx` liest nur `round`; das Shell-Rendering
  bleibt unverändert.

## Umsetzungsreihenfolge

1. **`src/logic/Movement.ts` anlegen**
   - Voraussetzungen: `Graph.ts`, `mapPack.ts` (beide vorhanden)
   - Beschreibung: Typen (`MoveContext`, `MoveTarget`, `MoveRejection`,
     `MoveError`, `BlockedEdge`), `isEdgeBlocked`/`activeEdgeBlocks`,
     `legalMovesFrom`, `legalGanoveMoves`, `legalDetectiveMoves`,
     `validateGanoveMove`, `validateDetectiveMove`, `mapEscapeNodeIds`.
2. **`src/state/gameStore.ts` erweitern**
   - Voraussetzungen: Schritt 1
   - Beschreibung: Neue Felder (`outcome`, `roundLimit`, `escapeNodeIds`,
     `ganoveCanAct`), `GameOutcome`/`GameConfigError`/`roundLimit`-Option,
     Actions (`moveGanove`, `moveDetective`, `ganoveAction`, `abortAsDraw`,
     `getLegalGanoveMoves`, `getLegalDetectiveMoves`, `setEscapeNodeIds`,
     `setGanoveCanAct`), `endDetectivePhase` mit Rundenende-Sequenz,
     `startGame` mit Auflösung + initialer Umzingelungsprüfung;
     interne Hilfsfunktion `finishRound`/`checkGanoveSurrounded`;
     `result`-/`move`-/`action`-Logeinträge.
3. **Engine-Tests schreiben**
   - Voraussetzungen: Schritte 1–2
   - Beschreibung: `src/logic/Movement.test.ts` (Validierung) +
     `src/state/gameStore.rounds.test.ts` (Rundenablauf, Reihenfolge, Log) +
     `src/state/gameStore.endings.test.ts` (alle fünf Endbedingungen,
     skriptgesteuerte Partien auf `teststadt`).
4. **Qualitätssicherung**
   - Voraussetzungen: Schritte 1–3
   - Beschreibung: `npm run build`, `npm test`, `npm run coverage`
     (Schwelle 70 %), `npm run lint`, `npm run format` auf neue Dateien.

## Tests

### Neue Tests

| Test / Hilfsmethode | Testklasse | Was wird geprüft / bereitgestellt? |
|--------------------|------------|-------------------------------------|
| `legalMovesFrom_…` | `Movement.test.ts` | Nachbarn beider Kantentypen; gesperrte Kante (`untilRound` inkl. Grenzfälle) unpassierbar; abgelaufene Sperrung wieder offen; unbekannter Knoten → leer |
| `legalGanoveMoves_…` | `Movement.test.ts` | Detektiv-besetzte Knoten fehlen; Nachbarn beider Typen enthalten |
| `legalDetectiveMoves_…` | `Movement.test.ts` | Teilen erlaubt (besetzter Knoten bleibt legales Ziel); gesperrte Kante gefiltert |
| `validateGanoveMove_…` | `Movement.test.ts` | `stay_forbidden`, `not_adjacent`, `blocked_edge`, `occupied`; Erfolg liefert `MoveTarget` mit `edgeType` |
| `validateDetectiveMove_…` | `Movement.test.ts` | `stay_forbidden`, `not_adjacent`, besetztes Ziel erlaubt, ungültiger Index → `not_active_detective` |
| `mapEscapeNodeIds_…` | `Movement.test.ts` | Liefert `flucht`-Knoten der Karte (`teststadt`: `b`,`d`,`g`) |
| `startGame_…` | `gameStore.rounds.test.ts` | `roundLimit`-Auflösung (Default = `suggested`, Override, `null` bei `unlimited`, `GameConfigError`-Fälle); `escapeNodeIds` aus Kategorie; initiale Umzingelung |
| `moveGanove_…` | `gameStore.rounds.test.ts` | Zug schaltet auf `detektive`, schreibt `move`-Log mit `edgeType`; Fehler bei `wrong_phase`/`game_over`/illegalem Ziel |
| `moveDetective_…` | `gameStore.rounds.test.ts` | Feste Reihenfolge D1→Dn (`activeDetectiveIndex`), letzter Detektiv schließt Runde (`round + 1`, `phase ganove`), Teilen zweier Detektive auf einem Knoten |
| `ganoveAction_…` | `gameStore.rounds.test.ts` | `no_action_available` ohne Flag; mit `setGanoveCanAct(true)` bleibt Ganove stehen, Phase wechselt, `action`-Log |
| `moveDetective_…Caught` | `gameStore.endings.test.ts` | Detektiv landet auf Ganoven-Knoten → `outcome "caught"`, `result`-Log, Partie endet **mitten in der Detektivphase** (weitere Detektive können nicht ziehen) |
| `…Surrounded` | `gameStore.endings.test.ts` | Ganove ohne legale Züge + `ganoveCanAct=false` → `outcome "surrounded"` (Detektiv-Sieg); mit `ganoveCanAct=true` keine Umzingelung, `ganoveAction` möglich |
| `…Escaped` | `gameStore.endings.test.ts` | Ganove erreicht freien `flucht`-Knoten → `outcome "escaped"`; besetzter Fluchtpunkt ist illegales Ziel (`occupied`) |
| `…Timeout` | `gameStore.endings.test.ts` | `roundLimit` erreicht → `outcome "timeout"` nach der letzten Runde; `roundLimit: null` → kein Timeout auch nach vielen Runden |
| `abortAsDraw_…` | `gameStore.endings.test.ts` | `outcome "draw"` + `result`-Log; danach keine Züge mehr (`game_over`) |

### Betroffene bestehende Tests

| Test / Testklasse | Grund der Anpassung |
|-------------------|---------------------|
| `gameStore.test.ts` (Initiale State-Prüfung) | Neue Felder `outcome`, `roundLimit`, `escapeNodeIds`, `ganoveCanAct` in `initialData` → Assertions ergänzen |

### E2E-Tests

Nicht erforderlich: Die Anforderung berührt keinen Benutzerfluss — ausdrücklich
„kein UI-Ausbau", der Rundenmotor läuft headless. Der Funktionsnachweis erfolgt
durch skriptgesteuerte Store-Partien (Akzeptanzkriterium „skriptgesteuerte
Testpartien"), die denselben Store ohne UI treiben — sie sind das Äquivalent
der E2E-Abdeckung auf Engine-Ebene.

## Offene Punkte

Keine.
