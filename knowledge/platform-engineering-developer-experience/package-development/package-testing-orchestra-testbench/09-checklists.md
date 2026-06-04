# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development & Shared Libraries
**Knowledge Unit:** PackageTestingOrchestraTestbench
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Test classes extend `Orchestra\Testbench\TestCase`
- [ ] `getPackageProviders()` returns the package's service provider
- [ ] `getEnvironmentSetUp()` configures test-specific settings
- [ ] SQLite `:memory:` is used as default database
- [ ] `RefreshDatabase` trait used for test isolation
- [ ] CI matrix tests across supported PHP and Laravel versions
- [ ] Both SQLite and MySQL tested in CI
- [ ] Testbench version matches target Laravel version
- [ ] Minimal boot test verifies provider registers without error
- [ ] Unit tests exist alongside integration tests

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Service Provider Loading Pattern:** Override `getPackageProviders()` to return `[PackageServi...
- [ ] Architecture guideline: - **Config Override Pattern:** Override `getEnvironmentSetUp()` to set test-specific config value...
- [ ] Architecture guideline: - **Database Testing Pattern:** Use SQLite `:memory:` for speed; add MySQL/PostgreSQL jobs in CI ...
- [ ] Architecture guideline: - **Multi-Version Testing Pattern:** Use PHPUnit's `@requires` annotation or matrix builds in CI ...
- [ ] Architecture guideline: - **Model Factory Pattern:** Define package model factories in `database/factories/` and register...
- [ ] Architecture guideline: - **Route Testing Pattern:** Package routes registered in boot() are available for HTTP testing v...
- [ ] Architecture guideline: - **RefreshDatabase Trait Pattern:** Load `Illuminate\Foundation\Testing\RefreshDatabase` to rese...
- [ ] Decision: Testbench Integration vs Unit-Only Tests? - ensure correct choice is made
- [ ] Decision: SQLite-Only vs Multi-Database Testing? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Test Laravel Packages with Orchestra Testbench
- [ ] Skill applied: Manage Multi-Version Package Testing with Testbench

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
- [ ] Test classes extend `Orchestra\Testbench\TestCase`
- [ ] `getPackageProviders()` returns the package's service provider
- [ ] `getEnvironmentSetUp()` configures test-specific settings
- [ ] SQLite `:memory:` is used as default database
- [ ] `RefreshDatabase` trait used for test isolation
- [ ] CI matrix tests across supported PHP and Laravel versions
- [ ] Both SQLite and MySQL tested in CI

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Only unit tests, no Testbench -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Only Testbench, no unit tests -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Hardcoded database paths in tests -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Testing implementation details -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Skipping version matrix testing -- apply preferred alternative
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
- Test Laravel Packages with Orchestra Testbench
- Manage Multi-Version Package Testing with Testbench
### Decision Trees (from 07)
- Testbench Integration vs Unit-Only Tests?
- SQLite-Only vs Multi-Database Testing?
### Anti-Patterns (from 08)
- Only unit tests, no Testbench
- Only Testbench, no unit tests
- Hardcoded database paths in tests
- Testing implementation details
- Skipping version matrix testing
### Related Skills (from 06 skills)
- Scaffold a Laravel Package from the Standard Skeleton
- Implement Service Provider Registration (register vs boot)
- Configure Package Auto-Discovery

