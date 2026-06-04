# Anti-Patterns: Secrets Scanning and Detection

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Secrets Management |
| Knowledge Unit | Secrets Scanning and Detection |
| Audience | All Developers, DevOps, Security Engineers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-SS-01 | CI-Only Scanning With No Pre-Commit Hooks | High | High | Low |
| AP-SS-02 | Hardcoded Secrets in Source Code | Critical | Medium | Medium |
| AP-SS-03 | Not Rotating Committed Secrets | Critical | High | Medium |
| AP-SS-04 | No False Positive Management (Scanner Fatigue) | Medium | High | Low |
| AP-SS-05 | Scanning Only Default Source Code Files | High | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **No Full History Scan on Legacy Repositories**: Existing git history may contain secrets from commits predating scanning
- **Relying Solely on .gitignore**: Developers can force-add `.env` files; scanning catches what `.gitignore` misses
- **No Developer Training on Secrets Hygiene**: Technical controls without education miss human error (commit messages, screenshots)

---

## 1. CI-Only Scanning With No Pre-Commit Hooks

### Category
Security · Process

### Description
Running secrets scanning only in CI/CD pipeline without pre-commit hooks, allowing secrets to be committed to local Git history and pushed to the remote before CI has a chance to detect them.

### Why It Happens
CI scanning is easier to set up — it runs automatically on push with no developer configuration required. Pre-commit hooks require installing tooling on each developer's machine and maintaining hook scripts. Teams prioritize CI because it's "server-side" (enforceable) over "client-side" (optional). The gap between commit and CI detection is underestimated.

### Warning Signs
- Secrets scanning exists only as a GitHub Action or CI pipeline step
- No `.git/hooks/pre-commit` or `.husky/pre-commit` configuration in the repository
- Developers do not know if their local environment has secret scanning
- Committed secrets are caught by CI but remain in Git history after the push
- CI pipeline finds secrets that "should have been caught earlier"

### Why Harmful
Once a commit is pushed to the remote, the secret is in the repository history — even if CI catches it immediately. CI runners, collaborators, and any GitHub Apps have already seen the commit. Removing the secret requires force-push and affects all collaborators. Pre-commit hooks catch the secret before the commit is created — no trace in history, no force-push needed. CI-only means every secret leak is a confirmed exposure.

### Real-World Consequences
- Developer commits `.env` file — CI catches it 30 seconds later, but GitHub has already indexed the commit
- Secret exposed to all team members who pulled before CI blocked the push
- CI runner logs contain the secret from the scan process — another exposure vector
- Force-push required to remove the secret — all collaborators must rebase, merge conflicts cascade

### Preferred Alternative
Implement both pre-commit hooks (prevention) and CI scanning (detection):
```bash
# Pre-commit hook (client-side)
gitleaks detect --pre-commit

# CI scanning (server-side)
- name: Run Gitleaks
  uses: gitleaks/gitleaks-action@v2
```

### Refactoring Strategy
1. Install a pre-commit hook framework (pre-commit, husky, or gitleaks --pre-commit)
2. Add secrets scanning to the pre-commit hook configuration
3. Document installation steps in CONTRIBUTING.md
4. Add CI check that verifies pre-commit hooks are installed (optional but recommended)
5. Run a full history scan to find any existing secrets

### Detection Checklist
- [ ] Check for pre-commit hook files in `.git/hooks/` or `.husky/`
- [ ] Run `gitleaks detect --pre-commit` locally — does it block commits with secrets?
- [ ] Are new team members instructed to install pre-commit hooks during onboarding?
- [ ] Can a developer commit a dummy secret without local detection?

### Related Rules/Skills/Trees
- Integrate Secrets Scanning in CI/CD Pipeline (05-rules.md)
- Add a Pre-Commit Hook for Secrets Scanning (05-rules.md)
- Scanning Stage decision tree (07-decision-trees.md)

---

## 2. Hardcoded Secrets in Source Code

### Category
Security · Critical

### Description
Writing API keys, database passwords, tokens, and other secrets directly in PHP source files, configuration files, or documentation instead of using environment variables or a secrets manager.

### Why It Happens
During rapid development, developers hardcode a key to "get it working fast" and plan to refactor later — but "later" never comes. Example code from documentation often shows hardcoded values. Test files and seeders contain hardcoded credentials that mirror production values. The secret becomes part of the codebase and is visible to everyone with repository access.

### Warning Signs
- Search results show literal API keys, passwords, or tokens in `.php`, `.yaml`, `.json` files
- Configuration files contain `'password' => 'actualpassword'` instead of `env('DB_PASSWORD')`
- Tests contain hardcoded API keys that mirror production format
- `.env.example` contains real (not placeholder) values
- `git log -p` shows plaintext secrets in commit diffs

### Why Harmful
Hardcoded secrets are visible to every developer, every CI runner, every code reviewer, and anyone who accesses the repository. They appear in error messages, backtraces, screenshots, IDE autocomplete, and pair programming sessions. They cannot be rotated without modifying source code and redeploying. They are the most common source of credential leaks in software development.

### Real-World Consequences
- Developer pushes code with hardcoded production Stripe key — attacker finds it in public repo, charges \$50K
- Screenshot during a presentation shows hardcoded database password — social media identifies the credentials
- Contractor with repository access takes hardcoded API keys and uses them after contract ends
- GitHub secret scanning alerts reveal 50+ hardcoded secrets across the repository

### Preferred Alternative
Always read secrets from environment variables or configuration:
```php
// Bad: hardcoded
$stripeKey = 'sk_live_abc123def456';

// Good: from environment via config
$stripeKey = config('services.stripe.secret'); // Uses env('STRIPE_SECRET')
```

### Refactoring Strategy
1. Run a full secrets scan to identify all hardcoded secrets
2. For each secret found: immediately rotate (revoke old, generate new)
3. Move all secrets to `.env` or secrets manager
4. Update source code to read from `config()` or `env()` only
5. Add CI rule: fail build if any potential secret pattern is detected in source files

### Detection Checklist
- [ ] Search for `sk_live_`, `pk_live_`, `AKIA` (AWS), `ghp_` (GitHub) patterns in source
- [ ] Search for `password =>`, `secret =>`, `api_key =>` in config files
- [ ] Check `.env.example` — does it contain real values?
- [ ] Review recent commit diffs for hardcoded credentials

### Related Rules/Skills/Trees
- Never Hardcode Secrets in Source Code — Use Environment Variables (05-rules.md)
- Revoke and Rotate Any Committed Secret Immediately (05-rules.md)
- Scanner Tool Selection decision tree (07-decision-trees.md)

---

## 3. Not Rotating Committed Secrets

### Category
Security · Critical

### Description
When a secret is found in version control, the team removes it from the code without rotating (revoking) the secret itself, leaving it active and exploitable.

### Why It Happens
The immediate reaction to finding a committed secret is to remove it from the code and push a fix. Teams assume that removing the secret from the repository is sufficient — "it's not in the code anymore." They do not understand that Git history retains the secret, that collaborators may have cloned it, and that CI runners have cached it. The secret remains valid and functional.

### Warning Signs
- A secret was committed to the repository but not revoked in the service provider's dashboard
- "Secret removed from code" is the only action taken after a scanning alert
- The same API key works before and after the "fix" commit
- Attacker can still use the secret because it was never rotated

### Why Harmful
Once a secret is committed to Git, it is compromised permanently. Even after removal from the latest commit, the secret exists in:
- Git history (anyone who cloned before force-push has it)
- CI runner caches and logs
- GitHub/Azure DevOps internal storage
- Developer machines that pulled the commit
- Forked repositories

The only effective remediation is rotation: revoke the secret at the service provider and generate a new one. Removing the secret from code without rotation is security theater.

### Real-World Consequences
- AWS key committed to GitHub, removed from code but not revoked — attacker uses it for 3 months before detection (US\$100K cloud bill)
- Stripe API key removed from code but still active — attacker found it in Git history, processed fraudulent charges
- Compliance audit finds committed secret that was "resolved" by removal only — finding not closed until rotation confirmed
- Penetration test: "The secret was in Git history — no rotation was performed. Still exploitable."

### Preferred Alternative
When a secret is detected in version control, immediately rotate it:
```bash
# 1. Revoke the compromised key in the service dashboard
# 2. Generate a new key
# 3. Update .env with the new key
# 4. Remove the old key from code (if still present)
# 5. Commit and deploy
# 6. Verify the old key no longer works
```

### Refactoring Strategy
1. Create a documented incident response process for committed secrets
2. Process: detect → rotate → remove from code → verify rotation → audit access
3. Automate rotation where possible (most cloud providers have API-based key rotation)
4. Train developers: "If it touched Git, rotate it"
5. Add post-scan step: automatically revoke detected API keys if provider API supports it

### Detection Checklist
- [ ] For each secret found in scanning, has it been rotated (revoked + regenerated)?
- [ ] Can the old key still authenticate with the service?
- [ ] Is the rotation documented (date, which key, who performed)?
- [ ] Is there a policy: "any secret in Git history is considered compromised"?

### Related Rules/Skills/Trees
- Revoke and Rotate Any Committed Secret Immediately (05-rules.md)
- Never Hardcode Secrets in Source Code — Use Environment Variables (05-rules.md)
- Incident Response for Detected Secrets decision tree (07-decision-trees.md)

---

## 4. No False Positive Management (Scanner Fatigue)

### Category
Process · Maintainability

### Description
Running secrets scanning without maintaining an ignore file or allowlist for known false positives, causing developers to ignore scanner results or disable the scanner entirely.

### Why It Happens
The initial scan of an existing codebase produces hundreds of alerts — many are test keys, example values, or known non-secrets. Without a process to review and suppress these, the developer sees a wall of alerts. The scanner becomes noise. Developers either stop looking at the results, or worse, disable the scanner in CI to unblock their pipeline.

### Warning Signs
- Secrets scanner generates 50+ alerts per commit — most are false positives
- Developers routinely skip scanner results in PR reviews
- CI pipeline has `continue-on-error: true` for the scanning step
- `.gitleaksignore` or `.trufflehogignore` file does not exist
- Developers use `git commit --no-verify` to bypass scanning

### Why Harmful
A scanner with too many false positives is worse than no scanner — it creates alert fatigue where real secrets are missed among the noise. Developers learn to ignore scanner output. When a real secret is committed, nobody notices because "the scanner always flags things." The scanner becomes a checkbox compliance item rather than an effective security control.

### Real-World Consequences
- Scanner flags 200 false positives per week — developers stop reviewing alerts
- Real production AWS key committed — buried in 50 other alerts, nobody notices until breach
- Developer disables scanner in CI because "it blocks every PR" — all secrets now pass through
- Security team spends hours investigating alerts, most turn out to be false — team burns out

### Preferred Alternative
Maintain a curated ignore file with documented justifications for each false positive:
```bash
# .gitleaksignore
# Test API key for Stripe test suite — not a real key, documented in tests
test_sk_test_abc123:test/fixtures/stripe.php
# Example JWT in documentation
docs/examples/jwt.md:eyJhbGciOiJIUzI1NiIs...
# Known false positive — high-entropy UUID in migration file
2026_01_01_create_users_table.php
```

### Refactoring Strategy
1. Run a full repository scan and export all findings
2. Triage each finding: real secret (rotate), false positive (add to ignore file)
3. Set up a scheduled review of the ignore file (quarterly) to ensure suppressed entries are still valid
4. Add documentation: explain the false positive policy in CONTRIBUTING.md
5. Configure alerts for new secrets only (not suppressed patterns)

### Detection Checklist
- [ ] Does `.gitleaksignore` or equivalent ignore file exist?
- [ ] Are the ignored entries documented with justification?
- [ ] Is the ignore file reviewed periodically (quarterly)?
- [ ] Ask developers: "Do you trust the scanner output?"

### Related Rules/Skills/Trees
- Create a `.gitleaksignore` or `.trufflehogignore` for False Positives (05-rules.md)
- Educate the Team on Secrets Hygiene (05-rules.md)
- Scanner Tool Selection decision tree (07-decision-trees.md)

---

## 5. Scanning Only Default Source Code Files

### Category
Security · Process

### Description
Configuring secrets scanning to check only `.php` files (or only the default source directories), missing secrets stored in configuration files, documentation, seed files, SQL dumps, and binary files.

### Why It Happens
Default scanner configurations often target common source code patterns. Developers do not customize the scan to include all file types. Secrets naturally accumulate in non-source files: `.env` examples in docs, database passwords in SQL seed files, API keys in YAML configuration, tokens in Markdown troubleshooting guides.

### Warning Signs
- Scanner configured with `--path "*.php"` or similar narrow file filter
- Secrets found in `.md`, `.yaml`, `.sql`, `.json` files during manual review but not caught by scanner
- `.env.example` contains real API keys (should be placeholders)
- `database/seeders/` contains hardcoded production-like credentials
- Documentation files contain example commands with real tokens

### Why Harmful
Attackers search for secrets in all file types — not just source code. A `.md` file with a cURL command containing an API key is just as valuable as a hardcoded key in a PHP file. Documentation, README files, wiki pages, and SQL dumps are common locations for forgotten secrets. Narrow scanning gives a false sense of security — the scanner reports "no secrets found" while secrets exist in unscanned files.

### Real-World Consequences
- README.md contains an example API call with a real production token — not scanned because scanner only checks `.php`
- SQL seed file has hardcoded database password — missed by source-only scan
- Developer documentation wiki contains Vault token — not version-controlled, never scanned
- Postman collection exported with real API keys — not in repository, not scanned

### Preferred Alternative
Configure the scanner to check all file types in the repository:
```yaml
# GitHub Actions: scan all files
- name: Gitleaks
  uses: gitleaks/gitleaks-action@v2
  with:
    args: --source . --no-git  # Scan all files, not just git-tracked
```
Include documentation, seed files, configuration templates, and build scripts in the scan scope.

### Refactoring Strategy
1. Expand scanner configuration to include all text-based file types
2. Specifically include: `.md`, `.yaml`, `.yml`, `.json`, `.xml`, `.sql`, `.env.example`, `.sh`, `Dockerfile`
3. Review current ignore file — ensure known false positives in non-source files are handled
4. Scan the entire filesystem (not just git-tracked files) for secrets that may be in untracked config files
5. Add documentation scanning to the process (wiki, README, CONTRIBUTING docs)

### Detection Checklist
- [ ] What file types does the current scanner configuration check?
- [ ] Search `.md`, `.sql`, `.yaml` files for potential secrets — are they detected by the scanner?
- [ ] Does the scanner check `.env.example`?
- [ ] Are there documentation files with example commands containing real tokens?

### Related Rules/Skills/Trees
- Scan for Secrets in All File Types, Not Just Source Code (05-rules.md)
- Integrate Secrets Scanning in CI/CD Pipeline (05-rules.md)
- Scanner Tool Selection decision tree (07-decision-trees.md)
