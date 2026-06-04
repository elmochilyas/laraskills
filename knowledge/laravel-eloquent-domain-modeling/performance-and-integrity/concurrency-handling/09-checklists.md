# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Performance & Data Integrity
**Knowledge Unit:** Concurrency Handling
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `lockForUpdate()` is inside a `DB::transaction()` closure
- [ ] Transaction is short â€” no I/O inside the lock scope
- [ ] Deadlock retry configured with at least 3 attempts
- [ ] Locked columns are indexed
- [ ] All code paths lock tables in the same global order
- [ ] `skipLocked()` used for queue worker patterns
- [ ] Performance: - Row-level lock overhead is proportional to locked rows. Locking 100 rows is...
- [ ] Performance: - Deadlock detection has CPU cost. Frequent deadlocks indicate a design probl...
- [ ] Performance: - `lockForUpdate()` on unindexed columns escalates to table-level locks in My...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Pessimistic locking for short, high-contention operations (inventory, balances)
- [ ] Architecture guideline: - Optimistic locking for long-running operations (form edits, document editing)
- [ ] Architecture guideline: - Use `skipLocked()` for queue workers to grab available jobs without contention
- [ ] Architecture guideline: - Set `innodb_lock_wait_timeout = 5` (MySQL) or `lock_timeout = '5s'` (PostgreSQL) to prevent ind...
- [ ] Architecture guideline: - Log and monitor lock wait times to identify contention hotspots
- [ ] Decision: Locking Strategy Selection - ensure correct choice is made
- [ ] Decision: Transaction Scope and Lock Ordering - ensure correct choice is made
- [ ] Decision: Deadlock Handling Approach - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Pessimistic Locking for Concurrent Read-Modify-Write Operations

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Row-level lock overhead is proportional to locked rows. Locking 100 rows is fine; 10,000 causes significant content...
- [ ] - Deadlock detection has CPU cost. Frequent deadlocks indicate a design problem (wrong locking order, too many locks ...
- [ ] - `lockForUpdate()` on unindexed columns escalates to table-level locks in MySQL InnoDB.
- [ ] - Long transactions with locks cause replication lag in MySQL â€” the binlog is flushed only on transaction commit.

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - No direct security implications â€” locking is a consistency mechanism
- [ ] - Ensure deadlock retry logic does not introduce infinite loops that could be exploited as denial-of-service vectors

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
- [ ] `lockForUpdate()` is inside a `DB::transaction()` closure
- [ ] Transaction is short â€” no I/O inside the lock scope
- [ ] Deadlock retry configured with at least 3 attempts
- [ ] Locked columns are indexed
- [ ] All code paths lock tables in the same global order
- [ ] `skipLocked()` used for queue worker patterns

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
- Implement Pessimistic Locking for Concurrent Read-Modify-Write Operations
### Decision Trees (from 07)
- Locking Strategy Selection
- Transaction Scope and Lock Ordering
- Deadlock Handling Approach
### Related Rules (from 06 skills)
- Always Wrap lockForUpdate in a Transaction (performance-and-integrity/concurrency-handling)
- Keep Locked Transactions Short (performance-and-integrity/concurrency-handling)
- Lock Tables in Consistent Global Order (performance-and-integrity/concurrency-handling)
- Implement Deadlock Retry (performance-and-integrity/concurrency-handling)
- Lock Only on Indexed Columns (performance-and-integrity/concurrency-handling)
- Use skipLocked for Queue Workers (performance-and-integrity/concurrency-handling)
- Never Use Pessimistic Locking for Read-Only Operations (performance-and-integrity/concurrency-handling)
- Use Optimistic Locking for Long-Running Operations (performance-and-integrity/concurrency-handling)
### Related Skills (from 06 skills)
- Implement Concurrent-Safe Find-Or-Create with createOrFirst
- Implement Optimistic Locking with Version Columns
- Implement Atomic Upsert Operations

