---
name: bio-review
description: >
  Reviews the portfolio site's bio, title, and meta descriptions for SEO
  quality, keyword coverage, and persuasiveness for client acquisition.
  Produces a structured report with scored findings and concrete rewrite
  suggestions. Should be run periodically and whenever the bio changes.
---

# Bio & Content Review Skill

## Purpose

This skill analyzes the portfolio's **profile bio, page title, meta description,
keywords, JSON-LD Person schema, and section headings** through the lens of:

1. **Google SEO** — keyword coverage, semantic richness, structured data quality
2. **Client Acquisition** — persuasive language, value proposition clarity, call-to-action presence
3. **Recruiter / Headhunter appeal** — seniority signals, specific tech stacks, measurable achievements
4. **Copywriting quality** — clarity, active voice, conciseness, first-impression impact

---

## When to Run

- After any edit to the bio, title, or professional headline in `index.html`
- After updating the JSON-LD `Person` schema
- On a **monthly basis** as a routine content audit
- When targeting a new client vertical (AI, Product Engineering, etc.)

```bash
npm run review-bio
```

---

## How the Script Works

`scripts/review-bio.js` performs the following steps:

1. **Parses `index.html`** — extracts: `<title>`, `<meta description>`,
   `<meta keywords>`, JSON-LD `description` and `knowsAbout`, `<h1>`,
   `.profile-title`, `.profile-bio` text.
2. **Runs scored checks** across 5 dimensions (see below).
3. **Prints a colour-coded report** with scores, findings, and specific
   rewrite suggestions for each dimension.
4. **Exits 0** if all scores are ≥ 70/100; **exits 1** otherwise so CI can
   catch regressions.

---

## Scoring Dimensions

### 1. Keyword Coverage (0–25 pts)
Checks that high-value target keywords appear in **title + meta + bio + JSON-LD**:

| Tier | Keywords |
|------|----------|
| Primary | `AI`, `Agentic Engineering`, `Agentic Orchestration`, `Product Engineering` |
| Secondary | `Harness`, `CI/CD`, `GitOps`, `Software Architecture`, `Backend` |
| Long-tail | `20 anos de experiência`, `15 anos em desenvolvimento`, `soluções customizadas` |

### 2. Title & Meta Quality (0–20 pts)
- Title length: 50–60 characters (Google truncates at ~60)
- Meta description length: 120–155 characters
- Contains a clear differentiator and primary keyword in first 60 chars
- No keyword stuffing (keyword density < 5% per term)

### 3. Value Proposition Clarity (0–20 pts)
- Bio opens with WHO you are + WHAT you do + WHO you serve
- Contains at least one measurable achievement or scale indicator
- Mentions the specific outcome/benefit for clients (not just tech names)
- Avoids generic filler: "passionate about", "hardworking", "team player"

### 4. Persuasiveness & Client Acquisition (0–20 pts)
- Has at least one clear call-to-action (CTA) in the bio or profile section
- Uses authority signals (years of experience, specific client/project scale)
- Addresses a pain point the target client has
- Differentiates from generic "software developer" profiles

### 5. Structured Data Richness (0–15 pts)
- JSON-LD `jobTitle` matches the visible `<h1>` / `.profile-title`
- `knowsAbout` array covers all primary + secondary keywords
- `sameAs` links are all reachable and accurate
- `description` in JSON-LD is distinct from (not a copy of) the `<meta>` description

---

## Improvement Workflow

After running the review:

1. Read the printed suggestions carefully — they are context-aware rewrites.
2. Edit `index.html` to apply the improvements.
3. Sync all changed metadata locations per the AGENTS.md Rule #4 (SEO sync).
4. Re-run `npm run review-bio` until overall score ≥ 85/100.
5. Run `npm run security-check` before committing.
6. Update `FEATURES.md` if the bio focus changes significantly.

---

## Manual Review Checklist (beyond the script)

When doing a full content audit, also manually verify:

- [ ] Does the bio answer **"Why should I hire/contact THIS person"** in under 30 seconds?
- [ ] Is the professional title immediately understandable to a non-technical recruiter?
- [ ] Do the GitHub project descriptions reinforce the bio's claimed specializations?
- [ ] Does the blog / article section showcase thought leadership in the target areas?
- [ ] Are social proof signals visible (stars, articles, certifications)?
- [ ] Is there a direct contact CTA visible above the fold?

---

## References

- [Google: How to write good title tags](https://developers.google.com/search/docs/appearance/title-link)
- [Google: Create good meta descriptions](https://developers.google.com/search/docs/appearance/snippet)
- [Schema.org Person type](https://schema.org/Person)
- [Copywriting for developer portfolios — value proposition framework](https://www.smashingmagazine.com/2021/04/portfolio-tips-web-developers/)
