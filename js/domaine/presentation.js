/*
 * Présentation des résultats : du domaine vers les données affichées.
 *
 * Portage de `domaine/presentation.py`. `Resultats` ne contient que des `Params`
 * immuables (valeur, unité, formule, source, remarque). Ce module les met en forme
 * une fois pour toutes, pour que la page n'ait ni à connaître la structure du
 * domaine, ni à formater les nombres elle-même. Le texte de la note de calcul, lui,
 * reste produit par `affichage.rendre_note`.
 */

import { rendre_note, source_texte, unite_texte, valeur_texte } from "../pont.js";

/* Un `Params` rendu affichable. */
export function ligne(param, decimales = 3, mis_en_avant = false) {
  return {
    symbole: param.symbole || "—",
    nom: param.nom,
    valeur: valeur_texte(param, decimales),
    valeur_brute: brut(param.valeur),
    unite: unite_texte(param),
    formule: param.formule || "—",
    source: source_texte(param) || "—",
    description: param.description || "",
    remarque: param.remarque || "",
    mis_en_avant,
  };
}

/* Valeur numérique, ou texte pour une énumération (le niveau ND). */
function brut(valeur) {
  return typeof valeur === "number" ? valeur : String(valeur);
}

/* υ, I, S, ND et K : les coefficients issus des tableaux de la norme. */
export function parametres_rps(res) {
  return [res.upsilon, res.I, res.S, res.nd, res.K].map((p) => ligne(p));
}

/* Les deux directions, chacune avec sa période, son amplification, W et F. */
export function directions(res, poids) {
  return [
    {
      code: "X",
      libelle: "Direction X",
      lignes: [
        ligne(res.Tx),
        ligne(res.Dx),
        ligne(poids.Wx),
        ligne(res.Fx, 2, true),
      ],
    },
    {
      code: "Y",
      libelle: "Direction Y",
      lignes: [
        ligne(res.Ty),
        ligne(res.Dy),
        ligne(poids.Wy),
        ligne(res.Fy, 2, true),
      ],
    },
  ];
}

/* Remarques émises par le domaine, à relayer à l'utilisateur.
 *
 * Le domaine signale les situations dégradées (zone hors tableau, valeur par
 * défaut, coefficient issu d'une étude géotechnique) dans la remarque de chaque
 * `Params` : il n'y a pas d'avertissement à reconstruire ici.
 */
export function alertes(res) {
  const vus = [];
  for (const param of tous(res)) {
    if (param.remarque && !vus.includes(param.remarque)) {
      vus.push(param.remarque);
    }
  }
  return vus;
}

function tous(res) {
  return [
    res.upsilon,
    res.I,
    res.S,
    res.nd,
    res.K,
    res.Tx,
    res.Ty,
    res.Dx,
    res.Dy,
    res.Wx,
    res.Wy,
    res.Fx,
    res.Fy,
  ];
}

/* Note de calcul horodatée. */
export function note(res, ...entree) {
  return rendre_note(res, ...entree);
}
