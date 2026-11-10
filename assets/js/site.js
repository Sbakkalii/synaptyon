// Site boot script (ES module, loaded on every page).
//
// Interactive figures are progressive enhancements: each page ships readable
// HTML, and an element with data-component="name" is upgraded by
// assets/js/components/name.js once it nears the viewport. A component module
// exports `default function init(root, ctx)`.

const version = new URL(import.meta.url).searchParams.get('v') || '';
const componentsBase = new URL('./components/', import.meta.url);
const root = document.documentElement;
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const lightQuery = window.matchMedia('(prefers-color-scheme: light)');
const THEME_KEY = 'sy-theme';
const PALETTE_KEY = 'sy-palette';

/* ---------------------------------------------------------------- theme */

const themeListeners = new Set();

function storedTheme() {
  try { return localStorage.getItem(THEME_KEY); } catch { return null; }
}

// Dark is the brand default; a system light preference or the toggle
// switches to light.
function currentTheme() {
  return root.dataset.theme || (lightQuery.matches ? 'light' : 'dark');
}

function applyTheme(theme, persist) {
  root.dataset.theme = theme;
  if (persist) {
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* private mode */ }
  }
  syncThemeButtons();
  for (const cb of themeListeners) cb(theme);
}

function syncThemeButtons() {
  const dark = currentTheme() === 'dark';
  for (const btn of document.querySelectorAll('[data-theme-toggle]')) {
    btn.setAttribute('aria-pressed', String(dark));
    btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
}

document.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-theme-toggle]');
  if (btn) applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
});
lightQuery.addEventListener('change', () => {
  if (!storedTheme()) {
    delete root.dataset.theme;
    syncThemeButtons();
    for (const cb of themeListeners) cb(currentTheme());
  }
});
syncThemeButtons();

/* -------------------------------------------------------------- palette */

// The default blue-violet palette needs no attribute; "forest" (green and
// gold) is the second choice and is remembered like the theme.
const THEME_COLORS = {
  default: { dark: '#070a12', light: '#edf1f8' },
  forest: { dark: '#0e1912', light: '#f3f0dc' },
};

function currentPalette() {
  return root.dataset.palette === 'forest' ? 'forest' : 'default';
}

function syncPalette() {
  const forest = currentPalette() === 'forest';
  for (const btn of document.querySelectorAll('[data-palette-toggle]')) {
    btn.setAttribute('aria-pressed', String(forest));
    btn.setAttribute('aria-label', forest ? 'Switch to the default palette' : 'Switch to the green and gold palette');
  }
  const colors = THEME_COLORS[currentPalette()];
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.setAttribute('content', meta.media.includes('light') ? colors.light : colors.dark);
  }
}

function applyPalette(palette, persist) {
  if (palette === 'forest') root.dataset.palette = 'forest';
  else delete root.dataset.palette;
  if (persist) {
    try {
      if (palette === 'forest') localStorage.setItem(PALETTE_KEY, 'forest');
      else localStorage.removeItem(PALETTE_KEY);
    } catch { /* private mode */ }
  }
  syncPalette();
  for (const cb of themeListeners) cb(currentTheme());
}

document.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-palette-toggle]');
  if (btn) applyPalette(currentPalette() === 'forest' ? 'default' : 'forest', true);
});
syncPalette();

/* --------------------------------------------------------------- header */

const header = document.querySelector('[data-header]');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

const navToggle = document.querySelector('[data-nav-toggle]');
const navList = navToggle && document.getElementById(navToggle.getAttribute('aria-controls'));
function setNav(open) {
  if (!navToggle || !navList) return;
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  navList.classList.toggle('is-open', open);
  document.body.classList.toggle('nav-open', open);
}
if (navToggle && navList) {
  navToggle.addEventListener('click', () => setNav(navToggle.getAttribute('aria-expanded') !== 'true'));
  navList.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
      setNav(false);
      navToggle.focus();
    }
  });
  window.matchMedia('(min-width: 1021px)').addEventListener('change', (e) => { if (e.matches) setNav(false); });
}

// Escape closes an open mega menu by moving focus back to its link.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const item = document.activeElement && document.activeElement.closest('.has-mega');
  if (item) item.querySelector('.nav__link').focus();
});

/* ---------------------------------------------------------------- tabs */
// [data-tabs] holds role="tab" buttons; each controls a role="tabpanel"
// elsewhere on the page. Without JavaScript every panel is visible.

for (const list of document.querySelectorAll('[data-tabs]')) {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  const select = (i, focus) => {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (panels[j]) panels[j].toggleAttribute('data-tab-hidden', !on);
    });
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i, false));
    t.addEventListener('keydown', (e) => {
      const n = tabs.length;
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % n;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + n) % n;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = n - 1;
      if (next === null) return;
      e.preventDefault();
      select(next, true);
    });
  });
  // A deep link to a panel's tab (e.g. /#op-reconcile from the menu) opens it.
  const openFromHash = () => {
    const i = tabs.findIndex((t) => `#${t.id}` === location.hash);
    if (i >= 0) select(i, false);
  };
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
}

/* -------------------------------------------------------------- reveal */

const revealEls = [...document.querySelectorAll('[data-reveal]')];
if ('IntersectionObserver' in window && !reducedMotionQuery.matches) {
  const ro = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        ro.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  revealEls.forEach((el) => ro.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-in'));
}

/* -------------------------------------------------------- mailto form */
// No backend: the form composes an email in the visitor's own mail app.

for (const form of document.querySelectorAll('form[data-mailto]')) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = (name) => (form.elements[name] ? form.elements[name].value.trim() : '');
    const subject = `SynaptYon · ${v('topic') || 'Enquiry'}`;
    const body = [v('message'), '', `${v('name')}${v('org') ? `, ${v('org')}` : ''}`].join('\n');
    window.location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

/* ------------------------------------------------------------ live region */

let liveRegion = null;
function announce(message) {
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.className = 'visually-hidden';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('role', 'status');
    document.body.append(liveRegion);
  }
  liveRegion.textContent = '';
  requestAnimationFrame(() => { liveRegion.textContent = message; });
}

/* ----------------------------------------------------- component loader */

function readData(el, name) {
  const script = el.querySelector(`script[type="application/json"][data-for="${name}"]`)
    || el.querySelector('script[type="application/json"]');
  if (!script) return null;
  try { return JSON.parse(script.textContent); } catch (err) {
    console.error(`[site] bad JSON for ${name}`, err);
    return null;
  }
}

const ctx = {
  version,
  get reducedMotion() { return reducedMotionQuery.matches; },
  theme: currentTheme,
  onTheme(cb) { themeListeners.add(cb); return () => themeListeners.delete(cb); },
  data: readData,
  announce,
};

async function upgrade(el) {
  if (el.dataset.ready) return;
  el.dataset.ready = 'loading';
  const name = el.dataset.component;
  try {
    const mod = await import(new URL(`${name}.js${version ? `?v=${version}` : ''}`, componentsBase));
    await mod.default(el, ctx);
    el.dataset.ready = 'true';
  } catch (err) {
    el.dataset.ready = 'error';
    console.error(`[site] component "${name}" failed`, err);
  }
}

const pending = [...document.querySelectorAll('[data-component]')];
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        io.unobserve(entry.target);
        upgrade(entry.target);
      }
    }
  }, { rootMargin: '600px 0px' });
  for (const el of pending) {
    if (el.hasAttribute('data-eager')) upgrade(el);
    else io.observe(el);
  }
} else {
  pending.forEach(upgrade);
}

if (location.hash) {
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  const comp = target && (target.closest('[data-component]') || target.querySelector('[data-component]'));
  if (comp) upgrade(comp);
}

export { announce, currentTheme };
