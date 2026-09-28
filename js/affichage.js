/*
 * Affichage du bilan de calcul : en-tête, données d'entrée, paramètres RPS,
 * résultats.
 *
 * Portage d'`affichage.py`. Ce module produit la note de calcul en texte brut,
 * colonnes alignées comprises : c'est le même fichier que le logiciel de bureau
 * exporte, et il doit le rester.
 *
 * Python aligne avec `{x:<8}`, `{x:>11}` et `str.center(78)`, et formate les
 * flottants avec `:.2f` puis `rstrip("0").rstrip(".")`. Les trois opérations sont
 * reprises ici telles quelles, pour que la note reste identique au caractère
 * près.
 */

import { libelleClasse } from "./rps/utils.js";

export const LARGEUR = 78;

function regle(caractere = "-") {
  return caractere.repeat(LARGEUR);
}

/* `str.ljust` / `str.rjust` / `str.center` de Python. */
function ljust(texte, largeur) {
  const s = String(texte);
  return s.length >= largeur ? s : s + " ".repeat(largeur - s.length);
}

function rjust(texte, largeur) {
  const s = String(texte);
  return s.length >= largeur ? s : " ".repeat(largeur - s.length) + s;
}

function center(texte, largeur) {
  const s = String(texte);
  if (s.length >= largeur) {
    return s;
  }
  const marg = largeur - s.length;
  const gauche = Math.floor(marg / 2) + (marg & largeur & 1);
  return " ".repeat(gauche) + s + " ".repeat(marg - gauche);
}

function titre(section) {
  return `\n${section.toUpperCase()}\n${regle()}`;
}

function droitFin(texte) {
  return texte.replace(/\s+$/, "");
}

export function unite_texte(param) {
  const unite = param.unite;
  return unite === null || unite === undefined ? "" : String(unite);
}

export function source_texte(param) {
  return param.source ? param.source : "";
}

function ligne(symbole, libelle, valeur, unite = "", source = "") {
  return droitFin(
    `  ${ljust(symbole, 8)} ${ljust(libelle, 32)} ${rjust(valeur, 11)} ${ljust(unite, 5)} ${source}`,
  );
}

/* Un `Params` porte tantôt un nombre (υ, I, S, K, T, D, W, F) et tantôt une
 * énumération (le niveau de ductilité, « ND1 »). Python distingue les deux via
 * `isinstance(valeur, Enum)` ; ici, le type suffit. */
export function valeur_texte(param, decimales = 4) {
  const valeur = param.valeur;
  if (typeof valeur === "string") {
    return valeur;
  }
  return valeur.toFixed(decimales).replace(/0+$/, "").replace(/\.$/, "");
}

function ligneParams(param, withSource = false, decimales = 2) {
  return ligne(
    param.symbole || "-",
    param.nom,
    valeur_texte(param, decimales),
    unite_texte(param),
    withSource ? source_texte(param) : "",
  );
}

export function rendre_entete(titreTexte, formule = "F = υ.I.D.S.W/K") {
  return [
    regle("="),
    center(titreTexte, LARGEUR),
    center(formule, LARGEUR),
    regle("="),
  ].join("\n");
}

export function rendre_donnees_entree(localisation, geo, batiment, poidsSismique) {
  return [
    titre("Données d'entrée"),
    "  Localisation",
    `    Zone d'accélération             Za = ${localisation.za}`,
    `    Zone de vitesse                 Zv = ${localisation.zv}`,
    "  Géométrie",
    `    Hauteur                         H  = ${geo.hauteur.toFixed(2)} m`,
    `    Longueur                        Lx = ${geo.longueur_x.toFixed(2)} m`,
    `    Longueur                        Ly = ${geo.longueur_y.toFixed(2)} m`,
    "  Structure",
    `    Ossature                           = ${batiment.type_ossature}`,
    `    Classe de construction             = ${libelleClasse(batiment.classe)}`,
    `    Classe de site                     = ${batiment.classe_site}` +
      `${batiment.coef_site_manuel !== null && batiment.coef_site_manuel !== undefined
        ? " (valeur manuelle)"
        : ""}`,
    "  Charges",
    ligneParams(poidsSismique.Wx, false, 2),
    ligneParams(poidsSismique.Wy, false, 2),
  ].join("\n");
}

export function rendre_parametres_rps(res) {
  const lignes = [
    titre("Paramètres RPS"),
    ligne("Sym", "Désignation", "Valeur", "Unité", "Source"),
  ];
  for (const param of [res.upsilon, res.I, res.S, res.nd, res.K]) {
    lignes.push(ligneParams(param, true, 2));
  }
  return lignes.join("\n");
}

export function rendre_resultats(res) {
  const lignes = [titre("Résultats")];
  const directions = [
    ["X", res.Tx, res.Dx, res.Wx, res.Fx],
    ["Y", res.Ty, res.Dy, res.Wy, res.Fy],
  ];

  for (const [direction, T, D, W, F] of directions) {
    lignes.push(`  Direction ${direction}`);
    lignes.push(ligne("Symbole", "Désignation", "Valeur", "Unité", ""));
    for (const param of [T, D]) {
      lignes.push(ligneParams(param));
    }
    lignes.push(ligneParams(F, false, 2));
  }
  lignes.push(regle("="));
  return lignes.join("\n");
}

export function rendre_bilan(res, localisation, geo, batiment, poidsSismique) {
  return [
    rendre_entete("CALCUL DE LA FORCE SISMIQUE ÉQUIVALENTE — RPS 2011"),
    rendre_donnees_entree(localisation, geo, batiment, poidsSismique),
    rendre_parametres_rps(res),
    rendre_resultats(res),
  ].join("\n");
}

/* `strftime("%d/%m/%Y à %H:%M:%S")`, en heure locale. */
export function horodatage(moment) {
  const deux = (n) => String(n).padStart(2, "0");
  const jour = deux(moment.getDate());
  const mois = deux(moment.getMonth() + 1);
  const annee = moment.getFullYear();
  const heure = deux(moment.getHours());
  const minute = deux(moment.getMinutes());
  const seconde = deux(moment.getSeconds());
  return `Calcul réalisé le ${jour}/${mois}/${annee} à ${heure}:${minute}:${seconde}`;
}

/* Le nom du fichier de la note, horodaté comme elle. */
export function nomFichierNote(moment) {
  const p = (n) => String(n).padStart(2, "0");
  return (
    `note_de_calcul_${moment.getFullYear()}${p(moment.getMonth() + 1)}${p(moment.getDate())}` +
    `_${p(moment.getHours())}${p(moment.getMinutes())}${p(moment.getSeconds())}.txt`
  );
}

/* Inscrit la date et l'heure du calcul sous le bandeau de la note. */
export function horodater(note, moment = new Date()) {
  const lignes = note.split("\n");
  for (let index = 1; index < lignes.length; index++) {
    if (/^=+$/.test(lignes[index])) {
      return [
        ...lignes.slice(0, index + 1),
        horodatage(moment),
        "",
        ...lignes.slice(index + 1),
      ].join("\n");
    }
  }
  return note;
}

/* Note de calcul : le bilan horodaté.
 *
 * C'est la source unique du texte de la note : la page l'affiche et l'exporte.
 */
export function rendre_note(res, localisation, geo, batiment, poidsSismique, moment = new Date()) {
  return horodater(rendre_bilan(res, localisation, geo, batiment, poidsSismique), moment);
}
