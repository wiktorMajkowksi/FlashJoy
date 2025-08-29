// ---------- Config ----------
const SECTIONS = [
  { id: 'hero', label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'proof', label: 'Social Proof' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

// Shorthand qs helpers
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

// ---------- Theme (system / light / dark) ----------
const theme = {
  get() { return localStorage.getItem('theme') || 'system'; },
  set(v) { localStorage.setItem('theme', v); applyTheme(); },
};
const systemPrefersDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches;
const effectiveDark = () => {
  const t = theme.get();
  return t === 'dark' || (t === 'system' && systemPrefersDark());
};

function applyTheme() {
  document.documentElement.classList.toggle('dark', effectiveDark());
  $$('[data-theme-label]').forEach(el => {
    const t = theme.get();
    el.textContent = t === 'system' ? 'System' : (t === 'dark' ? 'Dark' : 'Light');
  });
  // keep custom bg colour if set
  const saved = localStorage.getItem('custom-page-bg');
  if (saved) document.documentElement.style.setProperty('--page-bg', saved);
}

window.matchMedia('(prefers-color-scheme: dark)')?.addEventListener('change', () => {
  if (theme.get() === 'system') applyTheme();
});
applyTheme();

// ---------- Build nav (desktop + mobile) ----------
const desktopNav = $('#desktop-nav');
const mobileList = $('#mobile-menu ul');

const linkMarkup = (id,label,cls='') =>
  `<a href="#${id}" class="${cls} px-1 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500">${label}</a>`;

function buildNav(){
  desktopNav.innerHTML = '';
  SECTIONS.forEach(({id,label}) => {
    const li = document.createElement('li');
    li.innerHTML = linkMarkup(id, label, 'nav-link text-slate-700 dark:text-slate-200');
    desktopNav.appendChild(li);
  });

  // Theme button
  const themeLi = document.createElement('li');
  themeLi.innerHTML = `<button id="theme-btn" class="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500" aria-label="Toggle color theme" title="Toggle color theme">🌓 <span data-theme-label></span></button>`;
  desktopNav.appendChild(themeLi);

  // Background color picker (desktop)
  const colorLi = document.createElement('li');
  colorLi.innerHTML = `<label class="sr-only" for="bg-picker">Page background</label>
    <input id="bg-picker" type="color" class="h-8 w-8 cursor-pointer rounded-md border border-slate-300 dark:border-slate-700 p-0" title="Page background" />`;
  desktopNav.appendChild(colorLi);

  // Mobile items
  mobileList.innerHTML = '';
  SECTIONS.forEach(({id,label}) => {
    const li = document.createElement('li');
    li.setAttribute('role','none');
    li.innerHTML = `<a role="menuitem" href="#${id}" class="nav-link-mobile block rounded-md px-3 py-2 text-sm text-slate-700 dark:text-slate-200">${label}</a>`;
    mobileList.appendChild(li);
  });
  const liTheme = document.createElement('li');
  liTheme.setAttribute('role','none');
  liTheme.className = 'pt-2';
  liTheme.innerHTML = `<div class="flex items-center gap-2">
    <button id="theme-btn-mobile" class="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500">🌓 <span data-theme-label></span></button>
    <input id="bg-picker-mobile" type="color" class="h-8 w-8 cursor-pointer rounded-md border border-slate-300 dark:border-slate-700 p-0" title="Page background" />
  </div>`;
  mobileList.appendChild(liTheme);

  applyTheme();
}
buildNav();

// ---------- Mobile menu toggle ----------
const menuBtn = $('#menu-btn');
const mobileMenu = $('#mobile-menu');
menuBtn.addEventListener('click', () => {
  const open = !mobileMenu.classList.toggle('hidden');
  menuBtn.setAttribute('aria-expanded', String(open));
});
window.addEventListener('keydown', e => { if (e.key === 'Escape') mobileMenu.classList.add('hidden'); });
mobileList.addEventListener('click', e => {
  if (e.target.closest('a[href^="#"]')) mobileMenu.classList.add('hidden');
});

// Theme button clicks
function cycleTheme(){
  const order = ['system','light','dark'];
  const idx = order.indexOf(theme.get());
  theme.set(order[(idx+1)%order.length]);
}
document.addEventListener('click', e => {
  if (e.target.closest('#theme-btn') || e.target.closest('#theme-btn-mobile')) cycleTheme();
});

// ---------- Custom background: persist & sync ----------
(function setupBgPicker(){
  const KEY = 'custom-page-bg';
  const pickers = ['#bg-picker','#bg-picker-mobile'].map(sel => $(sel)).filter(Boolean);
  const saved = localStorage.getItem(KEY);
  if (saved) document.documentElement.style.setProperty('--page-bg', saved);
  if (saved?.startsWith('#')) pickers.forEach(p => p.value = saved);
  pickers.forEach(p => p.addEventListener('input', e => {
    const v = e.target.value;
    document.documentElement.style.setProperty('--page-bg', v);
    localStorage.setItem(KEY, v);
  }));
  // keep bg when theme changes (wrapped earlier in applyTheme)
})();

// ---------- Active section highlighting & progress ----------
const progress = $('#progress');
const sectionEls = SECTIONS.map(s => document.getElementById(s.id)).filter(Boolean);
const navLinks = () => $$('.nav-link');
const navLinksMobile = () => $$('.nav-link-mobile');

function updateActive(id){
  const idx = SECTIONS.findIndex(s => s.id === id);
  progress.style.width = `${Math.max(0, (idx+1)/SECTIONS.length) * 100}%`;
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
const field = id => ({ el: $(id), err: $(`${id.replace('#','')} ~ .error-msg`) }); // not used; we'll map explicitly
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
form.addEventListener('submit', ev => {
  ev.preventDefault();
  if (!validate()){ addToast("Please fix the highlighted fields.", 'error'); return; }
  addToast("Thanks! We'll be in touch within one business day.", 'success');
  form.reset();
});

// ---------- Year ----------
$('#year').textContent = new Date().getFullYear();

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
