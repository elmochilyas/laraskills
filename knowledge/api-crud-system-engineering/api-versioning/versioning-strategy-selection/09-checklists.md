# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-versioning
**Knowledge Unit:** Versioning Strategy Selection
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Versioning Strategy Selection implementation follows api-versioning patterns
- [ ] All edge cases handled for Versioning Strategy Selection
- [ ] Full test coverage for Versioning Strategy Selection
- [ ] Security review completed for Versioning Strategy Selection
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Versioning Strategy Selection
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Switching strategies later is expensive; choose early and document.
- [ ] Hybrid approaches must have clear boundaries (e.g., URL for major, header for minor).
- [ ] URL path versioning is the most commonly expected for public APIs.
- [ ] Header versioning reduces URL churn for internal services.
- [ ] Media-type versioning is the choice for APIs supporting multiple serialization formats per version.

---

# Implementation Checklist

- [ ] Consumer profile evaluated against each strategy
- [ ] Cache infrastructure requirements checked
- [ ] URL stability requirement documented
- [ ] Team capacity to maintain multiple versions assessed
- [ ] Framework capabilities verified
- [ ] Backward compatibility policy decided (N or N-2)
- [ ] Strategy decision documented with rationale
- [ ] Deprecation policy set from initial version
- [ ] Implement Versioning Strategy Selection following api-versioning patterns
- [ ] Configure all required settings for Versioning Strategy Selection
- [ ] Register route/middleware/service for Versioning Strategy Selection
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] All three strategies have negligible performance differences (~0.05-0.15ms per request).
- [ ] The main performance driver is the number of versions, not the strategy choice.
- [ ] URL versioning requires no `Vary` header, reducing CDN complexity.

---

# Security Checklist

- [ ] URL versioning makes version obvious in logs â€” easier to detect deprecated version abuse.
- [ ] Header versioning can hide the version from security monitoring tools that only inspect URLs.
- [ ] Ensure version parsing middleware doesn't introduce injection vulnerabilities.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Decision matrix completed with weighted criteria
- [ ] ADR written documenting chosen strategy with rationale
- [ ] Prototype implemented in chosen strategy
- [ ] Strategy documented in API style guide
- [ ] Team trained on the chosen approach
- [ ] Write feature tests for happy path of Versioning Strategy Selection
- [ ] Write feature tests for validation failure of Versioning Strategy Selection
- [ ] Write feature tests for authentication failure of Versioning Strategy Selection
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

- [ ] Avoid: Strategy Mismatch
- [ ] Avoid: No ADR
- [ ] Avoid: Analysis Paralysis
- [ ] Avoid: Consumer Ignorance
- [ ] Avoid: Mid-Lifecycle Strategy Switch

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
- Choose Based On Consumer Ease, Not Purity
- Document Strategy In An Architecture Decision Record
- Prototype The Simplest Endpoint In All Candidates
- Use Weighted Decision Matrix For Objective Comparison
- Match Strategy To API Type And Audience
- Avoid Hybrid Strategies Without Clear Boundaries
- Decide Before Shipping Any Endpoints

### Anti-Patterns
- Strategy Mismatch
- No ADR
- Analysis Paralysis
- Consumer Ignorance
- Mid-Lifecycle Strategy Switch

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



