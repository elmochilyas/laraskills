# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-authentication-authorization
**Knowledge Unit:** Sanctum SPA Cookie Auth
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Sanctum SPA Cookie Auth implementation follows api-authentication-authorization patterns
- [ ] All edge cases handled for Sanctum SPA Cookie Auth
- [ ] Full test coverage for Sanctum SPA Cookie Auth
- [ ] Security review completed for Sanctum SPA Cookie Auth
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Sanctum SPA Cookie Auth

---

# Architecture Checklist

- [ ] Sanctum automatically detects stateful vs stateless requests via `EnsureFrontendRequestsAreStateful` middleware.
- [ ] Keep session data minimal to avoid oversized cookies (some proxies reject >8KB).
- [ ] `SANCTUM_STATEFUL_DOMAINS` must match the SPA's exact domain (no protocol).
- [ ] For Axios, `withCredentials: true` and default `xsrfCookieName`/`xsrfHeaderName` work automatically.
- [ ] Evaluate: Session Driver Selection â€” cookie vs file/database/redis
- [ ] Evaluate: CORS SameSite Cookie Strategy â€” lax vs none
- [ ] Evaluate: CSRF Token Refresh Strategy

---

# Implementation Checklist

- [ ] SPA domain configured in `config/sanctum.php`
- [ ] `EnsureFrontendRequestsAreStateful` middleware applied
- [ ] CORS configured with `supports_credentials: true` for SPA domain
- [ ] CSRF cookie endpoint registered and accessible
- [ ] SPA login flow works with XSRF-TOKEN + session cookie
- [ ] SPA requests authenticated via session cookie
- [ ] SPA logout destroys session
- [ ] Tests simulate SPA cookie auth flow
- [ ] `SESSION_DRIVER=cookie` for SPA deployments
- [ ] HTTPS enforced for cookie transmission in production
- [ ] Implement Sanctum SPA Cookie Auth following api-authentication-authorization patterns
- [ ] Configure all required settings for Sanctum SPA Cookie Auth
- [ ] Register route/middleware/service for Sanctum SPA Cookie Auth
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Session cookie size grows with stored data. Keep minimal data in session.
- [ ] Every request decrypts the cookie. AES-256-GCM is fast.
- [ ] CSRF token regeneration adds slight overhead. Configurable via `csrf_expiration`.

---

# Security Checklist

- [ ] **HTTP-only cookie**: Immune to XSS-based token theft. Cannot be read by JavaScript.
- [ ] **Third-party cookie deprecation**: Chrome's phased rollout makes cross-origin SPA cookie auth increasingly fragile. Plan token-based fallback.
- [ ] **CSRF token expiration**: Default 2 hours. Increase to match session lifetime for long-lived SPA sessions.
- [ ] **Load balancer trust**: Configure `TrustProxies` so Laravel generates correct URLs in CSRF cookies.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Sanctum SPA Cookie Auth
- [ ] Write feature tests for validation failure of Sanctum SPA Cookie Auth
- [ ] Write feature tests for authentication failure of Sanctum SPA Cookie Auth
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
- Use Session Driver of cookie for SPA Auth
- Always Set SESSION_SECURE_COOKIE=true in Production
- Configure SANCTUM_STATEFUL_DOMAINS Precisely
- Use withCredentials: true in Axios/Fetch Requests
- Send XSRF-TOKEN via X-XSRF-TOKEN Header, Not X-CSRF-TOKEN
- Handle 419 Errors with CSRF Refresh
- Never Store Sensitive Data in Session
- Set SESSION_DOMAIN for Subdomain Sharing
- Require HTTPS for Production SPA Auth
- Make CSRF Cookie Route Publicly Accessible

### Decisions
- Session Driver Selection â€” cookie vs file/database/redis
- CORS SameSite Cookie Strategy â€” lax vs none
- CSRF Token Refresh Strategy

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced
- Cross-Domain



