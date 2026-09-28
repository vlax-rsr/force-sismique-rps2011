/* --- Niveau de ductilité ----
 *
 * Portage de `rps/ductilite.py`. Le tableau 3.2 de la RPS 2011 croise la classe
 * de construction et le coefficient de vitesse.
 */

import { Source, formatNombre, params } from "./utils.js";

export function niveauDuctilite(classe, coefVitesse) {
  if (![1, 2, 3].includes(classe)) {
    throw new Error(`Classe de construction non prise en charge: ${classe}`);
  }
  if (coefVitesse < 0.0) {
    throw new Error(`Le coefficient de vitesse ne doit pas être négatif: ${coefVitesse}`);
  }

  let nd;
  if (classe === 1 || classe === 2) {
    if (coefVitesse <= 0.1) {
      nd = "ND1";
    } else if (coefVitesse <= 0.2) {
      nd = "ND2";
    } else {
      nd = "ND3";
    }
  } else {
    nd = coefVitesse <= 0.2 ? "ND1" : "ND2";
  }

  return params(
    "Niveau de ductilité",
    "ND",
    nd,
    "-",
    "Niveau de ductilité en fonction de la classe de construction et du coefficient de vitesse",
    `ND = f(${classe}, ${formatNombre(coefVitesse)})`,
    Source.DUCTILITE,
    null,
  );
}
