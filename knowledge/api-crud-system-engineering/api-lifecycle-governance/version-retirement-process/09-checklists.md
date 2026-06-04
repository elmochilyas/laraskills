# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-lifecycle-governance
**Knowledge Unit:** Version Retirement Process
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Version Retirement Process implementation follows api-lifecycle-governance patterns
- [ ] All edge cases handled for Version Retirement Process
- [ ] Full test coverage for Version Retirement Process
- [ ] Security review completed for Version Retirement Process
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Version Retirement Process

---

# Architecture Checklist

- [ ] Version routing at gateway level (nginx/OpenAPI), not application layer.
- [ ] Gateway returns 410 with `Link` header; after grace period, returns 404.
- [ ] Consumer registry with contact info is prerequisite for notification.
- [ ] Exception mechanism: allowlist with expiration dates to prevent indefinite extensions.
- [ ] Archive specs served from CDN with long cache headers.

---

# Implementation Checklist

- [ ] Consumer audit completed before freeze announcement
- [ ] Traffic-light stages implemented (green/yellow/red/black)
- [ ] Multi-wave notifications sent (6mo, 3mo, 30d)
- [ ] 410 response with migration Link header
- [ ] Rollback feature flag active for 30 days post-cutoff
- [ ] Spec and docs archived before removal
- [ ] Exception allowlist entries have expiration dates
- [ ] Migration progress tracked via daily dashboard
- [ ] Implement Version Retirement Process following api-lifecycle-governance patterns
- [ ] Configure all required settings for Version Retirement Process
- [ ] Register route/middleware/service for Version Retirement Process
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Version routing at gateway adds minimal latency (single map lookup).
- [ ] Migration report generation queries consumer registry and request logs â€” schedule daily, not real-time.
- [ ] Archived specs served from CDN with long cache headers reduces origin load.

---

# Security Checklist

- [ ] Retired versions may have unpatched vulnerabilities. Expedite removal.
- [ ] Archived specs may expose old security schemes. Review before making archive public.
- [ ] Consumer exception allowlist must be access-controlled and audited.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Version Retirement Process
- [ ] Write feature tests for validation failure of Version Retirement Process
- [ ] Write feature tests for authentication failure of Version Retirement Process
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
- Rule 1: Audit All Consumers Before Announcing Freeze
- Rule 2: Implement Traffic-Light Retirement Stages
- Rule 3: Return 410 Gone with Migration Link, Not Bare 404
- Rule 4: Maintain Rollback Capability for 30 Days Post-Cutoff
- Rule 5: Archive Spec and Docs Before Removal
- Rule 6: Grant Exceptions with Expiration Dates
- Rule 7: Stagger Migration Progress Tracking

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



