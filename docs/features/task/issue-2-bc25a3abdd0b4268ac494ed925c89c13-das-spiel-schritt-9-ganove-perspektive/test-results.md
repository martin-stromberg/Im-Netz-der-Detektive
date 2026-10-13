# Test-Ergebnisse

## Ergebnis

**Status:** Keine Fehler

## E2E-Abdeckung

Playwright (`@playwright/test` 1.64, Chromium — Browser-Download
erfolgreich), Dev-Server via `webServer`, deterministische Partien via
`?map=`/`?seed=`/`?mission=`-URL-Parametern; Store-Introspektion nur
lesend über `window.__gameStore` (DEV-only). Alle Aktionen über echte
DOM-Interaktion (Klicks auf SVG-Knoten / Buttons, Tastatur).

| Szenario | Test | Ergebnis |
|----------|------|----------|
| Setup: Detektive zuerst platziert, Ganove wählt nur aus legalen Optionen; Tastatur (Focus+Enter) wählt Spawn; Spielansicht zeigt Runde/Phase/Hitze/Funk/legalen Zug | `e2e/ganove.spec.ts` › „setup: detectives placed first…" | Bestanden |
| Zug → automatische KI-Detektivphase (Positionen ändern sich, Runde +1, Phase zurück zu „ganove"); keine Kamera-/Hinweis-Elemente im DOM | „a move triggers the automatic AI detective phase" | Bestanden |
| Komplette Partie mit Mission bis Endzustand: Seed 19 (Münster, `mission=random`) — Diebstahl-/Kontakt-/Sabotage-Aktionen und die endgültige Binärwahl per DOM ausgelöst, Ergebnis `escaped` in Runde 21 (Ganove-Sieg), 22 Zugschritte | „complete game with mission runs to escape (ganove win)" | Bestanden |
| Verlierer-Pfad bis reguläres Ende (Seed 4 → `caught`) | „a lost game shows a non-escape outcome" | Bestanden |
| Polizeifunk einmalig (Button danach deaktiviert) + Abbruch-als-Remis mit Bestätigung → `draw` | „police radio works once; abort ends as draw" | Bestanden |

Komplementäre Benutzerfluss-Nachweise auf jsdom-Ebene
(`GanoveScreen.test.tsx`): Spawn-Auswahl, Zug + Auto-Detektivphase,
Flucht-Ende, Missionsaktion am Ziel, Sabotage-Binärwahl beide Richtungen
(endgültig), Funk einmalig inkl. Hinweisliste, Remis-Abbruch
(Bestätigen/Abbrechen), Asymmetrie-Assertion auf gerendertem DOM bei
ausgelöster Kamera (kein `[data-camera]`/Hinweis-Texte).

## Zusammenfassung

- Gesamt: 419 Vitest-Tests (32 Dateien) + 5 Playwright-E2E
- Bestanden: 419 + 5
- Fehlgeschlagen: 0
- Übersprungen: 0

Weitere Läufe: `npm run build` (tsc + vite build → `dist/`) Exit 0,
`npm run lint` Exit 0.

## Testabdeckung

**Abdeckung:** 93,6 % Zeilen (Schwelle ≥ 70 % erfüllt; Statements
93,99 %, Branches 85,25 %, Functions 99,14 %)

| Datei | Abdeckung |
|-------|-----------|
| `src/components/GanoveScreen.tsx` | 79,6 % Lines |
| `src/components/MapGraph.tsx` | 93,6 % Lines |
| `src/components/HeatBadge.tsx` | 100 % |
| `src/components/MissionPanel.tsx` | 100 % |
| `src/state/detectiveDriver.ts` | 100 % |
| `src/logic/Recorder.ts` | 86,2 % Lines |
| `src/logic/mapPack.ts` | 79,1 % Lines |

## Fehlende Tests

Keine — alle Quelldateien haben korrespondierende Tests; der
Benutzerfluss ist E2E- und komponentenseitig abgedeckt.
