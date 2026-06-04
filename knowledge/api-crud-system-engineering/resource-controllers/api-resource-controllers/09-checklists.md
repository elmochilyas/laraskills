# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** API Resource Controllers
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] API Resource Controllers implementation follows resource-controllers patterns
- [ ] All edge cases handled for API Resource Controllers
- [ ] Full test coverage for API Resource Controllers
- [ ] Security review completed for API Resource Controllers
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for API Resource Controllers
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Default to `Route::apiResource()` for all `api.php` routes.
- [ ] Register response macros (`Response::macro('success', ...)`) to standardize API response envelopes.
- [ ] All five methods should be present in the controller, even if some are restricted (use `only()` on the route).
- [ ] Ensure `App\Exceptions\Handler` renders JSON for API routes, especially for validation errors.
- [ ] Use `php artisan make:controller PhotoController --api --resource` to generate the skeleton.
- [ ] Evaluate: API Controller Response Selection

---

# Implementation Checklist

- [ ] Controller generated with `--api` flag
- [ ] Routes registered with `Route::apiResource()`
- [ ] Only 5 CRUD methods present (index, store, show, update, destroy)
- [ ] Form Request injected for store and update
- [ ] Business logic delegated to actions/services
- [ ] API Resource returned from all methods
- [ ] Route model binding used for model resolution
- [ ] Pagination on index method
- [ ] Authorization gates applied
- [ ] Delete behavior handles soft-deletes correctly
- [ ] Implement API Resource Controllers following resource-controllers patterns
- [ ] Configure all required settings for API Resource Controllers
- [ ] Register route/middleware/service for API Resource Controllers
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] `apiResource` and `resource()->only(...)` have identical runtime performance; `apiResource` is syntactic sugar.
- [ ] Route caching works identically for both; 5 routes vs 7 saves negligible entries.

---

# Security Checklist

- [ ] Fewer routes mean reduced attack surface; `create` and `edit` endpoints that return HTML are eliminated.
- [ ] API controllers must validate `Accept: application/json` header to prevent HTML error page responses.
- [ ] Never return model instances directly; always wrap in API resources to control exposed attributes.
- [ ] Use form requests for validation â€” never `$request->all()` or `$request->input()`.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Route registered with `Route::apiResource()` (not `Route::resource()`) in `api.php`
- [ ] Only five methods exist â€” no `create` or `edit`
- [ ] Destroy returns `response()->noContent()` (204)
- [ ] Store returns the created resource with 201 status
- [ ] All methods return JSON (not views)
- [ ] `php artisan route:list` shows exactly 5 routes per resource
- [ ] Write feature tests for happy path of API Resource Controllers
- [ ] Write feature tests for validation failure of API Resource Controllers
- [ ] Write feature tests for authentication failure of API Resource Controllers
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

- [ ] Avoid: Fat Controller
- [ ] Avoid: Non-API Resource Controller
- [ ] Avoid: Missing API Controller Convention
- [ ] Avoid: Controller Performs Authorization Inline
- [ ] Avoid: No Resourceful Method Consistency

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
- Always Use Route::apiResource() In api.php
- Never Return Views From API Controllers
- Always Return 204 From Destroy
- Return 201 With Resource On Store
- Always Wrap Responses In API Resources
- Always Use Form Requests For Validation
- Register API Controllers In routes/api.php Only

### Decisions
- API Controller Response Selection

### Anti-Patterns
- Fat Controller
- Non-API Resource Controller
- Missing API Controller Convention
- Controller Performs Authorization Inline
- No Resourceful Method Consistency

## Related Knowledge
- Resource Controller Pattern â€” The seven-method base pattern
- Controller Response Selection â€” Status codes and response construction
- Controller Form Request Integration â€” Validation via form requests



