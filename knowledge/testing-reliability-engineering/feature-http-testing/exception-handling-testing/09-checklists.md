# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Feature & HTTP Testing
**Knowledge Unit:** Exception Handling Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always call `Exceptions::fake()` before triggering exceptions in reporting tests
- [ ] Apply rule: Test both reporting and rendering for critical exceptions
- [ ] Apply rule: Assert that expected exceptions (validation, 404, auth) are NOT reported
- [ ] Apply rule: Test exception context data for debugging information
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] `Exceptions::fake()` called before triggering exceptions in reporting tests
- [ ] Critical exceptions tested for both reporting and rendering
- [ ] Expected exceptions (validation, 404, auth) tested with `assertNotReported()`
- [ ] Exception context data verified for key debugging fields
- [ ] Sensitive data redaction in exception context tested
- [ ] Avoid: Mistake
- [ ] Avoid: Not calling `Exceptions::fake()` before triggering exception
- [ ] Avoid: Testing exception rendering without testing reporting

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **`Exceptions::fake()` vs custom handler testing**: Use `Exceptions::fake()` for integration tests. Test custom handler methods directly for unit-level handler behavior.
- **Reporting vs Rendering tests**: Test reporting to verify error monitoring. Test rendering to verify user-facing error pages. Test separately.
- **Production vs testing reporting**: Some exceptions should only be reported in production. Test that `report()` checks environment before reporting.
- **Silent exception handling**: HTTP exceptions should return appropriate status codes even if reporting fails. Test exception handling resilience.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always call `Exceptions::fake()` before triggering exceptions in reporting tests
- [ ] Follow rule: Test both reporting and rendering for critical exceptions
- [ ] Follow rule: Assert that expected exceptions (validation, 404, auth) are NOT reported
- [ ] Follow rule: Test exception context data for debugging information
- [ ] Follow rule: Test sensitive data redaction in exception context
- [ ] - [ ] `Exceptions::fake()` called before triggering exceptions in reporting tests
- [ ] - [ ] Critical exceptions tested for both reporting and rendering
- [ ] - [ ] Expected exceptions (validation, 404, auth) tested with `assertNotReported()`
- [ ] - [ ] Exception context data verified for key debugging fields

# Performance Checklist
- `Exceptions::fake()` overhead: <1ms. Stores exceptions in an array.
- Exception reporting in real handler: Could be slow (network calls to Sentry/Flare). Faking eliminates this.
- Exception rendering assertions: Similar cost to any HTTP response assertion.
- Custom handler unit tests: Sub-millisecond.

# Security Checklist
- Test that sensitive data (passwords, tokens, PII) is stripped from exception context before reporting.
- Test that error responses don't leak internal details (stack traces, query parameters, file paths).
- Test that authentication exceptions don't reveal whether a user exists.

# Reliability Checklist
- [ ] Ensure: Exception handling testing verifies that application exceptions are correctly re...
- [ ] Verify: Always call `Exceptions::fake()` before triggering exceptions in reporting tests
- [ ] Verify: Test both reporting and rendering for critical exceptions
- [ ] Verify: Assert that expected exceptions (validation, 404, auth) are NOT reported
- [ ] Verify: Test exception context data for debugging information

# Testing Checklist
- [ ] `Exceptions::fake()` called before triggering exceptions in reporting tests
- [ ] Critical exceptions tested for both reporting and rendering
- [ ] Expected exceptions (validation, 404, auth) tested with `assertNotReported()`
- [ ] Exception context data verified for key debugging fields
- [ ] Sensitive data redaction in exception context tested
- [ ] Error response format tested (consistent JSON structure)
- [ ] Avoid: Mistake
- [ ] Avoid: Not calling `Exceptions::fake()` before triggering exception
- [ ] Avoid: Testing exception rendering without testing reporting

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always call `Exceptions::fake()` before triggering exceptions in reporting tests
- [ ] Apply: Test both reporting and rendering for critical exceptions
- [ ] Apply: Assert that expected exceptions (validation, 404, auth) are NOT reported
- [ ] Apply: Test exception context data for debugging information

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not calling `Exceptions::fake()` before triggering exception
- [ ] Avoid mistake: Testing exception rendering without testing reporting
- [ ] Avoid mistake: Forgetting to restore exception handler
- [ ] Avoid mistake: Testing framework exceptions instead of application exceptions

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
- Always call `Exceptions::fake()` before triggering exceptions in reporting tests
- Test both reporting and rendering for critical exceptions
- Assert that expected exceptions (validation, 404, auth) are NOT reported
- Test exception context data for debugging information
- Test sensitive data redaction in exception context
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Test Exception Reporting and Rendering


