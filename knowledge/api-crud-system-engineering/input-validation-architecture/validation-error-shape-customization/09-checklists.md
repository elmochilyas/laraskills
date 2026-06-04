# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** input-validation-architecture
**Knowledge Unit:** Validation Error Shape Customization
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Validation Error Shape Customization implementation follows input-validation-architecture patterns
- [ ] All edge cases handled for Validation Error Shape Customization
- [ ] Full test coverage for Validation Error Shape Customization
- [ ] Security review completed for Validation Error Shape Customization
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Validation Error Shape Customization
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Override `failedValidation()` in `App\Http\Requests\Api\ApiRequest`.
- [ ] Choose a format (JSON:API, flat, envelope) and use it consistently.
- [ ] For JSON:API, convert field names to `/data/attributes/` pointer format.
- [ ] For nested fields, use dot-notation to pointer conversion.
- [ ] Pass custom `$response` to `ValidationException` constructor for full control.
- [ ] Register a renderable callback in the exception handler for `ValidationException` as backup.
- [ ] Ensure custom formatting handles both simple and nested/wildcard field errors.

---

# Implementation Checklist

- [ ] `failedValidation()` overridden
- [ ] `errors` top-level key in response
- [ ] `status: '422'` as string
- [ ] `code` field present
- [ ] `detail` with human-readable messages
- [ ] `source.pointer` in JSON pointer format
- [ ] Consistent shape across requests
- [ ] Tested for all request types
- [ ] Implement Validation Error Shape Customization following input-validation-architecture patterns
- [ ] Configure all required settings for Validation Error Shape Customization
- [ ] Register route/middleware/service for Validation Error Shape Customization
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Custom error formatting adds overhead proportional to error count.
- [ ] `collect()` + `map()` is O(n) â€” negligible for typical validation errors (< 100 fields).
- [ ] Avoid DB queries in `failedValidation()` â€” it runs on every failed validation.
- [ ] Pre-compile error format structure if using the same format across all requests.

---

# Security Checklist

- [ ] Never include the submitted value in validation error messages (leaks PII).
- [ ] Strip HTML tags from error messages to prevent XSS in error displays.
- [ ] Do not reveal business logic rules in error field names.
- [ ] Ensure error messages don't expose database column names or internal structure.
- [ ] Log validation errors for monitoring but exclude raw request body.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] `failedValidation()` is overridden in the base `ApiRequest` class
- [ ] All endpoints return the same validation error format
- [ ] The error format is documented in the API contract
- [ ] No sensitive data (submitted values) appears in error messages
- [ ] Nested/wildcard fields use correct pointer format
- [ ] HTTP status is always 422 for validation errors
- [ ] Integration tests verify validation error shape across all endpoints
- [ ] Write feature tests for happy path of Validation Error Shape Customization
- [ ] Write feature tests for validation failure of Validation Error Shape Customization
- [ ] Write feature tests for authentication failure of Validation Error Shape Customization
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

- [ ] Avoid: Overriding failedValidation in Every FormRequest
- [ ] Avoid: Using Default Laravel Web Format for API
- [ ] Avoid: Including Raw Validation Rule Metadata
- [ ] Avoid: Translating Field Names Inconsistently
- [ ] Avoid: Custom Format Per API Version

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
- Override failedValidation() in the Base ApiRequest
- Always Throw HttpResponseException
- Use JSON:API Error Structure
- Convert Dot-Notation to Pointer Format
- Never Include Submitted Values in Error Messages
- Always Use HTTP 422 for Validation Errors
- Log Validation Errors Before Throwing

### Anti-Patterns
- Overriding failedValidation in Every FormRequest
- Using Default Laravel Web Format for API
- Including Raw Validation Rule Metadata
- Translating Field Names Inconsistently
- Custom Format Per API Version

## Related Knowledge
- Form Request Design for APIs (the request class where failedValidation() lives)
- Standardized Error Envelope (broader error response structure)
- Manual Validator Creation (customizing errors from manual validation)
- Form Request Testing (testing custom error responses)
- Error Handling Design (comprehensive error handling strategy)



