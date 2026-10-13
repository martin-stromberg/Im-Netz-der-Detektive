/**
 * Heat indicator "Polizeiaufmerksamkeit" (spec section 6): a badge with
 * a level-specific icon AND text — never colour alone (a11y). The four
 * levels mirror `HeatLevel` from the information layer; the icon is a
 * signal-bar meter whose lit bars count the level (1–4), so the state
 * stays readable without colour perception.
 */
import type { HeatLevel } from "../logic/InformationSystem";
import { t } from "../i18n";
import styles from "./HeatBadge.module.css";

export interface HeatBadgeProps {
  level: HeatLevel;
  score?: number;
}

const LEVEL_ORDER: readonly HeatLevel[] = ["ruhig", "aktiv", "erhoeht", "kritisch"];

const LEVEL_KEY: Record<HeatLevel, "heat.ruhig" | "heat.aktiv" | "heat.erhoeht" | "heat.kritisch"> =
  {
    ruhig: "heat.ruhig",
    aktiv: "heat.aktiv",
    erhoeht: "heat.erhoeht",
    kritisch: "heat.kritisch",
  };

export function HeatBadge({ level, score }: HeatBadgeProps) {
  const litBars = LEVEL_ORDER.indexOf(level) + 1;
  return (
    <span
      className={`${styles.badge} ${styles[`level_${level}`]}`}
      data-heat-level={level}
      role="status"
      aria-label={`${t("heat.label")}: ${t(LEVEL_KEY[level])}`}
    >
      <svg
        className={styles.icon}
        viewBox="0 0 16 16"
        width="16"
        height="16"
        aria-hidden="true"
        focusable="false"
      >
        {[0, 1, 2, 3].map((bar) => (
          <rect
            key={bar}
            x={1 + bar * 4}
            y={13 - bar * 3}
            width={3}
            height={3 + bar * 3}
            rx={0.8}
            className={bar < litBars ? styles.barLit : styles.barDim}
          />
        ))}
      </svg>
      <span className={styles.text}>
        {t("heat.label")}: {t(LEVEL_KEY[level])}
        {score !== undefined ? ` (${score})` : ""}
      </span>
    </span>
  );
}
