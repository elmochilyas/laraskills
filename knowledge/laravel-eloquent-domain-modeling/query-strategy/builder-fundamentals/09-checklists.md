# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Query Strategy
**Knowledge Unit:** Builder Fundamentals
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Builder chain produces correct SQL (verified via `toSql()`)
- [ ] All terminal methods return expected types
- [ ] No N+1 queries in loops (verified via `DB::listen()` or Telescope)
- [ ] `whereRaw` and `DB::raw` calls use parameterized bindings
- [ ] `chunk()` or `cursor()` used for result sets > 1000 rows
- [ ] Builder instances not reused across separate queries
- [ ] Builder chain ends with a terminal method

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Keep builder chains in controllers/services short; extract complex queries to scopes or query o...
- [ ] Architecture guideline: - Encapsulate raw SQL inside `DB::raw()` calls; avoid spreading raw expressions across the codebase
- [ ] Architecture guideline: - Use repository or query-object classes for complex multi-model query logic
- [ ] Architecture guideline: - Prefer the Eloquent Builder API over dropping to raw SQL whenever possible for type safety
- [ ] Decision: Eloquent Builder vs Query Builder Selection - ensure correct choice is made
- [ ] Decision: Builder Chain Structure and Termination - ensure correct choice is made
- [ ] Decision: Batch Processing Method Selection - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Compose Fluent Eloquent Query Chains with Correct Termination

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
- [ ] Builder chain produces correct SQL (verified via `toSql()`)
- [ ] All terminal methods return expected types
- [ ] No N+1 queries in loops (verified via `DB::listen()` or Telescope)
- [ ] `whereRaw` and `DB::raw` calls use parameterized bindings
- [ ] `chunk()` or `cursor()` used for result sets > 1000 rows
- [ ] Builder instances not reused across separate queries
- [ ] Builder chain ends with a terminal method

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
- Compose Fluent Eloquent Query Chains with Correct Termination
### Decision Trees (from 07)
- Eloquent Builder vs Query Builder Selection
- Builder Chain Structure and Termination
- Batch Processing Method Selection
### Related Rules (from 06 skills)
- Always Terminate Builder Chains with a Terminal Method (query-strategy/builder-fundamentals)
- Never Reuse Builder Instances Across Separate Queries (query-strategy/builder-fundamentals)
- Use Parameterized Bindings Instead of String Interpolation (query-strategy/builder-fundamentals)
- Use `where` Closure Syntax for Nested OR/AND Logic (query-strategy/builder-fundamentals)
- Use chunkById or cursor Instead of get for Large Result Sets (query-strategy/builder-fundamentals)
- Prefer Eloquent Builder API Over DB::raw() for Standard SQL Clauses (query-strategy/builder-fundamentals)
- Never Reuse Builder After Terminal Method Execution (query-strategy/builder-fundamentals)
- Extract Builder Chains Longer Than 20 Methods to Scopes or Query Objects (query-strategy/builder-fundamentals)
### Related Skills (from 06 skills)
- Compose Conditional Query Chains with when()
- Implement Local Scopes for Reusable Constraints
- Implement Custom Builder Pattern for Rich Query APIs

