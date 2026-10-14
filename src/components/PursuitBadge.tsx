/**
 * Pursuit pressure badge ("Verfolgungsdruck") — shows how close the
 * nearest detective is, as icon + text (never colour alone). The four
 * levels mirror `PursuitLevel`; the icon is a shrinking target marker
 * (large ring far away, filled dot imminent) so the state reads
 * without colour perception.
 */
import type { PursuitStatus } from "../logic/Pursuit";
import { t } from "../i18n";
import styles from "./PursuitBadge.module.css";

export interface PursuitBadgeProps {
  status: PursuitStatus;
}

const LEVEL_KEY: Record<
  PursuitStatus["level"],
  "pursuit.ruhig" | "pursuit.spuerbar" | "pursuit.nah" | "pursuit.unmittelbar"
> = {
  ruhig: "pursuit.ruhig",
  spuerbar: "pursuit.spuerbar",
  nah: "pursuit.nah",
  unmittelbar: "pursuit.unmittelbar",
};

const LEVEL_RING: Record<PursuitStatus["level"], { radius: number; filled: boolean }> = {
  ruhig: { radius: 6.5, filled: false },
  spuerbar: { radius: 5, filled: false },
  nah: { radius: 4, filled: false },
  unmittelbar: { radius: 5, filled: true },
};

export function PursuitBadge({ status }: PursuitBadgeProps) {
  const levelText = t(LEVEL_KEY[status.level]);
  const detail = t("pursuit.detail", {
    detective: `D${status.nearestIndex + 1}`,
    distance: status.distance,
  });
  const ring = LEVEL_RING[status.level];
  return (
    <span
      className={`${styles.badge} ${styles[`level_${status.level}`]}`}
      data-pursuit-level={status.level}
      role="status"
      aria-label={`${t("pursuit.label")}: ${levelText} — ${detail}`}
    >
      <svg
        className={styles.icon}
        viewBox="0 0 16 16"
        width="16"
        height="16"
        aria-hidden="true"
        focusable="false"
      >
        {ring.filled ? (
          <circle cx="8" cy="8" r={ring.radius} className={styles.ringLit} />
        ) : (
          <>
            <circle cx="8" cy="8" r={ring.radius} className={styles.ring} />
            <circle cx="8" cy="8" r="1.4" className={styles.dot} />
          </>
        )}
      </svg>
      <span className={styles.text}>
        {t("pursuit.label")}: {levelText} · {detail}
      </span>
    </span>
  );
}
