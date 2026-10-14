/**
 * Main menu (spec `02-technisches-konzept.md` section 6): the entry
 * point of the application frame. "Neue Partie" starts the
 * map→mode→settings→mission flow; "Partie fortsetzen" and
 * "Statistiken/Replays" are wired to the `GameIndex` entry structures
 * — resume lists the saved mid-game entries, stats lists the recorded
 * games kept by `Recorder`.
 */
import { t } from "../i18n";
import { listResumeEntries } from "../logic/GameIndex";
import type { MenuScreen } from "./menuFlow";
import shared from "./GanoveScreen.module.css";
import styles from "./Menu.module.css";
import titleArt from "../assets/title-noir.jpg";

export interface MainMenuProps {
  onNavigate: (screen: MenuScreen) => void;
}

export function MainMenu({ onNavigate }: MainMenuProps) {
  // "Partie speichern" in the game screens writes resume entries —
  // the button activates as soon as a valid save exists.
  const resumable = listResumeEntries().length > 0;
  return (
    <div className={shared.screen} data-testid="main-menu">
      <header className={shared.header}>
        <img
          className={styles.cardImage}
          src={titleArt}
          alt={t("menu.titleArtAlt")}
          data-testid="menu-title-art"
        />
        <h1 className={shared.title}>{t("app.title")}</h1>
        <p className={shared.subtitle}>{t("app.subtitle")}</p>
      </header>
      <section className={shared.panel} aria-label={t("menu.title")}>
        <div className={styles.menuList}>
          <button
            type="button"
            className={shared.primaryButton}
            data-testid="menu-new-game"
            onClick={() => onNavigate("map")}
          >
            {t("menu.newGame")}
          </button>
          <button
            type="button"
            className={shared.secondaryButton}
            data-testid="menu-resume"
            disabled={!resumable}
            title={t("menu.resumeHint")}
            onClick={() => onNavigate("resume")}
          >
            {t("menu.resume")}
          </button>
          {!resumable ? (
            <p className={shared.hint} data-testid="menu-resume-hint">
              {t("menu.resumeHint")}
            </p>
          ) : null}
          <button
            type="button"
            className={shared.secondaryButton}
            data-testid="menu-stats"
            onClick={() => onNavigate("stats")}
          >
            {t("menu.stats")}
          </button>
        </div>
      </section>
    </div>
  );
}
