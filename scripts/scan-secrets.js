#!/usr/bin/env node
/**
 * scan-secrets.js
 * Pre-commit security scanner for jpolvora.github.io (public repo)
 *
 * Detects: API keys, tokens, passwords, PEM blocks, personal data
 * (phone numbers, physical addresses, private e-mails), and other
 * secrets that must never appear in a public repository.
 *
 * Usage:
 *   node scripts/scan-secrets.js              # scan whole repo
 *   node scripts/scan-secrets.js src/app.js   # scan specific file
 *   node scripts/scan-secrets.js --verbose    # show every pattern tested
 */

import fs   from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ─────────────────────────────────────────────────────────────
//  Configuration
// ─────────────────────────────────────────────────────────────

/** E-mails declared as public/safe — will NOT be flagged */
const PUBLIC_EMAILS = [
  'jpolvora@gmail.com',
];

/** Files / directories always skipped */
const ALWAYS_SKIP = [
  'node_modules',
  '.git',
  '.agents',            // internal agent config only
  'package-lock.json',
];

/** File extensions to scan (text-based) */
const SCAN_EXTENSIONS = new Set([
  '.js', '.ts', '.mjs', '.cjs',
  '.html', '.htm',
  '.css',
  '.json',
  '.md', '.txt',
  '.yml', '.yaml',
  '.env', '.env.example',
  '.sh', '.bat', '.ps1',
  '.xml',
]);

const VERBOSE = process.argv.includes('--verbose');

// Specific file(s) passed as CLI args
const cliFiles = process.argv.slice(2).filter(a => !a.startsWith('--'));

// ─────────────────────────────────────────────────────────────
//  Pattern library
//  Each entry: { id, severity, label, pattern, allowList? }
//  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO'
// ─────────────────────────────────────────────────────────────
const PATTERNS = [
  // ── Tokens / API keys ────────────────────────────────────────
  {
    id: 'GH_PAT',
    severity: 'CRITICAL',
    label: 'GitHub Personal Access Token',
    pattern: /\bgh[pousr]_[A-Za-z0-9_]{36,255}\b/,
  },
  {
    id: 'GENERIC_JWT',
    severity: 'HIGH',
    label: 'JSON Web Token (JWT)',
    // 3 base64url segments separated by dots
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  },
  {
    id: 'AWS_KEY',
    severity: 'CRITICAL',
    label: 'AWS Access Key ID',
    pattern: /(?<![A-Z0-9])(AKIA|AIPA|ASIA|AROA)[A-Z0-9]{16}(?![A-Z0-9])/,
  },
  {
    id: 'OPENAI_KEY',
    severity: 'CRITICAL',
    label: 'OpenAI API Key',
    pattern: /\bsk-[A-Za-z0-9]{32,}\b/,
  },
  {
    id: 'ANTHROPIC_KEY',
    severity: 'CRITICAL',
    label: 'Anthropic API Key',
    pattern: /\bsk-ant-[A-Za-z0-9\-_]{32,}\b/,
  },
  {
    id: 'GOOGLE_API',
    severity: 'HIGH',
    label: 'Google API Key',
    pattern: /\bAIza[0-9A-Za-z\\-_]{35}\b/,
  },
  {
    id: 'AZURE_CONNSTR',
    severity: 'HIGH',
    label: 'Azure Storage Connection String',
    pattern: /DefaultEndpointsProtocol=https?;AccountName=[^;]+;AccountKey=[^;]+/i,
  },
  {
    id: 'BEARER_TOKEN',
    severity: 'HIGH',
    label: 'Bearer / Authorization Token in code',
    // Only in assignment context, not HTML aria/class attributes
    pattern: /(?:Bearer\s+)[A-Za-z0-9\-._~+/]{20,}={0,2}/,
  },
  {
    id: 'PRIVATE_KEY_BLOCK',
    severity: 'CRITICAL',
    label: 'PEM Private Key block',
    pattern: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  },

  // ── Passwords / secrets in code ──────────────────────────────
  {
    id: 'HARDCODED_PASS',
    severity: 'HIGH',
    label: 'Hardcoded password/secret assignment',
    // matches: password="abc", passwd: 'xyz', secret=foo123
    pattern: /(?:password|passwd|secret|api_?key|client_?secret|access_?token)\s*[:=]\s*['"`][^'"`\s]{4,}['"`]/i,
  },
  {
    id: 'ENV_FILE',
    severity: 'MEDIUM',
    label: '.env file staged / committed',
    // Flagged at file-name level, not content
    fileNamePattern: /^\.env(\..+)?$/,
  },

  // ── Connection strings ────────────────────────────────────────
  {
    id: 'MONGO_URI',
    severity: 'HIGH',
    label: 'MongoDB connection string with credentials',
    pattern: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/i,
  },
  {
    id: 'SQL_CONNSTR',
    severity: 'HIGH',
    label: 'SQL Server / PostgreSQL connection string with password',
    pattern: /(?:Password|pwd)=[^;'">\s]{4,}/i,
  },

  // ── Personal data ─────────────────────────────────────────────
  {
    id: 'BR_PHONE',
    severity: 'HIGH',
    label: 'Brazilian phone number',
    // Requires DDD in parens or separated, plus hyphen/space separator in number
    // e.g. (11) 9999-9999 | +55 11 99999-9999  — NOT bare 12-digit run-ons
    pattern: /(?:\+55[\s-]?)?\(?\d{2}\)?[\s-](?:9[\s-]?)?\d{4,5}[\s-]\d{4}(?!\d)/,
    // Skip lines that are URLs (LinkedIn activity IDs look like phone numbers)
    filter: (match, line) => !/(https?:\/\/|activity-|\bposts\/)/i.test(line),
  },
  {
    id: 'INTL_PHONE',
    severity: 'MEDIUM',
    label: 'International phone number',
    // Must have separator between country code and number
    pattern: /\+(?!55)\d{1,3}[\s\-]\(?\d{1,4}\)?[\s\-]\d{3,5}[\s\-]\d{4,9}/,
    filter: (match, line) => !/https?:\/\//i.test(line),
  },
  {
    id: 'BR_CPF',
    severity: 'CRITICAL',
    label: 'CPF (Brazilian tax ID)',
    pattern: /\b\d{3}\.?\d{3}\.?\d{3}[-.]?\d{2}\b/,
  },
  {
    id: 'BR_ADDRESS',
    severity: 'MEDIUM',
    label: 'Physical address (street / avenida / CEP)',
    pattern: /(?:Rua|Av(?:enida)?|R\.|Al(?:ameda)?|Praça|Estrada|Rod(?:ovia)?)[,.\s]+[A-Za-zÀ-ú\s]+,?\s+n?[°º]?\s*\d+/i,
  },
  {
    id: 'BR_CEP',
    severity: 'MEDIUM',
    label: 'Brazilian ZIP (CEP)',
    pattern: /\b\d{5}-?\d{3}\b/,
  },
  {
    id: 'PRIVATE_EMAIL',
    severity: 'MEDIUM',
    label: 'E-mail address (non-public)',
    // Matches any email; public ones are filtered out in report
    pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
    filter: (match) => !PUBLIC_EMAILS.some(pub => match.includes(pub)),
  },
];

// ─────────────────────────────────────────────────────────────
//  File collection
// ─────────────────────────────────────────────────────────────

function shouldSkip(filePath) {
  const parts = filePath.replace(/\\/g, '/').split('/');
  return parts.some(p => ALWAYS_SKIP.includes(p));
}

function collectFiles(rootOrFile) {
  const resolved = path.resolve(rootOrFile);

  if (!fs.existsSync(resolved)) {
    console.warn(`⚠️   Path not found: ${resolved}`);
    return [];
  }

  const stat = fs.statSync(resolved);

  if (stat.isFile()) {
    return [resolved];
  }

  // Directory — walk recursively
  const result = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (shouldSkip(full)) continue;

      const s = fs.statSync(full);
      if (s.isDirectory()) {
        walk(full);
      } else if (SCAN_EXTENSIONS.has(path.extname(entry).toLowerCase()) || entry.startsWith('.env')) {
        result.push(full);
      }
    }
  }
  walk(resolved);
  return result;
}

// ─────────────────────────────────────────────────────────────
//  Scanner
// ─────────────────────────────────────────────────────────────

function scanFile(filePath) {
  const findings = [];
  const filename = path.basename(filePath);

  // File-name level checks (e.g. .env staged)
  for (const p of PATTERNS) {
    if (p.fileNamePattern && p.fileNamePattern.test(filename)) {
      findings.push({
        severity: p.severity,
        id:       p.id,
        label:    p.label,
        file:     filePath,
        line:     0,
        snippet:  `(file name match: ${filename})`,
      });
    }
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return findings; // binary / unreadable
  }

  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Skip pure comment lines in our own scanner script (avoid self-matching)
    if (/^\s*\/\//.test(line)) return;

    for (const p of PATTERNS) {
      if (!p.pattern) continue;
      const match = line.match(p.pattern);
      if (!match) continue;

      // Apply allow-list filter — pass both match string and full line
      if (p.filter && !p.filter(match[0], line)) continue;

      // Skip obvious false-positives: emails inside https:// URLs
      if (/https?:\/\//i.test(match[0]) && p.id === 'PRIVATE_EMAIL') continue;

      findings.push({
        severity: p.severity,
        id:       p.id,
        label:    p.label,
        file:     filePath,
        line:     idx + 1,
        snippet:  line.trim().slice(0, 120),
      });
    }
  });

  return findings;
}

// ─────────────────────────────────────────────────────────────
//  Reporter
// ─────────────────────────────────────────────────────────────

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, INFO: 3 };
const SEVERITY_ICON  = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', INFO: '🔵' };

function report(allFindings) {
  if (allFindings.length === 0) {
    console.log('\n✅  Security scan PASSED — no issues found.\n');
    return 0;
  }

  // Sort by severity
  allFindings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  console.log('\n' + '═'.repeat(60));
  console.log('  🔒  SECURITY SCAN FINDINGS');
  console.log('═'.repeat(60));

  let critical = 0, high = 0, medium = 0;

  for (const f of allFindings) {
    const icon = SEVERITY_ICON[f.severity] ?? '⚪';
    const rel  = path.relative(process.cwd(), f.file);
    console.log(`\n${icon}  [${f.severity}] ${f.label}  (${f.id})`);
    console.log(`   File : ${rel}${f.line ? ` — line ${f.line}` : ''}`);
    console.log(`   Hint : ${f.snippet}`);

    if (f.severity === 'CRITICAL') critical++;
    else if (f.severity === 'HIGH') high++;
    else medium++;
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`  Summary: ${critical} CRITICAL  ${high} HIGH  ${medium} MEDIUM`);
  console.log('─'.repeat(60));

  if (critical > 0 || high > 0) {
    console.log('\n🚫  COMMIT BLOCKED — Resolve CRITICAL/HIGH findings before committing.\n');
    console.log('  Remediation steps:');
    console.log('  1. Remove or replace the flagged value.');
    console.log('  2. If a token was ever committed, ROTATE it immediately.');
    console.log('  3. Check git history: git log --all --full-history -- <file>');
    console.log('  4. Purge history if needed: npx bfg --delete-files <file>');
    console.log('  5. Re-run: npm run security-check\n');
    return 1;
  }

  console.log('\n⚠️   MEDIUM findings above — review before committing (non-blocking).\n');
  return 0;
}

// ─────────────────────────────────────────────────────────────
//  Main
// ─────────────────────────────────────────────────────────────

function main() {
  const roots  = cliFiles.length > 0 ? cliFiles : ['.'];
  const files  = roots.flatMap(collectFiles);

  console.log(`\n🔍  Scanning ${files.length} file(s) for secrets and personal data…`);
  if (VERBOSE) {
    console.log('    Patterns active:', PATTERNS.length);
  }

  const allFindings = [];

  for (const file of files) {
    if (VERBOSE) process.stdout.write(`  › ${path.relative(process.cwd(), file)}\n`);
    const findings = scanFile(file);
    allFindings.push(...findings);
  }

  process.exit(report(allFindings));
}

main();
