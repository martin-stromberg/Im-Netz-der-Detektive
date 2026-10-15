# Abnahmeprüfung – Entwicklungsschritt 3

## Ergebnis

**Status:** Anforderung vollständig erfüllt

## Abweichungen

Keine.

## Hinweise

- Token-Anatomie im SVG: `tokenShadow`-Ellipse + `tokenRim` (r=8,
  Papier-gealtert mit Tinten-Fassung) + `tokenFace` (r=6,2 mit
  radialGradient-Prägung aus defs) + `tokenInner` (Gravurlinie) —
  ersetzt `nodeDot` vollständig; sichtbare Geometrie bleibt < r=14.
- `data-*`-Vertrag komplett erhalten (node-id, legal-target,
  selectable, markable, zone, possible, category, camera(-active),
  marker, escape-node, mission-target, detective, ganove, edge etc.);
  Hit-Area r=14 unverändert, allein pointer-sensitiv.
- Zustände über Form + Farbe: perforierter grüner Rand für
  legal/selectable/markable, solider Amber-Ring bei
  currentTarget/:focus-visible; nie Farbe allein.
- Legenden-Swatches in Ganove- UND Detektiv-Screen als identische
  Mini-Plakette (gleiche CSS-Klassen via shared-Import).
- Keyboard-Roaming, ARIA, Overlay-Positionen unverändert; keine
  Info-Leaks; Asymmetrie-Test besteht.
- Testnachweise: 606 Vitest + 34 E2E grün (dokumentiert); neuer
  Token-E2E inkl. :focus-visible-Assertion.
