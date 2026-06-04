# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** input-validation-architecture
**Knowledge Unit:** Validation Rule Array Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Validation Rule Array Design implementation follows input-validation-architecture patterns
- [ ] All edge cases handled for Validation Rule Array Design
- [ ] Full test coverage for Validation Rule Array Design
- [ ] Security review completed for Validation Rule Array Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Validation Rule Array Design
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Define array rules with parent type first: `'tags' => ['required', 'array', 'min:1', 'max:10']`.
- [ ] Follow with element rules: `'tags.*' => ['required', 'string', 'max:50', 'distinct']`.
- [ ] For conditional array rules, use exact wildcard paths in the condition parameter.
- [ ] Override error messages for wildcard fields to be client-friendly.
- [ ] Use `after()` hook for cross-item validation that `distinct` cannot handle (e.g., unique combinations).
- [ ] Unit test each wildcard rule independently with various array sizes.

---

# Implementation Checklist

- [ ] Rules are grouped logically (personal, financial, system)
- [ ] Type rules come before format rules, which come before business rules
- [ ] Conditional rules (`required_if`, `prohibited`) cover all state branches
- [ ] Unique rules correctly ignore current resource ID on updates
- [ ] Long rule arrays are extracted to private methods or separate classes
- [ ] Error messages match the dot-notation or aliased field names
- [ ] Rules for nested/array data use `*` wildcard notation
- [ ] No duplicate or contradictory rules exist
- [ ] Implement Validation Rule Array Design following input-validation-architecture patterns
- [ ] Configure all required settings for Validation Rule Array Design
- [ ] Register route/middleware/service for Validation Rule Array Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Wildcard rules expand to concrete rules per element â€” deep nesting (3+ levels) increases rule count exponentially.
- [ ] `distinct` is O(nÂ²) on unsorted arrays â€” sort before validation for large arrays.
- [ ] `exists` rules inside arrays execute one query per unique value â€” use `whereIn` to batch.
- [ ] `max` constraint on array size prevents DoS via massive payloads.
- [ ] Array limit of 50-100 items is typical for bulk endpoints.

---

# Security Checklist

- [ ] Always enforce `max` on array fields to prevent resource exhaustion attacks.
- [ ] Limit array depth to 2-3 levels to prevent complex malicious payloads.
- [ ] `distinct` on sensitive fields (emails) prevents enumeration via duplicate detection.
- [ ] Wildcard validation error messages may reveal array structure â€” keep messages generic.
- [ ] Deep wildcards combined with `exists` rules can be used for data enumeration â€” batch and rate-limit.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All array fields have `array` rule on the parent key
- [ ] All array fields have `min` and `max` constraints
- [ ] Wildcard `*` is used for element rules, not manual loops
- [ ] `distinct` is used only for scalar array values
- [ ] Deep nesting is limited to 3 wildcard levels maximum
- [ ] Conditional rules (`required_if`) use the full wildcard parent path
- [ ] Error messages for wildcard fields are overridden for clarity
- [ ] Write feature tests for happy path of Validation Rule Array Design
- [ ] Write feature tests for validation failure of Validation Rule Array Design
- [ ] Write feature tests for authentication failure of Validation Rule Array Design
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

- [ ] Avoid: Deep Nesting Beyond 3 Wildcards
- [ ] Avoid: No Array Size Limits
- [ ] Avoid: distinct for Object Uniqueness
- [ ] Avoid: Wildcard Rules Without Element Type
- [ ] Avoid: Manual foreach Validation in FormRequest

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
- Always Declare array Rule on Parent
- Always Add min and max on Array Fields
- Use Distinct for Scalar Arrays, after() for Object Arrays
- Limit Wildcard Depth to 2-3 Levels Maximum
- Use Exact Wildcard Paths in required_if
- Override Wildcard Error Messages for Clarity
- Validate Element Type After Wildcard

### Anti-Patterns
- Deep Nesting Beyond 3 Wildcards
- No Array Size Limits
- distinct for Object Uniqueness
- Wildcard Rules Without Element Type
- Manual foreach Validation in FormRequest

## Related Knowledge
- Form Request Design for APIs (base structure hosting array rules)
- Conditional Validation Patterns (combining wildcards with conditionals)
- Custom Validation Rules (applying custom rules to array elements)
- Bulk Request Validation (array validation for bulk endpoints)
- Pagination Parameter Validation (array validation for pagination meta)



