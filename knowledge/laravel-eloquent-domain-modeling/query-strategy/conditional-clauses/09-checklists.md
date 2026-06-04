# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Query Strategy
**Knowledge Unit:** Conditional Clauses
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] All `when()` callbacks explicitly return `$q`
- [ ] Filter chains produce correct SQL for all condition combinations
- [ ] No side effects (logging, API calls) inside `when()` callbacks
- [ ] User-provided filter values sanitized before use in callbacks
- [ ] Conditions evaluate correctly for edge cases (null, empty string, zero, false)
- [ ] Nested `when()` chains extracted to named methods when exceeding 3 levels
- [ ] Default closure provided for ordering fallback

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Extract filter logic into named scope methods when the same `when` pattern appears in multiple ...
- [ ] Architecture guideline: - Keep filter chains in dedicated query classes or service methods, not in controllers
- [ ] Architecture guideline: - Sort `when()` calls consistently (e.g., status filters first, date ranges second, search terms ...
- [ ] Architecture guideline: - Use `when()` with `match` expressions for multi-value conditions instead of nested `when` chains
- [ ] Decision: when() vs if/else Selection - ensure correct choice is made
- [ ] Decision: Condition Value Selection - ensure correct choice is made
- [ ] Decision: when() Chain Depth and Extraction - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Compose Conditional Query Chains with when() and unless()

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
- [ ] All `when()` callbacks explicitly return `$q`
- [ ] Filter chains produce correct SQL for all condition combinations
- [ ] No side effects (logging, API calls) inside `when()` callbacks
- [ ] User-provided filter values sanitized before use in callbacks
- [ ] Conditions evaluate correctly for edge cases (null, empty string, zero, false)
- [ ] Nested `when()` chains extracted to named methods when exceeding 3 levels
- [ ] Default closure provided for ordering fallback

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
- Compose Conditional Query Chains with when() and unless()
### Decision Trees (from 07)
- when() vs if/else Selection
- Condition Value Selection
- when() Chain Depth and Extraction
### Related Rules (from 06 skills)
- Always Explicitly return $q from when() and unless() Callbacks (query-strategy/conditional-clauses)
- Use $request->filled() Instead of $request->has() as when() Conditions (query-strategy/conditional-clauses)
- Never Nest when() Calls Beyond 3 Levels (query-strategy/conditional-clauses)
- Never Place Side Effects Inside when() Callbacks (query-strategy/conditional-clauses)
- Use when() with a Default Closure for Fallback Ordering (query-strategy/conditional-clauses)
- Use Callable Conditions for Expensive Checks in when() (query-strategy/conditional-clauses)
- Extract Recurring when() Patterns into Named Scope Methods (query-strategy/conditional-clauses)
### Related Skills (from 06 skills)
- Compose Fluent Eloquent Query Chains with Correct Termination
- Implement Local Scopes for Reusable Constraints
- Implement Dynamic Scopes with Whitelist Dispatch

