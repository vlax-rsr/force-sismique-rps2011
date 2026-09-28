import { params } from "./utils.js";

export const UNITE_POIDS = ["kN", "daN", "kgf"];

export function saisirCharge(nom, symbole = null, valeur = 0.0, unite = "daN") {
  if (!UNITE_POIDS.includes(unite)) {
    throw new Error(`L'unité de poids n'est pas reconnue : ${unite}`);
  }
  if (valeur <= 0) {
    throw new Error(`${nom} : la valeur doit être supérieure à 0 (champ non renseigné)`);
  }

  return params(nom, symbole, valeur, unite);
}
