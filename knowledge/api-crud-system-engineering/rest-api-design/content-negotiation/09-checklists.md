# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** rest-api-design
**Knowledge Unit:** Content Negotiation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Content Negotiation implementation follows rest-api-design patterns
- [ ] All edge cases handled for Content Negotiation
- [ ] Full test coverage for Content Negotiation
- [ ] Security review completed for Content Negotiation
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Content Negotiation
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Use `$request->expectsJson()` as the primary discriminator for JSON-capable clients.
- [ ] Parse vendor media types in middleware and store the version in request attributes.
- [ ] Set `Vary: Accept` on responses to ensure caches store different versions per Accept header.
- [ ] For multi-format APIs, implement format-specific resource classes or transform responses after the controller returns.
- [ ] Accept header parsing with quality values (`q=0.9`) is non-trivial â€” use Laravel's `$request->prefers()`.
- [ ] Add custom vendor media types to CORS allowed headers in `config/cors.php`.
- [ ] Evaluate: Response Format Negotiation Strategy
- [ ] Evaluate: Content-Type Validation for Write Endpoints
- [ ] Evaluate: Vendor Media Type Versioning vs URL Prefix Versioning

---

# Implementation Checklist

- [ ] `Accept` header dictates response format
- [ ] JSON returned by default
- [ ] JSON:API support via Accept header
- [ ] 406 for unsupported Accept
- [ ] Accept-Language for i18n
- [ ] 415 for unsupported Content-Type
- [ ] `Vary` header set correctly
- [ ] Implement Content Negotiation following rest-api-design patterns
- [ ] Configure all required settings for Content Negotiation
- [ ] Register route/middleware/service for Content Negotiation
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Parsing `Accept` header adds ~1-5Âµs per request. Cache parsed preferences per unique Accept header value for high-throughput APIs.
- [ ] JSON serialization is ~2-3x faster than XML in PHP â€” `json_encode` is optimized in PHP core.
- [ ] Adding vendor media type parsing in middleware adds negligible overhead (~1-5Âµs).
- [ ] `Vary: Accept` increases cache storage because each Accept value produces a separate cache entry.

---

# Security Checklist

- [ ] Validate `Accept` header against allowed formats â€” reject unsupported formats with 406, not 200 with wrong Content-Type.
- [ ] `Content-Type` validation on write endpoints prevents injection of non-JSON payloads that may bypass validation parsing.
- [ ] CORS `Access-Control-Allow-Headers` must include `Content-Type` and any vendor media types for preflight to succeed.
- [ ] Never trust `Accept` header for authorization decisions â€” it is a format preference, not an identity claim.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every response includes correct `Content-Type` header matching the response format.
- [ ] Requests with unsupported Accept headers receive 406 Not Acceptable.
- [ ] Error responses use the same format as successful responses for the same request.
- [ ] `Vary: Accept` header is present on responses that vary by content negotiation.
- [ ] Write endpoints validate `Content-Type` and reject unsupported request formats.
- [ ] Laravel's exception handler returns JSON for API requests (not HTML).
- [ ] Write feature tests for happy path of Content Negotiation
- [ ] Write feature tests for validation failure of Content Negotiation
- [ ] Write feature tests for authentication failure of Content Negotiation
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

- [ ] Avoid: JSON-Only But Ignoring Accept
- [ ] Avoid: Format via User-Agent Sniffing
- [ ] Avoid: URL Extension for Every Format Decision
- [ ] Avoid: Negotiation Without Vary Header
- [ ] Avoid: Silent Defaulting to JSON

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
- Validate Accept Header In Middleware
- Return JSON Error Responses For API Requests
- Validate Content-Type On Write Endpoints
- Set Vary: Accept On Content-Negotiated Responses
- Use expectsJson() As Primary Format Discriminator
- Use Prefers() For Quality-Weighted Format Selection
- Use Consistent Error Response Format Across All Status Codes
- Do Not Use URL Extension For Format Selection

### Decisions
- Response Format Negotiation Strategy
- Content-Type Validation for Write Endpoints
- Vendor Media Type Versioning vs URL Prefix Versioning

### Anti-Patterns
- JSON-Only But Ignoring Accept
- Format via User-Agent Sniffing
- URL Extension for Every Format Decision
- Negotiation Without Vary Header
- Silent Defaulting to JSON

## Related Knowledge
- Prerequisites
- Related
- Advanced



