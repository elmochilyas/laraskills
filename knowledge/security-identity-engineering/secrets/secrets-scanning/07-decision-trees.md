# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Secrets Management
**Knowledge Unit:** Secrets Scanning and Detection
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Scanning Stage | Pre-commit vs CI-only vs both | security, developer-experience |
| 2 | Scanner Tool Selection | Choice of secret scanning tool | capabilities, ecosystem |
| 3 | Incident Response for Detected Secrets | How to handle committed secrets | security, process |

---

# Architecture-Level Decision Trees

---

## Scanning Stage

---

## Decision Context

At what point in the development workflow to run secrets scanning — pre-commit hooks, CI/CD pipeline, or both.

---

## Decision Criteria

* security
* developer-experience

---

## Decision Tree

How important is preventing secrets from ever reaching the remote repository?
↓
Critical → Pre-commit hooks + CI scanning (defense in depth)
Moderate → CI scanning only (catches before merge)

What is the team size and experience level?
↓
Large team (5+ devs) → Pre-commit + CI (more eyes = more risk of accidental commit)
Small team (1-3 devs) → CI scanning sufficient initially

Are secrets already in the repository history?
↓
YES → Full history scan first, then pre-commit + CI for prevention
NO → Pre-commit + CI from the start

What is the CI pipeline frequency?
↓
Fast (< 5 min) → CI scanning is acceptable response time
Slow (> 10 min) → Pre-commit hook gives faster feedback

How comfortable is the team with pre-commit hooks?
↓
Comfortable → Pre-commit hooks (block bad commits immediately)
Uncomfortable → Start with CI, add pre-commit later

---

## Rationale

Pre-commit hooks are the earliest detection point — they catch secrets before they enter the local commit. CI scanning catches secrets that bypassed the pre-commit hook or were committed by a developer without hooks configured. Both together provide defense in depth. For teams new to secrets scanning, starting with CI-only is less intrusive; pre-commit hooks can be introduced after the team is comfortable.

---

## Recommended Default

**Default:** Both pre-commit hooks (for immediate feedback) and CI/CD scanning (as safety net); start with CI-only if team is resistant to pre-commit hooks
**Reason:** Pre-commit hooks prevent secrets from entering git history at the earliest point. CI scanning catches anything that slips through (e.g., developer doesn't have hooks installed). Both layers together minimize the chance of a secret reaching the remote repository.

---

## Risks Of Wrong Choice

- CI-only: secrets committed and pushed before CI runs (already in remote history)
- Pre-commit only: developer who skips/doesn't install hooks has no scanning
- No scanning at all: secrets committed regularly, detected only during breach
- Pre-commit that is too slow: developer bypasses with `--no-verify`

---

## Related Rules

- Integrate Secrets Scanning in CI/CD Pipeline (05-rules.md)
- Add a Pre-Commit Hook for Secrets Scanning (05-rules.md)

---

## Related Skills

- Scan Codebase for Hardcoded Secrets and Credentials (06-skills.md)

---

## Scanner Tool Selection

---

## Decision Context

Choosing the secret scanning tool — Gitleaks, TruffleHog, GitGuardian, Laravel-Shield, or GitHub secret scanning.

---

## Decision Criteria

* capabilities
* ecosystem

---

## Decision Tree

Is the repository hosted on GitHub?
↓
YES → Enable GitHub secret scanning (free, built-in, broad pattern coverage)
NO → Third-party scanner required

What is the primary technology stack?
↓
Laravel → Laravel-Shield (Laravel-specific checks: APP_KEY, .env exposure, debug mode)
General → Gitleaks or TruffleHog (language-agnostic, broad coverage)

Is budget a concern?
↓
YES → Gitleaks (open source, fast, comprehensive patterns)
NO → GitGuardian (cloud, advanced features, false positive reduction)

Does the team need false positive management?
↓
YES → GitGuardian or Gitleaks with `.gitleaksignore`
NO → Any tool with ignore file support

Is scanning of non-git files (entire filesystem) needed?
↓
YES → Gitleaks (supports `--no-git` mode for filesystem scanning)
NO → Any git-based scanner

Is comprehensive credential pattern coverage needed?
↓
YES → Gitleaks (600+ built-in patterns, actively maintained)
NO → Laravel-Shield (fast, focused on Laravel-specific issues)

---

## Rationale

GitHub secret scanning is the easiest starting point for GitHub-hosted repositories — it's free and scans all public/private repos. Gitleaks provides the best open-source pattern coverage (600+ patterns). Laravel-Shield adds Laravel-specific checks (APP_KEY strength, .env exposure, debug mode). TruffleHog and GitGuardian offer more advanced features (entropy detection, historical scanning). A combination is often best: GitHub scanning + Gitleaks in CI.

---

## Recommended Default

**Default:** GitHub secret scanning (built-in) + Gitleaks in CI/CD pipeline + Laravel-Shield for Laravel-specific checks
**Reason:** GitHub scanning catches known patterns for free. Gitleaks provides open-source, customizable scanning with broad pattern coverage. Laravel-Shield adds Laravel-specific security checks that generic scanners miss.

---

## Risks Of Wrong Choice

- No scanner at all: secrets committed without detection
- Only Laravel-Shield: misses non-Laravel secrets (AWS keys, GitHub tokens)
- Only GitHub scanning: misses custom patterns, no pre-commit support
- Scanner without ignore file: false positives cause developer fatigue

---

## Related Rules

- Create a `.gitleaksignore` or `.trufflehogignore` for False Positives (05-rules.md)
- Scan for Secrets in All File Types, Not Just Source Code (05-rules.md)

---

## Related Skills

- Scan Codebase for Hardcoded Secrets and Credentials (06-skills.md)

---

## Incident Response for Detected Secrets

---

## Decision Context

How to respond when a secret is detected in version control — removal vs rotation, history rewriting, and notification.

---

## Decision Criteria

* security
* process

---

## Decision Tree

Was a secret detected in version control (current commit or history)?
↓
YES → Is it a production secret or a test/example value?
    Production → Immediate rotation (the secret is compromised)
    Test/example → Add to ignore file, document why it's safe

Was the secret pushed to a remote repository?
↓
YES → Assume compromised — rotate immediately (remote = public, even for private repos)
NO → Remove from commit (git reset/amend) before pushing

Can the secret be rotated easily?
↓
YES → Rotate (generate new key, update .env/deployment, revoke old key)
NO → Minimize exposure (remove from history, restrict access, plan rotation)

Does the organization have a secret incident response policy?
↓
YES → Follow policy (usually: rotate, audit access, notify affected parties)
NO → Document a simple policy: rotate → audit → notify → prevent recurrence

Is the secret in git history (not just the latest commit)?
↓
YES → Remove from history (BFG Repo-Cleaner or git filter-branch) + rotate
NO → Remove from latest commit + rotate

---

## Rationale

Any secret pushed to a remote repository is compromised — even if immediately removed, it was accessible to CI runners, collaborators, and potentially external parties. Rotation is mandatory. History rewriting removes the secret from future access but does not undo the exposure. The process is: rotate (immediately), audit (who accessed the compromised secret), notify (affected users/services), prevent (add scanning to catch similar issues).

---

## Recommended Default

**Default:** Rotate the secret immediately (it is compromised); remove from git history; notify affected parties; document the incident and update prevention controls
**Reason:** A secret in version control is no longer secret. Rotation is the only reliable remediation. History removal prevents future exposure but does not undo the initial leak. Incident documentation improves prevention.

---

## Risks Of Wrong Choice

- Not rotating ("just removed from code"): secret still valid, attacker can use it
- Only removing from history: secret was already exposed to CI/collaborators
- Force-push without notifying team: collaborators lose work
- No prevention improvement: same mistake repeats

---

## Related Rules

- Revoke and Rotate Any Committed Secret Immediately (05-rules.md)
- Never Hardcode Secrets in Source Code — Use Environment Variables (05-rules.md)
- Educate the Team on Secrets Hygiene (05-rules.md)

---

## Related Skills

- Scan Codebase for Hardcoded Secrets and Credentials (06-skills.md)
