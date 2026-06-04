# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Secrets Management |
| Knowledge Unit | Secrets Scanning and Detection |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Maturing |

---

## Overview

Secrets scanning detects hardcoded credentials, API keys, tokens, and other secrets committed to version control. Tools like `Laravel-Shield` (for Laravel-specific config), `truffleHog`, `git-secrets`, and GitHub secret scanning automatically scan repositories for high-entropy strings and known credential patterns. Secrets scanning should run pre-commit (client-side hook) and in CI/CD (server-side). The goal is to prevent accidental credential exposure in source code repositories.

---

## Core Concepts

- **Entropy Detection**: Identifies high-entropy strings (base64, hex, random-looking strings) that match credential patterns.
- **Pattern Matching**: Regex-based detection of known credential formats (AWS keys, GitHub tokens, Slack tokens, JWT, private keys).
- **Pre-Commit Scanning**: Client-side git hooks that scan staged files before commit. Blocks commits containing secrets.
- **CI/CD Scanning**: Server-side scanning in CI pipeline. Blocks PRs/branches with detected secrets.
- **`.gitignore` for Secrets**: Excluding `.env`, `*.key`, `credentials.*` from version control as the first line of defense.

---

## When To Use

- Every project — secrets in version control is a common and dangerous mistake
- Projects with multiple contributors (reduces risk of accidental credential commits)
- CI/CD pipelines — automated scanning catches secrets before they reach the remote repository
- Open-source projects (public repositories make leaked secrets immediately visible)

## When NOT To Use

- Projects with no secrets or credentials (rare — most projects have API keys)
- When proper `.gitignore` and `.env` management is already in place (scanning is still recommended as defense-in-depth)

---

## Best Practices

- **Prevent Before Commit**: Use pre-commit hooks (git-secrets, pre-commit framework) to block secrets before they enter the repository.
- **Scan in CI**: Run secrets scanning in CI/CD as a second line of defense. Configure to block the pipeline on detection.
- **Remove Secrets from History**: If a secret is committed, rotate the secret immediately. Remove it from git history using `git filter-branch` or BFG Repo-Cleaner.
- **Regular Full History Scans**: Periodically scan the entire git history for secrets that may have been committed in the past.
- **Combine with `.gitignore`**: `.gitignore` prevents `.env` and key files from being committed. Scanning catches secrets accidentally included in code.

---

## Architecture Guidelines

- Pre-commit: install `git-secrets` or use Laravel-Shield CLI as a git hook
- CI/CD: add secrets scanning step using `truffleHog`, `ggshield`, or GitHub secret scanning
- GitHub advanced security: enable secret scanning for the repository
- Periodic scan: scheduled job to scan the full git history for newly discovered secret patterns
- Alerting: send notifications to security team when secrets are detected

---

## Performance Considerations

- Secrets scanning adds 5-30 seconds to CI pipeline
- Pre-commit hooks are near-instant for staged files only
- Full history scans can take minutes — run as scheduled task, not on every commit

---

## Security Considerations

- **False Positives**: High-entropy strings may not be secrets. Investigate before blocking the pipeline.
- **False Negatives**: No scanner catches 100% of secrets. Secrets scanning is defense-in-depth, not a guarantee.
- **History Rewrite**: If a secret is committed and pushed, removing it from history requires force-push, which affects all collaborators.
- **Rotation is Mandatory**: Even if the secret is removed from history, assume it is compromised. Rotate immediately.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Scanning only in CI | No pre-commit checks | Secret committed and pushed before CI runs | Add pre-commit hooks to block before commit |
| No `.gitignore` for `.env` | Forgetting initial setup | `.env` with all secrets committed | Add `.env` to `.gitignore` immediately |
| Ignoring scanner results | "It's just a test key" | Production key leaks over time | Investigate ALL detected secrets |
| Not rotating committed secrets | Assuming removal from history is enough | Secret was exposed in repository | Rotate immediately — assume compromised |
| Scanning only on default branch | Secrets on feature branches go undetected | Secret merged via feature branch | Scan all branches in CI |

---

## Anti-Patterns

- **Relying solely on `.gitignore`**: Developers can accidentally force-add `.env` files
- **No scanning on legacy repositories**: Existing git history may contain secrets from earlier commits
- **Not training developers**: Technical controls are backup — developer awareness is the primary defense

---

## Examples

**Pre-commit hook (git-secrets):**
```bash
# Install git-secrets
# Add patterns
git secrets --add 'password\s*=\s*.+'
git secrets --add 'api[_-]?key\s*=\s*.+'
git secrets --add 'secret\s*=\s*.+'
# Scan automatically on commit
git secrets --register-aws
```

**CI scanning (GitHub Actions with truffleHog):**
```yaml
- name: Secret scanning
  uses: trufflesecurity/trufflehog@main
  with:
    path: ./
    base: ${{ github.event.repository.default_branch }}
    head: ${{ github.ref }}
```

**Laravel-specific scanning:**
```bash
# Laravel-Shield scans for weak APP_KEY, exposed .env, hardcoded credentials
php artisan shield:scan --ci
```

---

## Related Topics

- Laravel-Shield security scanning CLI
- .env management and APP_KEY
- Dependency security (composer audit)
- Enlightn static/dynamic security analysis

---

## AI Agent Notes

- Secrets scanning is the most overlooked security practice. Many projects have no scanning at all.
- Pre-commit hooks are more effective than CI-only scanning (prevents secrets from reaching the remote).
- If `Laravel-Shield` is not installed, it's a quick win for Laravel-specific secret detection.

---

## Verification

- [ ] Pre-commit secrets scanning configured (git-secrets, pre-commit framework)
- [ ] CI/CD pipeline includes secrets scanning step
- [ ] `.env` in `.gitignore`
- [ ] GitHub advanced security secret scanning enabled (if GitHub-hosted)
- [ ] Full git history scanned for existing secrets
- [ ] Process documented for handling committed secrets (rotate immediately)
- [ ] False positive handling documented
- [ ] Team training on secret management
- [ ] Periodic scheduled scans for newly discovered patterns
