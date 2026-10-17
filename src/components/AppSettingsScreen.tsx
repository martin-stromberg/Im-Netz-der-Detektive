/**
 * Application settings (spec `02-technisches-konzept.md` section 11):
 * the UI language (DE/EN, applied to every screen at runtime) and the
 * audio settings (volume + mute) for the ganove's sound dramaturgy.
 * Every change lands in `useUiPrefs` immediately and is persisted —
 * no "apply" step, so the runtime language switch is visible at once.
 */
import { t, LANGUAGES, type Language } from "../i18n";
import { useUiPrefs } from "../state/uiPrefs";
import shared from "./GanoveScreen.module.css";
import styles from "./Menu.module.css";

export interface AppSettingsScreenProps {
  onBack: () => void;
}

const LANG_KEY: Record<Language, "appsettings.lang.de" | "appsettings.lang.en"> = {
  de: "appsettings.lang.de",
  en: "appsettings.lang.en",
};

export function AppSettingsScreen({ onBack }: AppSettingsScreenProps) {
  const language = useUiPrefs((s) => s.language);
  const audioVolume = useUiPrefs((s) => s.audioVolume);
  const audioMuted = useUiPrefs((s) => s.audioMuted);

  return (
    <div className={shared.screen} data-testid="app-settings-screen">
      <header className={shared.header}>
        <h1 className={shared.title}>{t("appsettings.title")}</h1>
        <p className={shared.subtitle}>{t("appsettings.subtitle")}</p>
      </header>
      <section className={shared.panel} aria-label={t("appsettings.language")}>
        <div className={styles.fieldGrid}>
          <span className={styles.fieldLabel} id="appsettings-language-label">
            {t("appsettings.language")}
          </span>
          <div
            className={styles.perspectiveToggle}
            role="group"
            aria-labelledby="appsettings-language-label"
            data-testid="language-toggle"
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                data-testid={`language-${lang}`}
                aria-pressed={language === lang}
                onClick={() => useUiPrefs.getState().setLanguage(lang)}
              >
                {t(LANG_KEY[lang])}
              </button>
            ))}
          </div>
          <p className={styles.fieldHint}>{t("appsettings.languageHint")}</p>
        </div>
      </section>
      <section className={shared.panel} aria-label={t("appsettings.audio")}>
        <h2 className={shared.panelHeading}>{t("appsettings.audio")}</h2>
        <div className={styles.fieldGrid}>
          <label className={styles.fieldLabel} htmlFor="audio-volume">
            {t("appsettings.volume")}
          </label>
          <input
            id="audio-volume"
            type="range"
            min={0}
            max={100}
            step={5}
            className={styles.rangeInput}
            data-testid="audio-volume"
            value={audioVolume}
            onChange={(event) => useUiPrefs.getState().setAudioVolume(Number(event.target.value))}
          />
          <p className={styles.fieldHint} data-testid="audio-volume-value">
            {audioVolume} — {t("appsettings.volumeHint")}
          </p>
          <label className={styles.fieldLabel} htmlFor="audio-muted">
            {t("appsettings.mute")}
          </label>
          <input
            id="audio-muted"
            type="checkbox"
            data-testid="audio-muted"
            checked={audioMuted}
            onChange={(event) => useUiPrefs.getState().setAudioMuted(event.target.checked)}
          />
        </div>
        <p className={styles.fieldHint}>{t("appsettings.persisted")}</p>
      </section>
      <div className={styles.actions}>
        <button
          type="button"
          className={shared.secondaryButton}
          data-testid="app-settings-back"
          onClick={onBack}
        >
          {t("menu.back")}
        </button>
      </div>
    </div>
  );
}
