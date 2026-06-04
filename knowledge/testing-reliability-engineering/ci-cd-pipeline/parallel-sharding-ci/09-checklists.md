# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** CI/CD Pipeline
**Knowledge Unit:** Parallel Test Sharding in CI
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Isolate Databases Per Shard
- [ ] Apply rule: Monitor the Slowest Shard â€” It Determines Wall Time
- [ ] Apply rule: Start with 4 Shards for Large Suites
- [ ] Apply rule: Merge Coverage in a Final Job â€” Never Enforce Per-Shard
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Test suite uses `--shard` flag for distribution
- [ ] Each shard has an isolated database (`DB_DATABASE` per shard)
- [ ] `fail-fast` is set to `false` for complete failure reporting
- [ ] Slowest shard is monitored and rebalanced as needed
- [ ] Coverage is merged from all shards for accurate reporting
- [ ] Avoid: Mistake
- [ ] Avoid: Too few shards for large test suites
- [ ] Avoid: Not isolating databases per shard

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Shard granularity**: Each shard should run 30-120 seconds of tests. Below 30s: overhead dominates. Above 120s: not enough parallelism.
- **Static vs dynamic**: Static for most projects (simpler). Dynamic for large suites (1000+ tests) where imbalance wastes significant time.
- **Two-level parallelism**: Combine sharding (CI job level) with `--parallel` (process level within each job) for maximum resource utilization.
- **Coverage merging**: Use Pest's built-in coverage merging or PHPUnit's `--coverage-merge`. Upload partial coverage PHP files as artifacts between jobs.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Isolate Databases Per Shard
- [ ] Follow rule: Monitor the Slowest Shard â€” It Determines Wall Time
- [ ] Follow rule: Start with 4 Shards for Large Suites
- [ ] Follow rule: Merge Coverage in a Final Job â€” Never Enforce Per-Shard
- [ ] Follow rule: Set `fail-fast: false` for Complete Failure Reporting
- [ ] Follow rule: Split Large Test Files for Better Distribution
- [ ] - [ ] Test suite uses `--shard` flag for distribution
- [ ] - [ ] Each shard has an isolated database (`DB_DATABASE` per shard)
- [ ] - [ ] `fail-fast` is set to `false` for complete failure reporting
- [ ] - [ ] Slowest shard is monitored and rebalanced as needed

# Performance Checklist
- Sharding overhead: ~5-10 seconds per shard (test framework initialization, database setup).
- Ideal shard size: 30-120 seconds of test time per shard.
- Composer/framework booting per shard: Each shard boots Laravel independently. Config/route caching reduces boot time.
- Database migration per shard: Each shard runs migrations in parallel. With 4 shards x 15s migrations = 15s wall time vs 60s sequential.
- Coverage merging: 10-30s for a complete coverage merge.

# Security Checklist
- Coverage data may reveal code structure. Set appropriate access controls on CI artifacts.
- Database credentials per shard must be managed securely. Use environment variables from CI secrets, not hardcoded values.
- Artifact retention policies should apply to coverage files as they contain partial source listings.

# Reliability Checklist
- [ ] Ensure: Parallel test sharding splits the test suite across multiple CI jobs, each runni...
- [ ] Verify: Isolate Databases Per Shard
- [ ] Verify: Monitor the Slowest Shard â€” It Determines Wall Time
- [ ] Verify: Start with 4 Shards for Large Suites
- [ ] Verify: Merge Coverage in a Final Job â€” Never Enforce Per-Shard

# Testing Checklist
- [ ] Test suite uses `--shard` flag for distribution
- [ ] Each shard has an isolated database (`DB_DATABASE` per shard)
- [ ] `fail-fast` is set to `false` for complete failure reporting
- [ ] Slowest shard is monitored and rebalanced as needed
- [ ] Coverage is merged from all shards for accurate reporting
- [ ] Coverage minimum enforcement uses merged coverage, not per-shard
- [ ] Avoid: Mistake
- [ ] Avoid: Too few shards for large test suites
- [ ] Avoid: Not isolating databases per shard

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Isolate Databases Per Shard
- [ ] Apply: Monitor the Slowest Shard â€” It Determines Wall Time
- [ ] Apply: Start with 4 Shards for Large Suites
- [ ] Apply: Merge Coverage in a Final Job â€” Never Enforce Per-Shard

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Too few shards for large test suites
- [ ] Avoid mistake: Not isolating databases per shard
- [ ] Avoid mistake: Merging coverage without parallel-safe tooling
- [ ] Avoid mistake: Static sharding for highly imbalanced test files

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
- Isolate Databases Per Shard
- Monitor the Slowest Shard â€” It Determines Wall Time
- Start with 4 Shards for Large Suites
- Merge Coverage in a Final Job â€” Never Enforce Per-Shard
- Set `fail-fast: false` for Complete Failure Reporting
- Split Large Test Files for Better Distribution
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Shard Tests for Parallel CI Execution


