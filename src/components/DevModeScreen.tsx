/**
 * Dev mode (spec `01-spielkonzept.md` section 6 "Dev-Modus",
 * OT-30): an AI-vs-AI batch trigger with recording — a balancing tool,
 * not "the game". The UI runs `runAiBatch` + `summarizeBatch` on the
 * chosen map and shows the outcome distribution plus the aggregated
 * metrics. Every finished game lands in the `Recorder` FIFO
 * automatically, so batches double as recorded material for the later
 * replay step.
 */
import { useState } from "react";
import { t, type TranslationKey } from "../i18n";
import { runAiBatch, summarizeBatch, type BatchSummary } from "../logic/AiSimulation";
import { listMapIds, loadMap } from "../logic/MapLoader";
import shared from "./GanoveScreen.module.css";
import styles from "./Menu.module.css";

export interface DevModeScreenProps {
  mapId: string;
  onBack: () => void;
}

const BATCH_SIZES = [5, 10, 25] as const;

const OUTCOME_KEY: Record<string, TranslationKey> = {
  caught: "outcome.caught",
  surrounded: "outcome.surrounded",
  escaped: "outcome.escaped",
  timeout: "outcome.timeout",
  draw: "outcome.draw",
};

export function DevModeScreen({ mapId, onBack }: DevModeScreenProps) {
  const mapIds = listMapIds();
  const [selectedMap, setSelectedMap] = useState(mapIds.includes(mapId) ? mapId : mapIds[0]);
  const [batchSize, setBatchSize] = useState<number>(BATCH_SIZES[0]);
  const [seed, setSeed] = useState(1);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBatch = () => {
    setRunning(true);
    setError(null);
    setSummary(null);
    try {
      const map = loadMap(selectedMap);
      const seeds = Array.from({ length: batchSize }, (_, i) => seed + i);
      setSummary(summarizeBatch(runAiBatch(map, seeds)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={shared.screen} data-testid="devmode-screen">
      <header className={shared.header}>
        <h1 className={shared.title}>{t("dev.title")}</h1>
        <p className={shared.subtitle}>{t("dev.subtitle")}</p>
      </header>
      <section className={shared.panel}>
        <div className={styles.fieldGrid}>
          <label className={styles.fieldLabel} htmlFor="dev-map">
            {t("dev.map")}
          </label>
          <select
            id="dev-map"
            className={styles.selectInput}
            data-testid="dev-map"
            value={selectedMap}
            onChange={(event) => setSelectedMap(event.target.value)}
          >
            {mapIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <label className={styles.fieldLabel} htmlFor="dev-batch">
            {t("dev.batchSize")}
          </label>
          <select
            id="dev-batch"
            className={styles.selectInput}
            data-testid="dev-batch"
            value={batchSize}
            onChange={(event) => setBatchSize(Number(event.target.value))}
          >
            {BATCH_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <label className={styles.fieldLabel} htmlFor="dev-seed">
            {t("dev.seed")}
          </label>
          <input
            id="dev-seed"
            type="number"
            className={styles.numberInput}
            data-testid="dev-seed"
            min={0}
            step={1}
            value={seed}
            onChange={(event) => setSeed(Number(event.target.value))}
          />
        </div>
        <div className={styles.actions}>
          <button type="button" className={shared.secondaryButton} onClick={onBack}>
            {t("menu.back")}
          </button>
          <button
            type="button"
            className={shared.primaryButton}
            data-testid="dev-run"
            disabled={running}
            onClick={runBatch}
          >
            {running ? t("dev.running") : t("dev.run")}
          </button>
        </div>
        {error !== null ? <p className={shared.notice}>{error}</p> : null}
        {summary !== null ? (
          <div data-testid="dev-summary">
            <table className={styles.summaryTable}>
              <thead>
                <tr>
                  <th>{t("dev.outcome")}</th>
                  <th>{t("dev.count")}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.outcomes).map(([outcome, count]) => (
                  <tr key={outcome} data-outcome={outcome}>
                    <td>{t(OUTCOME_KEY[outcome] ?? "outcome.draw")}</td>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={shared.hint} data-testid="dev-metrics">
              {t("dev.metrics", {
                avgRounds: summary.avgRounds.toFixed(1),
                minRounds: summary.minRounds,
                maxRounds: summary.maxRounds,
                avgHints: summary.avgHints.toFixed(1),
                avgCameras: summary.avgCamerasTriggered.toFixed(1),
                radioRate: (summary.radioUsageRate * 100).toFixed(0),
              })}
            </p>
            <p className={shared.hint}>{t("dev.recorded")}</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
