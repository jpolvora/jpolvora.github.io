---
name: security-review
description: >
  Runs a pre-commit security scan on the portfolio repository.
  Detects exposed API keys, tokens, secrets, passwords, and
  personal data (phone numbers, addresses, private emails) that
  must never be committed to a public repository.
  MANDATORY before every git commit and push.
---

# Security Review Skill

## When to Trigger

This skill **MUST** be executed in the following situations:

1. **Before every `git commit`** — run `npm run security-check` and confirm the output is clean.
2. **After creating or modifying any feature** that touches `index.html`, `app.js`, `style.css`, `update.js`, or any config/data file.
3. **Before opening or merging a Pull Request**.
4. **After running `npm run update` or `npm run sync`** — the generated `projects.json` may pull data from GitHub that contains sensitive content.

If the scan reports any HIGH or CRITICAL findings, **abort the commit** and remediate before proceeding.

---

## How to Run

```bash
# Quickest way — shows only findings (non-zero exit = issues found)
npm run security-check

# Verbose mode — shows every pattern checked
npm run security-check -- --verbose

# Scan a specific file
node scripts/scan-secrets.js path/to/file.js
```

---

## What it Scans

| Category | Examples detected |
|---|---|
| **Tokens & API keys** | GitHub PATs, Bearer tokens, JWT, AWS keys, OpenAI keys |
| **Passwords** | `password=`, `passwd=`, `secret=` in code |
| **Private keys** | PEM blocks (`-----BEGIN ...-----`) |
| **Connection strings** | MongoDB URIs, SQL connection strings with credentials |
| **Brazilian phone numbers** | `(11) 99999-9999`, `+55 11 99999-9999` |
| **Physical addresses** | Street, Avenue, CEP/ZIP patterns |
| **Private e-mails** | Any email other than the declared public contact |
| **Environment vars leaked** | `.env` files accidentally staged |
| **Generic secrets** | `api_key`, `client_secret`, `private_token` in JSON/YAML |

---

## Remediation Checklist

If findings are reported:

- [ ] Remove the secret/data from all files (use `git reset HEAD <file>` if already staged).
- [ ] If a token was ever committed (even once), **rotate it immediately** on the provider dashboard.
- [ ] Run `git log --all --full-history -- <file>` to check if secret was in history.
- [ ] Use `git filter-repo` or BFG Repo Cleaner to purge history if needed.
- [ ] Re-run `npm run security-check` until the output is clean.

---

## References

- [GitHub docs – Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [OWASP Secret Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
