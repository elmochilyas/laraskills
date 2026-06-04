# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Shared Security Concerns
**Knowledge Unit:** Laravel-Shield security scanning CLI
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: No scheduled shield scans**: Only runs at deployment â€” configuration drift undetected between deploys.
- [ ] Prevent anti-pattern: Not running in pre-deployment hook**: Deployment proceeds even with exposed .env or debug mode.
- [ ] Prevent anti-pattern: Treating Shield as a comprehensive security audit**: It only checks ~20 items.
- [ ] Shield installed and scan runs without errors
- [ ] CI pipeline includes `php artisan shield:scan --ci`
- [ ] All identified issues addressed
- [ ] Scheduled scans detect configuration drift
- [ ] Shield runs alongside Enlightn for comprehensive coverage
- [ ] Avoid: Mistake
- [ ] Avoid: Running only Shield, not Enlightn
- [ ] Avoid: Ignoring medium-severity findings

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Fail CI on critical/high severity findings; warn on medium/low
- Run in pre-deployment hook alongside `composer audit`
- Schedule scans to detect configuration drift between deployments

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Shield installed and scan runs without errors
- [ ] - [ ] CI pipeline includes `php artisan shield:scan --ci`
- [ ] - [ ] All identified issues addressed
- [ ] - [ ] Scheduled scans detect configuration drift

# Performance Checklist
- Complete scan in under 10 seconds for most projects
- No dependency on running application â€” purely file-system and config analysis
- No impact on production performance

# Security Checklist
- **.env Accessibility Check**: Shield attempts to access `/.env` via HTTP. Ensure this endpoint returns 404.
- **Weak APP_KEY Detection**: Always use `php artisan key:generate` â€” never hardcode or use default keys.
- **Storage Exposure**: Checks if `storage/` is publicly accessible. Should return 403/404.
- **Entropy Detection**: Catches hardcoded API keys, tokens, and secrets in source code.

# Reliability Checklist
- [ ] Ensure: Laravel-Shield is a dedicated security scanning CLI tool for Laravel application...

# Testing Checklist
- [ ] Shield installed and scan runs without errors
- [ ] CI pipeline includes `php artisan shield:scan --ci`
- [ ] All identified issues addressed
- [ ] Scheduled scans detect configuration drift
- [ ] Shield runs alongside Enlightn for comprehensive coverage
- [ ] Avoid: Mistake
- [ ] Avoid: Running only Shield, not Enlightn
- [ ] Avoid: Ignoring medium-severity findings

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No scheduled shield scans**: Only runs at deployment â€” configuration drift undetected between deploys.
- [ ] Prevent: Not running in pre-deployment hook**: Deployment proceeds even with exposed .env or debug mode.
- [ ] Prevent: Treating Shield as a comprehensive security audit**: It only checks ~20 items.
- [ ] Prevent: Custom severity filters**: Using `--severity=high` to bypass medium findings.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Running only Shield, not Enlightn
- [ ] Avoid mistake: Ignoring medium-severity findings
- [ ] Avoid mistake: Not running after every deployment

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
- No scheduled shield scans**: Only runs at deployment â€” configuration drift undetected between deploys.
- Not running in pre-deployment hook**: Deployment proceeds even with exposed .env or debug mode.
- Treating Shield as a comprehensive security audit**: It only checks ~20 items.
- Custom severity filters**: Using `--severity=high` to bypass medium findings.
## Skills
- Quick-Scan Laravel Security with Laravel-Shield CLI


