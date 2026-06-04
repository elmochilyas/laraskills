# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-versioning
**Knowledge Unit:** Version Retirement Policy
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Version Retirement Policy implementation follows api-versioning patterns
- [ ] All edge cases handled for Version Retirement Policy
- [ ] Full test coverage for Version Retirement Policy
- [ ] Security review completed for Version Retirement Policy
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Version Retirement Policy
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Retirement policy evaluation is an offline CI/ops task â€” zero runtime overhead.
- [ ] Published retirement policy at a stable URL so consumers can programmatically check.
- [ ] Version status lifecycle: `ACTIVE â†’ DEPRECATED â†’ SUNSET â†’ RETIRED`.
- [ ] Config-gated route loading enables emergency restore of retired versions.
- [ ] Automated removal via scheduled commands running on a nightly cron.

---

# Implementation Checklist

- [ ] Retirement policy published publicly
- [ ] Minimum notice period defined (12mo public, 6mo internal)
- [ ] Retirement criteria enforced (traffic %, notice period, alternative stability)
- [ ] Retirement queue maintained with priority scoring
- [ ] Exception register maintained with approval chain
- [ ] Post-retirement 410 maintained for 90 days
- [ ] Post-retirement validation runs automatically
- [ ] Implement Version Retirement Policy following api-versioning patterns
- [ ] Configure all required settings for Version Retirement Policy
- [ ] Register route/middleware/service for Version Retirement Policy
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Retirement policy evaluation runs offline â€” zero runtime cost.
- [ ] Exception handling is a process, not code â€” no performance impact.
- [ ] Post-retirement validation runs as a test suite, not in production.

---

# Security Checklist

- [ ] Emergency retirement process for security vulnerabilities (bypasses standard timeline).
- [ ] Ensure retired versions don't accidentally serve data due to configuration drift.
- [ ] Post-retirement audit to verify retired versions return 410 and serve no traffic.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Retirement policy documented and published publicly
- [ ] Minimum notice period defined (12mo public, 6mo internal)
- [ ] Retirement criteria defined and enforced (traffic %, notice period, alternative stability)
- [ ] Retirement queue maintained with priority scoring
- [ ] Exception process documented with approval chain
- [ ] Post-retirement 410 responses maintained for 90 days
- [ ] Retirement audit runs automatically to verify versions are gone
- [ ] Write feature tests for happy path of Version Retirement Policy
- [ ] Write feature tests for validation failure of Version Retirement Policy
- [ ] Write feature tests for authentication failure of Version Retirement Policy
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

- [ ] Avoid: Perpetual Support
- [ ] Avoid: Surprise Retirement
- [ ] Avoid: Policy as Excuse
- [ ] Avoid: No Exception Process
- [ ] Avoid: Unenforced Policy

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
- Publish The Retirement Policy Publicly
- Never Retire Without A Stable Alternative Available
- Automate Retirement Eligibility Checks
- Use A Retirement Queue Prioritized By Traffic
- Maintain Exception Register With Approval Chain
- Post-Retention 410 Guarantee For 90 Days
- Config-Gated Route Loading Enables Emergency Restore
- Perform Post-Retirement Validation

### Anti-Patterns
- Perpetual Support
- Surprise Retirement
- Policy as Excuse
- No Exception Process
- Unenforced Policy

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



