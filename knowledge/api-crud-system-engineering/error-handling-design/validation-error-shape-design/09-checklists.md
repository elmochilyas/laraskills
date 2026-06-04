# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Validation Error Shape Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Validation Error Shape Design implementation follows error-handling-design patterns
- [ ] All edge cases handled for Validation Error Shape Design
- [ ] Full test coverage for Validation Error Shape Design
- [ ] Security review completed for Validation Error Shape Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Validation Error Shape Design
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Normalise validation errors in a dedicated pipeline or middleware on the 422 response path.
- [ ] Flatten nested arrays to dot notation before response.
- [ ] Group messages per field (Laravel's `$errors` already groups by field).
- [ ] Strip HTML tags from messages using `strip_tags()` or `Str::stripTags()`.
- [ ] Override `failedValidation()` on Form Requests for custom 422 response shape.
- [ ] Register the normalisation pipeline in the exception handler for `ValidationException`.

---

# Implementation Checklist

- [ ] 422 returned for validation failures
- [ ] Field-level error messages included per failing field
- [ ] Error code per field (validation rule-specific)
- [ ] Source pointer included for each error
- [ ] Field naming consistent between request and response
- [ ] Overall validation error code included
- [ ] Validation error shape tested per form request
- [ ] Implement Validation Error Shape Design following error-handling-design patterns
- [ ] Configure all required settings for Validation Error Shape Design
- [ ] Register route/middleware/service for Validation Error Shape Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Validation error collection happens already in the Laravel lifecycle.
- [ ] Normalisation overhead is O(n) on number of failed fields (rarely > 20).
- [ ] Pre-serialising common validation shapes is unnecessary â€” errors vary per request.
- [ ] HTML stripping adds minimal overhead per message string.

---

# Security Checklist

- [ ] Never include the submitted value in validation error messages (e.g., `The email "attacker@test.com" is invalid`).
- [ ] Strip HTML/JS from validation messages to prevent XSS in error displays.
- [ ] Limit the number of returned validation fields to prevent response-based attacks.
- [ ] Do not reveal validation rules structure in field names that expose business logic.
- [ ] Log validation payload size â€” unusually large validation errors may indicate probing.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All 422 responses contain `detail.fields` with `{ field: [string] }` structure
- [ ] Nested array fields use dot notation (e.g., `items.0.qty`)
- [ ] No submitted values appear in any validation error message
- [ ] HTML tags are stripped from all validation messages
- [ ] Fields are sorted alphabetically in the response
- [ ] Maximum 50 fields returned per 422 response
- [ ] Integration tests verify validation error shape for every endpoint with input
- [ ] Write feature tests for happy path of Validation Error Shape Design
- [ ] Write feature tests for validation failure of Validation Error Shape Design
- [ ] Write feature tests for authentication failure of Validation Error Shape Design
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

- [ ] Avoid: Top-Level Message Only
- [ ] Avoid: Array of Error Objects
- [ ] Avoid: Machine Codes in Per-Field Messages
- [ ] Avoid: HTML in Validation Messages
- [ ] Avoid: Different Shape Per Locale

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
- Use Flat Field-Keyed Object for Validation Errors
- Always Return an Array of Messages Per Field, Never a Single String
- Use Dot Notation for Nested and Array Fields
- Never Include the Submitted Value in Validation Messages
- Strip HTML Tags from All Validation Messages
- Sort Fields Alphabetically in the Response
- Limit Fields Returned to 50 Maximum
- Override failedValidation() on Form Requests for Custom 422 Shape
- Normalise Validation Errors in a Global Pipeline

### Anti-Patterns
- Top-Level Message Only
- Array of Error Objects
- Machine Codes in Per-Field Messages
- HTML in Validation Messages
- Different Shape Per Locale

## Related Knowledge
- Standardized Error Envelope (validation detail lives inside the envelope)
- Form Request Design for APIs (source of validation rules)
- Validation Error Shape Customization (overriding default Laravel validation shapes)
- JSON:API Error Objects (alternative validation error format)
- Frontend form error handling integration



