# Metadata

**Domain:** Testing & Reliability Engineering
**Subdomain:** Test Framework & Runner Infrastructure
**Knowledge Unit:** Test Suite Profiling
**Generated:** 2026-06-03

---

# Decision Inventory

1. Optimize vs quarantine slow tests
2. Cold vs warm cache profiling
3. Database vs code optimization priority

---

# Architecture-Level Decision Trees

---

## Decision Name: Optimize vs Quarantine Slow Tests

---

## Decision Context

Choose how to handle tests that consistently exceed a time threshold.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Test exceeds 5 seconds consistently?
↓
YES → Test provides critical regression coverage?
↓
YES → Quarantine to separate nightly CI job
NO → Consider removing or rewriting

NO → Test in top 20% slowest (Pareto)?
↓
YES → Can it be optimized (reduce DB queries, mock services)?
↓
YES → Optimize in place
NO → Quarantine to slow suite

---

## Rationale

A few slow tests in the main suite block fast feedback. Quarantine keeps main CI fast while preserving coverage. Pareto principle: 80% of suite time from 20% of tests.

---

## Recommended Default

**Default:** Optimize tests under 5s that are in top 20%; quarantine tests over 5s
**Reason:** Balances developer feedback speed with comprehensive coverage.

---

## Risks Of Wrong Choice

Keeping slow tests in main CI blocks all developers. Quarantining critical tests misses regressions.

---

## Related Rules

Rule 4: Optimize the top 20% of slow tests (Pareto principle)
Rule 6: Quarantine slow tests to a separate CI job

---

## Related Skills

Profile and Optimize Test Suite Performance

---

## Decision Name: Cold vs Warm Cache Profiling

---

## Decision Context

Choose whether to profile on cold cache or warm cache for optimization decisions.

---

## Decision Criteria

* performance

---

## Decision Tree

Profiling to guide optimization effort?
↓
YES → Profile on warm cache (steady-state performance)
NO → Profiling cold-start performance for serverless/containers?
↓
YES → Profile on cold cache specifically
NO → Default to warm cache profiling

---

## Rationale

First-run timing includes cache population and compilation overhead that is not representative of steady-state CI performance. Warm cache profiling shows the true test execution time.

---

## Recommended Default

**Default:** Profile on warm cache after one warm-up run
**Reason:** Cold cache timings are inflated 2x by compilation overhead, leading to wrong optimization targets.

---

## Risks Of Wrong Choice

Optimizing based on cold cache data wastes effort on cache-related overhead that doesn't affect steady-state CI.

---

## Related Rules

Rule 2: Profile warm runs, not cold cache runs

---

## Related Skills

Profile and Optimize Test Suite Performance

---

## Decision Name: Database vs Code Optimization Priority

---

## Decision Context

Choose whether to optimize database queries or application code when a test is slow.

---

## Decision Criteria

* performance

---

## Decision Tree

Slow test has excessive database queries (>10)?
↓
YES → Check for N+1 queries using `expectsDatabaseQueryCount()`
↓
N+1 present? → Optimize eager loading (highest impact)
No N+1 but many queries? → Optimize query patterns, reduce iterations

NO → Test slow due to external service calls?
↓
YES → Mock the external service or use fakes
NO → Test slow due to application logic?
↓
YES → Profile application code; optimize bottleneck

---

## Rationale

Slow tests are often slow due to excessive database queries. The highest-impact optimization is reducing query count through eager loading and query optimization.

---

## Recommended Default

**Default:** Check query count first — N+1 is the most common cause of slow tests
**Reason:** 80% of slow test time comes from database operations, not application code.

---

## Risks Of Wrong Choice

Optimizing PHP code while N+1 queries are the real bottleneck yields negligible improvement.

---

## Related Rules

Rule 5: Correlate slow tests with database query counts

---

## Related Skills

Profile and Optimize Test Suite Performance
