# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Shared Security Concerns
**Knowledge Unit:** Enlightn static/dynamic security analysis
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Running Enlightn only once during initial setup**: Configuration drift goes undetected.
- [ ] Prevent anti-pattern: Ignoring individual check failures**: Focusing only on the score number, not what failed.
- [ ] Prevent anti-pattern: No custom checks for application-specific rules**: Domain-specific security rules unenforced.
- [ ] Enlightn installed via Composer
- [ ] CI pipeline includes `php artisan enlightn --ci --score=90`
- [ ] Baseline file committed (if used)
- [ ] Dynamic analysis configured on staging environment
- [ ] Score threshold gated at 90+
- [ ] Avoid: Mistake
- [ ] Avoid: Ignoring high-score issues
- [ ] Avoid: Running only once

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Run static checks in CI (fast, no running app needed)
- Run dynamic checks in staging (pre-deployment) for header and middleware verification
- Fail on high-severity issues; warn on medium/low
- Score threshold at 90+ for CI gating; adjust based on project maturity

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Enlightn installed via Composer
- [ ] - [ ] CI pipeline includes `php artisan enlightn --ci --score=90`
- [ ] - [ ] Baseline file committed (if used)
- [ ] - [ ] Dynamic analysis configured on staging environment

# Performance Checklist
- Static analysis: <30 seconds for most projects. No app boot needed.
- Dynamic analysis: ~50 HTTP requests to the running app. Requires a running environment.
- No production performance impact â€” Enlightn does not run in production.

# Security Checklist
- **Automated Security Code Review**: Enlightn catches the tedious, repeatable parts of a security review â€” "forgot to block debug mode" mistakes.
- **Baseline, Not Comprehensive**: Enlightn catches configuration and coding pattern issues. It does NOT catch business logic flaws, authorization logic errors, or novel vulnerabilities.
- **False Positive Management**: Some checks may not apply (e.g., CLI-only app does not need session security). Document and skip.

# Reliability Checklist
- [ ] Ensure: Enlightn is a comprehensive static and dynamic security analysis tool for Larave...

# Testing Checklist
- [ ] Enlightn installed via Composer
- [ ] CI pipeline includes `php artisan enlightn --ci --score=90`
- [ ] Baseline file committed (if used)
- [ ] Dynamic analysis configured on staging environment
- [ ] Score threshold gated at 90+
- [ ] Failed checks reviewed and addressed periodically
- [ ] Avoid: Mistake
- [ ] Avoid: Ignoring high-score issues
- [ ] Avoid: Running only once

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Running Enlightn only once during initial setup**: Configuration drift goes undetected.
- [ ] Prevent: Ignoring individual check failures**: Focusing only on the score number, not what failed.
- [ ] Prevent: No custom checks for application-specific rules**: Domain-specific security rules unenforced.
- [ ] Prevent: Enlightn not installed at all**: No automated security configuration scanning.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Ignoring high-score issues
- [ ] Avoid mistake: Running only once
- [ ] Avoid mistake: Assuming Enlightn covers everything

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
- Running Enlightn only once during initial setup**: Configuration drift goes undetected.
- Ignoring individual check failures**: Focusing only on the score number, not what failed.
- No custom checks for application-specific rules**: Domain-specific security rules unenforced.
- Enlightn not installed at all**: No automated security configuration scanning.
## Skills
- Gate Deployments on Enlightn Security Analysis Score


