# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Performance & Load Testing
**Knowledge Unit:** VoltTest Laravel Performance Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always Use VoltTest for Relative Comparison, Not Absolute Measurement
- [ ] Apply rule: Run Minimum 100 Iterations Per Configuration
- [ ] Apply rule: Always Warm Up Before Collecting Metrics
- [ ] Apply rule: Test at Multiple Concurrency Levels
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Volttest is installed and configured
- [ ] Response time budgets are defined for each endpoint
- [ ] Concurrency levels match expected production traffic
- [ ] Error rate assertions are included (should be 0%)
- [ ] Tests run in CI as non-blocking advisory or blocking gate
- [ ] Avoid: Mistake
- [ ] Avoid: Treating VoltTest metrics as absolute
- [ ] Avoid: Running with too few iterations

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **VoltTest vs external tools**: VoltTest for quick developer feedback and CI gates. External tools for pre-release full-stack testing. Use both.
- **Concurrency model**: PHP process-based concurrency. Thread-based if `pthreads` or `parallel` extension is available.
- **Assertion thresholds**: 50% buffer over observed local performance. Tighten as CI environment stabilizes.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always Use VoltTest for Relative Comparison, Not Absolute Measurement
- [ ] Follow rule: Run Minimum 100 Iterations Per Configuration
- [ ] Follow rule: Always Warm Up Before Collecting Metrics
- [ ] Follow rule: Test at Multiple Concurrency Levels
- [ ] Follow rule: Set Generous Thresholds for CI Assertions
- [ ] Follow rule: Use Before/After Comparison for Optimization Validation
- [ ] - [ ] Volttest is installed and configured
- [ ] - [ ] Response time budgets are defined for each endpoint
- [ ] - [ ] Concurrency levels match expected production traffic
- [ ] - [ ] Error rate assertions are included (should be 0%)

# Performance Checklist
- VoltTest overhead: Minimal. Response times are 0.5-2ms less than HTTP-level testing.
- Concurrency scaling: 1-50 concurrent users on standard hardware.
- Memory: Each concurrent process consumes ~20-50MB for Laravel boot.
- Test duration: 10-60 seconds per configuration.
- Database connections: Each process needs a connection. Ensure `max_connections` is sufficient.

# Security Checklist
- Run VoltTest on CI test environment, not production.
- Use separate test database â€” VoltTest creates real database state.
- Rate limiting may interfere with VoltTest tests. Disable for test endpoints.

# Reliability Checklist
- [ ] Ensure: VoltTest is a PHP-native performance and load testing package for Laravel that r...
- [ ] Verify: Always Use VoltTest for Relative Comparison, Not Absolute Measurement
- [ ] Verify: Run Minimum 100 Iterations Per Configuration
- [ ] Verify: Always Warm Up Before Collecting Metrics
- [ ] Verify: Test at Multiple Concurrency Levels

# Testing Checklist
- [ ] Volttest is installed and configured
- [ ] Response time budgets are defined for each endpoint
- [ ] Concurrency levels match expected production traffic
- [ ] Error rate assertions are included (should be 0%)
- [ ] Tests run in CI as non-blocking advisory or blocking gate
- [ ] Performance budgets are reviewed quarterly
- [ ] Avoid: Mistake
- [ ] Avoid: Treating VoltTest metrics as absolute
- [ ] Avoid: Running with too few iterations

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always Use VoltTest for Relative Comparison, Not Absolute Measurement
- [ ] Apply: Run Minimum 100 Iterations Per Configuration
- [ ] Apply: Always Warm Up Before Collecting Metrics
- [ ] Apply: Test at Multiple Concurrency Levels

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Treating VoltTest metrics as absolute
- [ ] Avoid mistake: Running with too few iterations
- [ ] Avoid mistake: Testing without warm-up
- [ ] Avoid mistake: Ignoring concurrency in assertions

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
- Always Use VoltTest for Relative Comparison, Not Absolute Measurement
- Run Minimum 100 Iterations Per Configuration
- Always Warm Up Before Collecting Metrics
- Test at Multiple Concurrency Levels
- Set Generous Thresholds for CI Assertions
- Use Before/After Comparison for Optimization Validation
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Integrate Volttest for Lightweight Load Testing


