// main.js — no dependencies, ES module.

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------------------------------------------------------
   "Коротко" / "Подробнее" toggle.
   -------------------------------------------------------------------------- */
function setUpModeSwitch() {
  const btnShort = document.getElementById('btnShort');
  const btnDetailed = document.getElementById('btnDetailed');
  const detailed = document.getElementById('detailed');
  if (!btnShort || !btnDetailed || !detailed) return;

  function showDetailed() {
    detailed.hidden = false;
    // Next frame, so the browser registers the un-hiding before animating in.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => detailed.classList.add('is-open'));
    });
    btnDetailed.classList.add('is-active');
    btnDetailed.setAttribute('aria-pressed', 'true');
    btnShort.classList.remove('is-active');
    btnShort.setAttribute('aria-pressed', 'false');
    revealNewlyShownSections();
  }

  function showShort() {
    detailed.classList.remove('is-open');
    detailed.hidden = true;
    btnShort.classList.add('is-active');
    btnShort.setAttribute('aria-pressed', 'true');
    btnDetailed.classList.remove('is-active');
    btnDetailed.setAttribute('aria-pressed', 'false');
  }

  btnDetailed.addEventListener('click', () => {
    if (!btnDetailed.classList.contains('is-active')) showDetailed();
  });
  btnShort.addEventListener('click', () => {
    if (!btnShort.classList.contains('is-active')) showShort();
  });
}

/* --------------------------------------------------------------------------
   Reveal sections once, the first time they enter the viewport.
   -------------------------------------------------------------------------- */
let sectionObserver = null;

function setUpScrollReveal() {
  const targets = document.querySelectorAll('.section');
  if (!targets.length) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  sectionObserver = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  );

  targets.forEach((el) => sectionObserver.observe(el));
}

// Sections inside the "Подробнее" panel start hidden, so the observer never
// saw them. Once revealed, hook up any that are still unobserved.
function revealNewlyShownSections() {
  if (prefersReducedMotion || !sectionObserver) {
    document.querySelectorAll('.detailed .section').forEach((el) => el.classList.add('is-visible'));
    return;
  }
  document.querySelectorAll('.detailed .section:not(.is-visible)').forEach((el) => {
    sectionObserver.observe(el);
  });
}

/* --------------------------------------------------------------------------
   Deep-space backdrop: three depth layers (far / mid / near) of stars with
   independently randomized size, brightness, twinkle timing and drift, plus
   two slow-drifting atmospheric glows. Layers respond to scroll with a very
   small, layer-proportional offset for a subtle sense of depth. Particle
   counts adapt to viewport width. Pauses when the tab is hidden; renders a
   single static, still-composed frame under prefers-reduced-motion.
   -------------------------------------------------------------------------- */
function setUpBackground() {
  const canvas = document.getElementById('bgfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const GLOW_COLORS = [
    [82, 217, 255],  // cyan
    [139, 124, 246], // violet
  ];
  const STAR_TINT = [214, 224, 248];

  // Depth layers: each has its own size / brightness / drift-speed range and
  // a parallax factor controlling how much it shifts as the page scrolls.
  const LAYER_DEFS = [
    { key: 'far',  rRange: [0.35, 0.7],  alphaRange: [0.12, 0.30], speedRange: [0.15, 0.35], driftRange: [0.0015, 0.003],  parallax: 0.01, glow: false },
    { key: 'mid',  rRange: [0.7, 1.15],  alphaRange: [0.25, 0.45], speedRange: [0.3, 0.6],   driftRange: [0.003, 0.006],  parallax: 0.025, glow: false },
    { key: 'near', rRange: [1.3, 2.1],   alphaRange: [0.5, 0.8],   speedRange: [0.2, 0.4],   driftRange: [0.001, 0.0025], parallax: 0.05, glow: true },
  ];

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;
  let layers = { far: [], mid: [], near: [] };
  let glows = [];
  let rafId = null;
  let startTime = performance.now();
  let scrollY = window.scrollY || 0;

  // Fewer particles on small phones, more room to breathe on desktop.
  function countsFor(w) {
    if (w < 480)  return { far: 26, mid: 12, near: 3 };
    if (w < 768)  return { far: 38, mid: 17, near: 4 };
    if (w < 1200) return { far: 52, mid: 22, near: 5 };
    return { far: 66, mid: 28, near: 6 };
  }

  function rand([a, b]) { return a + Math.random() * (b - a); }

  function makeStar(def) {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: rand(def.rRange),
      baseAlpha: rand(def.alphaRange),
      twinkleSpeed: rand(def.speedRange),
      phase: Math.random() * Math.PI * 2,
      driftX: (Math.random() - 0.5) * rand(def.driftRange) * 2,
      driftY: rand(def.driftRange),
      parallax: def.parallax,
      glow: def.glow,
    };
  }

  function makeGlow(i) {
    const color = GLOW_COLORS[i % GLOW_COLORS.length];
    return {
      baseX: width * (0.22 + 0.56 * (i % 2)),
      baseY: height * (0.12 + Math.random() * 0.22),
      radius: Math.max(width, height) * 0.48,
      color,
      alpha: 0.045 + Math.random() * 0.02,
      period: 85 + Math.random() * 45,
      phase: Math.random() * Math.PI * 2,
      amp: 45 + Math.random() * 35,
      parallax: 0.04,
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const counts = countsFor(width);
    layers = {
      far: Array.from({ length: counts.far }, () => makeStar(LAYER_DEFS[0])),
      mid: Array.from({ length: counts.mid }, () => makeStar(LAYER_DEFS[1])),
      near: Array.from({ length: counts.near }, () => makeStar(LAYER_DEFS[2])),
    };
    glows = Array.from({ length: 2 }, (_, i) => makeGlow(i));

    if (prefersReducedMotion) drawStatic();
  }

  function drawGlows(t) {
    for (const g of glows) {
      const parY = scrollY * g.parallax;
      const x = g.baseX + Math.sin(t / g.period + g.phase) * g.amp;
      const y = g.baseY + Math.cos(t / (g.period * 1.4) + g.phase) * g.amp * 0.5 - parY;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, g.radius);
      gradient.addColorStop(0, `rgba(${g.color[0]}, ${g.color[1]}, ${g.color[2]}, ${g.alpha})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
  }

  function drawLayer(stars, t) {
    for (const s of stars) {
      s.x += s.driftX;
      s.y += s.driftY;
      if (s.x < -4) s.x = width + 4;
      if (s.x > width + 4) s.x = -4;
      if (s.y > height + 4) { s.y = -4; s.x = Math.random() * width; }

      // Wrap the scroll offset into the star's own field, so a long scroll
      // never carries stars fully off-canvas — it just re-enters below.
      const parY = ((scrollY * s.parallax) % height + height) % height;
      const drawY = (s.y + parY) % height;

      const twinkle = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.phase);
      const alpha = s.baseAlpha * (0.55 + 0.45 * twinkle);

      if (s.glow) {
        const halo = ctx.createRadialGradient(s.x, drawY, 0, s.x, drawY, s.r * 5);
        halo.addColorStop(0, `rgba(${STAR_TINT[0]}, ${STAR_TINT[1]}, ${STAR_TINT[2]}, ${alpha * 0.35})`);
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(s.x, drawY, s.r * 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.fillStyle = `rgba(${STAR_TINT[0]}, ${STAR_TINT[1]}, ${STAR_TINT[2]}, ${alpha})`;
      ctx.arc(s.x, drawY, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(now) {
    const t = (now - startTime) / 1000;
    ctx.clearRect(0, 0, width, height);
    drawGlows(t);
    drawLayer(layers.far, t);
    drawLayer(layers.mid, t);
    drawLayer(layers.near, t);
    rafId = requestAnimationFrame(frame);
  }

  function drawStatic() {
    ctx.clearRect(0, 0, width, height);
    drawGlows(0);
    for (const key of ['far', 'mid', 'near']) {
      for (const s of layers[key]) {
        if (s.glow) {
          const halo = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
          halo.addColorStop(0, `rgba(${STAR_TINT[0]}, ${STAR_TINT[1]}, ${STAR_TINT[2]}, ${s.baseAlpha * 0.3})`);
          halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(${STAR_TINT[0]}, ${STAR_TINT[1]}, ${STAR_TINT[2]}, ${s.baseAlpha})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function start() {
    if (rafId === null && !prefersReducedMotion) {
      startTime = performance.now();
      rafId = requestAnimationFrame(frame);
    }
  }
  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
  });

  // Passive scroll listener just records a number — no layout reads, no
  // work happens here. The next animation frame picks it up.
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  resize();
  start();
}

/* --------------------------------------------------------------------------
   Init
   -------------------------------------------------------------------------- */
function init() {
  setUpModeSwitch();
  setUpScrollReveal();
  setUpBackground();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
