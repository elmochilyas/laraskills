# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Database Testing
**Knowledge Unit:** Database Assertion Methods
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always add `assertDatabaseHas()` after create and update operations
- [ ] Apply rule: Use `assertSoftDeleted()` for soft-delete models, not `assertDatabaseMissing()`
- [ ] Apply rule: Assert key fields, not just record existence
- [ ] Apply rule: Specify database connection in multi-database applications
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Create tests include `assertDatabaseHas` with key field values
- [ ] Update tests include `assertDatabaseHas` with changed values
- [ ] Delete tests include `assertDatabaseMissing` or `assertSoftDeleted`
- [ ] Model class references preferred over string table names
- [ ] Multi-database tests specify connection parameter
- [ ] Avoid: Mistake
- [ ] Avoid: Not specifying enough columns
- [ ] Avoid: Using assertDatabaseMissing when record should exist

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Simple vs complex assertions**: Use `assertDatabaseHas()` for simple existence checks. Use Eloquent `find()` + custom assertions for complex data verification.
- **Table name vs model class**: Use model classes (`User::class`) for refactoring safety. Use string table names for raw pivot tables or non-Eloquent tables.
- **Connection parameter**: Always specify in multi-database setups. Health endpoint pattern: `assertDatabaseHas('users', $data, 'tenant')`.
- **Count assertions**: `assertDatabaseCount()` is useful for aggregate verification but doesn't verify record content. Combine with `assertDatabaseHas` for specific records.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always add `assertDatabaseHas()` after create and update operations
- [ ] Follow rule: Use `assertSoftDeleted()` for soft-delete models, not `assertDatabaseMissing()`
- [ ] Follow rule: Assert key fields, not just record existence
- [ ] Follow rule: Specify database connection in multi-database applications
- [ ] Follow rule: Prefer model class references over string table names
- [ ] Follow rule: Use range-based comparison for timestamp assertions
- [ ] - [ ] Create tests include `assertDatabaseHas` with key field values
- [ ] - [ ] Update tests include `assertDatabaseHas` with changed values
- [ ] - [ ] Delete tests include `assertDatabaseMissing` or `assertSoftDeleted`
- [ ] - [ ] Model class references preferred over string table names

# Performance Checklist
- `assertDatabaseHas()`: Executes one `SELECT EXISTS` query. <5ms with indexed columns.
- `assertDatabaseCount()`: `SELECT COUNT(*)` â€” fast on InnoDB with good statistics.
- Multiple assertions in one test: Each is a separate query. 5 assertions = 5 queries. Acceptable.
- Index impact: Assertions on non-indexed columns are slower on large tables.

# Security Checklist
- Database assertions in tests don't expose security risks directly.
- Ensure test database doesn't contain sensitive production data.
- Assertion failure messages may reveal database schema. In CI, restrict access to test output.

# Reliability Checklist
- [ ] Ensure: Database assertion methods verify database state after test actions: record exis...
- [ ] Verify: Always add `assertDatabaseHas()` after create and update operations
- [ ] Verify: Use `assertSoftDeleted()` for soft-delete models, not `assertDatabaseMissing()`
- [ ] Verify: Assert key fields, not just record existence
- [ ] Verify: Specify database connection in multi-database applications

# Testing Checklist
- [ ] Create tests include `assertDatabaseHas` with key field values
- [ ] Update tests include `assertDatabaseHas` with changed values
- [ ] Delete tests include `assertDatabaseMissing` or `assertSoftDeleted`
- [ ] Model class references preferred over string table names
- [ ] Multi-database tests specify connection parameter
- [ ] Timestamp assertions use range-based comparison
- [ ] Avoid: Mistake
- [ ] Avoid: Not specifying enough columns
- [ ] Avoid: Using assertDatabaseMissing when record should exist

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always add `assertDatabaseHas()` after create and update operations
- [ ] Apply: Use `assertSoftDeleted()` for soft-delete models, not `assertDatabaseMissing()`
- [ ] Apply: Assert key fields, not just record existence
- [ ] Apply: Specify database connection in multi-database applications

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not specifying enough columns
- [ ] Avoid mistake: Using assertDatabaseMissing when record should exist
- [ ] Avoid mistake: Ignoring database connection in multi-DB apps
- [ ] Avoid mistake: Asserting timestamps with exact equality

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
- Always add `assertDatabaseHas()` after create and update operations
- Use `assertSoftDeleted()` for soft-delete models, not `assertDatabaseMissing()`
- Assert key fields, not just record existence
- Specify database connection in multi-database applications
- Prefer model class references over string table names
- Use range-based comparison for timestamp assertions
- Always assert database state after delete operations
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Verify Database State with Assertions


