# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Design
**Knowledge Unit:** Trait Decomposition
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Use `boot{TraitName}` for Event and Scope Registration
- [ ] Enforce: Use `initialize{TraitName}` for Default Attribute Values
- [ ] Enforce: Name Traits with `Has`, `InteractsWith`, or `Is` Prefixes
- [ ] Enforce: Keep Traits in `App\Models\Concerns`
- [ ] Enforce: Never Use Traits for Single-Model Behavior
- [ ] Enforce: Document Trait-to-Trait Dependencies Explicitly
- [ ] Enforce: Resolve Trait Method Conflicts Explicitly
- [ ] Enforce: Keep Traits Focused on a Single Concern
- [ ] Enforce: Prefer Observers Over Traits for Complex Event Logic
- [ ] Enforce: Prefer Custom Casts Over Traits for Attribute Transformation
- [ ] Trait name follows `Has`/`InteractsWith`/`Is` prefix convention
- [ ] Trait is in `app/Models/Concerns/` directory
- [ ] `boot{TraitName}()` used for event registration / scope setup
- [ ] `initialize{TraitName}()` used for default attribute values and casts
- [ ] Trait is self-contained with documented dependencies
- [ ] Trait does not override the model's `boot()` method
- [ ] Complex event logic uses observers instead of trait boot methods
- [ ] Attribute transformation uses custom casts instead of trait accessors/mutators
- [ ] Performance: - Trait boot methods run once per model class, not per instance â€” negligible

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Traits in `App\Models\Concerns\*` or alongside the model
- [ ] Architecture guideline: - `boot{TraitName}` registers event listeners and scopes
- [ ] Architecture guideline: - `initialize{TraitName}` sets default attribute values
- [ ] Architecture guideline: - Traits should not depend on other package traits without clear documentation

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Use `boot{TraitName}` for Event and Scope Registration
- [ ] Apply rule: Use `initialize{TraitName}` for Default Attribute Values
- [ ] Apply rule: Name Traits with `Has`, `InteractsWith`, or `Is` Prefixes
- [ ] Apply rule: Keep Traits in `App\Models\Concerns`
- [ ] Apply rule: Never Use Traits for Single-Model Behavior
- [ ] Apply rule: Document Trait-to-Trait Dependencies Explicitly
- [ ] Apply rule: Resolve Trait Method Conflicts Explicitly
- [ ] Apply rule: Keep Traits Focused on a Single Concern
- [ ] Apply rule: Prefer Observers Over Traits for Complex Event Logic
- [ ] Apply rule: Prefer Custom Casts Over Traits for Attribute Transformation
- [ ] Skill applied: Decompose Cross-Cutting Model Behavior into Traits

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Trait boot methods run once per model class, not per instance â€” negligible
- [ ] - Initialize methods run once per new model instance â€” fast for simple assignments

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
- [ ] Trait name follows `Has`/`InteractsWith`/`Is` prefix convention
- [ ] Trait is in `app/Models/Concerns/` directory
- [ ] `boot{TraitName}()` used for event registration / scope setup
- [ ] `initialize{TraitName}()` used for default attribute values and casts
- [ ] Trait is self-contained with documented dependencies
- [ ] Trait does not override the model's `boot()` method
- [ ] Complex event logic uses observers instead of trait boot methods

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
- Use `boot{TraitName}` for Event and Scope Registration
- Use `initialize{TraitName}` for Default Attribute Values
- Name Traits with `Has`, `InteractsWith`, or `Is` Prefixes
- Keep Traits in `App\Models\Concerns`
- Never Use Traits for Single-Model Behavior
- Document Trait-to-Trait Dependencies Explicitly
- Resolve Trait Method Conflicts Explicitly
- Keep Traits Focused on a Single Concern
- Prefer Observers Over Traits for Complex Event Logic
- Prefer Custom Casts Over Traits for Attribute Transformation
### Skills (from 06)
- Decompose Cross-Cutting Model Behavior into Traits
### Related Rules (from 06 skills)
- Use `boot{TraitName}` for Event and Scope Registration
- Use `initialize{TraitName}` for Default Attribute Values
- Name Traits with `Has`, `InteractsWith`, or `Is` Prefixes
- Keep Traits in `App\Models\Concerns`
- Prefer Observers Over Traits for Complex Event Logic
- Prefer Custom Casts Over Traits for Attribute Transformation
### Related Skills (from 06 skills)
- Trait Boot Convention for Lifecycle Hooks
- Trait Init Convention for Instance Defaults
- Trait Boot Ordering for Composition

