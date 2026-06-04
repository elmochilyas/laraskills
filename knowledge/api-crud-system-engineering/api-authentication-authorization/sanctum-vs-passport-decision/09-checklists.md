# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-authentication-authorization
**Knowledge Unit:** Sanctum vs Passport Decision
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Sanctum vs Passport Decision implementation follows api-authentication-authorization patterns
- [ ] All edge cases handled for Sanctum vs Passport Decision
- [ ] Full test coverage for Sanctum vs Passport Decision
- [ ] Security review completed for Sanctum vs Passport Decision
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Sanctum vs Passport Decision

---

# Architecture Checklist

- [ ] Sanctum: 1 DB table (`personal_access_tokens`), 1 route (`/sanctum/csrf-cookie`), minimal config.
- [ ] Passport: 5+ DB tables, key generation (php artisan passport:keys), multiple routes, service provider registration.
- [ ] Sanctum uses `auth:sanctum` guard. Passport uses `auth:api` guard with passport driver.
- [ ] For hybrid, route first-party endpoints through Sanctum guard and third-party through Passport guard.
- [ ] Evaluate: Auth Package Selection â€” Sanctum vs Passport vs Hybrid
- [ ] Evaluate: Deployment Approach for Mixed Consumer Types
- [ ] Evaluate: Migration Strategy â€” Sanctum to Passport

---

# Implementation Checklist

- [ ] Implement Sanctum vs Passport Decision following api-authentication-authorization patterns
- [ ] Configure all required settings for Sanctum vs Passport Decision
- [ ] Register route/middleware/service for Sanctum vs Passport Decision
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Sanctum: 1 DB query per request (token lookup by ID via `ID|secret` format).
- [ ] Passport: 2-3 queries per request (client lookup, token validation, scope resolution).
- [ ] Sanctum's O(1) token lookup outperforms Passport for high-throughput APIs.
- [ ] Both benefit from database indexing. Sanctum needs index on `token` column; Passport needs indexes on client and token tables.

---

# Security Checklist

- [ ] Sanctum lacks built-in refresh tokens â€” implement custom rotation for sensitive scopes.
- [ ] Passport supports token expiration, refresh token rotation, and client secret hashing.
- [ ] Sanctum SPA cookies are HTTP-only (immune to XSS). Passport tokens in localStorage are XSS-vulnerable.
- [ ] Passport supports PKCE for authorization code flow (prevents authorization code interception).
- [ ] Both require database cleanup: `sanctum:prune-expired` for Sanctum; custom commands for Passport.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Sanctum vs Passport Decision
- [ ] Write feature tests for validation failure of Sanctum vs Passport Decision
- [ ] Write feature tests for authentication failure of Sanctum vs Passport Decision
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
- Default to Sanctum for Any New Project
- Use Hybrid Approach When Both First-Party and Third-Party Auth Are Needed
- Never Use Sanctum for OAuth2 Compliance
- Never Use Passport for Simple Mobile API Authentication
- Keep Passport Keys Outside Document Root and Out of Git
- Understand Sanctum's Session Driver Requirement for SPA Mode
- Index personal_access_tokens for Performance at Scale
- Choose Based on Consumer Type, Not Developer Familiarity

### Decisions
- Auth Package Selection â€” Sanctum vs Passport vs Hybrid
- Deployment Approach for Mixed Consumer Types
- Migration Strategy â€” Sanctum to Passport

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced
- Cross-Domain



