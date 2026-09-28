/* Page d'erreur : le code et le message viennent de la chaîne de requête.
 *
 * Contrepartie de `templates/erreur.html`. Un hébergeur statif sert `404.html`
 * sur une adresse inconnue ; le code affiché est alors 404, comme le rendu de la
 * version Flask. Une page d'erreur choisie à la main passe par
 * `404.html?code=403&message=Accès refusé`.
 */

const PAR_DEFAUT = { code: "404", message: "Page introuvable." };

const requete = new URLSearchParams(window.location.search);

document.getElementById("code").textContent = requete.get("code") || PAR_DEFAUT.code;
document.getElementById("message").textContent = requete.get("message") || PAR_DEFAUT.message;
