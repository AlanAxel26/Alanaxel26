# Portfolio d'Alan Axel

Site statique : HTML, CSS, JavaScript et GSAP (chargé depuis cdnjs).

Fichiers : `index.html`, `style.css`, `script.js`, `boot.js` (tout petit script de démarrage), `favicon.svg` (icône de l'onglet) et `vercel.json`.
Le logo (un A dont la barre finit par un point, comme une branche Git) est dessiné en SVG dans `index.html` (menu et écran de chargement) et dans `favicon.svg`.

## Animations et écrans

- Au chargement : écran avec compteur, puis le nom du hero monte lettre par lettre.
- Au défilement : les titres montent mot par mot, les textes, les projets, les boutons de contact et le pied de page apparaissent en arrivant à l'écran. Une barre orange en haut de la page indique la progression, et le nom du hero s'estompe en montant.
- Si GSAP ne se charge pas, si JavaScript est désactivé ou si la personne a demandé « moins d'animations » dans son système, rien ne s'anime et tout reste visible.
- Le site s'adapte de 320 px (petit téléphone) à plus de 2500 px de large : le menu passe sur deux lignes sur téléphone, les projets sont sur deux colonnes sur tablette, et les liens font au moins 44 px de haut sur écran tactile.
- **Bouton « retour en haut » :** un bouton rond orange apparaît en bas à droite quand on a descendu d'environ un écran. Son icône est une tête de flèche (chevron) qui **devient double** quand on a descendu de plus de 2 écrans de hauteur (le 2ᵉ chevron apparaît en dessous, avec une transition). Un clic ramène en haut en douceur (d'un coup si le système demande moins d'animations). Au survol à la souris (ou au focus clavier), le bouton grossit un peu, passe au vert foncé et l'icône sort par le haut du rond puis revient par le bas (animation CSS `to-top-arrow`, jouée une fois) ; un appui le tasse. Sur écran tactile, les effets de survol sont désactivés. Il se commande au clavier, fait 48 px (taille d'un doigt) et reste caché tant qu'on est en haut. Pour changer le seuil du double chevron, modifie `window.innerHeight * 2` dans `script.js` (`initToTop`). Code : `index.html` (`.to-top`), `style.css` (partie « Bouton retour en haut ») et `script.js` (`initToTop`, qui marche aussi sans GSAP). Sans JavaScript, il reste visible avec un seul chevron et remonte d'un coup.

## Sécurité

- La page contient une politique de sécurité (CSP) dans une balise `<meta>` : elle n'accepte que les scripts du site et de cdnjs (GSAP), et bloque tout script écrit dans le HTML ou venu d'ailleurs. Ça marche aussi sur GitHub Pages, qui ne lit pas `vercel.json`.
- Si tu ajoutes un service externe (statistiques, carte, formulaire...), ajoute son adresse dans cette balise, sinon le navigateur le bloquera.
- `vercel.json` ajoute les en-têtes de sécurité (CSP complète avec `frame-ancestors`, `X-Frame-Options`, `Permissions-Policy`...) quand le site est sur Vercel.
- Les liens externes ouvrent un nouvel onglet avec `rel="noopener noreferrer"`. Le code n'écrit jamais de HTML à partir de texte (pas de `innerHTML`).
- Pour aller plus loin : télécharge `gsap.min.js` et `ScrollTrigger.min.js` dans le dossier du site et charge-les depuis là. Tu n'auras plus besoin de faire confiance à un site tiers, et tu pourras retirer `https://cdnjs.cloudflare.com` de la politique.

## À modifier avant de publier

Dans `index.html`, cherche les commentaires `À MODIFIER` :

- quand le gestionnaire de tâches a un aperçu en ligne, transforme son bouton « Voir un aperçu » en lien : remplace `<button ... disabled>` par `<a href="ton-lien">` et passe « À venir » en « En ligne ». Fais pareil pour le mini-blog.

## Tester en local

Ouvre `index.html` dans le navigateur, ou lance un petit serveur :

```bash
npx serve .
```

## Publier sur GitHub puis Vercel

Le dossier est déjà un dépôt Git, avec un premier commit sur la branche `main`.

1. Sur https://github.com/new, crée un dépôt **vide** nommé `portfolio` (sans README, sans .gitignore, sans licence).
2. Dans le dossier du portfolio, envoie le code :

```bash
git remote add origin https://github.com/AlanAxel26/portfolio.git
git push -u origin main
```

3. Va sur https://vercel.com/new et connecte ton compte GitHub.
4. Importe le dépôt `portfolio`.
5. Framework Preset : **Other**. Laisse les champs "Build Command" et "Output Directory" vides.
6. Clique sur **Deploy**. Chaque `git push` sur `main` redéploie le site.

## Note sur PHP

Vercel n'exécute pas PHP. Le portfolio est donc 100 % statique, et PHP apparaît comme compétence
avec des extraits de code. Quand tu auras un vrai projet PHP + SQL, héberge-le ailleurs
(hébergeur PHP classique) et ajoute son lien dans la section Projets.
