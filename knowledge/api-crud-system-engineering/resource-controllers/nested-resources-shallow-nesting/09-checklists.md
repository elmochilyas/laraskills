# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Nested Resources & Shallow Nesting
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Nested Resources & Shallow Nesting implementation follows resource-controllers patterns
- [ ] All edge cases handled for Nested Resources & Shallow Nesting
- [ ] Full test coverage for Nested Resources & Shallow Nesting
- [ ] Security review completed for Nested Resources & Shallow Nesting
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Nested Resources & Shallow Nesting
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Register nested resources with explicit scoping: `Route::resource('users.posts', PostController::class)->shallow()->scoped(['post' => 'uuid'])`.
- [ ] Document the nesting strategy in the API style guide: "All resources shall be shallow-nested at one level maximum."
- [ ] For 3+ levels of nesting, restructure the URL hierarchy (e.g., `/a/{a}/b` with shallow, then `/b/{b}/c` with shallow).
- [ ] In multi-tenant applications, always scope queries with tenant ID in addition to URL parameters.
- [ ] Use route name prefixes to avoid naming collisions between shallow-nested and top-level resources.
- [ ] Evaluate: Nesting Depth and Shallow Decision

---

# Implementation Checklist

- [ ] Max nesting is one level (`parent/{parent}/child`)
- [ ] No routes with three or more nested levels
- [ ] `shallow()` is used when child can be identified independently
- [ ] Child controller uses scoped binding to ensure child belongs to parent
- [ ] Third-level resources are exposed as top-level with parent filter parameters
- [ ] URLs are readable and RESTful
- [ ] Route names follow Laravel conventions for nested resources
- [ ] Implement Nested Resources & Shallow Nesting following resource-controllers patterns
- [ ] Configure all required settings for Nested Resources & Shallow Nesting
- [ ] Register route/middleware/service for Nested Resources & Shallow Nesting
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Shallow routes reduce model resolution queries â€” parent model is not resolved for show/update/destroy.
- [ ] Without shallow: two model resolutions per request (parent + child). With shallow: one resolution (child only).
- [ ] Scoped bindings add one database query to verify parent-child relationship â€” ensure foreign keys are indexed.
- [ ] Deep nesting (3+ levels) without shallow doubles or triples resolution queries.

---

# Security Checklist

- [ ] Shallow nesting removes the parent parameter, so the binding is lost â€” explicitly validate parent-child ownership.
- [ ] ID tampering vector: attacker changes POST ID in shallow route to access a post belonging to a different user.
- [ ] Use `->scoped()` with custom binding keys (UUID/ULID) to make IDs unpredictable.
- [ ] In multi-tenant systems, never rely on URL parameters alone for authorization â€” always check tenant scope in queries.
- [ ] Policy `view`/`update`/`delete` methods must verify the parent-child relationship independently.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Nested resource uses `->shallow()` by default for API routes
- [ ] `->scoped()` used alongside `->shallow()` for custom binding keys
- [ ] Parent-child ownership verified in policy methods for shallow routes
- [ ] No more than one level of nesting before shallow is applied
- [ ] Route name prefixes used to prevent conflicts with top-level resources
- [ ] `php artisan route:list` confirms expected shallow URI structure
- [ ] Write feature tests for happy path of Nested Resources & Shallow Nesting
- [ ] Write feature tests for validation failure of Nested Resources & Shallow Nesting
- [ ] Write feature tests for authentication failure of Nested Resources & Shallow Nesting
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

- [ ] Avoid: Deep Nesting (3+ Levels)
- [ ] Avoid: Over-Nesting When Not Needed
- [ ] Avoid: Inconsistent Nesting Depth
- [ ] Avoid: Ignoring Shallow Nesting Convention
- [ ] Avoid: Nesting Without Authorization Context

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
- Use Shallow Nesting By Default For API Routes
- Validate Parent-Child Ownership In Policies
- Limit Nesting To One Level Maximum
- Always Pair Shallow With Scoped Bindings
- Use Route Name Prefixes To Prevent Collisions

### Decisions
- Nesting Depth and Shallow Decision

### Anti-Patterns
- Deep Nesting (3+ Levels)
- Over-Nesting When Not Needed
- Inconsistent Nesting Depth
- Ignoring Shallow Nesting Convention
- Nesting Without Authorization Context

## Related Knowledge
- Resource Controller Pattern â€” Foundation for nested resource registration
- Partial Resource Routes â€” Filtering specific actions within nested resources
- Singleton Resource Controllers â€” One-to-one variant of nested resource routing
- Controller Middleware Assignment â€” Applying auth/scoping middleware to nested routes
- Controller Testing Strategies â€” Testing nested resource endpoints



