# Diese Website — Aufbau & Betrieb

Statischer Markdown-Viewer für die Konzeptdokumente des Projekts.
Kein Build-Schritt, keine Server-Abhängigkeiten — ein lokaler
HTTP-Server genügt (Browser blockieren `fetch` via `file://`).

## Start

Doppelklick auf **`start-docs.bat`** im Repo-Root:

- wechselt nach `docs/konzept/`
- startet `python -m http.server 8899`
- öffnet http://localhost:8899 im Browser

Alternativ manuell:

```
cd docs/konzept
python -m http.server 8899        # oder: npx serve -l 8899
```

Voraussetzung: Python 3 im PATH.

## Aufbau

```
docs/konzept/
  index.html              — Einstieg, lädt Sidebar + Viewer
  assets/
    app.js                — Manifest laden, Markdown rendern (marked),
                            Fortschrittsbalken aus Checkboxen zählen
    style.css             — Layout: Sidebar-Navigation + Content
    vendor/               — marked.min.js, purify.min.js (lokal, offlinefähig)
  content/
    manifest.json         — Projektname + Liste der Dokumente (Navigation)
    00-uebersicht.md
    01-spielkonzept.md
    02-technisches-konzept.md
    03-offene-themen.md
    04-balancing.md
    05-website.md         — diese Datei
```

## Neue Dokumente hinzufügen

1. `.md`-Datei in `content/` ablegen
2. Eintrag in `content/manifest.json` ergänzen:

```json
{ "file": "06-neues-thema.md", "title": "Neues Thema" }
```

Die Navigation und der Fortschrittsbalken aktualisieren sich automatisch.

## Konventionen

- **Offene Punkte** werden als Checkbox geschrieben: `- [ ]` (offen) bzw.
  `- [x]` (entschieden) — der Balken in der Sidebar zählt sie automatisch.
- Entscheidungen werden im Text mit der OT-Nummer verknüpft:
  `*(entschieden, OT-XX)*`.
- Zahlenwerte aus `04-balancing.md` sind Startwerte, keine Festlegungen.
