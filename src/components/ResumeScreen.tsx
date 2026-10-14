/**
 * Resume picker ("Partie fortsetzen", spec `02-technisches-konzept.md`
 * section 8.1): lists the saved mid-game states kept under
 * `RESUME_STORAGE_KEY` with their plain-text identity — map name,
 * played side, round and save time. Picking an entry restores the
 * snapshot via `onResume`; entries can also be deleted.
 */
import { useState } from "react";
import { t } from "../i18n";
import { deleteResumeEntry, listResumeEntries, type ResumeEntry } from "../logic/GameIndex";
import { listMapIds, loadMap } from "../logic/MapLoader";
import shared from "./GanoveScreen.module.css";
import styles from "./Menu.module.css";

export interface ResumeScreenProps {
  onBack: () => void;
  onResume: (entry: ResumeEntry) => void;
}

/** Map display name for an entry — falls back to the raw id. */
function mapName(mapId: string): string {
  if (!listMapIds().includes(mapId)) {
    return mapId;
  }
  try {
    return loadMap(mapId).name;
  } catch {
    return mapId;
  }
}

/** Localized save timestamp; unparsable values show the raw string. */
function savedAtText(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}

export function ResumeScreen({ onBack, onResume }: ResumeScreenProps) {
  const [entries, setEntries] = useState<ResumeEntry[]>(() => listResumeEntries());

  const remove = (gameId: string) => {
    deleteResumeEntry(gameId);
    setEntries(listResumeEntries());
  };

  return (
    <div className={shared.screen} data-testid="resume-screen">
      <header className={shared.header}>
        <h1 className={shared.title}>{t("resume.title")}</h1>
        <p className={shared.subtitle}>{t("resume.subtitle")}</p>
      </header>
      <section className={shared.panel}>
        {entries.length === 0 ? (
          <p className={shared.hint} data-testid="resume-empty">
            {t("resume.empty")}
          </p>
        ) : (
          <ul className={styles.menuList} data-testid="resume-list">
            {entries.map((entry) => (
              <li key={entry.gameId} data-resume-entry={entry.gameId}>
                <button
                  type="button"
                  className={styles.card}
                  data-testid={`resume-load-${entry.gameId}`}
                  onClick={() => onResume(entry)}
                >
                  <span className={styles.cardTitle}>
                    {t("resume.entry", {
                      map: mapName(entry.mapId),
                      mode: t(`resume.mode.${entry.mode}`),
                      round: entry.snapshot.round,
                    })}
                  </span>
                  <span className={styles.cardText}>{savedAtText(entry.savedAt)}</span>
                </button>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={shared.secondaryButton}
                    data-testid={`resume-delete-${entry.gameId}`}
                    onClick={() => remove(entry.gameId)}
                  >
                    {t("resume.delete")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className={styles.actions}>
          <button type="button" className={shared.secondaryButton} onClick={onBack}>
            {t("menu.back")}
          </button>
        </div>
      </section>
    </div>
  );
}
