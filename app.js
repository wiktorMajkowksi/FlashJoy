// ---------- Config ----------
const SECTIONS = [
  { id: 'hero', label: 'Home' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'features', label: 'Features' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

// Shorthand qs helpers
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

// ---------- Theme (light / dark only) ----------
const theme = {
  get() { return localStorage.getItem('theme') || 'dark'; },
  set(v) { localStorage.setItem('theme', v); applyTheme(); },
};

function applyTheme() {
  const t = theme.get();
  document.documentElement.classList.toggle('dark', t === 'dark');
  // Update any labels
  document.querySelectorAll('[data-theme-label]').forEach(el => {
    el.textContent = t === 'dark' ? 'Dark' : 'Light';
  });
}
applyTheme();

// ---------- Build nav (desktop + mobile) ----------
const desktopNav = $('#desktop-nav');
const mobileList = $('#mobile-menu ul');

const linkMarkup = (id,label,cls='') =>
  `<a href="#${id}" class="${cls} px-1 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500">${label}</a>`;

function buildNav(){
  if (!desktopNav || !mobileList) return;
  desktopNav.innerHTML = '';
  SECTIONS.forEach(({id,label}) => {
    const li = document.createElement('li');
    li.innerHTML = linkMarkup(id, label, 'nav-link text-slate-700 dark:text-slate-200');
    desktopNav.appendChild(li);
  });

  // Theme button (desktop)
  const themeLi = document.createElement('li');
  themeLi.innerHTML = `<button id="theme-btn" class="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500" aria-label="Toggle color theme" title="Toggle color theme">🌓 <span data-theme-label></span></button>`;
  desktopNav.appendChild(themeLi);

  // Mobile items
  mobileList.innerHTML = '';
  SECTIONS.forEach(({id,label}) => {
    const li = document.createElement('li');
    li.setAttribute('role','none');
    li.innerHTML = `<a role="menuitem" href="#${id}" class="nav-link-mobile block rounded-md px-3 py-2 text-sm">${label}</a>`;
    mobileList.appendChild(li);
  });
  const liTheme = document.createElement('li');
  liTheme.setAttribute('role','none');
  liTheme.className = 'pt-2';
  liTheme.innerHTML = `<div class="flex items-center gap-2">
    <button id="theme-btn-mobile" class="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500">🌓 <span data-theme-label></span></button>
  </div>`;
  mobileList.appendChild(liTheme);

  applyTheme();
}
buildNav();

// ---------- Mobile menu toggle ----------
const menuBtn = $('#menu-btn');
const mobileMenu = $('#mobile-menu');
if (menuBtn && mobileMenu){
  menuBtn.addEventListener('click', () => {
    const open = !mobileMenu.classList.toggle('hidden');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') mobileMenu.classList.add('hidden'); });
  mobileList.addEventListener('click', e => {
    if (e.target.closest('a[href^="#"]')) mobileMenu.classList.add('hidden');
  });
}

// Theme button clicks
function cycleTheme(){
  const current = theme.get();
  theme.set(current === 'light' ? 'dark' : 'light');
}
document.addEventListener('click', e => {
  if (e.target.closest('#theme-btn') || e.target.closest('#theme-btn-mobile')) cycleTheme();
});

// ---------- Active section highlighting & progress ----------
const progress = $('#progress');
const sectionEls = SECTIONS.map(s => document.getElementById(s.id)).filter(Boolean);
const navLinks = () => $$('.nav-link');
const navLinksMobile = () => $$('.nav-link-mobile');

function updateActive(id){
  const idx = SECTIONS.findIndex(s => s.id === id);
  if (progress) progress.style.width = `${Math.max(0, (idx+1)/SECTIONS.length) * 100}%`;
  const toggleStates = (a, active) => {
    a.classList.toggle('text-sky-600', active);
    a.classList.toggle('text-slate-700', !active);
    a.classList.toggle('dark:text-slate-200', !active);
  };
  navLinks().forEach(a => toggleStates(a, a.getAttribute('href').slice(1) === id));
  navLinksMobile().forEach(a => {
    const active = a.getAttribute('href').slice(1) === id;
    a.classList.toggle('bg-sky-50', active);
    a.classList.toggle('text-sky-700', active);
    a.classList.toggle('dark:bg-sky-900/40', active);
    a.classList.toggle('dark:text-sky-200', active);
  });
}
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) updateActive(entry.target.id); });
}, { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] });
sectionEls.forEach(el => io.observe(el));

// ---------- Simple reveal-on-view & tilt ----------
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReduced){
  const revealEls = $$('[data-reveal]');
  const rio = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.style.transition = 'opacity .6s ease, transform .6s ease';
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'none';
        rio.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => rio.observe(el));

  $$('.feature-card[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `translateY(-2px) rotateX(${ -y * 2 }deg) rotateY(${ x * 2 }deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}else{
  $$('[data-reveal]').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
}

// ---------- Toasts ----------
const toastsEl = $('#toasts');
function addToast(msg, variant='success'){
  const id = Math.random().toString(36).slice(2);
  const success = variant === 'success';
  const div = document.createElement('div');
  div.role = 'status';
  div.dataset.id = id;
  div.className = `min-w-[240px] max-w-sm rounded-xl border px-4 py-3 shadow-lg backdrop-blur transition focus:outline-none focus:ring ${
    success ? 'bg-white/90 border-emerald-200 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-100 dark:border-emerald-800'
            : 'bg-white/90 border-rose-200 text-rose-800 dark:bg-rose-900/70 dark:text-rose-100 dark:border-rose-800'
  }`;
  div.innerHTML = `<div class="flex items-start gap-3">
    <div class="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-current opacity-70" aria-hidden="true"></div>
    <p class="text-sm leading-5">${msg}</p>
    <button class="ml-auto rounded-md p-1 text-xs opacity-60 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500" aria-label="Close notification">✕</button>
  </div>`;
  div.querySelector('button').addEventListener('click', () => removeToast(id));
  toastsEl.appendChild(div);
  setTimeout(() => removeToast(id), 3500);
}
function removeToast(id){
  const el = toastsEl.querySelector(`[data-id="${id}"]`);
  if (el) el.remove();
}

// ---------- Form validation ----------
const form = $('#contact-form');
const nameEl = $('#name');
const emailEl = $('#email');
const msgEl = $('#message');
const errName = $('#err-name');
const errEmail = $('#err-email');
const errMsg = $('#err-message');

function setErr(el, errEl, msg){
  if (msg){
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
    el.classList.add('border-rose-500');
  }else{
    errEl.classList.add('hidden');
    el.classList.remove('border-rose-500');
  }
}
function validate(){
  let ok = true;
  if (!nameEl.value.trim()){ setErr(nameEl, errName, 'Please enter your name.'); ok = false; } else setErr(nameEl, errName, '');
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value);
  if (!emailOk){ setErr(emailEl, errEmail, 'Enter a valid email.'); ok = false; } else setErr(emailEl, errEmail, '');
  if (msgEl.value.trim().length < 10){ setErr(msgEl, errMsg, 'Tell us a bit more (10+ chars).'); ok = false; } else setErr(msgEl, errMsg, '');
  return ok;
}
if (form){
  form.addEventListener('submit', ev => {
    ev.preventDefault();
    if (!validate()){ addToast("Please fix the highlighted fields.", 'error'); return; }
    addToast("Thanks! We'll be in touch within one business day.", 'success');
    form.reset();
  });
}

// ---------- Year ----------
const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------- Smooth scroll enhancement ----------
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  if (!SECTIONS.some(s => s.id === id)) return;
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  e.preventDefault();
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
});

// /* REVEAL-LEFT STAGGER */
(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cards = Array.from(document.querySelectorAll('.reveal-left'));
  if (!cards.length) return;
  if (prefersReduced){
    cards.forEach(el => el.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        const el = entry.target;
        const i = cards.indexOf(el);
        el.style.transitionDelay = `${Math.min(i * 80, 400)}ms`;
        el.classList.add('in-view');
        io.unobserve(el);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
  cards.forEach(el => io.observe(el));
})();

// ---------- Lightweight Lightbox for #gallery ----------
(function(){
  const items = $$('#gallery [data-gallery]');
  const box = $('#lightbox');
  if (!items.length || !box) return;

  const img = $('#lightbox-img');
  const cap = $('#lightbox-cap');
  const prevBtn = box.querySelector('[data-prev]');
  const nextBtn = box.querySelector('[data-next]');
  const closeEls = box.querySelectorAll('[data-close]');

  const unique = items.slice(0, 4); // first logical set for captions
  const sources = unique.map(btn => {
    const i = btn.querySelector('img');
    return {
      src: i.getAttribute('data-full') || i.currentSrc || i.src,
      alt: i.alt || ''
    };
  });

  let idx = 0;
  let lastFocus = null;

  function render(){
    const {src, alt} = sources[idx];
    img.src = src; img.alt = alt;
    cap.textContent = alt;
  }
  function open(i=0){
    lastFocus = document.activeElement;
    idx = i; render();
    box.classList.remove('hidden');
    box.classList.add('open');
    nextBtn.focus();
    document.body.style.overflow = 'hidden';
  }
  function close(){
    box.classList.add('hidden');
    box.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function next(){ idx = (idx + 1) % sources.length; render(); }
  function prev(){ idx = (idx - 1 + sources.length) % sources.length; render(); }

  items.forEach((btn, i) => {
    const logicalIndex = i % sources.length;
    btn.addEventListener('click', () => open(logicalIndex));
    btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(logicalIndex); } });
  });
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);
  closeEls.forEach(el => el.addEventListener('click', close));

  document.addEventListener('keydown', e => {
    if (box.classList.contains('hidden')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  // Pause the auto-scroll when focusing items for keyboard users
  const rail = document.querySelector('.gallery-rail');
  if (rail){
    rail.addEventListener('focusin', () => rail.classList.add('paused'));
    rail.addEventListener('focusout', () => rail.classList.remove('paused'));
  }
})();


// ---------- Slideshow + Lightbox for #gallery ----------
(function(){
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const root = $('#gallery');
  if (!root) return;

  const slides = $$('.mySlides', root);
  const thumbs = $$('.demo', root);
  const captionEl = $('#caption', root);
  const prevBtn = $('.prev', root);
  const nextBtn = $('.next', root);

  // Lightbox elements
  const box = $('#lightbox');
  const img = $('#lightbox-img');
  const cap = $('#lightbox-cap');
  const lbPrev = box?.querySelector('[data-prev]');
  const lbNext = box?.querySelector('[data-next]');
  const lbCloseEls = box ? box.querySelectorAll('[data-close]') : [];

  // Build sources once
  const sources = slides.map(s => {
    const i = s.querySelector('img');
    return { src: i.currentSrc || i.src, alt: i.alt || '' };
  });

  let slideIndex = 1;
  let timer = null;
  const AUTOPLAY_MS = 4500;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function showSlides(n){
    if (n > slides.length) slideIndex = 1;
    if (n < 1) slideIndex = slides.length;

    slides.forEach(s => s.style.display = 'none');
    thumbs.forEach(t => t.classList.remove('active'));

    slides[slideIndex-1].style.display = 'block';
    thumbs[slideIndex-1].classList.add('active');
    const alt = thumbs[slideIndex-1].getAttribute('alt') || '';
    captionEl.textContent = alt;
  }
  function plusSlides(n){ showSlides(slideIndex += n); restart(); }
  function currentSlide(n){ showSlides(slideIndex = n); restart(); }

  function start(){
    if (prefersReduced) return;
    stop();
    timer = setInterval(() => { plusSlides(1); }, AUTOPLAY_MS);
  }
  function stop(){ if (timer) clearInterval(timer); timer = null; }
  function restart(){ if (!prefersReduced){ stop(); start(); } }

  // Init
  showSlides(slideIndex);
  start();

  // Events
  prevBtn?.addEventListener('click', () => plusSlides(-1));
  nextBtn?.addEventListener('click', () => plusSlides(1));
  thumbs.forEach((t, i) => {
    t.addEventListener('click', () => currentSlide(i+1));
  });

  // Pause on hover/focus for accessibility
  const container = $('.gallery-container', root);
  ['mouseenter','focusin','touchstart'].forEach(ev => container?.addEventListener(ev, stop, {passive:true}));
  ['mouseleave','focusout','touchend'].forEach(ev => container?.addEventListener(ev, start, {passive:true}));

  // --- Lightbox wiring ---
  function renderLB(){
    const s = sources[slideIndex-1];
    img.src = s.src; img.alt = s.alt; cap.textContent = s.alt;
  }
  function openLB(){
    renderLB();
    box.classList.remove('hidden');
    box.classList.add('open');
    document.body.style.overflow = 'hidden';
    lbNext?.focus();
  }
  function closeLB(){
    box.classList.add('hidden');
    box.classList.remove('open');
    document.body.style.overflow = '';
  }
  function lbNextImg(){ slideIndex = (slideIndex % sources.length) + 1; renderLB(); }
  function lbPrevImg(){ slideIndex = (slideIndex - 2 + sources.length) % sources.length + 1; renderLB(); }

  // Open on clicking the large slide image or its wrapper
  slides.forEach((s, i) => {
    s.addEventListener('click', openLB);
  });
  thumbs.forEach((t, i) => {
    t.addEventListener('dblclick', openLB);
  });

  lbNext?.addEventListener('click', lbNextImg);
  lbPrev?.addEventListener('click', lbPrevImg);
  lbCloseEls.forEach(el => el.addEventListener('click', closeLB));
  document.addEventListener('keydown', e => {
    if (box?.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLB();
    if (e.key === 'ArrowRight') lbNextImg();
    if (e.key === 'ArrowLeft') lbPrevImg();
  });
})();
