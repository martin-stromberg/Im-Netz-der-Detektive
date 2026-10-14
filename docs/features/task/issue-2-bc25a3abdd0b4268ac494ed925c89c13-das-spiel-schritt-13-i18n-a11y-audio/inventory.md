# Bestandsaufnahme: i18n final, Barrierefreiheit, Audio (Schritt 13)

Analyse des bestehenden Spiels „Im Netz der Detektive" (React + TypeScript + Zustand + Vitest + Playwright) bezogen auf die Schritt-13-Anforderung: vollständige Zweisprachigkeit mit Laufzeit-Sprachwechsel, Barrierefreiheit (Farbe+Form, Tastatur, Kontraste) und prozedurale WebAudio-Dramaturgie.

## Zusammenfassung

- **i18n-Grundgerüst vorhanden:** `src/i18n/de.json` + `src/i18n/en.json` (240 paritätische Schlüssel) und `t(key, params)` in `src/i18n/index.ts`. **Der Sprachwechsel fehlt:** `t()` liefert ausschließlich DE; es gibt keinen Sprachparameter, keinen Sprachstore und keine Umschalt-UI.
- **Sichtbare Texte weitgehend über Schlüssel:** Alle Komponenten nutzen `t()`. **Ausnahmen (Daten-Literale, keine `t()`-Auflösung):** `entry.name`/`entry.story` der Missionsfälle in `MissionSelect.tsx`, `map.name`/`map.tagline` in `MapSelect.tsx`/`ResumeScreen.tsx` sowie die in `Mission`/`header.mission` aufgezeichneten `name`/`story`-Literale. Nicht-buchstabliche Glyphen (`×`, `✓`, `▶`, `○`, `—`) sind hartkodiert.
- **Kein Check gegen hartkodierte Strings:** `i18n-check.py` prüft nur Schlüsselparität und definierte `t()`-Keys — nicht, ob sichtbarer Text am Katalog vorbei gerendert wird.
- **A11y teilweise vorhanden:** Formkodierung ist weitgehend umgesetzt (Kantentypen durchgezogen/gestrichelt, Sperrkreuz-Glyph, Missionsformen, Kamera-Streichung, Hitze-Badge Icon+Text, Legenden, `role="button"` + `tabIndex` + Enter/Space auf interaktiven Knoten, `aria-label`s). **Fehlt:** Pfeiltasten-Wanderung über legale Ziele, `aria-live`-Regionen für Status/Notices, dokumentierte Farbpalette mit Kontrastnachweis. **Kontrastmessung:** alle Palette-Paare erfüllen WCAG AA (≥ 4,5:1) außer `MissionPanel .status_erledigt` (#5f6b7d auf #161b26 = 3,19:1).
- **Audio fehlt vollständig:** kein `src/audio/`, kein AudioContext-Einsatz, keine Lautstärke-/Stummschaltung.
- **Persistierte UI-Einstellungen fehlen:** `localStorage` wird bisher nur über `GameIndex`/`Recorder` (injizierbarer `StorageLike`-Boundary) für Spielstände/Logs genutzt; Sprache/Lautstärke haben keinen Ort.
- **Test-Ausgangszustand:** vollständig grün — 542 Unit-/Komponententests (45 Dateien), 26 Playwright-E2E-Tests, Zeilenabdeckung 90,85 % (Schwelle 70 %), Lint/Build fehlerfrei. Nachweis: `inventory/tests.md` + `inventory/test-results/`.

## Details

- [Datenmodelle & Datenpakete](inventory/models.md) — `MissionCase`, `MissionSet`, `MapPack`, `Mission`, `RecordedMission`
- [Logik & UI](inventory/logic.md) — `t()`, `useGameStore`/`getHeatLevel`, Komponenten mit i18n-/A11y-Bezug, `GameIndex`/`Recorder` Storage-Pattern
- [Enums & Wertmengen](inventory/enums.md) — `HeatLevel`, `MissionKind`, `MissionStage`, `GameOutcome`, `MenuScreen`, `EventMode`
- [Checks & Infrastruktur](inventory/interfaces.md) — `.githooks/*`, CI, Test-Setup, `StorageLike`
- [Tests](inventory/tests.md) — Test-Ausgangszustand, bestehende Testklassen, Hilfsmethoden
