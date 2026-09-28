/* --- Période fondamentale de vibration ----
 *
 * Portage de `rps/periode.py`. La période dépend du système de contreventement :
 * dépendant de la hauteur seule pour les ossatures flexionnelles, elle fait
 * aussi intervenir la longueur dans la direction pour les systèmes en voiles.
 */

import { Source, SYSTEMES_CONTREVENTEMENT, params } from "./utils.js";

export function calculPeriode(hauteur, longueur, typeOssature, direction) {
  if (!SYSTEMES_CONTREVENTEMENT.includes(typeOssature)) {
    throw new Error(
      "Type d'ossature non pris en charge pour le calcul de la période fondamentale: " +
        typeOssature,
    );
  }

  let T;
  let formule;

  if (
    typeOssature === "Portique en béton armé" ||
    typeOssature === "Ossature en charpente en acier contreventée"
  ) {
    T = 0.075 * Math.pow(hauteur, 3 / 4);
    formule = `T(${direction}) = 0.075×H^(3/4)`;
  } else if (typeOssature === "Portique en charpente en acier à noeuds rigides") {
    T = 0.085 * Math.pow(hauteur, 3 / 4);
    formule = `T${direction} = 0.085×H^(3/4)`;
  } else {
    T = (0.09 * hauteur) / Math.pow(longueur, 0.5);
    formule = `T${direction} = 0.09×H / L^(0.5)`;
  }

  return params(
    `Période fondamentale ${direction}`,
    "T",
    T,
    "s",
    "Période fondamentale de vibration dans la direction spécifiée",
    formule,
    Source.CALCULE,
    null,
  );
}
