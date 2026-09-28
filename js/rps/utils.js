/* Énumérations et objets de base du domaine RPS 2011.
 *
 * Portage de `rps/utils.py`. Les listes déroulantes du formulaire sont
 * derivées de ces listes, comme en Python : elles ne peuvent donc pas en
 * diverger.
 *
 * Les énumérations Python (`Enum`) deviennent ici des tableaux de valeurs
 * simples — un nombre, une chaîne, ou un objet `{valeur, libelle}` — parce que
 * JavaScript n'a pas d'énumération. Ce qui compte est conservé : l'ordre du
 * domaine, la valeur affichée, et la valeur numérique employée par les tables.
 */

/* --- Zones sismiques ------------------------------------------------------ */

export const ZONES_ACCELERATION = [0, 1, 2, 3, 4];
export const ZONES_VITESSE = [0, 1, 2, 3, 4];

/* --- Classe de construction ----------------------------------------------- */

/* `libelle` est ce qu'affiche la liste déroulante (« Classe III ») ; `valeur`
 * est le numéro dont la RPS 2011 se sert pour tabuler I et ND. */
export const CLASSES_CONSTRUCTION = [
  { valeur: 1, libelle: "Classe I" },
  { valeur: 2, libelle: "Classe II" },
  { valeur: 3, libelle: "Classe III" },
];

export function libelleClasse(classe) {
  const trouvee = CLASSES_CONSTRUCTION.find((c) => c.valeur === classe);
  return trouvee ? trouvee.libelle : "";
}

export function classeDepuisLibelle(texte) {
  const trouvee = CLASSES_CONSTRUCTION.find((c) => c.libelle === texte);
  return trouvee ? trouvee.valeur : undefined;
}

/* --- Classe de site ------------------------------------------------------- */

export const CLASSES_SITE = ["S1", "S2", "S3", "S4", "S5"];

/* --- Niveau de ductilité -------------------------------------------------- */

export const NIVEAUX_DUCTILITE = ["ND1", "ND2", "ND3"];

/* --- Système de contreventement -------------------------------------------- */

export const SYSTEMES_CONTREVENTEMENT = [
  // Béton armé
  "Portique en béton armé",
  "Portique et voile en béton armé",
  "Voile en béton armé",
  "Voiles couplés en béton armé",
  // Acier
  "Ossature en charpente en acier contreventée",
  "Portique en charpente en acier à noeuds rigides",
];

/* --- Unités et sources ---------------------------------------------------- */

export const UNITE = {
  kN: "kN",
  daN: "daN",
  kgf: "kgf",
  t: "t",
  s: "s",
  m: "m",
};

export const Source = {
  COEFF_VITESSE: "RPS 2011 - Tableau 5.1",
  COEFF_IMPORTANCE: "RPS 2011 - Tableau 3.1",
  COEFF_SITE: "RPS 2011 - Tableau 5.2",
  COEFF_AMPLIFICATION: "RPS 2011 - Tableau 5.3",
  FACTEUR_COMPORTEMENT: "RPS 2011 - Tableau 3.3",
  DUCTILITE: "RPS 2011 - Tableau 3.2",
  CALCULE: "Calculé selon les formules",
};

/* --- Objets du domaine ---------------------------------------------------- */

/* `ZoneSismique` et `Geometrie` ne sont que des porte-données : ce sont les
 * constructeurs de `calcul_sismique.js` qui valident avant de les remplir. */
export function zoneSismique(zoneAcceleration, zoneVitesse) {
  return { za: zoneAcceleration, zv: zoneVitesse };
}

export function geometrie(hauteur, longueurX, longueurY) {
  return { hauteur, longueur_x: longueurX, longueur_y: longueurY };
}

export function creerBatiment(typeOssature, classe, classeSite, coefSiteManuel = null) {
  return {
    type_ossature: typeOssature,
    classe,
    classe_site: classeSite,
    coef_site_manuel: coefSiteManuel,
  };
}

export function creerPoidsSismiques(Wx, Wy) {
  return { Wx, Wy };
}

/* `Params` est une dataclass gelée en Python : ici un objet simple, construit
 * par `params()` pour que les valeurs par défaut restent au même endroit. */
export function params(nom, symbole = null, valeur = 0.0, unite = "-",
                        description = null, formule = null, source = null, remarque = null) {
  return { nom, symbole, valeur, unite, description, formule, source, remarque };
}

/* --- Mise en forme -------------------------------------------------------- */

/* L'interpolation d'un flottant dans une formule doit produire la même chose
 * qu'en Python : `str(0.0)` vaut « 0.0 », et non « 0 ». Un entier reste un
 * entier — la classe de construction s'écrit « 1 », pas « 1.0 ». */
export function formatNombre(valeur) {
  if (typeof valeur === "string") {
    return valeur;
  }
  const texte = String(valeur);
  return /[.eE]/.test(texte) ? texte : `${texte}.0`;
}
