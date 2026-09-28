/* Le site, en JavaScript.
 *
 * Contrepartie de `app.py` et des gabarits Jinja. Là où Flask enregistrait des
 * routes et rendait des gabarits, ce fichier tient l'état de la page : il lit le
 * formulaire, appelle l'application, rend les résultats, et porte les trois
 * — source de confort de l'ancien `static/js/site.js` — suggestions de communes,
 * verrouillage des zones, bascule du coefficient S.
 *
 * Le domaine n'a pas bougé : `rps/` et `affichage.py` sont ports dans `js/rps/` et
 * `js/affichage.js`, et c'est toujours eux qui produisent les valeurs, leurs
 * formules et la note. Cette page ne calcule rien.
 *
 * Ce que le serveur seul faisait, et qui est fait ici au chargement de la page :
 *   - `/`       : une saisie, validée ou non, réaffichée telle qu'elle a été remplie ;
 *   - `/calcul` : la validation, le calcul, puis le rendu des résultats ;
 *   - `/note`   : la note horodatée, produite ici pour être téléchargée ;
 *   - `/api/communes` : la recherche dans le catalogue, sans aller-retour réseau.
 *
 * L'état de la saisie vit dans la chaîne de requête : un rechargement, un lien
 * partagé ou un retour arrière redonnent la même page que la version Flask.
 */

import { CHAMPS, LIMITE_SUGGESTIONS, MESSAGE_SUCCES, calculer, defautsDe } from "./app.js";
import { SITE_ETUDE } from "./pont.js";
import * as communes from "./domaine/communes.js";
import { CLES, MESSAGE_VIDE, lire } from "./domaine/saisie.js";

/* Le texte que la colonne des résultats affiche tant qu'aucun calcul n'a été fait
 * — le `{% if issue is none %}` du gabarit. */
const AUCUN_CALCUL = "Aucun calcul pour l'instant. Renseignez les données du bâtiment, puis cliquez sur ";

/* --- Le formulaire --------------------------------------------------------- */

const formulaire = document.getElementById("formulaire");
const champCommune = document.getElementById("commune");
const zoneSuggestions = document.getElementById("suggestions");
const aideZones = document.getElementById("aide-zones");
const champZa = document.getElementById("za");
const champZv = document.getElementById("zv");
const champSite = document.getElementById("classe_site");
const champCoefSite = document.getElementById("coef_site");
const aideCoefSite = document.getElementById("aide-coef-site");
const zoneCommuneRetenue = document.getElementById("commune-retenue");
const zoneBandeau = document.getElementById("bandeau");
const zoneResultats = document.getElementById("resultats");

/* Le dernier calcul réussi, pour le téléchargement de la note. */
let dernierIssue = null;

function valeursDuFormulaire() {
  const valeurs = {};
  for (const cle of CLES) {
    const champ = formulaire.elements.namedItem(cle);
    valeurs[cle] = champ ? champ.value : "";
  }
  return valeurs;
}

function appliquerDefauts(defauts) {
  for (const cle of CLES) {
    const champ = formulaire.elements.namedItem(cle);
    if (champ) {
      champ.value = defauts[cle];
    }
  }
}

/* --- Rendu ----------------------------------------------------------------- */

/* `textContent` partout : un nom de commune ne doit jamais être interprété comme
 * du HTML. */
function creer(balise, attributs = {}, enfants = []) {
  const noeud = document.createElement(balise);
  for (const [cle, valeur] of Object.entries(attributs)) {
    if (valeur === null || valeur === undefined || valeur === false) {
      continue;
    }
    if (cle === "class") {
      noeud.className = valeur;
    } else if (cle === "text") {
      noeud.textContent = valeur;
    } else {
      noeud.setAttribute(cle, valeur === true ? "" : String(valeur));
    }
  }
  for (const enfant of Array.isArray(enfants) ? enfants : [enfants]) {
    if (!enfant) {
      continue;
    }
    /* `appendChild` n'accepte qu'un nœud, à la différence de `append` : un texte
     * est donc converti, plutôt que de laisser la page lever. */
    noeud.appendChild(typeof enfant === "string" ? document.createTextNode(enfant) : enfant);
  }
  return noeud;
}

function bandeau(message, ton) {
  return creer("div", { class: `bandeau bandeau-${ton}`, role: "status", text: message });
}

/* La macro `tableau()` d'`index.html`. */
function tableau(titre, lignes, avecSource = true) {
  const entetes = [
    creer("th", { class: "col-symbole", text: "Symbole" }),
    creer("th", { text: "Désignation" }),
    creer("th", { class: "col-valeur", text: "Valeur" }),
    creer("th", { class: "col-unite", text: "Unité" }),
  ];
  if (avecSource) {
    entetes.push(creer("th", { text: "Source" }));
  }

  const corps = lignes.map((l) => {
    /* Sans colonne « Source », la formule et la table dont la valeur est tirée
     * restent dans l'infobulle : les formules ne sont pas affichées. */
    const attributs = avecSource ? {} : { title: `${l.formule} — ${l.source}` };
    const cellules = [
      creer("td", { class: "symbole", text: l.symbole }),
      creer("td", { text: l.nom }),
      creer("td", { class: "valeur", text: l.valeur }),
      creer("td", { class: "unite", text: l.unite }),
    ];
    if (avecSource) {
      cellules.push(creer("td", { class: "source", text: l.source }));
    }
    return creer("tr", { class: l.mis_en_avant ? "est-final" : null, ...attributs }, cellules);
  });

  return creer("div", { class: "tableau" }, [
    creer("h4", { class: "tableau-titre", text: titre }),
    creer("table", {}, [
      creer("thead", {}, creer("tr", {}, entetes)),
      creer("tbody", {}, corps),
    ]),
  ]);
}

function rendreIssue(issue) {
  const morceaux = [
    bandeau(MESSAGE_SUCCES, "succes"),
    ...issue.alertes.map((alerte) => creer("div", { class: "bandeau bandeau-alerte", role: "alert", text: alerte })),
    tableau("Paramètres RPS", issue.parametres, false),
    creer("h3", { class: "rubrique", text: "Forces sismiques équivalentes" }),
    ...issue.directions.map((direction) => tableau(direction.libelle, direction.lignes)),
    creer("details", { class: "note" }, [
      creer("summary", { text: "Note de calcul" }),
      creer("pre", { class: "note-texte", text: issue.note }),
    ]),
    creer("div", { class: "actions" }, [
      creer("button", {
        type: "button",
        class: "bouton bouton-primaire",
        text: "Télécharger la note (.txt)",
        onclick: () => telechargerNote(issue),
      }),
    ]),
  ];

  zoneResultats.replaceChildren(...morceaux);
}

function rendreMessage(message, ton) {
  zoneBandeau.replaceChildren(bandeau(message, ton));
}

/* Tant qu'aucun calcul n'a réussi, la colonne de gauche porte le message et celle
 * de droite l'invitation à renseigner le formulaire : c'est ce que rendait le
 * gabarit quand `issue` était vide. */
function rendreResultatsVides(message, ton) {
  rendreMessage(message, ton);
  zoneResultats.replaceChildren(
    creer("p", { class: "vide" }, [
      `${AUCUN_CALCUL} `,
      creer("strong", { text: "Calculer" }),
      ".",
    ]),
  );
}

function rendreCommuneRetenue(saisie) {
  if (!saisie.commune) {
    zoneCommuneRetenue.replaceChildren();
    return;
  }
  const { libelle, za, zv, vitesse } = saisie.commune;
  zoneCommuneRetenue.replaceChildren(
    creer("p", { class: "bandeau bandeau-succes", role: "status" }, [
      "Commune retenue : ",
      creer("strong", { text: libelle }),
      ` — Za = ${za}, Zv = ${zv} (vitesse ${formatPourcentage(vitesse / 100)}).`,
    ]),
  );
}

/* `'%g'` de Python : six chiffres significatifs, zéros de fin supprimés. */
function formatPourcentage(valeur) {
  if (valeur === 0) {
    return "0";
  }
  return String(Number(valeur.toPrecision(6)));
}

function marquerFautifs(fautes) {
  for (const { court, id } of CHAMPS) {
    const champ = document.getElementById(id);
    if (!champ) {
      continue;
    }
    const fautif = fautes.includes(court);
    champ.closest(".champ").classList.toggle("invalide", fautif);
    if (fautif) {
      champ.setAttribute("aria-invalid", "true");
    } else {
      champ.removeAttribute("aria-invalid");
    }
  }
}

/* --- Actions --------------------------------------------------------------- */

formulaire.addEventListener("submit", async (evenement) => {
  evenement.preventDefault();

  /* Le catalogue n'est téléchargé qu'à la première frappe dans la commune. Une
   * saisie peut le devancer — le collage, un retour arrière, une coupure réseau —
   * et la commune ne serait alors jamais résolue : on l'attend ici. */
  if (champCommune.value.trim() && !communes.estCharge()) {
    try {
      await communes.charger();
    } catch (erreur) {
      rendreResultatsVides(erreur.message, "erreur");
      return;
    }
  }

  let saisie;
  try {
    saisie = lire(valeursDuFormulaire());
  } catch (erreur) {
    rendreResultatsVides(messageErreur(erreur), "erreur");
    return;
  }

  appliquerDefauts(defautsDe(saisie));
  rendreCommuneRetenue(saisie);
  ecrireUrl();
  basculerCoefSite();

  try {
    dernierIssue = calculer(saisie);
  } catch (erreur) {
    dernierIssue = null;
    marquerFautifs(erreur.fautes || []);
    rendreResultatsVides(messageErreur(erreur), "erreur");
    return;
  }

  /* Le bandeau de gauche n'existe que faute de résultats : dès qu'il y en a, le
   * message de succès est rendu en tête de la colonne de droite. */
  marquerFautifs([]);
  zoneBandeau.replaceChildren();
  rendreIssue(dernierIssue);
});

/* Le domaine dit ses refus en français, et la page les relaie tels quels. */
function messageErreur(erreur) {
  return erreur.message;
}

/* La note est produite une fois pour toutes : l'écran et le fichier téléchargé
 * portent le même texte, horodaté à la même seconde. */
function telechargerNote(issue) {
  const blob = new Blob([issue.note], { type: "text/plain;charset=utf-8" });
  const adresse = URL.createObjectURL(blob);
  const lien = creer("a", { href: adresse, download: issue.fichier });
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(adresse);
}

/* --- L'état dans l'adresse ------------------------------------------------- */

/* La version Flask affichait une saisie relue de l'adresse par `GET /` ; c'est la
 * même chose, sans le serveur. Les valeurs sont donc écrites dans la requête
 * après chaque calcul, et lues au chargement. */
function ecrireUrl() {
  const requete = new URLSearchParams();
  for (const cle of CLES) {
    requete.set(cle, valeursDuFormulaire()[cle]);
  }
  const adresse = `${window.location.pathname}?${requete.toString()}${window.location.hash}`;
  window.history.replaceState(null, "", adresse);
}

function valeursDeUrl() {
  const requete = new URLSearchParams(window.location.search);
  const valeurs = {};
  for (const cle of CLES) {
    if (requete.has(cle)) {
      valeurs[cle] = requete.get(cle);
    }
  }
  return valeurs;
}

/* --- Coefficient de site --------------------------------------------------- */

const FORFAITAIRES = { S1: "1.0", S2: "1.2", S3: "1.4", S4: "1.8" };

function basculerCoefSite() {
  if (!champSite || !champCoefSite) {
    return;
  }
  const classe = champSite.value;
  if (classe === SITE_ETUDE) {
    // S5 n'a pas de valeur forfaitaire : la valeur vient d'une étude.
    champCoefSite.readOnly = false;
    if (aideCoefSite) {
      aideCoefSite.textContent = "Site S5 : à déterminer par une étude géotechnique.";
    }
    return;
  }
  champCoefSite.readOnly = true;
  champCoefSite.value = FORFAITAIRES[classe] || "";
  if (aideCoefSite) {
    aideCoefSite.textContent = "Valeur forfaitaire du tableau 5.2 — non modifiable.";
  }
}

if (champSite) {
  champSite.addEventListener("change", basculerCoefSite);
}

/* --- Localisation par commune ----------------------------------------------- */

/* Dès qu'une commune est saisie, Za et Zv ne sont plus modifiables : elles
   viennent du catalogue. Les listes deviennent « disabled » — donc non
   transmises — et la saisie les redérive de la commune avant le calcul. */
function figerZones() {
  if (!champZa || !champZv) {
    return;
  }
  const fige = champCommune.value.trim() !== "";
  champZa.disabled = fige;
  champZv.disabled = fige;
  if (aideZones) {
    aideZones.textContent = fige
      ? "Za et Zv sont imposées par la commune retenue."
      : "Laissez la commune vide pour les choisir vous-même.";
  }
}

function viderSuggestions() {
  zoneSuggestions.replaceChildren();
  zoneSuggestions.hidden = true;
  actif = -1;
}

function choisir(commune) {
  // Le libellé complet « Nom (Province) » est ce que la saisie sait résoudre.
  champCommune.value = commune.libelle;
  if (champZa) {
    champZa.value = String(commune.za);
  }
  if (champZv) {
    champZv.value = String(commune.zv);
  }
  figerZones();
  viderSuggestions();
}

function ligneSuggestion(commune, position) {
  const bouton = creer("button", { type: "button", class: "suggestion" }, [
    creer("span", { text: commune.libelle }),
    creer("span", { class: "suggestion-zones", text: `Za = ${commune.za} · Zv = ${commune.zv}` }),
  ]);
  bouton.addEventListener("click", () => {
    choisir(commune);
    champCommune.focus();
  });
  bouton.addEventListener("mouseenter", () => mettreEnValeur(position));
  return bouton;
}

let actif = -1;
let dernieres = [];

function mettreEnValeur(index) {
  const boutons = zoneSuggestions.querySelectorAll(".suggestion");
  if (!boutons.length) {
    return;
  }
  actif = (index + boutons.length) % boutons.length;
  boutons.forEach((bouton, position) => bouton.classList.toggle("est-active", position === actif));
  boutons[actif].scrollIntoView({ block: "nearest" });
}

function afficher(communes) {
  if (!communes.length) {
    viderSuggestions();
    return;
  }
  dernieres = communes;
  zoneSuggestions.replaceChildren(
    ...communes.map((commune, position) => ligneSuggestion(commune, position)),
  );
  zoneSuggestions.hidden = false;
}

function chercher(terme) {
  afficher(communes.rechercher(terme, LIMITE_SUGGESTIONS));
}

let minuteur = null;

champCommune.addEventListener("input", () => {
  const terme = communes.sansAccents(champCommune.value.trim());
  figerZones();
  window.clearTimeout(minuteur);
  if (terme.length < 2) {
    viderSuggestions();
    return;
  }
  minuteur = window.setTimeout(() => {
    /* Le catalogue est téléchargé à la première frappe : la page d'accueil reste
     * légère, et il n'est lu qu'au moment où il sert. */
    communes.charger().then(() => chercher(champCommune.value.trim())).catch(() => viderSuggestions());
  }, 180);
});

// Entrée retient la suggestion mise en avant, sinon la première.
champCommune.addEventListener("keydown", (evenement) => {
  if (zoneSuggestions.hidden) {
    return;
  }
  if (evenement.key === "ArrowDown") {
    evenement.preventDefault();
    mettreEnValeur(actif + 1);
  } else if (evenement.key === "ArrowUp") {
    evenement.preventDefault();
    mettreEnValeur(actif - 1);
  } else if (evenement.key === "Enter" && dernieres.length) {
    evenement.preventDefault();
    choisir(dernieres[actif < 0 ? 0 : actif]);
  } else if (evenement.key === "Escape") {
    viderSuggestions();
  }
});

// Le clic hors de la zone de suggestions la referme.
document.addEventListener("click", (evenement) => {
  if (!zoneSuggestions.contains(evenement.target) && evenement.target !== champCommune) {
    viderSuggestions();
  }
});

/* --- Démarrage ------------------------------------------------------------- */

auDemarrage();

async function auDemarrage() {
  rendreResultatsVides(MESSAGE_VIDE, "info");
  basculerCoefSite();

  const valeurs = valeursDeUrl();
  if (!Object.keys(valeurs).length) {
    // Sans commune au chargement (page d'accueil, ou choix remis à zéro), les
    // zones restent libres et le catalogue n'est pas téléchargé.
    figerZones();
    return;
  }

  /* Une saisie relue de l'adresse passe par le même chemin qu'une saisie
   * envoyée au serveur : lecture, commune résolue, valeurs réaffichées. Le
   * catalogue n'est donc chargé que s'il y a une commune à résoudre. */
  if (Object.prototype.hasOwnProperty.call(valeurs, "commune")) {
    try {
      await communes.charger();
    } catch (erreur) {
      rendreResultatsVides(erreur.message, "erreur");
      appliquerDefauts(valeurs);
      figerZones();
      return;
    }
  }

  const saisie = lire(valeurs);
  appliquerDefauts(defautsDe(saisie));
  rendreCommuneRetenue(saisie);
  basculerCoefSite();
  figerZones();
}
