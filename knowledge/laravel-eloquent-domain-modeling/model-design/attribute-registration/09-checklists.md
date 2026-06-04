# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Design
**Knowledge Unit:** Attribute Registration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Prefer Attributes Over Boot Method Registration
- [ ] Enforce: Stack Multiple Attributes for Multiple Registrations
- [ ] Enforce: Group All Attribute Registrations Together
- [ ] Enforce: Use `#[ScopedBy]` Over `addGlobalScope` in `boot()`
- [ ] Enforce: Use `#[CollectedBy]` Over `newCollection` Override
- [ ] Enforce: Use `#[UseEloquentBuilder]` Over `newEloquentBuilder` Override
- [ ] Enforce: Verify Child Model Attribute Inheritance
- [ ] Enforce: Combine Attribute Registration with Trait Decomposition
- [ ] Enforce: Do Not Register Observers in Service Providers When Attributes Suffice
- [ ] Enforce: Keep `boot()` Reserved for Runtime-Conditional Registration
- [ ] `#[ObservedBy]` used instead of `Model::observe()` in service providers
- [ ] Multiple attributes are stacked (one per registration), not combined into arrays
- [ ] All attribute registrations are grouped above the class declaration
- [ ] Service provider `observe()` calls are removed for attribute-registered observers
- [ ] Child models do not duplicate parent attribute registrations
- [ ] Runtime-conditional registrations still use `boot()` methods

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Attributes are resolved during model boot â€” no separate registration step needed
- [ ] Architecture guideline: - Multiple attributes of the same type stack (multiple observers, multiple scopes)
- [ ] Architecture guideline: - Attributes work with inheritance â€” child models inherit parent attributes

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Prefer Attributes Over Boot Method Registration
- [ ] Apply rule: Stack Multiple Attributes for Multiple Registrations
- [ ] Apply rule: Group All Attribute Registrations Together
- [ ] Apply rule: Use `#[ScopedBy]` Over `addGlobalScope` in `boot()`
- [ ] Apply rule: Use `#[CollectedBy]` Over `newCollection` Override
- [ ] Apply rule: Use `#[UseEloquentBuilder]` Over `newEloquentBuilder` Override
- [ ] Apply rule: Verify Child Model Attribute Inheritance
- [ ] Apply rule: Combine Attribute Registration with Trait Decomposition
- [ ] Apply rule: Do Not Register Observers in Service Providers When Attributes Suffice
- [ ] Apply rule: Keep `boot()` Reserved for Runtime-Conditional Registration
- [ ] Skill applied: Register Observers and Scopes Using PHP 8 Attributes

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
- [ ] `#[ObservedBy]` used instead of `Model::observe()` in service providers
- [ ] Multiple attributes are stacked (one per registration), not combined into arrays
- [ ] All attribute registrations are grouped above the class declaration
- [ ] Service provider `observe()` calls are removed for attribute-registered observers
- [ ] Child models do not duplicate parent attribute registrations
- [ ] Runtime-conditional registrations still use `boot()` methods

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
- Prefer Attributes Over Boot Method Registration
- Stack Multiple Attributes for Multiple Registrations
- Group All Attribute Registrations Together
- Use `#[ScopedBy]` Over `addGlobalScope` in `boot()`
- Use `#[CollectedBy]` Over `newCollection` Override
- Use `#[UseEloquentBuilder]` Over `newEloquentBuilder` Override
- Verify Child Model Attribute Inheritance
- Combine Attribute Registration with Trait Decomposition
- Do Not Register Observers in Service Providers When Attributes Suffice
- Keep `boot()` Reserved for Runtime-Conditional Registration
### Skills (from 06)
- Register Observers and Scopes Using PHP 8 Attributes
### Related Rules (from 06 skills)
- Prefer Attributes Over Boot Method Registration
- Stack Multiple Attributes for Multiple Registrations
- Group All Attribute Registrations Together
- Use `#[ScopedBy]` Over `addGlobalScope` in `boot()`
- Keep `boot()` Reserved for Runtime-Conditional Registration
### Related Skills (from 06 skills)
- Observer Registration with #[ObservedBy]
- Trait Decomposition for Cross-Cutting Concerns
- Base Model Class Configuration

