import { t } from "./i18n";
import { useGameStore } from "./state/gameStore";
import { PlaceholderPanel } from "./components/PlaceholderPanel";
import styles from "./App.module.css";

export default function App() {
  const round = useGameStore((state) => state.round);

  return (
    <main className={styles.shell}>
      <h1 className={styles.title}>{t("app.title")}</h1>
      <p className={styles.subtitle}>{t("app.subtitle")}</p>
      <p className={styles.round}>{t("app.round", { round })}</p>
      <PlaceholderPanel />
    </main>
  );
}
