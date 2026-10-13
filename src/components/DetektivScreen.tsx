/**
 * DetektiveUI — the second game mode (spec `02-technisches-konzept.md`
 * section 6, `01-spielkonzept.md` section 6): a human commands the whole
 * detective squad against the AI ganove. The screen orchestrates the
 * views — start (idle), detective spawn choice (`choice`/`free` maps;
 * `random` maps auto-draw) and the running game — while every rule
 * decision stays in `useGameStore`: the UI only triggers actions
 * (`moveDetective`, `abortAsDraw`), and the store-bound `ganoveDriver`
 * plays the AI ganove turn automatically after the last detective move.
 *
 * Asymmetry is structural: the view never receives `ganovePosition` or
 * `mission.targets` — it renders only `visibleEvents(…, "detectives")`,
 * `visibleCameras(…, "detectives")` and `getMissionStructure()` (steps
 * and status, never drawn target nodes).
 *
 * Deduction tools (spec `01-spielkonzept.md` section 6):
 * - the hint chronicle lists every visible event with round, kind and
 *   node/zone, chronologically;
 * - marker pins with free-text comments are UI-side player notes (never
 *   enter the event log) and persist across rounds;
 * - the "possible positions" overlay renders exactly the node set from
 *   `deducePossiblePositions` — the same structure the detective AI uses.
 *
 * Dev/test hooks: URL params `?map=`, `?seed=`, `?mission=` (auto |
 * random | none | case:<id>) override the defaults; `autoGanove`
 * disables the driver for tests that drive turns manually.
 */
import { useEffect, useState } from "react";
import { t, type TranslationKey } from "../i18n";
import { useGameStore, type GameOutcome, type MissionOption } from "../state/gameStore";
import { installGanoveDriver } from "../state/ganoveDriver";
import { detectiveStartsFromLog } from "../state/detectiveDriver";
import { loadMap } from "../logic/MapLoader";
import { createRng } from "../logic/rng";
import { detectiveSpawnChoices, pickDetectiveSpawns } from "../logic/SpawnSystem";
import {
  MissionGenerationError,
  missionStructure,
  nodesByCategory,
  type MissionKind,
  type MissionStructureStep,
} from "../logic/MissionSystem";
import { deducePossiblePositions } from "../logic/Deduction";
import { visibleCameras, visibleEvents, type GameEvent } from "../logic/InformationSystem";
import type { MapPack } from "../logic/mapPack";
import { MapGraph } from "./MapGraph";
import { nextSeed, readParams, resolveMissionOption } from "./gameSetup";
import shared from "./GanoveScreen.module.css";
import styles from "./DetektivScreen.module.css";

export interface DetektivScreenProps {
  /** Map id — defaults to `?map=` or `"muenster"`. */
  mapId?: string;
  /** Game seed — defaults to `?seed=` or a `Date.now()`-derived value. */
  seed?: number;
  /** `false` disables the automatic AI ganove phase (test hook). */
  autoGanove?: boolean;
}

interface PendingSetup {
  map: MapPack;
  seed: number;
  mission: MissionOption;
  picks: string[];
}

const OUTCOME_KEY: Record<GameOutcome, `detektiv.outcome.${GameOutcome}`> = {
  caught: "detektiv.outcome.caught",
  surrounded: "detektiv.outcome.surrounded",
  escaped: "detektiv.outcome.escaped",
  timeout: "detektiv.outcome.timeout",
  draw: "detektiv.outcome.draw",
};

const STEP_KEY: Record<MissionKind, TranslationKey> = {
  diebstahl: "mission.step.diebstahl",
  kontakt: "mission.step.kontakt",
  sabotage: "mission.step.sabotage",
  flucht: "mission.step.flucht",
};

const STATUS_MARKER: Record<MissionStructureStep["status"], string> = {
  erledigt: "✓",
  aktuell: "▶",
  offen: "○",
};

/** Chronological one-line description of a detective-visible event. */
function chronicleText(event: GameEvent, nodeName: (id: string) => string): string {
  const params = {
    round: event.round,
    node: event.nodeId !== undefined ? nodeName(event.nodeId) : "?",
    zone: event.zone ?? "?",
  };
  switch (event.kind) {
    case "camera":
      return t("hint.kind.camera", params);
    case "sichtbarkeit":
      return t("hint.kind.sichtbarkeit", params);
    case "hinweis":
      return t("hint.kind.hinweis", params);
    case "aktion":
      return t("hint.kind.aktion", params);
    case "umwelt":
      return t("intel.umwelt", {
        a: event.edge !== undefined ? nodeName(event.edge.a) : "?",
        b: event.edge !== undefined ? nodeName(event.edge.b) : "?",
        untilRound: event.untilRound ?? "?",
      });
    case "polizeifunk":
      // Detective-filtered views never contain this kind.
      return "";
  }
}

/** Compact symbol legend for the detective map — shapes carry meaning. */
function MapLegend({ map }: { map: MapPack }) {
  const zones = [...new Set(map.nodes.map((node) => node.zone))].sort();
  return (
    <div className={shared.legend} data-testid="map-legend">
      <span className={shared.legendTitle}>{t("legend.title")}:</span>
      <span className={shared.legendItem}>
        <svg width="26" height="8" aria-hidden="true">
          <line x1="0" y1="4" x2="26" y2="4" className={shared.legendWeg} />
        </svg>
        {t("legend.weg")}
      </span>
      <span className={shared.legendItem}>
        <svg width="26" height="8" aria-hidden="true">
          <line x1="0" y1="4" x2="26" y2="4" className={shared.legendFahrt} />
        </svg>
        {t("legend.fahrt")}
      </span>
      <span className={shared.legendItem}>
        <svg width="12" height="12" aria-hidden="true">
          <rect x="1" y="1" width="10" height="10" rx="2" className={shared.legendDetective} />
        </svg>
        {t("legend.detective")}
      </span>
      <span className={shared.legendItem}>
        <svg width="14" height="12" aria-hidden="true">
          <rect x="0" y="2" width="9" height="7" rx="1.5" className={styles.legendCameraBody} />
          <path d="M 9 4.5 L 13 2.5 V 8.5 L 9 6.5 Z" className={styles.legendCameraLens} />
        </svg>
        {t("legend.camera")}
      </span>
      <span className={shared.legendItem}>
        <svg width="12" height="12" aria-hidden="true">
          <path
            d="M 6 4 A 4.5 4.5 0 1 1 5.99 4 Z M 6 11 L 3.2 6 L 8.8 6 Z"
            className={styles.legendPin}
          />
        </svg>
        {t("legend.marker")}
      </span>
      <span className={shared.legendItem}>
        <svg width="14" height="14" aria-hidden="true">
          <path d="M 7 0 L 14 7 L 7 14 L 0 7 Z" className={styles.legendDiamond} />
        </svg>
        {t("legend.possible")}
      </span>
      <span className={shared.legendItem}>
        <svg width="12" height="12" aria-hidden="true">
          <path d="M 3 11 V 1 H 9 L 7 3.5 L 9 6 H 3" className={styles.legendCategory} />
          <path d="M 5 4 L 9 8 L 9 8 Z" className={styles.legendCategory} />
        </svg>
        {t("legend.category")}
      </span>
      <span className={shared.legendItem} data-testid="legend-zones">
        {t("legend.zone")}: {zones.join(" · ")}
      </span>
    </div>
  );
}

function IdleView({ notice, onStart }: { notice: string | null; onStart: () => void }) {
  return (
    <div className={shared.screen} data-testid="detektiv-screen" data-view="idle">
      <header className={shared.header}>
        <h1 className={shared.title}>{t("app.title")}</h1>
        <p className={shared.subtitle}>{t("app.subtitle")}</p>
      </header>
      <section className={shared.panel} data-testid="start-panel">
        <p>{t("detektiv.setup.intro")}</p>
        <button type="button" className={shared.primaryButton} onClick={onStart}>
          {t("game.new")}
        </button>
        {notice !== null ? <p className={shared.notice}>{notice}</p> : null}
      </section>
    </div>
  );
}

function PickSpawnsView({
  setup,
  notice,
  onPick,
}: {
  setup: PendingSetup;
  notice: string | null;
  onPick: (nodeId: string) => void;
}) {
  const count = setup.map.settings.detectiveCount.suggested;
  const choices = detectiveSpawnChoices(setup.map);
  return (
    <div className={shared.screen} data-testid="detektiv-screen" data-view="pickSpawns">
      <header className={shared.header}>
        <h1 className={shared.title}>{t("game.setup.title", { map: setup.map.name })}</h1>
        <p>{t("detektiv.setup.pickSpawn", { index: setup.picks.length + 1, count })}</p>
      </header>
      <MapGraph
        map={setup.map}
        detectivePositions={setup.picks}
        activeDetectiveIndex={setup.picks.length > 0 ? setup.picks.length - 1 : null}
        selectableNodeIds={choices}
        showCategories
        showZones
        onNodeSelect={onPick}
      />
      <MapLegend map={setup.map} />
      {notice !== null ? <p className={shared.notice}>{notice}</p> : null}
    </div>
  );
}

function OutcomeView({
  outcome,
  round,
  onRestart,
}: {
  outcome: GameOutcome;
  round: number;
  onRestart: () => void;
}) {
  return (
    <section className={shared.panel} data-testid="outcome-panel" data-outcome={outcome}>
      <h2 className={shared.panelHeading}>{t("outcome.title")}</h2>
      <p className={shared.outcomeText}>{t(OUTCOME_KEY[outcome])}</p>
      <p className={shared.hint}>{t("game.round", { round })}</p>
      <button type="button" className={shared.primaryButton} onClick={onRestart}>
        {t("game.new")}
      </button>
    </section>
  );
}

export function DetektivScreen({ mapId, seed, autoGanove = true }: DetektivScreenProps) {
  const map = useGameStore((s) => s.map);
  const round = useGameStore((s) => s.round);
  const roundLimit = useGameStore((s) => s.roundLimit);
  const phase = useGameStore((s) => s.phase);
  const activeDetectiveIndex = useGameStore((s) => s.activeDetectiveIndex);
  const detektivePositions = useGameStore((s) => s.detektivePositions);
  const events = useGameStore((s) => s.events);
  const cameras = useGameStore((s) => s.cameras);
  const blockedEdges = useGameStore((s) => s.blockedEdges);
  // Select the mission (stable reference) and derive the structure in
  // render — `getMissionStructure()` returns a fresh array per call,
  // which would loop zustand's selector equality forever.
  const mission = useGameStore((s) => s.mission);
  const outcome = useGameStore((s) => s.outcome);

  const [setup, setSetup] = useState<PendingSetup | null>(null);
  const [abortConfirm, setAbortConfirm] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Deduction tools: player notes (UI state — never enter the event log).
  const [markers, setMarkers] = useState<Record<string, string>>({});
  const [markerMode, setMarkerMode] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  // UI triggers, the engine rules: the subscription plays the whole AI
  // ganove phase deterministically after the last detective move.
  useEffect(() => {
    if (!autoGanove) {
      return;
    }
    return installGanoveDriver();
  }, [autoGanove]);

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
      const mission = resolveMissionOption(params.get("mission"));
      setMarkers({});
      setMarkerMode(false);
      // "random" spawn rule: the map assigns the posts, no pick view —
      // the ganove's start stays hidden either way (store draws it).
      if (nextMap.spawnRules.detectives.mode === "random") {
        const positions = pickDetectiveSpawns(
          nextMap,
          createRng(gameSeed),
          nextMap.settings.detectiveCount.suggested,
        );
        startGame(nextMap, gameSeed, mission, { detectivePositions: positions });
        return;
      }
      setSetup({ map: nextMap, seed: gameSeed, mission, picks: [] });
    });

  const startGame = (
    nextMap: MapPack,
    gameSeed: number,
    mission: MissionOption,
    options: { detectivePositions: string[] },
  ) => {
    try {
      useGameStore.getState().startGame(nextMap, gameSeed, { ...options, mission });
    } catch (error) {
      if (!(error instanceof MissionGenerationError)) {
        throw error;
      }
      // "random" is impossible for this draw — fall back to "auto".
      useGameStore.getState().startGame(nextMap, gameSeed, { ...options, mission: "auto" });
    }
    setSetup(null);
  };

  const pickSpawn = (nodeId: string) =>
    runGuarded(() => {
      if (setup === null) {
        return;
      }
      const picks = [...setup.picks, nodeId];
      if (picks.length >= setup.map.settings.detectiveCount.suggested) {
        startGame(setup.map, setup.seed, setup.mission, { detectivePositions: picks });
      } else {
        setSetup({ ...setup, picks });
      }
    });

  const restart = () => {
    useGameStore.getState().resetGame();
    setSetup(null);
    setAbortConfirm(false);
    setMarkers({});
    setMarkerMode(false);
    setNotice(null);
  };

  // ---- idle / start view ----
  if (map === null && setup === null) {
    return <IdleView notice={notice} onStart={beginSetup} />;
  }

  // ---- detective spawn choice view (ganove start stays hidden) ----
  if (map === null && setup !== null) {
    return <PickSpawnsView setup={setup} notice={notice} onPick={pickSpawn} />;
  }

  // ---- running / finished game view ----
  const runningMap = map as MapPack;
  // Steps + status only — `missionStructure` never carries target ids.
  const structure = missionStructure(mission);
  const playing = outcome === null;
  const moving = playing && phase === "detektive" && !markerMode;
  const legalMoves = moving ? useGameStore.getState().getLegalDetectiveMoves() : [];
  // Detective-visible data only — the asymmetry is a data filter, not a
  // display filter: ganove-only events can never reach the chronicle.
  const intel = visibleEvents(events, "detectives");
  const squadCameras = visibleCameras(cameras, "detectives");
  const possibleNodeIds = showOverlay
    ? deducePossiblePositions({
        map: runningMap,
        detectiveStarts: detectiveStartsFromLog(useGameStore.getState().log),
        events: intel,
        cameras: squadCameras,
        round,
        detectivePositions: detektivePositions,
      })
    : [];
  const markedNodeIds = Object.keys(markers);
  const markerNodes = moving ? [] : markerMode ? runningMap.nodes.map((node) => node.id) : [];

  const onNodeSelect = (nodeId: string) => {
    if (markerMode) {
      setMarkers((current) => {
        const next = { ...current };
        if (nodeId in next) {
          delete next[nodeId];
        } else {
          next[nodeId] = "";
        }
        return next;
      });
      return;
    }
    runGuarded(() => useGameStore.getState().moveDetective(nodeId));
  };

  return (
    <div className={shared.screen} data-testid="detektiv-screen" data-view="playing">
      <header className={shared.header}>
        <h1 className={shared.title}>{t("app.title")}</h1>
        <div className={shared.statusBar}>
          <span className={shared.round} data-testid="round-indicator">
            {roundLimit !== null
              ? t("game.roundLimit", { round, limit: roundLimit })
              : t("game.round", { round })}
          </span>
          <span className={shared.phase} data-testid="phase-indicator">
            {phase === "detektive"
              ? t("detektiv.phase.active", { index: activeDetectiveIndex + 1 })
              : t("detektiv.phase.ganove")}
          </span>
        </div>
      </header>
      <div className={shared.layout}>
        <div className={shared.mapArea}>
          <MapGraph
            map={runningMap}
            round={round}
            blockedEdges={blockedEdges}
            detectivePositions={detektivePositions}
            activeDetectiveIndex={phase === "detektive" ? activeDetectiveIndex : null}
            legalTargets={legalMoves}
            markableNodeIds={markerNodes}
            markedNodeIds={markedNodeIds}
            possibleNodeIds={possibleNodeIds}
            cameras={squadCameras}
            showCategories
            showZones
            onNodeSelect={onNodeSelect}
          />
          <MapLegend map={runningMap} />
        </div>
        <aside className={shared.sidebar}>
          {outcome !== null ? (
            <OutcomeView outcome={outcome} round={round} onRestart={restart} />
          ) : null}
          {outcome === null && phase === "detektive" ? (
            <p className={shared.hint} data-testid="play-hint">
              {markerMode
                ? t("detektiv.hint.markerMode")
                : t("detektiv.hint.move", { index: activeDetectiveIndex + 1 })}
            </p>
          ) : null}
          {/* Mission structure, deduction tools and the chronicle stay
              visible after the game ends — reviewing the final state is
              part of the deduction game. */}
          <section className={shared.panel} aria-label={t("structure.title")}>
            <h2 className={shared.panelHeading}>{t("structure.title")}</h2>
            {structure.length === 0 ? (
              <p className={shared.hint} data-testid="structure-empty">
                {t("structure.none")}
              </p>
            ) : (
              <>
                <ol className={styles.steps} data-testid="mission-structure">
                  {structure.map((step) => (
                    <li
                      key={step.kind}
                      className={`${styles.step} ${styles[`status_${step.status}`]}`}
                      data-mission-step={step.kind}
                      data-step-status={step.status}
                    >
                      <span className={styles.stepMarker} aria-hidden="true">
                        {STATUS_MARKER[step.status]}
                      </span>
                      <span>{t(STEP_KEY[step.kind])}</span>
                      <span className={styles.pool}>
                        {t("structure.pool", {
                          count: nodesByCategory(runningMap, step.kind).length,
                        })}
                      </span>
                    </li>
                  ))}
                </ol>
                <p className={shared.hint}>{t("structure.targetHidden")}</p>
              </>
            )}
          </section>
          <section className={shared.panel} aria-label={t("tools.title")}>
            <h2 className={shared.panelHeading}>{t("tools.title")}</h2>
            <label className={styles.toolToggle}>
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
            <button
              type="button"
              className={shared.secondaryButton}
              data-testid="marker-toggle"
              aria-pressed={markerMode}
              onClick={() => setMarkerMode((current) => !current)}
            >
              {t("tools.markerToggle")}
            </button>
            <div className={styles.markerList} data-testid="marker-list">
              <h3 className={styles.markerHeading}>{t("markers.title")}</h3>
              {markedNodeIds.length === 0 ? (
                <p className={shared.hint}>{t("markers.empty")}</p>
              ) : (
                <ul className={styles.markers}>
                  {markedNodeIds.map((nodeId) => (
                    <li key={nodeId} className={styles.markerItem} data-marker-item={nodeId}>
                      <span className={styles.markerName}>{nodeName(nodeId)}</span>
                      <input
                        type="text"
                        className={styles.commentInput}
                        aria-label={t("markers.comment", { name: nodeName(nodeId) })}
                        placeholder={t("markers.commentPlaceholder")}
                        value={markers[nodeId] ?? ""}
                        onChange={(event) =>
                          setMarkers((current) => ({
                            ...current,
                            [nodeId]: event.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        className={styles.removeButton}
                        aria-label={t("markers.remove", { name: nodeName(nodeId) })}
                        onClick={() =>
                          setMarkers((current) => {
                            const next = { ...current };
                            delete next[nodeId];
                            return next;
                          })
                        }
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
          <section className={shared.panel} aria-label={t("chronicle.title")}>
            <h2 className={shared.panelHeading}>{t("chronicle.title")}</h2>
            {intel.length === 0 ? (
              <p className={shared.hint} data-testid="chronicle-empty">
                {t("chronicle.empty")}
              </p>
            ) : (
              <ul className={shared.intelList} data-testid="chronicle-feed">
                {intel.map((event, index) => (
                  <li key={index} data-hint-event={event.kind}>
                    <span className={styles.roundBadge}>
                      {t("app.round", { round: event.round })}
                    </span>{" "}
                    {chronicleText(event, nodeName)}
                  </li>
                ))}
              </ul>
            )}
          </section>
          {outcome === null ? (
            abortConfirm ? (
              <div className={shared.confirm} data-testid="abort-confirm">
                <p className={shared.hint}>{t("abort.confirm")}</p>
                <button
                  type="button"
                  className={shared.dangerButton}
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
                  className={shared.secondaryButton}
                  onClick={() => setAbortConfirm(false)}
                >
                  {t("abort.no")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={shared.secondaryButton}
                data-testid="abort-button"
                onClick={() => setAbortConfirm(true)}
              >
                {t("abort.button")}
              </button>
            )
          ) : null}
          {notice !== null ? <p className={shared.notice}>{notice}</p> : null}
        </aside>
      </div>
    </div>
  );
}
