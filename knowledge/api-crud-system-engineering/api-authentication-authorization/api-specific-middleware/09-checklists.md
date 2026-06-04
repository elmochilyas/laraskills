# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-authentication-authorization
**Knowledge Unit:** API-Specific Middleware
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] API-Specific Middleware implementation follows api-authentication-authorization patterns
- [ ] All edge cases handled for API-Specific Middleware
- [ ] Full test coverage for API-Specific Middleware
- [ ] Security review completed for API-Specific Middleware
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for API-Specific Middleware

---

# Architecture Checklist

- [ ] Register in the API middleware group in `bootstrap/app.php` (Laravel 11) or `app/Http/Kernel.php` (Laravel 9/10).
- [ ] Order: ForceJson â†’ Request ID â†’ Audit â†’ Rate Limiter â†’ Controller.
- [ ] In Laravel 11, the `api` middleware group must be explicitly defined and no longer includes `throttle:api` by default.
- [ ] Request ID should be stored in request attributes: `$request->attributes->set('request_id', $requestId)`.
- [ ] Evaluate: ForceJson Middleware Placement â€” API Group vs Global Stack
- [ ] Evaluate: Request ID Strategy â€” Server-Generated vs Client-Provided
- [ ] Evaluate: Audit Storage â€” Synchronous DB vs Async Logging
- [ ] Evaluate: Middleware Organization â€” Single Concern per Middleware vs Consolidated

---

# Implementation Checklist

- [ ] Middleware registered as named route middleware
- [ ] Applied to `api` route group in `Kernel.php`
- [ ] Middleware order correct (detection before enforcement)
- [ ] `EnforceJsonResponse` sets Accept header or 406
- [ ] `ApiLogger` logs request method, path, duration, user_id
- [ ] `SecurityHeaders` sets X-Content-Type-Options, X-Frame-Options
- [ ] Middleware parameters used for configurable behavior
- [ ] Middleware tests in isolation with request/assert pattern
- [ ] No body modification in middleware
- [ ] Middleware doesn't duplicate existing Laravel middleware functionality
- [ ] Implement API-Specific Middleware following api-authentication-authorization patterns
- [ ] Configure all required settings for API-Specific Middleware
- [ ] Register route/middleware/service for API-Specific Middleware
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] ForceJson, AddRequestId, and timing add <0.1ms per request â€” irrelevant.
- [ ] Audit middleware adds log I/O. Use async logging (Redis channel) for high throughput.
- [ ] Response compression uses CPU. Compress only responses above 4KB.
- [ ] Request ID generation is a single `Str::uuid()` call â€” negligible.

---

# Security Checklist

- [ ] Audit logs can grow to ~2GB/month for 1M requests/day. Configure log rotation (30-90 day retention).
- [ ] Sensitive data in audit logs is a compliance risk. Implement a sanitizer middleware.
- [ ] Request ID prevents request forgery correlation but does not authenticate.
- [ ] ForceJson does not affect request encoding for file uploads.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of API-Specific Middleware
- [ ] Write feature tests for validation failure of API-Specific Middleware
- [ ] Write feature tests for authentication failure of API-Specific Middleware
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

- [ ] Avoid tight coupling between layers
- [ ] Avoid business logic in controllers
- [ ] Avoid skipping validation layers

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
- Always Include ForceJson in the API Middleware Group
- Never Place ForceJson in the Global Middleware Stack
- Add Request ID for End-to-End Tracing
- Include Request ID in All Error Responses
- Implement Audit Middleware with Async Storage
- Strip Sensitive Data from Audit Logs
- Run Audit Middleware Before Rate Limiting
- Add Response Timing Header

### Decisions
- ForceJson Middleware Placement â€” API Group vs Global Stack
- Request ID Strategy â€” Server-Generated vs Client-Provided
- Audit Storage â€” Synchronous DB vs Async Logging
- Middleware Organization â€” Single Concern per Middleware vs Consolidated

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced
- Cross-Domain



