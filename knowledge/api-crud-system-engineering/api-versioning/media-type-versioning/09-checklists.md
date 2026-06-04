# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-versioning
**Knowledge Unit:** Media Type Versioning
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Media Type Versioning implementation follows api-versioning patterns
- [ ] All edge cases handled for Media Type Versioning
- [ ] Full test coverage for Media Type Versioning
- [ ] Security review completed for Media Type Versioning
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Media Type Versioning
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Content negotiation adds ~0.1ms for Accept header parsing and transformer resolution.
- [ ] Registry lookup should be cached to avoid file I/O or database queries.
- [ ] CDN cache fragmentation is the greatest operational challenge â€” each unique Accept value creates a separate cache partition.
- [ ] Log which media type was negotiated in every request for operations debugging.

---

# Implementation Checklist

- [ ] Standard vendor MIME type format used
- [ ] Content negotiation middleware implemented
- [ ] Unsupported media types return 406
- [ ] Response Content-Type echoes negotiated media type
- [ ] Transformer registry is cached
- [ ] `*/*` wildcard handled gracefully
- [ ] 406 rates logged and monitored
- [ ] Implement Media Type Versioning following api-versioning patterns
- [ ] Configure all required settings for Media Type Versioning
- [ ] Register route/middleware/service for Media Type Versioning
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Content negotiation adds ~0.1ms for header parsing and transformer resolution.
- [ ] Response serialization cost varies by transformer â€” versioned transformers may be slower.
- [ ] CDN cache fragmentation: `Vary: Accept` with multiple media types creates many cache partitions.
- [ ] Transformer factory caching: resolve once, cache for the worker's lifetime.

---

# Security Checklist

- [ ] Ensure media type parsing doesn't introduce Accept header injection vulnerabilities.
- [ ] Validate that deprecated media types don't expose unpatched security vulnerabilities.
- [ ] Log and monitor 406 rates as a signal of clients using outdated or typoed media types.
- [ ] Wildcard `*/*` Accept header should default safely, not expose internal version information.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Media type registry defined with all supported vendor MIME types
- [ ] Content negotiation middleware implemented and tested
- [ ] Response `Content-Type` echoes the negotiated media type
- [ ] Unsupported media types return 406 Not Acceptable
- [ ] Transformer registry is cached for performance
- [ ] CDN `Vary: Accept` configured correctly
- [ ] IANA registration completed for public APIs
- [ ] Write feature tests for happy path of Media Type Versioning
- [ ] Write feature tests for validation failure of Media Type Versioning
- [ ] Write feature tests for authentication failure of Media Type Versioning
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

- [ ] Avoid: No Media Type Registry
- [ ] Avoid: Removing Transformers Without Warning
- [ ] Avoid: IANA Staleness
- [ ] Avoid: Confusing Accept and Content-Type
- [ ] Avoid: Wildcard Acceptance Without Default

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
- Use Standard Vendor MIME Type Format
- Use Accept Header, Not Content-Type, For Version Negotiation
- Return 406 For Unsupported Media Types
- Cache The Transformer Registry
- Echo Negotiated Media Type In Response Content-Type
- Handle `*/*` Wildcard Gracefully
- Log And Monitor 406 Rates

### Anti-Patterns
- No Media Type Registry
- Removing Transformers Without Warning
- IANA Staleness
- Confusing Accept and Content-Type
- Wildcard Acceptance Without Default

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



