# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Query Strategy
**Knowledge Unit:** To Base Pattern
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `toBase()` called after all Eloquent-specific constraints
- [ ] Global scope behavior verified with `toBase()`
- [ ] `with()` calls replaced with explicit joins or subqueries
- [ ] No model methods called on `toBase()` results
- [ ] Performance improvement measured (saved hydration time confirmed)
- [ ] Shared reference handled correctly (cloned if needed for concurrent use)
- [ ] Data shape tested (callers know they receive stdClass, not models)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Encapsulate `toBase()` calls in query objects to keep decisions centralized
- [ ] Architecture guideline: - Use `toBase()` for read-model queries; keep Eloquent for write operations
- [ ] Architecture guideline: - Add `@method` annotations or docstrings for queries that use `toBase()` returning non-model res...
- [ ] Architecture guideline: - Test both the SQL output and the data shape when using `toBase()`
- [ ] Architecture guideline: - Consider creating a dedicated read-model class instead of returning raw `stdClass`
- [ ] Decision: toBase() Usage Decision - ensure correct choice is made
- [ ] Decision: toBase() Positioning in the Chain - ensure correct choice is made
- [ ] Decision: Eager Loading Replacement for toBase() - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Optimize Read Queries with toBase Pattern

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
- [ ] `toBase()` called after all Eloquent-specific constraints
- [ ] Global scope behavior verified with `toBase()`
- [ ] `with()` calls replaced with explicit joins or subqueries
- [ ] No model methods called on `toBase()` results
- [ ] Performance improvement measured (saved hydration time confirmed)
- [ ] Shared reference handled correctly (cloned if needed for concurrent use)
- [ ] Data shape tested (callers know they receive stdClass, not models)

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
- Optimize Read Queries with toBase Pattern
### Decision Trees (from 07)
- toBase() Usage Decision
- toBase() Positioning in the Chain
- Eager Loading Replacement for toBase()
### Related Rules (from 06 skills)
- Call toBase() After All Eloquent-Specific Constraints Are Applied (query-strategy/to-base-pattern)
- Use toBase() as the First Optimization Step (query-strategy/to-base-pattern)
- Never Expect with() to Work with toBase() (query-strategy/to-base-pattern)
- Verify Global Scope Application Before and After toBase() (query-strategy/to-base-pattern)
- Document Why toBase() Is Used (query-strategy/to-base-pattern)
- Clone the Underlying Query Builder If the Original Eloquent Builder Will Be Reused (query-strategy/to-base-pattern)
- Never Use toBase() for Single-Record Queries (query-strategy/to-base-pattern)
### Related Skills (from 06 skills)
- Implement Hybrid Strategies for Eloquent-QB Mixing
- Evaluate Performance Tradeoffs with Profiling
- Choose Between Eloquent and Query Builder

