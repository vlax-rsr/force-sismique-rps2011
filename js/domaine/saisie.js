/*
 * Lecture et validation du formulaire.
 *
 * Portage de `domaine/saisie_web.py`. Les règles sont celles de l'interface de
 * bureau : une liste déroulante est toujours valide, un champ numérique doit être
 * strictement positif, et le coefficient S n'est exigé que pour le site S5, dont la
 * valeur n'a pas de forfait. Les noms courts des champs fautifs (H, Lx, Ly, S, Wx,
 * Wy) sont repris à l'identique pour que les messages d'erreur soient les mêmes
 * des deux côtés.
 */

import {
  CLASSES_CONSTRUCTION,
  CLASSES_SITE,
  SYSTEMES_CONTREVENTEMENT,
  UNITE_POIDS,
  SITE_ETUDE,
  ZONES_ACCELERATION,
  ZONES_VITESSE,
  creerBatiment,
  creerGeometrie,
  creerLocalisation,
  saisirCharge,
} from "../pont.js";
import * as communes from "./communes.js";

/* Clés du formulaire, dans l'ordre où le navigateur les envoie. */
export const CLES = [
  "commune",
  "za",
  "zv",
  "hauteur",
  "longueur_x",
  "longueur_y",
  "ossature",
  "classe",
  "classe_site",
  "coef_site",
  "poids_x",
  "poids_y",
  "unite",
];

/* Champs numériques du formulaire, tous convertis en flottant à la lecture. */
const CHAMPS_NUMERIQUES = ["hauteur", "longueur_x", "longueur_y", "coef_site", "poids_x", "poids_y"];

/* Champs soumis à la règle « renseigné et strictement positif ». Le coefficient S
 * en est exempté : il n'est exigé que pour le site S5, et S1 à S4 ont une valeur
 * forfaitaire que le domaine fournit de lui-même. */
const CHAMPS_EXIGES = ["hauteur", "longueur_x", "longueur_y", "poids_x", "poids_y"];

/* Champ du formulaire -> nom court, dans l'ordre du formulaire. */
const NOMS_CHAMPS = {
  commune: "Commune",
  hauteur: "H",
  longueur_x: "Lx",
  longueur_y: "Ly",
  coef_site: "S",
  poids_x: "Wx",
  poids_y: "Wy",
};

export const MESSAGE_ERREUR = "Les valeurs saisies sont erronées : ";
export const MESSAGE_VIDE = "Renseignez les données puis lancez le calcul.";
export const MESSAGE_COMMUNE_INCONNUE =
  "Commune « {texte} » introuvable dans le catalogue. Choisissez-la dans la liste " +
  "proposée, ou effacez le champ pour saisir Za et Zv à la main.";

/* Le formulaire est incomplet ou incohérent.
 *
 * Porte la liste des champs fautifs, pour que la page puisse les signaler en rouge
 * comme le fait l'interface de bureau.
 */
export class DonneesIncompletes extends Error {
  constructor(fautes) {
    super(fautes.length ? MESSAGE_ERREUR + fautes.join(", ") : MESSAGE_VIDE);
    this.fautes = fautes;
    this.name = "DonneesIncompletes";
  }
}

/* Une saisie de formulaire, validée ou non.
 *
 * `valeurs` conserve toujours les chaînes brutes envoyées par le navigateur : le
 * formulaire est ainsi réaffiché tel qu'il a été rempli, y compris quand il est
 * refusé.
 */
export class Saisie {
  constructor(valeurs = {}) {
    this.valeurs = valeurs;
    this.fautes = [];
    this.nombres = {};
    this.za = 0;
    this.zv = 0;
    this.ossature = null;
    this.classe = null;
    this.site = "S1";
    this.unite = null;
    this.commune = null;
    this.message_commune = "";
  }

  get valide() {
    return this.fautes.length === 0;
  }

  /* Vrai pour S5 : S n'a pas de valeur forfaitaire, il doit être saisi. */
  get site_manuel() {
    return this.site === SITE_ETUDE;
  }

  brut(champ, defaut = "") {
    const valeur = this.valeurs[champ];
    return valeur === undefined ? defaut : valeur;
  }

  nombre(champ) {
    const valeur = this.nombres[champ];
    return valeur === undefined ? 0.0 : valeur;
  }

  en_dictionnaire() {
    return { ...this.valeurs };
  }
}

/* Convertit une saisie en flottant, en acceptant la virgule décimale. */
function reel(valeur) {
  const nettoye = (valeur || "").trim().replace(",", ".");
  if (!nettoye) {
    return null;
  }
  const nombre = Number(nettoye);
  return Number.isFinite(nombre) ? nombre : null;
}

/* Retrouve l'élément d'une énumération à partir de ce que le navigateur a envoyé.
 *
 * Une liste déroulante envoie le libellé affiché, qui n'est pas toujours la valeur
 * de l'énumération : la classe de construction s'affiche « Classe III » pour la
 * valeur 3. `cle` extrait donc ce qui est réellement comparable, et `extraction`
 * ce que le domaine doit recevoir — la classe de construction étant la seule
 * énumération faite d'objets, il n'en veut que le numéro. */
function depuis(texte, enumeration, cle, defaut, extraction = (element) => element) {
  const cible = (texte || "").trim();
  const trouve = enumeration.find((element) => String(cle(element)) === cible);
  return trouve === undefined ? defaut : extraction(trouve);
}

/* Applique les zones du catalogue à la commune choisie, si elle est reconnue.
 *
 * Une commune reconnue fait autorité : ses zones priment sur les listes
 * déroulantes, dont la valeur n'est de toute façon pas informative tant que le
 * bâtiment n'est pas localisé. Un champ laissé vide ne change rien, et le site's
 * calcul se fait alors sur Za et Zv saisis à la main.
 */
function resoudreCommune(saisie) {
  const texte = saisie.brut("commune").trim();
  if (!texte) {
    return;
  }

  let trouvee;
  try {
    trouvee = communes.parLibelle(texte);
  } catch (ambigu) {
    if (ambigu instanceof communes.AmbiguCommune) {
      saisie.message_commune = ambigu.message;
      return;
    }
    throw ambigu;
  }

  if (trouvee === null) {
    saisie.message_commune = MESSAGE_COMMUNE_INCONNUE.replace("{texte}", texte);
    return;
  }

  saisie.commune = trouvee;
  saisie.za = trouvee.za;
  saisie.zv = trouvee.zv;
}

/* Lit un dictionnaire de formulaire. */
export function lire(formulaire) {
  const valeurs = {};
  for (const cle of CLES) {
    const envoye = formulaire[cle];
    valeurs[cle] = envoye === undefined || envoye === null ? "" : String(envoye);
  }
  const saisie = new Saisie(valeurs);

  saisie.za = depuis(saisie.brut("za"), ZONES_ACCELERATION, (z) => z, 0);
  saisie.zv = depuis(saisie.brut("zv"), ZONES_VITESSE, (z) => z, 0);
  saisie.ossature = depuis(
    saisie.brut("ossature"),
    SYSTEMES_CONTREVENTEMENT,
    (s) => s,
    SYSTEMES_CONTREVENTEMENT[0],
  );
  saisie.classe = depuis(
    saisie.brut("classe"),
    CLASSES_CONSTRUCTION,
    (c) => c.libelle,
    CLASSES_CONSTRUCTION[0].valeur,
    (c) => c.valeur,
  );
  saisie.site = depuis(saisie.brut("classe_site"), CLASSES_SITE, (s) => s, "S1");
  saisie.unite = depuis(saisie.brut("unite"), UNITE_POIDS, (u) => u, UNITE_POIDS[0]);

  for (const champ of CHAMPS_NUMERIQUES) {
    const nombre = reel(saisie.brut(champ));
    if (nombre !== null) {
      saisie.nombres[champ] = nombre;
    }
  }

  resoudreCommune(saisie);
  return saisie;
}

/* Noms courts des champs fautifs, dans l'ordre du formulaire.
 *
 * Même règle que l'interface de bureau : un champ numérique doit être renseigné et
 * strictement positif ; S n'est exigé que pour le site S5. S'y ajoute la commune,
 * lorsqu'elle est renseignée mais inconnue du catalogue.
 */
export function fautes(saisie) {
  const absents = CHAMPS_EXIGES.filter((champ) => saisie.nombre(champ) <= 0);
  if (saisie.site_manuel && saisie.nombre("coef_site") <= 0) {
    absents.push("coef_site");
  }
  if (saisie.message_commune) {
    absents.push("commune");
  }
  return Object.keys(NOMS_CHAMPS)
    .filter((nom) => absents.includes(nom))
    .map((nom) => NOMS_CHAMPS[nom]);
}

/* Renvoie la saisie, fautes renseignées ; lève sinon `DonneesIncompletes`. */
export function valider(saisie) {
  saisie.fautes = fautes(saisie);
  if (saisie.fautes.length) {
    throw new DonneesIncompletes(saisie.fautes);
  }
  return saisie;
}

/* Traduit une saisie validée en objets du domaine `rps`.
 *
 * Les listes déroulantes sont converties dès la lecture ; il ne reste qu'à laisser
 * le domaine faire respecter ses propres contraintes (longueurs positives, poids
 * strictement positifs, S5 avec valeur manuelle) : ses messages d'erreur, en
 * français, sont relayés tels quels par la page.
 */
export function objets(saisie) {
  return [
    creerLocalisation(saisie.za, saisie.zv),
    creerGeometrie(saisie.nombre("hauteur"), saisie.nombre("longueur_x"), saisie.nombre("longueur_y")),
    creerBatiment(
      saisie.ossature,
      saisie.classe,
      saisie.site,
      saisie.site_manuel ? saisie.nombre("coef_site") : null,
    ),
    {
      Wx: saisirCharge("Poids sismique X", "Wx", saisie.nombre("poids_x"), saisie.unite),
      Wy: saisirCharge("Poids sismique Y", "Wy", saisie.nombre("poids_y"), saisie.unite),
    },
  ];
}
