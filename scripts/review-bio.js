#!/usr/bin/env node
/**
 * review-bio.js
 * Portfolio bio & SEO content reviewer for jpolvora.github.io
 *
 * Scores the portfolio bio, title, meta tags, and JSON-LD Person schema
 * across 5 dimensions and prints a structured improvement report.
 *
 * Usage:
 *   node scripts/review-bio.js              # analyse index.html
 *   node scripts/review-bio.js --json       # output raw JSON scores
 *   node scripts/review-bio.js --suggest    # include AI-style rewrite suggestions
 */

import fs   from 'fs';
import path from 'path';

const HTML_FILE   = path.resolve('./index.html');
const VERBOSE     = process.argv.includes('--verbose');
const JSON_OUTPUT = process.argv.includes('--json');
const SUGGEST     = process.argv.includes('--suggest') || true; // always on

// ─────────────────────────────────────────────────────────────
//  Target keyword taxonomy
// ─────────────────────────────────────────────────────────────
const KEYWORDS = {
  primary: [
    'AI', 'agentic engineering', 'agentic orchestration',
    'product engineering', 'inteligência artificial',
  ],
  secondary: [
    'harness', 'ci/cd', 'gitops', 'software architecture',
    'backend', 'microsoft azure', 'clean architecture',
    '.net', 'c#',
  ],
  longTail: [
    '20 anos', '15 anos', 'soluções customizadas',
    'custom solutions', 'arquitetura de software', 'consultor',
  ],
};

// Filler phrases that hurt credibility
const FILLER_PHRASES = [
  'apaixonado por', 'passionate about', 'hardworking', 'team player',
  'proativo', 'work hard', 'dedicated to', 'motivated',
];

// Generic job title words (penalised if used without differentiators)
const GENERIC_TITLES = ['developer', 'desenvolvedor', 'programmer', 'programador', 'engineer'];

// ─────────────────────────────────────────────────────────────
//  HTML parser helpers (no external deps)
// ─────────────────────────────────────────────────────────────
function extractTag(html, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m  = html.match(re);
  return m ? m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
}

function extractAttr(html, tag, attr) {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, 'gi');
  const results = [];
  let m;
  while ((m = re.exec(html)) !== null) results.push(m[1]);
  return results;
}

function extractMeta(html, name) {
  const re = new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i');
  const m  = html.match(re);
  if (m) return m[1];
  // Try reversed attr order
  const re2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i');
  const m2   = html.match(re2);
  return m2 ? m2[1] : '';
}

function extractOG(html, prop) {
  const re = new RegExp(`<meta[^>]*property=["']og:${prop}["'][^>]*content=["']([^"']*)["']`, 'i');
  const m  = html.match(re);
  return m ? m[1] : '';
}

function extractJsonLd(html) {
  const re = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i;
  const m  = html.match(re);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

function extractClass(html, className) {
  // Extract text content of first element with given class
  const re = new RegExp(`class="[^"]*${className}[^"]*"[^>]*>([\\s\\S]*?)<\\/`, 'i');
  const m  = html.match(re);
  return m ? m[1].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() : '';
}

// ─────────────────────────────────────────────────────────────
//  Normalisation
// ─────────────────────────────────────────────────────────────
function lower(s) { return (s || '').toLowerCase(); }

function countKeywords(text, words) {
  const t = lower(text);
  return words.filter(w => t.includes(lower(w)));
}

// ─────────────────────────────────────────────────────────────
//  Scorer
// ─────────────────────────────────────────────────────────────
function score(max, pct) { return Math.round(max * Math.min(pct, 1)); }

// ─────────────────────────────────────────────────────────────
//  Dimension 1 — Keyword Coverage (max 25)
// ─────────────────────────────────────────────────────────────
function checkKeywords(data) {
  const fullText = [
    data.title, data.metaDesc, data.keywords, data.bio,
    data.jsonLdDesc, (data.jsonLdKnows || []).join(' '),
  ].join(' ');

  const foundPrimary   = countKeywords(fullText, KEYWORDS.primary);
  const foundSecondary = countKeywords(fullText, KEYWORDS.secondary);
  const foundLongTail  = countKeywords(fullText, KEYWORDS.longTail);

  const pct = (
    (foundPrimary.length   / KEYWORDS.primary.length)   * 0.50 +
    (foundSecondary.length / KEYWORDS.secondary.length) * 0.30 +
    (foundLongTail.length  / KEYWORDS.longTail.length)  * 0.20
  );

  const missing = {
    primary:   KEYWORDS.primary.filter(k   => !foundPrimary.includes(k)),
    secondary: KEYWORDS.secondary.filter(k => !foundSecondary.includes(k)),
    longTail:  KEYWORDS.longTail.filter(k  => !foundLongTail.includes(k)),
  };

  return {
    dimension: 'Keyword Coverage',
    max: 25,
    earned: score(25, pct),
    findings: [
      `Primary found (${foundPrimary.length}/${KEYWORDS.primary.length}): ${foundPrimary.join(', ') || 'none'}`,
      `Secondary found (${foundSecondary.length}/${KEYWORDS.secondary.length}): ${foundSecondary.join(', ') || 'none'}`,
      `Long-tail found (${foundLongTail.length}/${KEYWORDS.longTail.length}): ${foundLongTail.join(', ') || 'none'}`,
    ],
    suggestions: [
      missing.primary.length   ? `🔑 Add missing PRIMARY keywords to bio+title+meta: "${missing.primary.join('", "')}"` : null,
      missing.secondary.length ? `🔑 Add to JSON-LD knowsAbout: "${missing.secondary.join('", "')}"` : null,
      missing.longTail.length  ? `🔑 Weave long-tail phrases into bio: "${missing.longTail.join('", "')}"` : null,
    ].filter(Boolean),
  };
}

// ─────────────────────────────────────────────────────────────
//  Dimension 2 — Title & Meta Quality (max 20)
// ─────────────────────────────────────────────────────────────
function checkTitleMeta(data) {
  const findings = [];
  const suggestions = [];
  let pts = 20;

  // Title length (50–60 chars ideal)
  const titleLen = data.title.length;
  if (titleLen < 30) {
    findings.push(`Title too short (${titleLen} chars). Aim for 50–60.`);
    suggestions.push(`Expand title: "${data.title}" → e.g. "Jone Polvora | AI Solutions Architect & Agentic Engineer"`);
    pts -= 6;
  } else if (titleLen > 65) {
    findings.push(`Title too long (${titleLen} chars — Google truncates at ~60).`);
    suggestions.push(`Shorten title to ≤60 chars. Current: "${data.title}"`);
    pts -= 3;
  } else {
    findings.push(`Title length OK (${titleLen} chars ✓)`);
  }

  // Meta description length (120–155 chars)
  const descLen = data.metaDesc.length;
  if (descLen < 80) {
    findings.push(`Meta description too short (${descLen} chars). Aim for 120–155.`);
    suggestions.push('Expand meta description with a value proposition and call-to-action, e.g.: "Especialista em IA e Agentic Engineering com 20+ anos em TI. Projeta soluções cognitivas, automatizadas e de alta performance. Confira projetos e artigos."');
    pts -= 5;
  } else if (descLen > 160) {
    findings.push(`Meta description too long (${descLen} chars — Google truncates at ~155).`);
    suggestions.push(`Trim meta description to 120–155 chars.`);
    pts -= 2;
  } else {
    findings.push(`Meta description length OK (${descLen} chars ✓)`);
  }

  // Primary keyword in first 60 chars of title
  const titleStart = lower(data.title.slice(0, 60));
  if (!titleStart.includes('ai') && !titleStart.includes('agentic') && !titleStart.includes('product')) {
    findings.push('Primary keyword missing in first 60 chars of title.');
    suggestions.push('Put primary keyword near the start: "AI & Agentic Engineer | Jone Polvora"');
    pts -= 4;
  }

  return {
    dimension: 'Title & Meta Quality',
    max: 20,
    earned: Math.max(0, pts),
    findings,
    suggestions,
  };
}

// ─────────────────────────────────────────────────────────────
//  Dimension 3 — Value Proposition Clarity (max 20)
// ─────────────────────────────────────────────────────────────
function checkValueProp(data) {
  const bio = lower(data.bio);
  const findings = [];
  const suggestions = [];
  let pts = 20;

  // Check measurable achievement
  const hasNumbers = /\d{1,2}\+?\s*anos|mais de \d|over \d|\d+ year/.test(bio);
  if (!hasNumbers) {
    findings.push('No measurable achievement or scale (years, number of projects, users, etc.).');
    suggestions.push('Add specific scale: e.g. "mais de 20 anos em TI", "15+ anos em desenvolvimento", or "delivered 50+ production systems".');
    pts -= 6;
  } else {
    findings.push('Measurable achievement present ✓');
  }

  // Filler phrases
  const fillers = FILLER_PHRASES.filter(f => bio.includes(lower(f)));
  if (fillers.length > 0) {
    findings.push(`Credibility-draining filler phrases found: "${fillers.join('", "')}"`);
    suggestions.push('Remove or replace filler words with specific outcomes. Instead of "apaixonado por", say "especialista comprovado em" or "entrego [resultado]".');
    pts -= 4;
  }

  // Client outcome / benefit mentioned
  const hasOutcome = /result|outcome|entrego|solução|perfor|client|negóci|negoci|receita|impacto|impact/.test(bio);
  if (!hasOutcome) {
    findings.push('No client outcome or business benefit mentioned in bio.');
    suggestions.push('Add a client-benefit statement: e.g. "ajudo empresas a escalar produtos com automação cognitiva e arquiteturas de IA prontas para produção".');
    pts -= 5;
  } else {
    findings.push('Client benefit/outcome language present ✓');
  }

  // Bio opening — does it start strong?
  const bioStart = data.bio.trim().split(/[.!?]/)[0];
  if (bioStart.length > 120) {
    findings.push('Bio opening sentence is too long (>120 chars). First impression is diluted.');
    suggestions.push(`Rewrite opening to a punchy 1-liner: e.g. "Especialista em IA e Agentic Engineering com 20+ anos em TI e 15+ em software customizado."`);
    pts -= 5;
  }

  return {
    dimension: 'Value Proposition Clarity',
    max: 20,
    earned: Math.max(0, pts),
    findings,
    suggestions,
  };
}

// ─────────────────────────────────────────────────────────────
//  Dimension 4 — Persuasiveness & Client Acquisition (max 20)
// ─────────────────────────────────────────────────────────────
function checkPersuasiveness(data) {
  const fullText = lower([data.bio, data.title, data.profileTitle].join(' '));
  const findings = [];
  const suggestions = [];
  let pts = 20;

  // CTA presence
  const hasCTA = /contato|contact|contratar|hire|disponível|available|me chame|fale|whatsapp|linkedin/.test(fullText);
  if (!hasCTA) {
    findings.push('No call-to-action (CTA) found in bio or headline.');
    suggestions.push('Add CTA near the bio: e.g. "Disponível para projetos e consultoria — entre em contato." or a "Hire me" button.');
    pts -= 6;
  } else {
    findings.push('CTA language present ✓');
  }

  // Authority signal
  const hasAuthority = /senior|principal|lead|arquitet|architect|consult|especialist|expert/.test(fullText);
  if (!hasAuthority) {
    findings.push('No seniority/authority signal in headline or bio.');
    suggestions.push('Add authority signal to title: e.g. "Senior", "Principal", "Lead", "Arquiteto".');
    pts -= 5;
  } else {
    findings.push('Authority signal present ✓');
  }

  // Generic title penalty
  const isGeneric = GENERIC_TITLES.some(t => {
    const idx = fullText.indexOf(t);
    if (idx === -1) return false;
    // Penalise only if no qualifier before/after (Senior/AI/etc.)
    const context = fullText.slice(Math.max(0, idx - 15), idx + 20);
    return !/(senior|ai|agentic|principal|lead|arquitet|architect)/.test(context);
  });
  if (isGeneric) {
    findings.push('Title/bio falls back to a generic "developer/engineer" label without a differentiator.');
    suggestions.push('Replace generic labels with a differentiated title: "AI Solutions Architect" or "Agentic & Product Engineer" instead of plain "Software Developer".');
    pts -= 4;
  }

  // Pain-point language
  const hasPainPoint = /escala|scale|complex|legad|legacy|automat|cognitiv|orquestr|orchestrat/.test(fullText);
  if (!hasPainPoint) {
    findings.push('Bio does not address a client pain point or transformation.');
    suggestions.push('Describe the transformation: e.g. "transformo sistemas legados em plataformas cognitivas e automatizadas de alto desempenho".');
    pts -= 5;
  } else {
    findings.push('Pain-point / transformation language present ✓');
  }

  return {
    dimension: 'Persuasiveness & Client Acquisition',
    max: 20,
    earned: Math.max(0, pts),
    findings,
    suggestions,
  };
}

// ─────────────────────────────────────────────────────────────
//  Dimension 5 — Structured Data Richness (max 15)
// ─────────────────────────────────────────────────────────────
function checkStructuredData(data) {
  const findings = [];
  const suggestions = [];
  let pts = 15;

  if (!data.jsonLd) {
    findings.push('No JSON-LD found in page — critical for Google rich results!');
    suggestions.push('Add a <script type="application/ld+json"> Person schema to <head>.');
    return { dimension: 'Structured Data Richness', max: 15, earned: 0, findings, suggestions };
  }

  // jobTitle alignment
  const jdTitle = lower(data.jsonLd.jobTitle || '');
  const h1Lower = lower(data.h1 || '');
  const ptLower = lower(data.profileTitle || '');
  if (!jdTitle || (!h1Lower.includes(jdTitle.split(' ')[0]) && !ptLower.includes(jdTitle.split(' ')[0]))) {
    findings.push(`JSON-LD jobTitle "${data.jsonLd.jobTitle}" doesn't align with visible title/h1.`);
    suggestions.push('Keep JSON-LD jobTitle consistent with the visible .profile-title and <h1> text.');
    pts -= 4;
  } else {
    findings.push('JSON-LD jobTitle aligns with visible title ✓');
  }

  // knowsAbout coverage
  const knows = (data.jsonLd.knowsAbout || []).map(lower);
  const allKw  = [...KEYWORDS.primary, ...KEYWORDS.secondary];
  const missing = allKw.filter(k => !knows.some(kn => kn.includes(lower(k))));
  if (missing.length > 3) {
    findings.push(`knowsAbout array missing ${missing.length} target keywords.`);
    suggestions.push(`Add to knowsAbout: "${missing.slice(0, 6).join('", "')}"`);
    pts -= 4;
  } else {
    findings.push(`knowsAbout reasonably complete (${missing.length} gaps) ✓`);
  }

  // sameAs links
  const sameAs = data.jsonLd.sameAs || [];
  if (sameAs.length < 2) {
    findings.push('sameAs has fewer than 2 social links — add LinkedIn, GitHub, blog.');
    suggestions.push('Add all public profile URLs to sameAs array: GitHub, LinkedIn, WordPress blog.');
    pts -= 4;
  } else {
    findings.push(`sameAs has ${sameAs.length} link(s) ✓`);
  }

  // description distinct from meta
  const jdDesc   = lower(data.jsonLd.description || '');
  const metaDesc = lower(data.metaDesc || '');
  if (jdDesc && metaDesc && jdDesc === metaDesc) {
    findings.push('JSON-LD description is identical to <meta description> — use distinct, richer copy.');
    suggestions.push('Write a longer, more detailed JSON-LD description (2–3 sentences) vs. the shorter meta description (1 sentence max 155 chars).');
    pts -= 3;
  } else {
    findings.push('JSON-LD description distinct from meta description ✓');
  }

  return {
    dimension: 'Structured Data Richness',
    max: 15,
    earned: Math.max(0, pts),
    findings,
    suggestions,
  };
}

// ─────────────────────────────────────────────────────────────
//  Rewrite Suggestions (bonus section)
// ─────────────────────────────────────────────────────────────
function printRewriteSuggestions(data) {
  console.log('\n' + '═'.repeat(62));
  console.log('  ✍️   SUGGESTED REWRITES');
  console.log('═'.repeat(62));

  console.log(`
📌 Current title:
   "${data.title}"

💡 Suggested alternatives (pick one):
   A) "Jone Polvora | AI & Agentic Engineer · 20+ Anos em TI"
      (60 chars, primary keyword front-loaded, authority + years)

   B) "Jone Polvora — Arquiteto de IA, Agentic & Product Engineering"
      (Portuguese-first for BR market, differentiators listed)

   C) "Jone Polvora | AI Solutions Architect & Agentic Orchestration"
      (English-first for international market)

─────────────────────────────────────────────────────────────────
📌 Current meta description:
   "${data.metaDesc}"

💡 Suggested (130–150 chars):
   "Arquiteto de IA e Agentic Engineering com 20+ anos em TI e 15+ em
   software customizado. Projetos cognitivos, escaláveis e prontos para
   produção. Confira e entre em contato."

─────────────────────────────────────────────────────────────────
📌 Current bio:
   "${data.bio.slice(0, 300)}${data.bio.length > 300 ? '…' : ''}"

💡 Suggested bio (3-sentence formula: WHO + WHAT + WHY HIRE ME):
   "Especialista em tecnologia com 20+ anos em TI e 15+ em
   Desenvolvimento de Software customizado. Projeto e entrego sistemas
   cognitivos e automatizados usando IA, Agentic Engineering &
   Orchestration, Harness (CI/CD/GitOps) e Product Engineering —
   do conceito ao deploy em produção. Disponível para consultoria e
   projetos: veja meu portfólio e entre em contato."
`);
}

// ─────────────────────────────────────────────────────────────
//  Report printer
// ─────────────────────────────────────────────────────────────
const SEV = { 80: '🟢', 60: '🟡', 0: '🔴' };

function icon(pct) {
  if (pct >= 80) return '🟢';
  if (pct >= 60) return '🟡';
  return '🔴';
}

function printReport(dimensions, data) {
  const total    = dimensions.reduce((s, d) => s + d.earned, 0);
  const maxTotal = dimensions.reduce((s, d) => s + d.max, 0);
  const overall  = Math.round((total / maxTotal) * 100);

  if (JSON_OUTPUT) {
    console.log(JSON.stringify({ overall, total, maxTotal, dimensions }, null, 2));
    return overall >= 70 ? 0 : 1;
  }

  console.log('\n' + '═'.repeat(62));
  console.log('  📊  BIO & SEO CONTENT REVIEW REPORT');
  console.log('═'.repeat(62));
  console.log(`  Overall Score: ${overall}/100  ${icon(overall)}\n`);

  for (const d of dimensions) {
    const pct = Math.round((d.earned / d.max) * 100);
    console.log(`${icon(pct)}  ${d.dimension.padEnd(32)} ${d.earned}/${d.max}  (${pct}%)`);
    for (const f of d.findings) console.log(`     • ${f}`);
    if (d.suggestions.length) {
      for (const s of d.suggestions) console.log(`     💡 ${s}`);
    }
    console.log();
  }

  console.log('─'.repeat(62));
  console.log(`  Total: ${total}/${maxTotal} — Recommendation: ${
    overall >= 85 ? '✅ Bio is strong. Schedule next review in 30 days.' :
    overall >= 70 ? '⚠️  Good baseline — apply suggestions to reach 85+.' :
                   '🚫 Significant improvements needed before next launch.'
  }`);
  console.log('─'.repeat(62));

  if (SUGGEST) printRewriteSuggestions(data);

  return overall >= 70 ? 0 : 1;
}

// ─────────────────────────────────────────────────────────────
//  Main
// ─────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(HTML_FILE)) {
    console.error(`❌  ${HTML_FILE} not found.`);
    process.exit(1);
  }

  const html = fs.readFileSync(HTML_FILE, 'utf8');

  // Extract all content fields
  const data = {
    title:        html.match(/<title>([^<]*)<\/title>/i)?.[1]?.replace(/&amp;/g, '&').trim() ?? '',
    metaDesc:     extractMeta(html, 'description'),
    keywords:     extractMeta(html, 'keywords'),
    ogTitle:      extractOG(html, 'title'),
    ogDesc:       extractOG(html, 'description'),
    h1:           extractTag(html, 'h1'),
    profileTitle: extractClass(html, 'profile-title'),
    bio:          extractClass(html, 'profile-bio'),
    jsonLd:       extractJsonLd(html),
    jsonLdDesc:   '',
    jsonLdKnows:  [],
  };

  if (data.jsonLd) {
    data.jsonLdDesc  = data.jsonLd.description || '';
    data.jsonLdKnows = data.jsonLd.knowsAbout  || [];
  }

  if (VERBOSE) {
    console.log('\n📋 Extracted fields:');
    console.log('  title:', data.title);
    console.log('  metaDesc:', data.metaDesc);
    console.log('  h1:', data.h1);
    console.log('  profileTitle:', data.profileTitle);
    console.log('  bio (first 150):', data.bio.slice(0, 150));
    console.log('  jsonLd jobTitle:', data.jsonLd?.jobTitle);
    console.log('  knowsAbout:', data.jsonLdKnows);
  }

  const dimensions = [
    checkKeywords(data),
    checkTitleMeta(data),
    checkValueProp(data),
    checkPersuasiveness(data),
    checkStructuredData(data),
  ];

  process.exit(printReport(dimensions, data));
}

main();
