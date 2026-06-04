# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Production Vs Dev Error Detail
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Production Vs Dev Error Detail implementation follows error-handling-design patterns
- [ ] All edge cases handled for Production Vs Dev Error Detail
- [ ] Full test coverage for Production Vs Dev Error Detail
- [ ] Security review completed for Production Vs Dev Error Detail
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Production Vs Dev Error Detail
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Check `config('app.debug')` at the start of each render in the handler.
- [ ] In dev mode, append a top-level `debug` key with exception class, file, line, limited trace, and previous exception.
- [ ] In production, return the standard safe envelope with trace ID only.
- [ ] Use `app()->isLocal()` not just `APP_DEBUG` for environment gating.
- [ ] Return JSON for API routes in dev mode; Whoops for browser routes only.
- [ ] Never cache error responses â€” dev detail should never leak to production via cache.
- [ ] Use environment-specific `.env` files (`.env.production`, `.env.staging`) with `APP_DEBUG=false`.

---

# Implementation Checklist

- [ ] `APP_DEBUG=false` in production
- [ ] Production error responses never contain stack traces
- [ ] Production error responses never contain file paths or line numbers
- [ ] Validation details shown in both modes (safe to show)
- [ ] Auth error details hidden in both modes
- [ ] `debug` key only present when `APP_DEBUG=true`
- [ ] Full error details logged in production (not in response)
- [ ] Implement Production Vs Dev Error Detail following error-handling-design patterns
- [ ] Configure all required settings for Production Vs Dev Error Detail
- [ ] Register route/middleware/service for Production Vs Dev Error Detail
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Dev mode stack trace generation is slower but acceptable (local dev only).
- [ ] Production mode skips trace formatting entirely â€” no overhead.
- [ ] The debug check is a single boolean compare â€” negligible.
- [ ] Dev mode trace serialisation adds ~1-2ms per error response.

---

# Security Checklist

- [ ] **Never set APP_DEBUG=true in production** â€” becomes a security incident if left enabled.
- [ ] Add middleware that prevents debug mode on production even if misconfigured.
- [ ] Dev mode must still strip PII from debug output (passwords, tokens).
- [ ] Whoops page leaks `$_ENV` values including database credentials â€” ensure it's never shown for API routes.
- [ ] Production error response must be identical regardless of underlying cause.
- [ ] Dev mode should never change the envelope â€” only add data.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Dev detail appears under a separate `debug` key, never in the `error` envelope
- [ ] Dev mode is gated by both `config('app.debug')` and `app()->isLocal()`
- [ ] API routes always return JSON in dev mode (no Whoops HTML)
- [ ] CI enforces `APP_DEBUG=false` in production/staging
- [ ] Debug detail includes: exception class, file, line, limited trace (10 frames), previous exception
- [ ] Production error response shape is identical across all error types
- [ ] Test suite includes production-mode error response tests
- [ ] Write feature tests for happy path of Production Vs Dev Error Detail
- [ ] Write feature tests for validation failure of Production Vs Dev Error Detail
- [ ] Write feature tests for authentication failure of Production Vs Dev Error Detail
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

- [ ] Avoid: APP_DEBUG=true in Production
- [ ] Avoid: Different Envelope Shapes per Environment
- [ ] Avoid: Hardcoding Debug Behaviour
- [ ] Avoid: Whoops Page for API Routes
- [ ] Avoid: Conditional Rendering via Request Parameter

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
- Always Use a Separate debug Key for Dev Detail
- Gate Dev Detail on Both APP_DEBUG and app()->isLocal()
- Never Set APP_DEBUG=true in Production â€” Enforce in CI
- Always Return JSON for API Routes in Dev Mode â€” Never Whoops HTML
- Limit Dev Trace to 10 Frames Maximum
- Never Cache Error Responses â€” Dev Detail Must Never Leak via Cache
- Test Production Mode Error Responses in CI with APP_DEBUG=false
- Dev Detail Must Still Sanitize Sensitive Data
- Never Enable Debug Mode Based on Request Parameters or IP

### Anti-Patterns
- APP_DEBUG=true in Production
- Different Envelope Shapes per Environment
- Hardcoding Debug Behaviour
- Whoops Page for API Routes
- Conditional Rendering via Request Parameter

## Related Knowledge
- Server Error Responses (the safe production response baseline)
- Global Exception Handler Config (where the dev/prod switch lives)
- Sensitive Data Leak Prevention (dev mode must also strip PII)
- Error Response Testing (testing both dev and production modes)



