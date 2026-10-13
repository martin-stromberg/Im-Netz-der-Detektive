# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| Deduktions-Menge in skriptierten Szenarien exakt; monoton eingeschränkt; enthält tatsächliche Position | `Deduction.ts` Vorwärtsfilterung über Positionsverläufe (Schritt 2–3), Constraints inkl. Maximalreichweite über Runden | `Deduction.test.ts` (exakte Mengen in skriptierten Szenarien), Belief-Invarianz in `AiSimulation.test.ts` | Abgedeckt |
| Detektiv-KI übt messbaren Druck aus; kein verbotenes Wissen | `DetectiveAI.ts` Abdeckungs-Heuristik; `DetectiveView` ohne `ganovePosition`/`targets` (strukturelle Trennung) | `DetectiveAI.test.ts` (Konvergenz/Einkreisung, Info-Leak-Test), `AiSimulation.test.ts` (Fanganteil im Batch) | Abgedeckt |
| Ganove-KI führt Missionen zu Ende, gewinnt relevanten Anteil | `GanoveAI.ts` Routing/Aktions-Timing/Radio/Sabotage-Wahl | `GanoveAI.test.ts`, `AiSimulation.test.ts` (Outcome-Verteilung) | Abgedeckt |
| Batch N Seeds headless bis reguläre Endbedingungen, reproduzierbar, Eventlogs | `AiSimulation.ts` + `scripts/sim.ts` + `npm run sim` | `AiSimulation.test.ts` (Determinismus, bitgleiche Logs), `scripts/sim.test.mjs`, manueller `npm run sim`-Nachweis | Abgedeckt |
| Kein `Math.random()`, kein Info-Leak in KI-Modulen | Nur injizierter `Rng`; View-Trennung auf Typebene; bestehender `no-math-random`-Git-Hook greift auf `src/logic/` | `DetectiveAI.test.ts` Info-Trennung; Hook-Check beim Commit; `npm run lint` | Abgedeckt |
| Sim-Aggregate für Schritt 14 (Outcome-Verteilung, Partienlängen, Hinweise/Partie, Kameratreffer, Sabotage-Annahmequote) | `summarizeBatch` aggregiert aus den JSONL-Logeinträgen | `AiSimulation.test.ts` (Aggregations-Test) | Abgedeckt |

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| Kein UI-Benutzerfluss (headless Dev-Modus, keine `*.tsx`-Änderung) | — | Nicht erforderlich mit Begründung: Anforderung betrifft ausschließlich headless Logik + CLI-Skript; der operative Fluss (`npm run sim` → Batch → Logs) wird durch `AiSimulation.test.ts`/`scripts/sim.test.mjs` und die tatsächliche Ausführung von `npm run sim` nachgewiesen. Im Projekt existiert keine E2E-Test-Infrastruktur. |

## Hinweise

- `falsche_spur`-Sabotage kann die Belief-Menge legitim verfälschen —
  die „kein falscher Ausschluss"-Invarianz wird in Szenarien ohne
  `falsche_spur` geprüft (im Test über Missionswahl/Seed-Filterung).
- `vite.sim.config.ts`-Ansatz (SSR-Bundle) wurde vor der Planung mit
  einem Minimal-Entry verifiziert (`import.meta.glob` wird
  transformiert, Node 24 führt das ESM-Bundle aus).
