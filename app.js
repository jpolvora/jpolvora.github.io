// Frontend App logic for Jone Polvora Portfolio

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

const DEFAULT_LANG_COLOR = '#6b7280';

let state = {
  pinnedProjects: [],
  projects: [],
  filteredProjects: [],
  stats: {},
  updatedAt: null,
  activeFilter: 'All',
  searchQuery: ''
};

const searchInput = document.getElementById('search-input');
const filtersContainer = document.getElementById('filters-container');
const projectsGrid = document.getElementById('projects-grid');
const totalReposCount = document.getElementById('total-repos-count');
const totalStarsCount = document.getElementById('total-stars-count');
const languagesBox = document.getElementById('languages-box');
const languagesBar = document.getElementById('languages-bar-container');
const languagesLegend = document.getElementById('languages-legend-container');
const lastUpdatedDate = document.getElementById('last-updated-date');
const currentFocusSection = document.getElementById('current-focus');
const currentFocusGrid = document.getElementById('current-focus-grid');

function translate(key) {
  return typeof window.t === 'function' ? window.t(key) : key;
}

function getDateLocale() {
  return typeof window.getLocale === 'function' ? window.getLocale() : 'pt-BR';
}

function initApp() {
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
  renderFilters();
  renderPinnedProjects();
  renderProjects();
});

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
    renderFilters();
    renderPinnedProjects();
    renderProjects();
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    projectsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>${translate('projects.error')}</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

function setupEventListeners() {
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    filterAndRenderProjects();
  });
}

function renderStats() {
  totalReposCount.textContent = state.stats.totalRepos || state.projects.length;
  totalStarsCount.textContent = state.stats.totalStars || 0;

  if (state.updatedAt) {
    const date = new Date(state.updatedAt);
    lastUpdatedDate.textContent = date.toLocaleDateString(getDateLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const languages = state.stats.languages || {};
  const sortedLangs = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (sortedLangs.length > 0) {
    languagesBox.style.display = 'block';
    languagesBar.innerHTML = '';
    languagesLegend.innerHTML = '';

    sortedLangs.forEach(([lang, percent]) => {
      const color = LANGUAGE_COLORS[lang] || DEFAULT_LANG_COLOR;

      const segment = document.createElement('div');
      segment.className = 'lang-segment';
      segment.style.width = `${percent}%`;
      segment.style.backgroundColor = color;
      segment.title = `${lang}: ${percent}%`;
      languagesBar.appendChild(segment);

      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      legendItem.innerHTML = `
        <span class="legend-dot" style="background-color: ${color}"></span>
        <span>${lang}</span>
        <span class="legend-percent">${percent}%</span>
      `;
      languagesLegend.appendChild(legendItem);
    });
  }
}

function renderFilters() {
  const languagesSet = new Set();
  state.projects.forEach(p => {
    if (p.primaryLanguage) {
      languagesSet.add(p.primaryLanguage);
    }
  });

  const sortedLanguages = Array.from(languagesSet).sort();
  const allLabel = translate('filters.all');

  filtersContainer.innerHTML = '';

  const allBadge = document.createElement('button');
  allBadge.className = `filter-badge ${state.activeFilter === 'All' ? 'active' : ''}`;
  allBadge.textContent = allLabel;
  allBadge.addEventListener('click', () => setFilter('All'));
  filtersContainer.appendChild(allBadge);

  sortedLanguages.forEach(lang => {
    const badge = document.createElement('button');
    badge.className = `filter-badge ${state.activeFilter === lang ? 'active' : ''}`;
    badge.textContent = lang;
    badge.addEventListener('click', () => setFilter(lang));
    filtersContainer.appendChild(badge);
  });
}

function setFilter(filter) {
  state.activeFilter = filter;
  const allLabel = translate('filters.all');

  filtersContainer.querySelectorAll('.filter-badge').forEach(badge => {
    const isActive = filter === 'All'
      ? badge.textContent === allLabel
      : badge.textContent === filter;
    badge.classList.toggle('active', isActive);
  });

  filterAndRenderProjects();
}

function filterAndRenderProjects() {
  state.filteredProjects = state.projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(state.searchQuery) ||
                          (p.description && p.description.toLowerCase().includes(state.searchQuery));

    const matchesFilter = state.activeFilter === 'All' || p.primaryLanguage === state.activeFilter;

    return matchesSearch && matchesFilter;
  });

  renderPinnedProjects();
  renderProjects();
}

function renderProjects() {
  projectsGrid.innerHTML = '';

  if (state.filteredProjects.length === 0) {
    projectsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>${translate('projects.noResults')}</h3>
        <p>${translate('projects.noResultsHint')}</p>
      </div>
    `;
    return;
  }

  state.filteredProjects.forEach(project => {
    const card = document.createElement('article');
    card.className = 'project-card';

    const langColor = LANGUAGE_COLORS[project.primaryLanguage] || DEFAULT_LANG_COLOR;
    const descText = project.description || translate('projects.noDesc');

    const starsElement = project.stargazerCount > 0
      ? `<span class="project-star" title="Stargazers">
           <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
           ${project.stargazerCount}
         </span>`
      : '';

    let linksHtml = `
      <a href="${project.url}" class="project-link" target="_blank" rel="noopener noreferrer" title="${translate('projects.viewRepo')}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
        </svg>
      </a>
    `;

    if (project.homepageUrl) {
      linksHtml += `
        <a href="${project.homepageUrl}" class="project-link" target="_blank" rel="noopener noreferrer" title="${translate('projects.viewLive')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      `;
    }

    const languageBadgeHtml = project.primaryLanguage
      ? `<span class="project-lang">
           <span class="project-lang-dot" style="background-color: ${langColor}"></span>
           ${project.primaryLanguage}
         </span>`
      : '<span>-</span>';

    card.innerHTML = `
      <div class="project-header">
        <a href="${project.url}" target="_blank" rel="noopener noreferrer" class="project-repo-name">${project.name}</a>
        ${starsElement}
      </div>
      <p class="project-desc">${descText}</p>
      <div class="project-footer">
        ${languageBadgeHtml}
        <div class="project-links">
          ${linksHtml}
        </div>
      </div>
    `;

    projectsGrid.appendChild(card);
  });
}

function renderPinnedProjects() {
  if (!currentFocusGrid) return;
  currentFocusGrid.innerHTML = '';

  const hasPinned = state.pinnedProjects && state.pinnedProjects.length > 0;
  const isFiltering = state.activeFilter !== 'All' || state.searchQuery !== '';

  if (!hasPinned || isFiltering) {
    currentFocusSection.style.display = 'none';
    return;
  }

  currentFocusSection.style.display = 'block';

  state.pinnedProjects.forEach(project => {
    const isHighlighted = project.highlighted === true;
    const card = document.createElement('article');
    const highlightedClass = isHighlighted ? ' highlighted-card' : '';
    card.className = 'project-card featured' + highlightedClass;

    const langColor = LANGUAGE_COLORS[project.primaryLanguage] || DEFAULT_LANG_COLOR;
    const descText = project.description || translate('projects.noDesc');

    const starsElement = project.stargazerCount > 0
      ? `<span class="project-star" title="Stargazers">
           <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
           ${project.stargazerCount}
         </span>`
      : '';

    const focusBadgeHtml = isHighlighted
      ? `<span class="focus-badge highlight">
           <span class="highlight-dot"></span>
           ${translate('projects.newProject')}
         </span>`
      : `<span class="focus-badge">
           <span class="focus-dot"></span>
           ${translate('projects.activeFocus')}
         </span>`;

    let linksHtml = `
      <a href="${project.url}" class="project-link" target="_blank" rel="noopener noreferrer" title="${translate('projects.viewRepo')}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
        </svg>
      </a>
    `;

    if (project.homepageUrl) {
      linksHtml += `
        <a href="${project.homepageUrl}" class="project-link" target="_blank" rel="noopener noreferrer" title="${translate('projects.viewLive')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      `;
    }

    const languageBadgeHtml = project.primaryLanguage
      ? `<span class="project-lang">
           <span class="project-lang-dot" style="background-color: ${langColor}"></span>
           ${project.primaryLanguage}
         </span>`
      : '<span>-</span>';

    card.innerHTML = `
      <div class="project-header">
        <a href="${project.url}" target="_blank" rel="noopener noreferrer" class="project-repo-name">${project.name}</a>
        <div class="project-header-badges">
          ${focusBadgeHtml}
          ${starsElement}
        </div>
      </div>
      <p class="project-desc">${descText}</p>
      <div class="project-footer">
        ${languageBadgeHtml}
        <div class="project-links">
          ${linksHtml}
        </div>
      </div>
    `;

    currentFocusGrid.appendChild(card);
  });
}

const scrollToTopBtn = document.getElementById('scroll-to-top');

window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    scrollToTopBtn.classList.add('visible');
  } else {
    scrollToTopBtn.classList.remove('visible');
  }
});

scrollToTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});
