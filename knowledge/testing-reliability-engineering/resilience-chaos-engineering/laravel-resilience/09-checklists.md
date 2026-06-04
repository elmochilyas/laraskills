# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Resilience & Chaos Engineering
**Knowledge Unit:** Laravel Resilience Fault Injection
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Write Fallback Code Before Writing Resilience Tests
- [ ] Apply rule: Always Assert Fallback Behavior After Fault Injection
- [ ] Apply rule: Use Per-Test Fault Activation â€” Never Global
- [ ] Apply rule: Use Short Timeout Values in Test Faults
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] External HTTP calls use `Http::timeout()` with appropriate values
- [ ] Retry logic uses exponential backoff (not immediate retries)
- [ ] Circuit breaker protects services with high failure impact
- [ ] Fallback values are defined for critical external dependencies
- [ ] Queue jobs have `backoff` and `retryUntil` configured
- [ ] Avoid: Treating Resilience like a mocking library
- [ ] Avoid: Not writing fallback code before resilience tests
- [ ] Avoid: Injecting faults without verifying fallback

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Workflow**: Discover services â†’ scaffold tests â†’ customize assertions â†’ inject faults â†’ verify fallback behavior.
- **Fault type selection**: Exception for crash scenarios, Timeout for slow responses, Latency for degradation testing.
- **Service decorator pattern**: Resilience extends container bindings; no changes to service or consumer code.
- **Fault lifecycle**: Define fault â†’ inject into service â†’ execute call â†’ fault triggers â†’ assert fallback â†’ clear fault after test.
- **Discovery frequency**: Run whenever container bindings change. Schedule quarterly for stable codebases.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Write Fallback Code Before Writing Resilience Tests
- [ ] Follow rule: Always Assert Fallback Behavior After Fault Injection
- [ ] Follow rule: Use Per-Test Fault Activation â€” Never Global
- [ ] Follow rule: Use Short Timeout Values in Test Faults
- [ ] Follow rule: Run Resilience Tests in a Separate CI Stage
- [ ] Follow rule: Follow the Discovery â†’ Scaffold â†’ Test Workflow
- [ ] - [ ] External HTTP calls use `Http::timeout()` with appropriate values
- [ ] - [ ] Retry logic uses exponential backoff (not immediate retries)
- [ ] - [ ] Circuit breaker protects services with high failure impact
- [ ] - [ ] Fallback values are defined for critical external dependencies

# Performance Checklist
- **Fault injection overhead**: <0.1ms per service call when no fault is active. Negligible.
- **Timeout fault**: Delays test by timeout duration. Use short timeouts (e.g., 100ms) for testing.
- **Latency fault**: Delays test by configured latency. Configure minimal (50-100ms) for testing.
- **Discovery**: 1-10 seconds depending on container binding count. Run on demand, not per-test.
- **Scaffold**: Generates files in milliseconds. No performance concern.

# Security Checklist
- **Never enable faults in production**: Resilience is designed for testing only. Use environment gating.
- **Service decorators in production**: The decorator pattern is safe for production (zero overhead when no fault is active), but the package should not be installed in production dependencies.
- **Fault persistence**: Ensure faults are cleared between tests to prevent cross-test contamination.

# Reliability Checklist
- [ ] Ensure: Laravel Resilience is a fault injection package that enables deterministic resil...
- [ ] Verify: Write Fallback Code Before Writing Resilience Tests
- [ ] Verify: Always Assert Fallback Behavior After Fault Injection
- [ ] Verify: Use Per-Test Fault Activation â€” Never Global
- [ ] Verify: Use Short Timeout Values in Test Faults

# Testing Checklist
- [ ] External HTTP calls use `Http::timeout()` with appropriate values
- [ ] Retry logic uses exponential backoff (not immediate retries)
- [ ] Circuit breaker protects services with high failure impact
- [ ] Fallback values are defined for critical external dependencies
- [ ] Queue jobs have `backoff` and `retryUntil` configured
- [ ] Rate limiting is configured for outbound API requests
- [ ] Avoid: Treating Resilience like a mocking library
- [ ] Avoid: Not writing fallback code before resilience tests
- [ ] Avoid: Injecting faults without verifying fallback

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Write Fallback Code Before Writing Resilience Tests
- [ ] Apply: Always Assert Fallback Behavior After Fault Injection
- [ ] Apply: Use Per-Test Fault Activation â€” Never Global
- [ ] Apply: Use Short Timeout Values in Test Faults

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Treating Resilience like a mocking library
- [ ] Avoid mistake: Not writing fallback code before resilience tests
- [ ] Avoid mistake: Injecting faults without verifying fallback
- [ ] Avoid mistake: Running resilience tests in the same job as regular tests

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
- Write Fallback Code Before Writing Resilience Tests
- Always Assert Fallback Behavior After Fault Injection
- Use Per-Test Fault Activation â€” Never Global
- Use Short Timeout Values in Test Faults
- Run Resilience Tests in a Separate CI Stage
- Follow the Discovery â†’ Scaffold â†’ Test Workflow
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Implement Laravel Resilience Patterns


