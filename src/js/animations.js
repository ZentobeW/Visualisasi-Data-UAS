/**
 * Animation Orchestrator
 * Manages IntersectionObserver-based scroll reveals, nav scroll state,
 * nav link active underline, counter-up for metric numbers, and table row reveals.
 * All animations use transform/opacity only (GPU-safe).
 * Respects prefers-reduced-motion.
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── Scroll-reveal via IntersectionObserver ─── */
function initScrollReveals() {
  const revealTargets = document.querySelectorAll(
    '.reveal-ready, .reveal-left, .reveal-right, .reveal-scale'
  );

  if (!revealTargets.length) return;

  if (prefersReducedMotion) {
    revealTargets.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealTargets.forEach(el => revealObserver.observe(el));
}

/* ─── Chapter banner scroll reveals ─── */
function initChapterBanners() {
  const banners = document.querySelectorAll('.chapter-lead-banner');

  if (!banners.length) return;

  if (prefersReducedMotion) {
    banners.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const bannerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          bannerObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
  );

  banners.forEach(el => bannerObserver.observe(el));
}

/* ─── Methodology table row reveals ─── */
function initTableRowReveals() {
  const tableRows = document.querySelectorAll('.dossier-spec-table tbody tr');

  if (!tableRows.length) return;

  if (prefersReducedMotion) {
    tableRows.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const rowObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          rowObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -20px 0px' }
  );

  tableRows.forEach(el => rowObserver.observe(el));
}

/* ─── Footer reveal ─── */
function initFooterReveal() {
  const footer = document.querySelector('.editorial-footer');
  if (!footer) return;

  if (prefersReducedMotion) {
    footer.classList.add('is-revealed');
    return;
  }

  const footerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          footer.classList.add('is-revealed');
          footerObserver.unobserve(footer);
        }
      });
    },
    { threshold: 0.08 }
  );

  footerObserver.observe(footer);
}

/* ─── Nav island scroll state ─── */
function initNavScrollState() {
  const navIsland = document.querySelector('.nav-island');
  if (!navIsland) return;

  const SCROLL_THRESHOLD = 60;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        if (scrollY > SCROLL_THRESHOLD) {
          navIsland.classList.add('is-scrolled');
        } else {
          navIsland.classList.remove('is-scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ─── Metric counter-up animation ─── */
function animateCounter(el, targetText, duration = 1100) {
  if (prefersReducedMotion) return;

  // Parse the numeric part from strings like "18.6%", "+15.7%", "68.2%", "82.4%"
  const sign = targetText.startsWith('+') ? '+' : '';
  const numericStr = targetText.replace(/[^0-9.]/g, '');
  const suffix = targetText.replace(/[0-9.+]/g, '');
  const target = parseFloat(numericStr);

  if (isNaN(target)) return;

  const start = performance.now();
  const ease = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease-in-out

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = ease(progress);
    const current = (target * eased).toFixed(1);
    el.textContent = `${sign}${current}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = targetText;
    }
  }

  requestAnimationFrame(tick);
}

function initMetricCounters() {
  const metricNums = document.querySelectorAll('.metric-num[id]');
  if (!metricNums.length) return;

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const original = el.textContent.trim();
          animateCounter(el, original, 1200);
          counterObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  metricNums.forEach(el => counterObserver.observe(el));
}

/* ─── Master init — called from main.js after DOMContentLoaded ─── */
export function initAnimations() {
  initScrollReveals();
  initChapterBanners();
  initTableRowReveals();
  initFooterReveal();
  initNavScrollState();
  initMetricCounters();
}
