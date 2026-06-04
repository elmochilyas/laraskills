# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-documentation
**Knowledge Unit:** Authentication Documentation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Authentication Documentation implementation follows api-documentation patterns
- [ ] All edge cases handled for Authentication Documentation
- [ ] Full test coverage for Authentication Documentation
- [ ] Security review completed for Authentication Documentation
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Authentication Documentation

---

# Architecture Checklist

- [ ] Define security schemes in `components/securitySchemes` and reference globally.
- [ ] For Sanctum: use `type: http, scheme: bearer` with description of ability system.
- [ ] For Passport: use `type: oauth2` with the relevant flow configuration.
- [ ] For API keys: use `type: apiKey, in: header, name: X-API-Key`.
- [ ] Document the credential lifecycle: obtain â†’ use â†’ manage â†’ revoke.
- [ ] Evaluate: Security Scheme Definition â€” Global vs Per-Operation
- [ ] Evaluate: Auth Method Documentation Order and Recommendation

---

# Implementation Checklist

- [ ] Security schemes defined in components/securitySchemes
- [ ] Global security array set for authenticated endpoints
- [ ] Public endpoints have `security: []` override
- [ ] Token abilities documented with descriptions
- [ ] Token lifecycle documented (expiration, refresh, expiration behavior)
- [ ] Auth examples use placeholder values only
- [ ] Rate limits on auth endpoints documented
- [ ] Token acquisition endpoint documented with full schemas
- [ ] Implement Authentication Documentation following api-documentation patterns
- [ ] Configure all required settings for Authentication Documentation
- [ ] Register route/middleware/service for Authentication Documentation
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Authentication documentation has no runtime impact.
- [ ] Spec size increases proportionally with security scheme complexity.

---

# Security Checklist

- [ ] Do not document actual tokens or secrets in examples. Use placeholders.
- [ ] OAuth2 documentation must use the correct production URLs for authorization endpoints.
- [ ] Token format documentation: clarify whether tokens are JWTs (decodeable) or opaque (need lookup).
- [ ] Document rate limiting on auth endpoints to prevent brute force.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Authentication Documentation
- [ ] Write feature tests for validation failure of Authentication Documentation
- [ ] Write feature tests for authentication failure of Authentication Documentation
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
- Define Security Schemes In Components
- Override Security To Empty Array For Public Endpoints
- Document Every Token Ability With Description
- Include Token Lifecycle Documentation
- Use Placeholder Values In Authentication Examples
- Document Rate Limits On Auth Endpoints

### Decisions
- Security Scheme Definition â€” Global vs Per-Operation
- Auth Method Documentation Order and Recommendation

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



