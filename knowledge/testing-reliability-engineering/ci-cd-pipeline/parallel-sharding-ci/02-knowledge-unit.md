# Metadata
Domain: Testing & Reliability Engineering
Subdomain: CI/CD Pipeline Integration
Knowledge Unit: Parallel Test Sharding in CI
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Parallel test sharding splits the test suite across multiple CI jobs, each running a subset of tests simultaneously, to reduce total wall-clock time. Pest and PHPUnit support sharding natively via `--shard` flag. The standard approach uses GitHub Actions matrix strategy to define shard jobs, with static or dynamic splitting of test files. Sharding reduces a 30-minute test suite to 5-10 minutes depending on shard count and parallelism efficiency. The key challenges are balanced test distribution, coverage merging, and database isolation across shards.

# Core Concepts
- **Shard**: A subset of the total test suite. Each shard runs independently in its own CI job.
- **`--shard=n/m`**: Pest/PHPUnit flag. `n` is the shard number (1-indexed), `m` is total shards. `php artisan test --shard=2/4` runs the second quarter of tests.
- **Static sharding**: Tests are split by file name using a hash or alphabetical distribution. Pest's built-in `--shard` uses this approach.
- **Dynamic sharding**: Tests are split based on historical execution time for balanced distribution. Requires prior test timing data.
- **Shard count determination**: Based on total test count, average test duration, and available CI parallelism. Typical: 4-8 shards for large Laravel codebases.
- **Coverage merging**: Each shard computes partial coverage; coverage data must be merged for a complete report. Pest supports automatic coverage merging.

# Mental Models
- **Sharding as divide and conquer**: One CI runner becomes many, each handling a portion. Total work is the same, but wall-clock time is reduced by the shard count (minus overhead).
- **Static vs dynamic sharding**: Static is like dealing cards alphabetically — simple but may give some players more work. Dynamic is like dealing based on known hand strength — requires prior data.
- **Amdahl's Law**: Speedup = 1 / ((1 - P) + P/N) where P is parallelizable portion. If 10% of test time is sequential overhead, max speedup with infinite shards is 10x.
- **Shard granularity**: Too few shards = wasted parallelism. Too many shards = overhead dominates. Sweet spot: each shard runs 30-120 seconds of tests.

# Internal Mechanics
- **Pest sharding algorithm**: Sorts test files alphabetically, hashes each file path, distributes files to shards using modulo of hash. Ensures consistent distribution regardless of execution order.
- **PHPUnit test suite splitting**: PHPUnit's `--shard` flag works similarly, reading the test suite configuration from `phpunit.xml` and distributing test files across shards.
- **Parallel within shard**: Each shard can additionally use `--parallel` for process-level parallelism within the job (Paratest). Two-level parallelism: across shards (CI) and within shards (processes).
- **Coverage merging process**: Each shard outputs coverage to a unique file (`--coverage-php=coverage-shard-1.php`). A final merge step uses `phpunit --coverage-merge` or Pest's built-in merging.
- **Database isolation per shard**: Each shard needs its own database. For MySQL/PostgreSQL, use separate database names (e.g., `testing_shard_1`, `testing_shard_2`). Configured via environment variable per shard.

# Patterns
- **Pattern: Matrix-based sharding**
  - Purpose: Split tests across GitHub Actions matrix jobs
  - Benefits: Native CI parallelism; no additional tools needed
  - Tradeoffs: Fixed shard count; static distribution only
  - Implementation: `strategy.matrix.shard: [1, 2, 3, 4]` with `php artisan test --shard=${{ matrix.shard }}/4`

- **Pattern: Coverage merging across shards**
  - Purpose: Combine partial coverage reports into complete report
  - Benefits: Single coverage number and report from sharded run
  - Tradeoffs: Merge step adds 10-30 seconds; requires coverage storage
  - Implementation: Upload coverage PHP files as artifacts; merge in final job

- **Pattern: Dynamic sharding with historical timing**
  - Purpose: Balance shard execution time using historical results
  - Benefits: More even distribution; no single slow shard
  - Tradeoffs: Requires test timing database; initial distribution may be unbalanced
  - Implementation: Parse JUnit XML from previous run; sort tests by duration; distribute round-robin

- **Pattern: Two-level parallelism (shards × processes)**
  - Purpose: Maximize CI resource utilization
  - Benefits: Full CPU utilization within each shard job
  - Tradeoffs: Complexity; database connection management
  - Implementation: Each shard runs `php artisan test --parallel --shard=$n/$m`

# Architectural Decisions
- **Shard count**: Start with 2-4 shards. Monitor slowest shard time. Add shards until the slowest shard is under 5 minutes. Beyond 8 shards, overhead reduces benefits.
- **Static vs dynamic sharding**: Static for most projects (simpler, no infra needed). Dynamic for large suites (1000+ tests) where imbalance wastes significant CI time.
- **Shared vs isolated database per shard**: Isolated databases per shard are safer. Shared databases require `RefreshDatabase` to work correctly across shards — it's difficult to guarantee isolation without separate databases.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| 4-8x reduction in CI wall-clock time | CI configuration complexity | Worth it for test suites >10 minutes |
| Coverage merging works automatically | Merge step adds overhead (10-30s) | Negligible compared to total savings |
| Matrix sharding is native to GH Actions | Static distribution may be imbalanced | Monitor and adjust shard count quarterly |
| Two-level parallelism maximizes resources | Complex database isolation setup | Use separate databases per shard |

# Performance Considerations
- Sharding overhead: ~5-10 seconds per shard (test framework initialization, database setup).
- Ideal shard size: 30-120 seconds of test time per shard. Below 30s: overhead dominates. Above 120s: not enough parallelism.
- Composer/framework booting per shard: Each shard boots Laravel independently. Caching (config cache, route cache) reduces boot time.
- Database migration per shard: Each shard runs migrations. With 4 shards × 15s migrations = 15s wall time (parallel) vs 60s sequential. Save: 45s.
- Coverage merging: 10-30s for a complete coverage merge. Acceptable for comprehensive reports.

# Production Considerations
- **Shard count vs CI runner cost**: More shards = more runner minutes. 1 job × 30 min = 30 min vs 4 jobs × 8 min = 32 min. Sharding may slightly increase total minutes but significantly reduces wall time.
- **Flaky test detection in sharded runs**: A test that fails only in shard 3 may be a shard-isolation issue (leaking state), not a real flake. Track failures by shard.
- **Coverage enforcement with sharding**: Each shard's partial coverage is meaningless. Only the merged coverage should be used for `--min` enforcement.
- **Retry strategy for shards**: If a shard fails, retry only that shard, not the entire suite. Use GitHub Actions `continue-on-error` and conditional retry.

# Common Mistakes
- **Mistake: Too few shards for large test suites**
  - Why: Started with 2 shards for a 40-minute test suite
  - Why harmful: Still 20+ minutes wall time; underutilized parallelism
  - Better: 8 shards for suites >30 minutes; adjust based on slowest shard time

- **Mistake: Not isolating databases per shard**
  - Why: Shared database across shards
  - Why harmful: Parallel tests collide on the same tables; random failures
  - Better: Use separate database per shard (`DB_DATABASE=testing_${{ matrix.shard }}`)

- **Mistake: Merging coverage without parallel-safe tooling**
  - Why: Using PHPUnit's coverage merge without understanding parallelism
  - Why harmful: Coverage data may double-count or miss lines
  - Better: Use Pest's built-in coverage merging or PHPUnit's `--coverage-merge` correctly

- **Mistake: Static sharding for highly imbalanced test files**
  - Why: One test file runs for 5 minutes while others run for 10 seconds
  - Why harmful: Slowest shard determines wall time; benefit of additional shards is marginal
  - Better: Split large test files; use dynamic sharding or reorganize test classes

# Failure Modes
- **Database name collision**: Two shards with the same `DB_DATABASE` on the same database server. Always parameterize database name per shard.
- **Shard distribution drift**: Adding or removing test files changes shard distribution. A previously balanced suite becomes imbalanced. Monitor and adjust periodically.
- **Coverage merge failure**: Partial coverage files from shards are incompatible (different PHP version, different autoloading). Ensure all shards use the same PHP version for coverage merging.
- **Sequential test dependency**: Tests that depend on data created by a test in another shard will fail. Ensure tests are fully isolated and independent.

# Ecosystem Usage
- **Laravel core**: Laravel's CI uses 4-8 shards depending on the branch. The shard count is defined in the GitHub Actions workflow matrix.
- **PHPUnit**: PHPUnit 12+ has native `--shard` support. No additional extensions needed.
- **Paratest**: Paratest supports sharding internally via `--shard` flag, compatible with PHPUnit's sharding format.
- **GitHub Actions**: Matrix strategy with `shard` variable is the standard approach. `strategy.fail-fast: false` ensures other shards continue if one fails.

# Related Knowledge Units
- **Prerequisites**: GitHub Actions CI/CD fundamentals, Parallel test execution (Paratest), PHPUnit configuration
- **Related Topics**: Matrix testing (PHP × DB), Coverage reporting, CI pipeline optimization
- **Advanced Follow-up**: Dynamic shard distribution algorithms, Two-level parallelism optimization, Shard cost analysis

# Research Notes
- Pest's built-in `--shard` flag uses filename hashing for distribution; it does not currently support time-based dynamic sharding natively, requiring custom CI scripting for balanced distribution
- GitHub Actions matrix strategy with `max-parallel` setting allows controlling the number of shards running simultaneously, which is useful for self-hosted runners with limited capacity
- Test suite sharding is most effective when individual test files are small (5-20 tests per file); monolith test files should be split to enable fine-grained shard distribution
- Coverage merging across shards is a pain point in the Laravel ecosystem; Pest 4 improved this with automatic coverage file merging in the test runner
- The Laravel community recommendation is to start with 4 shards and monitor the slowest shard execution time, adding shards until the slowest shard is under 5 minutes wall time
