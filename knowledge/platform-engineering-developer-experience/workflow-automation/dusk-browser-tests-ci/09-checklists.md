# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Workflow Automation & CI/CD
**Knowledge Unit:** DuskBrowserTestsCi
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Chrome `--headless=new` configured (no Xvfb needed)
- [ ] MySQL service container with health check
- [ ] Dusk runs as separate CI job (after unit/feature tests)
- [ ] `dusk:chrome-driver` runs in CI for driver installation
- [ ] Screenshots and console logs uploaded as artifacts on failure
- [ ] `DatabaseMigrations`/`RefreshDatabase` used for isolation
- [ ] `waitFor()` instead of `sleep()` used in tests

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **GitHub Actions Dusk Pattern:** Run Dusk in a separate job with MySQL service container, Chrom...
- [ ] Architecture guideline: - **Headless Configuration Pattern:** Configure Chrome with `--headless=new`, `--no-sandbox`, `--...
- [ ] Architecture guideline: - **Sail Dusk in CI Pattern:** Use Sail's Docker environment for Dusk; ensures same PHP/Chrome ve...
- [ ] Architecture guideline: - **Parallel Dusk Pattern:** Use `php artisan dusk --parallel --processes=4` for large test suite...
- [ ] Architecture guideline: - **Dusk Test Structure Pattern:** Use `$this->browse()` with Browser instance for each test; use...
- [ ] Architecture guideline: - **Browser Choice:** Chrome (most compatible); Chromium for Linux CI (lighter, faster to install)
- [ ] Architecture guideline: - **Display Mode:** Headless=new (Chrome 112+); Xvfb as fallback for older Chrome versions

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Run Dusk Browser Tests in CI

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged

# Reliability Checklist (from 04/05/06)
- [ ] Error handling covers all failure modes
- [ ] Database transactions wrap multi-step operations
- [ ] Stateless design enforced (no mutable per-request state)
- [ ] Logging is configured for debugging without leaking sensitive data

# Testing Checklist (from 04/06)
- [ ] Unit tests cover happy path
- [ ] Unit tests cover error/exception paths
- [ ] Tests are isolated (no shared mutable state between tests)
- [ ] Test coverage includes edge cases
- [ ] Architecture tests enforce patterns (Pest arch tests)
- [ ] Chrome `--headless=new` configured (no Xvfb needed)
- [ ] MySQL service container with health check
- [ ] Dusk runs as separate CI job (after unit/feature tests)
- [ ] `dusk:chrome-driver` runs in CI for driver installation
- [ ] Screenshots and console logs uploaded as artifacts on failure
- [ ] `DatabaseMigrations`/`RefreshDatabase` used for isolation
- [ ] `waitFor()` instead of `sleep()` used in tests

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Using Dusk for everything -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No screenshot capture on failure -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Hardcoded wait times -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Running Dusk and PHPUnit in the same job -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring ChromeDriver version -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern

# Production Readiness Checklist
- [ ] All configuration values have production-safe defaults
- [ ] Error responses do not leak stack traces or internals
- [ ] Logging level is appropriate for production (INFO/WARN/ERROR)
- [ ] Feature flags or toggles are in place for risky changes
- [ ] Migration rollback strategy is defined
- [ ] Rate limiting is applied where appropriate
- [ ] Monitoring/alerting is configured for failure modes
- [ ] Dependencies are up to date with no known vulnerabilities

# Final Approval Checklist
- [ ] All previous checklist sections have been reviewed and satisfied
- [ ] Code review has been completed by at least one peer
- [ ] The implementation matches the approved design/architecture
- [ ] Tests pass in CI environment
- [ ] Documentation is updated (if applicable)
- [ ] No known regressions introduced
- [ ] Change log entry is added (if applicable)

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
### Skills (from 06)
- Run Dusk Browser Tests in CI
### Anti-Patterns (from 08)
- Using Dusk for everything
- No screenshot capture on failure
- Hardcoded wait times
- Running Dusk and PHPUnit in the same job
- Ignoring ChromeDriver version
### Related Rules (from 06 skills)
- DUSKCI-RULE-001: Use Chrome `--headless=new` mode
- DUSKCI-RULE-002: Use `dusk:chrome-driver` command
- DUSKCI-RULE-003: Use DatabaseMigrations or RefreshDatabase
- DUSKCI-RULE-004: Upload screenshots and console logs as CI artifacts
- DUSKCI-RULE-005: Run Dusk as separate CI job
### Related Skills (from 06 skills)
- Set Up Automated Testing in CI
- Run PHPStan in CI
- Run Pint in CI

