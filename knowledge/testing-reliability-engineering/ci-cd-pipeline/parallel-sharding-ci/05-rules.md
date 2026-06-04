# Rules — Parallel Test Sharding in CI

## Rule 1: Isolate Databases Per Shard
| Field | Value |
|-------|-------|
| **Name** | Isolate Databases Per Shard |
| **Category** | CI & Data Isolation |
| **Rule** | Configure a separate database for each shard using parameterized `DB_DATABASE` (e.g., `testing_${{ matrix.shard }}`). Never use a single shared database across shards. |
| **Reason** | Parallel shards running tests simultaneously will collide on shared database tables — creating the same records, reading inconsistent state, and causing random failures. Each shard needs an isolated database to prevent cross-shard test interference. |
| **Bad Example** | All 4 shards use `DB_DATABASE=testing` — shard 2 creates a user while shard 3 reads; data race causes flaky failures. |
| **Good Example** | `DB_DATABASE: testing_${{ matrix.shard }}` — shard 1 uses `testing_1`, shard 2 uses `testing_2`, etc. |
| **Exceptions** | Test suites using SQLite in-memory databases where each process has its own memory space (no shared state). |
| **Consequences Of Violation** | Random, non-reproducible test failures from cross-shard data collisions. |

## Rule 2: Monitor the Slowest Shard — It Determines Wall Time
| Field | Value |
|-------|-------|
| **Name** | Monitor the Slowest Shard — It Determines Wall Time |
| **Category** | Performance & Optimization |
| **Rule** | Monitor the wall time of each shard in CI. The slowest shard determines total execution time. Rebalance when one shard exceeds the average by 50%+. |
| **Reason** | Parallel execution is only as fast as the slowest shard. If 3 shards finish in 2 minutes but the 4th takes 2.5 minutes, you're paying for 4 shards of parallelism but getting only the throughput of 3.2. Imbalance wastes CI resources. |
| **Bad Example** | 4 shards: 3 complete in 3 minutes, 1 completes in 8 minutes — 5 minutes of wasted parallel capacity per CI run. |
| **Good Example** | Detected imbalance (shard 4 is 2.5x slower). Split shard 4's largest test file into 2 files. Rebalance restores all shards to ~4 minutes. |
| **Exceptions** | Test suites under 5 minutes where imbalance has negligible impact. |
| **Consequences Of Violation** | Underutilized parallel capacity; CI takes longer than necessary. |

## Rule 3: Start with 4 Shards for Large Suites
| Field | Value |
|-------|-------|
| **Name** | Start with 4 Shards for Large Suites |
| **Category** | CI & Performance |
| **Rule** | Begin sharding with 4 shards for test suites exceeding 10 minutes. Monitor wall time and adjust: 8 shards for suites >30 minutes. Beyond 8 shards, diminishing returns apply. |
| **Reason** | Each shard has overhead (framework boot, database setup, worker initialization). At 4 shards, overhead is ~5-10 seconds per shard. At 16 shards, overhead per shard remains the same but total overhead is 4x, reducing marginal benefit. Start with 4 and monitor. |
| **Bad Example** | Starting with 16 shards for a 15-minute suite — 16 × 10s boot overhead = 160 seconds of non-test time; many shards finish in <1 minute of actual tests. |
| **Good Example** | Start with 4 shards for a 15-minute suite; monitor slowest shard at 4.5 minutes; add 2 more shards to reduce to 3.5 minutes. |
| **Exceptions** | Very large suites (1000+ tests, 60+ minutes) where 8+ shards are beneficial. |
| **Consequences Of Violation** | Over-sharding wastes CI resources; under-sharding leaves speed on the table. |

## Rule 4: Merge Coverage in a Final Job — Never Enforce Per-Shard
| Field | Value |
|-------|-------|
| **Name** | Merge Coverage in a Final Job — Never Enforce Per-Shard |
| **Category** | CI & Coverage |
| **Rule** | Compute coverage per shard, merge in a final job, and enforce the minimum threshold on merged coverage. Never enforce `--min` on individual shards. |
| **Reason** | Each shard covers only a subset of code. Enforcing `--min` on individual shards means each shard must achieve 80% coverage of its subset, which is impossible or meaningless (a shard testing only controllers cannot achieve 80% coverage of models). Merged coverage provides an accurate total picture. |
| **Bad Example** | `php artisan test --parallel --shard=1/4 --min=80` — shard 1 covers controllers only; cannot achieve 80% of total codebase. |
| **Good Example** | Shards: `--coverage-php=coverage.shard1.php`. Merge job: collect all `coverage.*.php`, merge, enforce `--min=80`. |
| **Exceptions** | None. Always merge coverage before enforcement. |
| **Consequences Of Violation** | Coverage enforcement is impossible with per-shard minimums; coverage gate is disabled. |

## Rule 5: Set `fail-fast: false` for Complete Failure Reporting
| Field | Value |
|-------|-------|
| **Name** | Set `fail-fast: false` for Complete Failure Reporting |
| **Category** | CI & Failure Analysis |
| **Rule** | Set `fail-fast: false` in the shard matrix strategy. Never use the default `fail-fast: true`. |
| **Reason** | With `fail-fast: true`, GitHub Actions cancels all in-progress shards when one shard fails. This hides failures in other shards — you fix the first failure only to discover 3 more in the next run. `fail-fast: false` lets all shards complete, providing the complete failure picture in a single run. |
| **Bad Example** | Default `fail-fast: true` — shard 1 fails, shards 2-4 are cancelled; CI shows 1 failure; developer fixes it, re-runs, finds 3 more failures. |
| **Good Example** | `fail-fast: false` — all 4 shards complete; CI shows 4 failures; developer fixes all in one branch. |
| **Exceptions** | Resource-constrained environments where cancelling failed runs saves significant CI minutes. |
| **Consequences Of Violation** | Multiple CI iterations to discover all failures; wasted developer time. |

## Rule 6: Split Large Test Files for Better Distribution
| Field | Value |
|-------|-------|
| **Name** | Split Large Test Files for Better Distribution |
| **Category** | Performance & Organization |
| **Rule** | Split test files that take longer than 2 minutes into multiple smaller files. Pest's `--shard` distributes by file, not by individual test. |
| **Reason** | Sharding distributes test files across shards, not individual tests. A single file taking 5 minutes cannot be split across shards — it runs entirely on one shard. Splitting such files into smaller, focused test files allows them to be distributed across shards for balanced execution. |
| **Bad Example** | `InvoiceTest.php` — 50 tests, 5 minutes runtime. Shard 2 gets this file and takes 5 minutes while other shards finish in 2 minutes. |
| **Good Example** | Split into `InvoiceCreationTest.php` (2 min), `InvoicePaymentTest.php` (1.5 min), `InvoiceCancellationTest.php` (1.5 min) — distributed across shards. |
| **Exceptions** | Test files that inherently test a single, atomic behavior and cannot be logically split. |
| **Consequences Of Violation** | Unbalanced shard distribution; underutilized parallel capacity. |
