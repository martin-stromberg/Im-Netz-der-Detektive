# Übersetzte Anforderung: Rundenablauf und Spielende (Schritt 4)

## Fachliche Zusammenfassung

Der Rundenmotor des Spiels „Im Netz der Detektive" wird headless auf dem
bestehenden Zustand-Store (`useGameStore`) und dem Kartengraphen
(`Graph.ts`) implementiert (Spezifikation: `docs/konzept/content/01-spielkonzept.md`
§3 und §7, `02-technisches-konzept.md` §3/§5/§8). Jede Runde besteht aus zwei
Phasen: zuerst die Ganovenphase (ein Zug auf einen legalen Nachbarknoten —
oder später eine Aktionsrunde), danach die Detektivphase, in der jeder
Detektiv einzeln in fester Reihenfolge D1→Dn zieht. Alle Bewegungsregeln
inklusive Zugzwang werden validiert; die Fangprüfung läuft nach jedem
einzelnen Detektivzug. Alle fünf Endbedingungen (Fang, Umzingelung, Flucht,
Zeitlimit, Remis) werden erkannt und als `outcome` im Store festgehalten.

## Betroffene Klassen und Komponenten

- **Neu `src/logic/Movement.ts`** (Logikmodul, gemäß `02-technisches-konzept.md` §5):
  - `legalGanoveMoves()`, `legalDetectiveMoves()` / `legalMoves()` — legale Zielknoten
  - `validateGanoveMove()`, `validateDetectiveMove()` / `validateMove()` — Zugprüfung
  - `applyMove()` bzw. Positions-Anwendung im Store
  - `MoveError` (Fehlerklasse mit maschinenlesbarem `reason`-Code)
  - `escapeNodes()` / Auflösung der Fluchtpunkte (Kategorie `flucht`, vorbereitet
    für die missionsgebundene Variante aus Schritt 6)
  - Prüfpunkt `canGanoveAct()` — Hook, den das Missionssystem später befüllt;
    liefert konservativ `false`
- **`src/state/gameStore.ts`** (Erweiterung des Zustand-Stores):
  - Neue Felder: `outcome` (`"caught" | "surrounded" | "escaped" | "timeout" | "draw" | null`),
    `roundLimit` (`number | null`, `null` = unbegrenzt), `escapeNodeIds` (oder
    gleichwertige Auflösung), Aktions-Hook für den Ganoven
  - Neue Actions: `moveGanove(target)`, `moveDetective(target)` (arbeitet auf
    `activeDetectiveIndex`), Aktionsrunde des Ganoven (Struktur/Prüfpunkt),
    `abortAsDraw()`
  - `startGame`-Optionen um `roundLimit` (`number | null`) erweitert
  - Log-Einträge im JSONL-Format (§8): `move`-Events, `result`-Event
- **Tests** (neu):
  - `src/logic/Movement.test.ts` — Bewegungsvalidierung
  - `src/state/gameStore.test.ts` erweitert bzw. neue Testdatei(en)
    `src/state/gameStore.rundenablauf*.test.ts` — skriptgesteuerte Testpartien
    für alle Endbedingungen und die Phasenmaschine

## Implementierungsansatz

- `Movement.ts` ist ein reines, deterministisches Logikmodul ohne Store-
  Abhängigkeit (Eingabe: `MapPack`/Graph, Positionen, `blockedEdges`,
  aktuelle Runde). `Math.random()` ist in `src/logic/` verboten — der
  Rundenmotor selbst braucht keinen Zufall; Determinismus folgt aus Seed +
  skriptgesteuerten Zügen.
- Der Store bleibt die treibende Instanz: `moveGanove`/`moveDetective`
  validieren über `Movement.ts`, mutieren die Positionsfelder, führen die
  Sofort-Fangprüfung aus, schalten die Phasenmaschine weiter und prüfen die
  Endbedingungen (Flucht nach dem Ganovenzug; Umzingelung zu Beginn jeder
  Ganovenphase; Zeitlimit beim Rundenübergang).
- Die Aktionsrunde des Ganoven (§5.3: Aktion kostet die Bewegung der Runde)
  wird als struktureller Prüfpunkt vorgesehen: eine registrierbare
  Aktionsverfügbarkeit (`canGanoveAct`) plus eine Store-Action, die eine
  Aktionsrunde nur dann erlaubt, wenn eine Aktion verfügbar ist. Das
  Missionssystem befüllt den Hook in einem späteren Schritt.
- Fluchtpunkte werden aus der Knotenkategorie `flucht` aufgelöst; die
  Auflösung ist über ein Store-Feld überschreibbar, damit Schritt 6 die
  missionsgebundene Flucht anschließen kann.
- `docs/konzept/` bleibt unangetastet; kein UI-Ausbau.

## Konfiguration

- `roundLimit` aus `map.settings.roundLimit` (`suggested` als Default,
  `unlimited: true` erlaubt den Wert `null` = ohne Zeitlimit). Überschreibbar
  pro Partie über `startGame`-Optionen — analog zur bestehenden
  Menü-Überschreibbarkeit (§2/§4).

## Offene Fragen

Keine — die Spezifikation (§3, §5.3, §7) und die Anforderung legen alle
Regeln eindeutig fest. Die missionsgebundene Aktions-/Fluchtmechanik ist
explizit als Hook in einem Folgeschritt vorgesehen.
