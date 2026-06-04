# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** rest-api-design
**Knowledge Unit:** REST Architectural Constraints
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] REST Architectural Constraints implementation follows rest-api-design patterns
- [ ] All edge cases handled for REST Architectural Constraints
- [ ] Full test coverage for REST Architectural Constraints
- [ ] Security review completed for REST Architectural Constraints
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for REST Architectural Constraints
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Laravel's dual middleware stacks (`api` and `web`) reflect the client-server constraint. Never mix them.
- [ ] The layered system constraint maps to Laravel's middleware pipeline â€” each layer transforms request/response independently.
- [ ] For cacheability, use `SetCacheHeaders` middleware or explicit headers on every GET response.
- [ ] Use correlation IDs (generated client-side or by load balancer) for production debugging â€” without sessions, correlating requests requires this.
- [ ] Stateless servers allow round-robin load balancing with no session affinity â€” ensure the load balancer doesn't pin clients to specific servers.

---

# Implementation Checklist

- [ ] Client-server separation is maintained (no server-side session state in API responses)
- [ ] No session state on server â€” auth tokens are sent with each request
- [ ] Cache headers (Cache-Control, ETag, Last-Modified) are present on appropriate responses
- [ ] Resources are identified by URIs (nouns, not verbs)
- [ ] Resources are manipulated via representations (CRUD via HTTP methods)
- [ ] Self-descriptive messages contain all metadata needed to process them (Content-Type, Link headers)
- [ ] HATEOAS links are provided for discoverable state transitions (optional, maturity level 3)
- [ ] Layers (proxies, caches) can be inserted without client changes
- [ ] Each constraint violation is documented with a rationale
- [ ] Implement REST Architectural Constraints following rest-api-design patterns
- [ ] Configure all required settings for REST Architectural Constraints
- [ ] Register route/middleware/service for REST Architectural Constraints
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Token validation on every request adds 1-5ms (Sanctum token lookup) or ~0.5ms (JWT validation without DB lookup).
- [ ] Proper cache headers enable 90%+ cache hit ratios on read-heavy endpoints â€” reducing server load by 90%.
- [ ] The `api` middleware stack is typically shallower than `web`, contributing to faster API response times.
- [ ] Each middleware layer adds ~0.1-0.5ms per request â€” keep the pipeline minimal for APIs.

---

# Security Checklist

- [ ] Statelessness prevents session hijacking (no session ID to steal) but requires secure token storage on the client.
- [ ] Cache headers must distinguish public vs private data â€” `Cache-Control: private` for user-specific responses.
- [ ] The layered system constraint allows security layers (WAF, rate limiting, auth) to be inserted transparently without modifying application code.
- [ ] Never add `StartSession` middleware to API routes â€” it introduces session state and CSRF requirements.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] API routes use the `api` middleware group (no `StartSession` or `ShareErrorsFromSession`).
- [ ] Authentication is token-based (Sanctum/Passport), not session-based.
- [ ] Every GET response includes explicit `Cache-Control` header.
- [ ] No `session()` calls appear in API route handlers or controllers.
- [ ] Correlation IDs are present in request/response for tracing.
- [ ] The application scales horizontally without session affinity.
- [ ] Cache headers correctly distinguish public and private responses.
- [ ] Write feature tests for happy path of REST Architectural Constraints
- [ ] Write feature tests for validation failure of REST Architectural Constraints
- [ ] Write feature tests for authentication failure of REST Architectural Constraints
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

- [ ] Avoid: REST as HTTP Checklist
- [ ] Avoid: Session-Auth for APIs
- [ ] Avoid: No Cache Headers
- [ ] Avoid: Server-Side Session State
- [ ] Avoid: Layered System Violation

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
- Use The API Middleware Group For Statelessness
- Use Token-Based Authentication For APIs
- Set Explicit Cache Headers On Every Response
- Never Access session() In API Routes
- Apply All Six Constraints As A System
- Use Correlation IDs For Request Tracing
- Design For Horizontal Scaling Without Session Affinity
- Distinguish Public vs Private Cache Headers

### Anti-Patterns
- REST as HTTP Checklist
- Session-Auth for APIs
- No Cache Headers
- Server-Side Session State
- Layered System Violation

## Related Knowledge
- Prerequisites
- Related
- Advanced



