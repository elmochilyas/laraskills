# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Performance & Data Integrity
**Knowledge Unit:** first-or-create-vs-create-or-first
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `createOrFirst()` used for all concurrent find-or-create paths
- [ ] `firstOrCreate()` only used in serial contexts with documented guarantee
- [ ] Unique constraint exists on the `$attributes` columns
- [ ] No `firstOrCreate()` on endpoints that may receive concurrent requests
- [ ] Soft-delete handling applied where appropriate
- [ ] `lockForUpdate()` wrapped in `DB::transaction()` if used as alternative
- [ ] Performance: - `createOrFirst()` always performs an INSERT first â€” for endpoints where t...
- [ ] Performance: - `firstOrCreate()` with `lockForUpdate()` is race-safe but holds row locks, ...
- [ ] Performance: - Exception handling in `createOrFirst()` is cheap (~1-2Î¼s for exception cre...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Use `createOrFirst()` for registration, invitation acceptance, and any "claim this resource" flow
- [ ] Architecture guideline: - Use `firstOrCreate()` for admin panel creation where access is serial per user
- [ ] Architecture guideline: - Use `firstOrCreate()` with `lockForUpdate()` inside a transaction as an alternative concurrent-...
- [ ] Architecture guideline: - Monitor for duplicates via `SELECT attributes, COUNT(*) GROUP BY HAVING COUNT(*) > 1` on tables...
- [ ] Decision: firstOrCreate() vs createOrFirst() Selection - ensure correct choice is made
- [ ] Decision: createOrFirst() Constraint Verification - ensure correct choice is made
- [ ] Decision: Soft-Delete Handling in Find-or-Create - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Concurrent-Safe Find-Or-Create with createOrFirst

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - `createOrFirst()` always performs an INSERT first â€” for endpoints where the record already exists 90%+ of the tim...
- [ ] - `firstOrCreate()` with `lockForUpdate()` is race-safe but holds row locks, reducing concurrency under contention
- [ ] - Exception handling in `createOrFirst()` is cheap (~1-2Î¼s for exception creation) and try-catch overhead without ex...
- [ ] - Index the attributes columns â€” benefits both methods and is required for `createOrFirst()`'s unique constraint

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - `createOrFirst()` prevents duplicate user accounts/enrollments from race conditions â€” this is a security concern ...
- [ ] - Ensure `createOrFirst()` collision logging does not include sensitive PII data

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
- [ ] `createOrFirst()` used for all concurrent find-or-create paths
- [ ] `firstOrCreate()` only used in serial contexts with documented guarantee
- [ ] Unique constraint exists on the `$attributes` columns
- [ ] No `firstOrCreate()` on endpoints that may receive concurrent requests
- [ ] Soft-delete handling applied where appropriate
- [ ] `lockForUpdate()` wrapped in `DB::transaction()` if used as alternative

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
- Implement Concurrent-Safe Find-Or-Create with createOrFirst
### Decision Trees (from 07)
- firstOrCreate() vs createOrFirst() Selection
- createOrFirst() Constraint Verification
- Soft-Delete Handling in Find-or-Create
### Related Rules (from 06 skills)
- Prefer createOrFirst for Web-Facing Code (performance-and-integrity/first-or-create-vs-create-or-first)
- Always Add a Unique Constraint Before Using createOrFirst (performance-and-integrity/first-or-create-vs-create-or-first)
- Handle Soft-Deleted Records Explicitly (performance-and-integrity/first-or-create-vs-create-or-first)
- Use firstOrCreate Only in Documented Serial Contexts (performance-and-integrity/first-or-create-vs-create-or-first)
### Related Skills (from 06 skills)
- Implement Atomic Upsert Operations
- Implement Unique Enforcement with Database Constraints
- Implement Pessimistic Locking for Concurrency

