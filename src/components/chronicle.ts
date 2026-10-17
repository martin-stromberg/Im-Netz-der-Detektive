/**
 * Shared chronicle formatting: the one-line description of a
 * detective-visible event, used by the live detective screen and the
 * replay player's detective perspective.
 */
import { t } from "../i18n";
import type { GameEvent } from "../logic/InformationSystem";

/** Chronological one-line description of a detective-visible event. */
export function chronicleText(event: GameEvent, nodeName: (id: string) => string): string {
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
