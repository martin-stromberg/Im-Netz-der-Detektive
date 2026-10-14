/**
 * Per-map game settings (spec `01-spielkonzept.md` section 2/§7): every
 * control is bounded by the map package's `{suggested, min, max}`
 * corridors — the suggested values are preselected, `roundLimit`
 * offers "unbegrenzt" only where the map allows it, and the event
 * settings combine the trigger mode with a unified cadence ("one event
 * every ~N rounds"). Invalid values are refused before `onContinue`.
 */
import { useState } from "react";
import { t, type TranslationKey } from "../i18n";
import { EVENT_MODES, type EventMode, type MapPack, type RangeSetting } from "../logic/mapPack";
import type { StartGameOptions } from "../state/gameStore";
import {
  cadenceToEventDefaults,
  EVENT_CADENCE_MAX,
  EVENT_CADENCE_MIN,
  eventCadenceOf,
} from "./menuFlow";
import shared from "./GanoveScreen.module.css";
import styles from "./Menu.module.css";

export interface SettingsScreenProps {
  map: MapPack;
  onBack: () => void;
  onContinue: (options: StartGameOptions) => void;
}

const EVENT_MODE_KEY: Record<EventMode, TranslationKey> = {
  cycle: "settings.eventMode.cycle",
  chance: "settings.eventMode.chance",
  tension: "settings.eventMode.tension",
};

function inRange(range: RangeSetting, value: number): boolean {
  return (
    Number.isInteger(value) && value >= range.min && (range.max === undefined || value <= range.max)
  );
}

interface RangeFieldProps {
  labelKey: TranslationKey;
  range: RangeSetting;
  value: number;
  testId: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

function RangeField({ labelKey, range, value, testId, disabled, onChange }: RangeFieldProps) {
  return (
    <>
      <label className={styles.fieldLabel} htmlFor={testId}>
        {t(labelKey)}
      </label>
      <input
        id={testId}
        type="number"
        className={styles.numberInput}
        data-testid={testId}
        min={range.min}
        max={range.max}
        step={1}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <p className={styles.fieldHint} data-testid={`${testId}-hint`}>
        {t("settings.range", {
          min: range.min,
          max: range.max ?? "∞",
          suggested: range.suggested,
        })}
      </p>
    </>
  );
}

export function SettingsScreen({ map, onBack, onContinue }: SettingsScreenProps) {
  const settings = map.settings;
  const [detectiveCount, setDetectiveCount] = useState(settings.detectiveCount.suggested);
  const [cameraCount, setCameraCount] = useState(settings.cameraCount.suggested);
  const [roundLimit, setRoundLimit] = useState(settings.roundLimit.suggested);
  const [unlimited, setUnlimited] = useState(false);
  const [radioHintCount, setRadioHintCount] = useState(settings.radioHintCount.suggested);
  const [edgeBlockRounds, setEdgeBlockRounds] = useState(settings.edgeBlockRounds.suggested);
  const [eventMode, setEventMode] = useState<EventMode>(settings.eventMode);
  const [cadence, setCadence] = useState(
    eventCadenceOf(settings.eventMode, settings.eventDefaults),
  );
  const [invalid, setInvalid] = useState<TranslationKey[]>([]);

  const unlimitedAllowed = settings.roundLimit.unlimited === true;

  const submit = () => {
    const errors: TranslationKey[] = [];
    if (!inRange(settings.detectiveCount, detectiveCount)) {
      errors.push("settings.detectiveCount");
    }
    if (!inRange(settings.cameraCount, cameraCount)) {
      errors.push("settings.cameraCount");
    }
    if (!unlimited && !inRange(settings.roundLimit, roundLimit)) {
      errors.push("settings.roundLimit");
    }
    if (unlimited && !unlimitedAllowed) {
      errors.push("settings.roundLimit");
    }
    if (!inRange(settings.radioHintCount, radioHintCount)) {
      errors.push("settings.radioHintCount");
    }
    if (!inRange(settings.edgeBlockRounds, edgeBlockRounds)) {
      errors.push("settings.edgeBlockRounds");
    }
    if (!Number.isInteger(cadence) || cadence < EVENT_CADENCE_MIN || cadence > EVENT_CADENCE_MAX) {
      errors.push("settings.eventCadence");
    }
    setInvalid(errors);
    if (errors.length > 0) {
      return;
    }
    onContinue({
      detectiveCount,
      cameraCount,
      roundLimit: unlimited ? null : roundLimit,
      radioHintCount,
      edgeBlockRounds,
      eventMode,
      eventDefaults: cadenceToEventDefaults(eventMode, cadence, settings.eventDefaults),
    });
  };

  return (
    <div className={shared.screen} data-testid="settings-screen">
      <header className={shared.header}>
        <h1 className={shared.title}>{t("settings.title", { map: map.name })}</h1>
        <p className={shared.subtitle}>{t("settings.subtitle")}</p>
      </header>
      <section className={shared.panel}>
        <div className={styles.fieldGrid}>
          <RangeField
            labelKey="settings.detectiveCount"
            range={settings.detectiveCount}
            value={detectiveCount}
            testId="setting-detectives"
            onChange={setDetectiveCount}
          />
          <RangeField
            labelKey="settings.cameraCount"
            range={settings.cameraCount}
            value={cameraCount}
            testId="setting-cameras"
            onChange={setCameraCount}
          />
          <RangeField
            labelKey="settings.roundLimit"
            range={settings.roundLimit}
            value={roundLimit}
            testId="setting-roundlimit"
            disabled={unlimited}
            onChange={setRoundLimit}
          />
          <RangeField
            labelKey="settings.radioHintCount"
            range={settings.radioHintCount}
            value={radioHintCount}
            testId="setting-radio"
            onChange={setRadioHintCount}
          />
          <RangeField
            labelKey="settings.edgeBlockRounds"
            range={settings.edgeBlockRounds}
            value={edgeBlockRounds}
            testId="setting-edgeblock"
            onChange={setEdgeBlockRounds}
          />
          {unlimitedAllowed ? (
            <>
              <label className={styles.fieldLabel} htmlFor="setting-unlimited">
                {t("settings.unlimited")}
              </label>
              <input
                id="setting-unlimited"
                type="checkbox"
                data-testid="setting-unlimited"
                checked={unlimited}
                onChange={(event) => setUnlimited(event.target.checked)}
              />
              <p className={styles.fieldHint}>{t("settings.unlimitedHint")}</p>
            </>
          ) : null}
          <label className={styles.fieldLabel} htmlFor="setting-eventmode">
            {t("settings.eventMode")}
          </label>
          <select
            id="setting-eventmode"
            className={styles.selectInput}
            data-testid="setting-eventmode"
            value={eventMode}
            onChange={(event) => {
              const mode = event.target.value as EventMode;
              setEventMode(mode);
              setCadence(eventCadenceOf(mode, settings.eventDefaults));
            }}
          >
            {EVENT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {t(EVENT_MODE_KEY[mode])}
              </option>
            ))}
          </select>
          <p className={styles.fieldHint}>{t("settings.eventModeHint")}</p>
          <label className={styles.fieldLabel} htmlFor="setting-cadence">
            {t("settings.eventCadence")}
          </label>
          <input
            id="setting-cadence"
            type="number"
            className={styles.numberInput}
            data-testid="setting-cadence"
            min={EVENT_CADENCE_MIN}
            max={EVENT_CADENCE_MAX}
            step={1}
            value={cadence}
            onChange={(event) => setCadence(Number(event.target.value))}
          />
          <p className={styles.fieldHint} data-testid="setting-cadence-hint">
            {t("settings.eventCadenceHint", {
              min: EVENT_CADENCE_MIN,
              max: EVENT_CADENCE_MAX,
            })}
          </p>
        </div>
        {invalid.length > 0 ? (
          <ul className={styles.errorList} data-testid="settings-errors">
            {invalid.map((key) => (
              <li key={key}>{t("settings.invalid", { field: t(key) })}</li>
            ))}
          </ul>
        ) : null}
        <div className={styles.actions}>
          <button type="button" className={shared.secondaryButton} onClick={onBack}>
            {t("menu.back")}
          </button>
          <button
            type="button"
            className={shared.primaryButton}
            data-testid="settings-continue"
            onClick={submit}
          >
            {t("menu.continue")}
          </button>
        </div>
      </section>
    </div>
  );
}
