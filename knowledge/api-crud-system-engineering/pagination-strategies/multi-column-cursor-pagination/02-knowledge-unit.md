# Multi-Column Cursor Pagination

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Pagination Strategies
- **Knowledge Unit:** Multi-Column Cursor Pagination
- **Last Updated:** 2026-06-02

---

## Executive Summary

Multi-column cursor pagination extends the basic cursor pattern to sort by two or more columns. This is necessary when the primary sort column is not unique (e.g., `created_at` with multiple records sharing the same timestamp). The cursor encodes all sort columns plus a tiebreaker (typically the primary key). Multi-column cursors require carefully designed composite `ORDER BY` clauses and corresponding composite indexes to maintain O(1) performance.

---

## Core Concepts

### Why Multiple Columns Are Needed
A cursor with a single column (`ORDER BY created_at`) fails when:
1. Two records have identical `created_at` values
2. The page boundary falls between records with the same timestamp
3. The boundary record and the next page's first record share the same `created_at`

The result: non-deterministic ordering and duplicate/missing records.

### Standard Composite Cursor
```sql
ORDER BY created_at DESC, id DESC
```
`created_at` — primary sort column (may have duplicates)
`id` — tiebreaker (unique, ensures deterministic ordering)

### Three-Column Cursor
```sql
ORDER BY status ASC, created_at DESC, id DESC
```
`status` — filter/group column
`created_at` — temporal sort
`id` — tiebreaker

---

## Mental Models

### The Stacked Sort Model
Multi-column cursors are like sorting by last name, then first name, then social security number. Two people with the same last name are ordered by first name. Two people with identical names are ordered by SSN. The cursor encodes the values of all three.

### The GPS Coordinate Model
A single-column cursor gives you a street address. A multi-column cursor gives you GPS coordinates — you need both latitude and longitude (and altitude for 3D) to pinpoint a specific location. Each additional column increases precision.

### The Locker Combo Model
A single-column cursor is like a 1-number combination lock — easy to guess (collisions). Multi-column cursors are multi-number combos where each number narrows the position. All numbers together uniquely identify the record.

---

## Internal Mechanics

### Laravel cursorPaginate with Multiple Columns
```php
// Laravel requires the primary key as the final ORDER BY column
$posts = Post::orderBy('status', 'asc')
    ->orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15);
```

### Composite Cursor WHERE Clause
```php
// Given cursor: ['status' => 'published', 'created_at' => '2026-06-01', 'id' => 100]

// Forward (next page)
$query->where(function ($q) use ($cursor) {
    $q->where('status', '>', $cursor['status'])
      ->orWhere(function ($q) use ($cursor) {
          $q->where('status', '=', $cursor['status'])
            ->where('created_at', '<', $cursor['created_at']);
      })
      ->orWhere(function ($q) use ($cursor) {
          $q->where('status', '=', $cursor['status'])
            ->where('created_at', '=', $cursor['created_at'])
            ->where('id', '<', $cursor['id']);
      });
});
```

This generates a nested OR chain that the database can optimize using a composite index range scan.

### Composite Index Requirement
```sql
-- MUST match ORDER BY exactly (columns and direction)
CREATE INDEX idx_posts_status_created_id
ON posts(status ASC, created_at DESC, id DESC);
```

Without this index, the multi-column cursor query performs a full table scan — negating all performance benefits.

---

## Patterns

### Generic Multi-Column Cursor Builder
```php
class CursorBuilder
{
    public function buildWhere(Builder $query, array $cursor, array $orderColumns): void
    {
        $query->where(function ($q) use ($cursor, $orderColumns) {
            $this->buildNestedOr($q, $cursor, $orderColumns, 0);
        });
    }

    private function buildNestedOr($query, array $cursor, array $columns, int $index): void
    {
        if ($index >= count($columns)) {
            return;
        }

        [$col, $dir] = $columns[$index];
        $operator = $dir === 'asc' ? '>' : '<';

        // Equal to current column, recurse for tiebreaker
        $query->orWhere(function ($q) use ($cursor, $columns, $index, $col, $operator) {
            $q->where($col, '=', $cursor[$col]);
            $this->buildNestedOr($q, $cursor, $columns, $index + 1);
        });

        // Past current column
        if ($index > 0) {
            // This level must also match all previous columns as equal
            for ($i = 0; $i < $index; $i++) {
                $prevCol = $columns[$i][0];
                $query->where($prevCol, '=', $cursor[$prevCol]);
            }
        }

        $query->where($col, $operator, $cursor[$col]);
    }
}
```

### Cursor Hydration from Model
```php
public function buildCursor($record, array $columns): array
{
    $cursor = [];
    foreach ($columns as [$col, $dir]) {
        $cursor[$col] = $record->$col;
    }
    return $cursor;
}
```

### Row Constructor Syntax (PG/MySQL)
```sql
-- PostgreSQL and MySQL 8+ support composite row comparison
SELECT * FROM posts
WHERE (status, created_at DESC, id DESC) > ('published', '2026-06-01', 100)
ORDER BY status ASC, created_at DESC, id DESC
LIMIT 16;
```

---

## Architectural Decisions

### Column Order in Composite Index
The leading column should be the most selective filter or the column used in equality conditions. Range comparisons come later:
```
GOOD: WHERE status = 'published' AND created_at < '2026-06-01'
Index: (status, created_at, id)
-- The equality filter (status) narrows the range, then created_at range scan

BAD: WHERE created_at < '2026-06-01' AND status = 'published'
Index: (created_at, status, id)
-- Range scan on created_at first, then filter on status -- less efficient
```

### Minimum Tiebreaker Requirement
Always include the primary key as the final tiebreaker even if the primary sort column appears unique. This guarantees:
- Deterministic ordering
- No duplicate records across pages
- Simplified cursor construction

### Nullable Sort Columns
Nullable columns in multi-column cursors require special handling. `NULL` comparison behavior varies by database:
- PostgreSQL: NULLS LAST by default
- MySQL: NULLS FIRST by default
- SQLite: NULLS FIRST by default

Use `ORDER BY col ASC NULLS LAST` for consistent behavior.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Deterministic ordering with non-unique columns | More complex WHERE clause construction | Higher bug risk in manual implementations |
| Supports arbitrary sort combinations | Requires matching composite index | Additional index maintenance and storage |
| O(1) performance with composite index | Cursor size grows with column count | Larger URLs, more encoding overhead |
| Granular sort control for clients | Clients must understand multi-column sort semantics | Document sort column order clearly |

---

## Performance Considerations

### Composite Index Size
A composite index on 3–4 columns for 1M rows adds:
- ~60–100MB disk space
- ~20–40MB buffer pool pressure
- Slower writes (index maintenance on every INSERT/UPDATE)

### Execution Plan Verification
```sql
EXPLAIN SELECT * FROM posts
WHERE (status, created_at, id) > ('published', '2026-06-01', 100)
ORDER BY status, created_at DESC, id DESC
LIMIT 16;

-- Expected: Index Range Scan on idx_posts_status_created_id
-- Avoid: Seq Scan or Sort
```

### B-Tree Depth
Composite indexes on multi-column cursors increase B-tree depth slightly (more key bytes per entry), but the performance impact is negligible for typical use cases.

---

## Production Considerations

### Column Count Limit
Keep the cursor to 3–4 columns maximum. More columns:
- Bloats the cursor token (URL length limits)
- Complicates the WHERE clause (exponential OR chains)
- Increases composite index size

### Index Monitoring
Monitor composite index usage with database statistics:
```sql
-- PostgreSQL
SELECT idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexrelname = 'idx_posts_status_created_id';
```

### Sort Order Changes
Changing the sort order (e.g., from DESC to ASC) invalidates all existing cursors. Use cursor versioning or communicate the breaking change clearly.

---

## Common Mistakes

### Omitting the Tiebreaker Column
Why it happens: The primary sort column has high cardinality (e.g., UUID). Why it's harmful: Even with UUIDs, collisions are theoretically possible. Without a tiebreaker, the cursor boundary is non-deterministic. Better approach: Always include the primary key as the final sort column.

### Incorrect OR Chain Construction
Why it happens: Manually building the nested OR WHERE clause with wrong operator direction. Why it's harmful: The query returns wrong results — missing records or returning records from the wrong page. Better approach: Use row constructor syntax when supported, or use Laravel's `cursorPaginate()` which handles the chain correctly.

### Forgetting NULL Handling
Why it happens: Developers don't consider NULL values in sort columns. Why it's harmful: Records with NULL values sort to unexpected positions, causing missing or misordered pages. Better approach: Define NULLS FIRST/LAST explicitly in ORDER BY and handle in cursor construction.

---

## Failure Modes

### Column Type Collision
If cursor column values include types that don't compare correctly across databases (e.g., string dates vs datetime objects), the cursor WHERE clause may produce incorrect results. Always use comparable types.

### Composite Index Not Used
If the composite index doesn't match the ORDER BY direction (ASC vs DESC), the database may perform a full table scan. Verify with EXPLAIN.

### Overly Complex Cursors (5+ columns)
Cursors with 5+ columns create WHERE clauses with 5+ levels of nested OR conditions. This complexity is error-prone and may exceed database query complexity limits.

---

## Ecosystem Usage

### Laravel
`cursorPaginate()` supports multiple ORDER BY columns. Laravel automatically includes the primary key as a tiebreaker if the sort columns don't guarantee uniqueness. See `Illuminate/Database/Eloquent/Builder::cursorPaginate()`.

### PostgreSQL
Row constructor syntax `(a, b, c) > (x, y, z)` is optimized for composite index range scans. This is the most readable way to express multi-column cursors.

### MySQL
MySQL 8.0.28+ optimizes row constructor comparisons. Earlier versions use index merge or loose scan — less efficient but still works.

---

## Related Knowledge Units

### Prerequisites
- Cursor Pagination Design — Basic cursor mechanics
- Cursor Encoding Strategies — Encoding composite cursor values
- SQL Indexing Fundamentals — Composite index design

### Related Topics
- Keyset Pagination Design — SQL-only equivalent of multi-column cursors
- Pagination Strategy Selection — When multi-column cursors are needed

### Advanced Follow-up Topics
- Composite Index Design — Optimizing indexes for multi-column sort
- Query Plan Analysis — Verifying composite index usage

---

## Research Notes

### Source Analysis
- PostgreSQL documentation: Row constructor comparison, composite index scan
- Markus Winand: "Use the Index, Luke!" — Composite index design for pagination
- Laravel source: `Illuminate/Database/Eloquent/Builder.php` — cursorPaginate implementation

### Key Insight
Multi-column cursors are essential for any non-trivial sort order. A surprising number of production pagination bugs stem from single-column sorts on non-unique columns. Always add the primary key as a tiebreaker — it's a low-cost guarantee of correctness.

### Version-Specific Notes
- Laravel 9+: Full multi-column cursor support
- MySQL 8.0.28+: Row constructor index optimization
- PostgreSQL 9.2+: Row constructor comparison support
