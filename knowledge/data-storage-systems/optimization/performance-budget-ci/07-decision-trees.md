# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Query Optimization & Profiling
**Knowledge Unit:** 4-30 Performance Budget CI
**Generated:** 2026-06-03

---

# Decision Inventory

* Query count assertions vs duration thresholds
* N+1 detection via preventLazyLoading
* Baseline comparison vs absolute thresholds

---

# Architecture-Level Decision Trees

---

## Performance Budget Enforcement

---

## Decision Context

Choosing the metrics and thresholds for enforcing query performance budgets in CI to prevent regression.

---

## Decision Criteria

* performance: budgets catch regressions before they reach production
* architectural: query count and duration are the primary metrics
* maintainability: baselines adjust as the application grows
* security: no direct impact

---

## Decision Tree

Setting up performance budgets in CI?
↓
What metrics to enforce?
→ Query count per request (most important)
→ Lazy loading prevention (catches N+1)
→ Total query duration
→ Individual slow query threshold (>100ms)
↓
Enforcement approach:
→ preventLazyLoading() in AppServiceProvider for non-production
→ DB::enableQueryLog() + assertCount in tests
→ Custom middleware: log warning when query count > threshold
↓
Baseline vs absolute:
→ Absolute: assertLessThan(30, count(queries)) — fixed threshold
→ Baseline: stored JSON from last passing run — warns on regression
↓
Test database:
→ Use production-matching DB engine (not SQLite)
→ SQLite may execute different query patterns

---

## Rationale

Performance budgets in CI are the only reliable way to prevent query regressions from reaching production. Query count assertions catch unintended N+1. Duration thresholds catch slow queries. Baselines adjust as the application evolves, avoiding false positives from intentional changes.

---

## Recommended Default

**Default:** Enforce query count (+30% overhead), lazy loading prevention, and slow query alerts
**Reason:** These three metrics catch the most common performance regressions with minimal false positives.

---

## Risks Of Wrong Choice

* No query count assertions: new relationship added to view silently adds N+1
* SQLite in tests: different query patterns than production DB
* False negatives from connection differences: SQLite ignores MySQL-specific optimizations
* Absolute thresholds that are too strict: false positives on every schema change

---

## Related Rules

* Always assert query counts in endpoint tests
* Enable preventLazyLoading in all non-production environments

---

## Related Skills

* Enforce performance budgets in CI pipeline
