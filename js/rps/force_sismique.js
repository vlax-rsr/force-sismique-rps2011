/* --- Force sismique ----
 *
 * Portage de `rps/force_sismique.py`.
 *
 * Formule de calcul :
 * F = υ.I.D.S.W/K
 */

export function forceSismique(v, I, D, S, W, K) {
  return (v * I * D * S * W) / K;
}
