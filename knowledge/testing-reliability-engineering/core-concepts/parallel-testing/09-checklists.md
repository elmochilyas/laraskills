# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Core Concepts & Fundamentals
**Knowledge Unit:** Parallel Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always use database isolation when running parallel tests
- [ ] Apply rule: Match worker count to available CPU cores minus one
- [ ] Apply rule: Profile with `--profile` to identify file size imbalances
- [ ] Apply rule: Run coverage in a separate sequential pass, not parallel
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Parallel execution works with `php artisan test --parallel`
- [ ] Each worker has isolated database (process-specific naming)
- [ ] Worker count matches CI runner CPUs minus 1
- [ ] No tests use `@depends` or global state that blocks parallelism
- [ ] Large test files are split for balanced distribution
- [ ] Avoid: Running parallel tests without database isolation
- [ ] Avoid: Assuming linear speedup
- [ ] Avoid: Oversubscribing CPU on shared runners

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Database isolation**: Use `ParallelTesting` facade for process-specific database names. `ParallelTesting::token()` returns the worker index.
- **Worker count configuration**: Set in `phpunit.xml` `<parameter name="processes" value="4"/>` or CLI `--processes=4`.
- **Token-based resource naming**: Use `ParallelTesting::token()` for unique database names, temp directories, ports, and email addresses.
- **File distribution strategy**: Paratest queue-based distribution is default. For suites with varying file sizes, use `--suffix` to group similar files.
- **Coverage collection**: Coverage in parallel mode uses temporary files per worker, merged after completion. Use pcov for stability (Xdebug is unstable in parallel).
- **Graceful degradation**: If a worker crashes, Paratest retries the file on another worker (configurable retry count).

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always use database isolation when running parallel tests
- [ ] Follow rule: Match worker count to available CPU cores minus one
- [ ] Follow rule: Profile with `--profile` to identify file size imbalances
- [ ] Follow rule: Run coverage in a separate sequential pass, not parallel
- [ ] Follow rule: Configure MySQL `max_connections` for parallel worker count
- [ ] Follow rule: Never use `@depends` annotations in test suites intended for parallel execution
- [ ] - [ ] Parallel execution works with `php artisan test --parallel`
- [ ] - [ ] Each worker has isolated database (process-specific naming)
- [ ] - [ ] Worker count matches CI runner CPUs minus 1
- [ ] - [ ] No tests use `@depends` or global state that blocks parallelism

# Performance Checklist
- [ ] No performance concerns identified

# Security Checklist
- [ ] No security concerns identified

# Reliability Checklist
- [ ] Ensure: Parallel test execution (via Paratest or Pest's `--parallel`) splits the test su...
- [ ] Verify: Always use database isolation when running parallel tests
- [ ] Verify: Match worker count to available CPU cores minus one
- [ ] Verify: Profile with `--profile` to identify file size imbalances
- [ ] Verify: Run coverage in a separate sequential pass, not parallel

# Testing Checklist
- [ ] Parallel execution works with `php artisan test --parallel`
- [ ] Each worker has isolated database (process-specific naming)
- [ ] Worker count matches CI runner CPUs minus 1
- [ ] No tests use `@depends` or global state that blocks parallelism
- [ ] Large test files are split for balanced distribution
- [ ] MySQL `max_connections` configured for worker count
- [ ] Avoid: Running parallel tests without database isolation
- [ ] Avoid: Assuming linear speedup
- [ ] Avoid: Oversubscribing CPU on shared runners

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always use database isolation when running parallel tests
- [ ] Apply: Match worker count to available CPU cores minus one
- [ ] Apply: Profile with `--profile` to identify file size imbalances
- [ ] Apply: Run coverage in a separate sequential pass, not parallel

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Running parallel tests without database isolation
- [ ] Avoid mistake: Assuming linear speedup
- [ ] Avoid mistake: Oversubscribing CPU on shared runners
- [ ] Avoid mistake: Database connection exhaustion

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
- Always use database isolation when running parallel tests
- Match worker count to available CPU cores minus one
- Profile with `--profile` to identify file size imbalances
- Run coverage in a separate sequential pass, not parallel
- Configure MySQL `max_connections` for parallel worker count
- Never use `@depends` annotations in test suites intended for parallel execution
- Use `ParallelTesting::token()` for unique resource naming
- Only use parallel execution for suites exceeding 500 tests
- Enable retry for transientworker failures in parallel mode
- Clean up parallel databases between CI runs
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Configure Parallel Test Execution


