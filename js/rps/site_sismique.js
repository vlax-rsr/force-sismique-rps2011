/* --- Coefficient de site ----
 *
 * Portage de `rps/site_sismique.py`. Le site S5 n'a pas de valeur forfaitaire :
 * sans la valeur issue d'une étude géotechnique, le domaine refuse de trancher.
 */

import { Source, params } from "./utils.js";
import { journaliser } from "../domaine/journal.js";

export const COEFF_SITE = {
  S1: 1.0,
  S2: 1.2,
  S3: 1.4,
  S4: 1.8,
};

export function coefficientSite(classeSite, valeurManuelle = null) {
  if (classeSite === "S5") {
    if (valeurManuelle === null || valeurManuelle === undefined) {
      throw new Error(
        "Site S5 : La valeur de S doit être déterminée par une étude " +
          "géotechnique. Veuillez saisir la valeur manuellement.",
      );
    }
    journaliser("S5 — valeur manuelle utilisée : S=" + valeurManuelle);
    return params(
      "Coefficient de site",
      "S",
      valeurManuelle,
      "-",
      "Coefficient de site",
      `S = f(${classeSite})`,
      Source.COEFF_SITE,
      "Valeur issue d'une étude géotechnique spécifique.",
    );
  }

  if (!Object.prototype.hasOwnProperty.call(COEFF_SITE, classeSite)) {
    throw new Error(`Site de classe inconnue: ${classeSite}`);
  }

  return params(
    "Coefficient de site",
    "S",
    COEFF_SITE[classeSite],
    "-",
    "Coefficient de site",
    `S = f(${classeSite})`,
    Source.COEFF_SITE,
    null,
  );
}
