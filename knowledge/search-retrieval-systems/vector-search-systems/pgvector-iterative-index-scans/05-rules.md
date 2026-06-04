---
## Rule Name
Enable Iterative Scans for Filtered ANN

## Category
Performance

## Rule
Enable pgvector iterative index scans when using HNSW indexes with mandatory metadata filters.

## Reason
HNSW navigates by vector similarity, not filter conditions. Without iterative scans, filtered ANN may miss relevant results or return fewer than requested.

## Bad Example
```sql
-- No iterative scan — may miss filter-matching results
SELECT id FROM items WHERE category = 'electronics' ORDER BY embedding <=> $query LIMIT 10;
```

## Good Example
```sql
SET hnsw.iterative_scan = relaxed;
SELECT id FROM items WHERE category = 'electronics' ORDER BY embedding <=> $query LIMIT 10;
```

## Exceptions
Unfiltered vector search with no `WHERE` clause constraints.

## Consequences Of Violation
Missing relevant results when filters restrict the search space, degrading hybrid search quality.

---
## Rule Name
Start with Strict Ordering, Relax Only If Needed

## Category
Design

## Rule
Use strict ordering mode by default for iterative scans; switch to relaxed only if filtered recall is insufficient.

## Reason
Strict ordering guarantees exact distance ordering. Relaxed ordering may return approximate distances but provides more results matching the filter.

## Bad Example
```sql
-- Starting with relaxed — losing exact distance ordering
SET hnsw.iterative_scan = relaxed;
```

## Good Example
```sql
-- Start strict
SET hnsw.iterative_scan = strict;

-- If filtered recall < 90%, switch to relaxed
SET hnsw.iterative_scan = relaxed;
```

## Exceptions
Applications where recall is more critical than exact distance ordering.

## Consequences Of Violation
Unnecessary approximate distances when strict mode would have been sufficient, or missing results when strict is too restrictive.

---
## Rule Name
Set Iteration Limits to Prevent Runaway Queries

## Category
Performance

## Rule
Always set reasonable iteration limits for pgvector iterative scans to prevent unbounded query times.

## Reason
Iterative scans progressively relax parameters. Without limits, queries with highly restrictive filters may iterate many times, causing timeouts.

## Bad Example
```sql
-- No iteration limit — query may run indefinitely
SET hnsw.iterative_scan = relaxed;
```

## Good Example
```sql
SET hnsw.iterative_scan = relaxed;
SET hnsw.iterative_scan.max_iterations = 10;
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Query timeouts under restrictive filters, degraded P99 latency, and cascading application failures.
