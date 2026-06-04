# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Core Concepts & Fundamentals
**Knowledge Unit:** Test Suite Profiling
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always profile before optimizing the test suite
- [ ] Apply rule: Profile warm runs, not cold cache runs
- [ ] Apply rule: Track p95 test suite execution time over time
- [ ] Apply rule: Optimize the top 20% of slow tests (Pareto principle)
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Profile run on warm cache, not cold start
- [ ] Top 5 slowest tests identified and analyzed
- [ ] Slow tests correlated with database query counts
- [ ] Large test files split for better parallel distribution
- [ ] p95 suite time tracked and alerting on >20% weekly increase
- [ ] Avoid: Profiling a single run in isolation
- [ ] Avoid: Ignoring database test overhead
- [ ] Avoid: Optimizing before profiling

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **CI integration**: Parse JUnit XML output for automated slow test tracking. Most CI platforms have built-in test reporting that shows timing.
- **Threshold configuration**: Set `slowThreshold` in `phpunit.xml` to match team's acceptable test speed. Start at 500ms, adjust based on suite profile.
- **Slow test quarantine**: Isolate tests exceeding a time threshold to a separate CI job. Fast feedback from main suite; slow tests analyzed separately.
- **Trend monitoring**: Schedule a weekly CI run with `--profile --verbose`. Report changes to the team.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always profile before optimizing the test suite
- [ ] Follow rule: Profile warm runs, not cold cache runs
- [ ] Follow rule: Track p95 test suite execution time over time
- [ ] Follow rule: Optimize the top 20% of slow tests (Pareto principle)
- [ ] Follow rule: Correlate slow tests with database query counts
- [ ] Follow rule: Quarantine slow tests to a separate CI job
- [ ] - [ ] Profile run on warm cache, not cold start
- [ ] - [ ] Top 5 slowest tests identified and analyzed
- [ ] - [ ] Slow tests correlated with database query counts
- [ ] - [ ] Large test files split for better parallel distribution

# Performance Checklist
- **Profiling overhead**: `--profile` adds negligible overhead (~0.1%). Safe to run on every CI execution.
- **Output volume**: `--profile --verbose` produces significantly more output. Use JUnit XML for CI.
- **Memory impact**: Profiling stores per-test timing in memory until test suite completes. For 10,000+ test suites, memory peaks at ~5MB for timing data.
- **Parallel profiling**: `--profile` works with `--parallel`. Each worker reports its own slow tests. Parent process aggregates.

# Security Checklist
- **CI artifact storage**: JUnit XML files may contain test data that reveals application structure. Restrict access in CI configuration.
- **Performance data exposure**: Test timing data could reveal information about application performance characteristics. Treat as internal data.

# Reliability Checklist
- [ ] Ensure: Test suite profiling identifies slow tests, hot files, and performance bottlenec...
- [ ] Verify: Always profile before optimizing the test suite
- [ ] Verify: Profile warm runs, not cold cache runs
- [ ] Verify: Track p95 test suite execution time over time
- [ ] Verify: Optimize the top 20% of slow tests (Pareto principle)

# Testing Checklist
- [ ] Profile run on warm cache, not cold start
- [ ] Top 5 slowest tests identified and analyzed
- [ ] Slow tests correlated with database query counts
- [ ] Large test files split for better parallel distribution
- [ ] p95 suite time tracked and alerting on >20% weekly increase
- [ ] Slow test threshold configured in `phpunit.xml` (500ms default)
- [ ] Avoid: Profiling a single run in isolation
- [ ] Avoid: Ignoring database test overhead
- [ ] Avoid: Optimizing before profiling

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always profile before optimizing the test suite
- [ ] Apply: Profile warm runs, not cold cache runs
- [ ] Apply: Track p95 test suite execution time over time
- [ ] Apply: Optimize the top 20% of slow tests (Pareto principle)

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Profiling a single run in isolation
- [ ] Avoid mistake: Ignoring database test overhead
- [ ] Avoid mistake: Optimizing before profiling

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
- Always profile before optimizing the test suite
- Profile warm runs, not cold cache runs
- Track p95 test suite execution time over time
- Optimize the top 20% of slow tests (Pareto principle)
- Correlate slow tests with database query counts
- Quarantine slow tests to a separate CI job
- Configure `--profile` and JUnit output in CI pipeline
- Run profiling 3 times and use median values for optimization decisions
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Profile and Optimize Test Suite Performance


