// SCRIPT PRINCIPAL DU PORTFOLIO
// Ordre des animations : 0) écran de chargement, 1) entrée du nom, 2) compétences, 3) trajet d'un clic.
// Sans GSAP ou avec « mouvement réduit », rien ne s'anime et tout reste lisible.
(() => {
  // Tout le code est enfermé dans une fonction qui s'exécute seule : les variables restent privées.
  'use strict';

  // root = la balise <html>. On lui ajoute des classes (no-motion, is-loading) que le CSS utilise.
  const root = document.documentElement;

  // Met l'année en cours dans le pied de page.
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------
     Bouton « retour en haut ». Placé AVANT le test de GSAP ci-dessous : il marche aussi sans GSAP et avec « mouvement réduit ».
     Il apparaît quand on a descendu d'environ un écran (et son chevron devient double après 2 écrans), et ramène tout en haut (en douceur, sauf si la personne a demandé
     moins d'animations dans son système).
     ------------------------------------------------------------ */
  function initToTop() {
    const btn = document.querySelector('.to-top');
    if (!btn) return;

    // On ne recalcule qu'une fois par image affichée (requestAnimationFrame) : le défilement ne ralentit pas.
    let waiting = false;
    const update = () => {
      waiting = false;
      const y = window.scrollY;
      btn.classList.toggle('is-visible', y > window.innerHeight * 0.8);
      // Au-delà de 2 écrans de hauteur, le chevron devient double : on est loin du haut de la page.
      btn.classList.toggle('is-double', y > window.innerHeight * 2);
    };
    const onScroll = () => {
      if (!waiting) {
        waiting = true;
        window.requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();

    btn.addEventListener('click', (e) => {
      e.preventDefault(); // on remplace le saut brutal du lien par une remontée douce
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
    });
  }
  initToTop();

  // Sans GSAP (réseau bloqué) ou avec "mouvement réduit" : tout reste visible, sans animation.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger || reduceMotion) {
    root.classList.add('no-motion');
    return;
  }

  // Active le plugin ScrollTrigger (animations liées au défilement).
  gsap.registerPlugin(ScrollTrigger);

  // Lit une variable CSS, par exemple css('--accent'), pour réutiliser les couleurs du site.
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

  /* ------------------------------------------------------------
     1. Entrée de la page : le nom monte lettre par lettre,
        puis le reste apparaît.
     ------------------------------------------------------------ */
  function heroIntro() {
    // Découpe le texte de chaque ligne en lettres (<span class="ch">) pour pouvoir les animer une par une.
    document.querySelectorAll('[data-split]').forEach((line) => {
      const text = line.textContent;
      line.textContent = '';
      [...text].forEach((char) => {
        const span = document.createElement('span');
        span.className = 'ch';
        span.textContent = char;
        line.appendChild(span);
      });
    });

    // Rend les lignes visibles (le CSS les cache au départ).
    gsap.set('.hero__line', { autoAlpha: 1 });

    // Animation en deux temps : 1) les lettres montent l'une après l'autre ; 2) le reste (menu, phrase, boutons) apparaît en fondu.
    // '-=0.55' = la 2e animation commence un peu avant la fin de la 1re.
    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .from('.hero__line .ch', { yPercent: 110, duration: 1.1, stagger: 0.07 })
      .fromTo(
        '[data-intro]',
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.12 },
        '-=0.55'
      );
  }

  /* ------------------------------------------------------------
     0. Écran de chargement : le compteur monte pendant que la page
        et les polices se chargent, puis le panneau glisse vers le haut
        et l'entrée du hero démarre juste derrière.
     ------------------------------------------------------------ */
  function runLoader(onExit) {
    // Si l'écran de chargement n'existe pas, on lance directement la suite.
    const panel = document.querySelector('.loader');
    if (!panel) { onExit(); return; }

    // Les deux éléments à mettre à jour : le nombre et la barre. state.v = pourcentage actuel (0 à 100).
    const num = panel.querySelector('.loader__num');
    const fill = panel.querySelector('.loader__fill');
    const state = { v: 0 };
    // Affiche le pourcentage actuel dans le texte et dans la barre.
    const render = () => {
      num.textContent = Math.round(state.v);
      fill.style.transform = 'scaleX(' + state.v / 100 + ')';
    };

    // Bloque le défilement pendant le chargement (voir le CSS).
    root.classList.add('is-loading');

    // Une promesse = « quelque chose qui sera prêt plus tard ». Ici : la page ET les polices sont chargées.
    const pageReady = new Promise((resolve) => {
      const done = () => resolve();
      if (document.readyState === 'complete') done();
      else window.addEventListener('load', done, { once: true });
    }).then(() => (document.fonts && document.fonts.ready) || null);

    // On n'attend jamais plus de 4,5 s, même si une police tarde.
    const waitAtMost = Promise.race([
      pageReady,
      new Promise((resolve) => setTimeout(resolve, 4500)),
    ]);

    // Le compteur monte d'abord jusqu'à 85 % en 1,4 seconde.
    const climb = new Promise((resolve) => {
      gsap.to(state, { v: 85, duration: 1.4, ease: 'power2.out', onUpdate: render, onComplete: resolve });
    });

    // Quand la page est prête ET que le compteur a atteint 85 %, on termine jusqu'à 100 % puis on sort.
    Promise.all([waitAtMost, climb]).then(() => {
      gsap.to(state, {
        v: 100,
        duration: 0.5,
        ease: 'power1.inOut',
        onUpdate: render,
        onComplete: exit,
      });
    });

    // Sortie : le texte monte et disparaît, le panneau glisse vers le haut, puis l'animation du hero démarre (onExit).
    function exit() {
      root.classList.remove('is-loading');
      gsap.timeline()
        .to('.loader__top, .loader__count', { yPercent: -25, autoAlpha: 0, duration: 0.45, ease: 'power2.in' })
        .to(panel, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '-=0.1')
        .add(onExit, '-=0.5')
        .add(() => {
          panel.style.display = 'none';
          ScrollTrigger.refresh();
        });
    }
  }

  /* ------------------------------------------------------------
     2. Compétences : les lignes de chaque groupe arrivent
        l'une après l'autre quand le groupe entre à l'écran.
        (Le survol coloré est en CSS.)
     ------------------------------------------------------------ */
  function skillsReveal() {
    // Pour chaque groupe, ses lignes arrivent l'une après l'autre (stagger) quand il entre à l'écran. once: true = une seule fois.
    gsap.utils.toArray('.group').forEach((group) => {
      gsap.from(group.querySelectorAll('.tech'), {
        autoAlpha: 0,
        y: 28,
        duration: 0.7,
        stagger: 0.09,
        ease: 'power3.out',
        scrollTrigger: { trigger: group, start: 'top 82%', once: true },
      });
      // Le nom du groupe (Interface, Serveur et données...) glisse depuis la gauche en même temps.
      gsap.from(group.querySelector('.group__title'), {
        autoAlpha: 0,
        x: -24,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: group, start: 'top 82%', once: true },
      });
    });
  }

  /* ------------------------------------------------------------
     3. Trajet d'un clic : un point parcourt le schéma pendant le
        scroll (aller jusqu'à la base, puis retour vers l'écran).
        Les points et les étapes s'allument à son passage.
     ------------------------------------------------------------ */
  // Sera remplie par flowDiagram() ; degrade() l'appelle pour afficher le schéma complet, sans animation.
  let flowFinish = null;

  function flowDiagram() {
    const wrap = document.querySelector('.flow__diagram');
    if (!wrap) return;

    // On récupère les éléments du schéma (dessinés dans index.html).
    const out = wrap.querySelector('.fviz__out');
    const back = wrap.querySelector('.fviz__back');
    const packet = wrap.querySelector('.fviz__packet');
    const halo = wrap.querySelector('.fviz__halo');
    const trail = gsap.utils.toArray('.fviz__trail', wrap);
    const rings = gsap.utils.toArray('.fring', wrap);
    const dots = gsap.utils.toArray('.fdot', wrap);
    const steps = gsap.utils.toArray('.fstep', wrap);
    const labels = gsap.utils.toArray('.flabel', wrap);

    const OUT_SHARE = 0.75;                       // part du défilement pour l'aller
    // Longueurs réelles des deux tracés : elles servent à placer le point dessus.
    const lenOut = out.getTotalLength();
    const lenBack = back.getTotalLength();
    // clamp(v) force une valeur à rester entre 0 et 1.
    const clamp = (v) => Math.min(1, Math.max(0, v));
    // reachAt[i] = progression (0 à 1) à partir de laquelle le point numéro i est « atteint ».
    const reachAt = dots.map((_, i) => (i / (dots.length - 1)) * OUT_SHARE);
    // Au-delà de cette progression, on considère que la réponse est revenue au formulaire.
    const DONE_AT = 0.985;

    // Position du point sur le tracé (aller puis retour) pour une progression p.
    const pointAt = (p) => (p <= OUT_SHARE
      ? out.getPointAtLength(lenOut * clamp(p / OUT_SHARE))
      : back.getPointAtLength(lenBack * clamp((p - OUT_SHARE) / (1 - OUT_SHARE))));

    // Onde qui s'écarte d'un point quand le trait l'atteint.
    const pulse = (ring, color) => {
      if (ring._anim) ring._anim.cancel();
      ring.style.stroke = color;
      ring._anim = ring.animate(
        [{ transform: 'scale(1)', opacity: 0.85 }, { transform: 'scale(2.9)', opacity: 0 }],
        { duration: 950, easing: 'cubic-bezier(.2, .7, .3, 1)' }
      );
    };

    // Couleurs du site lues dans le CSS : orange pour les ondes à l'aller, couleur du texte pour l'arrivée.
    const accent = css('--accent');
    const ink = css('--ink');
    let fx = false;                               // pas d'effets pour le rendu initial
    // Mémoire de l'état précédent : elle sert à lancer l'onde seulement au moment où un point vient d'être atteint (pas à chaque défilement).
    const wasOn = dots.map(() => false);
    let wasDone = false;

    // render(p) dessine tout le schéma pour une progression p (0 = début, 1 = fin).
    // Elle est appelée à chaque mouvement de défilement.
    const render = (p) => {
      const tOut = clamp(p / OUT_SHARE);
      const tBack = clamp((p - OUT_SHARE) / (1 - OUT_SHARE));
      const returning = p > OUT_SHARE;
      out.style.strokeDashoffset = 1 - tOut;
      back.style.strokeDashoffset = 1 - tBack;

      const pt = pointAt(p);
      packet.setAttribute('cx', pt.x);
      packet.setAttribute('cy', pt.y);
      halo.setAttribute('cx', pt.x);
      halo.setAttribute('cy', pt.y);
      // Traînée : le point précédent de quelques pas, de plus en plus petit et pâle.
      trail.forEach((dot, i) => {
        const q = pointAt(Math.max(0, p - (i + 1) * 0.014));
        dot.setAttribute('cx', q.x);
        dot.setAttribute('cy', q.y);
        dot.setAttribute('opacity', (0.55 - i * 0.13).toFixed(2));
        dot.classList.toggle('is-return', returning);
      });
      packet.classList.toggle('is-return', returning);
      halo.classList.toggle('is-return', returning);

      dots.forEach((dot, i) => {
        const on = p >= reachAt[i] - 0.001;
        if (on && !wasOn[i] && fx && i > 0) pulse(rings[i], accent);
        wasOn[i] = on;
        dot.classList.toggle('is-on', on);
      });
      labels.forEach((label, i) => label.classList.toggle('is-on', p >= reachAt[i] - 0.001));
      // Les 4 premières étapes suivent les points ; la dernière s'allume pendant le retour.
      steps.forEach((step, i) => {
        const at = i < dots.length ? reachAt[i] : 0.95;
        step.classList.toggle('is-on', p >= at - 0.001);
      });

      // Arrivée : la réponse est revenue au formulaire.
      const done = p >= DONE_AT;
      if (done && !wasDone && fx) pulse(rings[0], ink);
      wasDone = done;
    };

    // « Armé » : le CSS peut maintenant atténuer ce qui n'est pas encore atteint.
    wrap.classList.add('is-armed');
    // p = progression du trajet (0 à 1). render(0) dessine l'état de départ, puis fx = true autorise les ondes.
    const state = { p: 0 };
    render(0);
    fx = true;

    // Relie la progression p au défilement : elle passe de 0 à 1 pendant que la liste des étapes défile.
    // scrub: 1 = l'animation suit le défilement, avec un peu d'inertie.
    gsap.to(state, {
      p: 1,
      ease: 'none',
      onUpdate: () => render(state.p),
      scrollTrigger: { trigger: wrap.querySelector('.fsteps'), start: 'top 60%', end: 'bottom bottom', scrub: 1 },
    });

    // Utilisée par degrade() : affiche le schéma complet, sans animation.
    flowFinish = () => {
      fx = false;
      render(1);
      wrap.classList.remove('is-armed');
    };
  }

  /* ------------------------------------------------------------
     4. Révélations au défilement : les titres, les textes, les
        projets, les boutons de contact et le pied de page
        apparaissent quand on arrive dessus.
        En plus : une barre de progression en haut de la page et un
        effet de profondeur sur le nom du hero.
     ------------------------------------------------------------ */

  // Listes de ce que ces animations créent. degrade() s'en sert pour tout arrêter et tout rendre visible.
  const revealed = [];   // les éléments cachés au départ
  const tweens = [];     // les animations
  const observers = [];  // les « guetteurs » qui attendent qu'un élément entre à l'écran

  // Lance une animation (créée en pause) quand l'élément entre dans l'écran, une seule fois.
  // IntersectionObserver fonctionne même pour un élément tout en bas de la page, contrairement à un départ fixe.
  function playWhenVisible(trigger, tween, margin) {
    if (!('IntersectionObserver' in window)) { tween.progress(1); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { tween.play(); io.disconnect(); }
    }, { rootMargin: margin || '0px 0px -10% 0px' });
    io.observe(trigger);
    observers.push(io);
  }

  // Crée une animation « arrive depuis un état caché » et la déclenche quand `trigger` devient visible.
  // clearProps efface les styles écrits par GSAP à la fin : les effets de survol du CSS reprennent la main.
  function reveal(trigger, targets, vars, margin) {
    const list = gsap.utils.toArray(targets);
    if (!list.length) return;
    revealed.push(...list);
    const tween = gsap.from(list, { ...vars, paused: true, clearProps: 'opacity,visibility,transform' });
    tweens.push(tween);
    playWhenVisible(trigger, tween, margin);
  }

  // Découpe un titre en mots : <span class="word"><span class="word__in">mot</span></span>.
  // Le cadre .word cache ce qui dépasse (voir le CSS) : chaque mot sort du bas du cadre en montant.
  function splitWords(title) {
    const text = title.textContent.trim();
    // Les lecteurs d'écran lisent le titre entier ; les mots découpés leur sont cachés.
    title.setAttribute('aria-label', text);
    title.textContent = '';
    const words = text.split(/\s+/);
    words.forEach((word, i) => {
      const outer = document.createElement('span');
      outer.className = 'word';
      outer.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.className = 'word__in';
      inner.textContent = word;
      outer.appendChild(inner);
      title.appendChild(outer);
      // Une espace entre les mots, pour que le texte passe à la ligne normalement.
      if (i < words.length - 1) title.appendChild(document.createTextNode(' '));
    });
    return title.querySelectorAll('.word__in');
  }

  function sectionReveals() {
    // 1) Titres de section : les mots montent l'un après l'autre.
    gsap.utils.toArray('.title').forEach((title) => {
      reveal(title, splitWords(title), { yPercent: 115, duration: 0.9, stagger: 0.07, ease: 'power4.out' });
    });

    // 2) Textes d'introduction : fondu avec un léger mouvement vers le haut.
    gsap.utils.toArray('.lede, .skills__intro').forEach((el) => {
      reveal(el, el, { autoAlpha: 0, y: 22, duration: 0.8, ease: 'power3.out' });
    });

    // 3) Projets : les lignes arrivent l'une après l'autre.
    const list = document.querySelector('.work__list');
    if (list) {
      reveal(list, list.querySelectorAll('.work__row'), { autoAlpha: 0, y: 32, duration: 0.8, stagger: 0.14, ease: 'power3.out' });
    }

    // 4) Contact : les trois boutons arrivent avec un petit rebond.
    // On anime les <li> et pas les boutons, car les boutons ont déjà une transition CSS pour leur survol.
    const links = document.querySelector('.contact__links');
    if (links) {
      reveal(links, links.querySelectorAll('li'), { autoAlpha: 0, y: 36, scale: 0.92, duration: 0.8, stagger: 0.12, ease: 'back.out(1.6)' }, '0px 0px -5% 0px');
    }

    // 5) Pied de page : simple fondu.
    const footer = document.querySelector('.footer');
    if (footer) reveal(footer, footer, { autoAlpha: 0, y: 16, duration: 0.8, ease: 'power2.out' }, '0px');
  }

  // Barre de progression orange en haut de la page : elle se remplit pendant qu'on descend.
  // scrub: 0.3 = elle suit le défilement avec un tout petit retard, ce qui l'adoucit.
  function scrollProgress() {
    const bar = document.querySelector('.progress span');
    if (!bar) return;
    gsap.fromTo(bar, { scaleX: 0 }, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
    });
  }

  // Profondeur : en descendant, le nom du hero monte un peu plus vite que la page et s'estompe.
  // Il sert de première « couche » : le reste du hero reste en place.
  function heroParallax() {
    const name = document.querySelector('.hero__name');
    if (!name) return;
    gsap.to(name, {
      y: () => -window.innerHeight * 0.1,
      autoAlpha: 0.2,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
    });
  }

  /* ------------------------------------------------------------
     Si la page est affichée dans un cadre qui ne défile pas lui-même
     (aperçu), les animations liées au scroll ne peuvent pas marcher :
     on garde l'entrée animée et le reste reste statique et lisible.
     ------------------------------------------------------------ */
  let degraded = false;
  // « Plat » = la page n'est pas plus haute que l'écran (ex. aperçu dans un cadre) : le défilement ne peut pas piloter l'animation.
  const isFlat = () => root.scrollHeight <= window.innerHeight * 1.15;

  // Mode simplifié : on supprime les animations liées au défilement et on affiche tout.
  const degrade = () => {
    if (degraded) return;
    degraded = true;
    ScrollTrigger.getAll().forEach((t) => t.kill(true));
    gsap.set('.tech, .group__title', { clearProps: 'all' });
    // On arrête les révélations et on remet tout ce qu'elles cachaient en état normal.
    observers.forEach((o) => o.disconnect());
    tweens.forEach((t) => t.kill());
    if (revealed.length) gsap.set(revealed, { clearProps: 'all' });
    gsap.set('.hero__name', { clearProps: 'all' });
    if (flowFinish) flowFinish();
  };

  // Installe les animations liées au défilement (compétences, trajet, révélations, progression et profondeur).
  const setup = () => {
    if (isFlat()) { degrade(); return; }
    skillsReveal();
    flowDiagram();
    sectionReveals();
    scrollProgress();
    heroParallax();
    // Quand la fenêtre change de taille (avec 0,3 s d'attente), on passe en mode simplifié si la page est devenue « plate ».
    let timer;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => { if (isFlat()) degrade(); }, 300);
    });
  };

  // Démarrage : l'écran de chargement d'abord ; quand il a fini, l'animation du hero démarre.
  runLoader(heroIntro);

  // On installe le reste une fois la page chargée (petit délai pour laisser la mise en page se stabiliser).
  if (document.readyState === 'complete') setTimeout(setup, 400);
  else window.addEventListener('load', () => setTimeout(setup, 400));

  // Recalcule les positions une fois les polices chargées.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
