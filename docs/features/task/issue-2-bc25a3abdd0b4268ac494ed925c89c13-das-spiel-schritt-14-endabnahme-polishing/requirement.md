# Übersetzte Anforderung — Schritt 14: Endabnahme & Polishing

## Ziel

End-to-end-Absicherung, Balancing-Kalibrierung und professionelles Polishing
inkl. fertiger Rasterillustrationen — letzter Entwicklungsschritt des Projekts
„Im Netz der Detektive".

## Funktionale Anforderungen

### E2E-Qualitätssicherung

- Kernflows abgedeckt: Menü → Auswahl → Startaufstellung → komplette Partien
  beider Perspektiven, Aktions-/Sabotagefluss, Save/Load, Replay, Statistiken,
  Sprachwechsel, Tastaturbedienung, Asymmetrie-Assertions.
- Bestehende Suite (29 Specs) ist größtenteils vorhanden — Lücken schließen.
- **CI-Einbindung:** E2E-Job in den Workflows (`staging-ci.yml`,
  `pr-staging-ci.yml`) — best-effort mit `continue-on-error`, Playwright-Browser
  im Runner installieren, Trace-/Artefakt-Upload (`if: always()`).

### Balancing-Kalibrierung

- Batch-Simulationen über 100+ Seeds, Metriken aus Eventlogs aggregieren:
  Outcome-Verteilung, Runden bis Fang/Flucht, Hinweise/Partie, Kameratreffer,
  Sabotage-Annahmequote.
- **Zielkorridor:** Ganove-Siegquote ~40–50 %, Sabotage-Annahmequote ~50/50.
- Reihenfolge der Justierung: zuerst KI-Heuristik-Parameter
  (`SAFE_ACTION_GAP`, `MOVE_SAFE_GAP`, `EVADE_DISTANCE`, `RADIO_HEAT_THRESHOLD`)
  und Bewertungsgewichte; erst danach Karten-Settings
  (`cameraCount` 8→6, `roundLimit`, `eventMix`) innerhalb der vorgesehenen
  Bereiche. Regeln nicht verbiegen.
- Befund aus Schritt-8-Abnahme: KI-vs.-KI auf Münster-Standard → Ganove-KI
  ~0 % Siegquote, Binärwahl nur 1× in 40 Partien erreicht. Baseline-Messung
  dieses Laufs (100 Seeds): escaped 0 %, caught 84 %, surrounded 10 %,
  timeout 6 %.
- Dokumentierter Simulations-Bericht mit Vorher/Nachher-Verteilung als
  Arbeitsartefakt (`docs/help/` oder Projekt-Doc) — oder begründete
  dokumentierte Abweichung.

### Polishing

- Konsistente visuelle Durchgängigkeit (einheitlicher Stil SVG/Panels/Übergänge).
- Interaktions-Feinschliff, Bug-Sweep.
- Minimalmaß „professionell": keine bekannten spielblockierenden Fehler,
  konsistente vollständig lokalisierte UI, reproduzierbare Builds.

### Rasterillustrationen

- Fehlende Assets fertigstellen: Titelbild, Texturen/Hintergründe,
  Stadtbild-/Atmosphäre-Karten für Karten-Auswahl, Fall-Artworks für Fälle —
  via Pollinations.ai (keyfrei).
- Stil-Konsistenz über einheitlichen Stil-Präfix (Prompt-Disziplin).
- Jedes Asset gesichtet, lizenzgeprüft, lokal eingebettet — keine Hotlinks.
- `ASSETS.md` erweitern.
- Fallback bei Nichterreichbarkeit von Pollinations: dokumentieren,
  SVG-Fallback, Hinweis auf HF-Token-Option.

## Akzeptanzkriterien

1. E2E-Suite lokal grün UND in CI verdrahtet (Trace-Upload bei Fehlern).
2. Dokumentierter Simulations-Bericht: Ganove-Siegquote ~40–50 %,
   Sabotage-Annahmequote nahe 50/50 — oder begründete dokumentierte Abweichung.
3. Keine bekannten spielblockierenden Fehler; reproduzierbare Builds.
4. Alle geplanten Rasterillustrationen generiert/gesichtet/lizenzgeprüft/lokal
   — keine Hotlinks.

## Rahmenbedingungen

- Coverage ≥ 70 % (Vitest-Threshold, `vite.config.ts`).
- Kein Merge/Push/PR. `.agents/` nicht committen. `docs/konzept/` unangetastet.
- Bei Abbruch: Grund in `docs/features/{branchname}/continue.md` dokumentieren.

## Betroffene Bereiche

E2E-Qualitätssicherung, Balancing, Polishing/Release.
