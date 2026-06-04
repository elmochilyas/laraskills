# Skill: Shard Tests for Parallel CI Execution

## Purpose
Split the Laravel test suite across multiple parallel CI jobs using Pest's `--shard` flag and GitHub Actions matrix strategy to reduce total wall-clock time and speed up CI feedback.

## When To Use
- When the test suite exceeds 10 minutes wall-clock time in CI
- For Laravel projects with 500+ tests
- When CI runner minutes are available for parallel execution
- When coverage reporting must be complete across all shards
- When developer productivity is impacted by slow CI feedback

## When NOT To Use
- For small test suites (<5 minutes) — sharding overhead may outweigh benefits
- When tests have sequential dependencies that cross shard boundaries
- Without database isolation strategy — shared databases cause random failures
- When CI parallelism is limited (constrained self-hosted runners)

## Prerequisites
- Test suite using Pest or PHPUnit with `--shard` support
- GitHub Actions workflow with matrix strategy
- Database isolation per shard configured
- Understanding of static vs dynamic sharding

## Inputs
- Test suite execution time (baseline without sharding)
- Number of shards to start with (typically 4)
- Database connection configuration for each shard
- Coverage merging configuration
- CI parallel execution limits

## Workflow
1. Measure baseline test suite execution time
2. Start with 4 shards for suites >10 minutes, 8 for >30 minutes
3. Configure the GitHub Actions matrix with shard numbers
4. Set each shard's database: `DB_DATABASE: testing_${{ matrix.shard }}`
5. Add `fail-fast: false` to see all shard failures
6. Run tests: `php artisan test --shard=${{ matrix.shard }}/${{ matrix.total-shards }}`
7. Configure coverage collection per shard (partial coverage files)
8. Add a merge job that collects and merges coverage from all shards
9. Enforce coverage minimum on the merged coverage, not per-shard
10. Monitor the slowest shard and rebalance by splitting large test files

## Validation Checklist
- [ ] Test suite uses `--shard` flag for distribution
- [ ] Each shard has an isolated database (`DB_DATABASE` per shard)
- [ ] `fail-fast` is set to `false` for complete failure reporting
- [ ] Slowest shard is monitored and rebalanced as needed
- [ ] Coverage is merged from all shards for accurate reporting
- [ ] Coverage minimum enforcement uses merged coverage, not per-shard
- [ ] Shard count is appropriate for suite size (4-8 for large suites)
- [ ] Large test files are split for better distribution

## Common Failures
- Too few shards for large test suites — still 20+ minutes wall time
- Not isolating databases per shard — parallel tests collide on same tables
- Merging coverage without correct tooling — coverage double-counts or misses lines
- Static sharding with imbalanced test files — one shard much slower than others
- Not setting `fail-fast: false` — one shard failure cancels other shards
- Enforcing coverage minimum per shard — impossible for shards with limited scope

## Decision Points
- 4 vs 8 shards — 4 for 10-30 minute suites, 8 for 30+ minute suites
- Static vs dynamic sharding — static for most projects, dynamic for 1000+ tests with imbalance
- Database isolation strategy — separate databases vs separate schemas within one database

## Performance Considerations
- Sharding overhead: ~5-10s per shard (framework boot, database setup)
- Ideal shard size: 30-120 seconds of test time per shard
- Two-level parallelism: combine sharding (CI jobs) with `--parallel` (process within jobs)
- Coverage merging adds 10-30s to total CI time
- Beyond 8 shards, diminishing returns apply (overhead dominates)

## Security Considerations
- Coverage data may reveal code structure — restrict CI artifact access
- Database credentials per shard must be managed securely
- Artifact retention policies should apply to coverage files
- Ensure parallel database connections don't exceed connection pool limits

## Related Rules
- [Rule: Isolate Databases Per Shard](./05-rules.md)
- [Rule: Monitor the Slowest Shard](./05-rules.md)
- [Rule: Merge Coverage in a Final Job](./05-rules.md)

## Related Skills
- Matrix Testing (PHP × Database)
- CI Pipeline Optimization
- Coverage Reporting and Enforcement

## Success Criteria
- [ ] Test suite wall time is reduced proportionally to shard count
- [ ] Each shard has an isolated database with no cross-shard interference
- [ ] Coverage is merged accurately with minimum enforcement on merged data
- [ ] Shard imbalance is monitored and large test files are split
- [ ] All shards complete on every CI run (fail-fast: false)
