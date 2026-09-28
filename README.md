# Force sismique équivalente — site statique (RPS 2011)

Site web de calcul de la force sismique équivalente d'une structure, selon la
**RPS 2011** (Règlement Parasismique Marocain). Cette version ne demande **aucun
serveur** : ce sont des fichiers HTML, CSS et JavaScript, à déposer tels quels.

![JavaScript](https://img.shields.io/badge/JavaScript--ES%20modules-f7df1e?logo=javascript)
![Statique](https://img.shields.io/badge/site--statique-000?logo=html5)
![Norme](https://img.shields.io/badge/Norme-RPS%202011-orange)
![Licence](https://img.shields.io/badge/Licence-MIT-lightgrey)
[![Démo](https://img.shields.io/badge/d%C3%A9mo-GitHub%20Pages-159957?logo=githubpages)](https://vlax-rsr.github.io/force-sismique-rps2011/)

**Démonstration : <https://vlax-rsr.github.io/force-sismique-rps2011/>** — le dépôt
public est ici, la page n'est qu'un dossier de fichiers.

---

## Le principe

**Le site n'implémente aucune formule.** Le domaine de la RPS 2011 du logiciel de
bureau est *porté* en JavaScript, module par module, et c'est lui qui produit les
valeurs, leurs formules, leurs unités et leurs sources. La page ne fait que lire
le formulaire, appeler ce domaine, et mettre le résultat en forme.

```
Site force sismique equivalente/
├── index.html            le formulaire et la localisation par commune
├── methode.html          la formule et les tableaux de la RPS 2011
├── 404.html              page d'erreur, pour les hébergeurs qui la proposent
├── css/site.css          la feuille de style du site d'origine, reprise telle quelle
├── data/                 le catalogue des communes
└── js/
    ├── site.js           l'état de la page : formulaire, résultats, URL, suggestions
    ├── app.js            ce que faisait app.py hors des routes
    ├── pont.js           la façade unique sur le domaine
    ├── affichage.js      le moteur de la note de calcul
    ├── erreur.js         le message de la 404
    ├── rps/              le domaine RPS 2011, un fichier par coefficient
    └── domaine/          le liant : catalogue, saisie, présentation, journal
```

La correspondance avec les sources est directe : `rps/zone_sismique.py` devient
`js/rps/zone_sismique.js`, `affichage.py` devient `js/affichage.js`,
`domaine/communes.py` devient `js/domaine/communes.js`. Les noms de fonctions sont
conservés, y compris leur écriture — française, sans trait de soulignement — pour
que les deux ports se lisent côte à côte.

| Besoin du site | Fourni par |
|----------------|-------------|
| `υ, I, D, S, ND, K, T, F` | `js/rps/`, un module par coefficient |
| Note de calcul horodatée | `js/affichage.js` |
| Listes déroulantes, unités | énumérations de `js/rps/utils.js` |
| Zones par commune | `data/catalogue_vitesses_zones_sismiques.csv` |

### Lancer le site

Les modules ES et le catalogue sont chargés par `fetch`, que le protocole
`file://` interdit. Il faut donc servir le dossier par un petit serveur HTTP
local :

```bash
cd "Site force sismique equivalente"
python -m http.server 8000
```

puis ouvrir <http://127.0.0.1:8000>. Ouvrir `index.html` par double-clic ne
fonctionne pas — c'est une limite du navigateur, pas du site.

### Déployer

Le dossier est le site. Il se dépose chez n'importe quel hébergeur de fichiers
statiques (GitHub Pages, Netlify, Cloudflare Pages, un simple dossier servi par
nginx) ; aucune configuration, aucune dépendance, aucun processus à maintenir.

| À faire | Pourquoi |
|----------|----------|
| Servir en HTTPS | les navigateurs réservent `crypto.subtle` et quelques API au contexte sécurisé |
| Désigner `404.html` | seule page d'erreur que beaucoup d'hébergeurs sachent servir |
| Servir le `.csv` en `text/csv` | nécessaire au catalogue ; par défaut servi en `text/plain`, ce que le navigateur accepte aussi |
| Conserver `.nojekyll` | désactive Jekyll chez GitHub Pages, qui choisirait sinon quels fichiers publier et escamoterait ceux commencant par un tiret bas |

#### Sur GitHub Pages

Ce dépôt est publié depuis la branche `main`, à sa racine : *Settings → Pages →
Source : Deploy from a branch*, branche `main`, dossier `/ (root)`. Le fichier
`.nojekyll` est déjà là, la branche est déjà le site, il n'y a donc rien d'autre à
régler.

Le catalogue est un `.csv` de 44 ko : il est servi tel quel et téléchargé par
`fetch`, la première fois qu'une commune est tapée. C'est 1,6 ko gzippés, et
l'autocomplétion ne fait qu'un aller-retour vers le serveur.

---

## Utilisation

1. **Localiser le bâtiment par sa commune** — un champ de recherche propose les
   1510 communes pendant la frappe. Choisir une commune remplit ses zones **Za**
   et **Zv**, qui sont alors grisées : elles viennent du catalogue. Le nom seul
   suffit s'il est unique ; sinon, la province est exigée. Za et Zv restent
   saisissables à la main tant que la commune est laissée vide.
2. **Géométrie** — hauteur H, longueurs Lx et Ly, en mètres.
3. **Structure** — système de contreventement, classe de construction, classe
   de site S1 à S5. Pour **S5**, le coefficient S n'a pas de valeur forfaitaire :
   il doit être fourni par une étude géotechnique.
4. **Poids sismiques** — Wx et Wy, en kN, daN ou kgf.
5. **Calculer** — les paramètres RPS s'affichent dans un tableau épuré, puis les
   forces sismiques équivalentes Fx et Fy, direction par direction, avec pour
   chaque valeur son unité et le tableau de la RPS 2011 dont elle est tirée. Les
   formules ne sont pas affichées : elles restent dans la note de calcul et sur
   `methode.html`.
6. **Télécharger la note (.txt)** — le bilan horodaté, identique à celui exporté
   par le logiciel de bureau. La note est repliée par défaut, le téléchargement
   reste à portée.

Les champs fautifs passent en rouge et sont nommés comme dans l'interface de
bureau (`H`, `Lx`, `Ly`, `S`, `Wx`, `Wy`). Une commune renseignée mais
introuvable — ou ambiguë — est refusée avec la raison.

---

## Pages

| Fichier | Rôle |
|---------|------|
| `index.html` | le formulaire, la localisation par commune, et les résultats |
| `methode.html` | la formule et les tableaux de la RPS 2011 utilisés |
| `404.html` | page d'erreur |

La navigation ne propose que **Calcul** et **Méthode** : le catalogue n'a pas de
page, la localisation est dans le formulaire.

Le site est **sans état** : ni session, ni cookie, ni base. La saisie vit dans la
chaîne de requête — un rechargement, un lien partagé ou un retour arrière
redonnent la même page — et le calcul est refait à l'identique, déterministe donc
reproductible.

Ce que le serveur Flask faisait, et qui se fait ici au chargement de la page :

| Route de la version Flask | Ici |
|--------------------------|-----|
| `GET /` | lecture de la chaîne de requête, puis réaffichage |
| `POST /calcul` | validation, calcul, puis rendu des résultats |
| `GET\|POST /note` | la note, produite à la volée puis téléchargée en `.txt` |
| `GET /api/communes` | la recherche dans le catalogue, sans aller-retour réseau |

---

## Catalogue des communes

Le fichier CSV du projet de bureau (1510 communes, 67 provinces) n'est lu par
aucun code du logiciel de bureau : le site en est le premier consommateur. Il est
embarqué dans `data/`.

- Il n'est **pas versé dans les pages** : il est téléchargé à la première frappe
  dans la commune, une fois, puis mis en cache. La page d'accueil reste légère.
- Une commune est désignée par son libellé `Nom (Province)`, forme que
  l'autocomplétion renvoie. Le nom seul est accepté s'il désigne une seule
  commune ; sept noms sont partagés par deux ou trois provinces, et l'ambiguïté
  est signalée au lieu d'être tranchée au hasard.
- Une commune reconnue **prime sur les zones saisies** : Za et Zv sont reprises
  telles quelles, et les deux listes déroulantes passent en `disabled`.
- La recherche ignore la casse et les accents : `hajeb` trouve `El Hajeb`.
- Le tri est fait par code de caractère, comme en Python, et non par
  `localeCompare` qui collationnerait selon les usages de la langue.
- La ligne doublon du CSV (`Ain Sebaa-Hay Mohamma`) est dédupliquée au
  chargement.
- La colonne `Vitesse` est 100 fois υ ; sa cohérence avec la zone de vitesse est
  vérifiée lors de la comparaison des deux ports.

---

## Parité avec le logiciel de bureau

Le portage n'a pas été fait à l'œil. Les deux implémentations — le domaine Python
d'origine et celui-ci — ont été soumises au même banc d'essai, et leurs sorties
JSON comparées :

- **2250 cas de calcul** : les cinq zones d'accélération croisées avec les cinq
  zones de vitesse, les six systèmes de contreventement, les trois classes de
  construction et les cinq classes de site, en variant la géométrie, les poids et
  l'unité sur chaque combinaison ;
- **15 saisies** de formulaire, dont les refus : champs vides, zéros, valeurs
  négatives, S5 sans coefficient, commune inconnue, commune ambiguë, virgule
  décimale, texte non numérique ;
- **le catalogue** : les 1510 communes, l'ordre des provinces, et neuf recherches ;
- **la note de calcul**, au caractère près, sur seize cas répartis.

Le rapport compare les valeurs, les unités, les sources, les formules, les
messages d'erreur, les fautes, les valeurs réaffichées et le texte de la note —
espaces de remplissage compris. Le résultat : **aucun écart**.

Ce banc était un échafaudage, monté dans un navigateur sans serveur de test, et
retiré ensuite : rien d'autre que les pages n'est livré. Le catalogue, lui, reste
un fichier du projet de bureau, et le CSS celui du site d'origine.

### Ce qui n'a pas été repris

| Perdu | Conséquence |
|-------|-------------|
| Le chemin secret | la version de bureau était hors d'atteinte derrière un secret ; celle-ci est **publique et assumée** : c'est un dépôt GitHub public et une page GitHub Pages. Un lien partagé est un site ouvert, ce qui est le but. |
| `GET /ping` | il n'y a plus de service à sonder ; c'est un fichier, sa présence suffit. |
| Le journal rotatif | plus de serveur, donc plus de journal serveur ; les avertissements du domaine sont encore produits et affichés. |
| La configuration par variables d'environnement | plus rien à configurer côté serveur. |

---

## Historique

Le site est né d'une application de bureau : un domaine Python qui calcule la force
sismique équivalente, une interface de bureau au-dessus, et un serveur Flask qui
l'exposait. Ce dépôt n'en est que la partie visible — le domaine, porté en
JavaScript, et la page qui l'appelle. Le portage a été fait module par module, avec
les mêmes noms de fonctions, y compris leur écriture française, pour que les deux
versions se lisent côte à côte.

---

## Licence

Distribué sous licence **MIT**.

*Les résultats doivent être vérifiés par un bureau d'études, et la version de la
norme en vigueur sur le projet contrôlée avant tout dimensionnement.*
