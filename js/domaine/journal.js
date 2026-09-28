/*
 * Journal du domaine, et interception de ses avertissements.
 *
 * Portage de `domaine/journal.py`. En Python, le domaine `rps` écrit dans le
 * journal `logging`, et l'application y branche un `Intercepteur` le temps du
 * calcul : les avertissements émis par le domaine deviennent alors les alertes
 * affichées sous les résultats.
 *
 * JavaScript n'a pas d'équivalent de `logging`, donc le domaine appelle ici
 * `journaliser()` et `avertir()`, et c'est ce module qui tient la serrure : il
 * n'importe rien du domaine, et les deux côtés peuvent coexister sans cycle.
 *
 * La différence avec le `with intercepter() as capture:` de Python tient au
 * langage : le contexte n'existe pas, la capture s'ouvre et se ferme à la main.
 */

const NIVEAU_ETAT = "WARNING";

let cible = null;
let niveau = null;

export const NIVEAU = { INFO: "INFO", WARNING: "WARNING", DEBUG: "DEBUG" };

function ecrire(niveauMessage, message) {
  if (cible) {
    cible.push(message);
  }
  /* Le domaine reste bavard comme en Python : `logger.debug(...)` part en
   * console, et n'est intercepté que si le niveau le demande. */
  if (niveauMessage === "WARNING") {
    console.warn(message);
  } else if (niveau === "DEBUG") {
    console.debug(message);
  }
}

export function journaliser(message) {
  if (niveau === NIVEAU.INFO || niveau === NIVEAU.DEBUG) {
    ecrire("INFO", message);
  }
}

export function avertir(message) {
  if (niveau === null || niveau === NIVEAU.WARNING) {
    ecrire("WARNING", message);
  }
}

/* Ouvre une capture : à fermer par `fermer()` une fois le calcul terminé. */
export function intercepter(niveauCapture = NIVEAU_ETAT) {
  const messages = [];
  cible = messages;
  niveau = niveauCapture;
  return {
    messages,
    fermer() {
      cible = null;
      niveau = null;
    },
  };
}
