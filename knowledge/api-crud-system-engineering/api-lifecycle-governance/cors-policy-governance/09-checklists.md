# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-lifecycle-governance
**Knowledge Unit:** CORS Policy Governance
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] CORS Policy Governance implementation follows api-lifecycle-governance patterns
- [ ] All edge cases handled for CORS Policy Governance
- [ ] Full test coverage for CORS Policy Governance
- [ ] Security review completed for CORS Policy Governance
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for CORS Policy Governance

---

# Architecture Checklist

- [ ] Gateway (nginx) handles preflight OPTIONS; application handles dynamic origin validation.
- [ ] Static origins from environment variables; dynamic origins from database for consumer-managed allowlists.
- [ ] Keep origin lists under 100 entries per environment for O(n) validation performance.
- [ ] CORS headers must be present on error responses too (browser needs them to read error body).
- [ ] Provide CORS debugging endpoint (`GET /cors-check`) for developer troubleshooting.

---

# Implementation Checklist

- [ ] Environment-specific origin lists (dev/staging/production)
- [ ] No wildcard with credentials (explicit origin echoing for authenticated endpoints)
- [ ] All custom headers exposed in Access-Control-Expose-Headers
- [ ] Preflight cache set to 86400 seconds
- [ ] Formal change process for production origin additions
- [ ] CORS headers present on error responses
- [ ] Quarterly origin allowlist audit
- [ ] Dynamic origin validation for multi-tenant
- [ ] Implement CORS Policy Governance following api-lifecycle-governance patterns
- [ ] Configure all required settings for CORS Policy Governance
- [ ] Register route/middleware/service for CORS Policy Governance
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Preflight adds one round-trip for cross-origin requests â€” caching with Max-Age minimizes this.
- [ ] Origin validation is O(n) against allowlist â€” keep lists under 100 entries.
- [ ] Dynamic origin resolution (database-backed) adds ~5ms â€” cache allowlist in memory.

---

# Security Checklist

- [ ] CORS does NOT protect against direct server-to-server requests. Authenticate all requests.
- [ ] Never use `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true` (browsers reject).
- [ ] Do not allow `http://localhost:*` in production.
- [ ] Quarterly audit of origin allowlist to remove unused origins.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of CORS Policy Governance
- [ ] Write feature tests for validation failure of CORS Policy Governance
- [ ] Write feature tests for authentication failure of CORS Policy Governance
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
- Rule 1: Never Use Wildcard Origin with Credentials
- Rule 2: Use Environment-Specific Origin Lists
- Rule 3: Explicitly Expose All Custom Headers
- Rule 4: Cache Preflight Responses for 24 Hours
- Rule 5: Implement Formal Origin Change Process
- Rule 6: Include CORS Headers on Error Responses
- Rule 7: Audit Origin Allowlist Quarterly

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



