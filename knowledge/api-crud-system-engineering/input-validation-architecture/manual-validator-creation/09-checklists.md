# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** input-validation-architecture
**Knowledge Unit:** Manual Validator Creation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Manual Validator Creation implementation follows input-validation-architecture patterns
- [ ] All edge cases handled for Manual Validator Creation
- [ ] Full test coverage for Manual Validator Creation
- [ ] Security review completed for Manual Validator Creation
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Manual Validator Creation
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Use `Validator::make()` in service/repository layers for defense-in-depth validation.
- [ ] Create reusable validation services for common validation patterns.
- [ ] Use `ValidationResult` object for rich return types instead of boolean + array.
- [ ] For batch processing, create a fresh `Validator` per item â€” they are not reusable.
- [ ] Do not throw `ValidationException` in queued jobs without proper exception handling.
- [ ] Use named arguments for `Validator::make()` parameters for readability.

---

# Implementation Checklist

- [ ] Rules array correctly reflects runtime conditions
- [ ] `$validator->validate()` throws `ValidationException` on failure
- [ ] Custom error messages are provided for user-facing rules
- [ ] Custom attributes rename dot-notation fields in error output
- [ ] Manual validation is wrapped in try/catch when custom error handling is needed
- [ ] Reusable manual validation logic is extracted â€” not duplicated
- [ ] Implement Manual Validator Creation following input-validation-architecture patterns
- [ ] Configure all required settings for Manual Validator Creation
- [ ] Register route/middleware/service for Manual Validator Creation
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] `Validator::make()` is cheap â€” use freely.
- [ ] Avoid recreating the same validator instance â€” cache rule sets for repeated validation.
- [ ] In loops (batch), each `Validator::make()` is independent â€” no reuse possible.
- [ ] Use `$stopOnFirstFailure` for single-item validation to avoid unnecessary rule evaluation.
- [ ] Validator instances are single-use â€” results cached after first `passes()`/`fails()`.

---

# Security Checklist

- [ ] Validation in service layer is defense-in-depth, not an alternative to FormRequest validation.
- [ ] Never trust data that bypassed FormRequest validation â€” always validate at the service boundary.
- [ ] Throwing `ValidationException` in services exposes validation details â€” ensure safe error messages.
- [ ] Log validation failures with context for anomaly detection.
- [ ] For batch processing, per-item errors should not leak data about other items.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] `Validator::make()` is not used as a replacement for FormRequest HTTP validation
- [ ] Validation result is checked (`passes()`/`fails()`) before accessing validated data
- [ ] `ValidationException` is caught in job contexts
- [ ] Rule arrays are consistent with FormRequest rules (or intentionally different)
- [ ] Custom messages and attributes are passed for consistent error formatting
- [ ] Batch processing creates fresh Validator per item
- [ ] Logging exists for manual validation failures
- [ ] Write feature tests for happy path of Manual Validator Creation
- [ ] Write feature tests for validation failure of Manual Validator Creation
- [ ] Write feature tests for authentication failure of Manual Validator Creation
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

- [ ] Avoid: Manual Validation Replacing FormRequest for HTTP
- [ ] Avoid: Validator::make With No Error Handling
- [ ] Avoid: Reusing Validator Instances
- [ ] Avoid: Throwing ValidationException in Jobs
- [ ] Avoid: Same Validation in FormRequest and Service Layer

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
- Use FormRequests for HTTP, Validator::make() for Non-HTTP
- Check passes() Before Calling validated()
- Use ValidationException for Service-Layer Validation
- Create Fresh Validator Per Item in Batch Processing
- Catch ValidationException in Queued Jobs
- Use Same Rule Arrays as FormRequests for Consistency
- Return ValidationResult for Batch Processing

### Anti-Patterns
- Manual Validation Replacing FormRequest for HTTP
- Validator::make With No Error Handling
- Reusing Validator Instances
- Throwing ValidationException in Jobs
- Same Validation in FormRequest and Service Layer

## Related Knowledge
- Form Request Design for APIs (rules design applied in manual context)
- Validation Error Shape Customization (customizing errors from manual validation)
- Custom Validation Rules (using custom rules in manual validation)
- After Validation Hooks (after() hooks with manual validator)
- Bulk Request Validation (manual validation for batch processing)



