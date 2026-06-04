# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Query Optimization & Profiling
**Knowledge Unit:** 4-2 EXPLAIN ANALYZE
**Generated:** 2026-06-03

---

# Decision Inventory

* EXPLAIN vs EXPLAIN ANALYZE selection
* Actual vs estimated row comparison
* Per-node timing analysis

---

# Architecture-Level Decision Trees

---

## Query Analysis Tool Selection

---

## Decision Context

Choosing between EXPLAIN (estimates) and EXPLAIN ANALYZE (actuals) based on query type and analysis requirement.

---

## Decision Criteria

* performance: EXPLAIN ANALYZE executes the query; EXPLAIN does not
* architectural: ANALYZE shows actual vs estimated divergence
* maintainability: actual timing identifies the true bottleneck node
* security: ANALYZE on write queries modifies data

---

## Decision Tree

Analyzing query performance?
↓
Is this a SELECT query?
YES → Use EXPLAIN ANALYZE (postgres) or EXPLAIN ANALYZE (MySQL 8.0.18+)
    → Compares estimated vs actual rows
    → Identifies the slowest plan node by actual execution time
    → Run twice: first run = cold cache, second = warm cache
NO → Is this an INSERT/UPDATE/DELETE?
    YES → Use EXPLAIN (without ANALYZE) — ANALYZE would execute the write
        → Or wrap in transaction: BEGIN; EXPLAIN ANALYZE ...; ROLLBACK;
    NO → Use EXPLAIN for plan-only analysis
↓
Comparing actual to estimated rows:
→ Actual >> Estimated → Stale statistics → Run ANALYZE TABLE
→ Actual == Estimated → Statistics are accurate
→ Actual << Estimated → Query is faster than expected — check filters

---

## Rationale

EXPLAIN shows the planner's best guess. EXPLAIN ANALYZE shows ground truth. The gap between estimated and actual rows reveals stale statistics or parameterized plan issues. Per-node timing identifies exactly which operation is the bottleneck.

---

## Recommended Default

**Default:** EXPLAIN ANALYZE for SELECT query analysis
**Reason:** Actual execution metrics reveal true bottlenecks that estimates miss. Run twice to account for cache effects.

---

## Risks Of Wrong Choice

* Running ANALYZE on write queries: actually executes INSERT/UPDATE/DELETE
* Not accounting for caching: first run is slow (cold cache), misleading analysis
* Stale statistics causing bad plans: ANALYZE TABLE to refresh

---

## Related Rules

* Always compare actual vs estimated rows in EXPLAIN ANALYZE output
* Never run EXPLAIN ANALYZE on production write queries without a wrapping transaction

---

## Related Skills

* Analyze query execution with EXPLAIN ANALYZE
