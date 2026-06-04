# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Workflow Automation & CI/CD
**Knowledge Unit:** AutomatedTestingInCi
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Service containers configured with health checks
- [ ] Composer dependencies cached (lock file hash key)
- [ ] CI DB env vars separate from local `.env`
- [ ] `RefreshDatabase` trait used on test classes
- [ ] Parallel testing configured (for large suites)
- [ ] Coverage threshold enforced in CI
- [ ] Test job is a required status check

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **GitHub Actions PHPUnit Pattern:** Configure DB environment variables in CI workflow (DB_CONNE...
- [ ] Architecture guideline: - **Parallel Testing Pattern:** Use `php artisan test --parallel --processes=4` to run tests acro...
- [ ] Architecture guideline: - **Dependency Caching Pattern:** Cache vendor/ with hash-based key on composer.lock; restore key...
- [ ] Architecture guideline: - **MySQL Service Container Pattern:** Use health-checked MySQL service container with testing da...
- [ ] Architecture guideline: - **SQLite In-Memory Pattern:** Configure phpunit.xml with DB_CONNECTION=sqlite and DB_DATABASE=:...
- [ ] Architecture guideline: - **Coverage Reporting Pattern:** Generate coverage with `--coverage --min=80` flag to enforce mi...
- [ ] Architecture guideline: - **Test Framework Choice:** Pest for new projects (modern, more readable assertions, parallel by...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Set Up Automated Testing in CI

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
- [ ] Service containers configured with health checks
- [ ] Composer dependencies cached (lock file hash key)
- [ ] CI DB env vars separate from local `.env`
- [ ] `RefreshDatabase` trait used on test classes
- [ ] Parallel testing configured (for large suites)
- [ ] Coverage threshold enforced in CI
- [ ] Test job is a required status check

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Full suite on every push without parallelization -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Skipping database testing entirely -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring CI-only failures -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No coverage enforcement -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Service container without health check -- apply preferred alternative
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
- Set Up Automated Testing in CI
### Anti-Patterns (from 08)
- Full suite on every push without parallelization
- Skipping database testing entirely
- Ignoring CI-only failures
- No coverage enforcement
- Service container without health check
### Related Rules (from 06 skills)
- ATCI-RULE-001: Use SQLite in-memory for unit tests
- ATCI-RULE-002: Always use RefreshDatabase trait
- ATCI-RULE-003: Cache vendor/ based on composer.lock hash
- ATCI-RULE-004: Configure CI DB connection via CI env vars
- ATCI-RULE-005: Run tests in parallel
### Related Skills (from 06 skills)
- Run PHPStan in CI
- Run Pint in CI
- Set Up Automated Deployment Pipelines

