/**
 * Mission selection (spec `01-spielkonzept.md` section 5.2): a
 * predefined "Fall" from the map's mission set (name + mini story),
 * a generated random mission, a player-defined mission built on the
 * map (category-restricted picks + `validateCustomTargets`), or no
 * mission at all. Maps without a bundled set simply don't offer cases.
 */
import { useState } from "react";
import { t, type TranslationKey } from "../i18n";
import { hasMissionSet, loadMissionSet } from "../logic/MissionLoader";
import {
  nodesByCategory,
  validateCustomTargets,
  type MissionTargets,
} from "../logic/MissionSystem";
import { buildGraph } from "../logic/Graph";
import type { MapPack, NodeCategory } from "../logic/mapPack";
import type { MissionOption } from "../state/gameStore";
import { MapGraph } from "./MapGraph";
import shared from "./GanoveScreen.module.css";
import styles from "./Menu.module.css";

export interface MissionSelectProps {
  map: MapPack;
  onBack: () => void;
  onSelect: (mission: MissionOption) => void;
}

type View = "choose" | "cases" | "custom";

type CustomStep = "diebstahl" | "kontakt" | "flucht" | "sabotage";
const CUSTOM_STEPS: readonly CustomStep[] = ["diebstahl", "kontakt", "flucht", "sabotage"];

const STEP_LABEL: Record<CustomStep, TranslationKey> = {
  diebstahl: "mission.custom.pick.diebstahl",
  kontakt: "mission.custom.pick.kontakt",
  flucht: "mission.custom.pick.flucht",
  sabotage: "mission.custom.pick.sabotage",
};

const CRITERIA_KEY: Record<string, TranslationKey> = {
  min_gap: "mission.custom.error.min_gap",
  max_gap: "mission.custom.error.max_gap",
  flucht_kontakt_gap: "mission.custom.error.flucht_kontakt_gap",
  flucht_diebstahl_gap: "mission.custom.error.flucht_diebstahl_gap",
  sabotage_detour: "mission.custom.error.sabotage_detour",
  route_budget: "mission.custom.error.route_budget",
  route_budget_sabotage: "mission.custom.error.route_budget_sabotage",
};

/**
 * `validateCustomTargets` returns machine-readable findings
 * (`criteria:<code>` pairs and category errors). The criteria codes map
 * to readable hints; everything else is shown as returned.
 */
function customErrorText(error: string): string {
  const criteria = error.match(/^criteria: ([a-z_]+)/);
  if (criteria !== null && criteria[1] in CRITERIA_KEY) {
    return t(CRITERIA_KEY[criteria[1]]);
  }
  if (error.startsWith("targets:")) {
    return t("mission.custom.error.duplicate");
  }
  return error;
}

function CustomMissionPicker({
  map,
  onDone,
}: {
  map: MapPack;
  onDone: (targets: MissionTargets) => void;
}) {
  const [picks, setPicks] = useState<Partial<Record<CustomStep, string>>>({});
  const step = CUSTOM_STEPS.find((kind) => picks[kind] === undefined) ?? null;
  const targets: MissionTargets | null =
    picks.diebstahl !== undefined && picks.kontakt !== undefined && picks.flucht !== undefined
      ? {
          diebstahl: picks.diebstahl,
          kontakt: picks.kontakt,
          flucht: picks.flucht,
          sabotage: picks.sabotage !== undefined && picks.sabotage !== "" ? picks.sabotage : null,
        }
      : null;
  // Kategorien sind über die Selektion erzwungen; die Kriterienprüfung
  // läuft gegen `start: null` (spawnunabhängige Anteile + Restbudget),
  // der echte Start wird im Spawn-Flow zusätzlich erzwungen.
  const errors = targets === null ? [] : validateCustomTargets(map, buildGraph(map), targets, null);

  const pickable = (kind: NodeCategory) => nodesByCategory(map, kind);

  return (
    <div data-testid="custom-mission-picker">
      <p className={shared.hint} data-testid="custom-step">
        {step !== null ? t(STEP_LABEL[step]) : t("mission.custom.done")}
      </p>
      <MapGraph
        map={map}
        selectableNodeIds={step !== null ? pickable(step) : []}
        missionTargets={targets ?? picks}
        showCategories
        onNodeSelect={(nodeId) => {
          if (step === null) {
            return;
          }
          setPicks((current) => ({ ...current, [step]: nodeId }));
        }}
      />
      {errors.length > 0 ? (
        <ul className={styles.errorList} data-testid="custom-errors">
          {errors.map((error) => (
            <li key={error}>{customErrorText(error)}</li>
          ))}
        </ul>
      ) : null}
      <div className={styles.actions}>
        {step === "sabotage" ? (
          <button
            type="button"
            className={shared.secondaryButton}
            data-testid="custom-skip-sabotage"
            onClick={() => setPicks((current) => ({ ...current, sabotage: "" }))}
          >
            {t("mission.custom.skipSabotage")}
          </button>
        ) : null}
        <button
          type="button"
          className={shared.primaryButton}
          data-testid="custom-confirm"
          disabled={targets === null || errors.length > 0}
          onClick={() => {
            if (targets !== null) {
              onDone(targets);
            }
          }}
        >
          {t("mission.custom.confirm")}
        </button>
      </div>
    </div>
  );
}

export function MissionSelect({ map, onBack, onSelect }: MissionSelectProps) {
  const [view, setView] = useState<View>("choose");
  const cases = hasMissionSet(map.id) ? loadMissionSet(map).cases : [];

  return (
    <div className={shared.screen} data-testid="mission-select">
      <header className={shared.header}>
        <h1 className={shared.title}>{t("missionselect.title", { map: map.name })}</h1>
        <p className={shared.subtitle}>{t("missionselect.subtitle")}</p>
      </header>
      <section className={shared.panel}>
        {view === "choose" ? (
          <div className={styles.cardGrid}>
            {cases.length > 0 ? (
              <button
                type="button"
                className={styles.card}
                data-testid="mission-case"
                onClick={() => setView("cases")}
              >
                <span className={styles.cardTitle}>{t("mission.case")}</span>
                <span className={styles.cardText}>{t("mission.caseHint")}</span>
              </button>
            ) : null}
            <button
              type="button"
              className={styles.card}
              data-testid="mission-random"
              onClick={() => onSelect("random")}
            >
              <span className={styles.cardTitle}>{t("mission.random")}</span>
              <span className={styles.cardText}>{t("mission.randomHint")}</span>
            </button>
            <button
              type="button"
              className={styles.card}
              data-testid="mission-custom"
              onClick={() => setView("custom")}
            >
              <span className={styles.cardTitle}>{t("mission.custom")}</span>
              <span className={styles.cardText}>{t("mission.customHint")}</span>
            </button>
            <button
              type="button"
              className={styles.card}
              data-testid="mission-none"
              onClick={() => onSelect("none")}
            >
              <span className={styles.cardTitle}>{t("mission.noneOption")}</span>
              <span className={styles.cardText}>{t("mission.noneOptionHint")}</span>
            </button>
          </div>
        ) : null}
        {view === "cases" ? (
          <div className={styles.cardGrid} data-testid="case-list">
            {cases.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={styles.card}
                data-testid={`case-${entry.id}`}
                onClick={() => onSelect({ type: "case", id: entry.id })}
              >
                <span className={styles.cardTitle}>{entry.name}</span>
                <span className={styles.story}>{entry.story}</span>
              </button>
            ))}
          </div>
        ) : null}
        {view === "custom" ? (
          <CustomMissionPicker
            map={map}
            onDone={(targets) =>
              onSelect({
                type: "custom",
                targets: {
                  diebstahl: targets.diebstahl,
                  kontakt: targets.kontakt,
                  flucht: targets.flucht,
                  sabotage: targets.sabotage ?? undefined,
                },
              })
            }
          />
        ) : null}
        <div className={styles.actions}>
          <button
            type="button"
            className={shared.secondaryButton}
            onClick={() => (view === "choose" ? onBack() : setView("choose"))}
          >
            {t("menu.back")}
          </button>
        </div>
      </section>
    </div>
  );
}
