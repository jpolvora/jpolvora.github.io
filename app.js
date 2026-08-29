// Frontend Application Logic for Jone Polvora Portfolio (v3.0)

const LANGUAGE_COLORS = {
  'C#': '#178600',
  'JavaScript': '#f1e05a',
  'TypeScript': '#3178c6',
  'CSS': '#563d7c',
  'HTML': '#e34c26',
  'Python': '#3572a5',
  'Shell': '#89e051',
  'PowerShell': '#012456',
  'Java': '#b07219',
  'PHP': '#4f5d95',
  'Ruby': '#701516',
  'C++': '#f34b7d',
  'C': '#555555',
  'Go': '#00ADD8',
  'Kotlin': '#A97BFF',
  'Swift': '#F05138'
};

const DEFAULT_LANG_COLOR = '#64748b';

let state = {
  pinnedProjects: [],
  projects: [],
  filteredProjects: [],
  stats: {},
  updatedAt: null,
  activeFilter: 'all',
  searchQuery: '',
  isCollapsed: true
};

// DOM Elements
const searchInput = document.getElementById('repoSearch');
const facetsContainer = document.getElementById('facets');
const repoGrid = document.getElementById('repoGrid');
const repoEmpty = document.getElementById('repoEmpty');
const repoMoreBtn = document.getElementById('repoMore');
const heroReposCount = document.getElementById('hero-repos-count');
const languagesBox = document.getElementById('languages-box');
const languagesBar = document.getElementById('languages-bar-container');
const languagesLegend = document.getElementById('languages-legend-container');
const lastUpdatedDate = document.getElementById('last-updated-date');
const currentFocusGrid = document.getElementById('current-focus-grid');
const toTopBtn = document.getElementById('toTop');
const themeToggleBtn = document.getElementById('themeToggle');

function translate(key) {
  return typeof window.t === 'function' ? window.t(key) : key;
}

function getDateLocale() {
  return typeof window.getLocale === 'function' ? window.getLocale() : 'pt-BR';
}

function initApp() {
  setupThemeToggle();
  setupScrollToTop();
  setupEventListeners();
  window.addEventListener('i18n:ready', fetchProjectsData, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

window.addEventListener('i18n:changed', () => {
  renderStats();
  renderFacets();
  renderProjects();
  updateRepoMoreButton();
});

// ─── Theme Management ──────────────────────────────────────────
function setupThemeToggle() {
  if (!themeToggleBtn) return;
  
  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('jp-theme', next);
    } catch (e) {}
  });
}

// ─── Scroll to Top Button ──────────────────────────────────────
function setupScrollToTop() {
  if (!toTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 350) {
      toTopBtn.classList.add('is-visible');
    } else {
      toTopBtn.classList.remove('is-visible');
    }
  }, { passive: true });

  toTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ─── Event Listeners ───────────────────────────────────────────
function setupEventListeners() {
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      filterAndRenderProjects();
    });
  }

  if (repoMoreBtn) {
    repoMoreBtn.addEventListener('click', () => {
      state.isCollapsed = !state.isCollapsed;
      if (repoGrid) {
        repoGrid.classList.toggle('is-collapsed', state.isCollapsed);
      }
      updateRepoMoreButton();
    });
  }
}

function updateRepoMoreButton() {
  if (!repoMoreBtn) return;
  
  const span = repoMoreBtn.querySelector('span');
  if (!span) return;

  if (state.searchQuery || state.activeFilter !== 'all') {
    repoMoreBtn.style.display = 'none';
  } else {
    repoMoreBtn.style.display = 'inline-flex';
    const total = state.projects.length;
    if (state.isCollapsed) {
      span.textContent = `${translate('work.seeAll')} (${total})`;
    } else {
      span.textContent = translate('work.showLess');
    }
  }
}

// ─── Fetch Projects Data ───────────────────────────────────────
async function fetchProjectsData() {
  try {
    const response = await fetch('projects.json');
    if (!response.ok) {
      throw new Error(translate('projects.fetchError'));
    }
    const data = await response.json();

    state.pinnedProjects = data.pinnedProjects || [];
    state.projects = data.projects || [];
    state.filteredProjects = [...state.projects];
    state.stats = data.stats || { totalRepos: 0, totalStars: 0, languages: {} };
    state.updatedAt = data.updatedAt;

    renderStats();
    renderFacets();
    renderProjects();
    updateRepoMoreButton();
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    if (repoGrid) {
      repoGrid.innerHTML = `
        <div class="empty">
          <b style="color:var(--accent-purple)">${translate('projects.error')}</b>
          <span>${error.message}</span>
        </div>
      `;
    }
  }
}

// ─── Render Stats & Language Bar ───────────────────────────────
function renderStats() {
  const totalCount = state.stats.totalRepos || state.projects.length;
  if (heroReposCount) {
    heroReposCount.textContent = totalCount;
  }

  if (state.updatedAt && lastUpdatedDate) {
    const date = new Date(state.updatedAt);
    lastUpdatedDate.textContent = date.toLocaleDateString(getDateLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  const languages = state.stats.languages || {};
  const sortedLangs = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (sortedLangs.length > 0 && languagesBox && languagesBar && languagesLegend) {
    languagesBox.style.display = 'block';
    languagesBar.innerHTML = '';
    languagesLegend.innerHTML = '';

    sortedLangs.forEach(([lang, percent]) => {
      const color = LANGUAGE_COLORS[lang] || DEFAULT_LANG_COLOR;

      const segment = document.createElement('span');
      segment.className = 'mix-seg';
      segment.style.width = `${percent}%`;
      segment.style.backgroundColor = color;
      segment.title = `${lang}: ${percent}%`;
      languagesBar.appendChild(segment);

      const legendItem = document.createElement('li');
      legendItem.innerHTML = `
        <i class="dot" style="background-color: ${color}"></i>
        <span>${lang}</span>
        <b>${percent}%</b>
      `;
      languagesLegend.appendChild(legendItem);
    });
  }
}

// ─── Render Facets (Filters) ───────────────────────────────────
function renderFacets() {
  if (!facetsContainer) return;
  facetsContainer.innerHTML = '';

  const langCounts = {};
  state.projects.forEach(p => {
    const lang = p.primaryLanguage || 'Other';
    langCounts[lang] = (langCounts[lang] || 0) + 1;
  });

  const sortedLangs = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1]);

  // All button
  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = `facet ${state.activeFilter === 'all' ? 'is-on' : ''}`;
  allBtn.setAttribute('data-facet', 'all');
  allBtn.innerHTML = `${translate('filters.all')} <b>${state.projects.length}</b>`;
  allBtn.addEventListener('click', () => {
    state.activeFilter = 'all';
    filterAndRenderProjects();
  });
  facetsContainer.appendChild(allBtn);

  // Individual language buttons
  sortedLangs.forEach(([lang, count]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `facet ${state.activeFilter.toLowerCase() === lang.toLowerCase() ? 'is-on' : ''}`;
    btn.setAttribute('data-facet', lang.toLowerCase());

    const dotClass = `mix-${lang.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    btn.innerHTML = `
      <i class="dot ${dotClass}"></i>
      <span>${lang}</span>
      <b>${count}</b>
    `;

    btn.addEventListener('click', () => {
      state.activeFilter = lang.toLowerCase();
      filterAndRenderProjects();
    });

    facetsContainer.appendChild(btn);
  });
}

// ─── Filter & Render Repositories ──────────────────────────────
function filterAndRenderProjects() {
  const query = state.searchQuery;
  const filter = state.activeFilter.toLowerCase();

  state.filteredProjects = state.projects.filter(project => {
    const matchesFilter = filter === 'all' || 
      (project.primaryLanguage && project.primaryLanguage.toLowerCase() === filter) ||
      (filter === 'other' && !project.primaryLanguage);

    const searchableText = `${project.name} ${project.description || ''} ${(project.topics || []).join(' ')}`.toLowerCase();
    const matchesQuery = !query || searchableText.includes(query);

    return matchesFilter && matchesQuery;
  });

  renderFacets();
  renderProjects();
  updateRepoMoreButton();
}

function renderProjects() {
  if (!repoGrid) return;

  if (state.filteredProjects.length === 0) {
    repoGrid.innerHTML = '';
    if (repoEmpty) repoEmpty.hidden = false;
    return;
  }

  if (repoEmpty) repoEmpty.hidden = true;
  repoGrid.innerHTML = '';

  const isFiltering = state.searchQuery !== '' || state.activeFilter !== 'all';

  state.filteredProjects.forEach((project, index) => {
    const card = document.createElement('article');
    const isExtra = !isFiltering && index >= 12;
    card.className = `card repo ${isExtra ? 'is-extra' : ''}`;
    
    const lang = project.primaryLanguage || 'Other';
    const langClass = `mix-${lang.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const desc = project.description || translate('projects.noDesc');

    let demoLink = '';
    if (project.homepageUrl && !project.homepageUrl.includes('github.com')) {
      demoLink = `
        <a class="link-out" href="${project.homepageUrl}" target="_blank" rel="noopener noreferrer">
          Demo <svg class="ico" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M9 7h8v8"/></svg>
        </a>
      `;
    }

    let starsBadge = '';
    if (project.stargazerCount > 0) {
      starsBadge = `
        <span class="chip" title="${project.stargazerCount} stars">
          <svg class="ico" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2Z"/></svg>
          ${project.stargazerCount}
        </span>
      `;
    }

    card.innerHTML = `
      <h3>
        <a href="${project.url}" target="_blank" rel="noopener noreferrer">${project.name}</a>
      </h3>
      <p>${desc}</p>
      <div class="repo-foot">
        <span class="chip"><i class="dot ${langClass}"></i>${lang}</span>
        ${starsBadge}
        ${demoLink}
      </div>
    `;

    repoGrid.appendChild(card);
  });
}
