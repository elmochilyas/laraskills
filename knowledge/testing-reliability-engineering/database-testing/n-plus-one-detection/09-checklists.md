# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Database Testing
**Knowledge Unit:** N+1 Query Detection
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Enable `Model::preventLazyLoading()` in non-production environments
- [ ] Apply rule: Test with realistic data volumes (10+ records) to surface N+1
- [ ] Apply rule: Use `expectsDatabaseQueryCount()` on every database-touching endpoint
- [ ] Apply rule: Eager-load all serialized relationships
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] `Model::preventLazyLoading()` enabled in non-production environments
- [ ] Feature tests for DB endpoints include `expectsDatabaseQueryCount()`
- [ ] Tests create realistic data volumes (10+ records) for relationship tests
- [ ] Query count stays constant regardless of data volume (eager loading verified)
- [ ] Serialized responses (API resources) don't trigger lazy loading
- [ ] Avoid: Mistake
- [ ] Avoid: Only testing N+1 with small datasets
- [ ] Avoid: Not resetting query count between scenarios

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **`expectsDatabaseQueryCount()` vs `preventLazyLoading()`**: Use `preventLazyLoading()` during development for immediate feedback. Use `expectsDatabaseQueryCount()` in CI to enforce budgets.
- **Strict count vs approximate**: Use exact count for deterministic endpoints. Use range for variable query patterns.
- **Query Sentinel for CI**: The community package detects N+1 automatically without per-test configuration.
- **Eager loading by default**: Use `$with` property on models for always-loaded relationships. Use `with()` for per-query eager loading.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Enable `Model::preventLazyLoading()` in non-production environments
- [ ] Follow rule: Test with realistic data volumes (10+ records) to surface N+1
- [ ] Follow rule: Use `expectsDatabaseQueryCount()` on every database-touching endpoint
- [ ] Follow rule: Eager-load all serialized relationships
- [ ] Follow rule: Fix lazy-loading packages, don't disable the safety net
- [ ] - [ ] `Model::preventLazyLoading()` enabled in non-production environments
- [ ] - [ ] Feature tests for DB endpoints include `expectsDatabaseQueryCount()`
- [ ] - [ ] Tests create realistic data volumes (10+ records) for relationship tests
- [ ] - [ ] Query count stays constant regardless of data volume (eager loading verified)

# Performance Checklist
- `expectsDatabaseQueryCount()` overhead: <0.5ms per test.
- Query log overhead: 1-2ms per test + memory. Not recommended for all tests.
- Lazy loading violation check: Negligible overhead.
- N+1 impact in tests: Creating large datasets without eager loading increases test time quadratically.

# Security Checklist
- N+1 doesn't have direct security implications, but excessive queries can contribute to DoS vulnerability.
- Endpoints susceptible to N+1 can be abused by attackers to overload the database.
- Query count enforcement in tests helps prevent performance-based security issues.

# Reliability Checklist
- [ ] Ensure: N+1 query problems occur when code executes one query to fetch parent records an...
- [ ] Verify: Enable `Model::preventLazyLoading()` in non-production environments
- [ ] Verify: Test with realistic data volumes (10+ records) to surface N+1
- [ ] Verify: Use `expectsDatabaseQueryCount()` on every database-touching endpoint
- [ ] Verify: Eager-load all serialized relationships

# Testing Checklist
- [ ] `Model::preventLazyLoading()` enabled in non-production environments
- [ ] Feature tests for DB endpoints include `expectsDatabaseQueryCount()`
- [ ] Tests create realistic data volumes (10+ records) for relationship tests
- [ ] Query count stays constant regardless of data volume (eager loading verified)
- [ ] Serialized responses (API resources) don't trigger lazy loading
- [ ] N+1 not tolerated in admin routes either
- [ ] Avoid: Mistake
- [ ] Avoid: Only testing N+1 with small datasets
- [ ] Avoid: Not resetting query count between scenarios

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Enable `Model::preventLazyLoading()` in non-production environments
- [ ] Apply: Test with realistic data volumes (10+ records) to surface N+1
- [ ] Apply: Use `expectsDatabaseQueryCount()` on every database-touching endpoint
- [ ] Apply: Eager-load all serialized relationships

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Only testing N+1 with small datasets
- [ ] Avoid mistake: Not resetting query count between scenarios
- [ ] Avoid mistake: Disabling lazy loading prevention in production
- [ ] Avoid mistake: Confusing query count with performance

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
- Enable `Model::preventLazyLoading()` in non-production environments
- Test with realistic data volumes (10+ records) to surface N+1
- Use `expectsDatabaseQueryCount()` on every database-touching endpoint
- Eager-load all serialized relationships
- Fix lazy-loading packages, don't disable the safety net
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Detect and Prevent N+1 Query Problems


