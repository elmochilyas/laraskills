# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Per-Page Parameter Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Per-Page Parameter Design implementation follows pagination-strategies patterns
- [ ] All edge cases handled for Per-Page Parameter Design
- [ ] Full test coverage for Per-Page Parameter Design
- [ ] Security review completed for Per-Page Parameter Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Per-Page Parameter Design
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Configure model-specific defaults using `Model::$perPage` property or `Paginator::defaultPerPage()` globally.
- [ ] Use static defaults for predictability; avoid dynamic defaults (client-type-based) unless documented.
- [ ] Provide a per-endpoint configuration array mapping resources to their default and max per_page values.
- [ ] For admin/internal endpoints, use more generous limits; for public endpoints, use restrictive limits.
- [ ] Log and monitor requests with per_page values near the maximum for abuse detection.
- [ ] Evaluate: Clamping vs Rejection Decision

---

# Implementation Checklist

- [ ] Default per_page configured
- [ ] Max per_page cap enforced
- [ ] Positive integer validation
- [ ] 422 for exceeds max
- [ ] 422 for non-numeric/zero
- [ ] Default used when omitted
- [ ] Documented behavior
- [ ] Implement Per-Page Parameter Design following pagination-strategies patterns
- [ ] Configure all required settings for Per-Page Parameter Design
- [ ] Register route/middleware/service for Per-Page Parameter Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] per_page=10: ~2-5KB response, 10 requests for 100 records.
- [ ] per_page=100: ~20-50KB response, 1 request for 100 records.
- [ ] per_page=1000: ~200-500KB response, 1 request but 5-10x slower.
- [ ] Optimal per_page balances response size (network time) with request count (round trips) â€” 15-25 is typically the sweet spot.
- [ ] Large per_page increases query execution time, memory usage, and serialization cost (Eloquent hydration, JSON encoding).

---

# Security Checklist

- [ ] Unbounded per_page is a resource exhaustion vector â€” always enforce a maximum.
- [ ] Requests with per_page near the maximum may indicate scraping or abuse â€” log and monitor.
- [ ] Rate limiting should account for per_page; large page requests consume more resources.
- [ ] Validate that per_page is a positive integer; zero or negative values can crash pagination logic.
- [ ] For authenticated endpoints, consider user-specific per_page limits based on subscription tier.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] per_page has a documented and enforced maximum value
- [ ] Default per_page is configured per resource (model or endpoint)
- [ ] Parameter naming is consistent across all endpoints (per_page or limit, not both)
- [ ] per_page is validated as integer with min:1 and max:{configured}
- [ ] Clamping (min/max) is used instead of hard rejection for out-of-range values
- [ ] Mobile and web clients have appropriate default/max values
- [ ] Large per_page requests are logged and monitored
- [ ] Rate limiting accounts for per_page value
- [ ] Dedicated export endpoint exists for batch data retrieval (not using per_page for this)
- [ ] Write feature tests for happy path of Per-Page Parameter Design
- [ ] Write feature tests for validation failure of Per-Page Parameter Design
- [ ] Write feature tests for authentication failure of Per-Page Parameter Design
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

- [ ] Avoid: Unlimited Per-Page
- [ ] Avoid: Default Per-Page Too High
- [ ] Avoid: Per-Page Not Configurable
- [ ] Avoid: Per-Page Ignored for Cursor Pagination
- [ ] Avoid: Excessive Max Per-Page

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
- Always Enforce a Documented Maximum per_page
- Use Consistent per_page Naming Across All Endpoints
- Use Clamping Over Rejection for Out-of-Range Values
- Choose Default per_page Based on Median Record Size
- Validate per_page as Positive Integer
- Set Different Defaults for Mobile vs Web Clients
- Log Large per_page Requests for Abuse Detection
- Use Dedicated Export Endpoints for Batch Data Retrieval

### Decisions
- Clamping vs Rejection Decision

### Anti-Patterns
- Unlimited Per-Page
- Default Per-Page Too High
- Per-Page Not Configurable
- Per-Page Ignored for Cursor Pagination
- Excessive Max Per-Page

## Related Knowledge
- Offset Pagination Design â€” Where per_page is used
- Cursor Pagination Design â€” Where per_page/limit is used
- Pagination Strategy Selection â€” Context for per_page decisions
- Rate Limiting Design â€” Relationship between per_page and resource consumption
- Response Payload Optimization â€” Minimizing per-page data transfer



