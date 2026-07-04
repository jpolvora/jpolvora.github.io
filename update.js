import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configurations
const USERNAME = 'jpolvora';
const PORTFOLIO_REPO = 'jpolvora.github.io';
const PROJECTS_FILE = './projects.json';

// Helper to run shell commands and return output
function run(cmd, options = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', ...options }).trim();
  } catch (error) {
    console.error(`Error running command: ${cmd}`);
    console.error(error.message);
    throw error;
  }
}

async function main() {
  console.log('🤖 Starting portfolio projects scan...');

  // 1. Fetch repositories using GitHub CLI
  let reposJson;
  try {
    const fields = 'name,description,stargazerCount,url,isFork,updatedAt,homepageUrl,primaryLanguage,repositoryTopics';
    const cmd = `gh repo list ${USERNAME} --public --limit 150 --json ${fields}`;
    console.log(`📡 Fetching repositories from GitHub: ${cmd}`);
    reposJson = run(cmd);
  } catch (err) {
    console.error('❌ Failed to fetch repositories. Make sure you are authenticated with GitHub CLI (`gh auth status`).');
    process.exit(1);
  }

  const repos = JSON.parse(reposJson);
  console.log(`🔍 Found ${repos.length} public repositories.`);

  // 2. Filter and Sort repositories
  // - Exclude the portfolio repository itself
  // - Exclude forks unless they have stars (indicates contribution/importance)
  // - Exclude repositories without descriptions (unless they have stars > 0)
  const filteredProjects = repos.filter(repo => {
    if (repo.name.toLowerCase() === PORTFOLIO_REPO.toLowerCase()) {
      return false; // Skip portfolio itself
    }
    if (repo.isFork && repo.stargazerCount === 0) {
      return false; // Skip unstarred forks
    }
    if (!repo.description && repo.stargazerCount === 0) {
      return false; // Skip empty description projects unless starred
    }
    return true;
  });

  // Sort by stars descending, then by updatedAt descending
  filteredProjects.sort((a, b) => {
    if (b.stargazerCount !== a.stargazerCount) {
      return b.stargazerCount - a.stargazerCount;
    }
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  console.log(`✨ Selected ${filteredProjects.length} projects to feature in the portfolio.`);

  // 3. Aggregate stats (Stars and Language distribution)
  let totalStars = 0;
  const languageCounts = {};

  filteredProjects.forEach(repo => {
    totalStars += repo.stargazerCount;
    if (repo.primaryLanguage) {
      const lang = repo.primaryLanguage.name || repo.primaryLanguage;
      // Normalizing format since CLI output format might vary (object with name, or string)
      const langName = typeof lang === 'object' ? lang.name : lang;
      
      if (langName) {
        languageCounts[langName] = (languageCounts[langName] || 0) + 1;
        // Inject key name for simplicity in client-side loading
        repo.primaryLanguage = langName;
      }
    } else {
      repo.primaryLanguage = null;
    }
  });

  // Calculate language percentages
  const totalLangs = Object.values(languageCounts).reduce((a, b) => a + b, 0);
  const languagesPercent = {};
  if (totalLangs > 0) {
    Object.entries(languageCounts).forEach(([lang, count]) => {
      const percentage = ((count / totalLangs) * 100).toFixed(1);
      languagesPercent[lang] = parseFloat(percentage);
    });
  }

  // Format the output structure
  const outputData = {
    updatedAt: new Date().toISOString(),
    stats: {
      totalRepos: filteredProjects.length,
      totalStars: totalStars,
      languages: languagesPercent
    },
    projects: filteredProjects.map(repo => ({
      name: repo.name,
      description: repo.description,
      stargazerCount: repo.stargazerCount,
      url: repo.url,
      homepageUrl: repo.homepageUrl,
      primaryLanguage: repo.primaryLanguage,
      topics: repo.repositoryTopics ? repo.repositoryTopics.map(t => t.name || t) : []
    }))
  };

  // 4. Save to projects.json
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(outputData, null, 2), 'utf8');
  console.log(`💾 Saved updated project data to ${PROJECTS_FILE}`);

  // 5. Git and Pull Request Automation Flow
  console.log('🔄 Checking for repository changes...');
  const gitStatus = run('git status --porcelain');
  
  if (!gitStatus.includes('projects.json')) {
    console.log('✅ No changes in projects.json. Portfolio is already up to date!');
    return;
  }

  console.log('📝 Changes detected in projects.json. Preparing Pull Request...');

  try {
    // Check if we are inside a Git repository
    run('git rev-parse --is-inside-work-tree');
  } catch (err) {
    console.log('ℹ️ Local git repository not fully configured yet. Skipping PR creation.');
    return;
  }

  const timestamp = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/:/g, '-');
  const branchName = `update-portfolio-${timestamp}`;

  try {
    // Get the current active branch name
    const currentBranch = run('git branch --show-current') || 'main';

    console.log(`🌿 Creating new branch: ${branchName}`);
    run(`git checkout -b ${branchName}`);

    console.log('➕ Staging projects.json...');
    run(`git add ${PROJECTS_FILE}`);

    console.log('💾 Committing changes...');
    run('git commit -m "auto: update portfolio projects and stats"');

    console.log(`📤 Pushing branch ${branchName} to origin...`);
    run(`git push -u origin ${branchName}`);

    console.log('📬 Creating Pull Request on GitHub...');
    const prBody = `This is an automated pull request to update the portfolio page projects data and technology stats.\n\nGenerated on: ${new Date().toLocaleString()}`;
    const prCommand = `gh pr create --title "Update Portfolio Projects (${timestamp})" --body "${prBody}" --head ${branchName} --base ${currentBranch}`;
    const prUrl = run(prCommand);
    
    console.log(`🎉 Pull Request created successfully! Link: ${prUrl}`);

    console.log(`🔄 Switching back to original branch (${currentBranch})...`);
    run(`git checkout ${currentBranch}`);
  } catch (gitErr) {
    console.error('❌ Error executing git workflow:', gitErr.message);
    console.log('⚠️ Please review your branch status and try running git operations manually.');
  }
}

main();
