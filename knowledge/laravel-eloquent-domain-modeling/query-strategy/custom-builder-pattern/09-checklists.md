# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Query Strategy
**Knowledge Unit:** Custom Builder Pattern
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Custom builder registered via `HasBuilder` trait or `newEloquentBuilder()` override
- [ ] Custom class extends `Illuminate\Database\Eloquent\Builder`
- [ ] All fluent methods return `: static`
- [ ] `@mixin` annotation on model for IDE support
- [ ] Builder methods tested independently
- [ ] No overriding of core builder methods (`where`, `get`, `first`)
- [ ] No business logic (external calls, calculations) in builder methods
- [ ] Builder state not shared across separate queries

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Place custom builders in `Builders/` directory: `app/Models/Builders/UserBuilder.php`
- [ ] Architecture guideline: - Use descriptive, domain-oriented method names
- [ ] Architecture guideline: - Keep custom builder methods fluent (always return `static`)
- [ ] Architecture guideline: - Don't put business logic (calculations, external calls) in builder methods â€” only query const...
- [ ] Architecture guideline: - Combine custom builders with the Query Object pattern for complex multi-model scenarios
- [ ] Decision: Custom Builder vs Local Scopes vs Query Object - ensure correct choice is made
- [ ] Decision: Registration Method (HasBuilder vs newEloquentBuilder) - ensure correct choice is made
- [ ] Decision: Builder Method Design and Return Types - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Custom Builder Pattern for Rich Query APIs

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
- [ ] Custom builder registered via `HasBuilder` trait or `newEloquentBuilder()` override
- [ ] Custom class extends `Illuminate\Database\Eloquent\Builder`
- [ ] All fluent methods return `: static`
- [ ] `@mixin` annotation on model for IDE support
- [ ] Builder methods tested independently
- [ ] No overriding of core builder methods (`where`, `get`, `first`)
- [ ] No business logic (external calls, calculations) in builder methods

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
- Implement Custom Builder Pattern for Rich Query APIs
### Decision Trees (from 07)
- Custom Builder vs Local Scopes vs Query Object
- Registration Method (HasBuilder vs newEloquentBuilder)
- Builder Method Design and Return Types
### Related Rules (from 06 skills)
- Only Create Custom Builders for Models with 5+ Distinct Query Methods (query-strategy/custom-builder-pattern)
- Register Custom Builders via HasBuilder Trait (query-strategy/custom-builder-pattern)
- Always Return : static from Fluent Custom Builder Methods (query-strategy/custom-builder-pattern)
- Never Override Core Builder Methods (query-strategy/custom-builder-pattern)
- Place Custom Builder Classes in app/Models/Builders/ Directory (query-strategy/custom-builder-pattern)
- Never Place Business Logic in Builder Methods (query-strategy/custom-builder-pattern)
- Add @mixin Annotation on Model for IDE Autocompletion (query-strategy/custom-builder-pattern)
### Related Skills (from 06 skills)
- Implement Domain-Specific Query Methods on Custom Builders
- Implement Local Scopes for Reusable Constraints
- Compose Fluent Eloquent Query Chains with Correct Termination

