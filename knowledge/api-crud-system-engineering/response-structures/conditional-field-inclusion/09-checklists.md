# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Conditional Field Inclusion
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Conditional Field Inclusion implementation follows response-structures patterns
- [ ] All edge cases handled for Conditional Field Inclusion
- [ ] Full test coverage for Conditional Field Inclusion
- [ ] Security review completed for Conditional Field Inclusion
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Conditional Field Inclusion
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Use `whenHas()` to check model attribute existence rather than raw `when()` to avoid silent omissions.
- [ ] For client-requested fields, use `whenExistsInRequest()` to map request parameters to resource fields.
- [ ] Role-based conditions belong in the Resource but authorization check results should be passed in, not recomputed.
- [ ] Keep conditional logic in Resources, not in controllers â€” resources own the response shape.
- [ ] Document which fields are conditional so API documentation can indicate optionality.
- [ ] Evaluate: Conditional Field Method Selection
- [ ] Evaluate: Security vs Conditional Field Omission
- [ ] Evaluate: Conditional Explosion Management

---

# Implementation Checklist

- [ ] `when()` for boolean conditions
- [ ] `whenLoaded()` for optional relations
- [ ] `whenHas()` for pivot data
- [ ] `mergeWhen()` for conditional groups
- [ ] Authorization-gated fields use `when()`
- [ ] Sensitive fields protected by auth checks
- [ ] Field presence tested per condition
- [ ] Conditional fields documented
- [ ] Implement Conditional Field Inclusion following response-structures patterns
- [ ] Configure all required settings for Conditional Field Inclusion
- [ ] Register route/middleware/service for Conditional Field Inclusion
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Each `when()` call is a closure or boolean check â€” hundreds add up. Pre-compute conditions.
- [ ] `$this->relationLoaded('x')` is a fast property check â€” does not trigger a database query.
- [ ] When conditions are false, the serialized output is smaller â€” omitting 50% of fields produces measurably smaller responses.
- [ ] Too many condition variants fragment the response cache â€” each combination is a distinct cache entry.

---

# Security Checklist

- [ ] Role-based `when()` conditions are not a substitute for authorization middleware â€” they only control field visibility.
- [ ] A condition that always evaluates to false silently omits a field â€” the client receives no error. Critical for security fields that must never leak.
- [ ] `when(auth()->user()->isAdmin(), ...)` exposes authorization logic to anyone who can read the resource code â€” ensure this is acceptable.
- [ ] Cache poisoning risk: if conditional field visibility varies by role but responses are cached, lower-privilege users may receive privileged data.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every optional relationship field is wrapped in `whenLoaded()` or `when()`.
- [ ] No field returns `null` when the condition is false â€” keys are omitted, not null.
- [ ] Integration tests verify field presence/absence for each condition state.
- [ ] Nested `when()` calls inside `toArray()` sub-arrays are explicitly handled.
- [ ] Cache keys vary by all conditional factors (user role, request parameters, load state).
- [ ] Write feature tests for happy path of Conditional Field Inclusion
- [ ] Write feature tests for validation failure of Conditional Field Inclusion
- [ ] Write feature tests for authentication failure of Conditional Field Inclusion
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

- [ ] Avoid: Always Returning All Fields
- [ ] Avoid: No Sparse Fieldset Support
- [ ] Avoid: Conditional Logic Scattered in Resources
- [ ] Avoid: Missing Authorization on Conditional Fields
- [ ] Avoid: Overly Complex Conditional Logic

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
- Rule 1: Wrap Every Optional Field in `when()`
- Rule 2: Use `whenHas()` for Model Attribute Existence Checks
- Rule 3: Never Use `when()` as a Standalone Statement
- Rule 4: Use `whenNotNull()` for Computed or Accessor Values
- Rule 5: Never Substitute `when()` for Authorization Middleware
- Rule 6: Pre-compute Expensive Conditions Once
- Rule 7: Vary Cache Keys by All Conditional Factors

### Decisions
- Conditional Field Method Selection
- Security vs Conditional Field Omission
- Conditional Explosion Management

### Anti-Patterns
- Always Returning All Fields
- No Sparse Fieldset Support
- Conditional Logic Scattered in Resources
- Missing Authorization on Conditional Fields
- Overly Complex Conditional Logic

## Related Knowledge
- Prerequisites
- Related
- Advanced



