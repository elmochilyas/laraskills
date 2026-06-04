# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Feature & HTTP Testing
**Knowledge Unit:** Validation Testing with Datasets
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Test every boundary, not every value
- [ ] Apply rule: For every field, test valid, missing, and one invalid format
- [ ] Apply rule: Test Form Requests in isolation for speed; test via HTTP for integration
- [ ] Apply rule: Use named datasets for readable failure output
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Every Form Request has a corresponding validation test file
- [ ] Every custom validation rule has a unit test
- [ ] Each field tested with valid, missing, and invalid scenarios
- [ ] Boundaries tested (N-1, N, N+1), not every value
- [ ] Dataset cases use named keys for readable failure output
- [ ] Avoid: Mistake
- [ ] Avoid: Only testing valid data
- [ ] Avoid: Testing validation via controller only

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Form Request test vs HTTP test**: Test Form Requests directly for rule correctness. Test via HTTP for end-to-end validation integration.
- **Dataset function vs inline arrays**: Extract datasets to functions for reuse across tests. Inline for one-off cases.
- **Boundary value selection**: Test exactly at the boundary, one below, one above.
- **Valid data factory**: Create a helper `validData()` returning a valid payload. Tests override specific fields for invalid scenarios.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Test every boundary, not every value
- [ ] Follow rule: For every field, test valid, missing, and one invalid format
- [ ] Follow rule: Test Form Requests in isolation for speed; test via HTTP for integration
- [ ] Follow rule: Use named datasets for readable failure output
- [ ] Follow rule: Assert error structure, not exact error message text
- [ ] Follow rule: Test Form Request `authorize()` method separately from validation rules
- [ ] - [ ] Every Form Request has a corresponding validation test file
- [ ] - [ ] Every custom validation rule has a unit test
- [ ] - [ ] Each field tested with valid, missing, and invalid scenarios
- [ ] - [ ] Boundaries tested (N-1, N, N+1), not every value

# Performance Checklist
- Form Request tests: <5ms per test (instantiate request, run validate).
- HTTP validation tests: ~30-50ms per test (full request pipeline).
- Rule unit tests: <1ms per scenario. Use for all custom rules.
- Dataset explosion: Combining multiple dataset dimensions can generate thousands of tests. Use targeted combinations.

# Security Checklist
- Validation IS the primary security boundary against injection attacks.
- Test that SQL injection, XSS, and command injection payloads are rejected.
- Test that file upload validation rejects malicious files.
- Test that mass assignment protection works through Form Requests.

# Reliability Checklist
- [ ] Ensure: Validation testing verifies that form requests and controller validation rules c...
- [ ] Verify: Test every boundary, not every value
- [ ] Verify: For every field, test valid, missing, and one invalid format
- [ ] Verify: Test Form Requests in isolation for speed; test via HTTP for integration
- [ ] Verify: Use named datasets for readable failure output

# Testing Checklist
- [ ] Every Form Request has a corresponding validation test file
- [ ] Every custom validation rule has a unit test
- [ ] Each field tested with valid, missing, and invalid scenarios
- [ ] Boundaries tested (N-1, N, N+1), not every value
- [ ] Dataset cases use named keys for readable failure output
- [ ] Form Requests tested in isolation (fast) AND via HTTP (integration)
- [ ] Avoid: Mistake
- [ ] Avoid: Only testing valid data
- [ ] Avoid: Testing validation via controller only

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Test every boundary, not every value
- [ ] Apply: For every field, test valid, missing, and one invalid format
- [ ] Apply: Test Form Requests in isolation for speed; test via HTTP for integration
- [ ] Apply: Use named datasets for readable failure output

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Only testing valid data
- [ ] Avoid mistake: Testing validation via controller only
- [ ] Avoid mistake: Hardcoding error message text
- [ ] Avoid mistake: Testing all possible invalid values

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Rules
- Test every boundary, not every value
- For every field, test valid, missing, and one invalid format
- Test Form Requests in isolation for speed; test via HTTP for integration
- Use named datasets for readable failure output
- Assert error structure, not exact error message text
- Test Form Request `authorize()` method separately from validation rules
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Test Validation Rules with Datasets


