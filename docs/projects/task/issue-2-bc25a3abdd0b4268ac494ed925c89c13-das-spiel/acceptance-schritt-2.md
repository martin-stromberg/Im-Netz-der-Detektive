# Abnahmeprüfung – Entwicklungsschritt 2

## Ergebnis

**Status:** Anforderung vollständig erfüllt

## Abweichungen

Keine.

## Hinweise

- `MapGraph.tsx` trägt `<defs>` mit feTurbulence-Grain +
  radialGradient-Vignette (useId-sanitisierte IDs, Replay-sicher);
  `boardFace`-Gruppe vor `<MapBackdrop>`, Layer-Reihenfolge intakt.
- `.map`: helles Pergament (`--color-paper`), 7-px-Pappenrand,
  mehrstufiger Box-Shadow — „Brett liegt auf dunklem Tisch".
- MapBackdrop-Palette auf Pergament-Geographie (gedeckte Sepia-/Tinten-
  Werte); Labels/Marker auf dunkle `--color-map-*`-Tinten umgestellt,
  WCAG-Kontraste dokumentiert.
- `data-*`-Vertrag, Hit-Areas, `viewBox`, `data-board-style`
  unverändert; kein neuer sichtbarer Text; Logik unberührt.
- Wirkt auf allen MapGraph-Einsätzen (Ganove, Detektiv, Replay×2,
  MissionSelect); Legenden-Swatches nachgezogen.
- Testnachweise: 600 Vitest + 33 E2E grün (dokumentiert), neuer
  Brett-E2E in design.spec.ts; vom Prüfer statisch verifiziert.
- Tote `styles.boardVignette`-Referenz vom Projektleiter entfernt.
