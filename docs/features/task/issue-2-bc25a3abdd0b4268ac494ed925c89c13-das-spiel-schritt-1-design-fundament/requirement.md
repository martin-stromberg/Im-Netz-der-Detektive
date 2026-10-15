# Übersetzte Anforderung — Schritt 1: Design-Fundament (Theme, Schmuckschrift, Farbvariablen)

Schritt 1 des Projekts „Finales Brettspiel-Design" (Projektartefakte unter
`docs/projects/task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel/`).
Basisbranch: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel`.

## Fachliche Zusammenfassung

Das React/Vite-Projekt erhält ein globales Design-Token-Fundament: Eine neue
Datei `src/theme.css` definiert auf `:root` CSS Custom Properties für die
vollständige bestehende Noir-Palette (unverändert aus
`src/components/GanoveScreen.module.css` übernommen) sowie neue
Brettspiel-Tokens (Papier-, Pappen-, Tisch-, Schatten-Töne). Zusätzlich wird
eine OFL-lizenzierte Schmuckschrift („IM Fell English", bevorzugt) als lokale
WOFF2-Datei unter `src/assets/fonts/` eingebettet und per `@font-face` auf
Titel/Überschriften angewendet. Die Shared-Theme-Datei
`GanoveScreen.module.css` und weitere Module werden auf `var()` umgestellt —
ohne Klassennamen, Struktur, `data-*`-Attribute oder Spiellogik zu ändern.

## Betroffene Klassen und Komponenten

- **Neu:** `src/theme.css` — globales Stylesheet mit `:root`-Custom-Properties
  und `@font-face`.
- **Neu:** `src/assets/fonts/` — WOFF2-Datei(en) der Schmuckschrift.
- **Geändert:** `src/main.tsx` — Import von `./theme.css` (aktuell existiert
  kein globaler CSS-Import).
- **Geändert:** `src/components/GanoveScreen.module.css` — Shared-Theme
  (Klassen `screen`, `title`, `panelHeading`, `panel`, Buttons, Legend etc.);
  Farbwerte → `var()`, Headings → Schmuckschrift mit Fallback.
- **Geändert (wo sinnvoll):** weitere CSS-Module mit derselben Palette:
  `Menu.module.css`, `DetektivScreen.module.css`, `MissionPanel.module.css`,
  `EventBanner.module.css`, `HeatBadge.module.css`, `PursuitBadge.module.css`,
  `MapBackdrop.module.css`, `MapGraph.module.css`, `App.module.css`.
- **Geändert:** `src/assets/ASSETS.md` — Eintrag Font-Name, Quelle, Lizenz
  (SIL OFL), Version.
- **Nicht geändert:** TSX-Struktur, Klassennamen, `data-*`-Attribute,
  i18n-Texte, Spiellogik, sichtbare Strings.

## Implementierungsansatz

- `theme.css` als globales (nicht-modulares) Stylesheet; in `main.tsx` via
  `import "./theme.css"` eingebunden (Vite verarbeitet das automatisch).
- `:root`-Custom-Properties spiegeln die Bestandspalette 1:1
  (`#0c0f16` screen-bg, `#161b26` panel-bg, `#10141c` inset-bg, `#2a3240`
  border, `#eaf0f8`/`#c8d0dc`/`#8a94a6` Text-Stufen, `#e8b45a`/`#f5d76e`
  amber, `#7fd4a8` grün, `#d98c8c` rot, `#3d5a80`/`#9db8d9` detektiv-blau
  sowie die übrigen in den Modulen verwendeten Farbwerte).
- Neue Brettspiel-Tokens: Papier-/Pappen-/Tisch-/Schatten-Töne für die
  Folgeschritte (Pergament-Brett auf dunklem Tisch — helles Papier-Token
  nur für die spätere Kartenfläche; Umgebung bleibt dunkel).
- WCAG-AA-Paarungen (≥ 4,5:1) als Kommentar in `theme.css` dokumentieren,
  analog zum bestehenden Kommentarblock in `GanoveScreen.module.css`.
- `@font-face` für „IM Fell English" (SIL OFL, Google Fonts — WOFF2 von
  fonts.gstatic.com, lokal abgelegt); `font-display: swap`; Serifen-/
  System-Fallback-Stack. Anwendung auf `.title`, `.panelHeading`,
  `.statHeading`, `.cardTitle`, `.heading` (MissionPanel) und vergleichbare
  Headings; Fließtext bleibt Systemschrift.
- `ASSETS.md` um Font-Eintrag ergänzen (Name, Quelle, Lizenz, Version).

## Konfiguration

Keine neuen Laufzeit-Abhängigkeiten; Font wird zur Build-Zeit über Vite
eingebunden (`url()`-Referenz in `theme.css` auf die lokale WOFF2-Datei).

## Akzeptanzkriterien (aus der Kundenanforderung)

1. `theme.css` wird in `main.tsx` importiert; Custom Properties auf `:root`
   und mindestens im Shared-Theme verwendet.
2. Schmuckschrift auf Titeln/Überschriften aller Screens sichtbar; WOFF2
   lokal im Repo; kein CDN-/Hotlink-Font-Request.
3. `src/assets/ASSETS.md` enthält Eintrag mit Font-Name, Quelle, Lizenz,
   Version.
4. Kein sichtbarer hartcodierter Text neu; keine Änderung an `data-*`,
   Layout-Struktur oder Spiellogik; Vitest-Suite und Hook-Checks (i18n,
   no-hardcoded-strings) grün.
5. Neue/angepasste Text-Fläche-Paarungen erreichen WCAG AA (≥ 4,5:1), als
   Kommentar dokumentiert.

## Offene Fragen

Keine — Schriftwahl („IM Fell English", Fallback „Playfair Display"),
Papier-Farbwelt und Bezugsquelle sind im Projekt-Kontext entschieden.
