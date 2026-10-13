# Bestandsaufnahme: Deduktion & KI (Schritt 8)

Bestandsaufnahme der Engine-Bausteine, auf denen Deduktions-Datenstruktur,
Detektiv-KI, Ganove-KI und der KI-vs.-KI-Batch-Modus aufsetzen.

## Zusammenfassung

- **Vorhanden:** Vollständig headless-fähige Engine. `useGameStore`
  (`src/state/gameStore.ts`) treibt komplette Partien von `startGame`
  bis `outcome` ohne UI; alle Züge/Aktionen/Phasen sind über imperative
  Actions steuerbar. Informationsschicht (`InformationSystem.ts`)
  liefert mit `visibleEvents`/`visibleCameras` datenseitige
  Sichtbarkeitsfilterung und `heatLevel`/`revealedGanovePosition`/
  `radioHintSummary` die ganovenseitigen Informationswerkzeuge.
  Bewegungsregeln (`Movement.ts`), BFS-Graph (`Graph.ts`), Spawn-Regeln
  (`SpawnSystem.ts`), Ereignisengine (`EreignisEngine.ts`), Kameras
  (`CameraSystem.ts`), Missionen (`MissionSystem.ts`/`MissionLoader.ts`),
  Seeded-RNG (`rng.ts`) und JSONL-Eventlog (`Recorder.ts`) sind als
  reine, deterministische Module vorhanden.
- **Fehlt offensichtlich:** `Deduction.ts`, `DetectiveAI.ts`,
  `GanoveAI.ts`, ein Simulations-/Batch-Treiber und ein `sim`-Skript in
  `package.json`/`scripts/`.
- **Randbedingung:** `MapLoader`/`MissionLoader` nutzen
  `import.meta.glob` — das funktioniert unter Vite/Vitest, nicht unter
  plain `node`. Das Sim-Skript muss die Engine daher über einen
  Vite-Build-Schritt (SSR/Node-Bundle) oder Vitest ausführen.
- **Test-Ausgangszustand:** 326 Tests in 22 Dateien, alle erfolgreich —
  siehe [Tests](inventory/tests.md) und
  [Nachweis](inventory/test-results/npm-test-baseline.log).

## Details

- [Datenmodell / Sicht- und Zustandstypen](inventory/models.md)
- [Logikmodule](inventory/logic.md)
- [Tests](inventory/tests.md)
