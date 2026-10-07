# Spielkonzept — Im Netz der Detektive

> Konsolidierte Fassung aus `issue.md` (Brainstorming + Neue Erkenntnisse),
> ergänzt um alle getroffenen Design-Entscheidungen (siehe „Offene Themen").
> Zahlenwerte sind Playtest-Startwerte (siehe `04-balancing.md`).

## 1. Grundidee

Asymmetrisches Verfolgungsspiel: Ein verdeckter **Ganove** zieht durch das
Wegenetz von **Münster** und erfüllt eine Mission, während offen spielende
**Detektive** ihn anhand von Hinweisen, Kameras und Ereignissen eingrenzen.

**Informationsasymmetrie (entschieden, OT-02/OT-06):**

| Ganove sieht | Detektive sehen |
|---|---|
| Eigene Position | Eigene Positionen |
| Nachbarknoten, mögliche Wege | Karte vollständig inkl. Ortskategorien/Zonen |
| Alle Detektivpositionen (exakt) | Alle Hinweise und Ereignisse |
| Missionsziele | Missionsstruktur — **nicht** die gezogenen Zielknoten |
| Gesperrte Kanten | Gesperrte Kanten |
| **Keine** Kameras, Hinweise, Ereignisse | Den Ganoven **nicht** |

Da die Ortskategorien eine öffentliche Karteneigenschaft sind, kennen die
Detektive den *Pool* möglicher Ziele — aber nicht, welche konkret gezogen
wurden. Deduktion aus Spuren ist ihre Kernkompetenz.

## 2. Spielfeld

- **Graph**: Knoten = Orte (Hafen, Aasee, Domplatz, Schloss, Hauptbahnhof …),
  Kanten = Wege. Zielgröße **~50 Knoten** (Korridor 45–60), Ø-Knotengrad 3–4.
- **Zwei Kantentypen**: `weg` (dicht, lokal) und `fahrt` (seltene
  Fernverbindungen entlang Bus-/Bahn-Achsen — schnell, aber vorhersagbar).
  Beide Seiten nutzen beide Typen; 1 Zug = 1 Kante.
- Knoten tragen **Kategorien** (diebstahl/kontakt/sabotage/flucht) und eine
  **Zone** — Basis für Missionsgenerierung und Zonenhinweise.
- Karten sind austauschbare **Kartenpakete** (Graph + Startregeln +
  map-abhängige Einstellungen) — Multi-Stadt-fähig von Anfang an (siehe §8).
  Die Map liefert für alle topologieabhängigen Werte Vorschläge und
  erlaubte Bereiche; das Menü überschreibt innerhalb davon (z. B.
  Detektivzahl, Kameraanzahl, Zeitlimit inkl. „unbegrenzt").

## 3. Rundenablauf und Bewegung (entschieden, OT-03/OT-07)

### Startaufstellung (entschieden, OT-28)

Die Karte definiert pro Seite einen **Spawn-Modus**:

- `choice` — Auswahl aus einer Liste erlaubter Knoten/Zonen
- `free` — alle Knoten erlaubt, aber mit **Mindestabstand zu den
  Detektiven** (`minDistanceToDetective`, Map-Parameter)
- `random` — die Map vergibt die Startpositionen per Zufall

**Reihenfolge:** Die Detektive werden zuerst platziert, der Ganove wählt
**als Letzter** — wenn eine Wahl möglich ist. Positionen unterhalb des
Mindestabstands zu einem Detektiv sind verboten und werden nicht
angeboten. Ein „Start neben dem Fangtrupp" ist so strukturell
ausgeschlossen.

Jede Runde hat zwei Phasen:

1. **Ganovenphase:** Der Ganove zieht auf einen legalen Nachbarknoten *oder*
   führt am Zielknoten seine Aktion aus (§5.3). Kamera-, Ereignis- und
   Hinweisprüfung laufen intern sofort ab — der Ganove erhält nur die
   Bewegungsbestätigung.
2. **Detektivphase:** Die Detektive sehen die neuen Hinweise/Ereignisse, dann
   zieht jeder der Detektive einmal in fester Reihenfolge (D1 → D4).
   **Fangprüfung nach jedem Einzelzug.**

Regeln:

- **Zugzwang für alle** — niemand darf freiwillig stehen bleiben.
  Einzige Ausnahme: die Aktionsrunde des Ganoven am Zielknoten.
- Von Detektiven **besetzte Knoten sind für den Ganoven illegale Ziele**
  (werden in der UI nicht angeboten).
- Mehrere Detektive dürfen denselben Knoten teilen.

## 4. Informationssystem

### 4.1 Kameras (entschieden, OT-11/OT-12/OT-25)

- **8 Kameras** (~15 % der Knoten), zu Beginn zufällig verteilt,
  **Mindestabstand 2 Kanten** untereinander (keine Cluster).
- **Missionszielknoten sind kamerafrei** (öffentlich bekannte Regel — die
  Aktion dort erzeugt ohnehin einen exakten Spur-Hinweis).
- **Dauerhaft aktiv**, lösen bei jedem Betreten aus.
- Hinweis = **exakter Knoten + Auslöserunde**, nur für die Detektive.
- Der Ganove erfährt Kamerapositionen nie (Ausnahme: Polizeifunk, §4.5).

### 4.2 Ereignis-Auslösemodi

Drei einstellbare Modi:

1. **Fester Zyklus** — alle X Runden (Startwert: 4)
2. **Prozentuale Wahrscheinlichkeit** — pro Runde (Startwert: 25 %)
3. **Spannungsbalken** *(Default)* — +10 pro Runde, Schwelle 40 →
   garantierte Ereigniskadenz ~alle 4 Runden

### 4.3 Ereignistypen (entschieden, OT-13/OT-14/OT-16)

| Typ | Wirkung | Sichtbar für | Anteil |
|---|---|---|---|
| **Sichtbarkeit** | Ganoves aktueller Knoten wird für genau die laufende Runde exakt gezeigt — kein Trail | Detektive | ~25 % |
| **Hinweis** (Zeuge, Geräusch) | Zonenbasierter Hinweis („im Bereich X") | Detektive | ~45 % |
| **Umwelt** (Stau, Sperrung) | Sperrt 1 zufällige Kante für 3 Runden — für **beide** Seiten wirksam und sichtbar; nie die letzte Kante eines Knoten / keine Graph-Zerteilung | beide | ~30 % |
| **Ganovenaktionen** | Keine Zufallsereignisse — sind Sabotage-Effekte des Informanten (§5.4) | — | — |

Klarstellung: Die Regel „nur Detektive sehen Ereignisse" gilt für
*hinweisgebende* Ereignisse. Weltzustandsänderungen (Sperrungen) sind für
beide sichtbar — der Ganove muss umplanen können.

### 4.4 Hinweise (Grundsatz entschieden, OT-11)

- Nur die Detektive sehen Hinweise.
- Grundsatz: **„Hinweise zeigen, wo der Ganove *war* — nie wo er *ist*."**
- Exakte Knotenangabe nur vergangenheitsbezogen: Kameraauslösung (Knoten +
  Runde), Aktions-Spur (Tatort). Live-Ausnahme: Sichtbarkeitsereignis.
- Zonen-Hinweise bleiben absichtlich grob (Radius ~2 Kanten).

### 4.5 Spezialfähigkeit: Polizeifunk abhören (entschieden, OT-15)

- **Einmal pro Partie** einsetzbar.
- Der Ganove erhält die **letzten 5 Hinweise** mit Typ und Runde —
  **inklusive Kameraauslösungen** (und damit implizit die Position dieser
  ausgelösten Kameras).
- Nicht enthalten: nicht ausgelöste Kameras, kommende Ereignisse.

### 4.6 Hitze-Indikator „Polizeiaufmerksamkeit" (entschieden, OT-27)

Der Ganove sieht keine Hinweise — aber er soll spüren, wie heiß die Spur
gerade ist. Der Indikator bildet die **Hinweisaktivität der letzten
3 Runden** ab, gewichtet ohne Inhalte:

Zonen-Hinweis +1 · Kameraauslösung +2 · Aktions-Spur +2 ·
Sichtbarkeitsereignis +3

| Summe | Level |
|---|---|
| 0 | ruhig |
| 1–2 | aktiv |
| 3–4 | erhöht |
| ≥ 5 | kritisch |

- Zeigt **wie viel** die Detektive wissen — nie *was* oder *woher*
  (kein Info-Leak; Detektivpositionen sieht der Ganove ohnehin).
- Erzeugt Timing-Druck für Aktionen und den Polizeifunk-Einsatz.
- Funkstille-Sabotage lässt den Level sichtbar abkühlen — die Belohnung
  wird fühlbar.
- UI: Badge mit Icon + Text (nicht nur Farbe), Sound beim Stufenanstieg.
- Schwellenwerte sind Balancing-Parameter.

## 5. Missionssystem

### 5.1 Aktionspool des Ganoven

- **Diebstähle** (z. B. Schloss, Prinzipalmarkt)
- **Kontakte** (Informanten am Aasee, Hafen) — bieten das Sabotage-Angebot
- **Sabotagen** — *optional*, nur via Informant (§5.4)
- **Fluchtpunkte** (Bahnhof, Hafenpier, Autobahnauffahrt)

### 5.2 Missionsgenerierung (entschieden, OT-08/OT-09)

Varianten: vordefiniert / zufallsgeneriert nach Regeln / spielerdefiniert.

**„Fälle" (entschieden, OT-33):** Vordefinierte Missionen werden als
benannte Szenarien mit Mini-Story ausgeliefert („Diebstahlserie in der
Altstadt", „Der Kurier am Hafen") — als JSON-Missionssets pro Karte.
Dienen Onboarding und Gesellschaftsspiel-Atmosphäre.

**Feste Reihenfolge:** Diebstahl → Kontakt → Binärwahl (Sabotage *oder* Flucht).
Die feste Reihenfolge macht jede Spur zur Prognose — Deduktion statt Reaktion.

**Messbare Generierungskriterien** (per BFS-Distanz auf dem Graphen prüfbar):

| Kriterium | Regel |
|---|---|
| Verteilung | Paardistanz zwischen allen Missionszielen ≥ 3 Kanten; aufeinanderfolgende Ziele 3–8 Kanten |
| Realistische Route | Summe kürzester Wege Start→Diebstahl→Kontakt→Flucht + 3 Aktionsrunden ≤ 18 Züge; mit Sabotage ≤ 22 |
| Fluchtpunkt | ≥ 4 Kanten vom Kontaktziel, ≥ 3 vom Diebstahlziel |
| Sabotageziel | dist(Kontakt→Sabotage) + dist(Sabotage→Flucht) ≤ dist(Kontakt→Flucht) + 4 — der Umweg bleibt klein |

### 5.3 Ausführung der Aktionen (entschieden, OT-10/OT-25)

- **Betreten ≠ Aktion.** Am Zielknoten wählt der Ganove in seiner Phase:
  „Aktion ausführen" (verharren) oder normal weiterziehen.
- Die Aktion kostet die Bewegung der Runde → der Ganove bleibt stehen und
  ist **voll verwundbar** (Fang durch Detektivzug möglich).
- Die Aktion erzeugt **einen exakten Spur-Hinweis** („Einbruch am Schloss
  gemeldet"), sichtbar für die Detektive **vor ihren Zügen derselben Runde**.
- Beim Kontaktziel läuft das Sabotage-Angebot im selben Schritt — keine
  Extra-Runde.
- **Flucht = Sieg bei Ankunft** am freien Fluchtpunkt — keine Aktionsrunde.

### 5.4 Sabotage-Angebot des Informanten (entschieden, OT-01/OT-16)

- Nach der Kontakt-Aktion bietet der Informant dem Ganoven ein Sabotageziel an.
- Der angebotene **Effekt wird zufällig** aus drei Möglichkeiten gezogen:
  - **Kameras deaktivieren** — Kameras fallen für den Rest der Partie aus
  - **Funkstille** — die Ereignisengine liefert N Runden keine Hinweise
  - **Falsche Spur** — die Detektive erhalten irreführende Hinweise
- **Binärwahl:** Der Ganove sieht Sabotageziel und Fluchtpunkt und wählt das
  nächste Ziel — Sabotage annehmen *oder* direkt fliehen, kein Zurück.
- Die Sabotage kostet Umweg + Aktionsrunde + automatische Spur; ihr Effekt
  ist die Belohnung. Risk/Reward-Entscheidung mitten im Spiel.
- Der Kontakt-Hinweis verrät nicht, welche Wahl der Ganove getroffen hat.
- „Verkleidung" bleibt als möglicher vierter Effekt reserviert, aktuell
  nicht Teil des Angebots.

## 6. Detektive (entschieden, OT-04/OT-05)

- **4 Detektive**, gesteuert als eine Einheit — im Prototyp durch **KI**.
  Anzahl ist Balancing-Parameter (Testbereich 3–5).
- **Spielmodi (entschieden, OT-30):**
  - **Ganoven-Perspektive** (Primärmodus): Mensch als Ganove vs. KI-Detektive
  - **Detektiv-Perspektive**: Mensch steuert alle 4 Detektive vs. KI-Ganove —
    die Deduktionsseite des Spiels; nahezu gratis, da der KI-Ganove für den
    Dev-Modus ohnehin gebaut wird
  - **Dev-Modus**: KI-vs.-KI mit Aufzeichnung — Balancing-Werkzeug, nicht „das Spiel"
  - Kein Hot-Seat (verdeckte Ganovenzüge würden am selben Bildschirm leaken)
- **Deduktions-Werkzeuge (entschieden, OT-31)** — die digitale Version der
  Papier-Notizen am Scotland-Yard-Tisch:
  - **Hinweis-Chronik**: alle Hinweise mit Typ, Ort/Zone und Runde
  - **Marker**: Knoten manuell markieren/kommentieren
  - **„Mögliche Positionen"-Overlay**: alle Knoten, die mit den bisherigen
    Hinweisen konsistent sind (wird mit jedem Hinweis eingegrenzt)
  Die KI-Detektive nutzen intern dieselbe Datenstruktur.
- Detektiv-KI braucht keine Brillanz, nur glaubwürdigen Druck — Heuristik:
  auf letzten Hinweis zusteuern + mögliche Positionen eingrenzen.
- Detektive kennen Missionsstruktur und Ziel-Pools, nicht die Zielknoten
  (§1) — Campen auf Zielen ist strukturell ausgeschlossen.

## 7. Spielende (entschieden, OT-03/OT-24/OT-25/OT-09)

Das Spiel endet, wenn:

- **Fang:** Ein Detektiv beendet seinen Zug auf dem Knoten des Ganoven
  (Sofortprüfung nach jedem Detektivzug — Partie endet sofort).
- **Umzingelung:** Der Ganove hat zu Beginn seiner Phase keinen legalen Zug
  und keine ausführbare Aktion → Fang (Zugzwang + besetzte Knoten tabu).
- **Flucht:** Der Ganove erreicht den freien Fluchtpunkt → Sieg des Ganoven.
  Ein besetzter Fluchtpunkt ist nur ein illegales Zugziel — temporär, da die
  Detektive Zugzwang haben.
- **Zeitlimit (einstellbar):** Ablauf ohne Flucht → Sieg der Detektive.
  Jede Karte liefert einen **Vorschlagswert** (Münster: 30 Runden), der im
  Menü überschrieben werden kann — einschließlich **„unbegrenzt"**: Dann
  zählt nur noch Fang oder Flucht. Zugzwang und das wachsende
  Hinweisnetz halten auch unbegrenzte Partien unter Druck; die Detektive
  verlieren lediglich die Zeitgewinn-Bedingung.
- **Remis (entschieden, OT-29):** Wird eine Partie vorzeitig beendet, kann
  ein **Unentschieden angeboten** werden — sie zählt in der Statistik als
  Remis, nicht als Sieg/Niederlage. (Multiplayer später: erfordert
  beidseitige Zustimmung.)

## 8. Weitere Städte (entschieden, OT-18)

- Architektur von Anfang an **Multi-Stadt-fähig** (Kartenpaket-Format +
  `loadMap(id)`); Orte, Kategorien, Startregeln und Balancing-Defaults sind
  Eigenschaften des Kartenpakets, nie hartkodiert.
- **Prototyp-Scope:** 1 fertige Karte (Münster) + **Lübeck-Altstadtinsel als
  unbalancierte Validierungskarte**, um den Loader gegen zwei echte Pakete
  zu testen. Karten-Auswahlmenü zeigt weitere Städte als „in Vorbereitung".
- **Kriterien für geeignete Städte:** kompakter Kern (Ø 2–4 km) mit
  8–15 benannten Orten, natürliche Barrieren/Chokepoints (Fluss, Hafen,
  Ring, Insel), wenige Randknoten als Fluchtpunkte, Wiedererkennbarkeit.
- **Kandidaten:** Lübeck (Altstadtinsel, Brücken = Chokepoints), Köln (Dom,
  Rheinbrücken, Ring), Hamburg (nur Teilgraph Innenstadt/HafenCity),
  Freiburg/Heidelberg/Bamberg (kleine Karten), später Amsterdam, Salzburg,
  Edinburgh.
- OSM-Extraktion (Overpass/OSMnx) bleibt als späteres Werkzeug dokumentiert —
  Prototyp baut Karten **handgefertigt** auf Basis der echten Topografie
  (volle Designkontrolle über Dichte, Chokepoints, Kameratauglichkeit).
