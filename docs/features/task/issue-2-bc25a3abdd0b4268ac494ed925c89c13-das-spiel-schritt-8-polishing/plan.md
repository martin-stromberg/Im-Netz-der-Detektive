# Umsetzungsplan: Schritt 8 — Konsistenz-Endabnahme und Polishing

## Übersicht

Der Audit über alle Screens und Verträge (Bestandsaufnahme in
`inventory.md` + `inventory/ui.md`) hat das Design der Schritte 1–7
weitgehend bestätigt. Vier gezielte Nachbesserungen sind nötig: drei
`:focus-visible`-Regeln, die Fokus nur über eine Farbänderung zeigen,
eine `box-shadow`-Transition ohne `prefers-reduced-motion`-Abdeckung
sowie eine fehlende Kontrast-Zeile in den Header-Tabellen. Dazu kommt
ein E2E-Nachweis für die Fokusringe.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| Fokusring-Farbe | `--color-amber-bright`, 2 px, `outline-offset: 1px` | Bestehende Konvention (`.secondaryButton`, `.card`, `.rangeInput`, `.choiceButton`, `.commentInput`); liegt per Offset auf dem dunklen Untergrund und bleibt auch auf der hellen Brass-Face des `.primaryButton` sichtbar |
| `.removeButton` Fokus | gleiche amber Outline wie das benachbarte `.commentInput` | Konsistenz im Marker-Editor; die Danger-Kodierung (Border-Recolor) bleibt zusätzlich bestehen |
| Reduced-Motion-Transition | `transition: none` im vorhandenen Reduce-Block von `GanoveScreen.module.css` | Kleinste Änderung; statischer Endzustand ist ohnehin sichtbar |

## Programmabläufe

Keine — ausschließlich statische CSS-/Dokumentationskorrekturen und ein
E2E-Test.

## Neue Klassen

Keine.

## Änderungen an bestehenden Klassen/Dateien

### `src/components/GanoveScreen.module.css`

- `.primaryButton:hover, .primaryButton:focus-visible`-Regel (Z. 309–313):
  `outline: none` entfällt; zusätzliche Regel
  `.primaryButton:focus-visible { outline: 2px solid var(--color-amber-bright); outline-offset: 1px; }`
  — der bisherige Background-Swap auf `--color-amber-bright` bleibt als
  Hover/Face-Cue bestehen.
- `@media (prefers-reduced-motion: reduce)`-Block bei Z. 176:
  `.mapArea::after { transition: none; }` ergänzen — die 400-ms-
  `box-shadow`-Transition der Verfolgungs-Vignette war bisher nicht
  abgedeckt.
- Header-Kontrasttabelle: Zeile `#eaf0f8 on #10141c → 16.1:1`
  (Text auf `--color-inset-bg`: Formular-Inputs) ergänzen.

### `src/components/Menu.module.css`

- `.numberInput:focus-visible, .selectInput:focus-visible` (Z. 131–134):
  `outline: none` ersetzen durch `outline: 2px solid var(--color-amber-bright); outline-offset: 1px;`
  — Border-Recolor auf `--color-amber` bleibt zusätzlich.

### `src/components/DetektivScreen.module.css`

- `.removeButton:focus-visible` (Z. 144–147): `outline: none` ersetzen
  durch `outline: 2px solid var(--color-amber-bright); outline-offset: 1px;`
  — Danger-Border-Recolor bleibt zusätzlich.

### `src/theme.css`

- Header-Kontrasttabelle: Zeile `--color-text` on `--color-inset-bg`
  → 16.1:1 (gemessen; Input-Text auf `.numberInput`/`.selectInput`/
  `.commentInput`-Fläche) ergänzen.

### `e2e/design.spec.ts`

- Neuer Test `focus rings stay visible on interactive controls` im
  `describe("design fundament")`: fokussiert reale Elemente
  (`.primaryButton` auf dem Ganove-Idle-Screen, `setting-eventmode`
  (`.selectInput`) und `setting-cadence` (`.numberInput`) auf dem
  Settings-Screen, `.removeButton` über den Marker-Flow im
  Detektiv-Screen) und prüft `outlineStyle === "solid"` sowie
  `outlineWidth >= 2px` via `getComputedStyle`.

## Datenbankmigrationen

Keine.

## Validierungsregeln

Keine.

## Konfigurationsänderungen

Keine.

## Seiteneffekte und Risiken

- **Visuelle Änderung:** Fokussierte `.primaryButton`/`.numberInput`/
  `.selectInput`/`.removeButton` zeigen künftig einen Ring — gewünscht,
  kein Risiko für Layouts (Outline liegt außerhalb der Box).
- **Prettier:** CSS-Edits müssen `npm run format`-sauber sein.
- **E2E-Dauer:** Der neue Test nutzt den bestehenden Marker-Flow aus
  `detektiv.spec.ts` (Spawn-Picks per `data-selectable`-Klicks +
  `marker-toggle` + Node-Klick) — deterministisch über `?mode=detektiv&map=teststadt&seed=42&mission=random`.

## Umsetzungsreihenfolge

1. **CSS-Fixes in den drei Modulen + Reduced-Motion-Block**
   - Voraussetzungen: keine
   - Beschreibung: Die vier oben genannten Regel-Edits.
2. **Kontrasttabellen in `theme.css` und `GanoveScreen.module.css` ergänzen**
   - Voraussetzungen: keine
3. **E2E-Test `focus rings stay visible` in `e2e/design.spec.ts`**
   - Voraussetzungen: Schritt 1 (die Regeln müssen existieren)
4. **Verifikation:** `npm run lint`, `npm run format`, `npm run test`
   inkl. Coverage ≥ 70 %, alle 6 Hook-Checks `--all --strict`,
   `npm run build` + `dist`-Scan, Playwright-E2E über temporäre
   `playwright.local.config.ts` (`reuseExistingServer: true`; Datei
   danach löschen, nicht committen).
   - Voraussetzungen: Schritte 1–3

## Tests

### Neue Tests

| Test / Hilfsmethode | Testklasse | Was wird geprüft? |
|--------------------|------------|---------------------|
| `focus rings stay visible on interactive controls` | `e2e/design.spec.ts` (`design fundament`) | `:focus-visible`-Outline (solid, ≥ 2 px) auf `.primaryButton`, `.selectInput`, `.numberInput`, `.removeButton` — Abdeckung der A11y-Nachbesserung |

### Betroffene bestehende Tests

Keine — keine Signatur-, Verhaltens- oder `data-*`-Änderungen.

### E2E-Tests (primärer Funktionsnachweis)

| Priorität | Szenario | Testdatei / Testklasse | Abgedecktes Akzeptanzkriterium | Warum E2E nötig ist |
|-----------|----------|------------------------|-------------------------------|-------------------|
| Pflicht | Tastaturfokus zeigt sichtbaren Ring auf allen interaktiven Controls der neuen Screens | `e2e/design.spec.ts` — `focus rings stay visible on interactive controls` | A11y-Audit: `:focus-visible` auf allen Elementen, Barrierefreiheit nicht schlechter | Fokus-Rendering ist nur im echten Browser prüfbar; jsdom wertet CSS-Module nicht aus |
| Bestand | Gesamter bestehender E2E-Satz (39 Tests: `design`, `menu`, `i18n-a11y`, `ganove`, `detektiv`, `persistenz`) | `e2e/*.spec.ts` | Alle acht fachlichen Anforderungen sichtbar; `data-*`-Vertrag; Tastatur-Flow | Bereits vorhanden — bleibt der Abnahmenachweis |

Keine bestehenden E2E-Tests müssen angepasst werden.

## Offene Punkte

Keine.
