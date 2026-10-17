# Testergebnisse — Schritt 10: Detektiv-Perspektive

Ausführung am 2026-10-14 auf dem Feature-Branch.

## Befehle

| Befehl | Ergebnis |
|---|---|
| `npm run build` (`tsc --noEmit && vite build`) | ✅ grün (0 Fehler, `✓ built in ~117 ms`) |
| `npm test` (`vitest run`) | ✅ **34 Dateien / 445 Tests, alle grün** |
| `npm run coverage` (`vitest run --coverage`) | ✅ **Zeilenabdeckung 92,7 %** (Statements 93,2 %, Branches 84,9 %, Funktionen 98,0 %) — ≥ 70 %-Vorgabe erfüllt |
| `npm run lint` (`eslint .`) | ✅ 0 Befunde |
| `npm run test:e2e` (`playwright test`) | ✅ **12/12 Tests grün** (5 Ganove + 7 Detektiv), ~6 s |

## Neue Unit-/Komponententests (26)

- `src/state/ganoveDriver.test.ts` (8): No-op außerhalb der
  Ganove-Phase, genau ein KI-Zug pro Aufruf, Seed-Determinismus,
  Sabotage-Binärwahl-Auflösung, einmaliger Polizeifunk unter Hitze,
  Subskriptions- und Abmeldeverhalten, kein Treiben nach Spielende.
- `src/components/DetektivScreen.test.tsx` (10): idle → pickSpawns →
  playing (nur legale Kandidaten interaktiv, D1→Dn, verdeckter
  Ganove-Start), automatischer KI-Ganove-Zug, Detektivzug per Klick
  mit Rundenfortschritt, Chronik nur mit detektivsichtbaren
  Ereignissen inkl. Runde/Ort/Zone, Missionsstruktur mit Pools ohne
  Ziel-IDs, Overlay = exakte `deducePossiblePositions`-Menge,
  Marker+Kommentar persistent über Runden, Remis-Abbruch.
- `src/components/MapGraph.test.tsx` (+6): Kamera-Glyphen aktiv/
  sabotiert, Kategorien+Zonen on demand, aktiver Detektiv,
  Marker-Pins + Overlay-Rauten, `markable` als tastaturbedienbarer
  Toggle mit eigenem Aria-Label.
- `src/App.test.tsx` (+2): Modusauswahl-Buttons, direkter
  `?mode=ganove`-/`?mode=detektiv`-Einstieg.

## E2E-Szenarien (`e2e/detektiv.spec.ts`, neu — alle mit echter DOM-Interaktion)

1. Setup: D1→Dn-Picks nur aus `data-selectable`-Kandidaten;
   Ganove-Start nie gerendert; Kameras/Kategorien/Zonen sichtbar.
2. Klick auf legales Ziel bewegt den aktiven Detektiv.
3. Overlay entspricht **exakt** dem Engine-Ergebnis
   (`deducePossiblePositions` auf dem Store-Snapshot) — nach jedem
   Zug; nie leer im laufenden Spiel.
4. Marker setzen → kommentieren → über zwei Runden persistent →
   per Klick entfernbar.
5. Tastatur: Tab + Enter auf legalem Ziel bewegt den Detektiv.
6. Komplette Partie bis zum Endzustand (`timeout`, 120 Züge):
   Asymmetrie-Assertion (`[data-ganove]` = 0, `[data-mission-target]` = 0)
   in **jeder** Iteration; Chronik mit 13 Einträgen am Ende.
7. „Als Remis beenden" mit Bestätigung → Endanzeige `draw`.

## Befund-Historie (testgetrieben behoben)

- Zustand-Endlosschleife durch `getMissionStructure()`-Selektor →
  stabile `mission`-Selektion + lokale Ableitung.
- SVG-Pointer-Events der Deko-Elemente blockierten Knotenklicks
  (Playwright-Actionability) → `pointer-events` nur auf `hitArea`.
- Chronik/Werkzeuge bei Spielende unsichtbar → Panels jetzt dauerhaft.
- `mission=none` → KI-Flucht in Runde 1 → Spec auf `mission=random`.
- Playwright-Node kann `import.meta.glob`/`node:fs` nicht → JSON-Import
  mit `with { type: "json" }` + `validateMapPack`.
