# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-versioning
**Knowledge Unit:** Backward-Compatible Changes
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Backward-Compatible Changes implementation follows api-versioning patterns
- [ ] All edge cases handled for Backward-Compatible Changes
- [ ] Full test coverage for Backward-Compatible Changes
- [ ] Security review completed for Backward-Compatible Changes
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Backward-Compatible Changes
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] The discipline is recognizing when an "improvement" is actually a breaking change in disguise.
- [ ] Laravel resources use `$this->when()` to conditionally include new fields based on request.
- [ ] Form requests use `nullable|sometimes` for newly optional fields.
- [ ] PHP 8.1+ enum `tryFrom()` handles new values gracefully for old clients.
- [ ] `$this->whenHas()` on resources is useful for conditionally including fields only when present.

---

# Implementation Checklist

- [ ] New fields added with null defaults (not required)
- [ ] New query parameters have default matching existing behavior
- [ ] Enum expansions are append-only
- [ ] New endpoints don't modify existing route structures
- [ ] Validation relaxed not tightened
- [ ] Documentation updated with "added in version X" notes
- [ ] Existing consumer tests pass without modification
- [ ] Implement Backward-Compatible Changes following api-versioning patterns
- [ ] Configure all required settings for Backward-Compatible Changes
- [ ] Register route/middleware/service for Backward-Compatible Changes
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] `$this->when()` adds negligible overhead (~0.01ms per condition).
- [ ] New query parameters don't affect request processing unless explicitly read.
- [ ] New endpoints don't impact existing route lookups.
- [ ] Enum `tryFrom()` is O(1) â€” no performance concern.

---

# Security Checklist

- [ ] New fields with `null` defaults are safe â€” they don't expose unintended data.
- [ ] Ensure new query parameters are validated to prevent injection through new code paths.
- [ ] Never add a new field that contains sensitive data without explicit authentication checks.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] New fields added with `null` defaults (not required)
- [ ] New query parameters have default behavior matching existing
- [ ] Enum expansions are append-only
- [ ] New endpoints don't modify existing route structures
- [ ] Documentation updated with "added in version X" notes
- [ ] Existing consumer tests pass without modification against the new endpoint version
- [ ] Write feature tests for happy path of Backward-Compatible Changes
- [ ] Write feature tests for validation failure of Backward-Compatible Changes
- [ ] Write feature tests for authentication failure of Backward-Compatible Changes
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

- [ ] Avoid: Silent Behavior Change
- [ ] Avoid: Validation Tightening
- [ ] Avoid: No Documentation
- [ ] Avoid: Non-Nullable Default Field
- [ ] Avoid: Field Removal in Minor Version

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
- Add New Fields With Null Default
- Use `$this->when()` For Conditional Fields
- Default New Query Parameters To Existing Behavior
- Expand Enums Append-Only
- Relax Validation Never Tighten
- Add New Endpoints Without Modifying Existing Routes
- Mark Deprecated Fields With Response Hints

### Anti-Patterns
- Silent Behavior Change
- Validation Tightening
- No Documentation
- Non-Nullable Default Field
- Field Removal in Minor Version

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



