# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| `theme.css` in `main.tsx` importiert; Custom Properties auf `:root`, mindestens im Shared-Theme verwendet | Schritte 2–4 (`theme.css` mit `:root`-Block, Import, `var()`-Umstellung `GanoveScreen.module.css`) | E2E „theme tokens are defined" liest `getComputedStyle(documentElement)` | Abgedeckt |
| Schmuckschrift auf Titeln/Überschriften aller Screens; WOFF2 lokal; kein CDN-Request | Schritt 1 (WOFF2 lokal unter `src/assets/fonts/`), Schritt 2 (`@font-face`), Schritte 4–5 (`--font-display` auf `.title`, `.panelHeading`, `.heading`, `.statHeading`, `.cardTitle`, `.markerHeading` — alle Heading-Klassen aller Screens laut Bestandsaufnahme) | E2E „headings use the display font" + „no external font requests" | Abgedeckt |
| `ASSETS.md` mit Font-Name, Quelle, Lizenz, Version | Schritt 6 | Indirekt: Review + pre-commit-Hook (Prettier) | Abgedeckt |
| Kein neuer hartcodierter Text; keine `data-*`-/Struktur-/Logik-Änderung; Vitest + Hooks grün | Plan schließt TSX-Struktur-/Logik-Änderungen explizit aus; Schritt 8 = Verifikation `npm test`, `lint`, `typecheck`, `format:check`, Hooks | Gesamtsuite + Hook-Checks | Abgedeckt |
| Neue/angepasste Text-Fläche-Paarungen ≥ WCAG AA 4,5:1, als Kommentar dokumentiert | Schritt 2 (WCAG-Kommentar in `theme.css`, Bestandswerte + neu berechnete Papier-Paarungen) | Review-Artefakt + Kommentar | Abgedeckt |

## Fehlende oder unvollständige Testanforderungen

— (Status „Plan vollständig")

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| Schmuckschrift auf Titeln/Überschriften sichtbar | `e2e/design.spec.ts` — computed `font-family` von `h1` im Hauptmenü und Ganove-Screen | Abgedeckt |
| Kein CDN-/Hotlink-Font-Request | `e2e/design.spec.ts` — Request-Interception auf fonts.googleapis.com/gstatic.com | Abgedeckt |
| `:root`-Custom-Properties wirksam | `e2e/design.spec.ts` — Token-Auslesen via `getComputedStyle` | Abgedeckt |
| Bestehende Benutzerflüsse (Menü, Setup, Partie, Replay) | Bestehende Specs `e2e/menu.spec.ts`, `ganove.spec.ts`, `detektiv.spec.ts`, `persistenz.spec.ts`, `i18n-a11y.spec.ts` bleiben unverändert gültig (keine Struktur-/String-Änderung) | Abgedeckt |

## Fehlende oder unvollständige Planbestandteile

— (Status „Plan vollständig")

## Hinweise

- Stichproben-Nachweis „aller Screens": Da alle Screens dieselben
  Shared-Heading-Klassen (`shared.title`, `shared.panelHeading`,
  `styles.heading` im Missions-Panel) verwenden, genügt die E2E-Prüfung an
  Hauptmenü + Spielscreen; die CSS-Regel gilt global für alle Klassen.
- Playwright-Browser sind lokal installiert (Chromium vorhanden) — E2E ist
  ausführbar.
