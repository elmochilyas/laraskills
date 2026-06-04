# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Shared Security Concerns
**Knowledge Unit:** Dependency security (composer audit, Dependabot)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Adding `composer.lock` to `.gitignore`**: Removes auditability and creates unpredictable dependency resolution.
- [ ] Prevent anti-pattern: Never running `composer audit`**: No visibility into known CVEs in dependencies.
- [ ] Prevent anti-pattern: Pinning exact versions without ever updating**: Creates a growing backlog of known vulnerabilities.
- [ ] `composer audit` runs in CI on every push
- [ ] All critical/high vulnerabilities remediated
- [ ] Medium/low vulnerabilities assessed and documented
- [ ] Dependabot/Renovate configured for automated updates
- [ ] Dependency exception list maintained with justifications
- [ ] Avoid: Mistake
- [ ] Avoid: Only auditing direct dependencies
- [ ] Avoid: Not running audit in CI

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Run `composer audit --no-dev` for production deployments (dev dependencies are not needed at runtime)
- Block CI on critical/high severity, warn on medium, investigate low per-case
- Supplement with third-party scanners (Snyk, Sonatype) for license compliance and extended checks

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] `composer audit` runs in CI on every push
- [ ] - [ ] All critical/high vulnerabilities remediated
- [ ] - [ ] Medium/low vulnerabilities assessed and documented
- [ ] - [ ] Dependabot/Renovate configured for automated updates

# Performance Checklist
- `composer audit` runs in <1 second for most projects
- Dependabot runs are free for public repos, included in GitHub Actions minutes for private repos

# Security Checklist
- **Dependency as Attack Surface**: Every package included is an attack surface. A vulnerability in a deeply nested dependency is as dangerous as a direct dependency.
- **Zero-Day Window**: The window between vulnerability disclosure and your deployment is your exposure window. Automated Dependabot PRs minimize this window.
- **Container Scanning**: If running in Docker, also scan the base image (`docker scout`, `trivy`). PHP runtime and OS packages are outside `composer audit`'s scope.

# Reliability Checklist
- [ ] Ensure: Dependency security in Laravel relies on `composer audit` (built-in since Compos...

# Testing Checklist
- [ ] `composer audit` runs in CI on every push
- [ ] All critical/high vulnerabilities remediated
- [ ] Medium/low vulnerabilities assessed and documented
- [ ] Dependabot/Renovate configured for automated updates
- [ ] Dependency exception list maintained with justifications
- [ ] Avoid: Mistake
- [ ] Avoid: Only auditing direct dependencies
- [ ] Avoid: Not running audit in CI

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Adding `composer.lock` to `.gitignore`**: Removes auditability and creates unpredictable dependency resolution.
- [ ] Prevent: Never running `composer audit`**: No visibility into known CVEs in dependencies.
- [ ] Prevent: Pinning exact versions without ever updating**: Creates a growing backlog of known vulnerabilities.
- [ ] Prevent: Only scanning direct dependencies**: Misses vulnerabilities in nested packages.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Only auditing direct dependencies
- [ ] Avoid mistake: Not running audit in CI
- [ ] Avoid mistake: Ignoring dev dependency results
- [ ] Avoid mistake: Not syncing composer.lock

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
- Adding `composer.lock` to `.gitignore`**: Removes auditability and creates unpredictable dependency resolution.
- Never running `composer audit`**: No visibility into known CVEs in dependencies.
- Pinning exact versions without ever updating**: Creates a growing backlog of known vulnerabilities.
- Only scanning direct dependencies**: Misses vulnerabilities in nested packages.
## Skills
- Audit Laravel Dependencies for Known Vulnerabilities


