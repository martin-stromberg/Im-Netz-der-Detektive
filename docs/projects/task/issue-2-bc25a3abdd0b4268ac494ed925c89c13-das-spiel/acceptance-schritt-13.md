# Abnahmeprüfung – Entwicklungsschritt 13

## Ergebnis

**Status:** Abweichungen gefunden

## Abweichungen

- [ ] **`npm run typecheck` und `npm run build` schlagen fehl** —
  `src/i18n/i18n.test.ts:34` verwendet `TranslationKey` im Cast
  `t(unknownKey as TranslationKey)`, ohne den Typ zu importieren
  (`import { getLanguage, hasTranslation, resolveText, t } from
  "./index"` in Zeile 5 enthält kein `type TranslationKey`). Folge:
  `tsc --noEmit` meldet `error TS2304: Cannot find name
  'TranslationKey'`; `npm run build` (= `tsc --noEmit && vite build`)
  bricht am selben Fehler ab. Vitest läuft durch (transpile-only),
  daher fällt es in `npm test` nicht auf. Behebung: fehlenden
  Typ-Import ergänzen.

## Hinweise

Geprüft am 2026-10-14 auf Branch
`task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-13-i18n-a11y-audio`
(Commit `3a21583`), Diff-Basis
`task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel` (46 Dateien,
+2204/−26). Keine Codeänderungen durch den Prüfer; der injizierte
Test-Verstoß (`src/ViolationProbe.tsx`) wurde nach der Prüfung wieder
entfernt, Working Tree ist sauber.

**Selbst ausgeführte Gates:**

- `npm test`: 50 Dateien / 579 Tests grün.
- `npm run coverage`: Lines 91,29 % (≥ 70 % erfüllt).
- `npm run lint`: sauber; `npm run format:check`: sauber.
- `npm run typecheck`: **rot** (siehe Abweichung).
- `npm run build`: **rot** (gleiche Ursache — `tsc` stoppt vor
  `vite build`).
- `npm run test:e2e`: 29/29 grün (inkl. der 3 neuen
  `e2e/i18n-a11y.spec.ts`-Tests).
- `npm run check:strings`: grün auf 17 `.tsx`-Dateien; injizierter
  Verstoß (JSX-Textkind + `aria-label`-Literal) wurde korrekt als
  Fehler gemeldet (Exit 1) — Check funktioniert.
- `.githooks/i18n-check.py --all --strict`: grün (185 verwendete
  Schlüssel, Parität der Kataloge).

**Zu den Akzeptanzkriterien:**

1. **i18n:** `no-hardcoded-strings-check.py` existiert, ist in
   `pre-commit`/`pre-push` verdrahtet und als `npm run check:strings`
   aufrufbar; Funktion per Test-Injektion verifiziert. `de.json`/
   `en.json` je 257 Schlüssel, vollständig paritär, keine Leerwerte.
   Sprachwechsel zur Laufzeit belegt: `App.tsx` abonniert
   `useUiPrefs.language` (Re-Render des gesamten Screen-Baums),
   `document.documentElement.lang` folgt; E2E
   `i18n-a11y.spec.ts:28` belegt Wechsel DE→EN→DE inkl. Persistenz über
   Reload und Wirkung auf Menü-, Karten- und Missionsauswahl.
2. **Farbe nie alleinige Information:** belegt — Hitze-Badge mit
   Balken-Icon + Klartext + `role="status"` (`HeatBadge.tsx`),
   gesperrte Kanten gestrichelt + X-Glyph (`MapGraph.tsx:229-238`),
   Missions-/Kategorie-Badges als vier verschiedene Formen mit
   `<title>`-Label (`missionBadgePath`), Kameras inaktiv mit
   Durchstreichung, Deduktions-Overlay als Diamant-Ring (Form ≠
   gestrichelter Ziel-Kreis), Hinweistypen als Klartext über
   `chronicle.ts`. Farbenblind-Trägheit und gemessene WCAG-AA-Kontraste
   sind dokumentiert (Header-Kommentar `GanoveScreen.module.css`,
   `docs/help/spieloberflaeche/beschreibung.md`).
3. **Tastatur:** kompletter Ganove-Kernfluss keyboard-only als E2E
   belegt (`i18n-a11y.spec.ts:82`: Menü→Karte→Modus→Mission→Spawn per
   Pfeiltasten→Zug→Abbruch); Pfeiltasten-Roaming in `MapGraph.tsx`
   (`nextInteractiveNode`); Detektiv-Zug per Tab+Enter E2E-belegt
   (`detektiv.spec.ts:236`). Bedienelemente sind durchgängig native
   `button`/`input`. Einschränkung: ein durchgehender
   Tastatur-Durchlauf der Detektiv-Perspektive ist nicht als eigener
   E2E-Test belegt — strukturell jedoch über dieselbe `MapGraph`-/
   Button-Infrastruktur gegeben.
4. **Audio:** `AudioEngine.ts` (prozedural, kein externes File) +
   `gameAudio.ts` (Store-Bindung): Hitze-Stufenanstieg → gestuftes
   Signal (nur Anstiege, Unit-Test `gameAudio.test.ts:49`); Ambient
   `AMBIENT_GAIN 0.035` dezent, nur Ganove-Perspektive
   (`GanoveScreen.tsx:275`); Lautstärke/Stummschaltung über
   `AppSettingsScreen` persistiert in `indd.ui-prefs` (E2E
   `i18n-a11y.spec.ts:66`); Autoplay-konform via
   `installAudioUnlock` (erste Gesture, `App.tsx:60`); jsdom-sicher
   (`supported`-Gate, injizierbare `contextFactory`, Tests laufen
   unter jsdom).
5. **Referenzschlüssel:** `MissionCase.nameKey`/`storyKey`
   (`MissionSystem.ts:65-72`, validiert :353-357),
   `MapPack.taglineKey` (`mapPack.ts:104-109`, validiert :440-442),
   Auflösung via `resolveText` in `MissionSelect`/`MapSelect`;
   Münster-Fälle und beide Karten tragen die Keys, Katalogtexte
   existieren DE+EN.
6. **Scope:** Diff beschränkt sich auf i18n/A11y/Audio, Daten-Keys,
   Hooks und Doku; die kleinen Engine-Erweiterungen
   (`MissionSystem`/`mapPack`-Validierung der Key-Felder) sind
   dem Lokalisierungsauftrag zuordenbar. Kein Scope-Creep.

**Einschränkung der Prüfung:** Abhören der Audio-Ausgabe nicht möglich —
Verdrahtung über Unit-Tests (Fake-Context, 14 Audio-Tests) und
Codereview belegt.
