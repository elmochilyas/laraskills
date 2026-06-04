# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** input-validation-architecture
**Knowledge Unit:** Form Request Testing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Form Request Testing implementation follows input-validation-architecture patterns
- [ ] All edge cases handled for Form Request Testing
- [ ] Full test coverage for Form Request Testing
- [ ] Security review completed for Form Request Testing
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Form Request Testing
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Create a `ValidatesFormRequest` trait with reusable assertion helpers.
- [ ] Test rules via `Validator::make()` using the rules from the FormRequest class.
- [ ] Use HTTP tests to verify error response shape, status code, and headers.
- [ ] Use `@testWith` for exhaustive edge case coverage of each field.
- [ ] Test `prepareForValidation()` transformations separately.
- [ ] Test `failedValidation()` custom error shapes via HTTP tests.
- [ ] Run validation tests in CI before the full test suite â€” they catch most regressions fast.

---

# Implementation Checklist

- [ ] Every `required` field is tested with missing data
- [ ] Every format rule is tested with invalid format
- [ ] Every conditional rule is tested with both true and false conditions
- [ ] Custom rule classes are tested independently before Form Request integration
- [ ] Error messages are asserted by key and content
- [ ] Boundary values are tested (`max:255` with 256 chars)
- [ ] Valid data tests confirm the Form Request passes
- [ ] Implement Form Request Testing following input-validation-architecture patterns
- [ ] Configure all required settings for Form Request Testing
- [ ] Register route/middleware/service for Form Request Testing
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Unit validation tests run in milliseconds â€” prefer them for most coverage.
- [ ] HTTP tests should cover only key validations â€” not every edge case.
- [ ] Use `RefreshDatabase` sparingly â€” it adds seconds per test class.
- [ ] Mock external services in HTTP tests to avoid network calls.
- [ ] Group validation tests into a fast CI stage separate from slower integration tests.

---

# Security Checklist

- [ ] Test authorization failure scenarios (403 responses).
- [ ] Test that validation errors don't leak sensitive data.
- [ ] Test boundary value handling for security edge cases.
- [ ] Test that `exclude_if` and `prohibited_if` work correctly.
- [ ] Test that `prepareForValidation()` doesn't introduce security vulnerabilities.
- [ ] Test that validation rules are not bypassed by manipulating input structure.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every FormRequest has a corresponding test class
- [ ] Both passing and failing cases are tested for each rule
- [ ] Unit tests via `Validator::make()` exist for fast rule validation
- [ ] HTTP tests verify error response shape and status codes
- [ ] `authorize()` is tested separately for security boundary
- [ ] Boundary values are tested for all constrained fields
- [ ] Tests run in CI before full test suite (fast validation gate)
- [ ] Write feature tests for happy path of Form Request Testing
- [ ] Write feature tests for validation failure of Form Request Testing
- [ ] Write feature tests for authentication failure of Form Request Testing
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

- [ ] Avoid: Testing All Rules Only via HTTP
- [ ] Avoid: No Negative Testing
- [ ] Avoid: Testing Error Message Text Exactly
- [ ] Avoid: Skipping Authorization Tests
- [ ] Avoid: One Test Per FormRequest

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
- Test Both Pass and Fail for Every Rule
- Use Validator::make() for Fast Unit Tests
- Create a Shared ValidatesFormRequest Trait
- Test authorize() in a Separate Test Class
- Test Boundary Values for Every Constrained Field
- Map Every Rule to at Least One Test

### Anti-Patterns
- Testing All Rules Only via HTTP
- No Negative Testing
- Testing Error Message Text Exactly
- Skipping Authorization Tests
- One Test Per FormRequest

## Related Knowledge
- Form Request Design for APIs (the request class being tested)
- Validation Error Shape Customization (testing custom error responses)
- Authorization in Form Requests (testing authorize() method)
- Manual Validator Creation (testing manual validation logic)
- Bulk Request Validation (testing bulk validation behavior)



