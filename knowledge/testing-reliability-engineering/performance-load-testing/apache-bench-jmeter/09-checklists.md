# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Performance & Load Testing
**Knowledge Unit:** Apache Bench and JMeter
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always Load Test on Staging, Never Local Machine
- [ ] Apply rule: Always Warm Up the Application Before Collecting Metrics
- [ ] Apply rule: Test Multiple Endpoint Types â€” Not Just the Happy Path
- [ ] Apply rule: Use Keep-Alive (`-k`) for Realistic Benchmarks
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Application cache is warmed before benchmarking
- [ ] Benchmark runs with production-like concurrency (not 1 user)
- [ ] Results include p50, p95, p99 latency
- [ ] Error rate is recorded (should be 0% for valid tests)
- [ ] Warm-up requests precede the actual measurement run
- [ ] Avoid: Mistake
- [ ] Avoid: Load testing on local machine
- [ ] Avoid: Testing only the happy path

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **`ab` vs JMeter**: `ab` for quick benchmarks and CI regression gates. JMeter for comprehensive load testing with complex scenarios.
- **External vs internal testing**: `ab`/JMeter test through HTTP (external). More realistic for pre-release validation than PHP-native tools.
- **Local vs staging**: Load test on staging with production-equivalent hardware. Local benchmarks are not meaningful.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always Load Test on Staging, Never Local Machine
- [ ] Follow rule: Always Warm Up the Application Before Collecting Metrics
- [ ] Follow rule: Test Multiple Endpoint Types â€” Not Just the Happy Path
- [ ] Follow rule: Use Keep-Alive (`-k`) for Realistic Benchmarks
- [ ] Follow rule: Run JMeter in Non-GUI Mode for Actual Tests
- [ ] Follow rule: Monitor P99 Latency, Not Just Average Response Time
- [ ] - [ ] Application cache is warmed before benchmarking
- [ ] - [ ] Benchmark runs with production-like concurrency (not 1 user)
- [ ] - [ ] Results include p50, p95, p99 latency
- [ ] - [ ] Error rate is recorded (should be 0% for valid tests)

# Performance Checklist
- `ab` single machine: up to 5000-10000 RPS for simple endpoints.
- JMeter single machine: up to 2000-5000 RPS (Java overhead).
- PHP-FPM bottleneck: Laravel typically 50-200 RPS per worker. `pm.max_children` is critical.
- Database connections: MySQL default 151 connections. May bottleneck under high concurrency.

# Security Checklist
- Never load test production without warning. Could exhaust resources and affect real users.
- Disable rate limiting for test endpoints or whitelist load generator IPs.
- Monitor for self-DDOS â€” verify target is test/staging, not production.

# Reliability Checklist
- [ ] Ensure: Apache Bench (`ab`) and Apache JMeter are external load testing tools used to be...
- [ ] Verify: Always Load Test on Staging, Never Local Machine
- [ ] Verify: Always Warm Up the Application Before Collecting Metrics
- [ ] Verify: Test Multiple Endpoint Types â€” Not Just the Happy Path
- [ ] Verify: Use Keep-Alive (`-k`) for Realistic Benchmarks

# Testing Checklist
- [ ] Application cache is warmed before benchmarking
- [ ] Benchmark runs with production-like concurrency (not 1 user)
- [ ] Results include p50, p95, p99 latency
- [ ] Error rate is recorded (should be 0% for valid tests)
- [ ] Warm-up requests precede the actual measurement run
- [ ] Tests are repeated 3x and results averaged
- [ ] Avoid: Mistake
- [ ] Avoid: Load testing on local machine
- [ ] Avoid: Testing only the happy path

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always Load Test on Staging, Never Local Machine
- [ ] Apply: Always Warm Up the Application Before Collecting Metrics
- [ ] Apply: Test Multiple Endpoint Types â€” Not Just the Happy Path
- [ ] Apply: Use Keep-Alive (`-k`) for Realistic Benchmarks

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Load testing on local machine
- [ ] Avoid mistake: Testing only the happy path
- [ ] Avoid mistake: Not warming the application first
- [ ] Avoid mistake: Ignoring JMeter non-GUI mode

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
- Always Load Test on Staging, Never Local Machine
- Always Warm Up the Application Before Collecting Metrics
- Test Multiple Endpoint Types â€” Not Just the Happy Path
- Use Keep-Alive (`-k`) for Realistic Benchmarks
- Run JMeter in Non-GUI Mode for Actual Tests
- Monitor P99 Latency, Not Just Average Response Time
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Run Performance Benchmarks with Apache Bench and JMeter


