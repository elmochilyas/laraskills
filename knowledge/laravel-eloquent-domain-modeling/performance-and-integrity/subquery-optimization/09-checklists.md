# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Performance & Data Integrity
**Knowledge Unit:** Subquery Optimization
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Foreign key columns used in subquery WHERE clauses are indexed
- [ ] Scalar subqueries in `addSelect()` have `->limit(1)` with explicit ordering
- [ ] `EXPLAIN` confirms subquery execution plan (not full table scans)
- [ ] No more than 3 subqueries in a single SELECT
- [ ] `whereIn()` with subquery not used when subquery returns millions of rows
- [ ] Performance tested with production-scale data
- [ ] Performance: - `whereHas()` on 100k parents with unindexed subquery = 100k full table scan...
- [ ] Performance: - Subqueries in SELECT execute once per outer row â€” 10k parents Ã— 3 subque...
- [ ] Performance: - `whereIn()` with subquery materializes the entire subquery result â€” milli...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Use `whereHas()` for selective existence checks (few parents match)
- [ ] Architecture guideline: - Use JOIN + GROUP BY for large-scale aggregations requiring related columns
- [ ] Architecture guideline: - Use `addSelect()` with subqueries for computed columns, but limit to 2-3 per query
- [ ] Architecture guideline: - Use `whereIn()` with subquery for medium-sized uncorrelated existence checks
- [ ] Architecture guideline: - Monitor for temp table creation in `EXPLAIN` output (`Using temporary`)
- [ ] Decision: Subquery Type Selection (whereHas vs whereIn vs JOIN) - ensure correct choice is made
- [ ] Decision: Scalar Subquery Safety - ensure correct choice is made
- [ ] Decision: Subquery Count and Complexity Management - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Optimize Eloquent Subquery Performance

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - `whereHas()` on 100k parents with unindexed subquery = 100k full table scans â€” catastrophic
- [ ] - Subqueries in SELECT execute once per outer row â€” 10k parents Ã— 3 subqueries = 30k executions
- [ ] - `whereIn()` with subquery materializes the entire subquery result â€” millions of IDs cause memory exhaustion
- [ ] - PostgreSQL's subquery flattening can transform correlated subqueries into JOINs automatically; MySQL does this less...

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Subqueries in `addSelect()` can expose computed data â€” ensure the subquery respects row-level authorization
- [ ] - Raw subqueries may be vulnerable to SQL injection if not using parameter binding â€” always use the query builder, ...

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
- [ ] Foreign key columns used in subquery WHERE clauses are indexed
- [ ] Scalar subqueries in `addSelect()` have `->limit(1)` with explicit ordering
- [ ] `EXPLAIN` confirms subquery execution plan (not full table scans)
- [ ] No more than 3 subqueries in a single SELECT
- [ ] `whereIn()` with subquery not used when subquery returns millions of rows
- [ ] Performance tested with production-scale data

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
- Optimize Eloquent Subquery Performance
### Decision Trees (from 07)
- Subquery Type Selection (whereHas vs whereIn vs JOIN)
- Scalar Subquery Safety
- Subquery Count and Complexity Management
### Related Rules (from 06 skills)
- Always Index Subquery WHERE Columns (performance-and-integrity/subquery-optimization)
- Add limit(1) for Every Scalar Subquery (performance-and-integrity/subquery-optimization)
- Prefer Uncorrelated Subqueries When Possible (performance-and-integrity/subquery-optimization)
- Test with Production-Scale Data (performance-and-integrity/subquery-optimization)
- Limit Subqueries in SELECT to 2-3 Per Query (performance-and-integrity/subquery-optimization)
### Related Skills (from 06 skills)
- Design Index-Aware Queries
- Implement Select Constraints
- Write Advanced Subqueries in Query Strategy

