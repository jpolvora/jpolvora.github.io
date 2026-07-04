# Jone Polvora - Personal Portfolio

This is the repository for my personal portfolio, built to showcase my main public projects on GitHub Pages. It features a clean, professional, and dark-themed minimalist layout designed to be highly appealing to recruiters.

## 🚀 Features

- **Recruiter-Friendly Design**: Beautiful profile summary, stats cards, and contact links.
- **Dynamic Projects Showcase**: Loaded from `projects.json`, with live search and language-based filtering.
- **Automatic Language Aggregation**: Shows a visual breakdown of languages used across all public projects.
- **Automated Updater Script**: A Node.js script to re-scan GitHub public repositories and prepare a PR with the update.

## 🛠️ How to Update the Portfolio

To scan your GitHub repositories, fetch the latest stars, details, and languages, and update the portfolio:

1. Make sure you have the [GitHub CLI (`gh`)](https://cli.github.com/) installed and authenticated.
2. Run the update script:
   ```bash
   npm run update
   ```
3. The script will:
   - Run a GitHub query to find your public repos.
   - Update `projects.json`.
   - Create a local git branch `update-portfolio-[timestamp]`.
   - Commit and push the updated projects list.
   - Create a Pull Request (PR) on GitHub.
4. Merge the PR on GitHub to publish the updates to your GitHub Pages site!

## 📦 Local Development

To run the site locally:
1. Open the directory in your browser or run a local static server:
   ```bash
   # Example using Python
   python -m http.server 8000
   
   # Or using npx
   npx serve .
   ```
2. Open `http://localhost:8000` (or the respective port) to preview the site.

## 📝 Configuration

You can customize the filtering behavior in `update.js`:
- Exclude/include forks.
- Exclude specific projects.
- Set a minimum star count.
