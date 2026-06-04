## withSum/Avg/Min/Max vs Loading + PHP Aggregate vs Pre-computed

Choosing between aggregate subqueries (`withSum`/`withAvg`/`withMin`/`withMax`), loading relations and aggregating in PHP, or using pre-computed columns.

---

## Decision Context

When you need a computed value from related records (sum, average, min, max), you must choose between database subqueries, PHP aggregation, or denormalized storage.

---

## Decision Criteria

* whether the aggregate is needed frequently (high-traffic endpoint vs admin report)
* whether the related models are already loaded for other reasons
* how many aggregates are needed (1-2 vs 5+)
* whether the aggregate column is indexed
* whether real-time accuracy is required or staleness is acceptable

---

## Decision Tree

Need a computed value from related records (sum, average, etc.)?

↓

Is the aggregate accessed on every page load (read-heavy, high traffic)?

YES → Consider pre-computed column (cache or DB column) — avoids subquery cost

    Is real-time accuracy required?

    YES → Pre-computed column updated on writes (event listener)

    NO → Cached/scheduled recomputation

NO → Are the related models already loaded for other reasons?

    YES → Use `$order->items->sum('price')` in PHP (no extra query)

    NO → Use `withSum()` / `withAvg()` / `withMin()` / `withMax()` — single subquery

    Are 5+ aggregates needed on the same query?

    YES → Consider raw subquery or pre-computed summary table

    NO → Aggregate subqueries are fine — each adds one correlated subquery

---

## Rationale

`withSum()` etc. add a single correlated subquery per aggregate, avoiding N+1 and keeping data current. PHP aggregation is free when models are already loaded but expensive (memory) when they're not. Pre-computed columns are fastest for read-heavy access but add write complexity.

---

## Recommended Default

**Default:** `withSum()`/`withAvg()`/`withMin()`/`withMax()` for occasional aggregates; PHP aggregation when models are already loaded
**Reason:** Best balance of query cost reduction and real-time accuracy

---

## Risks Of Wrong Choice

Loading all related models just to sum them wastes memory; 5+ aggregate subqueries slow the parent query; pre-computed column adds write complexity and may go stale.

---

## Related Rules

- Index both FK and aggregate column for subquery performance (from with-sum-avg-min-max standardized knowledge)
- Handle NULL results from empty relation sets

---

## Related Skills

- Aggregate subquery constraints (relationships/06-skills.md)
- COALESCE handling for NULL aggregates (relationships/06-skills.md)
