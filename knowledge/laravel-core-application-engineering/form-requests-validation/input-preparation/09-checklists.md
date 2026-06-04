# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Input Preparation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `prepareForValidation()` overridden where type coercion is needed
- [ ] `merge()` used for adding/overriding data
- [ ] No database queries or API calls in the method
- [ ] No authorization logic in the method
- [ ] Types coerced before validation rules execute
- [ ] Default values set for optional fields
- [ ] Raw values preserved before overwriting if needed for auditing
- [ ] Tests verify input is normalized before validation

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - `prepareForValidation()` is a no-op in the trait â€” override in FormRequest
- [ ] Architecture guideline: - `merge()` affects `validationData()` which defaults to `$request->all()`
- [ ] Architecture guideline: - `replace()` overwrites the entire ParameterBag; `merge()` adds individual keys
- [ ] Architecture guideline: - `passedValidation()` fires after validation passes â€” modifying request at this point does NOT...
- [ ] Architecture guideline: - `validationData()` can be overridden to return a different data source for the validator
- [ ] Architecture guideline: - Cast values using PHP functions: `filter_var()`, `(float)`, `array_map()`
- [ ] Decision: prepareForValidation() vs passedValidation() for Data Transformation - ensure correct choice is made
- [ ] Decision: merge() vs replace() for Input Mutation - ensure correct choice is made
- [ ] Decision: Input Preparation in FormRequest vs Service Layer - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Normalize Request Input Using prepareForValidation

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
- [ ] `prepareForValidation()` overridden where type coercion is needed
- [ ] `merge()` used for adding/overriding data
- [ ] No database queries or API calls in the method
- [ ] No authorization logic in the method
- [ ] Types coerced before validation rules execute
- [ ] Default values set for optional fields
- [ ] Raw values preserved before overwriting if needed for auditing

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Mutating $this->request in prepareForValidation() -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Heavy Operations in prepareForValidation() -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Validation Rules That Depend on Mutated Input Without Explicit Ordering -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Null Coalescing That Masks Missing Required Fields -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Stripping or Sanitizing Input Without Documentation -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Input Preparation That Depends on Authorized User Data -- apply preferred alternative
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
- Normalize Request Input Using prepareForValidation
### Decision Trees (from 07)
- prepareForValidation() vs passedValidation() for Data Transformation
- merge() vs replace() for Input Mutation
- Input Preparation in FormRequest vs Service Layer
### Anti-Patterns (from 08)
- Mutating $this->request in prepareForValidation()
- Heavy Operations in prepareForValidation()
- Validation Rules That Depend on Mutated Input Without Explicit Ordering
- Null Coalescing That Masks Missing Required Fields
- Stripping or Sanitizing Input Without Documentation
- Input Preparation That Depends on Authorized User Data
### Related Rules (from 06 skills)
- Rule 1: Use prepareForValidation() for Type Coercion Before Validation
- Rule 2: Do Not Execute Database Queries in prepareForValidation()
- Rule 3: Use merge() â€” Not passedValidation() â€” for Data Transformation
- Rule 4: Do Not Place Authorization Logic in prepareForValidation()
- Rule 5: Set Default Values for Optional Fields in prepareForValidation()
- Rule 6: Extract Raw Values Before Overwriting if Original Is Needed
### Related Skills (from 06 skills)
- Implement Cross-Field Validation Using withValidator and after
- Bridge FormRequest to Typed DTO Using validated

