# Rules: Secrets Scanning

## Integrate Secrets Scanning in CI/CD Pipeline
---
## Category
Architecture
---
## Rule
Add a secrets scanning tool (Gitleaks, TruffleHog, GitGuardian) to the CI/CD pipeline. Fail the build if any secrets are detected in the commit.
---
## Reason
Secrets committed to version control remain in Git history even if removed later. CI/CD scanning catches secrets before they reach the remote repository. Without automated scanning, secrets may be committed accidentally and detected only during a breach investigation.
---
## Bad Example
```yaml
# No secrets scanning — secrets can be committed unnoticed
```
---
## Good Example
```yaml
# GitHub Actions with Gitleaks
- name: Run Gitleaks
  uses: gitleaks/gitleaks-action@v2
```
---
## Exceptions
No common exceptions — secrets scanning is a security essential.
---
## Consequences Of Violation
Committed secrets in Git history, credential leak.
---

## Add a Pre-Commit Hook for Secrets Scanning
---
## Category
Security
---
## Rule
Install a pre-commit hook that runs a secrets scanner before each commit. Block the commit if secrets are detected.
---
## Reason
CI/CD scanning catches secrets after the commit is pushed, but the secret is already in the remote repository (even if immediately force-pushed, it may have been pulled by CI runners). Pre-commit hooks catch secrets before they leave the developer's machine.
---
## Bad Example
```bash
# git commit without pre-commit hook — secret may be committed
```
---
## Good Example
```bash
# Install pre-commit hook that runs Gitleaks
gitleaks detect --pre-commit
```
---
## Exceptions
No common exceptions — pre-commit hooks catch secrets at the earliest point.
---
## Consequences Of Violation
Secrets pushed to remote before CI catches them.
---

## Create a .gitleaksignore or .trufflehogignore for False Positives
---
## Category
Maintainability
---
## Rule
Maintain an ignore file for known false positives (test API keys, example values). Review each ignored entry for justification.
---
## Reason
Secrets scanners generate false positives (e.g., test keys, placeholder values). A poorly configured scanner that blocks every commit for a false positive will be disabled or ignored. A curated ignore file keeps the scanner useful while filtering out noise.
---
## Bad Example
```bash
# No ignore file — scanner flags test keys, developers ignore it
```
---
## Good Example
```bash
# .gitleaksignore
# Test API key — never used in production, documented in tests
test-api-key-12345
# Example secret in documentation
ghp_example
```
---
## Exceptions
No common exceptions — an ignore file keeps scanning practical.
---
## Consequences Of Violation
Developers disable or ignore the scanner due to false positives.
---

## Never Hardcode Secrets in Source Code — Use Environment Variables
---
## Category
Security
---
## Rule
Read all secrets (API keys, database passwords, tokens) from environment variables or a secrets manager. Never hardcode them in source files.
---
## Reason
Hardcoded secrets in source code are visible to everyone with repository access. They appear in Git history, IDE autocomplete, error backtraces, and screenshots. Environment variables and secrets managers keep secrets out of the codebase.
---
## Bad Example
```php
$stripeKey = 'sk_live_abc123'; // Hardcoded — visible in source code
```
---
## Good Example
```php
$stripeKey = config('services.stripe.secret'); // From .env or secrets manager
```
---
## Exceptions
No common exceptions — secrets must never be in source code.
---
## Consequences Of Violation
Secrets leaked via repository access, screenshots, error reports.
---

## Scan for Secrets in All File Types, Not Just Source Code
---
## Category
Security
---
## Rule
Configure the secrets scanner to scan all file types: `.env`, `.yaml`, `.xml`, `.json`, `.sql`, `.md`, and binary files.
---
## Reason
Secrets are often placed in configuration files (`config/database.php`), documentation (`docs/api.md`), seed files, and SQL dumps. Scanners limited to source code miss these. Broad scanning ensures comprehensive coverage.
---
## Bad Example
```bash
# Scanner configured to scan only .php files
```
---
## Good Example
```bash
# Scan all files
gitleaks detect --source . --no-git
```
---
## Exceptions
Binary files that are not text-searchable — focus on text-based files.
---
## Consequences Of Violation
Secrets in non-source files go undetected.
---

## Revoke and Rotate Any Committed Secret Immediately
---
## Category
Security
---
## Rule
If a secret is detected in version control, revoke it immediately and rotate to a new value. Never treat a committed secret as still secret.
---
## Reason
Once a secret is committed to Git, it is in the repository history. Any current or past collaborator, CI runner, or repository fork has access to it. The secret is no longer secret — treat it as compromised and rotate immediately.
---
## Bad Example
```bash
# Committed API key not rotated — "just removed from code"
```
---
## Good Example
```bash
# 1. Revoke the compromised key in the service provider's dashboard
# 2. Generate a new key
# 3. Commit the new key via environment variable
```
---
## Exceptions
No common exceptions — a committed secret is compromised.
---
## Consequences Of Violation
Ongoing unauthorized access with the compromised secret.
---

## Educate the Team on Secrets Hygiene
---
## Category
Process
---
## Rule
Train developers on secrets hygiene: never hardcode, use `.env` locally, never share screenshots with secrets, revoke committed secrets immediately.
---
## Reason
Technical controls (scanners, pre-commit hooks) are essential but not sufficient. Developer behavior — accidentally committing a private key, pasting a production token in a chat, putting a password in a commit message — remains a primary source of secret leaks. Education reduces human error.
---
## Bad Example
```bash
# Developer pastes production DB password in a Pull Request comment
```
---
## Good Example
```bash
# Team training on secrets hygiene — regular reminders in PR reviews
```
---
## Exceptions
No common exceptions — technical controls + education = defense in depth.
---
## Consequences Of Violation
Human error leads to secret leakage despite automated controls.
