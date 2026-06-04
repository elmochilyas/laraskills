# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** rest-api-design
**Knowledge Unit:** REST Maturity Model
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] REST Maturity Model implementation follows rest-api-design patterns
- [ ] All edge cases handled for REST Maturity Model
- [ ] Full test coverage for REST Maturity Model
- [ ] Security review completed for REST Maturity Model
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for REST Maturity Model
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Laravel's `Route::apiResource()` naturally targets Level 2 â€” use it as the default for CRUD endpoints.
- [ ] Check API maturity: `apiResource()` usage indicates Level 2; POST for reads indicates Level 0-1; `_links` in resources indicates Level 3.
- [ ] Never skip from Level 0 to Level 2 without Level 1 â€” verbs require resources to operate on.
- [ ] Level 3 links must be backward-compatible â€” adding links (L2 â†’ L3) adds fields without changing existing ones. Don't remove links after adding them.
- [ ] Mixed maturity within the same API version confuses clients â€” standardize per version.

---

# Implementation Checklist

- [ ] The current maturity level is identified and documented
- [ ] Level 0 conditions: multiple actions per URL, all POST, status codes not used
- [ ] Level 1 conditions: URLs represent resources (nouns), but HTTP methods may be wrong
- [ ] Level 2 conditions: correct HTTP methods (GET, POST, PUT, PATCH, DELETE) + correct status codes (200, 201, 204, 404, 422)
- [ ] Level 3 conditions: Level 2 + responses contain `links` for available transitions
- [ ] Upgrade path to next level is documented
- [ ] Level 2 is implemented as the minimum baseline
- [ ] Level 3 (HATEOAS) is implemented only where it adds value
- [ ] Implement REST Maturity Model following rest-api-design patterns
- [ ] Configure all required settings for REST Maturity Model
- [ ] Register route/middleware/service for REST Maturity Model
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Level 0/1 with single endpoint can optimize route registration but controller dispatch becomes complex.
- [ ] Level 2 benefits from `php artisan route:cache` â€” route registration overhead is proportional to endpoint count.
- [ ] Level 3 link generation adds ~5-15ms for collections of 100 items. Authorization checks per link add additional queries.
- [ ] Level 2 GET endpoints can be cached at CDN/reverse proxy â€” Level 0/1 POST endpoints cannot.

---

# Security Checklist

- [ ] Level 0/1 APIs obscure operations â€” security auditing is harder when all operations are tunneled through POST.
- [ ] Level 2 with proper status codes enables automated security tooling (WAF rules based on status code patterns).
- [ ] Level 3 links must respect authorization â€” never include links to actions the client cannot perform.
- [ ] Higher maturity levels don't inherently improve security â€” authentication and authorization are orthogonal.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All CRUD endpoints use proper HTTP methods (Level 2) â€” not POST for everything.
- [ ] Status codes are correct per operation: 201 for create, 204 for delete, etc.
- [ ] Resources are identified by URI paths (Level 1) â€” not a single endpoint for everything.
- [ ] Level 3 elements (self links, pagination links) are additive â€” they don't break Level 2 behavior.
- [ ] No `create` or `edit` routes exist in API endpoints.
- [ ] The target maturity level is documented per API version.
- [ ] Maturity level is consistent across endpoints within each version.
- [ ] Write feature tests for happy path of REST Maturity Model
- [ ] Write feature tests for validation failure of REST Maturity Model
- [ ] Write feature tests for authentication failure of REST Maturity Model
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

- [ ] Avoid: Level 3 Without Client Buy-In
- [ ] Avoid: Level 2 Facade on Level 0
- [ ] Avoid: Cherry-Picking Levels
- [ ] Avoid: Ignoring Level 0's Validity
- [ ] Avoid: Rigid Maturity Dogma

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
- Target Level 2 As The Default Maturity
- Add Level 3 Elements Incrementally
- Never Skip Levels â€” Build Cumulatively
- Call Level 2 APIs "RESTful", Not "REST"
- Ensure Level 2 Correctness Before Adding Level 3
- Validate Maturity Consistency Per API Version
- Document Target Maturity Per API Version

### Anti-Patterns
- Level 3 Without Client Buy-In
- Level 2 Facade on Level 0
- Cherry-Picking Levels
- Ignoring Level 0's Validity
- Rigid Maturity Dogma

## Related Knowledge
- Prerequisites
- Related
- Advanced



