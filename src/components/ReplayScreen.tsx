/**
 * Replay player (spec `02-technisches-konzept.md` section 8.1):
 * re-runs a recorded JSONL log deterministically through the engine —
 * the timeline steps through the recorded actor entries
 * (play/pause/step forward/back), and the perspective toggle shows
 * either the ganove view or the detective view, each filtered by
 * `visibleTo` exactly like the live screens (the detective view never
 * receives `ganovePosition` — the deduction overlay is the only
 * positional information).
 */
import { useEffect, useState } from "react";
import { t, type TranslationKey } from "../i18n";
import { useGameStore, type GameOutcome } from "../state/gameStore";
import { detectiveStartsFromLog } from "../state/detectiveDriver";
import { loadMap } from "../logic/MapLoader";
import {
  openReplay,
  replayTo,
  type ReplayPerspective,
  type ReplaySource,
} from "../logic/ReplayPlayer";
import { deducePossiblePositions } from "../logic/Deduction";
import { visibleCameras, visibleEvents, type RadioHint } from "../logic/InformationSystem";
import { missionStructure, type MissionKind } from "../logic/MissionSystem";
import type { MapPack } from "../logic/mapPack";
import { MapGraph } from "./MapGraph";
import { MapLegend } from "./GanoveScreen";
import { DetectiveMapLegend } from "./DetektivScreen";
import { chronicleText } from "./chronicle";
import { MissionPanel, currentMissionTarget } from "./MissionPanel";
import { HeatBadge } from "./HeatBadge";
import shared from "./GanoveScreen.module.css";
import detektivStyles from "./DetektivScreen.module.css";
import styles from "./Menu.module.css";

export interface ReplayScreenProps {
  /** The recorded game as a JSONL string. */
  jsonl: string;
  onBack: () => void;
}

const OUTCOME_KEY: Record<GameOutcome, `outcome.${GameOutcome}`> = {
  caught: "outcome.caught",
  surrounded: "outcome.surrounded",
  escaped: "outcome.escaped",
  timeout: "outcome.timeout",
  draw: "outcome.draw",
};

const STEP_KEY: Record<MissionKind, TranslationKey> = {
  diebstahl: "mission.step.diebstahl",
  kontakt: "mission.step.kontakt",
  sabotage: "mission.step.sabotage",
  flucht: "mission.step.flucht",
};

const STATUS_MARKER: Record<string, string> = {
  erledigt: "✓",
  aktuell: "▶",
  offen: "○",
};

const HINT_KEY: Record<string, TranslationKey> = {
  camera: "hint.kind.camera",
  sichtbarkeit: "hint.kind.sichtbarkeit",
  hinweis: "hint.kind.hinweis",
  aktion: "hint.kind.aktion",
};

/** Step interval of the automatic playback. */
const PLAY_INTERVAL_MS = 800;

function InvalidReplay({ onBack }: { onBack: () => void }) {
  return (
    <div className={shared.screen} data-testid="replay-screen" data-view="invalid">
      <header className={shared.header}>
        <h1 className={shared.title}>{t("replay.title")}</h1>
      </header>
      <section className={shared.panel}>
        <p className={shared.notice} data-testid="replay-error">
          {t("replay.error")}
        </p>
        <button type="button" className={shared.secondaryButton} onClick={onBack}>
          {t("menu.back")}
        </button>
      </section>
    </div>
  );
}

export function ReplayScreen({ jsonl, onBack }: ReplayScreenProps) {
  // Parse the log and resolve the map once per mount — the parent
  // remounts this screen for each selected log.
  const [parsed] = useState<{ source: ReplaySource; map: MapPack } | null>(() => {
    try {
      const source = openReplay(jsonl);
      return { source, map: loadMap(source.start.mapId) };
    } catch {
      return null;
    }
  });
  const source = parsed?.source ?? null;
  const map = parsed?.map ?? null;
  const invalid = parsed === null;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [perspective, setPerspective] = useState<ReplayPerspective>("detectives");
  const [showOverlay, setShowOverlay] = useState(true);

  const round = useGameStore((s) => s.round);
  const roundLimit = useGameStore((s) => s.roundLimit);
  const phase = useGameStore((s) => s.phase);
  const activeDetectiveIndex = useGameStore((s) => s.activeDetectiveIndex);
  const ganovePosition = useGameStore((s) => s.ganovePosition);
  const detektivePositions = useGameStore((s) => s.detektivePositions);
  const mission = useGameStore((s) => s.mission);
  const events = useGameStore((s) => s.events);
  const cameras = useGameStore((s) => s.cameras);
  const blockedEdges = useGameStore((s) => s.blockedEdges);
  const escapeNodeIds = useGameStore((s) => s.escapeNodeIds);
  const outcome = useGameStore((s) => s.outcome);

  // Drive the engine deterministically up to the selected step. The
  // singleton store is reused — replay screens are exclusive, and the
  // cleanup below resets it.
  useEffect(() => {
    if (source === null || map === null) {
      return;
    }
    replayTo(useGameStore, map, source, step);
  }, [source, map, step]);

  // Leaving the replay always resets the live store.
  useEffect(() => () => useGameStore.getState().resetGame(), []);

  // Auto-play: one actor entry per interval; the timer callback stops
  // at the last step or when the recorded game reaches its outcome.
  useEffect(() => {
    if (!playing || source === null) {
      return;
    }
    const timer = setTimeout(() => {
      if (step >= source.actions.length || useGameStore.getState().outcome !== null) {
        setPlaying(false);
        return;
      }
      setStep(step + 1);
    }, PLAY_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [playing, step, source]);

  const exit = () => {
    useGameStore.getState().resetGame();
    onBack();
  };

  if (invalid || source === null || map === null) {
    return <InvalidReplay onBack={exit} />;
  }

  const total = source.actions.length;
  const atEnd = step >= total || outcome !== null;
  const nodeName = (nodeId: string): string =>
    map.nodes.find((node) => node.id === nodeId)?.name ?? nodeId;

  const stepLabel = step === 0 ? t("replay.stepStart") : t("replay.stepOf", { step, total, round });

  // ---- Perspective-filtered views (same data-level filter as live) ----
  const intelGanove = visibleEvents(events, "ganove");
  const intelDetectives = visibleEvents(events, "detectives");
  const squadCameras = visibleCameras(cameras, "detectives");
  const structure = missionStructure(mission);
  const heat = useGameStore.getState().getHeatLevel();
  const possibleNodeIds =
    perspective === "detectives" && showOverlay
      ? deducePossiblePositions({
          map,
          detectiveStarts: detectiveStartsFromLog(useGameStore.getState().log),
          events: intelDetectives,
          cameras: squadCameras,
          round,
          detectivePositions: detektivePositions,
        })
      : [];
  const radioHints = intelGanove
    .filter((event) => event.kind === "polizeifunk")
    .flatMap((event) => (event.details?.hints as RadioHint[] | undefined) ?? []);

  const hintText = (hint: RadioHint): string => {
    const key = HINT_KEY[hint.kind] ?? "hint.kind.aktion";
    if (hint.kind === "hinweis") {
      return t(key, { round: hint.round, zone: hint.zone ?? "?" });
    }
    return t(key, {
      round: hint.round,
      node: hint.nodeId !== undefined ? nodeName(hint.nodeId) : "?",
    });
  };

  return (
    <div className={shared.screen} data-testid="replay-screen" data-view="playing">
      <header className={shared.header}>
        <h1 className={shared.title}>{t("replay.title")}</h1>
        <div className={shared.statusBar}>
          <span className={shared.round} data-testid="round-indicator">
            {roundLimit !== null
              ? t("game.roundLimit", { round, limit: roundLimit })
              : t("game.round", { round })}
          </span>
          <span className={shared.phase} data-testid="replay-position">
            {stepLabel}
          </span>
          {outcome !== null ? (
            <span className={shared.phase} data-testid="replay-outcome">
              {t(OUTCOME_KEY[outcome])}
            </span>
          ) : null}
        </div>
      </header>
      <div className={styles.replayControls}>
        <button
          type="button"
          className={shared.secondaryButton}
          data-testid="replay-prev"
          disabled={step === 0}
          onClick={() => {
            setPlaying(false);
            setStep(step - 1);
          }}
        >
          {t("replay.prev")}
        </button>
        <button
          type="button"
          className={shared.primaryButton}
          data-testid="replay-play"
          disabled={atEnd && !playing}
          onClick={() => setPlaying(!playing)}
        >
          {playing ? t("replay.pause") : t("replay.play")}
        </button>
        <button
          type="button"
          className={shared.secondaryButton}
          data-testid="replay-next"
          disabled={atEnd}
          onClick={() => {
            setPlaying(false);
            setStep(step + 1);
          }}
        >
          {t("replay.next")}
        </button>
        <div className={styles.perspectiveToggle} data-testid="replay-perspective">
          <button
            type="button"
            data-testid="replay-view-ganove"
            aria-pressed={perspective === "ganove"}
            onClick={() => setPerspective("ganove")}
          >
            {t("replay.view.ganove")}
          </button>
          <button
            type="button"
            data-testid="replay-view-detectives"
            aria-pressed={perspective === "detectives"}
            onClick={() => setPerspective("detectives")}
          >
            {t("replay.view.detectives")}
          </button>
        </div>
      </div>
      <div className={shared.layout}>
        <div className={shared.mapArea}>
          {perspective === "ganove" ? (
            <MapGraph
              map={map}
              round={round}
              blockedEdges={blockedEdges}
              detectivePositions={detektivePositions}
              ganovePosition={ganovePosition}
              missionTargets={mission?.targets ?? {}}
              currentTargetId={
                mission?.pendingChoice !== null && mission?.pendingChoice !== undefined
                  ? mission.pendingChoice.sabotageNode
                  : currentMissionTarget(mission)
              }
              escapeNodeIds={escapeNodeIds}
            />
          ) : (
            <MapGraph
              map={map}
              round={round}
              blockedEdges={blockedEdges}
              detectivePositions={detektivePositions}
              activeDetectiveIndex={phase === "detektive" ? activeDetectiveIndex : null}
              cameras={squadCameras}
              possibleNodeIds={possibleNodeIds}
              showCategories
              showZones
            />
          )}
          {perspective === "ganove" ? <MapLegend /> : <DetectiveMapLegend map={map} />}
        </div>
        <aside className={shared.sidebar}>
          {perspective === "ganove" ? (
            <>
              <MissionPanel mission={mission} nodeName={nodeName} />
              <section className={shared.panel} aria-label={t("intel.title")}>
                <h2 className={shared.panelHeading}>
                  {t("intel.title")} <HeatBadge level={heat.level} score={heat.score} />
                </h2>
                {intelGanove.length === 0 ? (
                  <p className={shared.hint} data-testid="intel-empty">
                    {t("intel.empty")}
                  </p>
                ) : (
                  <ul className={shared.intelList} data-testid="intel-feed">
                    {intelGanove.map((event, index) =>
                      event.kind === "umwelt" && event.edge !== undefined ? (
                        <li key={index}>
                          {t("intel.umwelt", {
                            a: nodeName(event.edge.a),
                            b: nodeName(event.edge.b),
                            untilRound: event.untilRound ?? "?",
                          })}
                        </li>
                      ) : event.kind === "polizeifunk" ? (
                        <li key={index} data-radio-report="true">
                          {radioHints.length === 0 ? (
                            t("radio.empty")
                          ) : (
                            <ul>
                              {radioHints.map((hint, hintIndex) => (
                                <li key={hintIndex}>{hintText(hint)}</li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ) : null,
                    )}
                  </ul>
                )}
              </section>
            </>
          ) : (
            <>
              <section className={shared.panel} aria-label={t("structure.title")}>
                <h2 className={shared.panelHeading}>{t("structure.title")}</h2>
                {structure.length === 0 ? (
                  <p className={shared.hint} data-testid="structure-empty">
                    {t("structure.none")}
                  </p>
                ) : (
                  <ol className={detektivStyles.steps} data-testid="mission-structure">
                    {structure.map((stepEntry) => (
                      <li
                        key={stepEntry.kind}
                        className={`${detektivStyles.step} ${detektivStyles[`status_${stepEntry.status}`]}`}
                        data-mission-step={stepEntry.kind}
                        data-step-status={stepEntry.status}
                      >
                        <span className={detektivStyles.stepMarker} aria-hidden="true">
                          {STATUS_MARKER[stepEntry.status]}
                        </span>
                        <span>{t(STEP_KEY[stepEntry.kind])}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
              <section className={shared.panel} aria-label={t("tools.title")}>
                <label className={detektivStyles.toolToggle}>
                  <input
                    type="checkbox"
                    data-testid="overlay-toggle"
                    checked={showOverlay}
                    onChange={(event) => setShowOverlay(event.target.checked)}
                  />
                  {t("tools.overlay")}
                </label>
                {showOverlay ? (
                  <p className={shared.hint} data-testid="overlay-count">
                    {t("tools.overlayCount", { count: possibleNodeIds.length })}
                  </p>
                ) : null}
              </section>
              <section className={shared.panel} aria-label={t("chronicle.title")}>
                <h2 className={shared.panelHeading}>{t("chronicle.title")}</h2>
                {intelDetectives.length === 0 ? (
                  <p className={shared.hint} data-testid="chronicle-empty">
                    {t("chronicle.empty")}
                  </p>
                ) : (
                  <ul className={shared.intelList} data-testid="chronicle-feed">
                    {intelDetectives.map((event, index) => (
                      <li key={index} data-hint-event={event.kind}>
                        {chronicleText(event, nodeName)}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
          <button
            type="button"
            className={shared.secondaryButton}
            data-testid="replay-back"
            onClick={exit}
          >
            {t("menu.back")}
          </button>
        </aside>
      </div>
    </div>
  );
}
