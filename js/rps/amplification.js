/* ---- Facteur d'amplification ----
 *
 * Portage de `rps/amplification.py`. Tableau 5.3 de la RPS 2011, dans les trois
 * cas Za < Zv, Za = Zv et Za > Zv.
 */

import { Source, params } from "./utils.js";

export function facteurAmplification(zoneAcceleration, zoneVitesse, T, direction) {
  const Za = zoneAcceleration;
  const Zv = zoneVitesse;
  const signe = Za > Zv ? ">" : Za < Zv ? "<" : "=";

  let D;
  let formule;

  if (T <= 0.25) {
    if (Za < Zv) {
      D = 1.9;
    } else if (Za === Zv) {
      D = 2.5;
    } else {
      D = 3.5;
    }
    formule = `D${direction} = valeur forfaitaire (T ≤ 0.25 s, Za/Zv ${signe} 1)`;
  } else if (T < 0.5) {
    if (Za < Zv) {
      D = 1.9;
      formule = `D${direction} = 1.9 (0.25 ≤ T < 0.5, Za/Zv ${signe} 1)`;
    } else if (Za === Zv) {
      D = -2.4 * T + 3.1;
      formule =
        `D${direction} = -2.4×T + 3.1 = -2.4×${T.toFixed(4)} +3.1 ` +
        `(0.25 ≤ T < 0.5, Za/Zv ${signe} 1)`;
    } else {
      D = -6.4 * T + 5.1;
      formule =
        `D${direction} = -6.4×T + 5.1 = -6.4×${T.toFixed(4)} +5.1 ` +
        `(0.25 ≤ T < 0.5, Za/Zv ${signe} 1)`;
    }
  } else {
    D = 1.2 / Math.pow(T, 2 / 3);
    formule =
      `D${direction} = 1.2 / T^(2/3) = 1.2 / ${T.toFixed(4)}^(2/3) ` +
      `(T ≥ 0.5, Za/Zv ${signe} 1)`;
  }

  return params(
    `Facteur d'amplification ${direction}`,
    "D",
    D,
    "-",
    `D${direction} pour la période fondamentale de vibration`,
    formule,
    Source.COEFF_AMPLIFICATION,
    null,
  );
}
