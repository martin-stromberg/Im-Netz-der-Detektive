# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| Keine hartkodierten sichtbaren Strings in Komponenten (automatisierter Check läuft) | `no-hardcoded-strings-check.py` (Schritt 6), `resolveText` für Datenliterale (Schritte 5, 8), neue Katalogschlüssel (Schritt 9) | Check läuft in `pre-commit`/`pre-push` + `check:strings`; bestehende Befunde werden behoben | Abgedeckt |
| DE/EN vollständig + paritär | Neue Keys in beiden Katalogen; Parität bleibt durch `i18n-check.py` gesichert | i18n-Hook + `src/i18n`-Tests | Abgedeckt |
| Sprachwechsel wirkt zur Laufzeit auf allen Bildschirmen | `useUiPrefs` + `App`-Subscription + `t()`-Katalogwahl + `AppSettingsScreen` | Komponententest + E2E-Szenario Sprachwechsel | Abgedeckt |
| Status-/Typunterscheidungen Farbe + Form/Label/Muster | Bestand bereits formkodiert (Bestandsaufnahme); Ergänzung `aria-live`, Kontrastfix | `MapGraph`/`HeatBadge`-Tests + E2E | Abgedeckt |
| Farbenblind-Trägheit dokumentiert geprüft | Paletten-/Kontrast-Kommentar in `GanoveScreen.module.css` mit gemessenen Werten | Dokumentationspflicht im Plan (Schritt 7) | Abgedeckt |
| Kernflows komplett per Tastatur | Pfeiltasten-Wanderung `MapGraph` + native Controls überall | E2E Tastatur-Kernflow | Abgedeckt |
| Kontraste erfüllt (WCAG AA angenähert, dokumentiert) | Kontrastmessung (inventarisiert), `status_erledigt`-Fix, Doku | Review-Nachweis + Komponententests | Abgedeckt |
| Hitze-Stufenanstieg löst Sound aus | `installGameAudio` → `playHeatRise` gestuft | `gameAudio`/`AudioEngine`-Tests | Abgedeckt |
| Ambient dezent | `setAmbient` im Ganoven-Screen, sehr leise Synthese | `AudioEngine`-Tests | Abgedeckt |
| Stummschaltung funktioniert | `audioMuted` in `uiPrefs` → Master-Gain | `AudioEngine`-Tests + E2E Persistenz | Abgedeckt |
| Coverage ≥ 70 % | neue Tests für alle Module | `npm run coverage` | Abgedeckt |
| Kein `Math.random` in `src/logic` | Audio in `src/audio/`, `createRng` für Ambient | `no-math-random-check.py` unverändert grün | Abgedeckt |
| WebAudio/jsdom crasht nicht | `supported=false`-Gating + injizierbare Fabrik | `AudioEngine`-Tests | Abgedeckt |
| Missions-Storys via i18n-Referenzschlüssel/Fallback | `nameKey`/`storyKey` + `resolveText`-Fallback | `MissionSelect`-Test | Abgedeckt |
| Autoplay-Policy (Init beim ersten User-Gesture) | `installAudioUnlock` One-Shot-Listener | `AudioEngine`-Test | Abgedeckt |

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| Sprachwechsel DE→EN→DE wirkt auf allen Bildschirmen | `i18n-a11y.spec.ts`: menu.settings → EN → Menü-/Spieltexte englisch → zurück DE | Abgedeckt |
| Kernflow per Tastatur (Menü→Partie→Aktion→Ende) | `i18n-a11y.spec.ts`: reine Tastaturnavigation inkl. Pfeiltasten auf der Karte | Abgedeckt |
| Audio-/Sprach-Persistenz über Reload | `i18n-a11y.spec.ts`: localStorage-/UI-Assert nach Reload | Abgedeckt |
| Hartkodierungs-Check läuft | Hook-Durchlauf (lokal) + `check:strings` — nicht e2e-pflichtig, in `test-results.md` dokumentiert | Abgedeckt |

## Hinweise

- Die E2E-Nachweise für Heat-Sound-Auslösung selbst erfolgen auf Unit-Ebene (Fake-`AudioContext`) — akustische Ausgabe ist im Headless-Browser nicht sinnvoll assertierbar; der Trigger-Pfad (`installGameAudio` → `playHeatRise`) ist durch `gameAudio`-Tests abgesichert.
