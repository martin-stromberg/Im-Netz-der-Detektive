/**
 * Statistics / replays view (spec `02-technisches-konzept.md` section
 * 8.1): aggregated metrics over the recorded games kept by the
 * `Recorder` FIFO — win rate per side and per played mode, average
 * game length, hints per game, camera hits — plus per-log management:
 * replay, export (Blob download) and delete; "Alle löschen" clears the
 * store after a confirmation step.
 */
import { useState } from "react";
import { t, type TranslationKey } from "../i18n";
import { summarizeLog, type GameSummary } from "../logic/GameIndex";
import {
  clearGameLogs,
  deleteGameLog,
  exportGameLog,
  listGameLogs,
  parseLog,
} from "../logic/Recorder";
import { aggregateStatistics, type StatsBucket } from "../logic/Statistics";
import type { LogEntry } from "../state/gameStore";
import shared from "./GanoveScreen.module.css";
import styles from "./Menu.module.css";

export interface StatsScreenProps {
  onBack: () => void;
  /** Opens the replay player for the given JSONL log. */
  onReplay: (jsonl: string) => void;
}

const OUTCOME_KEY: Record<string, TranslationKey> = {
  caught: "stats.outcome.caught",
  surrounded: "stats.outcome.surrounded",
  escaped: "stats.outcome.escaped",
  timeout: "stats.outcome.timeout",
  draw: "stats.outcome.draw",
};

const MODE_KEY: Record<string, TranslationKey> = {
  ganove: "stats.mode.ganove",
  detektiv: "stats.mode.detektiv",
  unbekannt: "stats.mode.unbekannt",
};

/** Formats a rate as percent, `—` when the group is empty. */
function rateText(rate: number | null): string {
  return rate === null ? "—" : `${(rate * 100).toFixed(0)} %`;
}

/** Formats an average with one decimal, `—` when the group is empty. */
function avgText(avg: number | null): string {
  return avg === null ? "—" : avg.toFixed(1);
}

function BucketPanel({
  label,
  bucket,
  testid,
}: {
  label: string;
  bucket: StatsBucket;
  testid: string;
}) {
  return (
    <div className={styles.statBox} data-testid={testid}>
      <h3 className={styles.statHeading}>{label}</h3>
      <dl className={styles.statList}>
        <dt>{t("stats.games")}</dt>
        <dd data-field="games">{bucket.games}</dd>
        <dt>{t("stats.winGanove")}</dt>
        <dd data-field="winGanove">{rateText(bucket.winRateGanove)}</dd>
        <dt>{t("stats.winDetectives")}</dt>
        <dd data-field="winDetectives">{rateText(bucket.winRateDetectives)}</dd>
        <dt>{t("stats.draws")}</dt>
        <dd data-field="draws">{bucket.draws}</dd>
        <dt>{t("stats.avgRounds")}</dt>
        <dd data-field="avgRounds">{avgText(bucket.avgRounds)}</dd>
        <dt>{t("stats.avgHints")}</dt>
        <dd data-field="avgHints">{avgText(bucket.avgHints)}</dd>
        <dt>{t("stats.avgCameras")}</dt>
        <dd data-field="avgCameras">{avgText(bucket.avgCameras)}</dd>
      </dl>
    </div>
  );
}

/** One listed game log plus its position in the FIFO store. */
interface LogRow {
  storageIndex: number;
  jsonl: string;
  summary: GameSummary;
}

export function StatsScreen({ onBack, onReplay }: StatsScreenProps) {
  // `listGameLogs` is oldest → newest; the table shows newest first and
  // each row keeps its storage index for `deleteGameLog`/`exportGameLog`.
  const [logs, setLogs] = useState<string[]>(() => listGameLogs());
  const [confirmClear, setConfirmClear] = useState(false);
  const rows: LogRow[] = logs
    .map((jsonl, storageIndex) => ({ storageIndex, jsonl, summary: summarizeLog(jsonl) }))
    .filter((row): row is LogRow & { summary: GameSummary } => row.summary !== null)
    .reverse();
  const stats = aggregateStatistics(logs);

  const reload = () => setLogs(listGameLogs());

  const removeLog = (storageIndex: number) => {
    deleteGameLog(storageIndex);
    reload();
  };

  const exportLog = (row: LogRow) => {
    exportGameLog(parseLog(row.jsonl) as LogEntry[]);
  };

  const openReplay = (row: LogRow) => {
    onReplay(row.jsonl);
  };

  return (
    <div className={shared.screen} data-testid="stats-screen">
      <header className={shared.header}>
        <h1 className={shared.title}>{t("stats.title")}</h1>
        <p className={shared.subtitle}>{t("stats.subtitle")}</p>
      </header>
      <section className={shared.panel}>
        <h2 className={shared.panelHeading}>{t("stats.summary.title")}</h2>
        <div className={styles.statGrid} data-testid="stats-summary">
          <BucketPanel label={t("stats.summary.total")} bucket={stats.total} testid="stats-total" />
          {(Object.keys(stats.byMode) as (keyof typeof stats.byMode)[]).map((mode) => (
            <BucketPanel
              key={mode}
              label={t(MODE_KEY[mode])}
              bucket={stats.byMode[mode]}
              testid={`stats-mode-${mode}`}
            />
          ))}
        </div>
      </section>
      <section className={shared.panel}>
        <h2 className={shared.panelHeading}>{t("stats.logs.title")}</h2>
        {rows.length === 0 ? (
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
                <th>{t("stats.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.storageIndex} data-log-row={row.storageIndex}>
                  <td>{row.summary.gameId ?? "?"}</td>
                  <td>{row.summary.mapId ?? "?"}</td>
                  <td>{row.summary.seed ?? "?"}</td>
                  <td data-outcome={row.summary.outcome ?? "none"}>
                    {row.summary.outcome !== null ? t(OUTCOME_KEY[row.summary.outcome]) : "—"}
                  </td>
                  <td>{row.summary.rounds}</td>
                  <td>
                    <button
                      type="button"
                      className={shared.secondaryButton}
                      data-testid={`log-replay-${row.storageIndex}`}
                      onClick={() => openReplay(row)}
                    >
                      {t("stats.action.replay")}
                    </button>{" "}
                    <button
                      type="button"
                      className={shared.secondaryButton}
                      data-testid={`log-export-${row.storageIndex}`}
                      onClick={() => exportLog(row)}
                    >
                      {t("stats.action.export")}
                    </button>{" "}
                    <button
                      type="button"
                      className={shared.secondaryButton}
                      data-testid={`log-delete-${row.storageIndex}`}
                      onClick={() => removeLog(row.storageIndex)}
                    >
                      {t("stats.action.delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {rows.length > 0 ? (
          confirmClear ? (
            <div className={shared.confirm} data-testid="stats-clear-confirm">
              <p className={shared.hint}>{t("stats.action.deleteConfirm")}</p>
              <button
                type="button"
                className={shared.dangerButton}
                data-testid="stats-clear-yes"
                onClick={() => {
                  clearGameLogs();
                  setConfirmClear(false);
                  reload();
                }}
              >
                {t("abort.yes")}
              </button>
              <button
                type="button"
                className={shared.secondaryButton}
                onClick={() => setConfirmClear(false)}
              >
                {t("abort.no")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={shared.secondaryButton}
              data-testid="stats-clear-all"
              onClick={() => setConfirmClear(true)}
            >
              {t("stats.action.deleteAll")}
            </button>
          )
        ) : null}
        <div className={styles.actions}>
          <button type="button" className={shared.secondaryButton} onClick={onBack}>
            {t("menu.back")}
          </button>
        </div>
      </section>
    </div>
  );
}
