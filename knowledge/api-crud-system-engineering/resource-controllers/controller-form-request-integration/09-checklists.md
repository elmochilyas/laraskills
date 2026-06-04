# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Controller Form Request Integration
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Controller Form Request Integration implementation follows resource-controllers patterns
- [ ] All edge cases handled for Controller Form Request Integration
- [ ] Full test coverage for Controller Form Request Integration
- [ ] Security review completed for Controller Form Request Integration
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Controller Form Request Integration
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Generate form requests with `php artisan make:request StorePhotoRequest`.
- [ ] Use `passedValidation()` and `failedValidation()` hooks for side effects.
- [ ] Log validation failures in `failedValidation()` for audit trails.
- [ ] Return custom error messages via `messages()` method for production APIs.
- [ ] Place form requests in `app/Http/Requests/` following the same domain organization as controllers.
- [ ] Evaluate: Form Request vs Inline Validation Decision

---

# Implementation Checklist

- [ ] Dedicated Form Request per action
- [ ] Injected in controller method signature
- [ ] validated() used for data access
- [ ] authorize() method implemented
- [ ] failedValidation() returns JSON
- [ ] Tested via integration tests
- [ ] Implement Controller Form Request Integration following resource-controllers patterns
- [ ] Configure all required settings for Controller Form Request Integration
- [ ] Register route/middleware/service for Controller Form Request Integration
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Simple validation rules take ~0.1ms per field.
- [ ] `unique` with `ignore` rules add a database query (~1-2ms).
- [ ] `authorize()` adds a policy resolution call â€” cache policy results if used repeatedly.
- [ ] `validated()` reuses the already-built validator, making it faster than `$request->only()`.

---

# Security Checklist

- [ ] Form requests are validated before the controller method executes â€” this is a security-by-design pattern.
- [ ] Never use `$request->all()` in controllers with form requests â€” bypasses validation entirely.
- [ ] Authorization in form requests returns 403 if denied â€” test both validation and authorization paths.
- [ ] Ensure `prepareForValidation()` doesn't introduce mass-assignment vulnerabilities.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Store and update actions use typed form requests (not plain `Request`)
- [ ] Controllers use `$request->validated()` (not `$request->all()`)
- [ ] Store and Update requests exist as separate classes
- [ ] `authorize()` method returns boolean (simple gate check)
- [ ] Validation failure returns 422 (tested)
- [ ] Authorization failure returns 403 (tested)
- [ ] Form request rules are unit tested independently from controller
- [ ] Write feature tests for happy path of Controller Form Request Integration
- [ ] Write feature tests for validation failure of Controller Form Request Integration
- [ ] Write feature tests for authentication failure of Controller Form Request Integration
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

- [ ] Avoid: Manual Validation Instead of Form Request
- [ ] Avoid: Missing Form Request Type Hint
- [ ] Avoid: Controller Duplicates Form Request Logic
- [ ] Avoid: Form Request Does Too Much
- [ ] Avoid: Inconsistent Form Request Usage

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
- Always Use Form Requests For Store And Update
- Always Use ->validated() Never ->all()
- Create Separate Store And Update Form Requests
- Keep authorize() Simple In Form Requests
- Test Form Request Rules Independently
- Log Validation Failures For Audit

### Decisions
- Form Request vs Inline Validation Decision

### Anti-Patterns
- Manual Validation Instead of Form Request
- Missing Form Request Type Hint
- Controller Duplicates Form Request Logic
- Form Request Does Too Much
- Inconsistent Form Request Usage

## Related Knowledge
- Controller Method Injection â€” How form requests are resolved
- Validation Rule Design â€” Defining comprehensive validation rules
- Controller Action Delegation â€” Delegating validated data to action classes



