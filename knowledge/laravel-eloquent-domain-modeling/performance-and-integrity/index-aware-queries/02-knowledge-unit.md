# Index-Aware Queries — Leveraging Database Indexes

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Performance & Data Integrity
- **Knowledge Unit:** Index-Aware Queries
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Index-aware query writing is the practice of structuring Eloquent queries so that the database can efficiently leverage indexes. An index that covers the query's WHERE, ORDER BY, and selected columns allows the database to answer the query entirely from the index (a "covering index") without touching table rows. Writing index-aware queries requires understanding how Eloquent generates SQL and how the MySQL/PostgreSQL query planner uses indexes. This knowledge transforms query optimization from a reactive (add an index after it's slow) to a proactive discipline.

---

## Core Concepts

- **Index structure:** B-tree indexes store column values sorted. Equality lookups (`WHERE id = ?`) are O(log n). Range lookups (`WHERE created_at > ?`) use the sorted structure but may scan more entries.
- **Composite index column order:** `INDEX(column_a, column_b)` can efficiently filter by `column_a` alone, `column_a` AND `column_b`, or `column_a` AND `column_b` AND `column_c`. It cannot efficiently filter by `column_b` alone — the leftmost prefix rule applies.
- **Covering index:** An index that contains all columns referenced in the query (SELECT, WHERE, ORDER BY, JOIN). The database reads only the index, not the table rows.
- **`EXPLAIN` / `EXPLAIN ANALYZE`:** The primary tool for verifying index usage. `type: ref` or `type: range` with `Extra: Using index` indicates efficient index usage. `type: ALL` indicates a full table scan.
- **Index cardinality:** The uniqueness of values in an indexed column. High cardinality (many unique values) makes the index more selective. Low cardinality (boolean columns) may not benefit from a standalone index.
- **Index hints:** `from('table_name')->useIndex('index_name')` — force specific index usage (MySQL). Rarely needed but useful for query planner edge cases.

---

## Mental Models

### The Library Card Catalog Metaphor
A database index is a library card catalog. Finding a book by title using the catalog is O(log n). Finding a book by flipping through every shelf is O(n). A composite index is like a catalog sorted by (author, title) — finding books by a specific author is fast, but finding books with a specific title is not.

### The Rubik's Cube Metaphor
Indexes are like organizing a Rubik's cube — each index solves a specific access pattern, but adding more indexes increases storage and write overhead. The goal is to find the minimal set of indexes that covers all query patterns, not to index every column individually.

---

## Internal Mechanics

- The query planner estimates the cost of each possible execution plan. An available index reduces the estimated cost. The planner selects the cheapest plan.
- For `WHERE` clauses, the planner looks for indexes on the filtered columns. It compares the selectivity (estimated rows matching) to decide whether to use the index or scan the table.
- For `ORDER BY`, if an index matches the sort order, the database avoids a filesort (MySQL) or explicit sort (PostgreSQL).
- `GROUP BY` is handled similarly — if a grouped column is the leading column of an index, the database can group without sorting.
- The Eloquent query builder generates SQL that the planner evaluates. Index-aware query writing means writing queries that the planner can optimize using existing or planned indexes.

---

## Patterns

- **Index-first query design:** Before writing a query, decide which index(es) should serve it. Design the query's WHERE, ORDER BY, and SELECT clauses to match the index.
- **Composite index for common filter combinations:**
```php
// Matches INDEX(status, created_at)
Post::where('status', 'published')
    ->where('created_at', '>', now()->subDays(7))
    ->orderBy('created_at')
    ->get();
```
- **Covering index for frequent queries:**
```php
// Matches INDEX(status, created_at) if only selecting id, status, created_at
Post::select('id', 'status', 'created_at')
    ->where('status', 'published')
    ->orderBy('created_at')
    ->get();
```
- **Index hints for edge cases:**
```php
DB::table('orders')
    ->select(['id', 'total', 'status'])
    ->useIndex('orders_status_total_index')
    ->where('status', 'completed')
    ->get();
```
- **WhereHas with indexed subquery:**
```php
// Ensure comments.user_id and comments.created_at are indexed
User::whereHas('comments', fn($q) => $q->where('created_at', '>', $date));
```

---

## Architectural Decisions

- **Index strategy is part of schema design:** Indexes should be designed in parallel with query patterns, not added reactively. Before creating a migration, identify the top 5 query patterns and design indexes for them.
- **Fewer, broader indexes vs. many narrow indexes:** A single composite index on `(status, created_at)` covers queries filtering by status, status+date, or status+date+ordering. Two single-column indexes cover individual column lookups but not combined filters efficiently. Prefer composite indexes for combined filters.
- **MySQL vs PostgreSQL index behavior:** MySQL InnoDB uses clustered primary key indexes. Secondary indexes include the primary key value implicitly. PostgreSQL uses heap storage; indexes are separate structures. These differences affect index design strategy.
- **Index maintenance overhead:** Each index slows INSERT/UPDATE/DELETE by the cost of updating the index B-tree. For write-heavy tables, minimize index count. For read-heavy tables, optimize for query performance.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Faster queries (10-100x) | Slower writes (index maintenance) | Balance index count for read/write ratio |
| Covering index avoids table access | Index storage space (disk + memory) | Monitor index size relative to table size |
| Composite index covers multiple filters | Leftmost prefix limitation | Order columns by selectivity (most selective first) |
| ORDER BY from index avoids filesort | Additional complexity in query design | Document index expectations in code comments |
| `useIndex()` hint for planner tuning | Hard-coded index name ties to specific environment | Use only as last resort; monitor for index name changes |

---

## Performance Considerations

- A covering index can be 10-100x faster than a full table scan for large tables because it reads only from the index (in memory, likely cached) rather than from disk pages.
- Composite indexes are most effective when the leading column is highly selective. For `INDEX(status, created_at)`, queries filtering by status alone use the index. Queries filtering by `created_at` alone do not.
- Range conditions (`>`, `<`, `BETWEEN`) only use the index up to the first range column. After a range condition, subsequent index columns are not used for filtering (they are still used for sorting if the order matches).
- `ORDER BY` with mixed ASC/DESC directions can prevent index usage. MySQL 8+ supports descending indexes; PostgreSQL has long supported them.
- Eloquent's `whereHas()` generates a correlated subquery. The subquery's WHERE clause must be indexed: `WHERE EXISTS (SELECT 1 FROM comments WHERE comments.user_id = users.id)`. Index `comments.user_id`.

---

## Production Considerations

- **Monitor for missing indexes:** MySQL's slow query log, `SHOW INDEX FROM table`, and `EXPLAIN` on frequent queries. Tools like `pt-query-digest` (Percona) identify query patterns lacking index support.
- **Index maintenance:** Rebuild fragmented indexes periodically (MySQL: `OPTIMIZE TABLE`, PostgreSQL: `REINDEX`). Monitor index size growth.
- **Indexing for polymorphic relationships:** `morphs()` creates indexes on `(morph_type, morph_id)`. The type column is low cardinality; consider `INDEX(morph_id, morph_type)` if queries filter by ID more often.
- **CI index validation:** In test suites, run `EXPLAIN` on critical queries and assert `type` is not `ALL`. This catches query changes that break index usage.
- **Read replicas:** Index design on read replicas can differ from the primary. If a query is read-only, it may benefit from additional indexes on the replica that are not on the primary.

---

## Common Mistakes

- **Indexing every column individually:** Each single-column index only helps queries filtering by that single column. Combined filters (`WHERE status AND created_at`) need a composite index. Individual indexes do not combine efficiently in most databases.
- **Ignoring index for ORDER BY:** `ORDER BY created_at` on a table with 1M rows causes a filesort unless the index matches the sort order. Add `created_at` to the index used for filtering.
- **Over-indexing:** Adding too many indexes slows writes and increases storage. Each index must be maintained on every INSERT/UPDATE/DELETE. For a table with 10 indexes, a single INSERT updates 11 structures.
- **Not including the foreign key in constrained eager load selects:** `with(['comments' => fn($q) => $q->select('body')])` — without `id` and `post_id`, the matching fails. But including `id` and `post_id` in a covering index means you must index those columns too.
- **Assuming index usage without verifying:** `EXPLAIN` the query to confirm index usage. The query planner may choose a full table scan if the table is small, the index has low selectivity, or the query has conditions that prevent index usage.

---

## Failure Modes

- **Full table scan on unindexed column:** The most common production performance issue. A query filters by an unindexed column on a large table, scanning millions of rows. Detectable via slow query log.
- **Index not used due to data type mismatch:** `WHERE user_id = 'string'` on an integer column prevents index usage. Eloquent generally handles casting, but raw `whereRaw()` or `where()` with mismatched types can break index usage.
- **Index corruption:** Rare but catastrophic. Rebuild the index or restore from backup. Monitor `CHECK TABLE` / `ANALYZE` output.
- **Wrong index chosen by planner:** The query planner selects a suboptimal index. Use `useIndex()` or `forceIndex()` to override. Investigate if statistics are stale (`ANALYZE TABLE`).
- **Index overhead on write-heavy table:** A table with 15 indexes taking 10,000 writes/second may spend more CPU time updating indexes than processing data. Monitor `Handler_commit` and `Innodb_rows_updated` metrics.

---

## Ecosystem Usage

- **Laravel Nova:** Index and detail views generate queries that benefit from indexes on `created_at`, `id`, and commonly filtered columns.
- **Laravel Scout:** Search indexes are separate from database indexes. Scout's `where()` constraints apply to the search engine, not the database.
- **Laravel Telescope:** The Telescope database tables (monitor_*) have pre-designed indexes for the query patterns Telescope generates.
- **Spatie Laravel Permission:** The `model_has_roles` table uses a composite primary key on `(role_id, model_id, model_type)` — an intentional index for the common query patterns.

---

## Related Knowledge Units

### Prerequisites
- Database index fundamentals (B-tree, composite, covering)
- `EXPLAIN` query plan reading

### Related Topics
- `select-constraints` (covering index design)
- `subquery-optimization` (indexing correlated subqueries)
- `database-constraints` (unique indexes, foreign key indexes)

### Advanced Follow-up Topics
- Partial indexes (PostgreSQL) and functional indexes
- Index merge operations (MySQL index_merge optimization)
- Performance schema and sys schema for index analysis

---

## Research Notes

### Source Analysis
Indexing is a database-level concern, not an Eloquent feature. `Illuminate\Database\Schema\Blueprint::index()` creates indexes in migrations. The query builder interacts with indexes implicitly via the SQL it generates — it has no explicit index-aware logic.

### Key Insight
The most impactful performance optimization for Eloquent applications is correct index design, not code changes. A well-designed index turns a 10-second query into a 10-millisecond query. The second most impactful change is writing queries that match the designed indexes — which requires understanding how Eloquent translates to SQL.

### Version-Specific Notes
- Laravel 8+: `useIndex()` and `forceIndex()` query builder methods for MySQL index hints.
- Laravel 9+: Improved query builder support for index hints across database drivers.
- MySQL 8.0+: Descending indexes, invisible indexes, and functional indexes.
- PostgreSQL: Partial indexes (`WHERE deleted_at IS NULL`), covering indexes with `INCLUDE`.
