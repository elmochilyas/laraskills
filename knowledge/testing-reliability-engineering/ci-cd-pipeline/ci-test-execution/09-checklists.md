# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** CI/CD Pipeline
**Knowledge Unit:** ** CI Test Execution
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always Profile Before Optimizing Tests
- [ ] Apply rule: Profile Warm Runs for Optimization Targets
- [ ] Apply rule: Use JUnit XML for CI Trend Tracking
- [ ] Apply rule: Implement Slow Test Quarantine
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Test environment variables are configured (DB, cache, session, mail)
- [ ] Database is set up with migrations before tests
- [ ] Tests run in order: unit â†’ feature â†’ architecture â†’ browser
- [ ] Code quality tools run alongside tests
- [ ] Test results are reported as PR status checks
- [ ] Avoid: Profiling a single run in isolation
- [ ] Avoid: Ignoring database test overhead
- [ ] Avoid: Optimizing before profiling

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **CI pipeline stages**: Lint (Pint, 1-2 min) â†’ Static analysis (PHPStan, 2-5 min) â†’ Tests (parallel, variable) â†’ Coverage (1-2 min) â†’ Deploy.
- **Matrix strategy**: PHP versions (8.3, 8.4) Ã— Database engines (SQLite, MySQL, PostgreSQL). Use `include` for additional variants.
- **Parallel sharding**: Distribute test files across CI matrix cells. Each cell runs a subset of tests in parallel.
- **Path-based triggering**: Use `paths:` filters in CI triggers to run only relevant test suites for changed code.
- **Artifact caching**: Cache vendor, node_modules, and build output. Use cache keys based on lock file hashes.
- **Quality gates**: Enforce minimum coverage (`--min=80`), PHPStan level (max), and Pint compliance.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always Profile Before Optimizing Tests
- [ ] Follow rule: Profile Warm Runs for Optimization Targets
- [ ] Follow rule: Use JUnit XML for CI Trend Tracking
- [ ] Follow rule: Implement Slow Test Quarantine
- [ ] Follow rule: Combine `--profile` with `--parallel` for Distribution Insights
- [ ] Follow rule: Set a Test Suite Time Budget
- [ ] - [ ] Test environment variables are configured (DB, cache, session, mail)
- [ ] - [ ] Database is set up with migrations before tests
- [ ] - [ ] Tests run in order: unit â†’ feature â†’ architecture â†’ browser
- [ ] - [ ] Code quality tools run alongside tests

# Performance Checklist
- [ ] No performance concerns identified

# Security Checklist
- [ ] No security concerns identified

# Reliability Checklist
- [ ] Ensure: Test suite profiling identifies slow tests, hot files, and performance bottlenec...
- [ ] Verify: Always Profile Before Optimizing Tests
- [ ] Verify: Profile Warm Runs for Optimization Targets
- [ ] Verify: Use JUnit XML for CI Trend Tracking
- [ ] Verify: Implement Slow Test Quarantine

# Testing Checklist
- [ ] Test environment variables are configured (DB, cache, session, mail)
- [ ] Database is set up with migrations before tests
- [ ] Tests run in order: unit â†’ feature â†’ architecture â†’ browser
- [ ] Code quality tools run alongside tests
- [ ] Test results are reported as PR status checks
- [ ] CI caches framework optimization files between runs
- [ ] Avoid: Profiling a single run in isolation
- [ ] Avoid: Ignoring database test overhead
- [ ] Avoid: Optimizing before profiling

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always Profile Before Optimizing Tests
- [ ] Apply: Profile Warm Runs for Optimization Targets
- [ ] Apply: Use JUnit XML for CI Trend Tracking
- [ ] Apply: Implement Slow Test Quarantine

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Profiling a single run in isolation
- [ ] Avoid mistake: Ignoring database test overhead
- [ ] Avoid mistake: Optimizing before profiling
- [ ] Avoid mistake: No CI test time budgeting

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
- Always Profile Before Optimizing Tests
- Profile Warm Runs for Optimization Targets
- Use JUnit XML for CI Trend Tracking
- Implement Slow Test Quarantine
- Combine `--profile` with `--parallel` for Distribution Insights
- Set a Test Suite Time Budget
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Execute Tests in CI Pipelines


