/* --- Facteur de comportement ----
 *
 * Portage de `rps/comportement.py`. Tableau 3.3 de la RPS 2011 : K croise le
 * système de contreventement et le niveau de ductilité. Les voiles couplés n'y
 * figurent pas en ND3, et le domaine le dit plutôt que d'inventer une valeur.
 */

import { Source, params } from "./utils.js";

export const FACTEUR_COMPORTEMENT = {
  "Portique en béton armé": { ND1: 2.0, ND2: 3.5, ND3: 5.0 },
  "Portique et voile en béton armé": { ND1: 2.0, ND2: 3.0, ND3: 4.0 },
  "Voile en béton armé": { ND1: 1.4, ND2: 2.1, ND3: 2.8 },
  "Voiles couplés en béton armé": { ND1: 1.8, ND2: 2.5, ND3: 3.5 }, // ND3 omis car absent du tableau
  "Portique en charpente en acier à noeuds rigides": { ND1: 3.0, ND2: 4.5, ND3: 6.0 },
  "Ossature en charpente en acier contreventée": { ND1: 2.0, ND2: 3.0, ND3: 4.0 },
};

export const definition_F =
  "Facteur de réduction de la force sismique de calcul caractérisant la capacité " +
  "d'une structure à dissiper l'énergie par comportement inélastique.";

export function facteurComportement(nd, ossature) {
  if (!Object.prototype.hasOwnProperty.call(FACTEUR_COMPORTEMENT, ossature)) {
    throw new Error(
      "Type d'ossature non pris en charge pour le calcul du facteur de comportement : " +
        ossature,
    );
  }
  if (!Object.prototype.hasOwnProperty.call(FACTEUR_COMPORTEMENT[ossature], nd)) {
    throw new Error(
      `Niveau de ductilité ${nd} absent du tableau 3.3 pour l'ossature « ${ossature} »`,
    );
  }

  return params(
    "Facteur de comportement",
    "K",
    FACTEUR_COMPORTEMENT[ossature][nd],
    "-",
    definition_F,
    `K = f(${ossature}, ${nd})`,
    Source.FACTEUR_COMPORTEMENT,
    null,
  );
}
