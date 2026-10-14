import { useState } from "react";
import { GanoveScreen } from "./components/GanoveScreen";
import { DetektivScreen } from "./components/DetektivScreen";
import { MainMenu } from "./components/MainMenu";
import { MapSelect } from "./components/MapSelect";
import { ModeSelect } from "./components/ModeSelect";
import { SettingsScreen } from "./components/SettingsScreen";
import { MissionSelect } from "./components/MissionSelect";
import { DevModeScreen } from "./components/DevModeScreen";
import { StatsScreen } from "./components/StatsScreen";
import { readParams } from "./components/gameSetup";
import type { MenuScreen, PendingGameConfig, PlayerMode } from "./components/menuFlow";
import type { MapPack } from "./logic/mapPack";
import type { MissionOption, StartGameOptions } from "./state/gameStore";
import { useGameStore } from "./state/gameStore";
import styles from "./App.module.css";

/**
 * Application frame (spec `02-technisches-konzept.md` section 6): a
 * state-driven flow — main menu → map → mode → settings → mission →
 * game — plus the dev mode (AI-vs-AI batch) and the stats view.
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
  const [map, setMap] = useState<MapPack | null>(null);
  const [mode, setMode] = useState<PlayerMode>("ganove");
  const [settings, setSettings] = useState<StartGameOptions>({});
  const [config, setConfig] = useState<PendingGameConfig | null>(null);

  const exitToMenu = () => {
    useGameStore.getState().resetGame();
    setConfig(null);
    setScreen("menu");
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
      content = <StatsScreen onBack={() => setScreen("menu")} />;
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
            startImmediately
            onExit={exitToMenu}
          />
        );
      } else {
        content = (
          <DetektivScreen
            mapId={config.mapId}
            seed={config.seed}
            options={config.options}
            startImmediately
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
