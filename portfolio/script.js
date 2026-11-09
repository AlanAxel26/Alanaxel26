(() => {
  'use strict';

  const root = document.documentElement;

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Sans GSAP (réseau bloqué) ou avec "mouvement réduit" : tout reste visible, sans animation.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger || reduceMotion) {
    root.classList.add('no-motion');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

  /* ------------------------------------------------------------
     1. Entrée de la page : le nom monte lettre par lettre,
        puis le reste apparaît.
     ------------------------------------------------------------ */
  function heroIntro() {
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

    gsap.set('.hero__line', { autoAlpha: 1 });

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
    const panel = document.querySelector('.loader');
    if (!panel) { onExit(); return; }

    const num = panel.querySelector('.loader__num');
    const fill = panel.querySelector('.loader__fill');
    const state = { v: 0 };
    const render = () => {
      num.textContent = Math.round(state.v);
      fill.style.transform = 'scaleX(' + state.v / 100 + ')';
    };

    root.classList.add('is-loading');

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

    const climb = new Promise((resolve) => {
      gsap.to(state, { v: 85, duration: 1.4, ease: 'power2.out', onUpdate: render, onComplete: resolve });
    });

    Promise.all([waitAtMost, climb]).then(() => {
      gsap.to(state, {
        v: 100,
        duration: 0.5,
        ease: 'power1.inOut',
        onUpdate: render,
        onComplete: exit,
      });
    });

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
    gsap.utils.toArray('.group').forEach((group) => {
      gsap.from(group.querySelectorAll('.tech'), {
        autoAlpha: 0,
        y: 28,
        duration: 0.7,
        stagger: 0.09,
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
  let flowFinish = null;

  function flowDiagram() {
    const wrap = document.querySelector('.flow__diagram');
    if (!wrap) return;

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
    const lenOut = out.getTotalLength();
    const lenBack = back.getTotalLength();
    const clamp = (v) => Math.min(1, Math.max(0, v));
    const reachAt = dots.map((_, i) => (i / (dots.length - 1)) * OUT_SHARE);
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

    const accent = css('--accent');
    const ink = css('--ink');
    let fx = false;                               // pas d'effets pour le rendu initial
    const wasOn = dots.map(() => false);
    let wasDone = false;

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

    wrap.classList.add('is-armed');
    const state = { p: 0 };
    render(0);
    fx = true;

    gsap.to(state, {
      p: 1,
      ease: 'none',
      onUpdate: () => render(state.p),
      scrollTrigger: { trigger: wrap.querySelector('.fsteps'), start: 'top 60%', end: 'bottom bottom', scrub: 1 },
    });

    flowFinish = () => {
      fx = false;
      render(1);
      wrap.classList.remove('is-armed');
    };
  }

  /* ------------------------------------------------------------
     Si la page est affichée dans un cadre qui ne défile pas lui-même
     (aperçu), les animations liées au scroll ne peuvent pas marcher :
     on garde l'entrée animée et le reste reste statique et lisible.
     ------------------------------------------------------------ */
  let degraded = false;
  const isFlat = () => root.scrollHeight <= window.innerHeight * 1.15;

  const degrade = () => {
    if (degraded) return;
    degraded = true;
    ScrollTrigger.getAll().forEach((t) => t.kill(true));
    gsap.set('.tech', { clearProps: 'all' });
    if (flowFinish) flowFinish();
  };

  const setup = () => {
    if (isFlat()) { degrade(); return; }
    skillsReveal();
    flowDiagram();
    let timer;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => { if (isFlat()) degrade(); }, 300);
    });
  };

  runLoader(heroIntro);

  if (document.readyState === 'complete') setTimeout(setup, 400);
  else window.addEventListener('load', () => setTimeout(setup, 400));

  // Recalcule les positions une fois les polices chargées.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
