/**
 * Statistics / replays view: lists the recorded games from the
 * `Recorder` FIFO as `GameSummary` entries (map, seed, outcome,
 * rounds). Replay playback itself is scheduled for the persistence
 * step — the entry structure and the list are already here.
 */
import { t, type TranslationKey } from "../i18n";
import { listGameSummaries } from "../logic/GameIndex";
import shared from "./GanoveScreen.module.css";
import styles from "./Menu.module.css";

export interface StatsScreenProps {
  onBack: () => void;
}

const OUTCOME_KEY: Record<string, TranslationKey> = {
  caught: "stats.outcome.caught",
  surrounded: "stats.outcome.surrounded",
  escaped: "stats.outcome.escaped",
  timeout: "stats.outcome.timeout",
  draw: "stats.outcome.draw",
};

export function StatsScreen({ onBack }: StatsScreenProps) {
  const summaries = listGameSummaries();
  return (
    <div className={shared.screen} data-testid="stats-screen">
      <header className={shared.header}>
        <h1 className={shared.title}>{t("stats.title")}</h1>
        <p className={shared.subtitle}>{t("stats.subtitle")}</p>
      </header>
      <section className={shared.panel}>
        {summaries.length === 0 ? (
          <p className={shared.hint} data-testid="stats-empty">
            {t("stats.empty")}
          </p>
        ) : (
          <table className={styles.summaryTable} data-testid="stats-table">
            <thead>
              <tr>
                <th>{t("stats.game")}</th>
                <th>{t("stats.map")}</th>
                <th>{t("stats.seed")}</th>
                <th>{t("stats.result")}</th>
                <th>{t("stats.rounds")}</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((entry, index) => (
                <tr key={entry.gameId ?? index}>
                  <td>{entry.gameId ?? "?"}</td>
                  <td>{entry.mapId ?? "?"}</td>
                  <td>{entry.seed ?? "?"}</td>
                  <td data-outcome={entry.outcome ?? "none"}>
                    {entry.outcome !== null ? t(OUTCOME_KEY[entry.outcome]) : "—"}
                  </td>
                  <td>{entry.rounds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className={shared.hint}>{t("stats.replayHint")}</p>
        <div className={styles.actions}>
          <button type="button" className={shared.secondaryButton} onClick={onBack}>
            {t("menu.back")}
          </button>
        </div>
      </section>
    </div>
  );
}
