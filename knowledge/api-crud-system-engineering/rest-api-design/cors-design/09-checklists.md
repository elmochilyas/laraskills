# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** rest-api-design
**Knowledge Unit:** CORS Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] CORS Design implementation follows rest-api-design patterns
- [ ] All edge cases handled for CORS Design
- [ ] Full test coverage for CORS Design
- [ ] Security review completed for CORS Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for CORS Design
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Use environment variables for allowed origins: `CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com`.
- [ ] Keep staging CORS policies broader than production â€” but never point staging frontend at production API.
- [ ] For Sanctum SPA auth: add `sanctum/csrf-cookie` to paths, set `supports_credentials: true`, specify exact frontend URL.
- [ ] Review and prune the allowed origins list quarterly â€” unused origins become security liabilities.
- [ ] CORS errors appear only in the browser console, not in server logs (the server doesn't know the browser blocked the request).
- [ ] Evaluate: CORS Origin Strategy
- [ ] Evaluate: Preflight (OPTIONS) Handling Strategy
- [ ] Evaluate: Credentialed CORS Configuration

---

# Implementation Checklist

- [ ] Allowed origins are correct (exact origins for credentialed, `*` for public)
- [ ] Credentials flag matches the use case (true if cookies/auth headers are used)
- [ ] Exposed headers include all custom response headers (X-Total-Count, Link, X-Request-Id)
- [ ] Max age is set to reduce preflight requests (86400 seconds typical)
- [ ] Allowed methods match registered API routes
- [ ] Allowed headers include Authorization for authenticated endpoints
- [ ] Preflight (OPTIONS) requests return 204 with correct headers
- [ ] CORS is not applied to same-origin requests (no performance cost)
- [ ] Non-API routes (web, auth pages) are excluded from CORS middleware
- [ ] Production origins are locked down (no `*` with credentials)
- [ ] Implement CORS Design following rest-api-design patterns
- [ ] Configure all required settings for CORS Design
- [ ] Register route/middleware/service for CORS Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Every non-simple request triggers a preflight OPTIONS â€” doubling request count for writes.
- [ ] OPTIONS responses return 204 with no body â€” fast (~1ms) but adds network round-trip time.
- [ ] `Access-Control-Max-Age: 86400` saves ~1000 OPTIONS requests per day for an API with 1000 write operations.
- [ ] CDN caching of OPTIONS responses is not possible (browsers don't cache preflight across origins).

---

# Security Checklist

- [ ] CORS is not a replacement for authentication â€” server-to-server and mobile requests bypass CORS entirely.
- [ ] Misconfigured CORS (wildcard + credentials â†’ rejected) creates a false sense of security. Implement proper auth regardless.
- [ ] Exposing custom headers (`X-Debug-Info`, `X-Debug-Token`) via `Access-Control-Expose-Headers` leaks internal information.
- [ ] Origin validation must be exact (including trailing slash, protocol) â€” `https://app.example.com` vs `https://app.example.com/` are different origins.
- [ ] Credentialed requests require `Access-Control-Allow-Origin` to match the requesting origin exactly â€” no wildcard allowed.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Only specific origins are allowed in production â€” no wildcard `*`.
- [ ] `supports_credentials: true` is paired with explicit origins, never wildcard.
- [ ] OPTIONS preflight requests return 204 with correct CORS headers before authentication.
- [ ] `Access-Control-Expose-Headers` only exposes headers the client needs.
- [ ] Sanctum SPA endpoints (`sanctum/csrf-cookie`) are included in CORS paths.
- [ ] `curl -H "Origin: https://app.example.com" -I` returns correct CORS headers.
- [ ] Write feature tests for happy path of CORS Design
- [ ] Write feature tests for validation failure of CORS Design
- [ ] Write feature tests for authentication failure of CORS Design
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

- [ ] Avoid: CORS as Security Mechanism
- [ ] Avoid: Wildcard Origin in Production
- [ ] Avoid: Credentials Without Specific Origins
- [ ] Avoid: CORS Configuration in Code
- [ ] Avoid: ALLOW-ALL Development Config Leaked to Production

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
- Use Specific Origins In Production
- Never Pair Wildcard Origins With Credentials
- Handle OPTIONS Before Authentication Middleware
- Configure CORS In config/cors.php Only
- Use Environment Variables For Origins
- Expose Only Required Headers
- Include Sanctum Endpoints In CORS Paths For SPA Auth
- Review Allowed Origins Quarterly

### Decisions
- CORS Origin Strategy
- Preflight (OPTIONS) Handling Strategy
- Credentialed CORS Configuration

### Anti-Patterns
- CORS as Security Mechanism
- Wildcard Origin in Production
- Credentials Without Specific Origins
- CORS Configuration in Code
- ALLOW-ALL Development Config Leaked to Production

## Related Knowledge
- Prerequisites
- Related
- Advanced



