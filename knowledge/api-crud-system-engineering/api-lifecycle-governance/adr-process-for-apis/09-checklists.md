# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-lifecycle-governance
**Knowledge Unit:** ADR Process for APIs
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] ADR Process for APIs implementation follows api-lifecycle-governance patterns
- [ ] All edge cases handled for ADR Process for APIs
- [ ] Full test coverage for ADR Process for APIs
- [ ] Security review completed for ADR Process for APIs
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for ADR Process for APIs

---

# Architecture Checklist

- [ ] Store ADRs in `docs/adr/` directory in repository (version-controlled, reviewable in PRs).
- [ ] Use expanded Michael Nygard template with API-specific sections.
- [ ] ADRs affect API surface or security require team lead approval.
- [ ] Add `affects:` frontmatter field listing affected endpoints for searchability.
- [ ] CI linting verifies ADR template compliance (required sections, valid status transitions).
- [ ] Evaluate: ADR Timing â€” Before Implementation vs After
- [ ] Evaluate: ADR Depth â€” Single-Page vs Detailed

---

# Implementation Checklist

- [ ] One ADR per decision (not bundled)
- [ ] Written during design phase, not after implementation
- [ ] YAML frontmatter included (status, date, supersedes, affects)
- [ ] Sequential numbering with descriptive name
- [ ] Submitted and reviewed as PR before merging
- [ ] ADR numbers referenced in commit messages and code comments
- [ ] Superseded ADRs retained with updated status
- [ ] ADR length within 1-2 page limit
- [ ] Implement ADR Process for APIs following api-lifecycle-governance patterns
- [ ] Configure all required settings for ADR Process for APIs
- [ ] Register route/middleware/service for ADR Process for APIs
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] ADRs are static documents â€” no runtime performance impact.
- [ ] ADR tooling (search, indexing) has negligible overhead.

---

# Security Checklist

- [ ] ADRs may document security decisions. Ensure access control if stored in private repository.
- [ ] Security-related ADRs should be reviewed by security team before acceptance.
- [ ] Do not include credentials, secrets, or vulnerability details in ADRs.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of ADR Process for APIs
- [ ] Write feature tests for validation failure of ADR Process for APIs
- [ ] Write feature tests for authentication failure of ADR Process for APIs
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
- Rule 1: Write One ADR Per Decision
- Rule 2: Write ADRs Before or During Design Phase
- Rule 3: Review ADRs Like Code in PRs
- Rule 4: Reference ADR Numbers in Commit Messages and Code Comments
- Rule 5: Never Delete Superseded ADRs
- Rule 6: Use YAML Frontmatter for Machine-Readability
- Rule 7: Keep ADRs to 1-2 Pages

### Decisions
- ADR Timing â€” Before Implementation vs After
- ADR Depth â€” Single-Page vs Detailed

## Related Knowledge
- Prerequisites
- Closely Related
- Advanced



