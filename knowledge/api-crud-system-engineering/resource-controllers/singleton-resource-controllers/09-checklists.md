# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Singleton Resource Controllers
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Singleton Resource Controllers implementation follows resource-controllers patterns
- [ ] All edge cases handled for Singleton Resource Controllers
- [ ] Full test coverage for Singleton Resource Controllers
- [ ] Security review completed for Singleton Resource Controllers
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Singleton Resource Controllers
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Place singleton controllers alongside resource controllers in the directory structure.
- [ ] Singleton controllers receive the parent model as a route parameter, not the singleton itself.
- [ ] For nested singletons, pass the parent to views and let the view resolve the singleton relationship.
- [ ] When the singleton doesn't exist on a non-creatable route, return 404 explicitly or let model-not-found exceptions render.
- [ ] Document singleton relationships in the API style guide: "All one-to-one resources use singleton routing."
- [ ] Evaluate: Singleton vs Resource Controller Decision

---

# Implementation Checklist

- [ ] Route uses `singleton()` not `resource()` â€” no ID parameter in URL
- [ ] Controller has only `show`, `update`, `destroy` methods
- [ ] `show` returns 200 with the resource (or 404 if convention says not found)
- [ ] `update` returns 200 or 204 after modification
- [ ] `destroy` returns 204 after deletion
- [ ] Singleton is scoped to parent (user profile is tied to the authenticated user)
- [ ] Creatable singleton (`->creatable()`) is used when show should auto-create
- [ ] API documentation reflects the lack of ID parameter
- [ ] Implement Singleton Resource Controllers following resource-controllers patterns
- [ ] Configure all required settings for Singleton Resource Controllers
- [ ] Register route/middleware/service for Singleton Resource Controllers
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Singleton resolution triggers one Eloquent query on the parent relationship per request.
- [ ] N+1 hazard: iterating parent collection and accessing singleton in each iteration triggers O(n) queries.
- [ ] Use `->with('profile')` on the parent query to eager-load the singleton relationship.
- [ ] No performance difference vs `resource()` with `only()` â€” the benefit is URL structure and intent, not speed.

---

# Security Checklist

- [ ] Singleton resolution is scoped to the parent relationship â€” test that User A cannot access User B's singleton.
- [ ] Creatable singleton routes require authorization: not every parent should be able to create a singleton.
- [ ] Static resolution (`Profile::first()`) rather than scoped resolution leaks data across parents.
- [ ] Always verify parent-child ownership in policies, even with singleton routes.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] `Route::singleton()` used instead of `Route::resource()->only()`
- [ ] URLs do NOT contain `{profile}` or similar ID parameters
- [ ] Relationship method on parent matches singleton resource name
- [ ] Parent model eager-loads the singleton when listing parents
- [ ] Authorization verified: user cannot access another user's singleton
- [ ] Lifecycle hook creates the singleton if non-creatable route is used
- [ ] Write feature tests for happy path of Singleton Resource Controllers
- [ ] Write feature tests for validation failure of Singleton Resource Controllers
- [ ] Write feature tests for authentication failure of Singleton Resource Controllers
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

- [ ] Avoid: Using Resource Instead of Singleton
- [ ] Avoid: Missing Show Route Awareness
- [ ] Avoid: Nesting Under Singleton
- [ ] Avoid: Missing Authorization in Singleton Context
- [ ] Avoid: Inconsistent Singleton Implementation

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
- Use Route::singleton() For One-To-One Resources
- Align Relationship Method Name With Singleton Name
- Eager-Load Singleton On Parent Queries
- Use creatable() Only When Resource May Not Exist
- Type-Hint Parent, Not Singleton, In Method Signatures

### Decisions
- Singleton vs Resource Controller Decision

### Anti-Patterns
- Using Resource Instead of Singleton
- Missing Show Route Awareness
- Nesting Under Singleton
- Missing Authorization in Singleton Context
- Inconsistent Singleton Implementation

## Related Knowledge
- Resource Controller Pattern â€” The standard seven-method pattern that singleton controllers extend
- Nested Resources & Shallow Nesting â€” Parent-child route scoping that complements singleton routing
- API Resource Controllers â€” API-specific resource registration without create/edit views
- Controller Dependency Injection â€” Injecting services into singleton controllers



