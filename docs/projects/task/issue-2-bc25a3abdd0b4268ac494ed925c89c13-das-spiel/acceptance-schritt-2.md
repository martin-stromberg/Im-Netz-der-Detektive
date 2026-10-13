# Abnahmeprüfung – Entwicklungsschritt 2

## Ergebnis

**Status:** Anforderung vollständig erfüllt

## Abweichungen

- [ ] `spawnRules.detectives|ganove.zones` wird bei `mode: "choice"` nicht validiert:
  `zones: []`, Nicht-String-Einträge und unbekannte Zonennamen passieren
  `validateMapPack` unbemerkt (`src/logic/mapPack.ts:206-222` prüft nur
  `nodes`-Referenzen; `zones` wird lediglich auf „ist Array" getestet).
  Der Fehler fällt erst zur Laufzeit als `SpawnError` in
  `src/logic/SpawnSystem.ts:39` (leere Kandidatenliste) auf. Ebenso spiegelt
  `.githooks/map-schema-check.py:116-126` dieselbe Lücke. Auswirkung gering:
  verständlicher Fehler, nur später und weniger präise lokalisiert.

## Hinweise

- Prüfnachweis lokal ausgeführt (Branch
  `task/...-schritt-2-engine-grundgeruest`, Stand HEAD):
  - `npm run build` — OK (`tsc --noEmit` + `vite build`, 26 Module).
  - `npm test` — 87 Tests in 8 Dateien, alle grün.
  - `npm run coverage` — Zeilen 87,87 %, Statements 88,53 %, Branches 81,6 %
    (≥ 70 %-Vorgabe erfüllt).
  - `npm run typecheck` — OK. `npm run lint` — OK (keine Findings).
- Kartenpaket-Format (§4): Alle Pflichtfelder werden validiert — `nodes`
  (id/name/x/y/categories gegen Enum/zone, Duplikat-IDs), `edges` (a/b-Referenzen,
  type ∈ `weg`|`fahrt`, `cost` reserviert/typgeprüft), `spawnRules` (Modi
  `choice`/`free`/`random`, `minDistanceToDetective` typgeprüft,
  `order: "detektive_first"` erzwungen), `settings` komplett inkl.
  `roundLimit` mit `unlimited`-Alternative zu `max`, `viewBox`, `id`, `name`.
  Fehler werden aggregiert (`MapValidationError.errors`, „path: message");
  Aggregations-Test vorhanden (`mapPack.test.ts:144-152`).
- BFS: Erwartete Distanzen auf `teststadt.json` händisch nachgerechnet und
  mit dem Test abgeglichen (a=0, b=1, c/e=2, d/f/h/j=3, g/i=4) — korrekt;
  `fahrt` zählt als normale Kante (ungewichtet, `cost` bewusst ignoriert).
- RNG: `grep Math.random src/` trifft nur einen Kommentar in `rng.ts:3`;
  mulberry32-Implementierung, Seed-Determinismus und Seed-Varianz durch Tests
  belegt (`rng.test.ts`, `SpawnSystem.test.ts:127-145`,
  `gameStore.test.ts:51-73`).
- Spawn: `assignSpawns` zieht alle Detektive vor dem Ganoven;
  `ganoveSpawnChoices` filtert `minDistanceToDetective` per BFS in allen drei
  Modi; explizite Positionen werden im Store gegen die erlaubten Listen
  validiert (`gameStore.ts:127-165`). `minDistanceToDetective` greift — wie
  spezifiziert — nur für den Ganoven („Mindestabstand zu den Detektiven").
- Store: alle §3-Felder vorhanden (`round`, `phase`, `activeDetectiveIndex`,
  `ganovePosition`, `detektivePositions`, `mission`, `events`, `cameras`,
  `blockedEdges`, `eventMode`, `tensionValue`, `seed`, `log`, plus `map`);
  kein React-Import in `gameStore.ts`; Tests treiben den Store headless via
  `getState()`. Die Phasen-Actions (`endGanovePhase`/`advanceDetective`/
  `endDetectivePhase`) sind reine Zustandsbuchführung ohne Regellogik —
  kein Scope-Übergriff.
- Keine Scope-Überschreitung: kein Movement-/Kamera-/Ereignis-/Missionsmodul,
  keine UI-Änderungen; Diff beschränkt sich auf `src/logic`, `src/state`,
  `src/data/maps/teststadt.json` und Doku (`docs/help/spiel-engine/`).
