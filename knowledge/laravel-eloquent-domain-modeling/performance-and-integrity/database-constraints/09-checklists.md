# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Performance & Data Integrity
**Knowledge Unit:** Database Constraints
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Every `foreignIdFor()` is followed by `->constrained()`
- [ ] Critical data foreign keys use `restrictOnDelete()` or `nullOnDelete()`
- [ ] PostgreSQL/SQLite foreign key columns have explicit `->index()`
- [ ] Unique constraints exist on columns that must not have duplicates
- [ ] No `SET FOREIGN_KEY_CHECKS=0` in production migrations
- [ ] Cascade constraints audited for depth and row counts
- [ ] Performance: - Foreign key checks add ~5-10% overhead on write operations in MySQL InnoDB ...
- [ ] Performance: - Unique constraints create an index â€” speeds up lookups but slows writes d...
- [ ] Performance: - Cascade deletes on large child sets can lock tables for extended periods; b...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Define constraints in the same migration that creates the referencing table
- [ ] Architecture guideline: - Use `foreignIdFor()` with `constrained()` as the standard pattern for all foreign keys
- [ ] Architecture guideline: - Prefer `cascadeOnDelete()` for user-submitted content (posts, comments) and `restrictOnDelete()...
- [ ] Architecture guideline: - Never disable `FOREIGN_KEY_CHECKS` in production â€” it opens a window for data corruption
- [ ] Decision: Foreign Key Constraint Declaration - ensure correct choice is made
- [ ] Decision: Cascade Behavior Selection - ensure correct choice is made
- [ ] Decision: Unique Constraint Placement - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Define Database Constraints for Referential Integrity

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Foreign key checks add ~5-10% overhead on write operations in MySQL InnoDB â€” negligible for most applications
- [ ] - Unique constraints create an index â€” speeds up lookups but slows writes due to index maintenance
- [ ] - Cascade deletes on large child sets can lock tables for extended periods; batch-delete manually when removing a par...
- [ ] - Adding foreign key constraints to live tables with millions of rows may lock the table â€” use `pt-online-schema-ch...

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Foreign key constraints prevent orphaned records, which could otherwise expose stale authorization data
- [ ] - Constraint violations leak table structure in error messages â€” handle gracefully in API responses

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
- [ ] Every `foreignIdFor()` is followed by `->constrained()`
- [ ] Critical data foreign keys use `restrictOnDelete()` or `nullOnDelete()`
- [ ] PostgreSQL/SQLite foreign key columns have explicit `->index()`
- [ ] Unique constraints exist on columns that must not have duplicates
- [ ] No `SET FOREIGN_KEY_CHECKS=0` in production migrations
- [ ] Cascade constraints audited for depth and row counts

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
- Define Database Constraints for Referential Integrity
### Decision Trees (from 07)
- Foreign Key Constraint Declaration
- Cascade Behavior Selection
- Unique Constraint Placement
### Related Rules (from 06 skills)
- Always Chain constrained() After foreignIdFor() (performance-and-integrity/database-constraints)
- Default to restrictOnDelete for Critical Data (performance-and-integrity/database-constraints)
- Index Foreign Key Columns on PostgreSQL and SQLite (performance-and-integrity/database-constraints)
- Audit All CASCADE Constraints Before Deployment (performance-and-integrity/database-constraints)
- Never Disable FOREIGN_KEY_CHECKS in Production (performance-and-integrity/database-constraints)
- Handle Cascade for Soft Deletes Separately (performance-and-integrity/database-constraints)
### Related Skills (from 06 skills)
- Implement Unique Enforcement with createOrFirst
- Implement Atomic Upsert Operations
- Implement Concurrent-Safe Find-Or-Create

