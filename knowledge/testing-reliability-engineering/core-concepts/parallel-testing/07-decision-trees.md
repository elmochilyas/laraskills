# Metadata

**Domain:** Testing & Reliability Engineering
**Subdomain:** Test Framework & Runner Infrastructure
**Knowledge Unit:** Parallel Testing
**Generated:** 2026-06-03

---

# Decision Inventory

1. Enable parallel execution or stay sequential
2. Worker count configuration
3. Database isolation strategy
4. Coverage collection mode

---

# Architecture-Level Decision Trees

---

## Decision Name: Enable Parallel Execution or Stay Sequential

---

## Decision Context

Choose whether to enable parallel test execution for the test suite.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Suite has > 500 tests or > 5 min runtime?
↓
YES → Continue
NO → Sequential is sufficient

↓
CI runner has >= 2 CPU cores?
↓
YES → Continue
NO → Sequential (parallel overhead exceeds benefit)

↓
All tests are self-contained (no @depends, no global state)?
↓
YES → Enable parallel execution
NO → Refactor tests first, then enable parallel

---

## Rationale

Parallel execution reduces wall-clock time proportionally to worker count but requires test independence. Small suites or underpowered runners see no benefit.

---

## Recommended Default

**Default:** Sequential for suites < 500 tests; parallel with 4 workers for suites >= 500 tests
**Reason:** Parallel overhead (process spawning, DB isolation) isn't worth it for small suites.

---

## Risks Of Wrong Choice

Enabling parallel without isolation causes random failures. Staying sequential for large suites makes CI a bottleneck.

---

## Related Rules

Rule 1: Always use database isolation when running parallel tests
Rule 6: Never use @depends annotations in test suites intended for parallel execution

---

## Related Skills

Configure Parallel Test Execution

---

## Decision Name: Worker Count Configuration

---

## Decision Context

Choose the optimal number of parallel workers for the CI runner.

---

## Decision Criteria

* performance

---

## Decision Tree

Tests are CPU-bound (mostly computation)?
↓
YES → Workers = CPU cores minus 1
NO → Tests are I/O-bound (HTTP, DB, filesystem)?
↓
YES → Workers = CPU cores + 1 to 2 extra
NO → Workers = CPU cores (balanced)

↓
CI runner is GitHub Actions hosted (2 CPU)?
↓
YES → 2 workers for CPU-bound, 4 for I/O-bound
NO → Match to dedicated runner specs

---

## Rationale

Oversubscribing CPU cores causes context switching overhead that can make parallel execution slower than sequential. I/O-bound tests benefit from extra workers because they spend time waiting.

---

## Recommended Default

**Default:** CPU cores minus 1 for CPU-bound; CPU cores + 2 for I/O-bound
**Reason:** Reserves one core for OS/IO; extra workers utilize wait time for I/O-bound tests.

---

## Risks Of Wrong Choice

Too few workers underutilizes CI capacity. Too many workers causes context switching slowdown and database connection exhaustion.

---

## Related Rules

Rule 2: Match worker count to available CPU cores minus one
Rule 5: Configure MySQL max_connections for parallel worker count

---

## Related Skills

Configure Parallel Test Execution

---

## Decision Name: Database Isolation Strategy

---

## Decision Context

Choose how to isolate database state between parallel workers.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Using SQLite with :memory: database?
↓
YES → Automatic isolation (each worker has own in-memory DB)
NO → Using MySQL or PostgreSQL?
↓
YES → Use `ParallelTesting()` facade for process-specific DB names
NO → Use RefreshDatabase trait per test file

↓
RefreshDatabase per test is fast enough?
↓
YES → Use RefreshDatabase trait
NO → Use per-process databases with `ParallelTesting::token()`

---

## Rationale

Without isolation, parallel workers write to the same database simultaneously, causing random failures. Per-process databases provide full isolation but require setup/teardown.

---

## Recommended Default

**Default:** SQLite in-memory for simplicity; ParallelTesting facade for MySQL/PostgreSQL
**Reason:** SQLite needs no setup. MySQL/PostgreSQL require process-specific database creation via ParallelTesting.

---

## Risks Of Wrong Choice

No isolation causes intermittent data collision failures. Wrong isolation approach (e.g., RefreshDatabase with MySQL in parallel) may be too slow.

---

## Related Rules

Rule 1: Always use database isolation when running parallel tests
Rule 7: Use ParallelTesting::token() for unique resource naming

---

## Related Skills

Configure Parallel Test Execution
