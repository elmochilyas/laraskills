# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** input-validation-architecture
**Knowledge Unit:** Authorization In Form Requests
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Authorization In Form Requests implementation follows input-validation-architecture patterns
- [ ] All edge cases handled for Authorization In Form Requests
- [ ] Full test coverage for Authorization In Form Requests
- [ ] Security review completed for Authorization In Form Requests
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Authorization In Form Requests
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] `authorize()` should be a single-line delegation to a Gate or Policy: `return $this->user()->can('create', Post::class)`.
- [ ] For complex logic (admin bypass, multi-role), keep it readable with early returns.
- [ ] Pass additional context to policies via array: `$this->user()->can('create', [Post::class, $teamId])`.
- [ ] Override `failedAuthorization()` in base `ApiRequest` for consistent 403 error shape.
- [ ] Use `can:ability,model` middleware for simple gates â€” keep FormRequest authorize() for complex logic only.
- [ ] Ensure route model binding resolves the model before `authorize()` runs.

---

# Implementation Checklist

- [ ] authorize() method implemented
- [ ] Authentication check
- [ ] Permission/role check
- [ ] Returns false for unauthorized â†’ 403
- [ ] Uses Policy gates
- [ ] Tested with authorized and unauthorized users
- [ ] Implement Authorization In Form Requests following input-validation-architecture patterns
- [ ] Configure all required settings for Authorization In Form Requests
- [ ] Register route/middleware/service for Authorization In Form Requests
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] `authorize()` runs on every request to a guarded endpoint â€” avoid unnecessary queries.
- [ ] Use route model binding to eager-load resources, avoiding a second query in `authorize()`.
- [ ] Avoid loading `$this->user()->load('roles.permissions')` inside `authorize()` â€” preload in middleware.
- [ ] Cache Policy instances; they are resolved per-request by the container.

---

# Security Checklist

- [ ] Never distinguish "resource not found" from "forbidden" in error responses â€” prevents enumeration.
- [ ] `authorize()` runs before validation â€” cannot use request body data for authorization decisions.
- [ ] Ensure `auth:api` middleware is applied to the route before the FormRequest resolves.
- [ ] `authorize()` defaults to `false` if no return statement â€” always return explicitly.
- [ ] Policy auto-discovery requires model naming convention.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every FormRequest has an explicit `authorize()` method
- [ ] `authorize()` delegates to Policy/Gate, not manual checks
- [ ] `$this->user()` is used instead of `auth()->user()`
- [ ] `auth` middleware is applied before controller resolution
- [ ] `failedAuthorization()` is overridden in base class for JSON response
- [ ] No `null` user scenarios exist in authorization logic
- [ ] Integration tests verify authorization failures return 403 with correct shape
- [ ] Write feature tests for happy path of Authorization In Form Requests
- [ ] Write feature tests for validation failure of Authorization In Form Requests
- [ ] Write feature tests for authentication failure of Authorization In Form Requests
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

- [ ] Avoid: authorize in Controller Instead of FormRequest
- [ ] Avoid: Manual Ownership Checks Without Policy
- [ ] Avoid: authorize With Business Logic Side Effects
- [ ] Avoid: Single authorize for All Actions
- [ ] Avoid: authorize With DB Queries That Could Fail

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
- Always Return bool Explicitly in authorize()
- Delegate to Policies, Not Manual Checks
- Ensure auth Middleware Runs Before FormRequest Resolution
- Use $this->user(), Not auth()->user()
- Override failedAuthorization() in Base ApiRequest
- Use $this->route('param') for Route Model Access
- Never Distinguish 404 from 403 in Error Responses

### Anti-Patterns
- authorize in Controller Instead of FormRequest
- Manual Ownership Checks Without Policy
- authorize With Business Logic Side Effects
- Single authorize for All Actions
- authorize With DB Queries That Could Fail

## Related Knowledge
- Form Request Design for APIs (structure hosting authorize())
- Laravel Gates and Policies (the authorization backend)
- Authentication Error Responses (401 vs 403 distinction)
- Conditional Validation Patterns (authorize() interaction with conditional rules)
- DTO Integration: payload() Method (authorized data flowing to DTOs)



