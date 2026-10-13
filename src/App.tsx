import { useState } from "react";
import { GanoveScreen } from "./components/GanoveScreen";
import { DetektivScreen } from "./components/DetektivScreen";
import { readParams } from "./components/gameSetup";
import { t } from "./i18n";
import styles from "./App.module.css";
import shared from "./components/GanoveScreen.module.css";

type Mode = "ganove" | "detektiv";

/**
 * Temporary mode switcher (step 10): the real menu arrives in step 11.
 * `?mode=ganove|detektiv` picks a side directly; without the parameter a
 * simple two-button chooser is shown.
 */
function initialMode(): Mode | null {
  const raw = readParams().get("mode");
  return raw === "ganove" || raw === "detektiv" ? raw : null;
}

export default function App() {
  const [mode, setMode] = useState<Mode | null>(initialMode);

  if (mode === "ganove") {
    return (
      <main className={styles.shell}>
        <GanoveScreen />
      </main>
    );
  }
  if (mode === "detektiv") {
    return (
      <main className={styles.shell}>
        <DetektivScreen />
      </main>
    );
  }
  return (
    <main className={styles.shell}>
      <div className={shared.screen} data-testid="mode-select">
        <header className={shared.header}>
          <h1 className={shared.title}>{t("app.title")}</h1>
          <p className={shared.subtitle}>{t("app.subtitle")}</p>
        </header>
        <section className={shared.panel}>
          <h2 className={shared.panelHeading}>{t("mode.title")}</h2>
          <div className={styles.modeGrid}>
            <button
              type="button"
              className={shared.primaryButton}
              data-mode="ganove"
              onClick={() => setMode("ganove")}
            >
              {t("mode.ganove")}
              <span className={styles.modeHint}>{t("mode.ganoveHint")}</span>
            </button>
            <button
              type="button"
              className={shared.primaryButton}
              data-mode="detektiv"
              onClick={() => setMode("detektiv")}
            >
              {t("mode.detektiv")}
              <span className={styles.modeHint}>{t("mode.detektivHint")}</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
