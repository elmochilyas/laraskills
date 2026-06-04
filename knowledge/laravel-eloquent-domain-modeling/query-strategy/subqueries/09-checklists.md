# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Query Strategy
**Knowledge Unit:** Subqueries
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Subquery closures use automatic binding management (no raw strings)
- [ ] All subquery selects have aliases
- [ ] Scalar subqueries include `->take(1)` to prevent multi-row errors
- [ ] Correlated subqueries include `whereColumn()` linking to outer query
- [ ] SQL verified with `toSql()` and `explain()`
- [ ] Subquery performance tested against actual data volumes
- [ ] Common subquery patterns extracted to named builder methods

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Encapsulate common subquery patterns (e.g., `latestPost()`, `orderCount()`) as scopes or builde...
- [ ] Architecture guideline: - Document correlated subqueries with comments explaining the correlation column
- [ ] Architecture guideline: - Extract subquery closures to named variables or methods when they exceed 5 lines
- [ ] Architecture guideline: - Keep subquery-heavy queries in dedicated query objects or repository methods
- [ ] Decision: Subquery vs Join vs withCount() Selection - ensure correct choice is made
- [ ] Decision: Scalar Subquery Safety (limit 1) - ensure correct choice is made
- [ ] Decision: Subquery Binding and Closure Safety - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Write Advanced Subqueries with Closure-Based Builder Syntax

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged

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
- [ ] Subquery closures use automatic binding management (no raw strings)
- [ ] All subquery selects have aliases
- [ ] Scalar subqueries include `->take(1)` to prevent multi-row errors
- [ ] Correlated subqueries include `whereColumn()` linking to outer query
- [ ] SQL verified with `toSql()` and `explain()`
- [ ] Subquery performance tested against actual data volumes
- [ ] Common subquery patterns extracted to named builder methods

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
- Write Advanced Subqueries with Closure-Based Builder Syntax
### Decision Trees (from 07)
- Subquery vs Join vs withCount() Selection
- Scalar Subquery Safety (limit 1)
- Subquery Binding and Closure Safety
### Related Rules (from 06 skills)
- Use Closure-Based Subqueries Over Raw SQL Strings (query-strategy/subqueries)
- Always Alias Subquery Selects (query-strategy/subqueries)
- Add take(1) to Scalar Subqueries to Prevent Multi-Row Errors (query-strategy/subqueries)
- Always Include whereColumn in Correlated Subqueries (query-strategy/subqueries)
- Use withCount() and withExists() Before Writing Manual Subquery Selects (query-strategy/subqueries)
- Encapsulate Common Subquery Patterns as Scopes or Builder Methods (query-strategy/subqueries)
- Verify Subquery SQL with toSql() Before Deploying (query-strategy/subqueries)
### Related Skills (from 06 skills)
- Optimize Subquery Performance with Indexing
- Implement toBase Pattern for Hydration Bypass
- Compose Conditional Query Chains with when()

