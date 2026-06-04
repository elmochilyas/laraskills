# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Performance & Load Testing
**Knowledge Unit:** LoadForge Cloud Load Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Never Load Test Production Without Warning
- [ ] Apply rule: Test from Multiple Geographic Regions
- [ ] Apply rule: Include Write Operations in the Test Mix
- [ ] Apply rule: Run Tests for Minimum 10-15 Minutes
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Test plan covers critical user flows (login, search, checkout)
- [ ] Load profile matches expected traffic patterns (not just flat load)
- [ ] Geographic regions represent user distribution
- [ ] Response assertions validate correctness, not just HTTP status
- [ ] Baseline metrics are established
- [ ] Avoid: Mistake
- [ ] Avoid: Testing production without warning
- [ ] Avoid: Single-region testing for global apps

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **LoadForge vs JMeter**: LoadForge for teams without infrastructure. Self-managed JMeter for compliance or custom protocol needs.
- **LoadForge vs VoltTest**: LoadForge for external HTTP testing from global regions. VoltTest for PHP-native internal testing. Use both.
- **Locust scripts**: Version control alongside application. Treat as production code.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Never Load Test Production Without Warning
- [ ] Follow rule: Test from Multiple Geographic Regions
- [ ] Follow rule: Include Write Operations in the Test Mix
- [ ] Follow rule: Run Tests for Minimum 10-15 Minutes
- [ ] Follow rule: Use Gradual Ramp-Up, Not Instant Full Load
- [ ] Follow rule: Version-Control Locust Scripts Alongside Application Code
- [ ] - [ ] Test plan covers critical user flows (login, search, checkout)
- [ ] - [ ] Load profile matches expected traffic patterns (not just flat load)
- [ ] - [ ] Geographic regions represent user distribution
- [ ] - [ ] Response assertions validate correctness, not just HTTP status

# Performance Checklist
- Agent capacity: 1000-5000 virtual users per agent depending on test complexity.
- Latency overhead: Includes agent-to-server network latency. Subtract geographic latency for server-only performance.
- Test duration: Minimum 2 minutes (warm-up + measurement). Recommended 10-15 minutes.
- Ramp-up period: 30-60 seconds minimum. Prevents cold-start skew.

# Security Checklist
- Never load test production without explicit warning and coordination.
- Use test database for write operations. LoadForge traffic creates real data.
- Rate limiting may throttle LoadForge traffic. Whitelist LoadForge IPs or increase limits.
- Ensure Locust scripts don't contain real credentials or API keys.

# Reliability Checklist
- [ ] Ensure: LoadForge is a cloud-based load testing platform that generates HTTP traffic aga...
- [ ] Verify: Never Load Test Production Without Warning
- [ ] Verify: Test from Multiple Geographic Regions
- [ ] Verify: Include Write Operations in the Test Mix
- [ ] Verify: Run Tests for Minimum 10-15 Minutes

# Testing Checklist
- [ ] Test plan covers critical user flows (login, search, checkout)
- [ ] Load profile matches expected traffic patterns (not just flat load)
- [ ] Geographic regions represent user distribution
- [ ] Response assertions validate correctness, not just HTTP status
- [ ] Baseline metrics are established
- [ ] CI integration is configured for regression detection
- [ ] Avoid: Mistake
- [ ] Avoid: Testing production without warning
- [ ] Avoid: Single-region testing for global apps

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Never Load Test Production Without Warning
- [ ] Apply: Test from Multiple Geographic Regions
- [ ] Apply: Include Write Operations in the Test Mix
- [ ] Apply: Run Tests for Minimum 10-15 Minutes

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Testing production without warning
- [ ] Avoid mistake: Single-region testing for global apps
- [ ] Avoid mistake: Testing only GET requests
- [ ] Avoid mistake: Short test duration

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
- Never Load Test Production Without Warning
- Test from Multiple Geographic Regions
- Include Write Operations in the Test Mix
- Run Tests for Minimum 10-15 Minutes
- Use Gradual Ramp-Up, Not Instant Full Load
- Version-Control Locust Scripts Alongside Application Code
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Run Cloud-Based Load Tests with LoadForge


