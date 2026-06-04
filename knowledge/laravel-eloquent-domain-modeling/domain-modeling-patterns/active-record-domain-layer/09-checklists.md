# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Active Record as Domain Layer
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Encapsulate State Mutation Behind Expressive Domain Methods
- [ ] Enforce: Enable Strict Mode to Catch Lazy Loading Early
- [ ] Enforce: Protect Mass Assignment with Explicit Fillable Attributes
- [ ] Enforce: Hide Sensitive Attributes from Serialization
- [ ] Enforce: Keep Domain Methods Free of External Side Effects
- [ ] Enforce: Select Only Required Columns in Queries
- [ ] Enforce: Prefer Single `save()` Calls Over Multiple Property Assignments Followed by `save()`
- [ ] Enforce: Use Traits for Cross-Cutting Model Concerns
- [ ] Performance: - Active Record loads all columns on every query â€” use `select()` and `$vis...
- [ ] Performance: - Lazy loading is the primary performance trap â€” enable `preventLazyLoading()`
- [ ] Performance: - Model hydration overhead is negligible for typical page loads

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Models in `App\Models\*` serve as both entities and persistence objects
- [ ] Architecture guideline: - Domain methods use `$this->attribute` and `$this->save()` internally
- [ ] Architecture guideline: - Cross-aggregate logic is extracted to actions
- [ ] Architecture guideline: - Use traits for cross-cutting concerns (SoftDeletes, HasRoles)

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Encapsulate State Mutation Behind Expressive Domain Methods
- [ ] Apply rule: Enable Strict Mode to Catch Lazy Loading Early
- [ ] Apply rule: Protect Mass Assignment with Explicit Fillable Attributes
- [ ] Apply rule: Hide Sensitive Attributes from Serialization
- [ ] Apply rule: Keep Domain Methods Free of External Side Effects
- [ ] Apply rule: Select Only Required Columns in Queries
- [ ] Apply rule: Prefer Single `save()` Calls Over Multiple Property Assignments Followed by `save()`
- [ ] Apply rule: Use Traits for Cross-Cutting Model Concerns

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Active Record loads all columns on every query â€” use `select()` and `$visible` for column control
- [ ] - Lazy loading is the primary performance trap â€” enable `preventLazyLoading()`
- [ ] - Model hydration overhead is negligible for typical page loads

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Mass assignment protection (`$fillable`/`$guarded`) prevents unintended attribute writes
- [ ] - Domain methods should validate state before mutation
- [ ] - Sensitive attributes should be `$hidden` from serialization

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
### Rules (from 05)
- Encapsulate State Mutation Behind Expressive Domain Methods
- Enable Strict Mode to Catch Lazy Loading Early
- Protect Mass Assignment with Explicit Fillable Attributes
- Hide Sensitive Attributes from Serialization
- Keep Domain Methods Free of External Side Effects
- Select Only Required Columns in Queries
- Prefer Single `save()` Calls Over Multiple Property Assignments Followed by `save()`
- Use Traits for Cross-Cutting Model Concerns

