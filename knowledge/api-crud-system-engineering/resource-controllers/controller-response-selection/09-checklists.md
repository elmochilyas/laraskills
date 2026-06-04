# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Controller Response Selection
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Controller Response Selection implementation follows resource-controllers patterns
- [ ] All edge cases handled for Controller Response Selection
- [ ] Full test coverage for Controller Response Selection
- [ ] Security review completed for Controller Response Selection
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Controller Response Selection
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Standardize the response structure across all API controllers with a custom response macro or trait.
- [ ] Chain `->response()->setStatusCode(201)` on API resources for store actions.
- [ ] Use `PhotoResource::collection($photos)` for index instead of manually mapping.
- [ ] Never return views, redirects, or HTML from API controllers.
- [ ] Return `$photo->fresh()` after update to ensure the response has the latest data.
- [ ] Evaluate: Status Code Selection Per Action

---

# Implementation Checklist

- [ ] Store returns 201 with resource JSON (not 200)
- [ ] Destroy returns 204 with no body (not 200 with null data)
- [ ] Update returns 200 with resource JSON (or 204 if convention says no body)
- [ ] Index returns 200 with collection/paginator
- [ ] Show returns 200 with single resource
- [ ] Paginated responses include pagination meta automatically
- [ ] Error responses return consistent error shape
- [ ] No response returns raw `json_encode()` output
- [ ] API Resource classes are used for model responses â€” not manual arrays
- [ ] Implement Controller Response Selection following resource-controllers patterns
- [ ] Configure all required settings for Controller Response Selection
- [ ] Register route/middleware/service for Controller Response Selection
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] API resource serialization overhead is proportional to loaded relationships â€” preload to avoid N+1.
- [ ] `response()->noContent()` is the fastest response (no body, no serialization).
- [ ] Response macros add negligible overhead (one extra method call).
- [ ] JSON encoding time scales with payload size â€” paginate collections.

---

# Security Checklist

- [ ] API resources control attribute exposure â€” never return raw models.
- [ ] Status codes can leak information (e.g., 403 vs 404 for resource existence).
- [ ] Ensure `Content-Type: application/json` is set on all API responses.
- [ ] Debug output (debugbar, whoops) must be disabled for API requests.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] index returns 200 with resource collection
- [ ] store returns 201 with the created resource
- [ ] show returns 200 with the resource
- [ ] update returns 200 with the updated resource (using fresh())
- [ ] destroy returns 204 via `response()->noContent()`
- [ ] All model responses use API resources, not raw models
- [ ] Response structure is consistent across all endpoints
- [ ] No 200 responses with error bodies
- [ ] Write feature tests for happy path of Controller Response Selection
- [ ] Write feature tests for validation failure of Controller Response Selection
- [ ] Write feature tests for authentication failure of Controller Response Selection
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

- [ ] Avoid: Inconsistent Response Types
- [ ] Avoid: Manual JSON Response Construction
- [ ] Avoid: Wrong HTTP Status Codes
- [ ] Avoid: No Response Type Standardization
- [ ] Avoid: Response Logic Mixed with Business Logic

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
- Always Use Standardized Status Codes Per Action
- Always Use response()->noContent() For Delete
- Return Fresh Data After Update
- Never Return Raw Models
- Never Return 200 With Error Body
- Standardize Response Envelope With Macros

### Decisions
- Status Code Selection Per Action

### Anti-Patterns
- Inconsistent Response Types
- Manual JSON Response Construction
- Wrong HTTP Status Codes
- No Response Type Standardization
- Response Logic Mixed with Business Logic

## Related Knowledge
- API Resource Controllers â€” The five-method pattern
- Eloquent API Resources â€” Transforming models to JSON
- Controller Action Delegation â€” Delegation keeps response selection simple



