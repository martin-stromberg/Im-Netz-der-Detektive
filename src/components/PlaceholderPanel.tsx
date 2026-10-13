import { t } from "../i18n";
import styles from "./PlaceholderPanel.module.css";

export function PlaceholderPanel() {
  return (
    <section className={styles.panel}>
      <p>{t("app.placeholder")}</p>
    </section>
  );
}
