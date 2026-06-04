# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Authentication Error Responses
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Authentication Error Responses implementation follows error-handling-design patterns
- [ ] All edge cases handled for Authentication Error Responses
- [ ] Full test coverage for Authentication Error Responses
- [ ] Security review completed for Authentication Error Responses
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Authentication Error Responses
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Map `AuthenticationException` in the handler with guard-aware code selection.
- [ ] Include `WWW-Authenticate: Bearer realm="api"` header in all 401 responses.
- [ ] Generate distinct codes: generic (unauth), expired token, invalid token.
- [ ] Support multiple auth methods by listing all schemes in `WWW-Authenticate`.
- [ ] Ensure 401 is never confused with 403 (403 = authenticated but denied).

---

# Implementation Checklist

- [ ] All 401 responses include `WWW-Authenticate` header
- [ ] Guard-aware error codes used (expired vs invalid vs unauth)
- [ ] Auth error messages generic â€” no user existence hints
- [ ] No stack traces or file paths in 401 responses
- [ ] All auth guards have handler mappings
- [ ] Auth failure rate limiting per IP
- [ ] Auth failures logged with context excluding credentials
- [ ] Implement Authentication Error Responses following error-handling-design patterns
- [ ] Configure all required settings for Authentication Error Responses
- [ ] Register route/middleware/service for Authentication Error Responses
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Negligible â€” auth failure path is not performance-sensitive.
- [ ] Token parsing overhead is not part of error response generation (it already happened before the exception).

---

# Security Checklist

- [ ] Never reveal whether an email/username exists in auth error messages.
- [ ] Never log credentials or tokens in plaintext.
- [ ] Do not differentiate "user not found" from "wrong password" â€” use identical generic messages.
- [ ] Include rate limiting on auth endpoints to prevent enumeration.
- [ ] Ensure WWW-Authenticate header does not leak configuration details.
- [ ] Log auth failures with full context but exclude credential values.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All 401 responses include `WWW-Authenticate` header
- [ ] Guard-aware error codes are used (expired vs invalid vs unauth)
- [ ] Auth error messages are generic â€” no user existence hints
- [ ] No stack traces or file paths appear in 401 responses
- [ ] All auth guards have corresponding error handler mappings
- [ ] Auth failure rate limiting is configured per IP
- [ ] Integration tests verify 401 response shape for all auth scenarios
- [ ] Write feature tests for happy path of Authentication Error Responses
- [ ] Write feature tests for validation failure of Authentication Error Responses
- [ ] Write feature tests for authentication failure of Authentication Error Responses
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

- [ ] Avoid: Returning 403 for Missing Auth
- [ ] Avoid: Missing WWW-Authenticate Header
- [ ] Avoid: Leaking User Existence
- [ ] Avoid: Generic Code for All Failures
- [ ] Avoid: Stack Traces in 401 Responses

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
- Always Include WWW-Authenticate Header on 401
- Return 401 for Missing Credentials, Never 403
- Use Guard-Aware Error Codes for Auth Failures
- Never Reveal User Existence in Auth Error Messages
- Never Expose Stack Traces or Exception Internals in 401 Responses
- Distinguish Expired vs Invalid Token Error Codes
- Never Log Credential Values in Auth Failure Context
- Map AuthenticationException Explicitly in the Handler
- Apply Rate Limiting to Authentication Endpoints Per IP
- Log Auth Failures with Full Context Excluding Credentials
- Guard 401 Renderables with expectsJson() Check

### Anti-Patterns
- Returning 403 for Missing Auth
- Missing WWW-Authenticate Header
- Leaking User Existence
- Generic Code for All Failures
- Stack Traces in 401 Responses

## Related Knowledge
- Authorization Error Responses (401 vs 403 distinction)
- Standardized Error Envelope (the envelope used in auth error responses)
- Exception-to-Code Mapping (mapping AuthenticationException)
- Sanctum Token Authentication
- API Rate Limiting by Authentication Tier



