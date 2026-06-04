# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Database Testing
**Knowledge Unit:** Migration Rollback Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Every `up()` method must have a corresponding `down()` method
- [ ] Apply rule: Test the full migrate-rollback-migrate cycle in CI
- [ ] Apply rule: Test data round-trip (preserve data across migration â†’ rollback)
- [ ] Apply rule: Run migration tests sequentially, never in parallel
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] All migrations have functional `down()` methods
- [ ] CI runs `migrate:rollback` test at least once per deployment
- [ ] Migrate â†’ rollback â†’ migrate cycle completes without errors
- [ ] Data round-trip tests verify data preservation during rollback
- [ ] Irreversible migrations documented with manual rollback procedures
- [ ] Avoid: Mistake
- [ ] Avoid: Missing `down()` method entirely
- [ ] Avoid: Truncating/destroying data in down() instead of preserving

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Irreversible migration documentation**: When a migration truly cannot have a `down()`, document it explicitly and have a manual rollback procedure.
- **`down()` completeness**: `down()` should recreate removed columns/tables. It does not need to restore data values (but should try where possible).
- **`migrate:rollback` vs `migrate:fresh` in tests**: Use `migrate:fresh` for normal test setup. Use `migrate:rollback` specifically when testing rollback functionality.
- **Batch boundaries**: Test rollback of full batches (as they run in production), not individual migrations.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Every `up()` method must have a corresponding `down()` method
- [ ] Follow rule: Test the full migrate-rollback-migrate cycle in CI
- [ ] Follow rule: Test data round-trip (preserve data across migration â†’ rollback)
- [ ] Follow rule: Run migration tests sequentially, never in parallel
- [ ] Follow rule: Preserve data in `down()` wherever possible
- [ ] - [ ] All migrations have functional `down()` methods
- [ ] - [ ] CI runs `migrate:rollback` test at least once per deployment
- [ ] - [ ] Migrate â†’ rollback â†’ migrate cycle completes without errors
- [ ] - [ ] Data round-trip tests verify data preservation during rollback

# Performance Checklist
- Migration application: 100-5000ms depending on migration count.
- Rollback overhead: Similar to migration (same operations in reverse).
- Schema assertions: Fast (<5ms) for `Schema::hasTable()` / `hasColumn()`.
- Data round-trip: 2x migration time + data operation time.
- Parallel testing: Migration tests should NOT run in parallel.

# Security Checklist
- Rollback of migrations that modified sensitive data could expose old data if not handled correctly.
- Ensure `down()` methods don't inadvertently expose data that was meant to be removed.
- Test that rollback of security-related migrations (PII removal, encryption changes) works correctly.

# Reliability Checklist
- [ ] Ensure: Migration rollback testing verifies that all database migrations can be safely r...
- [ ] Verify: Every `up()` method must have a corresponding `down()` method
- [ ] Verify: Test the full migrate-rollback-migrate cycle in CI
- [ ] Verify: Test data round-trip (preserve data across migration â†’ rollback)
- [ ] Verify: Run migration tests sequentially, never in parallel

# Testing Checklist
- [ ] All migrations have functional `down()` methods
- [ ] CI runs `migrate:rollback` test at least once per deployment
- [ ] Migrate â†’ rollback â†’ migrate cycle completes without errors
- [ ] Data round-trip tests verify data preservation during rollback
- [ ] Irreversible migrations documented with manual rollback procedures
- [ ] Migration tests run in a dedicated sequential CI job
- [ ] Avoid: Mistake
- [ ] Avoid: Missing `down()` method entirely
- [ ] Avoid: Truncating/destroying data in down() instead of preserving

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Every `up()` method must have a corresponding `down()` method
- [ ] Apply: Test the full migrate-rollback-migrate cycle in CI
- [ ] Apply: Test data round-trip (preserve data across migration â†’ rollback)
- [ ] Apply: Run migration tests sequentially, never in parallel

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Missing `down()` method entirely
- [ ] Avoid mistake: Truncating/destroying data in down() instead of preserving
- [ ] Avoid mistake: Only testing migrate:fresh, not migrate:rollback
- [ ] Avoid mistake: Ignoring batch boundaries in tests

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
- Every `up()` method must have a corresponding `down()` method
- Test the full migrate-rollback-migrate cycle in CI
- Test data round-trip (preserve data across migration â†’ rollback)
- Run migration tests sequentially, never in parallel
- Preserve data in `down()` wherever possible
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Test Migration Rollback Cycle


