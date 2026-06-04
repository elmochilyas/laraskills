# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-lifecycle-governance
**Knowledge Unit:** Request Size Limits
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Request Size Limits implementation follows api-lifecycle-governance patterns
- [ ] All edge cases handled for Request Size Limits
- [ ] Full test coverage for Request Size Limits
- [ ] Security review completed for Request Size Limits
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Request Size Limits

---

# Architecture Checklist

- [ ] nginx `client_max_body_size` rejects oversized requests at TCP level before application.
- [ ] PHP `upload_max_filesize` and `post_max_size` configured in php.ini.
- [ ] Laravel middleware enforces business-specific limits per endpoint or consumer tier.
- [ ] Limits documented in error responses and developer portal.
- [ ] Separate upload endpoint with streaming + resumable protocol for large files (video).

---

# Implementation Checklist

- [ ] nginx limit â‰¤ PHP limit â‰¤ Laravel limit (strictest at outermost)
- [ ] Tiered limits by consumer (Free/Pro/Enterprise)
- [ ] Endpoint-specific limits (upload endpoints higher)
- [ ] Streaming enforcement (not after full buffering)
- [ ] 413 response with limit info, actual size, and upgrade path
- [ ] X-Content-Length-Limit header on responses
- [ ] Oversized request logging without payload content
- [ ] Implement Request Size Limits following api-lifecycle-governance patterns
- [ ] Configure all required settings for Request Size Limits
- [ ] Register route/middleware/service for Request Size Limits
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] nginx rejects at TCP level â€” minimal resource cost.
- [ ] Larger PHP limits increase per-worker memory pressure.
- [ ] Streaming uploads to disk reduces per-request memory footprint.
- [ ] Validation at nginx prevents wasted application processing on invalid requests.

---

# Security Checklist

- [ ] Request size limits are first line of defense against DoS via large payloads.
- [ ] DoS via chunked transfer: enforce cumulative size limit, not per-chunk.
- [ ] Log oversized requests with consumer ID, actual size, endpoint â€” not payload content.
- [ ] Tiered limits prevent free-tier abuse while supporting enterprise needs.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Request Size Limits
- [ ] Write feature tests for validation failure of Request Size Limits
- [ ] Write feature tests for authentication failure of Request Size Limits
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
- Rule 1: Enforce Strictest Limit at Outermost Layer (nginx)
- Rule 2: Use Tiered Limits Per Consumer
- Rule 3: Return 413 with Limit Info and Upgrade Path
- Rule 4: Enforce Limit During Streaming, Not After Buffering
- Rule 5: Log Oversized Requests Without Payload Content
- Rule 6: Configure Endpoint-Specific Overrides for Uploads
- Rule 7: Include X-Content-Length-Limit Header

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



