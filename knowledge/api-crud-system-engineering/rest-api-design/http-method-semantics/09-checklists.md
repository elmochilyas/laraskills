# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** rest-api-design
**Knowledge Unit:** HTTP Method Semantics
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] HTTP Method Semantics implementation follows rest-api-design patterns
- [ ] All edge cases handled for HTTP Method Semantics
- [ ] Full test coverage for HTTP Method Semantics
- [ ] Security review completed for HTTP Method Semantics
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for HTTP Method Semantics
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Map CRUD operations to standard routes: `GET /resources` â†’ index, `POST /resources` â†’ store, `GET /resources/{id}` â†’ show, `PUT/PATCH /resources/{id}` â†’ update, `DELETE /resources/{id}` â†’ destroy.
- [ ] For custom actions alongside resources, use explicit POST routes â€” don't add non-standard methods to resource controllers.
- [ ] Use `Route::apiResource()` for CRUD endpoints â€” it excludes `create` and `edit` routes that are for web forms.
- [ ] Document whether PUT vs PATCH is expected for each update endpoint â€” client confusion between them is common.
- [ ] Consider using only PATCH for all updates if client developers consistently confuse PUT and PATCH.

---

# Implementation Checklist

- [ ] GET endpoints never modify server state
- [ ] DELETE endpoints return 204 and are idempotent
- [ ] POST endpoints that need idempotency implement `Idempotency-Key` header
- [ ] PUT requires and replaces full resource representation
- [ ] PATCH accepts only changed fields via `sometimes` rules
- [ ] No `create` or `edit` routes in API (using `apiResource`)
- [ ] No verbs in URI paths â€” HTTP methods encode actions
- [ ] Action endpoints use POST, not PATCH/GET
- [ ] Method spoofing not accepted on API routes
- [ ] Implement HTTP Method Semantics following rest-api-design patterns
- [ ] Configure all required settings for HTTP Method Semantics
- [ ] Register route/middleware/service for HTTP Method Semantics
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] GET responses can be cached at every layer (browser, CDN, reverse proxy, server) â€” the primary performance advantage of proper method selection.
- [ ] HEAD requests return headers without body â€” use for resource existence checks (cheaper than GET).
- [ ] POST, PUT, PATCH require request body parsing and validation â€” GET with query parameters avoids body parsing overhead.
- [ ] Method-based dispatching is optimized in Laravel's router â€” route caching improves registration time.

---

# Security Checklist

- [ ] GET requests must never modify server state â€” violating this breaks caching, prefetching, and automated crawlers.
- [ ] POST is the only non-safe, non-idempotent method â€” use for operations that should not be automatically retried.
- [ ] Method spoofing (`_method` field) must not be accepted for API routes â€” it's for HTML forms behind browser restrictions.
- [ ] 405 Method Not Allowed is returned automatically by Laravel for method mismatches â€” ensure error response format matches API conventions.
- [ ] PUT can create resources if they don't exist (per HTTP spec) â€” explicitly handle this if the behavior is not desired.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] GET endpoints never modify server state (safe by construction).
- [ ] DELETE endpoints return 204 and are idempotent (second call also returns 204).
- [ ] POST endpoints that need idempotency implement `Idempotency-Key` support.
- [ ] PUT requires and replaces the full resource representation.
- [ ] PATCH accepts and processes only the fields the client sends.
- [ ] No `create` or `edit` routes exist for API endpoints (use `apiResource`).
- [ ] HEAD requests return the same headers as GET without the body.
- [ ] Write feature tests for happy path of HTTP Method Semantics
- [ ] Write feature tests for validation failure of HTTP Method Semantics
- [ ] Write feature tests for authentication failure of HTTP Method Semantics
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

- [ ] Avoid: POST Everything
- [ ] Avoid: GET for Writes
- [ ] Avoid: PUT for Partial Updates
- [ ] Avoid: DELETE with Body
- [ ] Avoid: Custom Methods in URL

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
- Use GET For All Read Operations
- Use POST For All Operations That Create Resources
- Return 204 For Successful DELETE
- Use PATCH For Partial Updates, PUT For Full Replacement
- Use POST For Actions That Don't Map To CRUD
- Use Route::apiResource() For CRUD Endpoints
- Use HEAD For Resource Existence Checks
- Never Send Request Body With DELETE
- Do Not Accept Method Spoofing For API Routes

### Anti-Patterns
- POST Everything
- GET for Writes
- PUT for Partial Updates
- DELETE with Body
- Custom Methods in URL

## Related Knowledge
- Prerequisites
- Related
- Advanced



