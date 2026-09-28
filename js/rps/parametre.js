/* Conteneur de sortie de la procédure de calcul.
 *
 * Portage de `rps/parametre.py`. Chaque attribut est un `Params` — une valeur et
 * sa traçabilité : l'unité, la formule qui l'a produite, la table dont elle est
 * tirée, et le cas échéant la remarque du domaine.
 */

export function resultats(calcul) {
  return {
    upsilon: calcul.upsilon, // υ
    I: calcul.I, // I
    S: calcul.S, // S
    nd: calcul.nd, // niveau de ductilité
    K: calcul.K, // K
    Tx: calcul.Tx, // période X
    Ty: calcul.Ty, // période Y
    Dx: calcul.Dx, // amplification X
    Dy: calcul.Dy, // amplification Y
    Wx: calcul.Wx, // poids sismique X
    Wy: calcul.Wy, // poids sismique Y
    Fx: calcul.Fx, // force sismique X
    Fy: calcul.Fy, // force sismique Y
  };
}
