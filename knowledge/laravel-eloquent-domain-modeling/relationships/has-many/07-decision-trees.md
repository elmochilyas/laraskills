## Loading Strategy (Paginate vs Get)

Choosing between pagination and unbounded loading for HasMany child collections.

---

## Decision Context

When retrieving child records from a HasMany relationship, you must decide whether to paginate the results or load them all at once.

---

## Decision Criteria

* expected child count per parent
* memory constraints
* user experience requirements (page numbers vs infinite scroll)
* domain consistency requirements

---

## Decision Tree

Need to load HasMany children?

↓

Is the total child set guaranteed under 100 records?

YES → `get()` is acceptable

NO → Use `paginate()`, `simplePaginate()`, or `cursorPaginate()`

    Do you need total count for page navigation?

    YES → `paginate()` (includes count query)

    NO → Is this for infinite scroll or comments?

        YES → `cursorPaginate()` (no count overhead)

        NO → `simplePaginate()` (prev/next only)

---

## Rationale

Unbounded `get()` loads all children into memory. For users with thousands of posts, this exhausts PHP memory. `paginate()` adds a count query for total page numbers. `cursorPaginate()` avoids the count query entirely, making it ideal for infinite scroll. The 100-record threshold is a guideline — smaller for memory-constrained environments.

---

## Recommended Default

**Default:** `paginate(20)` for API endpoints, `cursorPaginate(15)` for infinite scroll
**Reason:** Bounded memory usage, consistent response times, prevents OOM

---

## Risks Of Wrong Choice

Memory exhaustion with large datasets, application crashes, slow page loads, database connection timeouts.

---

## Related Rules

- HasMany-Paginate-Not-Get (has-many/05-rules.md)
- HasMany-Chunk-For-Large-Sets (has-many/05-rules.md)

---

## Related Skills

- Eager load and paginate HasMany relationships (has-many/06-skills.md)

---

## Aggregation Strategy (withCount vs Load-and-Count)

Choosing between `withCount()` and loading full child models just to count them.

---

## Decision Context

When you only need the number of children (not the child models themselves), you must decide how to obtain the count.

---

## Decision Criteria

* whether child attributes are needed for display
* memory overhead of hydrating child models
* filtering requirements on the count
* performance of COUNT subquery vs collection count

---

## Decision Tree

Need to know how many children a parent has?

↓

Do you also need the actual child models for display?

YES → Use `with('children')` + `withCount('children')` together

NO → Use `withCount('children')` alone

    Do you need to count only filtered children (e.g., active posts only)?

    YES → `withCount(['children' => fn($q) => $q->where('active', true)])`

    NO → `withCount('children')`

---

## Rationale

`withCount()` adds a single aggregate subquery — the count is calculated at the database level with no model hydration. Loading full child models just to count them is the most common aggregation anti-pattern in Laravel, wasting memory and CPU on hydrating objects that are immediately discarded.

---

## Recommended Default

**Default:** `withCount('children')` when only count is needed
**Reason:** Zero model hydration, single subquery, dramatically lower memory usage

---

## Risks Of Wrong Choice

Memory bloat from hydrating thousands of model instances, slow response times, unnecessary data transfer from database.

---

## Related Rules

- HasMany-Use-WithCount-Over-Load (has-many/05-rules.md)
- HasMany-Filter-In-DB-Not-PHP (has-many/05-rules.md)

---

## Related Skills

- Count children without loading them (has-many/06-skills.md)

---

## Cascade Delete Strategy

Choosing between database-level cascade and model event cleanup for HasMany children.

---

## Decision Context

When a parent model is deleted, you must decide how to handle its children in a HasMany relationship.

---

## Decision Criteria

* number of children per parent
* database constraint guarantees vs event reliability
* side effects required on deletion (logging, notifications)
* soft-delete compatibility

---

## Decision Tree

Need to handle children when parent is deleted?

↓

Is the parent-child relationship mandatory (children cannot exist without parent)?

YES → Use `cascadeOnDelete()` in the migration

    Do you need side effects when children are deleted?

    YES → Add model event (`deleting`) in addition to cascade

    NO → Cascade alone is sufficient

NO (children can survive) → Use `nullOnDelete()` for optional relationships

    Or handle cleanup in model events for soft-delete patterns

---

## Rationale

Database-level cascade is atomic, guaranteed, and zero-overhead. Model events may not fire in all contexts (bulk operations, raw queries). However, when cascade triggers need additional actions (cache invalidation, notifications), model events are necessary. The combination of both provides integrity + side effects.

---

## Recommended Default

**Default:** `->constrained()->cascadeOnDelete()` in the child migration
**Reason:** Database-level guarantee, zero overhead, no orphan risk

---

## Risks Of Wrong Choice

Orphaned children with foreign keys pointing to deleted parents, constraint violation errors, data bloat from accumulating orphans.

---

## Related Rules

- HasMany-Cascade-Or-Cleanup (has-many/05-rules.md)

---

## Related Skills

- Configure HasMany with cascade deletes and ordering (has-many/06-skills.md)

---

## Filter Strategy (whereHas vs PHP Collection Filter)

Choosing between database-level filtering with `whereHas` and loading all children then filtering in PHP.

---

## Decision Context

When filtering parents based on child attributes, you must decide whether to filter at the database level or in PHP collections.

---

## Decision Criteria

* total dataset size
* proportion of records that match the filter
* whether child models are already loaded
* complexity of the filter condition

---

## Decision Tree

Need to find parents with specific child attributes?

↓

Are the parents already loaded without children?

YES → Use `whereHas()` at the database level

Are parents already loaded WITH children in memory?

YES → PHP collection filter may be acceptable for small sets (<1000)

    Is the filter simple and the set small?

    YES → Collection filter is acceptable

    NO → Re-query with `whereHas()`

NO (not loaded) → Always use `whereHas()` at the database level

---

## Rationale

Database filtering leverages indexes and avoids transferring irrelevant data to PHP. Collection filtering loads everything into memory first, then discards what doesn't match. The 1000-record threshold is heuristic — for larger sets, database filtering is always superior.

---

## Recommended Default

**Default:** `whereHas()` for database-level filtering
**Reason:** Leverages indexes, reduces data transfer, orders of magnitude faster for large datasets

---

## Risks Of Wrong Choice

Memory exhaustion, slow response times, unnecessary data transfer, application crashes with large datasets.

---

## Related Rules

- HasMany-Filter-In-DB-Not-PHP (has-many/05-rules.md)

---

## Related Skills

- Configure HasMany with cascade deletes and ordering (has-many/06-skills.md)
