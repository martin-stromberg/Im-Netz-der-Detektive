# Übersetzte Anforderung — Finales Brettspiel-Design (Projektabschluss)

**Nutzerauftrag (wortgetreu):** „du solltest das spiel als projekt fertigstellen.
das ziel ist also das fertige design. alles."

## Ziel

Das Spiel „Im Netz der Detektive" (React + TypeScript + Vite, SVG-Kartenrendering)
erhält sein **fertiges Design** — einen durchgängigen, vollständigen
Brettspiel-Look nach dem Vorbild moderner Brettspiel-Computervarianten.
Damit ist das Projekt gestalterisch abgeschlossen („alles" = alle benannten
Design-Lücken geschlossen, kein Rest „abstrakte Entwickler-Optik").

**Belegter Kontext (aus vorheriger Diskussion, vom Nutzer bestätigt):**
Aktuell fehlt dem Spiel die „Brettspiel-Materialität". Konkret benannte Lücken:
Papier-/Pappen-Anmutung, greifbare Figuren, Tokens statt Punkte, gezeichnete
Routen, Schmuckschrift, kartenartige Panels.

## Fachliche Anforderungen

1. **Materialität des Spielbretts:** Die Karte wirkt wie ein physisches
   Spielbrett — Papier-/Pappen-Textur, erkennbarer Brett-Rahmen,
   Kantenschatten/Tiefenwirkung (Board liegt „auf dem Tisch").
2. **Spielfiguren:** Spielfiguren (Detektive, Ganove o. ä. laut bestehendem
   Datenmodell) werden als greifbare Spielsteine/Meeple gerendert —
   mit Volumen, Schatten, Standfläche — statt als abstrakte Marker.
   Lesbarkeit der Zugehörigkeit/Farbe bleibt gewahrt.
3. **Ortsmarken als Tokens:** Orte/Stationen werden als Tokens bzw.
   Plaketten dargestellt (Prägung, Rand, ggf. Symbol/Label), nicht als
   nackte Punkte.
4. **Routen als Wege:** Verbindungen/Routen werden als gezeichnete Wege
   (Kartenstil, angemessene Strichstärke, ggf. gestrichelt/handdrawn-Anmutung)
   dargestellt, nicht als dünne technische Linien.
5. **Typografie:** Eine prägnante Schmuckschrift für Titel/Überschriften wird
   **lokal eingebettet** (Font-Datei im Repo, Lizenz dokumentiert in
   `ASSETS.md` o. ä.) — kein CDN, kein externer Font-Service.
6. **Panels/Karten-Design:** UI-Panels (Info, Log, Aktionen, Menüs) erhalten
   ein kartenartiges Design (Kartenränder, Haptik, konsistent mit der
   Brett-Optik), sodass Board und UI eine Einheit bilden.
7. **Rahmen/Komposition:** Die Gesamtkomposition (Hintergrund/Tischfläche,
   Anordnung von Brett + Panels, Ränder) wird zu einem stimmigen
   „Spieltisch"-Bild gefasst — kein losgelöstes Fließen einzelner Elemente.
8. **Konsistenz & Vollständigkeit:** Alle Screens/Views, die die
   Spieloberfläche zeigen, folgen demselben Designsystem — keine
   Mischung aus altem „nacktem" Stil und neuem Brettspiel-Stil.

## Betroffene Bereiche

- SVG-Kartenrendering: Board, Ortsmarken, Routen, Spielfiguren
  (`src/components/`, kartennahe Komponenten).
- Panel-/UI-Komponenten (Info-, Aktions-, Log-, Menü-Flächen) und
  App-Layout (`src/App.tsx`, `App.module.css`, Komponenten-CSS).
- Assets: lokale Font-Datei(en), Texturen unter `src/assets/`,
  Dokumentation in `ASSETS.md`.
- i18n-Texte nur falls neue sichtbare Zeichenketten entstehen (`src/i18n/`).
- Tests (`src/test/`, `e2e/`) soweit sie Strukturen/Selektoren betreffen,
  die durch das Redesign geändert werden.

## Abläufe

- Die bestehenden Spielabläufe (Menü → Setup → Partie → Auswertung,
  Save/Load, Replay, Sprachwechsel) bleiben funktional unverändert und
  laufen im neuen Design unverändert durch.
- Sichtbarkeit/Bedeutung spielrelevanter Informationen
  (Blickwinkel-Regeln der Perspektive, verdeckte Informationen) bleibt
  identisch — das Redesign darf keine Hinweise „leaken" oder
  verdeckte Infos sichtbar machen.
- Interaktionen (Klick-/Hover-/Fokus-Ziele auf Orten, Figuren, Panels)
  bleiben bedienbar; Zielgrößen nicht verkleinern.

## Konfiguration

- Keine neuen externen Laufzeit-Abhängigkeiten für Optik; Font-Dateien
  und Texturen liegen lokal im Repo (build-time eingebunden via Vite).
- Bestehende Konfigurationen (`vite.config.ts` inkl. Coverage-Threshold,
  `playwright.config.ts`, ESLint/Prettier) bleiben wirksam und werden
  nicht aufgeweicht.
- Neu eingebettete Assets (Fonts, Texturen): Lizenz muss kompatibel und
  in `ASSETS.md` dokumentiert sein.

## Akzeptanzkriterien

1. Alle in den fachlichen Anforderungen 1–8 genannten Design-Elemente sind
   umgesetzt und auf den spielrelevanten Screens sichtbar konsistent.
2. Bestehende Test-Suite (Vitest inkl. Coverage-Threshold ≥ 70 %,
   Playwright-E2E) ist grün; durch Redesign bedingte Anpassungen sind
   erfolgt, ohne Assertions fachlich aufzuweichen.
3. **Keine Info-Leaks:** Das Redesign ändert weder sichtbare noch
   verborgene Spielinformationen (Perspektiven-Asymmetrie bleibt durch
   bestehende Assertions abgesichert).
4. **Barrierefreiheit erhalten:** Bedienbarkeit per Tastatur, Fokus-
   Sichtbarkeit und ARIA-/Semantik-Stand sind nicht schlechter als zuvor;
   Information ist **nicht ausschließlich über Farbe** vermittelt
   (Figuren/Tokens unterscheiden sich zusätzlich über Form/Symbol/Label).
5. **Reduced Motion:** Bestehende `prefers-reduced-motion`-Unterstützung
   bleibt wirksam; neue Animationen/Übergänge respektieren sie.
6. **i18n:** Kein hartkodierter sichtbarer Text; neue Strings über das
   bestehende i18n-System in allen unterstützten Sprachen.
7. Font lokal eingebettet und lizenzdokumentiert; keinerlei CDN-/
   Hotlink-Referenzen im Build (`dist`).

## Nicht-Ziele

- **Keine Regeländerungen** und keine Änderungen an Spiellogik,
  Balancing, KI-Parametern oder Kartendaten (außer rein dekorativ).
- **Kein neuer Gameplay-Scope:** keine neuen Modi, Aktionen, Features,
  Screens oder Inhalte.
- **Keine externen CDNs** oder Assets mit unklarem/inkompatiblem
  Lizenzrisiko; keine Hotlinks.
- Keine Audio-Erweiterung und keine technische Umstellung des Stacks.
- Kein Merge/Push/PR (gemäß Projekt-Rahmenbedingungen).

## Belegte Vorgaben vs. Annahmen

**Belegt (aus dem Nutzerauftrag + zugestimmter Lückenliste):** fertiger
Brettspiel-Look als Ziel; die sechs benannten Lücken (Materialität,
Figuren, Tokens, Routen, Schmuckschrift lokal, kartenartige Panels);
„alles" = Vollständigkeit dieser Liste auf der Spielfläche.

**Annahmen (nicht explizit belegt, bitte ggf. korrigieren):**

- „Alles" umfasst zusätzlich die Gesamtkomposition (Tischfläche/Rahmen)
  und die Konsistenz aller Screens — über die Punkteliste hinaus, aber im
  Geist „fertiges Design".
- Menü/Setup-/Auswertungs-Screens gehören mit zum „fertigen Design"
  (gleiches Designsystem), nicht nur die Board-Ansicht.
- Schmuckschrift gilt primär für Titel/Überschriften; Fließtext bleibt
  gut lesbare Standardschrift.
- Texturen werden vorzugsweise prozedural/SVG-basiert erzeugt, um das
  Lizenzrisiko externer Assets zu vermeiden; externe Assets nur mit
  klar dokumentierter kompatibler Lizenz.

## Offene Fragen

1. Soll der Brettspiel-Look eine konkrete Stilrichtung haben
   (z. B. klassisch-detektivisch/vintage vs. modern-flach)? — Annahme:
   an Genre angelehnt (Detektiv/Karte, Papier-Materialität).
2. Gilt das finale Design auch für Startmenü, Karten-/Missionsauswahl
   und Statistik-Screens gleichermaßen, oder Fokus nur auf die Partie-
   Ansicht? — Annahme: alle Screens.
3. Gibt es eine Präferenz für die Schmuckschrift (z. B. serifenbetont,
   Kalligraphie)? — Annahme: frei wählbar unter lizenzfreien lokalen
   Fonts.
4. Wird eine visuelle Abnahme (Screenshot-Review durch Nutzer) als
   Iterationsschritt gewünscht, bevor das Design als „fertig" gilt?
