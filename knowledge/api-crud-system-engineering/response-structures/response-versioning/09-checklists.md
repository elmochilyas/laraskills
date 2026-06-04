# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Response Versioning
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Response Versioning implementation follows response-structures patterns
- [ ] All edge cases handled for Response Versioning
- [ ] Full test coverage for Response Versioning
- [ ] Security review completed for Response Versioning
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Response Versioning
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Use URL prefix versioning (`/api/v1/`, `/api/v2/`) for simplicity. Route files per version: `routes/api/v1.php`, `routes/api/v2.php`.
- [ ] Implement a resource factory that resolves version-specific resource classes from the detected version string.
- [ ] Keep the database schema version-agnostic â€” only the response layer varies by version.
- [ ] Versioned pagination metadata follows the same pattern: `UserCollectionV1`, `UserCollectionV2`.
- [ ] Cache per version â€” each version creates a separate cache namespace. Versioned cache keys multiply storage.
- [ ] Test all versions in CI/CD â€” regression in one version must not affect others.
- [ ] Evaluate: Version Manifestation Strategy
- [ ] Evaluate: Versioned Resource Class Strategy
- [ ] Evaluate: Sunset and Deprecation Strategy

---

# Implementation Checklist

- [ ] Versioned Resource classes per version
- [ ] Version detection from request attribute
- [ ] Dispatch to correct Resource class
- [ ] Shared base Resource for common fields
- [ ] Removed fields = new Resource, not conditional
- [ ] Versioned responses tested per version
- [ ] Shape differences documented
- [ ] Implement Response Versioning following response-structures patterns
- [ ] Configure all required settings for Response Versioning
- [ ] Register route/middleware/service for Response Versioning
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Version detection from URL or header adds ~0.01ms per request â€” negligible.
- [ ] Separate resource classes avoid branching entirely; conditional serialization adds branching cost that grows with field count.
- [ ] Each version creates a separate cache namespace, multiplying storage requirements.
- [ ] Version negotiation middleware adds one extra middleware execution â€” measurable but negligible at single-digit percentages.

---

# Security Checklist

- [ ] Deprecated versions must still receive security patches â€” attackers target older, unpatched versions.
- [ ] Version detection must be robust against header injection â€” validate `Accept` header format before parsing version.
- [ ] Rate limits per version can encourage migration â€” lower limits on deprecated versions drive adoption of newer versions.
- [ ] A deprecated version with a known vulnerability must be force-sunset immediately, not on the planned timeline.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Each API version has its own set of resource classes â€” no conditional version branching in shared resources.
- [ ] Deprecated version responses include `Deprecation` and `Sunset` headers.
- [ ] The version detection strategy (URL, header, or parameter) is consistent across all endpoints.
- [ ] The full test suite passes for all supported API versions.
- [ ] Database schema is version-agnostic â€” no version-specific columns or tables.
- [ ] Version lifecycle is documented with sunset dates and migration guides.
- [ ] Write feature tests for happy path of Response Versioning
- [ ] Write feature tests for validation failure of Response Versioning
- [ ] Write feature tests for authentication failure of Response Versioning
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

- [ ] Avoid: No Response Versioning Strategy
- [ ] Avoid: Breaking Changes Without New Version
- [ ] Avoid: Multiple Response Versions in Single Code Path
- [ ] Avoid: Inconsistent Version Application
- [ ] Avoid: Old Version Never Deprecated

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
- Rule 1: Use Separate Resource Classes per Version
- Rule 2: Require Explicit Version Specification
- Rule 3: Include `Deprecation` and `Sunset` Headers on Deprecated Versions
- Rule 4: Keep Database Schema Version-Agnostic
- Rule 5: Share Base Logic via Inheritance, Not Conditional Branches
- Rule 6: Test All Supported Versions in a Single CI Run
- Rule 7: Sunset Old Versions on a Documented Timeline

### Decisions
- Version Manifestation Strategy
- Versioned Resource Class Strategy
- Sunset and Deprecation Strategy

### Anti-Patterns
- No Response Versioning Strategy
- Breaking Changes Without New Version
- Multiple Response Versions in Single Code Path
- Inconsistent Version Application
- Old Version Never Deprecated

## Related Knowledge
- Prerequisites
- Related
- Advanced



