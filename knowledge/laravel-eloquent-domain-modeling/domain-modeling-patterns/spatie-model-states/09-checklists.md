# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Spatie Model States
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Define Allowed Transitions Explicitly in Each State Class
- [ ] Enforce: Use Transition Classes for Side Effects
- [ ] Enforce: Keep State Classes Focused on Transition Rules and State-Specific Behavior
- [ ] Enforce: Register the State Field Using StateCast in the Model's `$casts`
- [ ] Enforce: Use `transitionableStates()` for Validation, Not for UI Filtering
- [ ] Enforce: Test All Transitions with Actual Model Instances
- [ ] Enforce: Group State Classes by Entity in Dedicated Namespaces
- [ ] Performance: - State objects are resolved via the custom cast on each read
- [ ] Performance: - Transition validation runs before execution â€” minimal overhead
- [ ] Performance: - Complex transition classes with database operations should be transactional

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - State classes in `App\States\{Entity}\*` per domain entity
- [ ] Architecture guideline: - Transitions in `App\Transitions\{Entity}\*`
- [ ] Architecture guideline: - Register the state field in the model's `$casts` array using the package's `StateCast`
- [ ] Architecture guideline: - Use `$model->state->transitionTo(NewState::class)` for transitions

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Define Allowed Transitions Explicitly in Each State Class
- [ ] Apply rule: Use Transition Classes for Side Effects
- [ ] Apply rule: Keep State Classes Focused on Transition Rules and State-Specific Behavior
- [ ] Apply rule: Register the State Field Using StateCast in the Model's `$casts`
- [ ] Apply rule: Use `transitionableStates()` for Validation, Not for UI Filtering
- [ ] Apply rule: Test All Transitions with Actual Model Instances
- [ ] Apply rule: Group State Classes by Entity in Dedicated Namespaces

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - State objects are resolved via the custom cast on each read
- [ ] - Transition validation runs before execution â€” minimal overhead
- [ ] - Complex transition classes with database operations should be transactional

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
- Define Allowed Transitions Explicitly in Each State Class
- Use Transition Classes for Side Effects
- Keep State Classes Focused on Transition Rules and State-Specific Behavior
- Register the State Field Using StateCast in the Model's `$casts`
- Use `transitionableStates()` for Validation, Not for UI Filtering
- Test All Transitions with Actual Model Instances
- Group State Classes by Entity in Dedicated Namespaces

