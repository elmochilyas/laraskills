# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | CI/CD Pipeline Integration |
| Knowledge Unit | Parallel Test Sharding in CI |
| Difficulty | Advanced |
| Maturity | Mature |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | GitHub Actions CI/CD fundamentals, Parallel test execution (Paratest), PHPUnit configuration |
| Related KUs | Matrix testing (PHP x DB), Coverage reporting, CI pipeline optimization |
| Source | domain-analysis.md K041 |

# Overview

Parallel test sharding splits the test suite across multiple CI jobs, each running a subset of tests simultaneously, to reduce total wall-clock time. Pest and PHPUnit support sharding natively via `--shard` flag. The standard approach uses GitHub Actions matrix strategy to define shard jobs, with static or dynamic splitting of test files. Sharding reduces a 30-minute test suite to 5-10 minutes depending on shard count and parallelism efficiency. The key challenges are balanced test distribution, coverage merging, and database isolation across shards.

# Core Concepts

- **Shard**: A subset of the total test suite. Each shard runs independently in its own CI job.
- **`--shard=n/m`**: Pest/PHPUnit flag. `n` is the shard number (1-indexed), `m` is total shards.
- **Static sharding**: Tests split by file name using hash or alphabetical distribution. Pest's built-in `--shard` uses this.
- **Dynamic sharding**: Tests split based on historical execution time for balanced distribution.
- **Coverage merging**: Each shard computes partial coverage; merged for a complete report.
- **Two-level parallelism**: Across shards (CI jobs) and within shards (process-level via Paratest).

# When To Use

- When test suite exceeds 10 minutes wall-clock time in CI
- For Laravel projects with 500+ tests
- When CI runner minutes are available for parallel execution
- When coverage reporting must be complete across all tests

# When NOT To Use

- For small test suites (<5 minutes total) — sharding overhead may outweigh benefits
- When tests have sequential dependencies that cross shard boundaries
- Without database isolation strategy (shared databases across shards cause random failures)
- When CI parallelism is limited (e.g., constrained self-hosted runners)

# Best Practices (WHY)

- **Isolate databases per shard**: Each shard needs its own database (`DB_DATABASE=testing_shard_${{ matrix.shard }}`). Shared databases cause parallel test collisions and random failures.
- **Monitor the slowest shard**: The slowest shard determines total wall time. If one shard is significantly slower, rebalance by splitting large test files or adding more shards.
- **Start with 4 shards for large suites**: Monitor wall time and adjust. 8 shards for suites >30 minutes. Beyond 8 shards, overhead (framework boot, database setup) reduces marginal benefit.
- **Merge coverage in a final job**: Partial coverage from individual shards is meaningless. Implement a merge job that collects and combines coverage data for accurate `--min` enforcement.
- **Use fail-fast: false**: If one shard fails, let others continue. This gives complete failure information rather than a partial picture.

# Architecture Guidelines

- **Shard granularity**: Each shard should run 30-120 seconds of tests. Below 30s: overhead dominates. Above 120s: not enough parallelism.
- **Static vs dynamic**: Static for most projects (simpler). Dynamic for large suites (1000+ tests) where imbalance wastes significant time.
- **Two-level parallelism**: Combine sharding (CI job level) with `--parallel` (process level within each job) for maximum resource utilization.
- **Coverage merging**: Use Pest's built-in coverage merging or PHPUnit's `--coverage-merge`. Upload partial coverage PHP files as artifacts between jobs.

# Performance Considerations

- Sharding overhead: ~5-10 seconds per shard (test framework initialization, database setup).
- Ideal shard size: 30-120 seconds of test time per shard.
- Composer/framework booting per shard: Each shard boots Laravel independently. Config/route caching reduces boot time.
- Database migration per shard: Each shard runs migrations in parallel. With 4 shards x 15s migrations = 15s wall time vs 60s sequential.
- Coverage merging: 10-30s for a complete coverage merge.

# Security Considerations

- Coverage data may reveal code structure. Set appropriate access controls on CI artifacts.
- Database credentials per shard must be managed securely. Use environment variables from CI secrets, not hardcoded values.
- Artifact retention policies should apply to coverage files as they contain partial source listings.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Too few shards for large test suites | Started with 2 shards for 40-minute suite | Still 20+ minutes wall time | 8 shards for suites >30 minutes |
| Not isolating databases per shard | Shared database across shards | Parallel tests collide on same tables | Use separate database per shard |
| Merging coverage without parallel-safe tooling | Using incorrect merge approach | Coverage data may double-count or miss lines | Use Pest built-in merging or correct PHPUnit approach |
| Static sharding for highly imbalanced test files | One test file runs 5 minutes, others 10s | Slowest shard determines wall time | Split large test files; reorganize test classes |
| Not setting fail-fast: false | Default fail-fast behavior | One shard failure stops other shards | Set fail-fast: false for complete failure picture |

# Anti-Patterns

- **All tests in one CI job**: Not using sharding for test suites >10 minutes. Instead, distribute across multiple matrix jobs.
- **Shared database across shards**: Single database used by all parallel shards. Instead, create isolated databases per shard.
- **Ignoring the slowest shard**: Not monitoring or addressing shard imbalance. Instead, split large test files and rebalance periodically.
- **Individual shard coverage enforcement**: Setting coverage minimum on each shard individually. Instead, merge and enforce on the combined coverage.

# Examples

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
      fail-fast: false
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: password
          MYSQL_DATABASE: testing_${{ matrix.shard }}
    env:
      DB_DATABASE: testing_${{ matrix.shard }}
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with: { php-version: '8.3', extensions: pdo_mysql }
      - run: composer install --no-interaction
      - run: php artisan test --shard=${{ matrix.shard }}/4

  coverage:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with: { php-version: '8.3', coverage: pcov }
      - run: composer install --no-interaction
      - uses: actions/download-artifact@v4
      - run: php artisan test --coverage-merge --coverage-min=80
```

# Related Topics

- **Prerequisites**: GitHub Actions CI/CD fundamentals, Parallel test execution (Paratest), PHPUnit configuration
- **Related**: Matrix testing (PHP x DB), Coverage reporting, CI pipeline optimization
- **Advanced**: Dynamic shard distribution algorithms, Two-level parallelism optimization, Shard cost analysis

# AI Agent Notes

- For projects new to sharding, start with 4 shards using Pest's `--shard` flag. Monitor the slowest shard and add or remove shards based on wall time.
- If a single test file takes >2 minutes, split it into multiple smaller test files. This allows better shard distribution.
- Database isolation is the most common sharding issue. Always parameterize `DB_DATABASE` per shard.
- For coverage, ensure the merge step uses the same PHP version as the shard jobs. Different versions can produce incompatible coverage files.

# Verification

- [ ] Test suite uses `--shard` flag for distribution
- [ ] Each shard has an isolated database (DB_DATABASE per shard)
- [ ] fail-fast is set to false for complete failure reporting
- [ ] Slowest shard is monitored and rebalanced as needed
- [ ] Coverage is merged from all shards for accurate reporting
- [ ] Coverage minimum enforcement uses merged coverage, not per-shard coverage
- [ ] Shard count is appropriate for suite size (4-8 shards for large suites)
- [ ] Large test files are split for better distribution
