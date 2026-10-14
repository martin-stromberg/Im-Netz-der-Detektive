/**
 * Map selection: cards for the playable map packages (name + tagline +
 * optional key art) and disabled "in Vorbereitung" placeholders for
 * announced-but-unbuilt cities. The playable list is curated
 * (`MENU_MAP_IDS`) — dev fixtures like `teststadt` never appear here.
 */
import { resolveText, t } from "../i18n";
import { loadMap } from "../logic/MapLoader";
import { MapValidationError, type MapPack } from "../logic/mapPack";
import { FORTHCOMING_MAP_IDS, MENU_MAP_IDS } from "./menuFlow";
import shared from "./GanoveScreen.module.css";
import styles from "./Menu.module.css";
import artMuenster from "../assets/map-muenster.jpg";
import artLuebeck from "../assets/map-luebeck.jpg";

const MAP_ART: Record<string, string> = {
  muenster: artMuenster,
  luebeck: artLuebeck,
};

const FORTHCOMING_KEY: Record<string, "map.forthcoming.hamburg" | "map.forthcoming.koeln"> = {
  hamburg: "map.forthcoming.hamburg",
  koeln: "map.forthcoming.koeln",
};

export interface MapSelectProps {
  onBack: () => void;
  onSelect: (map: MapPack) => void;
}

export function MapSelect({ onBack, onSelect }: MapSelectProps) {
  const maps = MENU_MAP_IDS.map((id) => {
    try {
      return loadMap(id);
    } catch (error) {
      if (error instanceof MapValidationError) {
        return null;
      }
      throw error;
    }
  }).filter((map): map is MapPack => map !== null);

  return (
    <div className={shared.screen} data-testid="map-select">
      <header className={shared.header}>
        <h1 className={shared.title}>{t("mapselect.title")}</h1>
        <p className={shared.subtitle}>{t("mapselect.subtitle")}</p>
      </header>
      <section className={shared.panel}>
        <div className={styles.cardGrid}>
          {maps.map((map) => (
            <button
              key={map.id}
              type="button"
              className={styles.card}
              data-testid={`map-card-${map.id}`}
              onClick={() => onSelect(map)}
            >
              {MAP_ART[map.id] !== undefined ? (
                <img className={styles.cardImage} src={MAP_ART[map.id]} alt={map.name} />
              ) : null}
              <span className={styles.cardTitle}>{map.name}</span>
              <span className={styles.cardText}>
                {resolveText(map.taglineKey, map.tagline ?? "")}
              </span>
            </button>
          ))}
          {FORTHCOMING_MAP_IDS.map((id) => (
            <button
              key={id}
              type="button"
              className={styles.card}
              data-testid={`map-card-${id}`}
              disabled
            >
              <span className={styles.badge}>{t("map.forthcoming.badge")}</span>
              <span className={styles.cardTitle}>{t(FORTHCOMING_KEY[id])}</span>
              <span className={styles.cardText}>{t("map.forthcoming.hint")}</span>
            </button>
          ))}
        </div>
        <div className={styles.actions}>
          <button type="button" className={shared.secondaryButton} onClick={onBack}>
            {t("menu.back")}
          </button>
        </div>
      </section>
    </div>
  );
}
