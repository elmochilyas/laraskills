# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** After Validation Hooks
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `withValidator()` used instead of overriding `validator()`
- [ ] `after()` callback registered inside `withValidator()`
- [ ] No database queries or heavy I/O in `withValidator()`
- [ ] No request mutations inside `after()` callback
- [ ] Error messages added to specific fields via `errors()->add()`
- [ ] Tests cover both valid and invalid cross-field scenarios

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - `withValidator()` fires during `getValidatorInstance()`, which is called inside `validateResolv...
- [ ] Architecture guideline: - `after()` callbacks are registered inside `withValidator()` but execute during `$instance->fail...
- [ ] Architecture guideline: - `after()` callbacks fire even when main rules fail â€” useful for cross-field checks that shoul...
- [ ] Architecture guideline: - `passedValidation()` only fires when all rules pass â€” safe for success-only side effects
- [ ] Architecture guideline: - `failedValidation()` default implementation throws `ValidationException` â€” can be overridden ...
- [ ] Architecture guideline: - Multiple `after()` callbacks can be registered; they execute in registration order
- [ ] Decision: withValidator() vs Overriding validator() for Validator Modification - ensure correct choice is made
- [ ] Decision: passedValidation() vs Controller-Side Post-Validation Logic - ensure correct choice is made
- [ ] Decision: after() Callback vs Custom Rule Class for Cross-Field Validation - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Cross-Field Validation Using withValidator and after
- [ ] Skill applied: Implement Post-Validation Side Effects Using passedValidation
- [ ] Skill applied: Implement Custom Error Responses Using failedValidation

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
- [ ] `withValidator()` used instead of overriding `validator()`
- [ ] `after()` callback registered inside `withValidator()`
- [ ] No database queries or heavy I/O in `withValidator()`
- [ ] No request mutations inside `after()` callback
- [ ] Error messages added to specific fields via `errors()->add()`
- [ ] Tests cover both valid and invalid cross-field scenarios

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Business Logic in passedValidation() -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Throwing Exceptions in after() Callbacks -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Mutating Request Data in after() Callbacks -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Overriding validator() Instead of Using withValidator() -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Database Queries in withValidator() -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Silent Failure in failedValidation() -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Not Checking fails() Before Expensive after() Callbacks -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern

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
- Implement Cross-Field Validation Using withValidator and after
- Implement Post-Validation Side Effects Using passedValidation
- Implement Custom Error Responses Using failedValidation
### Decision Trees (from 07)
- withValidator() vs Overriding validator() for Validator Modification
- passedValidation() vs Controller-Side Post-Validation Logic
- after() Callback vs Custom Rule Class for Cross-Field Validation
### Anti-Patterns (from 08)
- Business Logic in passedValidation()
- Throwing Exceptions in after() Callbacks
- Mutating Request Data in after() Callbacks
- Overriding validator() Instead of Using withValidator()
- Database Queries in withValidator()
- Silent Failure in failedValidation()
- Not Checking fails() Before Expensive after() Callbacks
### Related Rules (from 06 skills)
- Rule 1: Use withValidator() for Validator Modification, Not Override
- Rule 4: Use Validator::after() for Cross-Field Validation
- Rule 7: Do Not Mutate Validated Data in after() Callbacks
### Related Skills (from 06 skills)
- Implement Post-Validation Side Effects Using passedValidation
- Implement Custom Error Responses Using failedValidation

