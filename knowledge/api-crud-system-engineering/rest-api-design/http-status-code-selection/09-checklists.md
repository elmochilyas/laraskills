# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** rest-api-design
**Knowledge Unit:** HTTP Status Code Selection
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] HTTP Status Code Selection implementation follows rest-api-design patterns
- [ ] All edge cases handled for HTTP Status Code Selection
- [ ] Full test coverage for HTTP Status Code Selection
- [ ] Security review completed for HTTP Status Code Selection
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for HTTP Status Code Selection
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Standardize error response structure across all 4xx and 5xx responses â€” consistent `message`, `errors`, `code`, `request_id` fields.
- [ ] Laravel's exception handler (`App\Exceptions\Handler`) should normalize all error responses to API format.
- [ ] Document every possible status code for every endpoint in OpenAPI â€” clients need to know all possible outcomes.
- [ ] Log 500 errors with full context (request ID, user ID, URL, method) but never include stack traces in the response body.
- [ ] For batch operations with mixed outcomes, return 207 Multi-Status with individual status per item.

---

# Implementation Checklist

- [ ] Implement HTTP Status Code Selection following rest-api-design patterns
- [ ] Configure all required settings for HTTP Status Code Selection
- [ ] Register route/middleware/service for HTTP Status Code Selection
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] 304 Not Modified saves bandwidth by omitting the response body â€” the server still processes the request but avoids serialization and transmission costs.
- [ ] 429 rate limiting includes `X-RateLimit-Remaining` and `Retry-After` headers â€” negligible computation overhead.
- [ ] Error responses with minimal bodies (no stack traces) reduce bandwidth for failure paths.
- [ ] `APP_DEBUG=true` in production exposes stack traces in 500 responses â€” always set `APP_DEBUG=false` in production.

---

# Security Checklist

- [ ] 401 should not indicate whether the user exists â€” use the same message for "invalid token" and "user not found."
- [ ] 403 should not reveal why the user is unauthorized â€” "Insufficient permissions" is sufficient.
- [ ] Never include stack traces, SQL queries, file paths, or internal identifiers in 500 responses.
- [ ] 404 for non-existent resources vs 403 for unauthorized access to existing resources â€” choose a policy and apply consistently.
- [ ] CDN caching of error responses must be prevented â€” set `Cache-Control: no-store` on all 4xx and 5xx responses.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every POST creating a resource returns 201 with Location header.
- [ ] Every DELETE returns 204 (no body).
- [ ] Validation errors return 422 with field-level error structure.
- [ ] Authentication failures return 401, authorization failures return 403.
- [ ] 4xx/5xx responses have `Cache-Control: no-store`.
- [ ] Error response structure is consistent across all endpoints and status codes.
- [ ] `APP_DEBUG=false` in production â€” no stack traces in 500 responses.
- [ ] Write feature tests for happy path of HTTP Status Code Selection
- [ ] Write feature tests for validation failure of HTTP Status Code Selection
- [ ] Write feature tests for authentication failure of HTTP Status Code Selection
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

- [ ] Avoid: 200 OK for Everything
- [ ] Avoid: 500 for Client Errors
- [ ] Avoid: Custom Status Codes
- [ ] Avoid: Stack Traces in Production
- [ ] Avoid: Inconsistent Error Structure

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
- Return 201 With Location Header For Resource Creation
- Return 204 For Successful DELETE
- Distinguish 401 vs 403 Correctly
- Use 422 For Validation Errors, 400 For Syntax Errors
- Set no-store On All 4xx and 5xx Responses
- Never Expose Stack Traces In Production Error Responses
- Return 409 For Resource Conflicts
- Return 429 With Retry-After For Rate Limiting
- Return 207 Multi-Status For Batch Operations
- Use 304 Not Modified For Conditional GET

### Anti-Patterns
- 200 OK for Everything
- 500 for Client Errors
- Custom Status Codes
- Stack Traces in Production
- Inconsistent Error Structure

## Related Knowledge
- Prerequisites
- Related
- Advanced



