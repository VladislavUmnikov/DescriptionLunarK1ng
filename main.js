// main.js — no dependencies, ES module.

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------------------------------------------------------
   Split the hero title into per-letter spans for the staggered reveal.
   Falls back to plain text if anything goes wrong.
   -------------------------------------------------------------------------- */
function splitTitleIntoChars() {
  const title = document.getElementById('heroTitle');
  if (!title) return;

  const text = title.textContent;
  title.textContent = '';

  const frag = document.createDocumentFragment();
  let charIndex = 0;

  for (const word of text.split(' ')) {
    const wordSpan = document.createElement('span');
    wordSpan.style.display = 'inline-block';
    wordSpan.style.whiteSpace = 'nowrap';

    for (const ch of word) {
      const charSpan = document.createElement('span');
      charSpan.className = 'char';
      charSpan.style.setProperty('--i', String(charIndex));
      charSpan.textContent = ch;
      wordSpan.appendChild(charSpan);
      charIndex += 1;
    }
    frag.appendChild(wordSpan);
    frag.appendChild(document.createTextNode('\u00A0'));
  }
  title.appendChild(frag);
}

/* --------------------------------------------------------------------------
   Reveal sections once, the first time they enter the viewport.
   -------------------------------------------------------------------------- */
function setUpScrollReveal() {
  const targets = document.querySelectorAll('.about, .help, .contact, .footer');
  if (!targets.length) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.25, rootMargin: '0px 0px -10% 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

/* --------------------------------------------------------------------------
   Gentle continuous pulse for the hero star's glow, via requestAnimationFrame.
   Skipped entirely when reduced motion is requested.
   -------------------------------------------------------------------------- */
function startStarPulse() {
  if (prefersReducedMotion) return;

  const hero = document.getElementById('hero');
  if (!hero) return;

  let rafId = null;
  const start = performance.now();

  function tick(now) {
    const elapsed = (now - start) / 1000;
    // Slow, smooth sine wave, range 0..1
    const pulse = (Math.sin(elapsed * 0.6) + 1) / 2;
    hero.style.setProperty('--pulse', pulse.toFixed(4));
    rafId = requestAnimationFrame(tick);
  }

  // Pause the loop when the hero isn't visible, resume when it is.
  const visibilityObserver = new IntersectionObserver((entries) => {
    const visible = entries[0]?.isIntersecting;
    if (visible && rafId === null) {
      rafId = requestAnimationFrame(tick);
    } else if (!visible && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  });
  visibilityObserver.observe(hero);
}

/* --------------------------------------------------------------------------
   Init
   -------------------------------------------------------------------------- */
function init() {
  splitTitleIntoChars();

  const hero = document.getElementById('hero');
  if (hero) {
    // Triggers the CSS entrance animations (star ignite, letters, subtitle).
    requestAnimationFrame(() => hero.classList.add('is-loaded'));
  }

  setUpScrollReveal();
  startStarPulse();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
