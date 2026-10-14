/**
 * Transient event banners ("Ereignis-Einblendungen") — the staging
 * layer for ganove-visible happenings: world events, sabotage offers,
 * pursuit escalation and action confirmations appear as a short-lived
 * stack over the map instead of silently changing state. Parent owns
 * the lifecycle (push + timed removal); this component only renders.
 */
import styles from "./EventBanner.module.css";

export type BannerTone = "info" | "warn" | "alarm" | "good";

export interface Banner {
  readonly id: number;
  readonly text: string;
  readonly tone: BannerTone;
}

export interface EventBannerProps {
  banners: readonly Banner[];
}

const TONE_ICON: Record<BannerTone, string> = {
  info: "ℹ",
  warn: "◆",
  alarm: "▲",
  good: "✓",
};

export function EventBanner({ banners }: EventBannerProps) {
  if (banners.length === 0) {
    return null;
  }
  return (
    <div className={styles.stack} aria-live="polite" data-testid="event-banner-stack">
      {banners.map((banner) => (
        <p key={banner.id} className={`${styles.banner} ${styles[`tone_${banner.tone}`]}`}>
          <span className={styles.icon} aria-hidden="true">
            {TONE_ICON[banner.tone]}
          </span>
          {banner.text}
        </p>
      ))}
    </div>
  );
}
