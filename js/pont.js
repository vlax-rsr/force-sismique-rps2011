/*
 * Accès au domaine RPS 2011 embarqué dans le site.
 *
 * Portage de `domaine/pont.py`. Ce module réexporte ce que le site consomme,
 * afin que rien ailleurs n'écrive `rps.quelqueChose` : les listes déroulantes du
 * formulaire viennent alors directement des énumérations de la norme, et ne
 * peuvent pas en diverger.
 */

/* --- Objets et fonctions de la norme --------------------------------------- */

export {
  CLASSES_CONSTRUCTION,
  CLASSES_SITE,
  NIVEAUX_DUCTILITE,
  Source,
  SYSTEMES_CONTREVENTEMENT,
  UNITE,
  ZONES_ACCELERATION,
  ZONES_VITESSE,
  calculerForceSismique,
  classeDepuisLibelle,
  coefficientSite,
  creerBatiment,
  creerGeometrie,
  creerLocalisation,
  formatNombre,
  libelleClasse,
  params,
  resultats,
  saisirCharge,
  UNITE_POIDS,
} from "./rps/index.js";

import { CLASSES_SITE, coefficientSite } from "./rps/index.js";

/* Site dont la valeur de S doit être fournie par une étude géotechnique. */
export const SITE_ETUDE = "S5";

/* Valeur forfaitaire de S pour S1 à S4, lue dans le tableau 5.2. S5 en est
 * dépourvu — `coefficientSite` refuse de trancher sans étude géotechnique — et
 * reste donc absent de cette table, comme dans l'interface de bureau. */
export const COEFF_SITES = Object.fromEntries(
  CLASSES_SITE.filter((site) => site !== SITE_ETUDE).map((site) => [site, coefficientSite(site).valeur]),
);

/* --- Présentation ---------------------------------------------------------- */

export { rendre_note, source_texte, unite_texte, valeur_texte } from "./affichage.js";
