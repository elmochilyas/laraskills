# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Custom Validation Rules
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Class implements `ValidationRule` interface
- [ ] `$fail()` used instead of throwing exceptions
- [ ] No side effects (DB writes, API calls) in `validate()`
- [ ] Messages are translatable where needed
- [ ] Descriptive class name (e.g., `ValidPostalCode`, `NotFutureDate`)
- [ ] Dependency injection used for required services
- [ ] Unit tests cover valid input, invalid input, and edge cases
- [ ] Database queries cached for repeated calls (array validation)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Rules extend `Illuminate\Contracts\Validation\ValidationRule` (Laravel 10+)
- [ ] Architecture guideline: - Rules in `app/Rules/` directory or co-located with feature modules
- [ ] Architecture guideline: - Closures are wrapped in `ClosureValidationRule` during parsing
- [ ] Architecture guideline: - `ValidationRuleParser::prepareRule()` handles the wrapping logic
- [ ] Architecture guideline: - The `$fail` closure is a boolean flag mechanism â€” not an exception
- [ ] Architecture guideline: - Translation files in `resources/lang/en/validation.php` for rule messages
- [ ] Decision: Invokable Rule Class vs Closure for Reusable Validation - ensure correct choice is made
- [ ] Decision: Custom Rule vs Validator::extend() Legacy Approach - ensure correct choice is made
- [ ] Decision: Custom Rule Placement: app/Rules/ vs Feature Directory - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Create and Use Invokable Custom Validation Rules
- [ ] Skill applied: Test Custom Validation Rules in Isolation

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
- [ ] Class implements `ValidationRule` interface
- [ ] `$fail()` used instead of throwing exceptions
- [ ] No side effects (DB writes, API calls) in `validate()`
- [ ] Messages are translatable where needed
- [ ] Descriptive class name (e.g., `ValidPostalCode`, `NotFutureDate`)
- [ ] Dependency injection used for required services
- [ ] Unit tests cover valid input, invalid input, and edge cases

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Throwing Exceptions Instead of Using $fail -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Side Effects in validate() Methods -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Instance State in ValidationRule Causing Cross-Field Pollution -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Using Legacy Validator::extend() in Laravel 10+ -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: N+1 Database Queries in Array Validation -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Missing Translation Integration -- apply preferred alternative
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
- Create and Use Invokable Custom Validation Rules
- Test Custom Validation Rules in Isolation
### Decision Trees (from 07)
- Invokable Rule Class vs Closure for Reusable Validation
- Custom Rule vs Validator::extend() Legacy Approach
- Custom Rule Placement: app/Rules/ vs Feature Directory
### Anti-Patterns (from 08)
- Throwing Exceptions Instead of Using $fail
- Side Effects in validate() Methods
- Instance State in ValidationRule Causing Cross-Field Pollution
- Using Legacy Validator::extend() in Laravel 10+
- N+1 Database Queries in Array Validation
- Missing Translation Integration
### Related Rules (from 06 skills)
- Rule 1: Prefer Invokable Classes Over Closures for Reusable Rules
- Rule 2: Use $fail() â€” Do Not Throw Exceptions in Custom Rules
- Rule 3: Do Not Perform Side Effects in validate()
- Rule 5: Use Descriptive Class Names for Custom Rules
- Rule 6: Cache or Batch Database Queries in Validation Rules
### Related Skills (from 06 skills)
- Test Custom Validation Rules in Isolation
- Apply Declarative Conditional Validation Rules

