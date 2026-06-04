# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Query Strategy
**Knowledge Unit:** Local Scopes
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] All scope methods explicitly return the builder
- [ ] Scopes named with domain language, not technical column names
- [ ] No side effects (logging, API calls) inside scope methods
- [ ] Scopes tested independently and in combinations
- [ ] No terminating methods (`get`, `first`) inside scopes
- [ ] Model has < 15 scopes (otherwise extract to custom builder)
- [ ] `@method` annotations added to model for IDE support

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Group related scopes on the model; if there are 10+ scopes, consider a custom builder
- [ ] Architecture guideline: - Use scopes for the "vocabulary" of your domain query language
- [ ] Architecture guideline: - Combine scopes with `when()` for conditional application
- [ ] Architecture guideline: - Prefer scope methods over inline `where()` in controllers for maintainability
- [ ] Architecture guideline: - Use `@method` annotations on the model for IDE autocompletion
- [ ] Decision: Local Scope vs Inline where() Selection - ensure correct choice is made
- [ ] Decision: Scope Naming Convention - ensure correct choice is made
- [ ] Decision: Scope Return Value and Termination - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Local Scopes for Reusable Query Constraints

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
- [ ] All scope methods explicitly return the builder
- [ ] Scopes named with domain language, not technical column names
- [ ] No side effects (logging, API calls) inside scope methods
- [ ] Scopes tested independently and in combinations
- [ ] No terminating methods (`get`, `first`) inside scopes
- [ ] Model has < 15 scopes (otherwise extract to custom builder)
- [ ] `@method` annotations added to model for IDE support

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
- Implement Local Scopes for Reusable Query Constraints
### Decision Trees (from 07)
- Local Scope vs Inline where() Selection
- Scope Naming Convention
- Scope Return Value and Termination
### Related Rules (from 06 skills)
- Always Explicitly return $q from Scope Methods (query-strategy/local-scopes)
- Name Scopes with Domain Language, Not Column Names (query-strategy/local-scopes)
- Keep Scopes Focused on a Single Constraint (query-strategy/local-scopes)
- Never Terminate the Query Inside a Scope (query-strategy/local-scopes)
- Limit Scopes to 15 Per Model (query-strategy/local-scopes)
- Use @method Annotations for IDE Autocompletion on Scopes (query-strategy/local-scopes)
- Test Each Scope Independently and in Combinations (query-strategy/local-scopes)
### Related Skills (from 06 skills)
- Implement Domain-Specific Query Methods on Custom Builders
- Implement Dynamic Scopes with Whitelisted Dispatch
- Implement Custom Builder Pattern for Rich Query APIs

