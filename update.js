import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// ─────────────────────────────────────────────
//  Configuration
// ─────────────────────────────────────────────
const USERNAME       = 'jpolvora';
const PORTFOLIO_REPO = 'jpolvora.github.io';
const PROJECTS_FILE  = './projects.json';
const SITEMAP_FILE   = './sitemap.xml';
const FEATURES_FILE  = './FEATURES.md';

// CLI flag: run with  --skip-pr  to commit directly to current branch
const SKIP_PR = process.argv.includes('--skip-pr');

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function run(cmd, options = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', ...options }).trim();
  } catch (error) {
    console.error(`\n❌  Error running: ${cmd}`);
    console.error(error.message);
    throw error;
  }
}

function todayISO() {
  return new Date().toISOString().split('T')[0]; // e.g. "2026-07-05"
}

// ─────────────────────────────────────────────
//  Step 1 – Fetch repositories via GitHub CLI
// ─────────────────────────────────────────────
async function fetchRepos() {
  const fields = 'name,description,stargazerCount,url,isFork,updatedAt,homepageUrl,primaryLanguage,repositoryTopics';
  const cmd    = `gh repo list ${USERNAME} --public --limit 150 --json ${fields}`;
  console.log(`\n📡  Fetching repositories…\n    ${cmd}`);

  let reposJson;
  try {
    reposJson = run(cmd);
  } catch {
    console.error('❌  Failed to fetch repositories.  Make sure `gh auth status` is OK.');
    process.exit(1);
  }

  const repos = JSON.parse(reposJson);
  console.log(`🔍  Found ${repos.length} public repositories.`);
  return repos;
}

// ─────────────────────────────────────────────
//  Step 2 – Filter & sort
// ─────────────────────────────────────────────
function filterAndSort(repos) {
  const filtered = repos.filter(repo => {
    if (repo.name.toLowerCase() === PORTFOLIO_REPO.toLowerCase()) return false;
    if (repo.isFork && repo.stargazerCount === 0)                  return false;
    if (!repo.description && repo.stargazerCount === 0)            return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (b.stargazerCount !== a.stargazerCount) return b.stargazerCount - a.stargazerCount;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  console.log(`✨  Selected ${filtered.length} projects for the portfolio.`);
  return filtered;
}

// ─────────────────────────────────────────────
//  Step 3 – Aggregate stats
// ─────────────────────────────────────────────
function buildStats(projects) {
  let totalStars = 0;
  const languageCounts = {};

  projects.forEach(repo => {
    totalStars += repo.stargazerCount;

    if (repo.primaryLanguage) {
      const raw  = repo.primaryLanguage;
      const name = typeof raw === 'object' ? (raw.name || '') : raw;
      if (name) {
        languageCounts[name] = (languageCounts[name] || 0) + 1;
        repo.primaryLanguage = name;  // normalise to string
      }
    } else {
      repo.primaryLanguage = null;
    }
  });

  const totalLangs = Object.values(languageCounts).reduce((a, b) => a + b, 0);
  const languagesPercent = {};
  if (totalLangs > 0) {
    Object.entries(languageCounts).forEach(([lang, count]) => {
      languagesPercent[lang] = parseFloat(((count / totalLangs) * 100).toFixed(1));
    });
  }

  return { totalStars, languagesPercent };
}

// ─────────────────────────────────────────────
//  Step 4 – Write projects.json
// ─────────────────────────────────────────────
function writeProjectsJson(projects, stats) {
  const { totalStars, languagesPercent } = stats;

  const output = {
    updatedAt: new Date().toISOString(),
    stats: {
      totalRepos: projects.length,
      totalStars,
      languages: languagesPercent
    },
    projects: projects.map(repo => ({
      name:            repo.name,
      description:     repo.description,
      stargazerCount:  repo.stargazerCount,
      url:             repo.url,
      homepageUrl:     repo.homepageUrl  || null,
      primaryLanguage: repo.primaryLanguage,
      topics:          repo.repositoryTopics
                         ? repo.repositoryTopics.map(t => t.name || t)
                         : []
    }))
  };

  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log(`💾  Saved ${PROJECTS_FILE}`);
  return output;
}

// ─────────────────────────────────────────────
//  Step 5 – Update sitemap.xml <lastmod>
// ─────────────────────────────────────────────
function updateSitemap() {
  if (!fs.existsSync(SITEMAP_FILE)) {
    console.warn(`⚠️   ${SITEMAP_FILE} not found – skipping.`);
    return false;
  }

  const today   = todayISO();
  let   content = fs.readFileSync(SITEMAP_FILE, 'utf8');
  const updated = content.replace(/<lastmod>[^<]+<\/lastmod>/, `<lastmod>${today}</lastmod>`);

  if (updated === content) {
    console.log(`ℹ️   Sitemap <lastmod> is already ${today}.`);
    return false;
  }

  fs.writeFileSync(SITEMAP_FILE, updated, 'utf8');
  console.log(`🗺️   Updated sitemap <lastmod> → ${today}`);
  return true;
}

// ─────────────────────────────────────────────
//  Step 6 – Stamp FEATURES.md last-updated line
// ─────────────────────────────────────────────
function stampFeaturesDoc() {
  if (!fs.existsSync(FEATURES_FILE)) {
    console.warn(`⚠️   ${FEATURES_FILE} not found – skipping.`);
    return false;
  }

  const today   = todayISO();
  let   content = fs.readFileSync(FEATURES_FILE, 'utf8');

  // Replace or append a  "<!-- last-updated: YYYY-MM-DD -->"  marker
  const marker  = /<!--\s*last-updated:\s*[\d-]+\s*-->/;
  const stamp   = `<!-- last-updated: ${today} -->`;

  let updated;
  if (marker.test(content)) {
    updated = content.replace(marker, stamp);
  } else {
    // Append on the second line (right after the H1 title)
    const lines = content.split('\n');
    lines.splice(1, 0, stamp);
    updated = lines.join('\n');
  }

  if (updated === content) {
    console.log(`ℹ️   FEATURES.md stamp is already ${today}.`);
    return false;
  }

  fs.writeFileSync(FEATURES_FILE, updated, 'utf8');
  console.log(`📄  Stamped FEATURES.md with last-updated: ${today}`);
  return true;
}

// ─────────────────────────────────────────────
//  Step 7 – Git & PR flow
// ─────────────────────────────────────────────
async function gitFlow() {
  console.log('\n🔄  Checking git status…');

  const gitStatus = run('git status --porcelain');

  // Detect which tracked files changed
  const changedFiles = [PROJECTS_FILE, SITEMAP_FILE, FEATURES_FILE]
    .filter(f => gitStatus.includes(path.basename(f)));

  if (changedFiles.length === 0) {
    console.log('✅  Nothing changed – portfolio is already up to date!');
    return;
  }

  console.log(`📝  Changed files: ${changedFiles.join(', ')}`);

  // Verify we are inside a git repo
  try { run('git rev-parse --is-inside-work-tree'); }
  catch { console.warn('⚠️   Not inside a git repo – skipping git workflow.'); return; }

  const currentBranch = run('git branch --show-current') || 'main';
  const stagingFiles  = changedFiles.join(' ');

  if (SKIP_PR) {
    // ── Direct commit to current branch ──────────────────────────────────
    console.log(`\n📌  --skip-pr flag detected. Committing directly to '${currentBranch}'…`);
    run(`git add ${stagingFiles}`);
    run('git commit -m "auto: sync projects, sitemap and features docs"');
    run(`git push origin ${currentBranch}`);
    console.log('🚀  Pushed to origin. GitHub Actions will deploy automatically.');
  } else {
    // ── PR-based flow (default) ────────────────────────────────────────────
    const timestamp  = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
    const branchName = `auto/update-portfolio-${timestamp}`;

    console.log(`\n🌿  Creating branch: ${branchName}`);
    run(`git checkout -b ${branchName}`);

    run(`git add ${stagingFiles}`);
    run('git commit -m "auto: update portfolio projects, sitemap and features docs"');

    console.log(`📤  Pushing ${branchName}…`);
    run(`git push -u origin ${branchName}`);

    const prBody    = [
      '## Automated Portfolio Update',
      '',
      `Generated: ${new Date().toLocaleString('pt-BR')}`,
      '',
      '### Changed files',
      ...changedFiles.map(f => `- \`${path.basename(f)}\``),
      '',
      '> Review and merge to publish to GitHub Pages.'
    ].join('\n');

    const prCommand = `gh pr create --title "Portfolio auto-update (${timestamp})" --body "${prBody.replace(/"/g, "'")}" --head ${branchName} --base ${currentBranch}`;
    const prUrl     = run(prCommand);

    console.log(`🎉  Pull Request created: ${prUrl}`);

    run(`git checkout ${currentBranch}`);
    console.log(`↩️   Switched back to '${currentBranch}'.`);
  }
}

// ─────────────────────────────────────────────
//  Main
// ─────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  🤖  Jone Polvora Portfolio Auto-Updater  ');
  console.log('═══════════════════════════════════════════');

  const repos    = await fetchRepos();
  const projects = filterAndSort(repos);
  const stats    = buildStats(projects);
  writeProjectsJson(projects, stats);
  updateSitemap();
  stampFeaturesDoc();
  await gitFlow();

  console.log('\n✅  Done!\n');
}

main();
