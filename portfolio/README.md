# Portfolio d'Alan Axel

Site statique : HTML, CSS, JavaScript et GSAP (chargé depuis cdnjs).

Fichiers : `index.html`, `style.css`, `script.js`, `favicon.svg` (icône de l'onglet) et `vercel.json`.
Le logo (un A dont la barre finit par un point, comme une branche Git) est dessiné en SVG dans `index.html` (menu et écran de chargement) et dans `favicon.svg`.

## À modifier avant de publier

Dans `index.html`, cherche les commentaires `À MODIFIER` :

- remplace `225XXXXXXXXXX` dans le lien WhatsApp de la section Contact par ton numéro, au format international, sans `+` ni espaces (`225` suivi de ton numéro),
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
