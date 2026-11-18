/*
 * boot.js : le tout premier script, chargé dans le <head> avant l'affichage de la page.
 * Il est dans un fichier à part (et non écrit dans index.html) pour que la politique de sécurité
 * de la page (CSP) puisse interdire tout script écrit directement dans le HTML.
 */

// Ajoute la classe « js » à la page : le CSS sait ainsi que JavaScript fonctionne.
document.documentElement.classList.add('js');

// Filet de sécurité : si le script principal ne démarre jamais, on retire l'écran de chargement après 9 secondes.
setTimeout(function () {
  var l = document.querySelector('.loader');
  if (l) l.style.display = 'none';
  document.documentElement.classList.remove('is-loading');
}, 9000);
