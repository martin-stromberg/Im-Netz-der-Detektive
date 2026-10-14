# Umsetzungsplan: i18n final, Barrierefreiheit, Audio (Schritt 13)

## Übersicht

Das Spiel wird vollständig zweisprachig (DE/EN mit Laufzeit-Wechsel), barrierefrei (Farbe+Form überall, Pfeiltasten-Navigation auf der Karte, dokumentierte AA-Kontraste, `aria-live`-Statusregionen) und erhält eine prozedurale WebAudio-Dramaturgie für den Ganoven (gestufte Hitze-Signale + dezenter Polizei-Ambient) mit persistierter Lautstärke-/Stummschaltung. Zusätzlich wird ein automatisierter Check gegen hartkodierte sichtbare Strings in Komponenten in `.githooks/` verankert.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| Sprachwechsel | Neuer Zustand-Store `src/state/uiPrefs.ts` (language/audioVolume/audioMuted, persistiert); `t()` liest `useUiPrefs.getState().language`; `App` abonniert `language` einmal → ganzer Baum rendert bei Wechsel neu | Zustand ist etabliert; eine einzige Subscription am Root ist die einfachste korrekte Lösung und wirkt auf **allen** Bildschirmen ohne Eingriff in ~12 `t()`-Nutzungsdateien. `t(key, params?, lang?)` bekommt einen optionalen expliziten Sprachparameter für Tests/nicht-reaktive Aufrufer. |
| Missions-/Kartentexte | Optionale i18n-Referenzschlüssel `nameKey`/`storyKey` (`MissionCase`) und `taglineKey` (`MapPack`) im Datenpaket; UI löst über neuen Helfer `resolveText(key?, fallback)` auf; `name`/`story`/`tagline` bleiben Pflicht-Literale (DE-Quelltext, fließen weiter in Log-Header/Replay/Statistiken) | Erfordernis „Referenzschlüssel im Set **oder** Fallback-Strategie" → beides kombiniert ist die sauberste Variante: Datendateien bleiben self-contained und abwärtskompatibel, der Fallback deckt Sets ohne Keys ab; Eigennamen (Karten-/Knotennamen) bleiben bewusst unübersetzte Daten. |
| Hartkodierungs-Check | `.githooks/no-hardcoded-strings-check.py` nach Muster von `i18n-check.py`; scannt `src/**/*.tsx` (ohne `*.test.tsx`): JSX-Textknoten mit Buchstaben und String-Literale in sichtbaren Attributen (`aria-label`, `placeholder`, `alt`, `title`) gelten als Befund; Symbole/Zahlen ohne Buchstaben und `t()`-Aufrufe sind erlaubt. Verdrahtung: `pre-commit` (staged, blockierend) + `pre-push` (`--all --strict`) + npm-Skript `check:strings` | Exakt das etablierte Hook-Muster; erfüllt „Skript + Hook-Anbindung". |
| Tastatur auf der Karte | Pfeiltasten-Wanderung zwischen **interaktiven** Knoten (legalTargets ∪ selectable ∪ markable) über geometrische Nächst-Nachbar-Logik (Richtungs-Dominanz + Mindestdistanz), Fokus via Ref-Registry auf den `<g>`-Elementen; bestehender Tab/Enter-Weg bleibt | Räumlich konsistent mit der Karte (sauberer als lineare Tab-Kette über ~15 Knoten); Tab/Enter bleibt als Standard-Fokusweg erhalten und E2E-getestet. |
| App-Einstellungen | Neuer `AppSettingsScreen` (`MenuScreen "appSettings"`), erreichbar über neuen Hauptmenü-Button `menu.settings`: Sprache (DE/EN-Toggle), Lautstärke (Range 0–100), Stummschaltung (Checkbox). Werte landen in `useUiPrefs` (persistiert via `StorageLike`-Boundary `UI_PREFS_STORAGE_KEY`) | Das vorhandene `SettingsScreen` ist per-Map-Spielkonfiguration im Neu-Partie-Fluss — App-Einstellungen sind kontextfrei und gehören ins Hauptmenü (Anforderung: „Settings/Menü"). |
| Audio | Neues Verzeichnis `src/audio/` (nicht `src/logic/`): `AudioEngine.ts` (Fabrik `createAudioEngine`, injizierbarer `contextFactory`; lazy `AudioContext` beim ersten User-Gesture via `installAudioUnlock`-Listener) + `gameAudio.ts` (store-gebundenes `installGameAudio`: Hitze-Stufenanstieg → gestuftes Signal, laufendes Spiel → Ambient). Synthese rein prozedural (Oszillatoren + gefiltertes Noise-Buffer); Ambient-„Zufall" über zentralen `createRng` (seedfest, dokumentiert — kein `Math.random`) | Hält `src/logic` engine-rein (Math.random-Verbot bleibt unangetastet), jsdom-kompatibel (fehlender `AudioContext` → `supported=false`, alle Methoden no-op), Determinismus gewahrt. Ambient nur in der Ganoven-Perspektive (Spec §11: Spannungskanal für den Ganoven). |
| `document.lang` | `useEffect` in `App` synchronisiert `document.documentElement.lang` mit `language` | Screenreader-Aussprache korrekt pro Sprache. |
| Farbpalette | Bestehende Noir-Palette behalten; einzige AA-Verletzung (`MissionPanel .status_erledigt` #5f6b7d → 3,19:1) auf #8a94a6 heben (5,63:1 — Durchstreichung bleibt Form-Merkmal); Palette + gemessene Kontrastwerte als Docs-Kommentar in `GanoveScreen.module.css` dokumentieren | Minimaler Eingriff, dokumentierter AA-Nachweis. |

## Programmabläufe

### Sprachwechsel zur Laufzeit

1. `AppSettingsScreen` ruft `useUiPrefs.getState().setLanguage("en")`.
2. `useUiPrefs` schreibt die Einstellung in den `StorageLike`-Persistenz-Layer (`UI_PREFS_STORAGE_KEY`).
3. `App` (Subscription auf `s.language`) rendert neu → alle `t()`-Aufrufe im Baum lesen die aktuelle Sprache aus `useUiPrefs.getState()`.
4. `document.documentElement.lang` folgt via Effect.
5. Beim nächsten Start liest `useUiPrefs`-Initialisierung die persistierte Sprache.

Beteiligte: `uiPrefs`, `App`, `AppSettingsScreen`, `t()`, `main.tsx`-Baum.

### Hitze-Signal

1. `GanoveScreen` installiert `installGameAudio(engine)` (Cleanup beim Unmount).
2. Die Store-Subscription wertet `getHeatLevel().level` aus; steigt der Stufenindex (`LEVEL_ORDER`), ruft sie `engine.playHeatRise(level)` mit der erreichten Stufe.
3. `playHeatRise` synthetisiert das Stufensignal (aktiv: kurzer Blip; erhoeht: Zweitonanstieg; kritisch: dringlicher Dreifachpuls) über Master-Gain.

Beteiligte: `gameAudio`, `AudioEngine`, `useGameStore`, `InformationSystem.heatLevel`.

### Ambient „Polizeiaktivität"

1. `installGameAudio` startet `engine.setAmbient(true)` sobald `map !== null && outcome === null` (nur Ganoven-Screen installiert → ganove-scoped), stoppt bei Spielende/Unmount.
2. `AudioEngine` legt einen sehr leisen, gefilterten Noise-Loop + gelegentliche weiche „Funk"-Blips über deterministisches `createRng`-Intervall an.
3. `setVolume`/`setMuted` aus `useUiPrefs` wirken sofort auf den Master-Gain.

Beteiligte: `gameAudio`, `AudioEngine`, `uiPrefs`.

### AudioContext-Unlock (Autoplay-Policy)

1. `App` ruft einmalig `installAudioUnlock(engine)` auf.
2. Der Listener wartet auf das erste `pointerdown`/`keydown` am `window`, ruft `engine.unlock()` → `AudioContext` wird erzeugt/`resume()`d; Listener entfernt sich danach.
3. Ohne `AudioContext`-API (`jsdom`, alte Browser) bleibt `supported=false` und jede Methode ist no-op — Tests crashen nicht.

## Neue Klassen

| Klasse | Typ | Zweck |
|--------|-----|-------|
| `useUiPrefs` | Zustand-Store (`src/state/uiPrefs.ts`) | Persistierte App-Einstellungen: `language`, `audioVolume`, `audioMuted` + Setter; `UI_PREFS_STORAGE_KEY`; injizierbarer `StorageLike` |
| `Language` | Typunion (`src/i18n/index.ts`) | `"de" \| "en"` |
| `resolveText` | Funktion (`src/i18n/index.ts`) | `(key: string \| undefined, fallback: string, lang?)` → `t()` bei definiertem Schlüssel, sonst Fallback |
| `hasTranslation` | Funktion (`src/i18n/index.ts`) | `(key: string, lang?)` → ob der Schlüssel im Katalog existiert |
| `getLanguage` | Funktion (`src/i18n/index.ts`) | aktuelle Sprache aus `useUiPrefs` (mit DE-Fallback, wenn Store nicht initialisiert — z. B. Node-Kontext) |
| `createAudioEngine` | Fabrik (`src/audio/AudioEngine.ts`) | Prozedurale WebAudio-Engine: `supported`, `unlock()`, `playHeatRise(level)`, `setAmbient(on)`, `setVolume(0..1)`, `setMuted(bool)`, `dispose()` |
| `installAudioUnlock` | Funktion (`src/audio/AudioEngine.ts`) | One-Shot-Listener für erstes User-Gesture |
| `installGameAudio` | Funktion (`src/audio/gameAudio.ts`) | Store-Binding: Hitze-Anstieg → Signal; Spielzustand → Ambient |
| `AppSettingsScreen` | Komponente (`src/components/AppSettingsScreen.tsx`) | Sprach-, Lautstärke-, Mute-Einstellungen |
| `no-hardcoded-strings-check.py` | Hook-Skript (`.githooks/`) | Sichtbare-String-Prüfung für `.tsx` |

## Änderungen an bestehenden Klassen

### `t` / `src/i18n/index.ts`

- **Neue Typen/Funktionen:** `Language`, `getLanguage`, `hasTranslation`, `resolveText` (s. o.)
- **Geänderte Methode:** `t(key, params?, lang?)` — Katalog-Auswahl über `lang ?? getLanguage()`, Platzhalter-Ersetzung unverändert; fehlende Schlüssel geben den Key-String zurück (robust gegen `nameKey`-Daten)

### `MenuScreen` / `src/components/menuFlow.ts`

- **Union erweitert:** `+ "appSettings"`

### `App` / `src/App.tsx`

- **Neu:** `useUiPrefs((s) => s.language)`-Subscription; `useEffect` für `document.documentElement.lang`; `installAudioUnlock` beim Mount; Route `case "appSettings"` → `AppSettingsScreen`

### `MainMenu` / `src/components/MainMenu.tsx`

- **Neu:** `menu.settings`-Button → `onNavigate("appSettings")` (data-testid `menu-settings`)

### `MapGraph` / `src/components/MapGraph.tsx`

- **Neu:** Ref-Registry interaktiver Knoten + Pfeiltasten-Wanderung (ArrowUp/Down/Left/Right → geometrisch nächster interaktiver Knoten → `focus()`); `aria-hidden`-Bereinigung

### `MissionSelect` / `src/components/MissionSelect.tsx`

- **Geändert:** `entry.name`/`entry.story` → `resolveText(entry.nameKey, entry.name)` / `resolveText(entry.storyKey, entry.story)`

### `MapSelect` / `src/components/MapSelect.tsx`

- **Geändert:** `map.tagline` → `resolveText(map.taglineKey, map.tagline ?? "")`

### `MissionCase` / `src/logic/MissionSystem.ts`

- **Neue optionale Eigenschaften:** `nameKey?: string`, `storyKey?: string` — Validierung: non-empty String, wenn vorhanden

### `MapPack` / `src/logic/mapPack.ts`

- **Neue optionale Eigenschaft:** `taglineKey?: string` — Validierung analog `tagline`

### `GanoveScreen` / `src/components/GanoveScreen.tsx`

- **Neu:** `installGameAudio`-Effect (Unmount-Cleanup); Notices → `role="alert"`; Statuszeile `aria-live="polite"`

### `DetektivScreen` / `src/components/DetektivScreen.tsx`

- **Neu:** Notice `role="alert"`; Status `aria-live`

### `OutcomeView` (beide Screens) / `ReplayScreen.tsx` / `ResumeScreen.tsx` / `StatsScreen.tsx`

- **Neu:** `role="status"` auf Outcome-Panel; `aria-live`-Hinweise wo zutreffend

### Styles

- `MissionPanel.module.css`: `.status_erledigt` Farbe → #8a94a6
- `GanoveScreen.module.css`: Paletten-/Kontrast-Dokumentationskommentar; `Menu.module.css`: `:focus-visible`-Outlines für `.card`; `AppSettingsScreen`-Felder (Wiederverwendung `fieldGrid`/`selectInput`)
- `MapGraph.module.css`: `:focus-visible` für Knoten (vorhanden — prüfen/ergänzen Ring-Stil)

### Daten & Kataloge

- `src/data/missions/muenster.json`: `nameKey`/`storyKey` je Fall (`mission.case.muenster.<id>.name|story`)
- `src/data/maps/muenster.json`, `luebeck.json`: `taglineKey` (`map.tagline.muenster|luebeck`)
- `src/i18n/de.json` + `en.json`: neue Schlüssel `menu.settings`, `appsettings.*`, `map.tagline.*`, `mission.case.muenster.*` (DE-Texte spiegeln die JSON-Literale, EN übersetzt), `map.keyboardHint`

### `.githooks/`, `package.json`, Test-Setup

- `pre-commit`/`pre-push`: `no-hardcoded-strings-check.py` einhängen (blockierend)
- `package.json`: Skript `check:strings` → `python .githooks/no-hardcoded-strings-check.py --all`
- `src/test/setup.ts`: `useUiPrefs`-Reset (Sprache `de`, Volume 100, unmuted) + Entfernen des Persistenz-Schlüssels nach jedem Test

## Datenbankmigrationen

Keine (Browser-App; Persistenz über `localStorage`-Keys, neuer unabhängiger `UI_PREFS_STORAGE_KEY`).

## Validierungsregeln

| Feld / Objekt | Regel | Fehlerfall |
|---------------|-------|------------|
| `MissionCase.nameKey`/`storyKey` | non-empty String, wenn vorhanden | `MissionValidationError` |
| `MapPack.taglineKey` | non-empty String, wenn vorhanden | `MapValidationError` |
| `uiPrefs.audioVolume` | Ganzzahl 0–100 | Clamp auf [0,100] |
| `uiPrefs.language` | nur `"de"`/`"en"` | ungültiger persistierter Wert → Fallback `de` |

## Konfigurationsänderungen

| Eintrag | Typ | Standardwert | Zweck |
|---------|-----|--------------|-------|
| `UI_PREFS_STORAGE_KEY` (`"indd.ui-prefs"`) | localStorage-Key | – | Persistenz Sprache/Audio |
| `package.json` `check:strings` | npm-Skript | – | Check-Ausführung (Hook/CI/CLI) |

## Seiteneffekte und Risiken

- **Re-Render-Verhalten:** Sprachwechsel rendert den ganzen Baum neu — kleine App, unkritisch.
- **Persistenz-Bleed in Tests:** `uiPrefs` schreibt `localStorage` — `setup.ts`-Reset + Key-Entfernung nötig.
- **Audio in Tests/E2E:** ohne `AudioContext` → `supported=false`; E2E-Browser erzeugt Context erst nach Gesture (Playwright-Klicks sind Gestures — Ambient könnte laufen, ist aber lautlos-assertierbar nur über Einstellungen).
- **Check-False-Positives:** Check muss `{" "}`-Whitespaces, Zahlen, Symbole (× ✓ ▶ ○ —) und datengetriebene Ausdrücke (`{entry.name}`) tolerieren.
- **i18n-Paritäts-Hook:** neue Keys in beiden Katalogen pflegen; `t()` mit dynamischem `nameKey` umgeht statische Key-Erfassung — `resolveText`-Fallback fängt fehlende Keys ab.
- **StrictMode:** `installGameAudio`/`installAudioUnlock` doppelt aufgerufen → idempotent gestalten (Cleanup-Funktion, One-Shot-Guard).

## Umsetzungsreihenfolge

1. **i18n-Kern erweitern** (`src/i18n/index.ts`: `Language`, Katalogwahl, `lang`-Param, `hasTranslation`, `resolveText`)
   - Voraussetzungen: keine
2. **`useUiPrefs`-Store** (`src/state/uiPrefs.ts` mit `StorageLike`-Persistenz)
   - Voraussetzungen: `StorageLike`-Muster aus `Recorder.ts` (vorhanden)
3. **`t()` an Store binden** (`getLanguage` liest Store) + `App`-Subscription + `document.lang`-Sync
   - Voraussetzungen: Schritte 1–2
4. **`AppSettingsScreen`** + `MenuScreen`-Union + `MainMenu`-Button + `App`-Route + i18n-Keys
   - Voraussetzungen: Schritte 2–3
5. **Referenzschlüssel in Datenpaketen** (`MissionCase.nameKey/storyKey`, `MapPack.taglineKey` + Validierung + JSON + Katalog-Keys + `resolveText` in `MissionSelect`/`MapSelect`)
   - Voraussetzungen: Schritt 1
6. **`no-hardcoded-strings-check.py`** + Hook-Verdrahtung + `check:strings`-Skript; Befunde beheben
   - Voraussetzungen: Schritte 4–5 (damit der Check auf dem finalen Stand grün ist)
7. **A11y-Ausbau**: `MapGraph`-Pfeiltasten, `aria-live`/`role`-Ergänzungen, `MissionPanel`-Kontrastfix, `:focus-visible`, Paletten-Dokumentation
   - Voraussetzungen: keine harten — nach Schritt 4 sinnvoll
8. **Audio**: `src/audio/AudioEngine.ts` + `gameAudio.ts` + `installAudioUnlock` in `App` + `installGameAudio` in `GanoveScreen` + uiPrefs-Anbindung
   - Voraussetzungen: Schritt 2 (Lautstärke/Mute-Quelle)
9. **Test-Setup + neue Tests** (`setup.ts`-Reset, uiPrefs-/i18n-/Audio-/AppSettingsScreen-/MapGraph-Pfeiltasten-Tests)
   - Voraussetzungen: jeweilige Implementierungsschritte
10. **E2E-Spec** `e2e/i18n-a11y.spec.ts` (Sprachwechsel-Laufzeit + Tastatur-Kernflow + Audio-Einstellungen)
    - Voraussetzungen: Schritte 4–8

## Tests

### Neue Tests

| Test / Hilfsmethode | Testklasse | Was wird geprüft / bereitgestellt? |
|--------------------|------------|-------------------------------------|
| `uiPrefs.test.ts` | `src/state/` | Defaults, Setter, Persistenz-Roundtrip über Fake-`StorageLike`, ungültige Werte → Fallback |
| `index.test.ts` (i18n) | `src/i18n/` | `t()` DE/EN, `lang`-Param, Store-Wechsel, `hasTranslation`, `resolveText`-Fallback |
| `AudioEngine.test.ts` | `src/audio/` | Fake-`AudioContext`: Unlock-Gating (kein Context vor Gesture), `playHeatRise` je Stufe unterschiedliche Oszillator-Sequenz, `setAmbient` on/off, `setVolume`/`setMuted` auf Master-Gain, `supported=false` → no-op |
| `gameAudio.test.ts` | `src/audio/` | Store-Events → `playHeatRise` nur bei Stufen**anstieg**; Ambient an/aus bei Spielstart/-ende |
| `AppSettingsScreen.test.tsx` | `src/components/` | Controls rendern, Sprachwechsel wirkt auf `t()`-Texte, Volume/Mute persistieren, Zurück-Navigation |
| `MapGraph.test.tsx` (Erweiterung) | `src/components/` | Pfeiltasten wandern Fokus geometrisch korrekt zwischen interaktiven Knoten |
| `MissionSelect.test.tsx` (Erweiterung) | `src/components/` | Fall zeigt `t()`-aufgelösten `nameKey`/`storyKey`-Text; Sprachwechsel → andere Sprache |
| `MainMenu`-Test (Erweiterung, `MenuScreens.test.tsx`) | `src/components/` | `menu.settings`-Button navigiert zum AppSettingsScreen |
| `MainMenu.tsx`-Hinweis | – | `menuFlow.test.ts`/`App.test.tsx` ggf. Ergänzung der neuen Route |

### Betroffene bestehende Tests

| Test / Testklasse | Grund der Anpassung |
|-------------------|---------------------|
| `src/test/setup.ts` | `useUiPrefs`-Reset + Persistenz-Key-Entfernung (kein Test, Setup) |
| `src/components/MenuScreens.test.tsx` | Neuer Menüpunkt `menu.settings` (Buttons-Anzahl/Navigation) |
| `src/App.test.tsx` | neue Route `appSettings` (Navigationstest ergänzen) |
| `src/logic/MissionSystem.test.ts`-nahe Validierungstests | `nameKey`/`storyKey`/`taglineKey`-Validierung ergänzen |
| `e2e/menu.spec.ts` „main menu shows …" | ggf. Assert des neuen `menu-settings`-Buttons |

### E2E-Tests (primärer Funktionsnachweis)

| Priorität | Szenario | Testdatei / Testklasse | Abgedecktes Akzeptanzkriterium | Warum E2E nötig ist |
|-----------|----------|------------------------|-------------------------------|---------------------|
| Pflicht | Sprachwechsel DE→EN im Einstellungs-Menü wirkt sofort: Menü-, Auswahl-, Spiel-Texte englisch; zurück auf DE | `e2e/i18n-a11y.spec.ts` | „Sprachwechsel wirkt zur Laufzeit auf allen Bildschirmen" | Nur der reale Browser-Baum beweist den Laufzeit-Wechsel über Screens hinweg |
| Pflicht | Kernflow komplett per Tastatur: Hauptmenü → Karte → Modus → Einstellungen → Mission → Spawn (Pfeiltasten) → Zug (Pfeiltasten+Enter) → Abbruch als Remis | `e2e/i18n-a11y.spec.ts` | „Kernflows komplett per Tastatur" | Tastatur-Fokus/Pfeiltasten-Wanderung ist nur im Browser prüfbar |
| Pflicht | Audio-Einstellungen: Lautstärke-Regler + Stummschaltung sichtbar, wirken persistiert (localStorage, Reload) | `e2e/i18n-a11y.spec.ts` | „Stummschaltung funktioniert" | Persistenz über Seiten-Reload nur e2e sichtbar |
| Pflicht | Sprachwahl persistiert über Reload | `e2e/i18n-a11y.spec.ts` | Laufzeit-Wechsel + Persistenz | – |

## Offene Punkte

Keine — die in der Anforderung genannten Alternativen wurden als Designentscheidungen getroffen (Referenzschlüssel+Fallback; Pfeiltasten; `src/audio/`).
