# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-authentication-authorization
**Knowledge Unit:** API Security Headers
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] API Security Headers implementation follows api-authentication-authorization patterns
- [ ] All edge cases handled for API Security Headers
- [ ] Full test coverage for API Security Headers
- [ ] Security review completed for API Security Headers
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for API Security Headers

---

# Architecture Checklist

- [ ] Add security headers in a dedicated middleware that runs after the response is built but before it's sent.
- [ ] Middleware approach is fine for most APIs. For higher performance, set headers at the Nginx/load balancer level.
- [ ] If using both Laravel and proxy-level headers, disable Laravel's to avoid duplication.
- [ ] Cache-Control headers should be set based on route type (authenticated vs public).
- [ ] Evaluate: Middleware-Level vs Reverse-Proxy-Level Header Injection
- [ ] Evaluate: CSP Strictness for JSON APIs vs HTML-Rendering Endpoints
- [ ] Evaluate: HSTS Gradual Rollout Strategy
- [ ] Evaluate: Cache-Control Policy per Route Type

---

# Implementation Checklist

- [ ] `X-Content-Type-Options: nosniff` on all API responses
- [ ] `X-Frame-Options: DENY` on all API responses
- [ ] `Strict-Transport-Security` with long max-age in production
- [ ] `Content-Security-Policy` with restrictive policy
- [ ] `Referrer-Policy: no-referrer` on all API responses
- [ ] `Permissions-Policy` restricting sensitive APIs
- [ ] Middleware applied to API route group
- [ ] Environment-specific HSTS configuration
- [ ] Headers verified with `curl -I` or equivalent
- [ ] No security headers interfere with API functionality
- [ ] Implement API Security Headers following api-authentication-authorization patterns
- [ ] Configure all required settings for API Security Headers
- [ ] Register route/middleware/service for API Security Headers
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Security headers add 200-400 bytes per response â€” negligible.
- [ ] CSP enforcement is purely client-side; no server overhead.
- [ ] Headers set in middleware add ~0.01ms to response time.
- [ ] HSTS preload registration requires no ongoing server cost.

---

# Security Checklist

- [ ] **HSTS misconfiguration**: `includeSubDomains` breaks any subdomain not supporting HTTPS. Verify all subdomains first.
- [ ] **Cache-Control missing**: Shared proxy caches can serve authenticated responses to other users. Always set `no-store, private` on authenticated routes.
- [ ] **Header stripping by CDN**: Cloudflare or Akamai may strip non-standard headers. Verify pass-through configuration.
- [ ] **Referrer-Policy**: API URLs containing tokens in path are leaked via `Referer` without this header.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of API Security Headers
- [ ] Write feature tests for validation failure of API Security Headers
- [ ] Write feature tests for authentication failure of API Security Headers
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
- Use a Single Dedicated Middleware for All Security Headers
- Set X-Content-Type-Options: nosniff on Every Response
- Always Send Strict-Transport-Security Over HTTPS Only
- Restrict CSP to default-src 'none' for JSON APIs
- Set Cache-Control: no-store, private on Authenticated Routes
- Remove X-Powered-By Header
- Set Referrer-Policy: no-referrer on All Responses
- Never Use Deprecated X-XSS-Protection Header

### Decisions
- Middleware-Level vs Reverse-Proxy-Level Header Injection
- CSP Strictness for JSON APIs vs HTML-Rendering Endpoints
- HSTS Gradual Rollout Strategy
- Cache-Control Policy per Route Type

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced
- Cross-Domain



