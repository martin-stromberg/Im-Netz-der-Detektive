/**
 * Ganove-side mission panel (spec section 6): the fixed step order
 * Diebstahl → Kontakt → (Sabotage) → Flucht with per-step status, the
 * current target as a clear node name, and — while
 * `mission.pendingChoice` is set — the informant's final binary choice
 * between the sabotage detour and heading straight for the escape.
 */
import type { Mission } from "../state/gameStore";
import type { MissionKind, MissionStage } from "../logic/MissionSystem";
import type { SabotageEffect } from "../logic/mapPack";
import { t, type TranslationKey } from "../i18n";
import styles from "./MissionPanel.module.css";

export interface MissionPanelProps {
  mission: Mission | null;
  /** Resolves a node id to its clear name for display. */
  nodeName: (nodeId: string) => string;
  onChooseMissionPath?: (choice: "sabotage" | "flucht") => void;
}

type StepStatus = "erledigt" | "aktuell" | "offen";

const STEP_ORDER: Record<MissionStage, number> = {
  diebstahl: 0,
  kontakt: 1,
  wahl: 2,
  sabotage: 3,
  flucht: 4,
};

const STEP_INDEX: Record<MissionKind, number> = {
  diebstahl: 0,
  kontakt: 1,
  sabotage: 3,
  flucht: 4,
};

function stepStatus(kind: MissionKind, stage: MissionStage): StepStatus {
  const cursor = STEP_ORDER[stage];
  const index = STEP_INDEX[kind];
  if (index < cursor) {
    return "erledigt";
  }
  // During "wahl" nothing is "aktuell" — the choice itself is pending.
  if (index === cursor && stage !== "wahl") {
    return "aktuell";
  }
  return "offen";
}

/**
 * The node the ganove currently needs to reach (outside `wahl`) —
 * shared with `GanoveScreen` for the map highlight. Kept here because
 * it is part of the mission panel's display contract.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function currentMissionTarget(mission: Mission | null): string | null {
  if (mission === null) {
    return null;
  }
  switch (mission.stage) {
    case "diebstahl":
      return mission.targets.diebstahl;
    case "kontakt":
      return mission.targets.kontakt;
    case "sabotage":
      return mission.targets.sabotage;
    case "flucht":
      return mission.targets.flucht;
    default:
      return null;
  }
}

const STEP_KEY: Record<MissionKind, TranslationKey> = {
  diebstahl: "mission.step.diebstahl",
  kontakt: "mission.step.kontakt",
  sabotage: "mission.step.sabotage",
  flucht: "mission.step.flucht",
};

const EFFECT_KEY: Record<SabotageEffect, TranslationKey> = {
  kamera_aus: "effect.kamera_aus",
  funkstille: "effect.funkstille",
  falsche_spur: "effect.falsche_spur",
};

const STATUS_MARKER: Record<StepStatus, string> = {
  erledigt: "✓",
  aktuell: "▶",
  offen: "○",
};

export function MissionPanel({ mission, nodeName, onChooseMissionPath }: MissionPanelProps) {
  if (mission === null) {
    return (
      <section className={styles.panel} aria-label={t("mission.title")}>
        <h2 className={styles.heading}>{t("mission.title")}</h2>
        <p className={styles.hint}>{t("mission.none")}</p>
      </section>
    );
  }

  const steps: MissionKind[] =
    mission.targets.sabotage !== null
      ? ["diebstahl", "kontakt", "sabotage", "flucht"]
      : ["diebstahl", "kontakt", "flucht"];
  const targetId = currentMissionTarget(mission);
  const pending = mission.pendingChoice;

  return (
    <section className={styles.panel} aria-label={t("mission.title")}>
      <h2 className={styles.heading}>{t("mission.title")}</h2>
      <ol className={styles.steps}>
        {steps.map((kind) => {
          const status = stepStatus(kind, mission.stage);
          return (
            <li
              key={kind}
              className={`${styles.step} ${styles[`status_${status}`]}`}
              data-mission-step={kind}
              data-step-status={status}
            >
              <span className={styles.stepMarker} aria-hidden="true">
                {STATUS_MARKER[status]}
              </span>
              <span>{t(STEP_KEY[kind])}</span>
            </li>
          );
        })}
      </ol>
      {targetId !== null && pending === null ? (
        <p className={styles.currentTarget} data-testid="mission-current-target">
          {t("mission.currentTarget", { name: nodeName(targetId) })}
        </p>
      ) : null}
      {pending !== null ? (
        <div className={styles.choice} data-testid="mission-choice">
          <p className={styles.choiceTitle}>{t("mission.choice.title")}</p>
          <button
            type="button"
            className={styles.choiceButton}
            data-choice="sabotage"
            onClick={() => onChooseMissionPath?.("sabotage")}
          >
            {t("mission.choice.sabotage", {
              effect: t(EFFECT_KEY[pending.effect]),
              node: nodeName(pending.sabotageNode),
            })}
          </button>
          <button
            type="button"
            className={styles.choiceButton}
            data-choice="flucht"
            onClick={() => onChooseMissionPath?.("flucht")}
          >
            {t("mission.choice.flucht", { node: nodeName(mission.targets.flucht) })}
          </button>
          <p className={styles.hint}>{t("mission.choice.final")}</p>
        </div>
      ) : null}
    </section>
  );
}
