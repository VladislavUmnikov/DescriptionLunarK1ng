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
   Ambient backdrop: soft, slow-drifting glow + a scattering of quiet
   data-points. Deliberately understated — a supporting texture, not a
   feature. Pauses when the tab is hidden; one static frame under
   prefers-reduced-motion.
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

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;
  let dots = [];
  let glows = [];
  let rafId = null;
  let startTime = performance.now();

  function dotCountFor(w, h) {
    const density = 22000; // sparse — a quiet texture, not a starfield
    return Math.max(18, Math.min(Math.round((w * h) / density), 60));
  }

  function makeDot() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.6 + Math.random() * 0.9,
      baseAlpha: 0.15 + Math.random() * 0.25,
      speed: 0.25 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      driftY: 0.002 + Math.random() * 0.004,
    };
  }

  function makeGlow(i) {
    const color = GLOW_COLORS[i % GLOW_COLORS.length];
    return {
      baseX: width * (0.25 + 0.5 * (i % 2)),
      baseY: height * (0.15 + Math.random() * 0.25),
      radius: Math.max(width, height) * 0.5,
      color,
      alpha: 0.05,
      period: 90 + Math.random() * 40,
      phase: Math.random() * Math.PI * 2,
      amp: 50 + Math.random() * 40,
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    dots = Array.from({ length: dotCountFor(width, height) }, makeDot);
    glows = Array.from({ length: 2 }, (_, i) => makeGlow(i));

    if (prefersReducedMotion) drawStatic();
  }

  function drawGlows(t) {
    for (const g of glows) {
      const x = g.baseX + Math.sin(t / g.period + g.phase) * g.amp;
      const y = g.baseY + Math.cos(t / (g.period * 1.4) + g.phase) * g.amp * 0.5;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, g.radius);
      gradient.addColorStop(0, `rgba(${g.color[0]}, ${g.color[1]}, ${g.color[2]}, ${g.alpha})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
  }

  function drawDots(t) {
    for (const d of dots) {
      d.y += d.driftY;
      if (d.y > height + 4) { d.y = -4; d.x = Math.random() * width; }
      const twinkle = 0.5 + 0.5 * Math.sin(t * d.speed + d.phase);
      const alpha = d.baseAlpha * (0.5 + 0.5 * twinkle);
      ctx.beginPath();
      ctx.fillStyle = `rgba(200, 214, 245, ${alpha})`;
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(now) {
    const t = (now - startTime) / 1000;
    ctx.clearRect(0, 0, width, height);
    drawGlows(t);
    drawDots(t);
    rafId = requestAnimationFrame(frame);
  }

  function drawStatic() {
    ctx.clearRect(0, 0, width, height);
    drawGlows(0);
    for (const d of dots) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(200, 214, 245, ${d.baseAlpha})`;
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
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
