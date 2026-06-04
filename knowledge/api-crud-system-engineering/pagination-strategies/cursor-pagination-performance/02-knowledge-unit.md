# Cursor Pagination Performance

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Pagination Strategies
- **Knowledge Unit:** Cursor Pagination Performance
- **Last Updated:** 2026-06-02

---

## Executive Summary

Cursor pagination delivers O(1) query performance regardless of dataset position because the database uses index range scans rather than scan-and-discard. A cursor-based query at position 1 and position 1 million both traverse approximately the same number of index pages. The key requirement is a well-designed composite index that matches the `ORDER BY` columns. When the index is correctly designed, cursor pagination outperforms offset pagination by orders of magnitude for deep pages.

---

## Core Concepts

### Constant-Time Navigation
```sql
-- Both queries have similar cost regardless of position
SELECT * FROM posts
WHERE (created_at, id) < ('2026-06-01', 15)
ORDER BY created_at DESC, id DESC
LIMIT 16;

SELECT * FROM posts
WHERE (created_at, id) < ('2024-01-01', 999999)
ORDER BY created_at DESC, id DESC
LIMIT 16;
```

Both queries perform an index range scan that starts at the cursor position and reads exactly 16 rows. The cost is proportional to the number of rows fetched, not the distance from the start.

### Index Dependency
Cursor pagination is only as fast as the supporting index:
```sql
-- Required index for the above query
CREATE INDEX idx_posts_created_at_id ON posts(created_at DESC, id DESC);
```

Without this index, the database performs a full table scan and sort, negating all performance benefits.

### LIMIT+1 Cost
The extra row fetch (LIMIT 16 vs 15) adds one additional index leaf-page read (~0.01ms). Negligible.

---

## Mental Models

### The Bookmark-to-Content Model
Instead of reading every page from the start and counting (offset), you place a bookmark at the last position and read only what comes after. The bookmark tells the database exactly where in the B-tree index to start reading — no wasted traversal.

### The Needle-on-Record Model
A cursor is like a needle placed on a vinyl record. Moving the needle to a different track (cursor position) takes the same amount of time regardless of whether it's track 1 or track 10. The needle moves directly to the groove.

### The Dictionary Model
Looking up words by page number (offset) requires counting pages from the start. Looking up words by a guide word (cursor) starts directly at that word. The guide word tells you exactly where to open the dictionary.

---

## Internal Mechanics

### Index Range Scan with Composite Index
```sql
-- Query with cursor at (created_at='2026-05-15', id=500)
SELECT * FROM posts
WHERE (created_at, id) < ('2026-05-15', 500)
ORDER BY created_at DESC, id DESC
LIMIT 16;
```

Execution plan:
1. B-tree traversal to find the leaf node containing ('2026-05-15', 500)
2. Sequential backward scan from that position
3. Read 16 rows (or until the index/page boundary)
4. Perform 16 bookmark lookups to fetch row data

Cost: O(log N) for the initial lookup + O(1) for the range scan.

### Covering Index Optimization
```sql
CREATE INDEX idx_posts_covering ON posts(created_at DESC, id DESC, title, excerpt);
-- The index covers all selected columns
-- Eliminates bookmark lookups entirely
```

With a covering index, the query reads directly from the index pages without touching the table. This is the fastest possible cursor pagination execution.

### ORDER BY DESC vs ASC Performance
B-tree indexes are inherently bidirectional. Scanning forward (ASC) is equally efficient as scanning backward (DESC). However, the index must be created with the correct sort direction to avoid backward scans in some databases.

### PostgreSQL vs MySQL Internals
- PostgreSQL: Index scan with backward/forward direction. Full index-only scan support.
- MySQL (InnoDB): Similar behavior. No true index-only scans unless using covering indexes.
- SQLite: B-tree traversal, no special cursor optimization.

---

## Patterns

### Composite Index Design for Cursor Pagination
```php
// Given this query:
Post::orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15);

// Create this index (via migration):
Schema::table('posts', function (Blueprint $table) {
    $table->index(['created_at', 'id'], 'idx_posts_created_id');
});
```

### Performance Benchmarking Script
```php
$testPositions = [1, 100, 1000, 10000, 100000, 1000000];
foreach ($testPositions as $id) {
    $start = microtime(true);
    $posts = Post::where('id', '<', $id)
        ->orderBy('id', 'desc')
        ->limit(15)
        ->get();
    $elapsed = (microtime(true) - $start) * 1000;
    echo "Position $id: {$elapsed}ms\n";
}
```

### Monitoring Cursor Query Performance
```php
DB::listen(function ($query) {
    if (str_contains($query->sql, 'where (created_at, id) <')) {
        Log::channel('pagination')->info('Cursor query', [
            'bindings' => $query->bindings,
            'time' => $query->time,
        ]);
    }
});
```

---

## Architectural Decisions

### Index Design First
Before implementing cursor pagination, design the index. The index must match the `ORDER BY` clause exactly (columns and sort direction). Without the correct index, cursor pagination offers no performance benefit.

### Covering Index vs Table Lookups
For tables with many columns, a covering index increases index size (disk and memory) but eliminates table lookups. Use covering indexes when the pagination query selects a subset of columns. Use non-covering indexes when the query selects `*` or many columns.

### Composite Index Column Order
The leftmost column should be the primary sort column. If the query filters by `WHERE status = 'active'`, include `status` as the leading column:
```sql
CREATE INDEX idx_posts_status_created_id ON posts(status, created_at DESC, id DESC);
```

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| O(1) performance regardless of dataset depth | Requires specific composite index design | Additional index maintenance and disk space |
| Consistent response times across all pages | Index must match ORDER BY exactly | Cannot easily change sort order |
| No COUNT(*) overhead | No total count or last page available | Clients cannot render page selectors |
| Immune to deep-offset degradation | Cursor must be deterministic and stable | Changing sort values breaks pagination |

---

## Performance Considerations

### Benchmark: Offset vs Cursor (1M Rows)

| Page | Offset Time | Cursor Time |
|---|---|---|
| 1 | 2ms | 3ms |
| 100 | 15ms | 4ms |
| 10000 | 180ms | 4ms |
| 100000 | 2.1s | 5ms |
| 500000 | 10.5s | 4ms |

Cursor pagination maintains consistent ~4ms across all depths. Offset pagination degrades linearly.

### Composite Index Size
An index on `(created_at, id)` for 1M rows adds approximately:
- PostgreSQL: ~40MB
- MySQL InnoDB: ~50MB
- Additional disk and buffer pool pressure

### Read-Ahead and Buffer Pool
Cursor pagination benefits from sequential read-ahead because the range scan reads consecutive index pages. Offset pagination's scattered reads are less cache-friendly.

---

## Production Considerations

### Missing Index Detection
Monitor query performance for cursor pagination endpoints. If response times spike, check for missing or dropped indexes:
```sql
-- PostgreSQL: Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'posts';
```

### Index Maintenance
Rebuild indexes periodically to prevent bloat that slows cursor scans:
```sql
-- PostgreSQL
REINDEX INDEX idx_posts_created_at_id;

-- MySQL (optimize table rebuilds indexes)
OPTIMIZE TABLE posts;
```

### Query Plan Verification
Include the expected query plan in deployment checklists:
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM posts
WHERE (created_at, id) < ('2026-06-01', 15)
ORDER BY created_at DESC, id DESC
LIMIT 16;
-- Verify: Index Scan (not Seq Scan)
```

---

## Common Mistakes

### Using Cursor Pagination Without the Correct Index
Why it happens: Developers assume cursor pagination always performs well. Why it's harmful: Without a supporting composite index, the database falls back to a full table scan + sort, which is worse than offset pagination. Better approach: Always verify the execution plan includes an index range scan.

### Creating the Index in Wrong Column Order
Why it happens: Developers create `INDEX(created_at, id)` but the query uses `WHERE (id, created_at) < ...`. Why it's harmful: The index cannot be used for the composite WHERE clause. The database may use only the leading column. Better approach: Ensure the WHERE clause column order matches the index column order.

### Overlooking Covering Index Benefits
Why it happens: Developers create a minimal index and accept table lookups. Why it's harmful: Each page request requires 15+ random I/O operations for table lookups. Better approach: Include frequently selected columns in the index to enable index-only scans.

---

## Failure Modes

### Index Bloat Degradation
Over time, B-tree indexes accumulate dead tuples and page fragmentation. Cursor scans that were previously fast become slower. Mitigate with regular index maintenance.

### Order-By Column Selectivity Collapse
If many records share the same sort value (e.g., all posts created at the same second), the cursor's tiebreaker column becomes the effective sort. The range scan still performs well but must scan more rows to reach the LIMIT.

### Database-Specific Index Limitations
- MySQL: `DESC` indexes require explicit `DESC` keyword in index creation
- PostgreSQL: Sorts NULLS LAST/FIRST by default, affecting cursor construction
- SQLite: Limited index capabilities; may not use indexes for some cursor queries

---

## Ecosystem Usage

### Laravel
`cursorPaginate()` generates the underlying SQL using `forPageAfterId()` and `forPageBeforeId()` when sorting by primary key. For custom sorts, it constructs composite WHERE clauses.

### Stripe
Stripe's cursor pagination uses record IDs (`starting_after`). Its primary key is sequential, so cursor lookups are efficient. Stripe's response times remain consistent regardless of list position.

### YouTube Data API
Uses `pageToken` parameter with opaque cursor tokens. Response times are consistent across deep pages.

---

## Related Knowledge Units

### Prerequisites
- Cursor Pagination Design — Understanding cursor mechanics
- SQL Indexing Fundamentals — Composite indexes, range scans

### Related Topics
- Offset Pagination Performance — Comparative performance baseline
- Keyset Pagination Design — The SQL-only equivalent
- Multi-Column Cursor Pagination — Complex index designs

### Advanced Follow-up Topics
- Database Index Tuning — Advanced covering index strategies
- Query Plan Analysis — EXPLAIN and execution plan interpretation

---

## Research Notes

### Source Analysis
- PostgreSQL documentation: Index scans and LIMIT optimization
- Use the Index, Luke!: "Pagination done the PostgreSQL way" — Keyset pagination benchmarks
- Laravel source: `Illuminate/Database/Eloquent/Builder.php` — cursorPaginate SQL generation

### Key Insight
The performance difference between offset and cursor pagination is not marginal — it is architectural. A well-tuned cursor pagination query at position 10M takes 5ms, while an equivalent offset query takes 30+ seconds or times out. The index design is the single critical success factor.

### Version-Specific Notes
- Laravel 9+: `cursorPaginate()` available
- PostgreSQL 12+: Improved index-only scan performance
- MySQL 8.0+: Covering index scans improved in 8.0.18+
