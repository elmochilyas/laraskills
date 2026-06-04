## Deferred Loading Strategy (load vs with)

Choosing between `with()` at query time and `load()` post-retrieval for relationship loading.

---

## Decision Context

When a relationship's necessity depends on runtime conditions, you must decide whether to load it before or after the initial query.

---

## Decision Criteria

* whether the relationship need is known before the query
* conditionality of the relationship (always vs sometimes needed)
* performance trade-off of separate query vs combined query
* code organization (controller vs middleware vs resource)

---

## Decision Tree

Need relationship data alongside parent models?

↓

Is the relationship need known before the query executes?

YES → Use `with()` at query time (more efficient — single query planning)

NO → Is the relationship needed conditionally?

    YES → Use `load()` after the query, guarded by condition

    NO → Is this in a reusable component (API resource, view composer)?

        YES → Use `loadMissing()` for defensive loading

---

## Rationale

`with()` is more efficient because the eager loading is planned together with the parent query. However, `load()` is necessary for conditional loading. `loadMissing()` is essential in reusable components where the caller may have already loaded the relationship. The key rule: never use `load()` inside a loop.

---

## Recommended Default

**Default:** Prefer `with()` when the need is known; use `loadMissing()` in reusable components
**Reason:** `with()` is more efficient; `loadMissing()` prevents redundant queries in shared code

---

## Risks Of Wrong Choice

N+1 from `load()` in loops, redundant queries from unconditional `load()`, missing relationships from forgotten `with()`.

---

## Related Rules

- Not-Load-In-Loops (eager-loading-fundamentals/05-rules.md)
- LoadMissing-Defensive-Pattern (eager-loading-fundamentals/05-rules.md)

---

## Related Skills

- Use loadMissing for defensive relationship loading (eager-loading-fundamentals/06-skills.md)

---

## Loop Loading Detection

Identifying and fixing the common anti-pattern of calling `load()` inside a loop.

---

## Decision Context

When loading relationships on multiple models, you must ensure `load()` is called on the collection, not on individual models in a loop.

---

## Decision Criteria

* whether `load()` is called on a collection or individual model
* detection in code review and profiling
* performance impact of loop-based loading

---

## Decision Tree

Loading a relationship on multiple models?

↓

Is `load()` called inside a `foreach` or `map`?

YES → Stop — this recreates N+1

    Call `load()` on the parent collection instead

NO → Is `load()` called on the collection once?

    YES → Correct — 1 query for all models

---

## Rationale

`load()` on a collection batches the eager loading into a single query with `WHERE IN`. `load()` on individual models in a loop executes a separate query per iteration, recreating the N+1 problem that eager loading is meant to solve.

---

## Recommended Default

**Default:** Always call `load()` on the collection, never in a loop
**Reason:** Collection `load()` is 1 query; loop `load()` is N queries

---

## Risks Of Wrong Choice

N+1 query problem, performance degradation, defeating the purpose of eager loading.
