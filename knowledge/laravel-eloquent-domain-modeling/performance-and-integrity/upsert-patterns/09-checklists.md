# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Performance & Data Integrity
**Knowledge Unit:** Upsert Patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Unique index exists on the `$uniqueBy` columns (verified in migration)
- [ ] Large datasets chunked to 500-1000 records per call
- [ ] `updated_at` included in the `$update` array when timestamp tracking needed
- [ ] Model event handlers handled separately if needed
- [ ] Auto-increment primary key excluded from `$update`
- [ ] Incoming data validated and sanitized before `upsert()`
- [ ] Performance: - `upsert()` is dramatically faster than looping `updateOrCreate()`: 1 query ...
- [ ] Performance: - For 10,000 records in chunks of 1000: ~100ms vs 2â€“10 seconds for `updateO...
- [ ] Performance: - Conflict detection uses the unique index â€” no SELECT preceding INSERT, el...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Use `upsert()` for ETL, feed import, and bulk synchronization tasks
- [ ] Architecture guideline: - Combine with chunking for datasets larger than 1000 records
- [ ] Architecture guideline: - Use a dedicated job class for upsert operations â€” makes event-handling and error recovery exp...
- [ ] Architecture guideline: - Monitor binlog size and replication lag for high-throughput upsert jobs
- [ ] Architecture guideline: - Use `$update` selectively â€” only specify columns that actually change to reduce write load
- [ ] Decision: upsert() vs updateOrCreate() Loop Selection - ensure correct choice is made
- [ ] Decision: Chunk Size for Large Upsert Operations - ensure correct choice is made
- [ ] Decision: Model Event Handling for Upsert Bypass - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Atomic Bulk Upsert Operations

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - `upsert()` is dramatically faster than looping `updateOrCreate()`: 1 query vs N queries, all round trips eliminated
- [ ] - For 10,000 records in chunks of 1000: ~100ms vs 2â€“10 seconds for `updateOrCreate()` loop
- [ ] - Conflict detection uses the unique index â€” no SELECT preceding INSERT, eliminating the race window
- [ ] - Chunk size tuning: 500â€“1000 is recommended; too large risks packet limits and timeouts

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - `upsert()` bypasses model attribute casting and accessors â€” raw data goes to the database
- [ ] - Validate all incoming data before passing to `upsert()` â€” no Eloquent attribute protection
- [ ] - If `$uniqueBy` includes sensitive columns, ensure the incoming data is trusted or sanitized

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
- [ ] Unique index exists on the `$uniqueBy` columns (verified in migration)
- [ ] Large datasets chunked to 500-1000 records per call
- [ ] `updated_at` included in the `$update` array when timestamp tracking needed
- [ ] Model event handlers handled separately if needed
- [ ] Auto-increment primary key excluded from `$update`
- [ ] Incoming data validated and sanitized before `upsert()`

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
- Implement Atomic Bulk Upsert Operations
### Decision Trees (from 07)
- upsert() vs updateOrCreate() Loop Selection
- Chunk Size for Large Upsert Operations
- Model Event Handling for Upsert Bypass
### Related Rules (from 06 skills)
- Always Create a Unique Constraint Before Using upsert (performance-and-integrity/upsert-patterns)
- Chunk Large Datasets to 500-1000 Records per Call (performance-and-integrity/upsert-patterns)
- Always Include updated_at in $update (performance-and-integrity/upsert-patterns)
- Handle Model Events Separately (performance-and-integrity/upsert-patterns)
- Never Include Auto-Increment PK in $update (performance-and-integrity/upsert-patterns)
- Validate All Incoming Data Before upsert (performance-and-integrity/upsert-patterns)
### Related Skills (from 06 skills)
- Implement Concurrent-Safe Find-Or-Create with createOrFirst
- Enforce Uniqueness with Database Constraints
- Implement Pessimistic Locking for Concurrency

