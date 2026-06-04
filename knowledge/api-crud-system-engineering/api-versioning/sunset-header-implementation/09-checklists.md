# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-versioning
**Knowledge Unit:** Sunset Header Implementation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Sunset Header Implementation implementation follows api-versioning patterns
- [ ] All edge cases handled for Sunset Header Implementation
- [ ] Full test coverage for Sunset Header Implementation
- [ ] Security review completed for Sunset Header Implementation
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Sunset Header Implementation
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Sunset header injection adds ~0.01ms â€” negligible.
- [ ] Config lookup is cached, O(1) â€” no performance concern.
- [ ] Scheduled sunset enforcement runs daily â€” negligible overhead.
- [ ] Post-sunset 410 responses are cacheable (`Cache-Control: public, max-age=86400`).
- [ ] The sunset date is a promise to your consumers â€” extend only when the cost of breaking consumers exceeds the cost of maintaining the old version.

---

# Implementation Checklist

- [ ] Sunset header with RFC 7231 date on deprecated responses
- [ ] Paired with Deprecation header
- [ ] Applied via middleware on route groups
- [ ] Sunset dates configured per version
- [ ] Consistent RFC 7231 GMT format
- [ ] Link header to migration guide
- [ ] Sunset header delivery monitored
- [ ] Removed after sunset date (replaced with 410)
- [ ] Sunset dates extendable based on migration
- [ ] Tests verify sunset header
- [ ] Implement Sunset Header Implementation following api-versioning patterns
- [ ] Configure all required settings for Sunset Header Implementation
- [ ] Register route/middleware/service for Sunset Header Implementation
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Sunset header injection adds ~0.01ms per response.
- [ ] Config lookup is cached, O(1).
- [ ] Post-sunset 410 responses are cacheable â€” reduce repeated processing.
- [ ] Scheduled sunset enforcement runs daily â€” negligible overhead.

---

# Security Checklist

- [ ] After sunset, the version must return 410 and not serve any data â€” including cached auth tokens.
- [ ] Ensure sunset enforcement doesn't introduce bypass vulnerabilities (e.g., version header overriding sunset logic).
- [ ] Timezone confusion: all sunset dates should be UTC to avoid consumer confusion across timezones.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] `Sunset` header present on all deprecated responses with HTTP-date format
- [ ] Paired with `Deprecation` header on all deprecated responses
- [ ] Sunset dates are at least 6 months after deprecation
- [ ] Automated sunset enforcement returns 410 on/after the sunset date
- [ ] 410 response includes migration message and link to alternative
- [ ] Post-sunset 410 responses are cacheable
- [ ] Sunset dates stored in config, not hardcoded
- [ ] Write feature tests for happy path of Sunset Header Implementation
- [ ] Write feature tests for validation failure of Sunset Header Implementation
- [ ] Write feature tests for authentication failure of Sunset Header Implementation
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

- [ ] Avoid: Missed Sunset
- [ ] Avoid: Premature 410
- [ ] Avoid: Perpetual Sunset
- [ ] Avoid: Sunset Without Deprecation
- [ ] Avoid: Missing 410 Response

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
- Always Pair Sunset With Deprecation Header
- Use HTTP-Date Format For Sunset Value
- Set Sunset Minimum 6 Months After Deprecation
- Automate Enforcement At Midnight On Sunset Date
- Never Extend A Sunset Date Lightly
- Cache Post-Sunset 410 Responses
- Store Sunset Dates In Config, Not Hardcoded

### Anti-Patterns
- Missed Sunset
- Premature 410
- Perpetual Sunset
- Sunset Without Deprecation
- Missing 410 Response

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



