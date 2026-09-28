/* --- Coefficient de vitesse ----
 *
 * Portage de `rps/zone_sismique.py`. Le tableau est celui du RPS 2011
 * (tableau 5.1) : υ ne dépend que de la zone de vitesse Zv.
 */

import { Source, params } from "./utils.js";
import { avertir } from "../domaine/journal.js";

export const COEFF_VITESSE = {
  0: 0.0,
  1: 0.07,
  2: 0.1,
  3: 0.13,
  4: 0.17,
};

export function coefficientVitesse(zoneVitesse) {
  let coefV;
  let remarque = null;

  if (Object.prototype.hasOwnProperty.call(COEFF_VITESSE, zoneVitesse)) {
    coefV = COEFF_VITESSE[zoneVitesse];
  } else {
    remarque =
      `Zone de vitesse non prise en charge: ${zoneVitesse}. ` +
      `Utilisation de la valeur maximale (υ = 0.17).`;
    avertir(remarque);
    coefV = 0.17;
  }

  return params(
    "Coefficient de vitesse",
    "υ",
    coefV,
    "-",
    "Coefficient de vitesse",
    "f(zone_vitesse)",
    Source.COEFF_VITESSE,
    remarque,
  );
}
