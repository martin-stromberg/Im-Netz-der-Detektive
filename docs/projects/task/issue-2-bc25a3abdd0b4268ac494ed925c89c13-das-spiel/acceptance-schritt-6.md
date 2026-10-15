# Abnahmeprüfung – Entwicklungsschritt 6

## Ergebnis

**Status:** Anforderung vollständig erfüllt

## Abweichungen

Keine.

## Hinweise

- Edelkarten-Tokens neu in `theme.css` (card-face/card-line/
  shadow-card/radius-card/card-face/card-rim); Paarungen ≥ 5,6:1
  dokumentiert.
- Panels, Karten, Buttons (embossed), confirm/notice/splash,
  statBox/summaryTable/perspectiveToggle, Inputs als Inset-Slots,
  MissionPanel/HeatBadge/PursuitBadge/EventBanner/Menu/DetektivScreen
  angefasst — einheitliche Kartenanatomie (Rand + Inset-Linie +
  Tischschatten), Headings in Schmuckschrift.
- Badges bleiben role=status-Pills mit Level-Form/Farbe; `data-*`-
  Vertrag unverändert; nur CSS-Änderungen; keine neuen Strings.
- Preexisting-Fix `className.baseVal` → `getAttribute("class")` auf
  diesem Branch vom Projektleiter ergänzt (zählt nicht als Abweichung).
- Testnachweise: 617 Vitest + 37 E2E (dokumentiert, plausibilisiert);
  neuer Edelkarten-E2E prüft Rim/Radius/Schatten/Pill/Font.
