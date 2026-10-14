/**
 * Mode selection after the map pick: the two playable perspectives
 * (ganove vs. AI detectives, detectives vs. AI ganove) and the
 * developer mode — an AI-vs-AI batch run with recording, marked as a
 * balancing tool rather than "the game" (spec section 6, OT-30).
 */
import { t } from "../i18n";
import type { PlayerMode } from "./menuFlow";
import shared from "./GanoveScreen.module.css";
import styles from "./Menu.module.css";

export interface ModeSelectProps {
  mapName: string;
  onBack: () => void;
  onSelect: (mode: PlayerMode | "dev") => void;
}

export function ModeSelect({ mapName, onBack, onSelect }: ModeSelectProps) {
  return (
    <div className={shared.screen} data-testid="mode-select-screen">
      <header className={shared.header}>
        <h1 className={shared.title}>{t("modeselect.title", { map: mapName })}</h1>
      </header>
      <section className={shared.panel}>
        <div className={styles.cardGrid}>
          <button
            type="button"
            className={styles.card}
            data-testid="mode-ganove"
            onClick={() => onSelect("ganove")}
          >
            <span className={styles.cardTitle}>{t("mode.ganove")}</span>
            <span className={styles.cardText}>{t("mode.ganoveHint")}</span>
          </button>
          <button
            type="button"
            className={styles.card}
            data-testid="mode-detektiv"
            onClick={() => onSelect("detektiv")}
          >
            <span className={styles.cardTitle}>{t("mode.detektiv")}</span>
            <span className={styles.cardText}>{t("mode.detektivHint")}</span>
          </button>
          <button
            type="button"
            className={styles.card}
            data-testid="mode-dev"
            onClick={() => onSelect("dev")}
          >
            <span className={styles.badge}>{t("mode.devBadge")}</span>
            <span className={styles.cardTitle}>{t("mode.dev")}</span>
            <span className={styles.cardText}>{t("mode.devHint")}</span>
          </button>
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
