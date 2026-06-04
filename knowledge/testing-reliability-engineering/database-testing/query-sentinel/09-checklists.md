# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Database Testing
**Knowledge Unit:** Query Sentinel
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Start with N+1 detection only, add other detection types after establishing a baseline
- [ ] Apply rule: Use warning mode in development, exception mode in CI
- [ ] Apply rule: Maintain and review the exclusion list quarterly
- [ ] Apply rule: Combine Sentinel with `expectsDatabaseQueryCount()` for comprehensive coverage
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Query Sentinel installed and configured
- [ ] N+1 detection enabled in CI
- [ ] Exclusion list covers internal Laravel queries
- [ ] Sentinel in warning mode in development, exception mode in CI
- [ ] Sentinel disabled in production
- [ ] Avoid: Mistake
- [ ] Avoid: Enabling all detection types without tuning
- [ ] Avoid: Using Sentinel without exclusion list

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Query Sentinel vs `expectsDatabaseQueryCount()`**: Use both for comprehensive coverage. Sentinel for pattern detection, query count assertions for budget enforcement.
- **Warning vs exception mode**: Warning mode logs and continues. Exception mode fails tests immediately. Use warning for development, exception for CI.
- **Exclusion list maintenance**: Too many exclusions reduce effectiveness. Review quarterly. Keep narrow and specific.
- **Database explain plan support**: EXPLAIN requires additional permissions. Configure in CI database user setup only.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Start with N+1 detection only, add other detection types after establishing a baseline
- [ ] Follow rule: Use warning mode in development, exception mode in CI
- [ ] Follow rule: Maintain and review the exclusion list quarterly
- [ ] Follow rule: Combine Sentinel with `expectsDatabaseQueryCount()` for comprehensive coverage
- [ ] Follow rule: Disable Query Sentinel in production
- [ ] - [ ] Query Sentinel installed and configured
- [ ] - [ ] N+1 detection enabled in CI
- [ ] - [ ] Exclusion list covers internal Laravel queries
- [ ] - [ ] Sentinel in warning mode in development, exception mode in CI

# Performance Checklist
- Query interception overhead: <0.1ms per query (event dispatch).
- Stack trace capture: 1-5ms per flagged query. Enable only in CI.
- EXPLAIN query execution: Adds 1-10ms per SELECT query. Use only in dedicated performance test suite.
- Memory for query log: Grows linearly with query count and stack trace depth.
- Disable in production: Sentinel is designed for development and testing only.

# Security Checklist
- Query Sentinel captures query SQL and bindings. These may contain sensitive data if tests use production-like data.
- Stack traces can reveal application structure. Restrict access to CI artifacts containing Sentinel output.
- EXPLAIN queries require database read access. Ensure CI database user has minimum necessary permissions.

# Reliability Checklist
- [ ] Ensure: Laravel Query Sentinel is a community package that provides real-time monitoring...
- [ ] Verify: Start with N+1 detection only, add other detection types after establishing a baseline
- [ ] Verify: Use warning mode in development, exception mode in CI
- [ ] Verify: Maintain and review the exclusion list quarterly
- [ ] Verify: Combine Sentinel with `expectsDatabaseQueryCount()` for comprehensive coverage

# Testing Checklist
- [ ] Query Sentinel installed and configured
- [ ] N+1 detection enabled in CI
- [ ] Exclusion list covers internal Laravel queries
- [ ] Sentinel in warning mode in development, exception mode in CI
- [ ] Sentinel disabled in production
- [ ] Exclusions reviewed quarterly
- [ ] Avoid: Mistake
- [ ] Avoid: Enabling all detection types without tuning
- [ ] Avoid: Using Sentinel without exclusion list

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Start with N+1 detection only, add other detection types after establishing a baseline
- [ ] Apply: Use warning mode in development, exception mode in CI
- [ ] Apply: Maintain and review the exclusion list quarterly
- [ ] Apply: Combine Sentinel with `expectsDatabaseQueryCount()` for comprehensive coverage

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Enabling all detection types without tuning
- [ ] Avoid mistake: Using Sentinel without exclusion list
- [ ] Avoid mistake: Adding too many exclusions
- [ ] Avoid mistake: Not using Sentinel in CI

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
- Start with N+1 detection only, add other detection types after establishing a baseline
- Use warning mode in development, exception mode in CI
- Maintain and review the exclusion list quarterly
- Combine Sentinel with `expectsDatabaseQueryCount()` for comprehensive coverage
- Disable Query Sentinel in production
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Configure Query Sentinel for Automated Query Pattern Detection


