# Plan-Check — Schritt 14: Endabnahme & Polishing

**Status: Plan vollständig**

## Prüfung gegen Anforderung

| Anforderung | Im Plan abgedeckt |
|-------------|-------------------|
| E2E-Lücken schließen | AP5 — Bestandsabgleich der 29 Specs gegen Kernfluss-Liste |
| E2E in CI (best-effort, Trace-Upload, Browser-Install) | AP1 — eigener Job in beiden Workflows, `continue-on-error`, `playwright install --with-deps`, Artefakt-Upload `if: always()` |
| Balancing ~40–50 % Ganove-Siegquote | AP2 — iterative Stufen A (Heuristik) → B (Karten-Settings), 100-Seed-Messung je Stufe |
| Sabotage-Annahmequote ~50/50 | AP2.4 — `chooseSabotagePath`/`sabotageDetour` analysiert und kalibriert |
| Dokumentierter Sim-Bericht | AP2.5 — `docs/help/spiel-engine/balancing-bericht.md` mit Vorher/Nachher |
| Polishing (visuell, Interaktion, Bug-Sweep) | AP3 |
| Rasterillustrationen (Titel, Hintergründe, Kartenkarten, Fall-Artworks) | AP4 — Pollinations, Stil-Präfix, ASSETS.md, Fallback dokumentiert |
| Coverage ≥70 % | Teststrategie — bestehender Vitest-Threshold |
| Keine Regelverbiegung | AP2.3 — nur Heuristik-Parameter und Settings im Schema-Rahmen |

## Hinweise (nicht blockierend)

- Sabotage-Quote ist geometrieabhängig (Detour-Budget); falls strukturell
  nicht ~50 % erreichbar, ist eine begründete dokumentierte Abweichung im
  Bericht zulässig — das deckt die Anforderung explizit ab.
- E2E-Laufzeit lokal hoch; in CI als best-effort akzeptabel.
- Fall-Artworks: Einbindungspunkt in der UI muss bei Umsetzung verifiziert
  werden (MissionSelect zeigt Fallkarten) — sonst als Asset-Bibliothek
  dokumentiert.
