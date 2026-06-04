# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Query Strategy
**Knowledge Unit:** Global Scopes
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Each global scope has a dedicated scope class with single responsibility
- [ ] `apply()` methods contain no database queries or external calls
- [ ] Global scopes documented on the model class (docblock or README)
- [ ] Suppression paths tested for correctness and security
- [ ] No unintentional `withoutGlobalScopes()` calls
- [ ] QB queries on models with security-critical scopes are reviewed
- [ ] Index exists for columns used in global scope WHERE clauses

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - One scope class per concern (single responsibility principle)
- [ ] Architecture guideline: - Use trait-based auto-registration (like `SoftDeletes`) for scopes that always ship together wit...
- [ ] Architecture guideline: - Prefer anonymous closure scopes for simple constraints: `$this->addGlobalScope('name', fn($q) =...
- [ ] Architecture guideline: - Keep scopes in a `Scopes/` directory within the model namespace or app
- [ ] Architecture guideline: - Establish a naming convention: `TenantScope`, `PublishedScope`, `ActiveScope`
- [ ] Decision: Global Scope vs Local Scope Selection - ensure correct choice is made
- [ ] Decision: Scope Registration Method - ensure correct choice is made
- [ ] Decision: Global Scope Complexity and Performance - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Global Scopes for Cross-Cutting Query Constraints

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
- [ ] Each global scope has a dedicated scope class with single responsibility
- [ ] `apply()` methods contain no database queries or external calls
- [ ] Global scopes documented on the model class (docblock or README)
- [ ] Suppression paths tested for correctness and security
- [ ] No unintentional `withoutGlobalScopes()` calls
- [ ] QB queries on models with security-critical scopes are reviewed
- [ ] Index exists for columns used in global scope WHERE clauses

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
- Implement Global Scopes for Cross-Cutting Query Constraints
### Decision Trees (from 07)
- Global Scope vs Local Scope Selection
- Scope Registration Method
- Global Scope Complexity and Performance
### Related Rules (from 06 skills)
- Keep apply() Methods Lightning Fast (query-strategy/global-scopes)
- Use #[ScopedBy] Attribute Over booted() for Scope Registration (query-strategy/global-scopes)
- Test Each Suppression Path (query-strategy/global-scopes)
- One Scope Class Per Concern (query-strategy/global-scopes)
- Document Every Global Scope on the Model Class (query-strategy/global-scopes)
- Never Rely on Query Builder for Queries Needing Global Scope Constraints (query-strategy/global-scopes)
- Index the Columns Used in Global Scope WHERE Clauses (query-strategy/global-scopes)
### Related Skills (from 06 skills)
- Suppress Global Scopes Safely with Permission Gating
- Implement Local Scopes for Reusable Constraints
- Choose Between Eloquent and Query Builder

