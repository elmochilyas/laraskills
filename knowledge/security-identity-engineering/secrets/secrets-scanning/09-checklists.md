# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Secrets Management
**Knowledge Unit:** Secrets scanning and detection tools
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: No Full History Scan on Legacy Repositories**: Existing git history may contain secrets from commits predating scanning
- [ ] Prevent anti-pattern: Relying Solely on .gitignore**: Developers can force-add `.env` files; scanning catches what `.gitignore` misses
- [ ] Prevent anti-pattern: No Developer Training on Secrets Hygiene**: Technical controls without education miss human error (commit messages, screenshots)
- [ ] Secret scanning runs in CI on every push
- [ ] Pre-commit hook blocks commits with potential secrets
- [ ] False-positive allowlist configured and reviewed
- [ ] Scanned high-entropy strings reviewed periodically
- [ ] Secrets found in git history have been rotated and purged
- [ ] Avoid: Mistake
- [ ] Avoid: Scanning only in CI
- [ ] Avoid: No `.gitignore` for `.env`

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Pre-commit: install `git-secrets` or use Laravel-Shield CLI as a git hook
- CI/CD: add secrets scanning step using `truffleHog`, `ggshield`, or GitHub secret scanning
- GitHub advanced security: enable secret scanning for the repository
- Periodic scan: scheduled job to scan the full git history for newly discovered secret patterns
- Alerting: send notifications to security team when secrets are detected

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Secret scanning runs in CI on every push
- [ ] - [ ] Pre-commit hook blocks commits with potential secrets
- [ ] - [ ] False-positive allowlist configured and reviewed
- [ ] - [ ] Scanned high-entropy strings reviewed periodically

# Performance Checklist
- Secrets scanning adds 5-30 seconds to CI pipeline
- Pre-commit hooks are near-instant for staged files only
- Full history scans can take minutes â€” run as scheduled task, not on every commit

# Security Checklist
- **False Positives**: High-entropy strings may not be secrets. Investigate before blocking the pipeline.
- **False Negatives**: No scanner catches 100% of secrets. Secrets scanning is defense-in-depth, not a guarantee.
- **History Rewrite**: If a secret is committed and pushed, removing it from history requires force-push, which affects all collaborators.
- **Rotation is Mandatory**: Even if the secret is removed from history, assume it is compromised. Rotate immediately.

# Reliability Checklist
- [ ] Ensure: Secrets scanning detects hardcoded credentials, API keys, tokens, and other secr...

# Testing Checklist
- [ ] Secret scanning runs in CI on every push
- [ ] Pre-commit hook blocks commits with potential secrets
- [ ] False-positive allowlist configured and reviewed
- [ ] Scanned high-entropy strings reviewed periodically
- [ ] Secrets found in git history have been rotated and purged
- [ ] Avoid: Mistake
- [ ] Avoid: Scanning only in CI
- [ ] Avoid: No `.gitignore` for `.env`

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No Full History Scan on Legacy Repositories**: Existing git history may contain secrets from commits predating scanning
- [ ] Prevent: Relying Solely on .gitignore**: Developers can force-add `.env` files; scanning catches what `.gitignore` misses
- [ ] Prevent: No Developer Training on Secrets Hygiene**: Technical controls without education miss human error (commit messages, screenshots)
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Scanning only in CI
- [ ] Avoid mistake: No `.gitignore` for `.env`
- [ ] Avoid mistake: Ignoring scanner results
- [ ] Avoid mistake: Not rotating committed secrets

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Anti-Patterns
- No Full History Scan on Legacy Repositories**: Existing git history may contain secrets from commits predating scanning
- Relying Solely on .gitignore**: Developers can force-add `.env` files; scanning catches what `.gitignore` misses
- No Developer Training on Secrets Hygiene**: Technical controls without education miss human error (commit messages, screenshots)
## Skills
- Scan Codebase for Hardcoded Secrets and Credentials


