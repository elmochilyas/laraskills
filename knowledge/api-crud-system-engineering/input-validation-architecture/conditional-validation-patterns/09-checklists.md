# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** input-validation-architecture
**Knowledge Unit:** Conditional Validation Patterns
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Conditional Validation Patterns implementation follows input-validation-architecture patterns
- [ ] All edge cases handled for Conditional Validation Patterns
- [ ] Full test coverage for Conditional Validation Patterns
- [ ] Security review completed for Conditional Validation Patterns
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Conditional Validation Patterns
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Keep simple conditions in `rules()` using `Rule::when()`.
- [ ] Move complex multi-field conditions to `withValidator()`.
- [ ] Use `after()` hook for cross-field rules that cannot be expressed as attribute rules.
- [ ] Use `$validator->sometimes()` for conditions based on multiple input values.
- [ ] Prefer `prohibited_if` over `required_without` for mutually exclusive fields.
- [ ] Test each conditional branch independently.

---

# Implementation Checklist

- [ ] `required_if` for value-dependent requirements
- [ ] `required_with` for presence-dependent requirements
- [ ] `prohibited_if` for mutual exclusion
- [ ] `prohibits` for field-level prohibition
- [ ] `exclude_if` for conditional exclusion
- [ ] `Rule::when()` for complex conditions
- [ ] Tested with all condition combinations
- [ ] Implement Conditional Validation Patterns following input-validation-architecture patterns
- [ ] Configure all required settings for Conditional Validation Patterns
- [ ] Register route/middleware/service for Conditional Validation Patterns
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] `sometimes` checks are cheap â€” presence check only.
- [ ] `Validator::sometimes()` with closure runs the closure per field.
- [ ] `after()` hooks run once per request, not per field â€” most efficient cross-field location.
- [ ] Complex `required_if` chains are slower than a single `after()` hook.
- [ ] Closures in `rules()` cannot be serialized â€” use Rule classes for cached routes.

---

# Security Checklist

- [ ] Conditional logic that depends on user input must not allow privilege escalation.
- [ ] `exclude_if` prevents fields from appearing in `validated()` â€” ensure this doesn't bypass authorization.
- [ ] Test all conditional branches â€” untested branches are security vulnerabilities.
- [ ] `required_if` conditions based on user type/role must be paired with authorization checks.
- [ ] `prohibited_if` prevents fields from being submitted â€” validate this on write endpoints.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Conditional rules use `Rule::when()` for simple conditions
- [ ] Complex multi-field conditions use `withValidator()` / `after()`
- [ ] `sometimes` is used correctly (presence check) vs `nullable` (allows null)
- [ ] `required_if` paths match the exact input structure with wildcards
- [ ] `after()` checks for errors before adding new ones
- [ ] Each conditional branch has test coverage
- [ ] No excessive nesting of `Rule::when()` calls
- [ ] Write feature tests for happy path of Conditional Validation Patterns
- [ ] Write feature tests for validation failure of Conditional Validation Patterns
- [ ] Write feature tests for authentication failure of Conditional Validation Patterns
- [ ] Write unit tests for service/action/DTO classes
- [ ] Test edge cases: empty results, boundary values, null inputs

---

# Maintainability Checklist

- [ ] Follow PSR-12 coding standards
- [ ] Use type hints on all methods and properties
- [ ] Keep methods under 15 lines
- [ ] Use meaningful class and method names
- [ ] Add PHPDoc for public API methods

---

# Anti-Pattern Prevention Checklist

- [ ] Avoid: after Hook With No isEmpty Check
- [ ] Avoid: Conditional Logic Scattered Across Methods
- [ ] Avoid: Single Monolithic withValidator
- [ ] Avoid: Overusing sometimes on Every Field
- [ ] Avoid: Over-Nested Rule::when Calls

---

# Production Readiness Checklist

- [ ] Add structured logging for all operations
- [ ] Configure monitoring alerts for error rate spikes
- [ ] Implement health check endpoint
- [ ] Document rollback procedure
- [ ] Set up error tracking integration
- [ ] Configure proper CORS for production

---

# Final Approval Checklist

- [ ] Architecture checklist complete
- [ ] Security checklist complete
- [ ] Performance checklist complete
- [ ] Testing checklist complete
- [ ] Anti-pattern prevention checklist complete
- [ ] Production readiness checklist complete
- [ ] All items resolved before merge

---

# Related Knowledge

### Rules
- Use Rule::when() for Simple Binary Conditions
- Use sometimes for Presence, nullable for Optional Type
- Extract Complex Conditional Logic to Named Methods
- Prefer prohibited_if Over required_without for Mutual Exclusion
- Test Every Conditional Branch Independently
- Never Use Closures in rules() When Route Caching Is Required

### Anti-Patterns
- after Hook With No isEmpty Check
- Conditional Logic Scattered Across Methods
- Single Monolithic withValidator
- Overusing sometimes on Every Field
- Over-Nested Rule::when Calls

## Related Knowledge
- Form Request Design for APIs (base request hosting conditional rules)
- Validation Rule Array Design (conditional rules within array wildcards)
- Custom Validation Rules (custom rules with conditional logic)
- After Validation Hooks (post-validation hooks for cross-field checks)
- Input Preparation (preparing input before conditional rules evaluate)



