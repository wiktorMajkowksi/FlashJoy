/* ════════════════════════════════════════════════════
   FlashJoy — App Script
   Clean, robust, progressive-enhancement first.
   ════════════════════════════════════════════════════ */

'use strict';

// ── Utilities ─────────────────────────────────────────
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Theme toggle ─────────────────────────────────────
(function initTheme() {
  const root = document.documentElement;
  const btn  = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('fj-theme');

  function applyTheme(theme) {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      if (btn) btn.setAttribute('aria-label', 'Switch to dark theme');
    } else {
      root.removeAttribute('data-theme');
      if (btn) btn.setAttribute('aria-label', 'Switch to light theme');
    }
  }

  applyTheme(saved || 'dark');

  if (!btn) return;
  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('fj-theme', next);
  });
})();

// ── Year ─────────────────────────────────────────────
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ── Scroll progress bar ──────────────────────────────
const progressFill = $('#progress');
if (progressFill) {
  const updateProgress = () => {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progressFill.style.width = total > 0 ? `${Math.min(100, (scrolled / total) * 100)}%` : '0%';
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}

// ── Header scroll state ──────────────────────────────
// Adds .scrolled class after user passes a small threshold,
// enabling the glass nav background.
const header = $('#site-header');
if (header) {
  let ticking = false;
  const checkScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(checkScroll); ticking = true; }
  }, { passive: true });
  checkScroll();
}

// ── Mobile menu ──────────────────────────────────────
const menuBtn    = $('#menu-btn');
const mobileMenu = $('#mobile-menu');

if (menuBtn && mobileMenu) {
  const bars = $$('.bar', menuBtn);

  function openMenu() {
    mobileMenu.hidden = false;
    menuBtn.setAttribute('aria-expanded', 'true');
    if (bars[0]) bars[0].style.transform = 'translateY(7px) rotate(45deg)';
    if (bars[1]) bars[1].style.opacity   = '0';
    if (bars[2]) bars[2].style.transform = 'translateY(-7px) rotate(-45deg)';
  }

  function closeMenu() {
    mobileMenu.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    bars.forEach(b => { b.style.transform = ''; b.style.opacity = ''; });
  }

  menuBtn.addEventListener('click', () => {
    mobileMenu.hidden ? openMenu() : closeMenu();
  });

  // Close when any link is tapped
  $$('.mobile-link', mobileMenu).forEach(a => a.addEventListener('click', closeMenu));

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !mobileMenu.hidden) closeMenu();
  });
}

// ── Active nav highlight ─────────────────────────────
const navLinks   = $$('.nav-link');
const sectionIds = ['hero','gallery','features','pricing','about','contact'];

const sectionIO = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
    });
  });
}, { rootMargin: '-35% 0px -60% 0px' });

sectionIds.forEach(id => {
  const el = document.getElementById(id);
  if (el) sectionIO.observe(el);
});

// ── Smooth scroll for all anchor links ──────────────
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
});

// ── Gallery ──────────────────────────────────────────
(function initGallery() {
  const slides  = $$('.gslide');
  const thumbs  = $$('.gthumb');
  const counter = $('#gal-counter');
  const prevBtn = $('#gal-prev');
  const nextBtn = $('#gal-next');
  const viewer  = $('#gallery-viewer');

  if (!slides.length) return;

  // Build source list for lightbox
  const sources = slides.map(s => {
    const img = s.querySelector('img');
    return { src: img.src, alt: img.alt };
  });

  let current = 0;
  let autoTimer = null;
  const AUTOPLAY_MS = 5200;

  function goTo(n) {
    const next = ((n % slides.length) + slides.length) % slides.length;
    if (next === current) return;

    slides[current].classList.remove('active');
    thumbs[current]?.classList.remove('active');
    thumbs[current]?.setAttribute('aria-selected', 'false');

    current = next;

    slides[current].classList.add('active');
    thumbs[current]?.classList.add('active');
    thumbs[current]?.setAttribute('aria-selected', 'true');

    if (counter) counter.textContent = `${current + 1} / ${slides.length}`;
  }

  function startAuto() {
    if (reduced) return;
    stopAuto();
    autoTimer = setInterval(() => goTo(current + 1), AUTOPLAY_MS);
  }
  function stopAuto()    { clearInterval(autoTimer); autoTimer = null; }
  function restartAuto() { stopAuto(); startAuto(); }

  // Init: ensure first slide is active
  slides[0].classList.add('active');
  thumbs[0]?.classList.add('active');
  thumbs[0]?.setAttribute('aria-selected', 'true');

  prevBtn?.addEventListener('click', e => { e.stopPropagation(); goTo(current - 1); restartAuto(); });
  nextBtn?.addEventListener('click', e => { e.stopPropagation(); goTo(current + 1); restartAuto(); });

  thumbs.forEach((t, i) => {
    t.addEventListener('click', () => { goTo(i); restartAuto(); });
  });

  // Keyboard support on viewer
  viewer?.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { goTo(current - 1); restartAuto(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); restartAuto(); }
  });

  // Pause autoplay on interaction
  const galSection = document.getElementById('gallery');
  galSection?.addEventListener('mouseenter', stopAuto,  { passive: true });
  galSection?.addEventListener('mouseleave', startAuto, { passive: true });
  galSection?.addEventListener('focusin',   stopAuto,  { passive: true });
  galSection?.addEventListener('focusout',  startAuto, { passive: true });

  startAuto();

  // ── Lightbox ──────────────────────────────────────
  const lb     = $('#lightbox');
  const lbImg  = $('#lb-img');
  let lbIdx    = 0;

  function openLightbox(idx) {
    lbIdx = idx;
    lbImg.src = sources[lbIdx].src;
    lbImg.alt = sources[lbIdx].alt;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    // Focus the next button for keyboard users
    $('[data-lb-next]', lb)?.focus();
  }

  function closeLightbox() {
    lb.hidden = true;
    document.body.style.overflow = '';
  }

  function lbMove(dir) {
    lbIdx = ((lbIdx + dir) % sources.length + sources.length) % sources.length;
    lbImg.src = sources[lbIdx].src;
    lbImg.alt = sources[lbIdx].alt;
  }

  // Click viewer (not arrow buttons) to open
  viewer?.addEventListener('click', e => {
    if (!e.target.closest('.gal-arrow')) openLightbox(current);
  });

  $$('[data-lb-close]', lb).forEach(el => el.addEventListener('click', closeLightbox));
  $('[data-lb-prev]', lb)?.addEventListener('click', () => lbMove(-1));
  $('[data-lb-next]', lb)?.addEventListener('click', () => lbMove(1));

  document.addEventListener('keydown', e => {
    if (!lb || lb.hidden) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowRight') lbMove(1);
    if (e.key === 'ArrowLeft')  lbMove(-1);
  });
})();

// ── Feature card 3-D tilt ────────────────────────────
// Subtle perspective tilt on hover — purely decorative.
if (!reduced) {
  $$('.feat-card[data-tilt]').forEach(card => {
    let rafId = null;

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.14s ease';
    });

    card.addEventListener('mousemove', e => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        card.style.transform =
          `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-4px)`;
      });
    });

    card.addEventListener('mouseleave', () => {
      cancelAnimationFrame(rafId);
      card.style.transition = 'transform 0.55s cubic-bezier(.22,.61,.36,1), border-color 0.3s ease, box-shadow 0.3s ease';
      card.style.transform = '';
      setTimeout(() => { card.style.transition = ''; }, 580);
    });
  });
}

// ── GSAP cinematic motion system ─────────────────────
// CRITICAL APPROACH: use gsap.from() throughout so content is
// naturally visible at its resting state. If GSAP fails or is
// slow, every element is already correctly positioned and opaque.
// Never use gsap.set({ opacity: 0 }) on hero elements.
(function initMotion() {
  if (typeof gsap === 'undefined') return;
  if (reduced) return;

  gsap.registerPlugin(ScrollTrigger);

  // ── Hero entrance ─────────────────────────────────
  // gsap.from() → "from" is the start state, "to" is the natural
  // visible default. No risk of leaving content invisible.
  const heroTL = gsap.timeline({
    defaults: { ease: 'power3.out' },
    delay: 0.08,
  });

  heroTL
    .from('.hero-eyebrow', { duration: 0.9, opacity: 0, y: 16, ease: 'power2.out' }, 0)
    .from('[data-hi="line1"]', { duration: 1.0, opacity: 0, y: 40, ease: 'power3.out' }, 0.16)
    .from('[data-hi="line2"]', { duration: 1.0, opacity: 0, y: 40, ease: 'power3.out' }, 0.28)
    .from('.hero-sub',         { duration: 0.9, opacity: 0, y: 24 }, 0.44)
    .from('.hero-ctas',        { duration: 0.8, opacity: 0, y: 20 }, 0.56)
    .from('.hero-stats',       { duration: 0.8, opacity: 0, y: 16 }, 0.68)
    .from('.scroll-cue',       { duration: 0.7, opacity: 0, y: 10 }, 0.92);

  // ── Ambient orb parallax on hero scroll ───────────
  // Gentle drift — purely decorative, no content affected.
  gsap.to('.orb-violet', {
    y: '-18%',
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 2,
    },
  });
  gsap.to('.orb-rose', {
    y: '-12%',
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 2.5,
    },
  });

  // ── Scroll-triggered reveals ──────────────────────
  // IMPORTANT: immediateRender: false prevents GSAP from applying
  // the "from" state (opacity:0) before the scroll trigger fires.
  // Without this, elements below the viewport start invisible and
  // can get stuck if the trigger never fires cleanly.

  function revealFrom(el, fromVars, triggerOpts = {}) {
    gsap.from(el, {
      ...fromVars,
      immediateRender: false,       // do NOT hide element until trigger fires
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true,
        ...triggerOpts,
      },
    });
  }

  // Gallery wrap
  const galleryWrap = $('.gallery-wrap');
  if (galleryWrap) revealFrom(galleryWrap, { duration: 1.0, opacity: 0, y: 48, ease: 'power3.out' });

  // Section headings
  $$('.section-head[data-reveal]').forEach(el => {
    revealFrom(el, { duration: 0.9, opacity: 0, y: 40, ease: 'power3.out' });
  });

  // Generic [data-reveal] — exclude elements that have dedicated animations below
  $$('[data-reveal]:not(.section-head):not(.gallery-wrap):not(.feat-card):not(.price-card):not(.contact-link):not(.addon-section)').forEach(el => {
    revealFrom(el, { duration: 0.85, opacity: 0, y: 30, ease: 'power3.out' });
  });

  // ── Feature cards — staggered rise ────────────────
  // Each card is animated individually with a stagger delay.
  // Excluded from [data-reveal] loop above to avoid duplicate tweens.
  $$('.feat-card').forEach((card, i) => {
    revealFrom(card,
      { duration: 0.95, opacity: 0, y: 50, ease: 'power3.out', delay: i * 0.13 },
    );
  });

  // ── Pricing / package cards ────────────────────────
  $$('.price-card').forEach((card, i) => {
    revealFrom(card,
      { duration: 0.95, opacity: 0, y: 44, ease: 'power3.out', delay: i * 0.08 },
    );
  });

  // ── Add-on cards ───────────────────────────────────
  $$('.addon-card').forEach((card, i) => {
    revealFrom(card,
      { duration: 0.75, opacity: 0, y: 28, ease: 'power3.out', delay: i * 0.06 },
      { start: 'top 92%' },
    );
  });

  // ── Contact links ─────────────────────────────────
  $$('.contact-link').forEach((link, i) => {
    revealFrom(link,
      { duration: 0.8, opacity: 0, x: 28, ease: 'power3.out', delay: i * 0.10 },
    );
  });
})();
