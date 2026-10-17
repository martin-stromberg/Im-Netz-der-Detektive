import { useEffect, useState } from "react";
import { GanoveScreen } from "./components/GanoveScreen";
import { DetektivScreen } from "./components/DetektivScreen";
import { MainMenu } from "./components/MainMenu";
import { MapSelect } from "./components/MapSelect";
import { ModeSelect } from "./components/ModeSelect";
import { SettingsScreen } from "./components/SettingsScreen";
import { MissionSelect } from "./components/MissionSelect";
import { DevModeScreen } from "./components/DevModeScreen";
import { StatsScreen } from "./components/StatsScreen";
import { ResumeScreen } from "./components/ResumeScreen";
import { ReplayScreen } from "./components/ReplayScreen";
import { AppSettingsScreen } from "./components/AppSettingsScreen";
import { readParams } from "./components/gameSetup";
import type { MenuScreen, PendingGameConfig, PlayerMode } from "./components/menuFlow";
import type { MapPack } from "./logic/mapPack";
import { loadMap } from "./logic/MapLoader";
import { deleteResumeEntry, type ResumeEntry } from "./logic/GameIndex";
import { resumeLogEntries } from "./logic/SaveGame";
import type { MissionOption, StartGameOptions } from "./state/gameStore";
import { useGameStore } from "./state/gameStore";
import { useUiPrefs } from "./state/uiPrefs";
import { installAudioUnlock } from "./audio/gameAudio";
import styles from "./App.module.css";

/**
 * Application frame (spec `02-technisches-konzept.md` section 6): a
 * state-driven flow — main menu → map → mode → settings → mission →
 * game — plus the dev mode (AI-vs-AI batch), the stats view, the
 * resume picker ("Partie fortsetzen") and the replay player.
 * No router package; the `?mode=ganove|detektiv` URL parameter remains
 * a dev/E2E deep link straight into the game screens' own setup.
 */
function initialMode(): PlayerMode | null {
  const raw = readParams().get("mode");
  return raw === "ganove" || raw === "detektiv" ? raw : null;
}

export default function App() {
  const [deepLink] = useState<PlayerMode | null>(initialMode);
  const [screen, setScreen] = useState<MenuScreen>("menu");
  // One root subscription to the UI language: a runtime switch re-renders
  // the whole screen tree, so every `t()` call resolves the new catalog.
  const language = useUiPrefs((s) => s.language);
  const [map, setMap] = useState<MapPack | null>(null);
  const [mode, setMode] = useState<PlayerMode>("ganove");
  const [settings, setSettings] = useState<StartGameOptions>({});
  const [config, setConfig] = useState<PendingGameConfig | null>(null);
  const [replayLog, setReplayLog] = useState<string | null>(null);
  // Bumped after a damaged resume entry is dropped — remounts the list.
  const [resumeRefresh, setResumeRefresh] = useState(0);

  // <html lang> follows the UI language for assistive technology.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Autoplay policy: the AudioContext may only start on a user gesture —
  // a one-shot global listener unlocks the engine on the first input.
  useEffect(() => installAudioUnlock(), []);

  const exitToMenu = () => {
    useGameStore.getState().resetGame();
    setConfig(null);
    setScreen("menu");
  };

  /**
   * "Partie fortsetzen": restores the snapshot into the store and hands
   * the saved perspective to the matching game screen — the store's
   * `map !== null` puts the screen straight into its playing view. A
   * damaged entry (unknown map, corrupt JSONL) is dropped and the
   * resume list is shown again.
   */
  const resumeSavedGame = (entry: ResumeEntry) => {
    try {
      const entryMap = loadMap(entry.mapId);
      useGameStore.getState().resumeGame(entryMap, entry.snapshot, resumeLogEntries(entry));
      setConfig({ mapId: entry.mapId, mode: entry.mode, options: entry.options });
      setScreen("game");
    } catch {
      deleteResumeEntry(entry.gameId);
      setResumeRefresh((count) => count + 1);
    }
  };

  const openReplay = (jsonl: string) => {
    setReplayLog(jsonl);
    setScreen("replay");
  };

  // Dev/E2E deep link — unchanged behaviour: the screens run their own
  // URL-parameter-driven setup (idle → spawn pick → playing).
  if (deepLink === "ganove") {
    return (
      <main className={styles.shell}>
        <GanoveScreen />
      </main>
    );
  }
  if (deepLink === "detektiv") {
    return (
      <main className={styles.shell}>
        <DetektivScreen />
      </main>
    );
  }

  const pickMission = (mission: MissionOption) => {
    if (map === null) {
      return;
    }
    setConfig({ mapId: map.id, mode, options: { ...settings, mission } });
    setScreen("game");
  };

  let content: JSX.Element;
  switch (screen) {
    case "map":
      content = (
        <MapSelect
          onBack={() => setScreen("menu")}
          onSelect={(picked) => {
            setMap(picked);
            setScreen("mode");
          }}
        />
      );
      break;
    case "mode":
      content = (
        <ModeSelect
          mapName={map?.name ?? ""}
          onBack={() => setScreen("map")}
          onSelect={(picked) => {
            if (picked === "dev") {
              setScreen("dev");
              return;
            }
            setMode(picked);
            setScreen("settings");
          }}
        />
      );
      break;
    case "settings":
      content =
        map !== null ? (
          <SettingsScreen
            map={map}
            onBack={() => setScreen("mode")}
            onContinue={(options) => {
              setSettings(options);
              setScreen("mission");
            }}
          />
        ) : (
          <MainMenu onNavigate={setScreen} />
        );
      break;
    case "mission":
      content =
        map !== null ? (
          <MissionSelect map={map} onBack={() => setScreen("settings")} onSelect={pickMission} />
        ) : (
          <MainMenu onNavigate={setScreen} />
        );
      break;
    case "dev":
      content = <DevModeScreen mapId={map?.id ?? "muenster"} onBack={() => setScreen("mode")} />;
      break;
    case "stats":
      content = <StatsScreen onBack={() => setScreen("menu")} onReplay={openReplay} />;
      break;
    case "appSettings":
      content = <AppSettingsScreen onBack={() => setScreen("menu")} />;
      break;
    case "resume":
      content = (
        <ResumeScreen
          key={resumeRefresh}
          onBack={() => setScreen("menu")}
          onResume={resumeSavedGame}
        />
      );
      break;
    case "replay":
      content =
        replayLog !== null ? (
          <ReplayScreen
            jsonl={replayLog}
            onBack={() => {
              setReplayLog(null);
              setScreen("stats");
            }}
          />
        ) : (
          <StatsScreen onBack={() => setScreen("menu")} onReplay={openReplay} />
        );
      break;
    case "game":
      if (config === null) {
        content = <MainMenu onNavigate={setScreen} />;
      } else if (config.mode === "ganove") {
        content = (
          <GanoveScreen
            mapId={config.mapId}
            seed={config.seed}
            options={config.options}
            startImmediately={useGameStore.getState().map === null}
            onExit={exitToMenu}
          />
        );
      } else {
        content = (
          <DetektivScreen
            mapId={config.mapId}
            seed={config.seed}
            options={config.options}
            startImmediately={useGameStore.getState().map === null}
            onExit={exitToMenu}
          />
        );
      }
      break;
    default:
      content = <MainMenu onNavigate={setScreen} />;
  }

  return <main className={styles.shell}>{content}</main>;
}
