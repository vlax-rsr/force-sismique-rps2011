/*
 * L'application : ce que faisait `app.py` en dehors des routes.
 *
 * Contrepartie de `_defauts()`, `_calculer()` et des constantes de `app.py`.
 * Rien ici ne touche au DOM : la page (`site.js`) lit le formulaire, appelle ces
 * fonctions, et rend le résultat. C'est ce qui rend le domaine testable hors
 * d'un navigateur.
 */

import { nomFichierNote } from "./affichage.js";
import { COEFF_SITES, calculerForceSismique, formatNombre, libelleClasse } from "./pont.js";
import { intercepter } from "./domaine/journal.js";
import * as presentation from "./domaine/presentation.js";
import { valider, objets } from "./domaine/saisie.js";

export const TITRE = "Force sismique équivalente";
export const SOUS_TITRE = "RPS 2011";
export const FORMULE = "F = υ.I.D.S.W/K";

export const MESSAGE_SUCCES = "Calcul réalisé avec succès";

/* Nombre de communes proposées pendant la frappe : le `limite=12` que
 * l'ancien `site.js` envoyait à `/api/communes`. */
export const LIMITE_SUGGESTIONS = 12;

/* Les fautes portent le nom court du champ (H, Lx, Ly, S, Wx, Wy) ; le tableau
 * fait la correspondance vers le champ du formulaire à passer en rouge. */
export const CHAMPS = [
  { court: "Commune", id: "commune" },
  { court: "H", id: "hauteur" },
  { court: "Lx", id: "longueur_x" },
  { court: "Ly", id: "longueur_y" },
  { court: "S", id: "coef_site" },
  { court: "Wx", id: "poids_x" },
  { court: "Wy", id: "poids_y" },
];

/* Valeurs à réafficher, `_defauts()` de `app.py`.
 *
 * Les champs numériques sont repris tels qu'ils ont été tapés, les listes
 * déroulantes converties en libellé : un formulaire refusé revient donc à
 * l'identique. S5 n'ayant pas de valeur forfaitaire, un S laissé vide y reste
 * vide.
 */
export function defautsDe(saisie) {
  const defauts = saisie.en_dictionnaire();
  defauts.za = String(saisie.za);
  defauts.zv = String(saisie.zv);
  defauts.ossature = saisie.ossature ? saisie.ossature : "";
  defauts.classe = saisie.classe ? libelleClasse(saisie.classe) : "";
  defauts.classe_site = saisie.site;
  defauts.unite = saisie.unite ? saisie.unite : "";
  if (!defauts.coef_site.trim()) {
    const forfaitaire = COEFF_SITES[saisie.site];
    defauts.coef_site = forfaitaire === undefined ? "" : formatNombre(forfaitaire);
  }
  return defauts;
}

/* Contrôle la saisie puis appelle le domaine. Lève si elle est refusée.
 *
 * La note est horodatée une fois pour toutes : l'écran et le fichier téléchargé
 * portent le même texte, daté de la même seconde. */
export function calculer(saisie) {
  valider(saisie);
  const [localisation, geometrie, batiment, poids] = objets(saisie);
  const entree = [localisation, geometrie, batiment, poids];
  const moment = new Date();

  const capture = intercepter();
  let resultats;
  try {
    resultats = calculerForceSismique(localisation, geometrie, batiment, poids);
  } finally {
    capture.fermer();
  }

  return {
    moment,
    fichier: nomFichierNote(moment),
    entree,
    resultats,
    parametres: presentation.parametres_rps(resultats),
    directions: presentation.directions(resultats, poids),
    alertes: presentation.alertes(resultats).concat(capture.messages),
    note: presentation.note(resultats, ...entree, moment),
  };
}
