/**
 * i18n.js — Internationalisation module for jpolvora.github.io
 *
 * Supports: pt (default), en, es
 * Detection: localStorage → navigator.languages → 'pt'
 * Usage in HTML:  <span data-i18n="key">fallback</span>
 * Usage in JS:    window.t('key')   // returns translated string
 */

const SUPPORTED_LANGS = ['pt', 'en', 'es'];
const DEFAULT_LANG    = 'pt';
const STORAGE_KEY     = 'portfolio-lang';

const LOCALE_MAP = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' };

let currentLang   = DEFAULT_LANG;
let translations  = {};

// ─── Detection ──────────────────────────────────────────────
function normalizeLang(code) {
  if (!code) return null;
  const base = code.slice(0, 2).toLowerCase();
  return SUPPORTED_LANGS.includes(base) ? base : null;
}

function detectLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGS.includes(stored)) return stored;

  const candidates = [
    ...(navigator.languages || []),
    navigator.language,
    navigator.userLanguage
  ];

  for (const raw of candidates) {
    const match = normalizeLang(raw);
    if (match) return match;
  }

  return DEFAULT_LANG;
}

// ─── Translate helper ───────────────────────────────────────
window.t = function t(key) {
  const lang = translations[currentLang];
  if (lang && lang[key]) return lang[key];

  const fallback = translations[DEFAULT_LANG];
  if (fallback && fallback[key]) return fallback[key];

  return key;
};

window.getLocale = function getLocale() {
  return LOCALE_MAP[currentLang] || LOCALE_MAP[DEFAULT_LANG];
};

// ─── SEO meta updates ───────────────────────────────────────
function updateMetaTags() {
  document.title = window.t('meta.title');

  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', window.t('meta.description'));

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', window.t('meta.title'));

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', window.t('meta.ogDescription'));

  const twTitle = document.querySelector('meta[name="twitter:title"]');
  if (twTitle) twTitle.setAttribute('content', window.t('meta.title'));

  const twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc) twDesc.setAttribute('content', window.t('meta.ogDescription'));

  const keywords = document.querySelector('meta[name="keywords"]');
  if (keywords) keywords.setAttribute('content', window.t('meta.keywords'));
}

// ─── Apply translations to DOM ──────────────────────────────
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = window.t(key);

    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else {
      el.textContent = val;
    }
  });

  document.documentElement.lang = LOCALE_MAP[currentLang] || LOCALE_MAP[DEFAULT_LANG];

  const nav = document.querySelector('.profile-nav');
  if (nav) nav.setAttribute('aria-label', window.t('nav.label'));

  const langSelector = document.getElementById('lang-selector');
  if (langSelector) langSelector.setAttribute('aria-label', window.t('lang.selector'));

  const scrollBtn = document.getElementById('scroll-to-top');
  if (scrollBtn) {
    scrollBtn.setAttribute('aria-label', window.t('btn.scrollTop'));
    scrollBtn.setAttribute('title', window.t('btn.scrollTop'));
  }

  updateMetaTags();
}

// ─── Selector UI ────────────────────────────────────────────
function initSelector() {
  const container = document.getElementById('lang-selector');
  if (!container) return;

  container.querySelectorAll('.lang-btn').forEach(btn => {
    const lang = btn.getAttribute('data-lang');
    btn.classList.toggle('active', lang === currentLang);

    btn.addEventListener('click', () => {
      if (lang === currentLang) return;
      setLanguage(lang);
    });
  });
}

function updateSelectorUI() {
  const container = document.getElementById('lang-selector');
  if (!container) return;
  container.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
  });
}

// ─── Public API ─────────────────────────────────────────────
function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  applyTranslations();
  updateSelectorUI();
  window.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang } }));
}

window.setLanguage  = setLanguage;
window.currentLang  = () => currentLang;

// ─── Init ───────────────────────────────────────────────────
async function initI18n() {
  try {
    const resp = await fetch('translations.json?v=1.7');
    if (resp.ok) translations = await resp.json();
  } catch (e) {
    console.warn('i18n: could not load translations.json', e);
  }

  currentLang = detectLanguage();
  applyTranslations();
  initSelector();
  window.dispatchEvent(new CustomEvent('i18n:ready', { detail: { lang: currentLang } }));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initI18n);
} else {
  initI18n();
}
