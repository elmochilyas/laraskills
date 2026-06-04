# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-lifecycle-governance
**Knowledge Unit:** Deprecation Policy Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Deprecation Policy Design implementation follows api-lifecycle-governance patterns
- [ ] All edge cases handled for Deprecation Policy Design
- [ ] Full test coverage for Deprecation Policy Design
- [ ] Security review completed for Deprecation Policy Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Deprecation Policy Design

---

# Architecture Checklist

- [ ] Inject Sunset/Deprecation headers via middleware scanning `#[Deprecated]` PHP attributes on routes.
- [ ] Gateway-level blocking after sunset date with progressive rate-limiting before hard cutoff.
- [ ] Deprecation window varies by endpoint criticality (critical = 12 months, standard = 6 months).
- [ ] Maintain consumer registry with contact information for proactive notification.
- [ ] Evaluate: Deprecation Window Duration â€” 6 vs 12 Months

---

# Implementation Checklist

- [ ] Deprecation phases defined (Warn, Sunset, Remove)
- [ ] Notice period set per consumer type
- [ ] Deprecation announced via headers, changelog, email
- [ ] Migration path documented for all consumers
- [ ] Consumer migration tracked via header monitoring
- [ ] Timeline extended if migration insufficient
- [ ] 410 Gone with replacement link after removal
- [ ] Deprecated code removed after sunset
- [ ] Post-deprecation review conducted
- [ ] Zero traffic confirmed before removal
- [ ] Implement Deprecation Policy Design following api-lifecycle-governance patterns
- [ ] Configure all required settings for Deprecation Policy Design
- [ ] Register route/middleware/service for Deprecation Policy Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Header injection adds sub-millisecond overhead.
- [ ] Deprecation logging at gateway should use async writes.
- [ ] Grace-period tracking uses small in-memory or Redis cache of consumer-id to expiry maps.
- [ ] Stale deprecated code paths add branch complexity and cache-miss overhead.

---

# Security Checklist

- [ ] Deprecated endpoints may have unpatched vulnerabilities. Expedite removal for security-related deprecations.
- [ ] Consumer notification must not expose PII through deprecation tracking.
- [ ] Rollback feature flags must be access-controlled.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Deprecation Policy Design
- [ ] Write feature tests for validation failure of Deprecation Policy Design
- [ ] Write feature tests for authentication failure of Deprecation Policy Design
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
- Rule 1: Always Provide Migration Path
- Rule 2: Use Deprecation and Sunset HTTP Headers
- Rule 3: Vary Deprecation Window by Endpoint Criticality
- Architecture
- Rule 4: Feature-Flag All Deprecation Cutoffs
- Rule 5: Log Deprecated Endpoint Usage for Consumer Outreach
- Rule 6: Send Multiple Notification Waves
- Rule 7: Use ISO 8601 Dates in All Deprecation Metadata
- Rule 8: Never Perpetually Deprecate

### Decisions
- Deprecation Window Duration â€” 6 vs 12 Months

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



