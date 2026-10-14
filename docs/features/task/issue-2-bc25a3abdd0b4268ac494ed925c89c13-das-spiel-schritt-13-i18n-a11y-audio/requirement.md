# Übersetzte Anforderung: i18n final, Barrierefreiheit, Audio (Schritt 13)

## Fachliche Zusammenfassung

Das Spiel wird zur vollständig zweisprachigen (DE/EN), barrierefreien und auditiv dramatisierten Anwendung ausgebaut. Das bestehende i18n-Grundgerüst (`src/i18n/de.json`, `src/i18n/en.json`, `t()`) wird um einen laufzeitfähigen Sprachwechsel erweitert, sämtliche sichtbaren Texte werden über Übersetzungsschlüssel aufgelöst und ein automatisierter Check verhindert hartkodierte Strings in Komponenten. Alle Status-/Typ-Unterscheidungen der Oberfläche werden farbenblind-sicher über Farbe plus Form/Label/Muster kodiert, die Kernflows werden vollständig tastaturbedienbar und Kontraste werden dokumentiert auf WCAG AA angenähert. Zusätzlich entsteht eine prozedurale WebAudio-Dramaturgie: gestufte Signale beim Hitze-Stufenanstieg sowie ein dezenter „Polizeiaktivitäts"-Ambient-Kanal für den Ganoven — mit Lautstärke-/Stummschaltung in den Einstellungen und autoplay-konformer Initialisierung beim ersten User-Gesture.

## Betroffene Klassen und Komponenten

### Anzupassende Artefakte

- `src/i18n/index.ts` — `t()` erhält Sprach-Unterstützung (Store-Parameter oder Store-Leser); Export eines `Language`-Typs (`"de" | "en"`) und eines Sprachstores bzw. einer Store-Integration.
- `src/i18n/de.json`, `src/i18n/en.json` — Ergänzung fehlender Schlüssel (Sprachumschalter, Audio-Einstellungen, Tastaturhinweise, ggf. bislang hartkodierte Texte).
- `src/state/gameStore.ts` bzw. neuer UI-Store — persistierte UI-Einstellungen (Sprache, Lautstärke, Stummschaltung).
- `src/components/SettingsScreen.tsx` — Sprachumschaltung + Audio-Einstellungen (Lautstärke, Stummschaltung).
- `src/components/MainMenu.tsx`, `MapSelect.tsx`, `ModeSelect.tsx`, `MissionSelect.tsx`, `ResumeScreen.tsx`, `StatsScreen.tsx`, `DevModeScreen.tsx`, `ReplayScreen.tsx`, `GanoveScreen.tsx`, `DetektivScreen.tsx`, `MissionPanel.tsx`, `HeatBadge.tsx`, `MapGraph.tsx`, `App.tsx` — vollständige Schlüsselnutzung, Tastaturbedienung, ARIA-/Label-Ergänzungen, Farbe+Form-Kodierung.
- `src/components/*.module.css`, `src/App.module.css` — Kontrastanpassungen, Muster/Form-Kodierung (z. B. Schraffuren via SVG/CSS), Fokus-Indikatoren.
- `.githooks/` bzw. `scripts/` — neuer Check „kein hartkodierter sichtbarer String in Komponenten" inkl. Anbindung an `pre-commit`/`pre-push` und/oder CI.
- `e2e/` — neue Specs für Sprachwechsel und Tastaturfluss.
- `src/data/missions/` — Fall-Geschichten der Missionssets über i18n-Referenzschlüssel (oder dokumentierte Fallback-Strategie).

### Neue Artefakte

- `src/audio/` (oder `src/logic/audio/`) — prozedurale WebAudio-Synthese: `AudioEngine` o. ä. mit Autoplay-Gate (Init beim ersten User-Gesture), Hitze-Stufen-Signalen (4 Stufen), Ambient-Loop „Polizeiaktivität" für den Ganoven, Lautstärke-/Mute-Regelung.
- Test-Setup-Erweiterung: AudioContext-Mock/Gate für jsdom-Tests.
- Neuer String-Check-Skript (z. B. `.githooks/no-hardcoded-strings-check.py`).

### Tests

- Vitest-Komponententests: Sprachwechsel wirkt auf Bildschirmen, Audio-Gating, Einstellungspersistenz, Tastaturbedienung.
- Playwright-E2E: Sprachwechsel zur Laufzeit auf allen Bildschirmen; Kernflow per Tastatur (Menü → Partie → Aktionen → Ende).
- Check-Skript-Tests, falls sinnvoll.

## Implementierungsansatz

- **Sprachwechsel:** `t()` wird auf einen Sprachparameter bzw. einen zustandsgesteuerten Store (Zustand liegt nahe, da bereits verwendet) umgestellt, sodass ein Wechsel zur Laufzeit alle gerenderten Texte aktualisiert. Persistenz der Sprachwahl über die bestehende Settings-/Speicher-Infrastruktur.
- **Missions-Storys:** saubere Lösung wählen — Referenzschlüssel im Missionsset (z. B. `storyKey`/`titleKey`) mit Auflösung über `t()`, dokumentierter Fallback falls kein Schlüssel gesetzt ist.
- **String-Check:** eigenständiges Skript, das JSX-Textliterale/sichtbare Stringliterale in `src/components/` erkennt und als Fehler meldet (Whitelist für technische Strings); Anbindung an `.githooks/pre-commit` analog `i18n-check.py`.
- **A11y:** MapGraph-SVG mit fokussierbaren Knoten (Tab-Reihenfolge oder Pfeiltasten-Wanderung über legale Ziele — die sauberere Variante wählen, Pfeiltasten über legale Ziele wird in der Spezifikation nahegelegt), `role`/`aria-label`/`aria-pressed`/`aria-live` für Status, Form-/Musterkodierung zusätzlich zu Farbe, dokumentierte Farbpalette mit Kontrastnachweis im Docs-Kommentar.
- **Audio:** reine WebAudio-Synthese ohne Audiodateien; `AudioContext` lazy beim ersten User-Gesture; Hitze-Stufe → gestuftes Signal (4 unterschiedliche Signale); Ambient als sehr dezenter Loop nur in der Ganoven-Perspektive; Zufall nur im dokumentierten Audio-Scope oder über zentralen RNG.

## Konfiguration

- Sprache, Lautstärke und Stummschaltung als benutzerspezifische Einstellungen — im Einstellungs-Menü veränderbar, persistiert (localStorage über bestehende Persistenzmuster).

## Akzeptanzkriterien

- Keine hartkodierten sichtbaren Strings in Komponenten (automatisierter Check läuft).
- DE/EN vollständig und paritär; Sprachwechsel wirkt zur Laufzeit auf allen Bildschirmen.
- Alle status-/typunterscheidenden Elemente über Farbe + Form/Label/Muster; Farbenblind-Trägheit dokumentiert geprüft.
- Kernflows (Menü → Partie beider Perspektiven → Aktionen → Ende) komplett per Tastatur durchführbar; Kontraste ausreichend (WCAG AA angenähert, dokumentiert).
- Hitze-Stufenanstieg löst Sound aus; Ambient dezent; Stummschaltung funktioniert.
- Coverage ≥ 70 %; kein `Math.random` in `src/logic` (Audio dokumentiert ausgenommen oder zentraler RNG); Tests crashen nicht unter jsdom ohne AudioContext.

## Offene Fragen

- Keine — die Anforderung nennt jeweils Wahlmöglichkeiten (Referenzschlüssel vs. Fallback für Missionstexte; Tab vs. Pfeiltasten; `src/audio/` vs. `src/logic/`), die in der Planung als Designentscheidung getroffen und dokumentiert werden.
