# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-versioning
**Knowledge Unit:** Semantic Versioning for APIs
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Semantic Versioning for APIs implementation follows api-versioning patterns
- [ ] All edge cases handled for Semantic Versioning for APIs
- [ ] Full test coverage for Semantic Versioning for APIs
- [ ] Security review completed for Semantic Versioning for APIs
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Semantic Versioning for APIs
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] API SemVer applies to the contract, not the implementation â€” a library patch may be an API MAJOR.
- [ ] CI enforces conventional commit prefixes and maps them to version bumps.
- [ ] Version compatibility declared in the API root endpoint: `GET /api` returns supported versions and their status.
- [ ] LTS versions get extended support windows (24 months recommended).

---

# Implementation Checklist

- [ ] MAJOR/MINOR/PATCH definitions documented for the API
- [ ] URL version reflects MAJOR only
- [ ] Automated OpenAPI diff determines version bumps
- [ ] PATCH releases have zero contract change
- [ ] Version manifest maintained and published
- [ ] Changelog maps versions to release dates and changes
- [ ] LTS version policy defined
- [ ] Implement Semantic Versioning for APIs following api-versioning patterns
- [ ] Configure all required settings for Semantic Versioning for APIs
- [ ] Register route/middleware/service for Semantic Versioning for APIs
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] OpenAPI diff for version detection runs in CI â€” zero runtime cost.
- [ ] Version header injection adds negligible overhead (~0.01ms).
- [ ] `config('api.version')` reads are cached by Laravel config â€” O(1).

---

# Security Checklist

- [ ] PATCH releases should be deployable without consumer communication but security patches should be announced.
- [ ] Ensure LTS versions continue to receive security updates.
- [ ] Version ambiguity (misaligned version numbers) can lead to consumers running on unpatched versions.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] MAJOR/MINOR/PATCH definitions documented for the API
- [ ] URL version reflects MAJOR only
- [ ] Automated OpenAPI diff in CI determines version bumps
- [ ] Version manifest maintained and published
- [ ] Changelog maps API versions to release dates and changes
- [ ] LTS version policy defined (if applicable)
- [ ] Write feature tests for happy path of Semantic Versioning for APIs
- [ ] Write feature tests for validation failure of Semantic Versioning for APIs
- [ ] Write feature tests for authentication failure of Semantic Versioning for APIs
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

- [ ] Avoid: Version Inflation
- [ ] Avoid: Version Stagnation
- [ ] Avoid: No Automated Enforcement
- [ ] Avoid: MAJOR for Internal Refactors
- [ ] Avoid: MINOR for Breaking Changes

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
- Bump MAJOR Only For Consumer-Visible Breaking Changes
- Use URL MAJOR Version Only, Communicate MINOR Via Changelog
- Automate Version Bump Detection In CI
- Patch Releases Must Have Zero Contract Change
- Publish A Version Compatibility Table
- Maintain A Version Changelog With Conventional Commits
- Changed
- v2.0.0 (2026-06-01)
- v1.3.0 (2026-05-01)
- LTS Versions Get Extended Support Windows
- Never Ship Breaking Changes As MINOR

### Anti-Patterns
- Version Inflation
- Version Stagnation
- No Automated Enforcement
- MAJOR for Internal Refactors
- MINOR for Breaking Changes

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



