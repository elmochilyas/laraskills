# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Resilience & Chaos Engineering
**Knowledge Unit:** Circuit Breaker Patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always Provide a Fallback When Circuit Is Open
- [ ] Apply rule: Use Separate Circuit Breaker Instances Per Dependency
- [ ] Apply rule: Count Only Server Errors as Failures
- [ ] Apply rule: Use Redis for Circuit State Storage in Distributed Applications
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Circuit breaker states (Closed, Open, Half-Open) are correctly implemented
- [ ] Failure threshold is configured based on service reliability requirements
- [ ] Recovery timeout is configured (not too short, not too long)
- [ ] Fallback behavior is implemented for open circuit state
- [ ] Circuit breaker state is persisted across requests (cache or database)
- [ ] Avoid: No fallback when circuit is open
- [ ] Avoid: Too-sensitive failure detection
- [ ] Avoid: Global circuit breaker instead of per-dependency

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Fallback granularity**: Per-operation fallback (specific cached data for specific endpoint) vs generic (return error message). Prefer per-operation fallbacks.
- **Failure threshold tuning**: Start with 3-5 consecutive failures. Lower for critical dependencies (2 failures), higher for tolerant ones (10 failures).
- **Reset timeout configuration**: 30 seconds for most services. Longer for services with slow recovery (60-120 seconds).
- **Storage selection**: Redis for high-throughput distributed apps. Database for simple single-server apps.
- **Graceful degradation**: When circuit is open, return degraded response with informative messaging rather than crashing.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always Provide a Fallback When Circuit Is Open
- [ ] Follow rule: Use Separate Circuit Breaker Instances Per Dependency
- [ ] Follow rule: Count Only Server Errors as Failures
- [ ] Follow rule: Use Redis for Circuit State Storage in Distributed Applications
- [ ] Follow rule: Reset Circuit State During Deployments
- [ ] Follow rule: Expose Circuit States in Health Endpoints
- [ ] - [ ] Circuit breaker states (Closed, Open, Half-Open) are correctly implemented
- [ ] - [ ] Failure threshold is configured based on service reliability requirements
- [ ] - [ ] Recovery timeout is configured (not too short, not too long)
- [ ] - [ ] Fallback behavior is implemented for open circuit state

# Performance Checklist
- **Circuit check overhead**: <1ms (Redis read) to 5ms (database read). Negligible compared to operation cost.
- **State update on success/failure**: 1-5ms per operation. Acceptable for most use cases.
- **Circuit open saves significant time**: Immediate failure vs waiting for timeout (5-30 seconds).
- **State storage sizing**: Minimal. Circuit state is a few bytes per dependency.
- **Concurrent state updates**: Redis handles atomically. Database may require pessimistic locking for high-concurrency scenarios.

# Security Checklist
- **State storage security**: Circuit breaker state in Redis/database may contain information about dependency health. Restrict access.
- **Fallback data exposure**: Cached fallback data may be stale. Ensure stale data doesn't violate security or compliance requirements.
- **Circuit state manipulation**: Ensure circuit state cannot be manipulated by user input. State updates should only occur through the circuit breaker logic.

# Reliability Checklist
- [ ] Ensure: Circuit breaker patterns protect Laravel applications from cascading failures wh...
- [ ] Verify: Always Provide a Fallback When Circuit Is Open
- [ ] Verify: Use Separate Circuit Breaker Instances Per Dependency
- [ ] Verify: Count Only Server Errors as Failures
- [ ] Verify: Use Redis for Circuit State Storage in Distributed Applications

# Testing Checklist
- [ ] Circuit breaker states (Closed, Open, Half-Open) are correctly implemented
- [ ] Failure threshold is configured based on service reliability requirements
- [ ] Recovery timeout is configured (not too short, not too long)
- [ ] Fallback behavior is implemented for open circuit state
- [ ] Circuit breaker state is persisted across requests (cache or database)
- [ ] Logging is added for circuit state transitions
- [ ] Avoid: No fallback when circuit is open
- [ ] Avoid: Too-sensitive failure detection
- [ ] Avoid: Global circuit breaker instead of per-dependency

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always Provide a Fallback When Circuit Is Open
- [ ] Apply: Use Separate Circuit Breaker Instances Per Dependency
- [ ] Apply: Count Only Server Errors as Failures
- [ ] Apply: Use Redis for Circuit State Storage in Distributed Applications

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: No fallback when circuit is open
- [ ] Avoid mistake: Too-sensitive failure detection
- [ ] Avoid mistake: Global circuit breaker instead of per-dependency
- [ ] Avoid mistake: Not testing circuit breaker behavior

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
- Always Provide a Fallback When Circuit Is Open
- Use Separate Circuit Breaker Instances Per Dependency
- Count Only Server Errors as Failures
- Use Redis for Circuit State Storage in Distributed Applications
- Reset Circuit State During Deployments
- Expose Circuit States in Health Endpoints
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Implement Circuit Breaker Patterns in Laravel


