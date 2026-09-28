/* --- Procédure de calcul ----
 *
 * Portage de `rps/calcul_sismique.py`. La fonction publie ne fait qu'ordonner
 * les coefficients de la norme : elle n'en calcule aucun elle-même.
 */

import {
  Source,
  ZONES_ACCELERATION,
  ZONES_VITESSE,
  creerBatiment,
  geometrie,
  params,
  zoneSismique,
} from "./utils.js";
import { facteurAmplification } from "./amplification.js";
import { facteurComportement } from "./comportement.js";
import { niveauDuctilite } from "./ductilite.js";
import { forceSismique } from "./force_sismique.js";
import { coefficientImportance } from "./importance.js";
import { resultats } from "./parametre.js";
import { calculPeriode } from "./periode.js";
import { coefficientSite } from "./site_sismique.js";
import { coefficientVitesse } from "./zone_sismique.js";

export function creerLocalisation(Za, Zv) {
  if (!ZONES_ACCELERATION.includes(Za)) {
    throw new Error(`La valeur de Za : ${Za} non reconnue`);
  }
  if (!ZONES_VITESSE.includes(Zv)) {
    throw new Error(`La valeur de Zv : ${Zv} non reconnue`);
  }

  return zoneSismique(Za, Zv);
}

export function creerGeometrie(hauteur, longueurX, longueurY) {
  if (hauteur <= 0) {
    throw new Error("La hauteur doit être supérieure à 0");
  }
  if (longueurX <= 0) {
    throw new Error("La longueur_x doit être supérieure à 0");
  }
  if (longueurY <= 0) {
    throw new Error("La longueur_y doit être supérieure à 0");
  }

  return geometrie(hauteur, longueurX, longueurY);
}

export { creerBatiment };

export function calculerForceSismique(localisation, geometrie, batiment, loads) {
  // Coefficient de vitesse
  const za = localisation.za;
  const zv = localisation.zv;
  const upsilon = coefficientVitesse(localisation.zv);

  // Coefficient d'importance
  const I = coefficientImportance(batiment.classe);

  // Périodes
  const Tx = calculPeriode(geometrie.hauteur, geometrie.longueur_x, batiment.type_ossature, "X");
  const Ty = calculPeriode(geometrie.hauteur, geometrie.longueur_y, batiment.type_ossature, "Y");

  // Facteurs d'amplification
  const Dx = facteurAmplification(za, zv, Tx.valeur, "X");
  const Dy = facteurAmplification(za, zv, Ty.valeur, "Y");

  // Coefficient de site
  const S = coefficientSite(batiment.classe_site, batiment.coef_site_manuel);

  // Niveau de ductilité
  const nd = niveauDuctilite(batiment.classe, upsilon.valeur);

  // Facteur de comportement
  const K = facteurComportement(nd.valeur, batiment.type_ossature);

  // Forces sismiques
  const Fx = forceSismique(upsilon.valeur, I.valeur, Dx.valeur, S.valeur, loads.Wx.valeur, K.valeur);
  const Fy = forceSismique(upsilon.valeur, I.valeur, Dy.valeur, S.valeur, loads.Wy.valeur, K.valeur);

  return resultats({
    upsilon,
    I,
    S,
    nd,
    K,
    Tx,
    Ty,
    Dx,
    Dy,
    Wx: loads.Wx,
    Wy: loads.Wy,
    Fx: forceParams("X", Fx, loads.Wx),
    Fy: forceParams("Y", Fy, loads.Wy),
  });
}

function forceParams(direction, force, poids) {
  return params(
    `Force sismique ${direction}`,
    "F",
    force,
    poids.unite,
    `Force sismique équivalente dans la direction ${direction}`,
    "F = υ.I.D.S.W/K",
    Source.CALCULE,
    null,
  );
}
