# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Resilience & Chaos Engineering
**Knowledge Unit:** Fault Injection Testing with Laravel Resilience
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Write Fallback Code Before Resilience Tests
- [ ] Apply rule: Inject One Fault Per Test
- [ ] Apply rule: Always Assert Fallback Behavior After Fault Injection
- [ ] Apply rule: Clear Faults Between Tests
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Each external service dependency has fault injection tests
- [ ] HTTP client faults test: timeout, 500, 429, connection refused
- [ ] Database faults test: connection failure, query timeout
- [ ] Cache faults test: store failure, retrieve failure
- [ ] Queue faults test: job failure, max attempts exceeded
- [ ] Avoid: Treating Resilience like a mocking library
- [ ] Avoid: No fallback code before resilience tests
- [ ] Avoid: Injecting faults without assertions

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Container binding convention**: Bind services to interfaces via `$this->app->bind(Contract::class, Implementation::class)`. Resilience decorates at the binding level.
- **Fallback marker pattern**: Fallback code should set a flag (`$this->fallbackUsed = true`) that resilience assertions check.
- **Fault scope per test**: Use `Resilience::fake()` or `$this->injectFault()` to scope faults to individual tests.
- **Service interface design**: Design service interfaces with resilience in mind. Each method should have a documented failure mode.
- **Testing service provider**: Optionally create `TestingServiceProvider` that binds null implementations for non-critical services.
- **Discovery frequency**: Run discovery when container bindings change. Schedule quarterly for stable codebases.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Write Fallback Code Before Resilience Tests
- [ ] Follow rule: Inject One Fault Per Test
- [ ] Follow rule: Always Assert Fallback Behavior After Fault Injection
- [ ] Follow rule: Clear Faults Between Tests
- [ ] Follow rule: Run Resilience Tests in a Separate CI Stage
- [ ] Follow rule: Use Short Timeout Values in Test Faults
- [ ] - [ ] Each external service dependency has fault injection tests
- [ ] - [ ] HTTP client faults test: timeout, 500, 429, connection refused
- [ ] - [ ] Database faults test: connection failure, query timeout
- [ ] - [ ] Cache faults test: store failure, retrieve failure

# Performance Checklist
- [ ] No performance concerns identified

# Security Checklist
- [ ] No security concerns identified

# Reliability Checklist
- [ ] Ensure: Laravel Resilience is a fault injection package (v0.7.0) that enables determinis...
- [ ] Verify: Write Fallback Code Before Resilience Tests
- [ ] Verify: Inject One Fault Per Test
- [ ] Verify: Always Assert Fallback Behavior After Fault Injection
- [ ] Verify: Clear Faults Between Tests

# Testing Checklist
- [ ] Each external service dependency has fault injection tests
- [ ] HTTP client faults test: timeout, 500, 429, connection refused
- [ ] Database faults test: connection failure, query timeout
- [ ] Cache faults test: store failure, retrieve failure
- [ ] Queue faults test: job failure, max attempts exceeded
- [ ] Resilience patterns (retries, fallbacks, circuit breakers) are verified
- [ ] Avoid: Treating Resilience like a mocking library
- [ ] Avoid: No fallback code before resilience tests
- [ ] Avoid: Injecting faults without assertions

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Write Fallback Code Before Resilience Tests
- [ ] Apply: Inject One Fault Per Test
- [ ] Apply: Always Assert Fallback Behavior After Fault Injection
- [ ] Apply: Clear Faults Between Tests

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Treating Resilience like a mocking library
- [ ] Avoid mistake: No fallback code before resilience tests
- [ ] Avoid mistake: Injecting faults without assertions
- [ ] Avoid mistake: Running resilience tests in the main CI job

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
- Write Fallback Code Before Resilience Tests
- Inject One Fault Per Test
- Always Assert Fallback Behavior After Fault Injection
- Clear Faults Between Tests
- Run Resilience Tests in a Separate CI Stage
- Use Short Timeout Values in Test Faults
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Inject Faults in Laravel Tests


