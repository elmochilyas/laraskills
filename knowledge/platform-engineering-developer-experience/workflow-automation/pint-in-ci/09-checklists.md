# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Workflow Automation & CI/CD
**Knowledge Unit:** PintInCi
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Dedicated Pint CI job runs `pint --test`
- [ ] Pint job runs before slower checks (tests, PHPStan)
- [ ] `--test` mode for internal projects
- [ ] Pint version pinned in `composer.json`
- [ ] `pint.json` committed to repository
- [ ] Branch protection requires Pint check
- [ ] CI exits 0 on clean style, 1 on violations

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **GitHub Actions Pint Check Pattern:** Separate job running `./vendor/bin/pint --test` after co...
- [ ] Architecture guideline: - **Auto-Fix Commit Pattern:** Runs `./vendor/bin/pint` (no --test) then uses git-auto-commit-act...
- [ ] Architecture guideline: - **Early Exit Pattern:** Pint job runs before test jobs via needs: dependency; catches style iss...
- [ ] Architecture guideline: - **Custom Rules in pint.json Pattern:** Override preset rules with team-specific preferences; do...
- [ ] Architecture guideline: - **PHP-CS-Fixer Config Import Pattern:** Use pint.php for complex PHP-based configuration logic ...
- [ ] Architecture guideline: - **Job Position:** Separate job running before tests for fastest feedback on style issues
- [ ] Architecture guideline: - **Check Strategy:** Use Laravel preset for most projects; add custom rules only for specific te...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Run Pint in CI

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
- [ ] Dedicated Pint CI job runs `pint --test`
- [ ] Pint job runs before slower checks (tests, PHPStan)
- [ ] `--test` mode for internal projects
- [ ] Pint version pinned in `composer.json`
- [ ] `pint.json` committed to repository
- [ ] Branch protection requires Pint check
- [ ] CI exits 0 on clean style, 1 on violations

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Skipping Pint in CI -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Manual style enforcement in code review -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Auto-fix on main branch -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring Pint version differences -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Relaxed rules to avoid failures -- apply preferred alternative
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
- Run Pint in CI
### Anti-Patterns (from 08)
- Skipping Pint in CI
- Manual style enforcement in code review
- Auto-fix on main branch
- Ignoring Pint version differences
- Relaxed rules to avoid failures
### Related Rules (from 06 skills)
- PINTICI-RULE-001: Use `--test` mode
- PINTICI-RULE-002: Run Pint as separate job before slower test jobs
- PINTICI-RULE-003: Commit pint.json
- PINTICI-RULE-004: Pin Pint version
- PINTICI-RULE-005: Use "laravel" preset as default
### Related Skills (from 06 skills)
- Run PHPStan in CI
- Set Up Automated Testing in CI
- Configure Pint via pint.json

