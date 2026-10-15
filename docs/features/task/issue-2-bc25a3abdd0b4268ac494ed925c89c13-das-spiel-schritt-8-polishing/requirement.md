# Übersetzte Anforderung: Schritt 8 — Konsistenz-Endabnahme und Polishing

## Fachliche Zusammenfassung

Vollständiger Abnahme-Durchgang des fertigen Brettspiel-Designs (Projekt
„Finales Brettspiel-Design", Schritte 1–7 sind auf dem Basisbranch
gemergt) über alle Screens und Verträge. Es handelt sich um einen
Audit- und Nachbesserungsschritt: gefundene Abweichungen von den
Vertragsregeln (`docs/projects/task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel/inventory/conventions.md`)
werden gezielt behoben, kein Re-Design.

## Betroffene Klassen und Komponenten

- CSS-Module: `src/theme.css`, `src/components/GanoveScreen.module.css`
  (Shared-Theme), `DetektivScreen.module.css`, `Menu.module.css`,
  `MapGraph.module.css`, `MissionPanel.module.css`,
  `HeatBadge.module.css`, `PursuitBadge.module.css`,
  `EventBanner.module.css`, `boardPieces.module.css`,
  `MapBackdrop.module.css`
- UI-Komponenten (prüfpflichtig, Änderung nur bei Befund):
  `MainMenu`, `MapSelect`, `ModeSelect`, `SettingsScreen`,
  `MissionSelect`, `GanoveScreen` (inkl. `MapLegend`), `DetektivScreen`
  (inkl. `DetectiveMapLegend`), `DevModeScreen`, `StatsScreen`,
  `ResumeScreen`, `ReplayScreen`, `AppSettingsScreen`, `MapGraph`,
  `MissionPanel`, `HeatBadge`, `PursuitBadge`, `EventBanner`,
  `boardPieces`, `MapBackdrop`, `landmarks`
- Vertragsartefakte: `src/assets/ASSETS.md`, `src/i18n/de.json` +
  `en.json`, `dist/` (Build-Output), `.githooks/*` (`--all`-Modus)
- Tests: bestehende Vitest-Suite (Coverage ≥ 70 %) und Playwright-E2E
  als Abnahme-Nachweis; neue Tests nur bei gefixten Abweichungen.

## Implementierungsansatz

Reihenfolge der Audit-Blöcke aus der Anforderung:

1. **Design-Konsistenz-Audit:** Kein Screen im alten „nackten" Stil
   (alle Screens konsumieren die Theme-Module); Legenden (`MapLegend`,
   `DetectiveMapLegend`) spiegeln exakt die finalen Token-/Figuren-/
   Routen-Formen; Badge-, Splash- und Outcome-Farbcodierungen sind
   form+farbe-kodiert.
2. **A11y-Audit:** Tab-Reihenfolge, `:focus-visible` auf allen Elementen
   der Schritte 1–7, ARIA unverändert, keine Information nur über Farbe,
   WCAG-AA-Kontrasttabelle in den Header-Kommentaren aktualisiert.
3. **Motion-Audit:** Jede neue/geänderte Animation und Transition unter
   `@media (prefers-reduced-motion: reduce)`.
4. **Vertrags-Audit:** `data-*`-Selektoren unverändert (Checkliste in
   `inventory/conventions.md`), keine leakfähigen `MapGraph`-Props, kein
   `Math.random()`, i18n-Parität de/en, alle Git-Hook-Checks im
   `--all`-Modus grün.
5. **Build-Audit:** `npm run build`, `dist` ohne externe Referenzen
   (CDN/Hotlink-Scan), Font als lokale WOFF2, Coverage-Threshold
   ≥ 70 % hält.
6. **`ASSETS.md` vollständig** (Font + evtl. neue Assets).

Gefundene Abweichungen werden in diesem Schritt behoben
(Nachbesserungen, kein Re-Design).

## Konfiguration

Keine.

## Akzeptanzkriterien (aus der Anforderung)

- Alle acht fachlichen Anforderungen (Materialität, Figuren, Tokens,
  Routen, Schmuckschrift, Karten-Panels, Komposition, Konsistenz) auf
  den spielrelevanten Screens sichtbar erfüllt.
- Vitest inkl. Coverage ≥ 70 % und Playwright-E2E komplett grün;
  Hook-Checks ohne Befund.
- Kein Info-Leak, Barrierefreiheit nicht schlechter, Reduced Motion
  wirksam, i18n-Parität, `dist` ohne externe Referenzen, `ASSETS.md`
  vollständig.

## Offene Fragen

Keine.
