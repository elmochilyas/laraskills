# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Relationships
**Knowledge Unit:** $with Blast Radius
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Avoid-With-On-Widely-Used-Models
- [ ] Enforce: Prefer-Explicit-With
- [ ] Enforce: WithoutEagerLoads-Batch-Operations
- [ ] Enforce: Audit-With-Regularly
- [ ] Enforce: Add-CI-Lint-For-With
- [ ] Enforce: WithoutEagerLoads-Tests
- [ ] Enforce: With-Lack-Of-Constraints

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Keep `$with` to 0â€“1 relationships maximum; use explicit loading for everything else
- [ ] Architecture guideline: - Never use `$with` on models that are eager-loaded as `belongsTo` or `morphTo` targets
- [ ] Architecture guideline: - Use `withoutEagerLoads()` in queue jobs, tests, seeders, and Artisan commands
- [ ] Architecture guideline: - Monitor query count per endpoint â€” `$with` regressions appear as sudden query count increases

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Avoid-With-On-Widely-Used-Models
- [ ] Apply rule: Prefer-Explicit-With
- [ ] Apply rule: WithoutEagerLoads-Batch-Operations
- [ ] Apply rule: Audit-With-Regularly
- [ ] Apply rule: Add-CI-Lint-For-With
- [ ] Apply rule: WithoutEagerLoads-Tests
- [ ] Apply rule: With-Lack-Of-Constraints

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
### Rules (from 05)
- Avoid-With-On-Widely-Used-Models
- Prefer-Explicit-With
- WithoutEagerLoads-Batch-Operations
- Audit-With-Regularly
- Add-CI-Lint-For-With
- WithoutEagerLoads-Tests
- With-Lack-Of-Constraints

