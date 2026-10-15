# Abnahmeprüfung – Entwicklungsschritt 4

## Ergebnis

**Status:** Anforderung vollständig erfüllt

## Abweichungen

Keine.

## Hinweise

- `boardPieces.tsx` mit `DetectivePiece` (aufrechte Silhouette, Kopf,
  Revers, Index-Ziffer) + `GanovePiece` (Mantel-A-Linie, Fedora mit
  Krempe/Band, Schattengesicht) — beide mit radialGradient-Körper,
  `pieceShadow`, `pieceBase`-Sockel. Unterscheidung über Form + Farbe +
  Beschriftung.
- `data-detective`/`data-active-detective`/`data-ganove`, `aria-label`,
  `translate(x, y−16)`-Ankerung und `markerMove`-Transition (480 ms,
  reduced-motion-fest) unverändert; aktiver Detektiv erhält Fahne +
  Sockelring (formbasiert).
- Legenden: beide Screens rendern die echten Figuren skaliert; kein
  Info-Leak (`ganovePosition` nur Ganove-Perspektive; Legenden-Test
  sichert Asymmetrie).
- Alte Marker-Klassen vollständig entfernt; Testnachweise: 614 Vitest +
  35 E2E (dokumentiert, plausibilisiert); neuer design-E2E prüft
  Computed Styles, Transition und Reduced-Motion.
- Ankerung nutzt `node.y − NODE_RADIUS − 8` statt Literals —
  semantisch identisch, robuster.
