# Skill: Scan Codebase for Hardcoded Secrets and Credentials

## Purpose
Run automated secret scanning (using Laravel Shield, Enlightn, or git-secrets) to detect hardcoded API keys, passwords, tokens, and credentials in the codebase before commits enter version control.

## When To Use
- Pre-commit hook to prevent secrets from entering git history
- CI/CD pipeline scanning for leaked credentials
- Auditing existing codebase for accidental secret exposure
- Compliance requirements for secret detection

## When NOT To Use
- As a replacement for proper secrets management (use vault/env)
- Scanning encrypted or compiled files

## Prerequisites
- Secret scanning tool installed (Shield, Enlightn, git-leaks, truffleHog)
- Git repository configured with pre-commit hooks

## Workflow
1. Install secret scanning tool in CI pipeline
2. Run scans on every push to detect high-entropy strings (API keys, tokens)
3. Run Shield scan: `php artisan shield:scan --ci` (fast, 20+ checks)
4. Run Enlightn scan: `php artisan enlightn --ci --score=90` (comprehensive)
5. Configure pre-commit hook to block commits with potential secrets
6. False-positive tuning: allowlist known patterns (test keys, example values)
7. If secrets found in git history, rotate immediately and purge from git

## Validation Checklist
- [ ] Secret scanning runs in CI on every push
- [ ] Pre-commit hook blocks commits with potential secrets
- [ ] False-positive allowlist configured and reviewed
- [ ] Scanned high-entropy strings reviewed periodically
- [ ] Secrets found in git history have been rotated and purged
