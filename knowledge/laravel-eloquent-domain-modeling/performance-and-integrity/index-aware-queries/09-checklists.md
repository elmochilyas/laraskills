# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Performance & Data Integrity
**Knowledge Unit:** Index-Aware Queries
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Top 5 query patterns have designed indexes (not just individual columns)
- [ ] Composite index columns ordered by selectivity
- [ ] `EXPLAIN` confirms index usage (`type` is `ref`, `range`, or `const`)
- [ ] Write-heavy tables have a reviewed, minimal index set
- [ ] CI pipeline includes `EXPLAIN` assertions for critical queries
- [ ] Covering indexes designed for frequent queries
- [ ] Performance: - A covering index can be 10-100x faster than a full table scan â€” reads onl...
- [ ] Performance: - Each index slows INSERT/UPDATE/DELETE â€” a table with 10 indexes updates 1...
- [ ] Performance: - Range conditions (`>`, `<`, `BETWEEN`) use the index only up to the first r...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Index strategy is part of schema design, not an afterthought
- [ ] Architecture guideline: - Prefer fewer, broader composite indexes over many single-column indexes
- [ ] Architecture guideline: - For MySQL, composite indexes on polymorphic relationships: `INDEX(morph_id, morph_type)` if que...
- [ ] Architecture guideline: - Add CI validation: run `EXPLAIN` on critical queries and assert `type` is not `ALL`
- [ ] Decision: Index Design Timing (Proactive vs Reactive) - ensure correct choice is made
- [ ] Decision: Composite Index Column Ordering - ensure correct choice is made
- [ ] Decision: Covering Index vs Standard Index - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Design Index-Aware Eloquent Queries for Optimal Performance

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - A covering index can be 10-100x faster than a full table scan â€” reads only from the index (in memory, likely cach...
- [ ] - Each index slows INSERT/UPDATE/DELETE â€” a table with 10 indexes updates 11 structures per INSERT
- [ ] - Range conditions (`>`, `<`, `BETWEEN`) use the index only up to the first range column; subsequent index columns ar...
- [ ] - `ORDER BY` with mixed ASC/DESC directions can prevent index usage â€” MySQL 8+ supports descending indexes

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - No direct security implications â€” indexes are a performance structure, not a security control
- [ ] - `EXPLAIN` output can reveal schema structure â€” restrict access in production

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
- [ ] Top 5 query patterns have designed indexes (not just individual columns)
- [ ] Composite index columns ordered by selectivity
- [ ] `EXPLAIN` confirms index usage (`type` is `ref`, `range`, or `const`)
- [ ] Write-heavy tables have a reviewed, minimal index set
- [ ] CI pipeline includes `EXPLAIN` assertions for critical queries
- [ ] Covering indexes designed for frequent queries

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
- Design Index-Aware Eloquent Queries for Optimal Performance
### Decision Trees (from 07)
- Index Design Timing (Proactive vs Reactive)
- Composite Index Column Ordering
- Covering Index vs Standard Index
### Related Rules (from 06 skills)
- Design Indexes in Parallel with Query Patterns (performance-and-integrity/index-aware-queries)
- Order Composite Index Columns by Selectivity (performance-and-integrity/index-aware-queries)
- Use Covering Indexes for Frequent Queries (performance-and-integrity/index-aware-queries)
- Verify Index Usage with EXPLAIN (performance-and-integrity/index-aware-queries)
- Prefer Composite Indexes Over Many Single-Column Indexes (performance-and-integrity/index-aware-queries)
### Related Skills (from 06 skills)
- Optimize Subquery Performance with Indexing
- Implement Select Constraints for I/O Reduction
- Define Database Constraints for Integrity

