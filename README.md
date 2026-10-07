# Im Netz der Detektive

Ein asymmetrisches Verfolgungsspiel als Computerspiel — angelehnt an
Hidden-Movement-Klassiker wie *Scotland Yard*: Ein verdeckter **Ganove**
zieht durch ein Wegenetz aus echten Münster-Orten und erfüllt eine
Mission (Diebstahl → Informant → Flucht), während **Detektive** ihn
anhand von Kameras, Zeugenhinweisen und Ereignissen eingrenzen.

Geplant als Browser-Spiel (React + TypeScript + Vite), prototypisch als
Singleplayer: Mensch als Ganove gegen KI-Detektive — oder umgekehrt.

## Konzept

Das vollständige, entschiedene Spielkonzept liegt als Markdown-Sammlung
unter [`docs/konzept/`](docs/konzept/content/00-uebersicht.md).
Ansehen im Browser:

```
start-docs.bat          → http://localhost:8899
```

oder manuell:

```
cd docs/konzept && python -m http.server 8899
```

Enthalten: Spielregeln, Kartenpaket-Format (weitere Städte möglich),
Technik-Konzept, Balancing-Startwerte und ein Archiv aller
Design-Entscheidungen.

## Lizenz

[PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0)
— siehe [LICENSE](LICENSE).

Private und nicht-kommerzielle Nutzung ist frei (Studium, Hobby,
private Unterhaltung). **Kommerzielle Nutzung erfordert eine
gesonderte Lizenzierung.**
