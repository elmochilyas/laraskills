# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Custom State Machine
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Use PHP Backed Enums for State Representation
- [ ] Enforce: Define All Transitions in a Single Visible Map
- [ ] Enforce: Separate Guard Conditions from Transition Execution Logic
- [ ] Enforce: Throw Domain-Specific Exceptions on Invalid Transitions
- [ ] Enforce: Keep State Machine Logic Out of Controllers and Actions
- [ ] Enforce: Test Every Valid and Invalid Transition Path
- [ ] Enforce: Cast the State Column Using Eloquent's Enum or Custom Cast
- [ ] Performance: - Custom state machines add zero overhead beyond the enum cast and guard checks
- [ ] Performance: - Guard checks are typically fast (property comparisons, simple validations)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - State enum in `App\Enums\`
- [ ] Architecture guideline: - Transition map defined as a method on the enum or a dedicated enum method
- [ ] Architecture guideline: - Guards are separate classes or methods, not inline in transition logic
- [ ] Architecture guideline: - The model calls the state machine helper method for transitions

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Use PHP Backed Enums for State Representation
- [ ] Apply rule: Define All Transitions in a Single Visible Map
- [ ] Apply rule: Separate Guard Conditions from Transition Execution Logic
- [ ] Apply rule: Throw Domain-Specific Exceptions on Invalid Transitions
- [ ] Apply rule: Keep State Machine Logic Out of Controllers and Actions
- [ ] Apply rule: Test Every Valid and Invalid Transition Path
- [ ] Apply rule: Cast the State Column Using Eloquent's Enum or Custom Cast

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Custom state machines add zero overhead beyond the enum cast and guard checks
- [ ] - Guard checks are typically fast (property comparisons, simple validations)

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
- Use PHP Backed Enums for State Representation
- Define All Transitions in a Single Visible Map
- Separate Guard Conditions from Transition Execution Logic
- Throw Domain-Specific Exceptions on Invalid Transitions
- Keep State Machine Logic Out of Controllers and Actions
- Test Every Valid and Invalid Transition Path
- Cast the State Column Using Eloquent's Enum or Custom Cast

