# Übersetzte Anforderung — Schritt 8: Deduktion & KI

## Fachliche Zusammenfassung

Die Engine erhält drei neue Logikmodule unter `src/logic/`: eine geteilte
Deduktions-Datenstruktur (`Deduction.ts`), die aus den detektivsichtbaren
Hinweisen die Menge aller mit ihnen konsistenten Ganoven-Positionsverläufe
über die Runden hinweg berechnet; eine Detektiv-KI (`DetectiveAI.ts`), die
alle Detektive als eine Instanz auf Basis dieser Datenstruktur steuert; und
eine Ganove-KI (`GanoveAI.ts`), die Mission, Aktions-Timing, Polizeifunk und
Sabotage-Binärwahl heuristisch spielt. Darauf aufsetzend wird ein
vollständig headless KI-vs.-KI-Dev-Modus als Batch-Lauf über
`npm run sim` (Skript unter `scripts/`) bereitgestellt, der Partien über
viele Seeds zu regulären Endbedingungen spielt und Eventlogs plus
aggregierte Balancing-Statistiken ausgibt.

## Betroffene Klassen und Komponenten

- **Neue Logikmodule** (`src/logic/`):
  - `Deduction.ts` — Berechnung der möglichen Ganoven-Positionen pro Runde
    aus detektivsichtbaren `GameEvent`s (Constraints: `camera`,
    `sichtbarkeit`, `aktion` als exakte Knoten+Runde; `hinweis` als
    Knoten-Ball; `umwelt`-Kantensperrungen als zeitabhängige
    Übergangsbeschränkungen; Spawn-Prior aus `spawnRules.ganove`).
    Wird später identisch vom UI-Overlay und der Detektiv-KI genutzt.
  - `DetectiveAI.ts` — steuert alle Detektive als eine Instanz; Heuristik
    „auf den letzten Hinweis zusteuern + mögliche Positionen eingrenzen"
    mit Aufteilung/Einkreisung über die Truppe. Bekommt nur eine
    detektivsichtbare Sicht (`DetectiveView`) übergeben — keine
    Ganovenposition, keine Missionszielknoten (strukturelle Trennung).
  - `GanoveAI.ts` — Missionsverfolgung: Routenwahl Richtung aktuellem
    Ziel, Aktions-Timing (nicht bei hoher Hitze/nahen Detektiven),
    Polizeifunk-Einsatz, Sabotage-Binärwahl (Umweg vs. Effekt).
  - `AiSimulation.ts` — headless Spieltreiber: treibt `useGameStore` mit
    beiden KIs bis zum regulären `outcome`; Batch-Lauf über Seed-Listen
    und Aggregation der Balancing-Metriken aus den Eventlogs.
- **Skript:** `scripts/sim.ts` (oder vergleichbar) + `npm run sim` in
  `package.json` — CLI mit Seed-Range/Anzahl, Kartenwahl,
  Eventlog-Ausgabe ins Dateisystem und stdout-Summary
  (Outcome-Verteilung, Partienlängen, Hinweise/Partie, Kameratreffer,
  Sabotage-Annahmequote).
- **Bestehende Module:** unverändert genutzt — `useGameStore`
  (`src/state/gameStore.ts`), `Movement.ts`, `Graph.ts`,
  `InformationSystem.ts` (`visibleEvents`, `visibleCameras`,
  `heatLevel`, `revealedGanovePosition`, `HINT_EVENT_KINDS`),
  `MissionSystem.ts` (`missionStructure`, `executableMissionAction`,
  `sabotageDuration`), `SpawnSystem.ts` (`ganoveSpawnChoices`),
  `rng.ts`, `Recorder.ts` (`serializeLog`).
- **Tests:** neue Testklassen pro Themengruppe für Deduktion, beide KIs
  und die Simulation (`*.test.ts` neben den Modulen).

## Implementierungsansatz

- Deduktion als reine Funktion über `(map, events, round, spawnCandidates)`:
  Vorwärtsfilterung — Kandidatenmenge pro Runde aus der vorherigen Menge
  über einen legalen Ganoven-Schritt (eine ungesperrte Kante; Verharren
  nur in Runden mit `aktion`-Hinweis), anschließend Schnitt mit den
  Constraints der Runde. Dadurch beschränken vergangene Hinweise spätere
  Positionen über die Maximalreichweite (BFS/Übergangskette).
- KIs sind reine Funktionen auf explizit gefilterten Sicht-Objekten
  (`DetectiveView`, `GanoveView`) — die strukturelle Trennung macht
  Informations-Leaks unmöglich: der Detektiv-KI werden nur
  `visibleEvents(..., "detectives")`, Detektivpositionen, Kameras,
  gesperrte Kanten und die Missionsstruktur (nie Zielknoten) übergeben.
- Beide KIs erhalten Zufallsentscheidungen ausschließlich über den
  injizierten `Rng` (`createRng`/`mixSeed`) — deterministisch je Seed,
  kein `Math.random()`.
- Der Sim-Treiber ruft in der Ganovenphase `GanoveAI` (Zug, Aktion oder
  `chooseMissionPath`, ggf. `useRadio`), in der Detektivphase `DetectiveAI`
  für den jeweils aktiven Detektiv — reguläre Endbedingungen entstehen
  allein im Store (`caught`/`surrounded`/`escaped`/`timeout`; `draw` nur
  als Sicherheitsgrenze bei unbegrenzten Partien).
- `npm run sim`: CLI baut den Engine-Entry headless (Vite-SSR-Build oder
  gleichwertig, da `MapLoader` auf `import.meta.glob` basiert) und
  aggregiert aus den JSONL-Eventlogs die Balancing-Statistiken.

## Konfiguration

- `npm run sim -- --map <id> --games <n> --seed-start <n> [--out <dir>]`
  (Seed-Range/Anzahl, Karte, Ausgabeverzeichnis; stdout-Summary immer).
- KI-Schwellenwerte (Hitze-Level für Aktionsverzicht/Radio, maximale
  Sabotage-Umweg-Akzeptanz) als Konstanten in den KI-Modulen —
  Balancing-Parameter.

## Akzeptanzkriterien (aus der Anforderung)

1. Deduktions-Menge in skriptierten Szenarien exakt korrekt; mit jedem
   Hinweis monoton eingeschränkt; enthält die tatsächliche
   Ganovenposition (kein falscher Ausschluss).
2. Detektiv-KI übt messbaren Druck aus (fängt den Ganoven in einem
   relevanten Anteil der Simulationspartien) und verwendet nachweisbar
   nur detektivsichtbare Informationen (strukturelle Trennung der Views).
3. Ganove-KI kann Missionen zu Ende führen und gewinnt in einem
   relevanten Anteil der Simulationspartien.
4. Batch-Läufe von N Partien verschiedener Seeds laufen headless zu
   regulären Endbedingungen mit vollständigen Eventlogs —
   reproduzierbar je Seed.
5. Kein `Math.random()` und kein Informations-Leak in den KI-Modulen.

## Offene Fragen

- Keine fachlich blockierenden Fragen. Annahme (gekennzeichnet):
  Die Deduktion modelliert „Verharren" nur in Runden mit beobachteter
  `aktion`-Spur — alle realen Aktionsrunden erzeugen eine solche Spur;
  `falsche_spur`-Sabotage darf die Deduktionsmenge legitim verfälschen
  (das ist ihr Zweck), der „kein falscher Ausschluss"-Nachweis bezieht
  sich auf unverfälschte Szenarien.
