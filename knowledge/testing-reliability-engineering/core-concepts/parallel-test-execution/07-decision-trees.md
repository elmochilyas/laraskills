# Metadata

**Domain:** Testing & Reliability Engineering
**Subdomain:** Test Framework & Runner Infrastructure
**Knowledge Unit:** Parallel Test Execution
**Generated:** 2026-06-03

---

# Decision Inventory

1. Enable parallel or stay sequential
2. Worker count tuning
3. Coverage collection approach
4. maxBatchSize configuration

---

# Architecture-Level Decision Trees

---

## Decision Name: Enable Parallel or Stay Sequential

---

## Decision Context

Choose whether the test suite should run in parallel mode.

---

## Decision Criteria

* performance

---

## Decision Tree

Suite > 500 tests or > 5 min runtime?
↓
YES → Continue
NO → Stay sequential (parallel overhead not worth it)

↓
CI runner has >= 2 CPU cores?
↓
YES → Continue
NO → Stay sequential

↓
All tests self-contained (no @depends, no global state)?
↓
YES → Enable parallel execution
NO → Refactor tests for independence first

---

## Rationale

Parallel mode adds process spawning overhead and requires database isolation. Below 100 tests or on single-CPU runners, sequential is faster and simpler.

---

## Recommended Default

**Default:** Sequential for < 100 tests; parallel with 4 workers for >= 500 tests
**Reason:** Small suites don't benefit from parallelism; overhead exceeds savings.

---

## Risks Of Wrong Choice

Enabling parallel without isolation causes random failures. Staying sequential for large suites makes CI a bottleneck.

---

## Related Rules

Rule 1: Always verify database isolation before enabling parallel execution
Rule 6: Isolate tests that use global state or singletons

---

## Related Skills

Optimize Parallel Test Distribution and Worker Resources

---

## Decision Name: Worker Count Tuning

---

## Decision Context

Choose the optimal number of parallel workers for the specific CI runner.

---

## Decision Criteria

* performance

---

## Decision Tree

Test suite is CPU-bound (mostly computation)?
↓
YES → Workers = CPU cores minus 1
NO → Test suite is I/O-bound (HTTP, DB, filesystem)?
↓
YES → Workers = CPU cores + 2 (extra workers utilize wait time)
NO → Workers = CPU cores (balanced)

↓
CI runner is GitHub Actions hosted (2 CPU)?
↓
YES → 2 workers for CPU-bound; 4 for I/O-bound
NO → Match to dedicated runner specs; benchmark 50%/100%/150% of CPU count

---

## Rationale

CPU-bound tests don't benefit from oversubscription. I/O-bound tests can use extra workers because they spend time waiting on external resources.

---

## Recommended Default

**Default:** CPU cores minus 1 for CPU-bound; CPU cores + 2 for I/O-bound
**Reason:** Balances resource utilization without over-saturating the CPU.

---

## Risks Of Wrong Choice

Too many workers cause context switching slowdown and DB connection exhaustion. Too few workers underutilize CI capacity.

---

## Related Rules

Rule 2: Never assume linear speedup from adding workers
Rule 5: Configure slowThreshold to flag unexpectedly slow tests

---

## Related Skills

Optimize Parallel Test Distribution and Worker Resources

---

## Decision Name: Coverage Collection in Parallel Mode

---

## Decision Context

Choose how to collect code coverage when running tests in parallel.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Coverage needed for CI enforcement?
↓
YES → Continue
NO → Skip coverage in parallel runs (speed boost)

↓
pcov available on CI runner?
↓
YES → Use pcov with parallel coverage collection
NO → Run coverage in a separate sequential pass

↓
Coverage data must include parallel execution paths?
↓
YES → Use pcov with manual merge configuration
NO → Sequential coverage pass is sufficient

---

## Rationale

Parallel coverage with Xdebug is unstable and can deadlock workers. pcov is parallel-safe with lower overhead. Sequential coverage pass is the safest fallback.

---

## Recommended Default

**Default:** Run coverage in a separate sequential job using pcov
**Reason:** Most reliable approach; avoids parallel merge complexity and Xdebug instability.

---

## Risks Of Wrong Choice

Parallel coverage with Xdebug causes corrupt reports and CI job crashes. No coverage means no enforcement gate.

---

## Related Rules

Rule 3: Use pcov for parallel coverage collection, not Xdebug

---

## Related Skills

Optimize Parallel Test Distribution and Worker Resources
