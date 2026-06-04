# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Response Format Decision Framework
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Response Format Decision Framework implementation follows response-structures patterns
- [ ] All edge cases handled for Response Format Decision Framework
- [ ] Full test coverage for Response Format Decision Framework
- [ ] Security review completed for Response Format Decision Framework
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Response Format Decision Framework
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Format selection must be deterministic per endpoint and version â€” never dynamic at runtime.
- [ ] Use middleware or response adapters to transform internal representations into the target format.
- [ ] For multi-format APIs, implement content negotiation via `Accept` headers with proper `Vary` header.
- [ ] Error format can and should differ from success format. RFC 9457 errors + JSON:API resources is a common and defendable combination.
- [ ] Microservices internally use bare-body; API gateway transforms to envelope or JSON:API for external consumers.
- [ ] Cache granularity must account for format variants â€” cache the internal representation and format at the edge.
- [ ] Evaluate: Primary Response Format Selection
- [ ] Evaluate: Format Application Layer
- [ ] Evaluate: Hybrid Format Strategy

---

# Implementation Checklist

- [ ] Response format is consistent across all endpoints
- [ ] Format choice is documented and justified in API design docs
- [ ] Content negotiation is considered for format versioning
- [ ] Team understands the chosen format's conventions
- [ ] Tooling/libraries support the chosen format (JSON:API libraries exist)
- [ ] Format choice does not overcomplicate simple endpoints
- [ ] `Accept` header / `Content-Type` header reflects the format
- [ ] Implement Response Format Decision Framework following response-structures patterns
- [ ] Configure all required settings for Response Format Decision Framework
- [ ] Register route/middleware/service for Response Format Decision Framework
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] JSON:API compound documents serialize more data per request than envelope or bare-body due to included resources.
- [ ] RFC 9457 adds the `type` URI field to every error, increasing size slightly but providing machine-readable error taxonomy.
- [ ] Multi-format support via content negotiation adds response-time branching â€” pre-compute format strategy at route registration time.
- [ ] Serialization caching per format variant multiplies cache storage; cache internal representation and format at the edge.

---

# Security Checklist

- [ ] Format adapter must never expose internal model fields not intended for the target format â€” each format has its own serialization contract.
- [ ] Content negotiation fallback must not silently serve wrong format â€” if no matching format exists, return 406 Not Acceptable.
- [ ] RFC 9457 `type` URIs should point to documentation, not internal endpoints or debug pages.
- [ ] JSON:API compound documents must respect sparse fieldsets and include permissions â€” never include resources the client is not authorized to see.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every endpoint returns a consistent format per version (verified via integration tests).
- [ ] Error responses use RFC 9457 structure (`type`, `title`, `detail`, `status`, `instance`) across all endpoints.
- [ ] Content negotiation returns 406 Not Acceptable for unsupported formats â€” no silent fallback.
- [ ] Format policy is documented and enforced at the middleware or base controller level.
- [ ] All endpoints within a version use the same format â€” no per-endpoint variation.
- [ ] OpenAPI schema documents the response format correctly for each version.
- [ ] Write feature tests for happy path of Response Format Decision Framework
- [ ] Write feature tests for validation failure of Response Format Decision Framework
- [ ] Write feature tests for authentication failure of Response Format Decision Framework
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

- [ ] Avoid: No Response Format Decision Process
- [ ] Avoid: Inconsistent Format Across Similar Endpoints
- [ ] Avoid: No Format Documentation
- [ ] Avoid: Format Chosen for Developer Convenience
- [ ] Avoid: No Migration Path for Format Changes

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
- Rule 1: Lock Response Format to API Version
- Rule 2: Use RFC 9457 for ALL Error Responses Regardless of Success Format
- Rule 3: Start with Envelope, Optimize to Bare-Body Only When Measured
- Rule 4: Never Determine Format via User-Agent or Client Sniffing
- Rule 5: Return 406 Not Acceptable for Unsupported Formats
- Rule 6: Apply Format Transformation at Middleware Layer

### Decisions
- Primary Response Format Selection
- Format Application Layer
- Hybrid Format Strategy

### Anti-Patterns
- No Response Format Decision Process
- Inconsistent Format Across Similar Endpoints
- No Format Documentation
- Format Chosen for Developer Convenience
- No Migration Path for Format Changes

## Related Knowledge
- Prerequisites
- Related
- Advanced



