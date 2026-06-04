# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** CI/CD Pipeline
**Knowledge Unit:** Matrix Testing (PHP Ã— Database)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always Include the Production-Equivalent Matrix Cell
- [ ] Apply rule: Run Minimal Matrix on PRs, Full Matrix on Merge
- [ ] Apply rule: Use Service Containers, Not External Databases
- [ ] Apply rule: Test Across at Least Two PHP Minor Versions
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Production-equivalent matrix cell (PHP + DB) is always included
- [ ] SQLite is not the only CI database engine
- [ ] Matrix runs on at least 2 PHP versions
- [ ] Service containers use pinned database versions matching production
- [ ] Full matrix runs on merge to main or nightly
- [ ] Avoid: Mistake
- [ ] Avoid: Using SQLite as the only CI database
- [ ] Avoid: Matrix excludes that hide bugs

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Exhaustive vs targeted matrix**: Exhaustive (all PHP x all DB) for libraries/packages. Targeted (production + adjacent) for applications.
- **Include/exclude logic**: Use `include` to add production-relevant combinations. Use `exclude` sparingly â€” it can hide bugs in uncovered cells.
- **Parallel vs sequential**: GitHub Actions runs matrix jobs in parallel by default. Use `max-parallel: 2` for resource-constrained self-hosted runners.
- **Database version pinning**: Pin service container versions (mysql:8.0, postgres:16) to match production. Database version differences cause real behavioral changes.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always Include the Production-Equivalent Matrix Cell
- [ ] Follow rule: Run Minimal Matrix on PRs, Full Matrix on Merge
- [ ] Follow rule: Use Service Containers, Not External Databases
- [ ] Follow rule: Test Across at Least Two PHP Minor Versions
- [ ] Follow rule: Pin Database Service Container Versions
- [ ] Follow rule: Do Not Use SQLite as the Only CI Database
- [ ] - [ ] Production-equivalent matrix cell (PHP + DB) is always included
- [ ] - [ ] SQLite is not the only CI database engine
- [ ] - [ ] Matrix runs on at least 2 PHP versions
- [ ] - [ ] Service containers use pinned database versions matching production

# Performance Checklist
- Matrix expansion: Each job is independent and runs in parallel (up to 20 concurrent on hosted runners). Total wall time = slowest cell.
- Service container startup: MySQL 5-10s, PostgreSQL 5-10s per job.
- Database migration time: ~10-30s per migration set. Each matrix cell runs migrations independently.
- Test time per cell: PostgreSQL is typically 10-20% slower than MySQL due to transaction handling differences.
- PHP 8.4 is ~5-10% faster than PHP 8.2 for most Laravel workloads.

# Security Checklist
- Service containers are isolated per job â€” no cross-contamination between matrix cells.
- Database credentials passed via environment variables are visible in CI logs if not masked. Use GitHub Actions secrets for sensitive values.
- Matrix expansion does not affect security posture directly, but broader PHP version coverage catches security-relevant deprecations earlier.

# Reliability Checklist
- [ ] Ensure: Matrix testing in Laravel CI runs the same test suite across multiple PHP versio...
- [ ] Verify: Always Include the Production-Equivalent Matrix Cell
- [ ] Verify: Run Minimal Matrix on PRs, Full Matrix on Merge
- [ ] Verify: Use Service Containers, Not External Databases
- [ ] Verify: Test Across at Least Two PHP Minor Versions

# Testing Checklist
- [ ] Production-equivalent matrix cell (PHP + DB) is always included
- [ ] SQLite is not the only CI database engine
- [ ] Matrix runs on at least 2 PHP versions
- [ ] Service containers use pinned database versions matching production
- [ ] Full matrix runs on merge to main or nightly
- [ ] Reduced matrix runs on PRs for fast feedback
- [ ] Avoid: Mistake
- [ ] Avoid: Using SQLite as the only CI database
- [ ] Avoid: Matrix excludes that hide bugs

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always Include the Production-Equivalent Matrix Cell
- [ ] Apply: Run Minimal Matrix on PRs, Full Matrix on Merge
- [ ] Apply: Use Service Containers, Not External Databases
- [ ] Apply: Test Across at Least Two PHP Minor Versions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using SQLite as the only CI database
- [ ] Avoid mistake: Matrix excludes that hide bugs
- [ ] Avoid mistake: Ignoring PHP deprecation warnings in CI
- [ ] Avoid mistake: Not cleaning up database after matrix tests

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
## Rules
- Always Include the Production-Equivalent Matrix Cell
- Run Minimal Matrix on PRs, Full Matrix on Merge
- Use Service Containers, Not External Databases
- Test Across at Least Two PHP Minor Versions
- Pin Database Service Container Versions
- Do Not Use SQLite as the Only CI Database
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Test with PHP and Database Matrix


