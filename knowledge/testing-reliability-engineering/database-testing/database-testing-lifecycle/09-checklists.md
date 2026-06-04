# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Database Testing
**Knowledge Unit:** Database Testing Lifecycle
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Default to `RefreshDatabase` for 95% of tests
- [ ] Apply rule: Never run tests without any database isolation trait
- [ ] Apply rule: Use production-equivalent database in CI
- [ ] Apply rule: Configure process-specific databases for parallel execution
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] `RefreshDatabase` is the default lifecycle strategy
- [ ] `DatabaseMigrations` used only for schema-modifying tests
- [ ] All migrations have reversible `down()` methods
- [ ] Process-specific databases configured for parallel execution
- [ ] CI uses production-equivalent database in at least one matrix job
- [ ] Avoid: Mistake
- [ ] Avoid: Using DatabaseMigrations for all tests
- [ ] Avoid: Not handling parallel database provisioning

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Strategy selection**: `RefreshDatabase` for 95%+ of tests. `DatabaseMigrations` only for schema-modifying tests. `DatabaseTruncation` for non-transactional databases.
- **Mixed strategies**: Apply traits per-directory via `uses()` scoping in Pest. Different test groups can use different lifecycle strategies.
- **SQLite for local TDD**: Use SQLite locally for speed (50-100 tests/second). Use MySQL/PostgreSQL in CI for production realism.
- **Migration tracking**: `RefreshDatabase` uses static `$migrated` flag. Migration runs once per process, not once per test.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Default to `RefreshDatabase` for 95% of tests
- [ ] Follow rule: Never run tests without any database isolation trait
- [ ] Follow rule: Use production-equivalent database in CI
- [ ] Follow rule: Configure process-specific databases for parallel execution
- [ ] Follow rule: Keep all migrations reversible
- [ ] Follow rule: Scope `DatabaseMigrations` trait only to schema-modifying tests
- [ ] - [ ] `RefreshDatabase` is the default lifecycle strategy
- [ ] - [ ] `DatabaseMigrations` used only for schema-modifying tests
- [ ] - [ ] All migrations have reversible `down()` methods
- [ ] - [ ] Process-specific databases configured for parallel execution

# Performance Checklist
- `RefreshDatabase` overhead: <1ms per test (transaction begin + rollback).
- `DatabaseMigrations` overhead: 100-5000ms per test.
- `DatabaseTruncation` overhead: 5-50ms per test.
- Migration run (once per process): 500ms-10s. Cached by `$migrated` flag.
- SQLite in-memory: ~50-100 tests/second. PostgreSQL with transactions: ~30-60 tests/second.

# Security Checklist
- Test databases should never contain real user data or secrets
- Parallel test databases should be dropped after CI runs to avoid accumulation
- Database credentials used in CI should have limited permissions (test database only)

# Reliability Checklist
- [ ] Ensure: Database testing lifecycle encompasses how database state is managed between tes...
- [ ] Verify: Default to `RefreshDatabase` for 95% of tests
- [ ] Verify: Never run tests without any database isolation trait
- [ ] Verify: Use production-equivalent database in CI
- [ ] Verify: Configure process-specific databases for parallel execution

# Testing Checklist
- [ ] `RefreshDatabase` is the default lifecycle strategy
- [ ] `DatabaseMigrations` used only for schema-modifying tests
- [ ] All migrations have reversible `down()` methods
- [ ] Process-specific databases configured for parallel execution
- [ ] CI uses production-equivalent database in at least one matrix job
- [ ] Test databases cleaned up after CI run
- [ ] Avoid: Mistake
- [ ] Avoid: Using DatabaseMigrations for all tests
- [ ] Avoid: Not handling parallel database provisioning

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Default to `RefreshDatabase` for 95% of tests
- [ ] Apply: Never run tests without any database isolation trait
- [ ] Apply: Use production-equivalent database in CI
- [ ] Apply: Configure process-specific databases for parallel execution

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using DatabaseMigrations for all tests
- [ ] Avoid mistake: Not handling parallel database provisioning
- [ ] Avoid mistake: Using SQLite as only CI database
- [ ] Avoid mistake: Assuming all databases support transactional DDL

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
- Default to `RefreshDatabase` for 95% of tests
- Never run tests without any database isolation trait
- Use production-equivalent database in CI
- Configure process-specific databases for parallel execution
- Keep all migrations reversible
- Scope `DatabaseMigrations` trait only to schema-modifying tests
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Configure Database Testing Lifecycle Strategy


