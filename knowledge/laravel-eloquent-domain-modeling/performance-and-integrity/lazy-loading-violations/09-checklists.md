# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Performance & Data Integrity
**Knowledge Unit:** Lazy Loading Violations
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `preventLazyLoading()` enabled in development with throw behavior
- [ ] Custom logging handler configured for staging environments
- [ ] `TestCase::setUp()` enables `preventLazyLoading()` for test enforcement
- [ ] Third-party package violations handled via custom handler, not global disable
- [ ] Query count assertions complement strict mode for full N+1 coverage
- [ ] Throw behavior never enabled in production
- [ ] Performance: - `preventLazyLoading()` adds a single static property check before each lazy...
- [ ] Performance: - Custom handler performing I/O (file logging, Redis increment) per violation...
- [ ] Performance: - Strict mode does not add performance cost beyond the check â€” the N+1 quer...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Enable in `AppServiceProvider::boot()` with environment guards
- [ ] Architecture guideline: - Use in `TestCase::setUp()` for global test enforcement
- [ ] Architecture guideline: - Monitor violation counts in staging as a trend metric
- [ ] Architecture guideline: - Pin third-party package versions and test upgrades for strict mode compatibility
- [ ] Decision: Strict Mode Enablement Strategy by Environment - ensure correct choice is made
- [ ] Decision: preventLazyLoading vs shouldBeStrict Selection - ensure correct choice is made
- [ ] Decision: Custom Handler for Third-Party Compatibility - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Enforce Lazy Loading Discipline with Strict Mode

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - `preventLazyLoading()` adds a single static property check before each lazy load â€” no measurable overhead
- [ ] - Custom handler performing I/O (file logging, Redis increment) per violation can add overhead if violations are freq...
- [ ] - Strict mode does not add performance cost beyond the check â€” the N+1 queries it prevents are far more costly

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - `LazyLoadingViolationException` may expose model and relation names in stack traces â€” handle gracefully in API er...
- [ ] - Do not enable throw behavior in production â€” it causes denial of service for any code path with a lazy load

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
- [ ] `preventLazyLoading()` enabled in development with throw behavior
- [ ] Custom logging handler configured for staging environments
- [ ] `TestCase::setUp()` enables `preventLazyLoading()` for test enforcement
- [ ] Third-party package violations handled via custom handler, not global disable
- [ ] Query count assertions complement strict mode for full N+1 coverage
- [ ] Throw behavior never enabled in production

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] No anti-patterns or common mistakes documented for this KU

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
- Enforce Lazy Loading Discipline with Strict Mode
### Decision Trees (from 07)
- Strict Mode Enablement Strategy by Environment
- preventLazyLoading vs shouldBeStrict Selection
- Custom Handler for Third-Party Compatibility
### Related Rules (from 06 skills)
- Enable preventLazyLoading in Development with Throw Behavior (performance-and-integrity/lazy-loading-violations)
- Enable shouldBeStrict in Development and CI (performance-and-integrity/lazy-loading-violations)
- Never Enable Throw Behavior in Production (performance-and-integrity/lazy-loading-violations)
- Configure Custom Handler for Package Compatibility (performance-and-integrity/lazy-loading-violations)
- Enable in TestCase::setUp (performance-and-integrity/lazy-loading-violations)
- Combine with Query Count Assertions for Full Coverage (performance-and-integrity/lazy-loading-violations)
### Related Skills (from 06 skills)
- Prevent N+1 with Eager Loading Strategies
- Detect N+1 with Automated Tooling
- Implement Query Count Middleware

