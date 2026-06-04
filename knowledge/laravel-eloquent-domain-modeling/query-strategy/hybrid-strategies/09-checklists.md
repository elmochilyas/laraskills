# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Query Strategy
**Knowledge Unit:** Hybrid Strategies
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `toBase()` used instead of `DB::table()` where Eloquent builder features are needed
- [ ] Global scope behavior verified with `toBase()`
- [ ] Eager loads converted to explicit joins or subqueries when using `toBase()`
- [ ] Hybrid logic encapsulated in query objects or repository classes
- [ ] SQL output verified with `toSql()` for hybrid chains
- [ ] Binding positions verified with `toRawSql()` when using `mergeBindings()`
- [ ] Performance improvement measured (not assumed)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Keep hybrid logic in dedicated classes (`UserReportQuery`, `DashboardQuery`)
- [ ] Architecture guideline: - Use traits for scope logic that must work in both Eloquent and QB contexts
- [ ] Architecture guideline: - Prefer `toBase()` over raw `DB::table()` â€” it preserves more Eloquent builder state
- [ ] Architecture guideline: - Test both the SQL output and the data shape of hybrid queries
- [ ] Architecture guideline: - Establish a team convention: "Hybrid in repositories, pure Eloquent in controllers"
- [ ] Decision: Hybrid Strategy Necessity - ensure correct choice is made
- [ ] Decision: toBase() vs Raw QB for Hybrid - ensure correct choice is made
- [ ] Decision: Hybrid Pattern Encapsulation - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Hybrid Eloquent-Query Builder Strategies

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
- [ ] `toBase()` used instead of `DB::table()` where Eloquent builder features are needed
- [ ] Global scope behavior verified with `toBase()`
- [ ] Eager loads converted to explicit joins or subqueries when using `toBase()`
- [ ] Hybrid logic encapsulated in query objects or repository classes
- [ ] SQL output verified with `toSql()` for hybrid chains
- [ ] Binding positions verified with `toRawSql()` when using `mergeBindings()`
- [ ] Performance improvement measured (not assumed)

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
- Implement Hybrid Eloquent-Query Builder Strategies
### Decision Trees (from 07)
- Hybrid Strategy Necessity
- toBase() vs Raw QB for Hybrid
- Hybrid Pattern Encapsulation
### Related Rules (from 06 skills)
- Prefer toBase() Over Raw DB::table() for Hybrid Queries (query-strategy/hybrid-strategies)
- Encapsulate Hybrid Logic in Query Objects (query-strategy/hybrid-strategies)
- Verify Global Scope Application When Using toBase() (query-strategy/hybrid-strategies)
- Replace with() with Explicit Joins or Subqueries When Using toBase() (query-strategy/hybrid-strategies)
- Never Manually Hydrate Large Result Sets (query-strategy/hybrid-strategies)
- Test Binding Order When Using mergeBindings() (query-strategy/hybrid-strategies)
- Document the Performance Rationale for Every Hybrid Approach (query-strategy/hybrid-strategies)
### Related Skills (from 06 skills)
- Implement toBase Pattern for Hydration Bypass
- Choose Between Eloquent and Query Builder
- Evaluate Performance Tradeoffs with Profiling

