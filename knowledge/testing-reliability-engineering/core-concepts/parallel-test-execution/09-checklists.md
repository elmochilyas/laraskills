# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Core Concepts & Fundamentals
**Knowledge Unit:** Parallel Test Execution
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always verify database isolation before enabling parallel execution
- [ ] Apply rule: Never assume linear speedup from adding workers
- [ ] Apply rule: Use pcov for parallel coverage collection, not Xdebug
- [ ] Apply rule: Set `maxBatchSize` to prevent worker starvation
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] All workers complete within similar timeframes (no stragglers)
- [ ] No worker starves (sits idle while others run)
- [ ] Retry recovers from transient worker failures
- [ ] Timeout prevents hung workers from blocking suite completion
- [ ] Worker count validated by benchmarking different values
- [ ] Avoid: Running parallel tests without database isolation
- [ ] Avoid: Assuming linear speedup
- [ ] Avoid: Oversubscribing CPU on shared runners

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Database isolation**: Use `ParallelTesting` facade for process-specific database names. `ParallelTesting::token()` returns the worker index.
- **Worker count configuration**: Set in `phpunit.xml` `<parameter name="processes" value="4"/>` or CLI `--processes=4`.
- **Token-based resource naming**: Use `ParallelTesting::token()` for unique database names, temp directories, ports, and email addresses.
- **File distribution strategy**: Paratest queue-based distribution is default. For varying file sizes, use `--suffix` to group similar files.
- **Coverage collection**: Coverage in parallel mode uses temporary files per worker, merged after completion. Use pcov for stability.
- **Graceful degradation**: If a worker crashes, Paratest retries the file on another worker (configurable retry count).

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always verify database isolation before enabling parallel execution
- [ ] Follow rule: Never assume linear speedup from adding workers
- [ ] Follow rule: Use pcov for parallel coverage collection, not Xdebug
- [ ] Follow rule: Set `maxBatchSize` to prevent worker starvation
- [ ] Follow rule: Configure `slowThreshold` to flag unexpectedly slow tests
- [ ] Follow rule: Isolate tests that use global state or singletons
- [ ] - [ ] All workers complete within similar timeframes (no stragglers)
- [ ] - [ ] No worker starves (sits idle while others run)
- [ ] - [ ] Retry recovers from transient worker failures
- [ ] - [ ] Timeout prevents hung workers from blocking suite completion

# Performance Checklist
- **Optimal worker count**: Linear improvement until CPU-bound. IO-bound tests benefit from more workers.
- **Memory per worker**: ~30-50MB RSS each. 8 workers = ~240-400MB RAM. Ensure CI runner has sufficient memory.
- **Database connections**: Each worker needs 1+ connections. MySQL default (151) supports ~140 workers.
- **File size imbalance**: A single slow file limits total wall time. Break large test files into smaller ones.
- **Cold cache**: CI cold starts increase per-worker time by 20-40% (no OpCache, no view cache).

# Security Checklist
- **Database isolation**: Worker-specific databases prevent cross-test data leaks. Ensure databases are dropped after test suite completion.
- **Port allocation**: Tests binding to ports (Dusk, HTTP servers) must use `ParallelTesting::token()` for port offset. Prevent port collisions.
- **Temporary files**: Workers writing to temp directories must use process-specific paths to prevent file collisions.
- **Token exposure**: `ParallelTesting::token()` is accessible in test code. Don't use it for security-sensitive operations.

# Reliability Checklist
- [ ] Ensure: Parallel test execution (via Paratest or Pest's `--parallel`) splits the test su...
- [ ] Verify: Always verify database isolation before enabling parallel execution
- [ ] Verify: Never assume linear speedup from adding workers
- [ ] Verify: Use pcov for parallel coverage collection, not Xdebug
- [ ] Verify: Set `maxBatchSize` to prevent worker starvation

# Testing Checklist
- [ ] All workers complete within similar timeframes (no stragglers)
- [ ] No worker starves (sits idle while others run)
- [ ] Retry recovers from transient worker failures
- [ ] Timeout prevents hung workers from blocking suite completion
- [ ] Worker count validated by benchmarking different values
- [ ] MySQL connection pool not exhausted
- [ ] Avoid: Running parallel tests without database isolation
- [ ] Avoid: Assuming linear speedup
- [ ] Avoid: Oversubscribing CPU on shared runners

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always verify database isolation before enabling parallel execution
- [ ] Apply: Never assume linear speedup from adding workers
- [ ] Apply: Use pcov for parallel coverage collection, not Xdebug
- [ ] Apply: Set `maxBatchSize` to prevent worker starvation

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
- Always verify database isolation before enabling parallel execution
- Never assume linear speedup from adding workers
- Use pcov for parallel coverage collection, not Xdebug
- Set `maxBatchSize` to prevent worker starvation
- Configure `slowThreshold` to flag unexpectedly slow tests
- Isolate tests that use global state or singletons
- Run parallel suites with process-level timeout protection
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Optimize Parallel Test Distribution and Worker Resources


