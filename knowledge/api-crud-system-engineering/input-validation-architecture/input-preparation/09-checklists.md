# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** input-validation-architecture
**Knowledge Unit:** Input Preparation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Input Preparation implementation follows input-validation-architecture patterns
- [ ] All edge cases handled for Input Preparation
- [ ] Full test coverage for Input Preparation
- [ ] Security review completed for Input Preparation
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Input Preparation
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Use `prepareForValidation()` for sanitization, defaults, and coercion only.
- [ ] Extract complex transformation logic to dedicated methods.
- [ ] Apply defaults via `$this->input('key', $defaultValue)` for simplicity.
- [ ] Use `Request` macros for common sanitization patterns (sanitizeEmail, sanitizePhone).
- [ ] Preserve original input keys for audit trails when modifying values.
- [ ] Log prepared data keys at debug level for troubleshooting.

---

# Implementation Checklist

- [ ] All string inputs that accept user-entered text are trimmed
- [ ] Default values are merged for optional fields with fallbacks
- [ ] Server-derived data (IP, timestamp) is injected before validation
- [ ] No side effects (DB, API calls, events) in preparation
- [ ] Preparation is tested with both present and absent input values
- [ ] Normalization does not silently hide invalid data
- [ ] Implement Input Preparation following input-validation-architecture patterns
- [ ] Configure all required settings for Input Preparation
- [ ] Register route/middleware/service for Input Preparation
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] `prepareForValidation()` runs once per request â€” negligible overhead.
- [ ] Avoid DB queries in `prepareForValidation()` â€” they block validation.
- [ ] String operations (trim, regex) are fast â€” use freely.
- [ ] JSON decode on large strings may be slow â€” limit metadata field size.
- [ ] Type coercion is in-memory and instant.

---

# Security Checklist

- [ ] Sanitize HTML/JS from input to prevent stored XSS.
- [ ] Strip tags from description fields before storage.
- [ ] Type coercion without validation can produce unexpected results (`(int)` on non-numeric string = 0).
- [ ] Default values should not override explicit user intent â€” only apply to absent fields.
- [ ] Never sanitize in a way that removes malicious intent without alerting â€” log sanitization events.
- [ ] Preserve original values alongside sanitized versions for audit trails.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] `prepareForValidation()` contains only sanitization, coercion, and defaults
- [ ] No DB queries, job dispatches, or API calls in `prepareForValidation()`
- [ ] `merge()` is used instead of `replace()`
- [ ] Null input is handled with defaults or explicit checks
- [ ] Type coercion produces expected values before validation
- [ ] Original input keys are preserved when values are transformed
- [ ] Tests verify prepared data matches expected transformed values
- [ ] Write feature tests for happy path of Input Preparation
- [ ] Write feature tests for validation failure of Input Preparation
- [ ] Write feature tests for authentication failure of Input Preparation
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

- [ ] Avoid: prepareForValidation as Dumping Ground
- [ ] Avoid: Modifying Input After authorize
- [ ] Avoid: Sensitive Data Manipulation
- [ ] Avoid: Replacing Entire Input With replace
- [ ] Avoid: Over-Sanitization

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
- Use merge() Over replace()
- Keep Transformations Focused
- Never Perform Side Effects in prepareForValidation()
- Type-Coerce Before Validation
- Handle Null Input Gracefully
- Don't Modify Data Used in authorize()
- Preserve Original Input Keys for Audit Trails

### Anti-Patterns
- prepareForValidation as Dumping Ground
- Modifying Input After authorize
- Sensitive Data Manipulation
- Replacing Entire Input With replace
- Over-Sanitization

## Related Knowledge
- Form Request Design for APIs (the request class that hosts prepareForValidation)
- After Validation Hooks (post-validation hooks that complement pre-validation)
- Conditional Validation Patterns (how conditionals interact with prepared input)
- DTO Integration: payload() Method (prepared data flowing to DTO)
- Pagination Parameter Validation (paginate defaults through preparation)



