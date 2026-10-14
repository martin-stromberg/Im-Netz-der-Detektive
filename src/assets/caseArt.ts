/**
 * Case artwork lookup (step 14 polishing): generated illustrations per
 * bundled mission case, keyed `"<mapId>/<caseId>"`. Cases without an
 * entry render text-only — the map-agnostic UI never depends on art.
 * Source and licence details live in `ASSETS.md` (same directory).
 */
import caseDiebstahlserie from "./case-diebstahlserie-altstadt.jpg";
import caseKurier from "./case-kurier-am-hafen.jpg";

export const CASE_ART: Readonly<Record<string, string>> = {
  "muenster/diebstahlserie-altstadt": caseDiebstahlserie,
  "muenster/kurier-am-hafen": caseKurier,
};
