/* --- Coefficient d'importance ----
 *
 * Portage de `rps/importance.py`. Tableau 3.1 de la RPS 2011 : I ne dépend que
 * de la classe de construction.
 */

import { Source, params } from "./utils.js";
import { avertir } from "../domaine/journal.js";

export const COEF_IMPORTANCE = {
  1: 1.3,
  2: 1.2,
  3: 1.0,
};

export function coefficientImportance(classeConstruction) {
  let remarque = null;

  if (!Object.prototype.hasOwnProperty.call(COEF_IMPORTANCE, classeConstruction)) {
    remarque =
      `Classe de construction non prise en charge: ${classeConstruction}. ` +
      `Utilisation de la valeur par défaut (I = 1.0).`;
    avertir(remarque);
  }

  const coefI = Object.prototype.hasOwnProperty.call(COEF_IMPORTANCE, classeConstruction)
    ? COEF_IMPORTANCE[classeConstruction]
    : 1.0;

  return params(
    "Coefficient d'importance",
    "I",
    coefI,
    "-",
    "Coefficient d'importance",
    "f(classe_construction)",
    Source.COEFF_IMPORTANCE,
    remarque,
  );
}
