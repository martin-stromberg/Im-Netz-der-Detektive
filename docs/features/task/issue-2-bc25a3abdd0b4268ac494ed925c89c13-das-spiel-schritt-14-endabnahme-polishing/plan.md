# Umsetzungsplan — Schritt 14: Endabnahme & Polishing

## Kontext

Letzter Entwicklungsschritt. Vier Arbeitsstränge: E2E/CI, Balancing-
Kalibrierung, Polishing/Bug-Sweep, Rasterillustrationen.

## Arbeitspakete

### AP1 — CI-Einbindung der E2E-Suite

1. `.github/workflows/pr-staging-ci.yml`: neuer Job `e2e` (best-effort):
   - `needs: detect-backmerge`, `if: is_backmerge != 'true'`
   - `continue-on-error: true` auf Job- oder Step-Ebene (best-effort laut
     CI-Template Abschnitt 4)
   - Steps: checkout, setup-node (24, npm cache), `npm ci`,
     `npx playwright install --with-deps chromium`, `npm run test:e2e`,
     Upload `test-results/` (Playwright-Traces liegen dort bei
     `retain-on-failure`) via `actions/upload-artifact@v7` mit
     `if: always()`, `retention-days: 14`.
2. `.github/workflows/staging-ci.yml`: derselbe Job (Artefaktname
   `playwright-traces-staging` bzw. `e2e-results-*`).

### AP2 — Balancing-Kalibrierung

1. Baseline dokumentiert (100 Seeds, Münster-Standard): escaped 0 %.
2. Analyse in `GanoveAI.ts`: Aktions-Timing zu defensiv — Aktionen
   erfordern `dangerAt >= SAFE_ACTION_GAP` UND Heat < kritisch; Zug-Scoring
   bevorzugt Detektiv-Distanz über Missionsfortschritt; `MOVE_SAFE_GAP = 3`
   filtert komfortable Züge und lässt den Ganoven kreisen statt voranzukommen.
3. Iterative Kalibrierung (jede Stufe mit 100-Seed-Lauf messen):
   - Stufe A (Heuristik): `SAFE_ACTION_GAP` 2→1 oder bedingungsabhängig;
     `MOVE_SAFE_GAP` 3→2; `EVADE_DISTANCE` 2→1; Deadline-Logik prüfen
     (Aktion auch bei Heat kritisch zulassen, wenn Restarbeit knapp);
     ggf. Scoring-Gewichte: auf `finalLeg` bereits früher committen bzw.
     Missionsfortschritt stärker gewichten, solange kein Detektiv
     angrenzt. Radio-Threshold ggf. anpassen.
   - Stufe B (Karten-Settings, nur falls A nicht reicht): `cameraCount`
     8→6, `roundLimit` 30→{ggf. höher}, `eventMix` hinweis-Anteil senken —
     innerhalb der Schema-Min/Max-Werte (`map-schema-check.py`).
   - Ziel: escaped 40–50 %, Sabotage-Annahmequote ~50 %.
4. Sabotage-Annahmequote: `chooseSabotagePath` akzeptiert bei Detour ≤
   `sabotageDetour` (4) und Heat ≠ kritisch. Prüfen, ob die Binärwahl
   überhaupt erreicht wird (zuvor 1×/40); ggf. `sabotageDetour` erhöhen
   oder Heat-Klausel lockern, damit die Quote entscheidungsgetrieben
   statt geometriegetrieben ~50 % liegt.
5. Sim-Bericht: `docs/help/spiel-engine/balancing-bericht.md` (neu) mit
   Vorher/Nachher-Verteilung, geänderten Parametern, Methodik, Seeds.
6. `GanoveAI.test.ts` ggf. an geänderte Konstanten/Verhalten anpassen;
   neue Unit-Tests für geänderte Heuristik-Entscheidungen.

### AP3 — Polishing / Bug-Sweep

1. Visuelle Durchgängigkeit: CSS-Module der Screens prüfen
   (`Menu.module.css`, `GanoveScreen`, `DetektivScreen`, `MapGraph`,
   `MissionPanel`, `HeatBadge`) — einheitliche Panel-/Übergangsstile,
   Fokus-Ringe, konsistente Farbpalette (Noir: amber/blue/graphite).
2. Bug-Sweep: bekannte spielblockierende Fehler suchen (Konsole,
   Edge-Cases: Mission ohne Sabotage-Pool, unbegrenztes Rundelimit,
   Resume bei laufendem Spiel, Replay-Ende).
3. i18n-Parität de/en (`check:strings`, `i18n-check.py`).
4. Reproduzierbarer Build sicherstellen (`npm run build` sauber).

### AP4 — Rasterillustrationen

1. Einheitlicher Stil-Präfix für alle Prompts (Noir, flat illustration,
   amber/blue graphite palette — konsistent mit Bestand).
2. Zu generierende Assets (Pollinations.ai, keyfrei, seeds fixiert):
   - Titelbild: vorhanden (`title-noir.jpg`) — ggf. Nachschärfung nicht nötig.
   - Hintergrund-/Textur: `bg-noir.jpg` (Atmosphären-Hintergrund Menü/Screens).
   - Fall-Artworks für vordefinierte Fälle in `src/data/missions/muenster.json`
     (je Fall 1 Artwork, z. B. `case-<id>.jpg`), eingebunden in
     MissionSelect/MainMenu-Kontext sofern UI-Platz vorhanden — sonst
     dokumentiert als vorhandene Bibliothek.
   - Kartenkarten Münster/Lübeck: vorhanden.
3. Jedes Asset: Download, Format-/Sichtprüfung (JPEG valide, Inhalt
   stimmig), lokal unter `src/assets/`, Einbindung per `import`.
4. `ASSETS.md` erweitern: Lizenzprüfung (Pollinations Terms — freie
   Nutzung generierter Bilder), Sichtprüfungsvermerk, Prompts + Seeds.
5. Fallback bei Nichterreichbarkeit: dokumentieren + SVG-Platzhalter.

### AP5 — E2E-Lücken schließen

Vorhandene Abdeckung gegen Anforderungsliste prüfen; fehlende Flows
ergänzen (z. B. Asymmetrie-Assertions teils vorhanden, Sprachwechsel
vorhanden, Sabotagefluss ggf. nicht explizit — Prüfung in
`ganove.spec.ts`; Settings/Statistiken weitgehend vorhanden). Nur echte
Lücken schließen — Suite lokal grün halten.

## Teststrategie

- Unit: `npm run test` + `npm run coverage` (≥70 % lines).
- E2E: `npm run test:e2e` (29+ Specs) — grüner Lokalbefund Pflicht.
- Sim: `npm run sim -- --map muenster --games 100` vor/nach Kalibrierung;
  zusätzlich Lübeck-Stichprobe.
- Lint/Format/Typecheck/`check:strings` sauber.

## Offene Punkte

Keine.
