/**
 * GanoveUI — the primary game mode (spec `02-technisches-konzept.md`
 * section 6): a human ganove against the AI detectives. The screen
 * orchestrates the three views — start (idle), ganove spawn choice
 * (detectives placed first by seeded pick, the ganove chooses last from
 * the legal `ganoveSpawnChoices`) and the running game — while every
 * rule decision stays in `useGameStore`: the UI only triggers actions
 * (`moveGanove`, `ganoveAction`, `chooseMissionPath`, `useRadio`,
 * `abortAsDraw`), and the store-bound `detectiveDriver` runs the AI
 * detective phase automatically after each ganove turn.
 *
 * Asymmetry is structural: the view never receives cameras and renders
 * only `visibleEvents(…, "ganove")` — `umwelt` blocks and the
 * `polizeifunk` report are all a ganove may ever see.
 *
 * Dev/test hooks: URL params `?map=`, `?seed=`, `?mission=` (auto |
 * random | none | case:<id>) override the defaults; `autoDetectives`
 * disables the driver for tests that drive turns manually.
 */
import { useEffect, useRef, useState } from "react";
import { t, type TranslationKey } from "../i18n";
import {
  useGameStore,
  type GameOutcome,
  type MissionOption,
  type StartGameOptions,
} from "../state/gameStore";
import { installDetectiveDriver } from "../state/detectiveDriver";
import { installGameAudio } from "../audio/gameAudio";
import { loadMap } from "../logic/MapLoader";
import { buildResumeEntry } from "../logic/SaveGame";
import { saveResumeEntry } from "../logic/GameIndex";
import { resolveFixedTargets } from "../logic/MissionLoader";
import { createRng } from "../logic/rng";
import {
  ganoveSpawnChoicesForMission,
  pickDetectiveSpawns,
  pickGanoveSpawnForMission,
} from "../logic/SpawnSystem";
import { MissionGenerationError, type MissionKind } from "../logic/MissionSystem";
import { visibleEvents, type RadioHint } from "../logic/InformationSystem";
import type { MapPack } from "../logic/mapPack";
import { MapGraph } from "./MapGraph";
import { HeatBadge } from "./HeatBadge";
import { MissionPanel, currentMissionTarget } from "./MissionPanel";
import { PursuitBadge } from "./PursuitBadge";
import { EventBanner, type Banner, type BannerTone } from "./EventBanner";
import { pursuitStatus, type PursuitLevel } from "../logic/Pursuit";
import { nextSeed, readParams, resolveMissionOption } from "./gameSetup";
import styles from "./GanoveScreen.module.css";

export interface GanoveScreenProps {
  /** Map id — defaults to `?map=` or `"muenster"`. */
  mapId?: string;
  /** Game seed — defaults to `?seed=` or a `Date.now()`-derived value. */
  seed?: number;
  /** Menu-driven game options (settings + mission); overrides `?mission=`. */
  options?: StartGameOptions;
  /** `true` starts the setup flow immediately (skips the idle view). */
  startImmediately?: boolean;
  /** Exit-to-menu callback — renders a "Zum Hauptmenü" action. */
  onExit?: () => void;
  /** `false` disables the automatic AI detective phase (test hook). */
  autoDetectives?: boolean;
  /**
   * Milliseconds between single detective moves — the visible beat the
   * hunt plays in. `0` drains the phase synchronously (tests).
   */
  detectiveStepDelay?: number;
}

interface PendingSetup {
  map: MapPack;
  seed: number;
  mission: MissionOption;
  options: StartGameOptions;
  detectivePositions: string[];
}

const OUTCOME_KEY: Record<GameOutcome, `outcome.${GameOutcome}`> = {
  caught: "outcome.caught",
  surrounded: "outcome.surrounded",
  escaped: "outcome.escaped",
  timeout: "outcome.timeout",
  draw: "outcome.draw",
};

const ACTION_KEY: Partial<Record<MissionKind, TranslationKey>> = {
  diebstahl: "mission.action.diebstahl",
  kontakt: "mission.action.kontakt",
  sabotage: "mission.action.sabotage",
};

const HINT_KEY: Record<string, TranslationKey> = {
  camera: "hint.kind.camera",
  sichtbarkeit: "hint.kind.sichtbarkeit",
  hinweis: "hint.kind.hinweis",
  aktion: "hint.kind.aktion",
};

/** Compact symbol legend under the map — shapes/patterns, not colour. */
export function MapLegend() {
  return (
    <div className={styles.legend} data-testid="map-legend">
      <span className={styles.legendTitle}>{t("legend.title")}:</span>
      <span className={styles.legendItem}>
        <svg width="26" height="8" aria-hidden="true">
          <line x1="0" y1="4" x2="26" y2="4" className={styles.legendWeg} />
        </svg>
        {t("legend.weg")}
      </span>
      <span className={styles.legendItem}>
        <svg width="26" height="8" aria-hidden="true">
          <line x1="0" y1="4" x2="26" y2="4" className={styles.legendFahrt} />
        </svg>
        {t("legend.fahrt")}
      </span>
      <span className={styles.legendItem}>
        <svg width="12" height="12" aria-hidden="true">
          <path d="M 3 11 V 1 H 9 L 7 3.5 L 9 6 H 3" className={styles.legendEscape} />
        </svg>
        {t("legend.escape")}
      </span>
      <span className={styles.legendItem}>
        <svg width="12" height="12" aria-hidden="true">
          <rect x="1" y="1" width="10" height="10" rx="2" className={styles.legendDetective} />
        </svg>
        {t("legend.detective")}
      </span>
      <span className={styles.legendItem}>
        <svg width="12" height="12" aria-hidden="true">
          <path d="M 6 0 L 11 6 L 6 12 L 1 6 Z" className={styles.legendGanove} />
        </svg>
        {t("legend.ganove")}
      </span>
      <span className={styles.legendItem}>
        {/* Mini plaque — same shape as the map's place tokens, so the
            same form carries the same meaning. */}
        <svg width="14" height="14" aria-hidden="true">
          <circle cx="7" cy="7" r="6" className={styles.legendTargetRing} />
          <circle cx="7" cy="7" r="4.4" className={styles.legendTargetDot} />
          <circle cx="7" cy="7" r="2.9" className={styles.legendTargetInner} />
        </svg>
        {t("legend.target")}
      </span>
      <span className={styles.legendItem} data-testid="legend-keyboard">
        {t("legend.keyboard")}
      </span>
    </div>
  );
}

function IdleView({ notice, onStart }: { notice: string | null; onStart: () => void }) {
  return (
    <div className={styles.screen} data-testid="ganove-screen" data-view="idle">
      <header className={styles.header}>
        <h1 className={styles.title}>{t("app.title")}</h1>
        <p className={styles.subtitle}>{t("app.subtitle")}</p>
      </header>
      <section className={styles.panel} data-testid="start-panel">
        <p>{t("game.setup.intro")}</p>
        <button type="button" className={styles.primaryButton} onClick={onStart}>
          {t("game.new")}
        </button>
        {notice !== null ? (
          <p className={styles.notice} role="alert">
            {notice}
          </p>
        ) : null}
      </section>
    </div>
  );
}

function PickSpawnView({
  setup,
  notice,
  onPick,
}: {
  setup: PendingSetup;
  notice: string | null;
  onPick: (nodeId: string) => void;
}) {
  // Fixed-target missions (Fall/custom) narrow the offer: only spawns
  // satisfying both the spawn rule and the mission criteria are legal.
  const fixedTargets = resolveFixedTargets(setup.map, setup.mission);
  const choices = ganoveSpawnChoicesForMission(setup.map, setup.detectivePositions, fixedTargets);
  return (
    <div className={styles.screen} data-testid="ganove-screen" data-view="pickSpawn">
      <header className={styles.header}>
        <h1 className={styles.title}>{t("game.setup.title", { map: setup.map.name })}</h1>
        <p>{t("game.setup.pickSpawn")}</p>
      </header>
      <MapGraph
        map={setup.map}
        detectivePositions={setup.detectivePositions}
        selectableNodeIds={choices}
        onNodeSelect={onPick}
      />
      <MapLegend />
      {notice !== null ? (
        <p className={styles.notice} role="alert">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

function OutcomeView({
  outcome,
  round,
  onRestart,
  onExit,
}: {
  outcome: GameOutcome;
  round: number;
  onRestart: () => void;
  onExit?: () => void;
}) {
  return (
    <section
      className={styles.panel}
      data-testid="outcome-panel"
      data-outcome={outcome}
      role="status"
    >
      <h2 className={styles.panelHeading}>{t("outcome.title")}</h2>
      <p className={styles.outcomeText}>{t(OUTCOME_KEY[outcome])}</p>
      <p className={styles.hint}>{t("game.round", { round })}</p>
      <button type="button" className={styles.primaryButton} onClick={onRestart}>
        {t("game.new")}
      </button>
      {onExit !== undefined ? (
        <button
          type="button"
          className={styles.secondaryButton}
          data-testid="exit-to-menu"
          onClick={onExit}
        >
          {t("menu.toMenu")}
        </button>
      ) : null}
    </section>
  );
}

export function GanoveScreen({
  mapId,
  seed,
  options,
  startImmediately = false,
  onExit,
  autoDetectives = true,
  detectiveStepDelay = 650,
}: GanoveScreenProps) {
  const map = useGameStore((s) => s.map);
  const round = useGameStore((s) => s.round);
  const roundLimit = useGameStore((s) => s.roundLimit);
  const phase = useGameStore((s) => s.phase);
  const ganovePosition = useGameStore((s) => s.ganovePosition);
  const detektivePositions = useGameStore((s) => s.detektivePositions);
  const mission = useGameStore((s) => s.mission);
  const events = useGameStore((s) => s.events);
  const blockedEdges = useGameStore((s) => s.blockedEdges);
  const escapeNodeIds = useGameStore((s) => s.escapeNodeIds);
  const radioUsed = useGameStore((s) => s.radioUsed);
  const outcome = useGameStore((s) => s.outcome);

  const [setup, setSetup] = useState<PendingSetup | null>(null);
  const [abortConfirm, setAbortConfirm] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [banners, setBanners] = useState<readonly Banner[]>([]);
  const [flashEdges, setFlashEdges] = useState<readonly string[]>([]);
  const autoStarted = useRef(false);

  // Transient staging layer: banner texts auto-expire, edge flashes the
  // same. Timers are tracked for unmount cleanup.
  const bannerSeq = useRef(0);
  const bannerTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      for (const timer of bannerTimers.current) {
        clearTimeout(timer);
      }
    },
    [],
  );
  const pushBanner = (text: string, tone: BannerTone) => {
    const id = ++bannerSeq.current;
    setBanners((prev) => [...prev, { id, text, tone }].slice(-3));
    bannerTimers.current.push(
      setTimeout(() => setBanners((prev) => prev.filter((b) => b.id !== id)), 3600),
    );
  };
  const flashEdge = (a: string, b: string) => {
    const key = `${a}|${b}`;
    setFlashEdges((prev) => (prev.includes(key) ? prev : [...prev, key]));
    bannerTimers.current.push(
      setTimeout(() => setFlashEdges((prev) => prev.filter((k) => k !== key)), 3400),
    );
  };

  // Staging diffs — every store slice change is scanned once; refs hold
  // the baselines so resumed/replayed games don't replay old banners.
  const staged = useRef<{
    events: number;
    stage: string | null;
    appliedEffect: string | null;
    pendingChoice: boolean;
    pursuit: number;
  } | null>(null);

  // Runs after every render — diffs the store snapshots into banners.
  // The first pass only baselines, so a resumed game never replays.
  useEffect(() => {
    const state = useGameStore.getState();
    const nodeLabel = (nodeId: string): string =>
      state.map?.nodes.find((node) => node.id === nodeId)?.name ?? nodeId;
    const pursuitIdx = (level: PursuitLevel | null): number =>
      level === null ? -1 : ["ruhig", "spuerbar", "nah", "unmittelbar"].indexOf(level);
    const pursuit =
      state.map !== null && state.ganovePosition !== null && state.outcome === null
        ? pursuitStatus(
            state.map,
            state.blockedEdges,
            state.round,
            state.ganovePosition,
            state.detektivePositions,
          )
        : null;
    const snap = {
      events: state.events.length,
      stage: state.mission?.stage ?? null,
      appliedEffect: state.mission?.appliedEffect ?? null,
      pendingChoice: state.mission?.pendingChoice != null,
      pursuit: pursuitIdx(pursuit?.level ?? null),
    };
    if (staged.current === null) {
      staged.current = snap;
      return;
    }
    const prev = staged.current;

    // New ganove-visible world events: blocked-edge flash + banner.
    for (const event of state.events.slice(prev.events)) {
      if (event.kind === "umwelt" && event.edge !== undefined) {
        pushBanner(
          t("banner.umwelt", {
            a: nodeLabel(event.edge.a),
            b: nodeLabel(event.edge.b),
            until: event.untilRound ?? "?",
          }),
          "info",
        );
        flashEdge(event.edge.a, event.edge.b);
      } else if (event.kind === "polizeifunk") {
        pushBanner(t("banner.radio"), "info");
      }
    }

    // Mission-stage transitions carry their own announcements; the
    // sabotage *execution* itself is covered by appliedEffect below.
    if (prev.stage !== snap.stage) {
      if (snap.stage === "wahl") {
        pushBanner(t("banner.offer"), "warn");
      } else if (snap.stage === "flucht") {
        pushBanner(t("banner.escape"), "warn");
      } else if (snap.stage === "kontakt") {
        pushBanner(t("banner.action"), "good");
      }
    }
    if (prev.appliedEffect === null && snap.appliedEffect !== null) {
      pushBanner(
        t("banner.sabotage", {
          effect: t(`effect.${snap.appliedEffect}` as TranslationKey),
        }),
        "good",
      );
    }

    // Pursuit escalation alarms — re-arms after the squad fell back.
    if (
      pursuit !== null &&
      snap.pursuit > prev.pursuit &&
      ["nah", "unmittelbar"].includes(pursuit.level)
    ) {
      pushBanner(
        t("banner.pursuit", {
          detective: `D${pursuit.nearestIndex + 1}`,
          distance: pursuit.distance,
        }),
        "alarm",
      );
    }

    staged.current = snap;
  });

  // UI triggers, the engine rules: the store subscription drives the
  // whole detective phase deterministically after each ganove turn.
  useEffect(() => {
    if (!autoDetectives) {
      return;
    }
    return installDetectiveDriver(detectiveStepDelay);
  }, [autoDetectives, detectiveStepDelay]);

  // Sound dramaturgy (ganove-only tension channel): heat-level rises
  // trigger staged signals, a running game arms the quiet police
  // ambient. Without AudioContext or before the unlock gesture this
  // stays silent by design.
  useEffect(() => installGameAudio(), []);

  const nodeName = (nodeId: string): string =>
    map?.nodes.find((node) => node.id === nodeId)?.name ??
    setup?.map.nodes.find((node) => node.id === nodeId)?.name ??
    nodeId;

  /** Runs a store action; any rule rejection becomes a notice. */
  const runGuarded = (action: () => void) => {
    try {
      action();
      setNotice(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    }
  };

  const beginSetup = () =>
    runGuarded(() => {
      const params = readParams();
      const nextMap = loadMap(mapId ?? params.get("map") ?? "muenster");
      const rawSeed = seed ?? (params.get("seed") ? Number(params.get("seed")) : undefined);
      const gameSeed = rawSeed ?? nextSeed();
      const mission = options?.mission ?? resolveMissionOption(params.get("mission"));
      const startOptions = options ?? {};
      const detectiveCount =
        startOptions.detectiveCount ?? nextMap.settings.detectiveCount.suggested;
      const detectivePositions = pickDetectiveSpawns(nextMap, createRng(gameSeed), detectiveCount);
      const pending: PendingSetup = {
        map: nextMap,
        seed: gameSeed,
        mission,
        options: startOptions,
        detectivePositions,
      };
      // Spawn rule "random": the map assigns the ganove's start —
      // the pick view is skipped entirely (spec section 3).
      if (nextMap.spawnRules.ganove.mode === "random") {
        const ganovePosition = pickGanoveSpawnForMission(
          nextMap,
          createRng(gameSeed),
          detectivePositions,
          resolveFixedTargets(nextMap, mission),
        );
        startGame(pending, { detectivePositions, ganovePosition });
        return;
      }
      setSetup(pending);
    });

  const startGame = (
    pending: PendingSetup,
    positions: { detectivePositions: string[]; ganovePosition: string },
  ) => {
    const startOptions = {
      ...pending.options,
      ...positions,
      mission: pending.mission,
      // The played side lands in the log header for the mode statistics.
      playerMode: "ganove" as const,
    };
    try {
      useGameStore.getState().startGame(pending.map, pending.seed, startOptions);
    } catch (error) {
      if (!(error instanceof MissionGenerationError)) {
        throw error;
      }
      // "random" is impossible for this draw — fall back to "auto".
      useGameStore.getState().startGame(pending.map, pending.seed, {
        ...startOptions,
        mission: "auto",
      });
    }
    setSetup(null);
  };

  const pickSpawn = (nodeId: string) =>
    runGuarded(() => {
      if (setup === null) {
        return;
      }
      startGame(setup, {
        detectivePositions: setup.detectivePositions,
        ganovePosition: nodeId,
      });
    });

  // Menu-driven entry: skip the idle view when `startImmediately` is
  // set (StrictMode-safe — the guard swallows the double effect call).
  useEffect(() => {
    if (startImmediately && !autoStarted.current) {
      autoStarted.current = true;
      beginSetup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startImmediately]);

  const restart = () => {
    useGameStore.getState().resetGame();
    setSetup(null);
    setAbortConfirm(false);
    setNotice(null);
  };

  /** "Partie speichern" — snapshot + log land under `RESUME_STORAGE_KEY`. */
  const saveGame = () => {
    const entry = buildResumeEntry(useGameStore.getState(), "ganove");
    if (entry !== null) {
      saveResumeEntry(entry);
      setNotice(t("save.done"));
    }
  };

  // ---- idle / start view ----
  if (map === null && setup === null) {
    return <IdleView notice={notice} onStart={beginSetup} />;
  }

  // ---- spawn choice view (detectives placed, ganove picks last) ----
  if (map === null && setup !== null) {
    return <PickSpawnView setup={setup} notice={notice} onPick={pickSpawn} />;
  }

  // ---- running / finished game view ----
  const runningMap = map as MapPack;
  const legalMoves = useGameStore.getState().getLegalGanoveMoves();
  const missionAction = useGameStore.getState().getMissionAction();
  const pendingChoice = mission?.pendingChoice ?? null;
  const heat = useGameStore.getState().getHeatLevel();
  const pursuit =
    ganovePosition !== null && outcome === null
      ? pursuitStatus(runningMap, blockedEdges, round, ganovePosition, detektivePositions)
      : null;
  const intel = visibleEvents(events, "ganove");
  const radioHints = intel
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
    <div className={styles.screen} data-testid="ganove-screen" data-view="playing">
      <header className={styles.header}>
        <h1 className={styles.title}>{t("app.title")}</h1>
        <div className={styles.statusBar}>
          <span className={styles.round} data-testid="round-indicator">
            {roundLimit !== null
              ? t("game.roundLimit", { round, limit: roundLimit })
              : t("game.round", { round })}
          </span>
          <span className={styles.phase} data-testid="phase-indicator" aria-live="polite">
            {phase === "ganove" ? t("game.phase.ganove") : t("game.phase.detektive")}
          </span>
          <HeatBadge level={heat.level} score={heat.score} />
          {pursuit !== null ? <PursuitBadge status={pursuit} /> : null}
        </div>
      </header>
      <div className={styles.layout}>
        <div className={styles.mapArea} data-pursuit={pursuit?.level ?? undefined}>
          <MapGraph
            map={runningMap}
            round={round}
            blockedEdges={blockedEdges}
            flashEdges={flashEdges}
            detectivePositions={detektivePositions}
            ganovePosition={ganovePosition}
            legalTargets={pendingChoice === null && outcome === null ? legalMoves : []}
            missionTargets={mission?.targets ?? {}}
            currentTargetId={
              pendingChoice !== null ? pendingChoice.sabotageNode : currentMissionTarget(mission)
            }
            escapeNodeIds={escapeNodeIds}
            onNodeSelect={(nodeId) => runGuarded(() => useGameStore.getState().moveGanove(nodeId))}
          />
          <EventBanner banners={banners} />
          {outcome !== null ? (
            <div
              className={`${styles.splash} ${styles[`splash_${outcome}`]}`}
              data-testid="outcome-splash"
              aria-hidden="true"
            >
              {t(OUTCOME_KEY[outcome])}
            </div>
          ) : null}
          <MapLegend />
        </div>
        <aside className={styles.sidebar}>
          {outcome === null ? (
            <>
              {phase === "ganove" && pendingChoice === null ? (
                <p className={styles.hint} data-testid="play-hint">
                  {missionAction !== null ? t("game.hint.moveOrAct") : t("game.hint.move")}
                </p>
              ) : null}
              <MissionPanel
                mission={mission}
                nodeName={nodeName}
                onChooseMissionPath={(choice) => useGameStore.getState().chooseMissionPath(choice)}
              />
              {missionAction !== null && phase === "ganove" ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  data-testid="mission-action"
                  onClick={() => runGuarded(() => useGameStore.getState().ganoveAction())}
                >
                  {t(ACTION_KEY[missionAction] ?? "mission.action.execute")}
                </button>
              ) : null}
              <section className={styles.panel} aria-label={t("intel.title")}>
                <h2 className={styles.panelHeading}>{t("intel.title")}</h2>
                {intel.length === 0 ? (
                  <p className={styles.hint} data-testid="intel-empty">
                    {t("intel.empty")}
                  </p>
                ) : (
                  <ul className={styles.intelList} data-testid="intel-feed">
                    {intel.map((event, index) =>
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
              <button
                type="button"
                className={styles.secondaryButton}
                data-testid="radio-button"
                disabled={radioUsed}
                onClick={() => runGuarded(() => useGameStore.getState().useRadio())}
              >
                {radioUsed ? t("radio.used") : t("radio.button")}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                data-testid="save-button"
                onClick={saveGame}
              >
                {t("save.button")}
              </button>
              {abortConfirm ? (
                <div className={styles.confirm} data-testid="abort-confirm">
                  <p className={styles.hint}>{t("abort.confirm")}</p>
                  <button
                    type="button"
                    className={styles.dangerButton}
                    data-testid="abort-yes"
                    onClick={() =>
                      runGuarded(() => {
                        useGameStore.getState().abortAsDraw();
                        setAbortConfirm(false);
                      })
                    }
                  >
                    {t("abort.yes")}
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setAbortConfirm(false)}
                  >
                    {t("abort.no")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  data-testid="abort-button"
                  onClick={() => setAbortConfirm(true)}
                >
                  {t("abort.button")}
                </button>
              )}
            </>
          ) : (
            <OutcomeView outcome={outcome} round={round} onRestart={restart} onExit={onExit} />
          )}
          {notice !== null ? (
            <p className={styles.notice} role="alert">
              {notice}
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
