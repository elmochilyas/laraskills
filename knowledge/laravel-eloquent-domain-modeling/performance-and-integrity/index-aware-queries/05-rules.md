## Design Indexes in Parallel with Query Patterns
---
## Category
Performance
---
## Rule
Design database indexes for the top query patterns before writing the migration, not after a production incident.
---
## Reason
Reactive indexing means users experienced slow queries before the fix. Proactive index design — identifying the WHERE, ORDER BY, and JOIN columns for each query pattern — prevents the performance incident entirely. Index design should be a standard step in feature development, not a post-hoc optimization.
---
## Bad Example
```php
// Migration created without considering queries
Schema::table('posts', function ($table) {
    $table->string('status');
    $table->timestamp('published_at');
});
// Production incident: "posts index is slow"
// Then: $table->index(['status', 'published_at']);
```
---
## Good Example
```php
// Before writing migration, identify:
// Query: Post::where('status', 'published')->where('published_at', '<', now())->orderBy('published_at')
// Design: index(['status', 'published_at'])
Schema::table('posts', function ($table) {
    $table->string('status');
    $table->timestamp('published_at');
    $table->index(['status', 'published_at']);
});
```
---
## Exceptions
Exploratory features where query patterns are unknown until usage data is collected. Add indexes in a follow-up migration after analyzing actual queries.
---
## Consequences Of Violation
Production incidents from slow queries. Emergency index-altering migrations require careful execution (locking on live tables) and cause downtime or performance degradation during the migration.
---
## Order Composite Index Columns by Selectivity
---
## Category
Performance
---
## Rule
In composite indexes, place the most selective (most unique values) column first.
---
## Reason
The leftmost prefix rule means a composite index `INDEX(a, b)` efficiently filters by `a` alone, but not by `b` alone. Placing the most selective column first maximizes the index's usefulness for the broadest set of queries. Less selective columns first make the index useless for many query patterns.
---
## Bad Example
```php
// INDEX(status, email) — status has 3 values, email is unique
User::where('email', 'user@example.com')->first();
// Cannot use the index efficiently — email is second column
```
---
## Good Example
```php
// INDEX(email, status) — email is highly selective
User::where('email', 'user@example.com')->first();
// Uses index — email is the first column
```
---
## Exceptions
Queries that always filter by both columns equally. If every query uses `WHERE a AND b`, the order matters less.
---
## Consequences Of Violation
Index bloat without query benefit. The index consumes disk space and write overhead but is not used for the most common query patterns. Developers may add more indexes, compounding the problem.
---
## Use Covering Indexes for Frequent Queries
---
## Category
Performance
---
## Rule
Design indexes that cover all columns in frequent queries (SELECT, WHERE, ORDER BY, JOIN) to enable index-only scans.
---
## Reason
A covering index contains every column the query needs. The database reads only the index (typically cached in memory) without touching table rows. This is 10-100x faster than a full table scan and significantly faster than a non-covering index that requires table lookups.
---
## Bad Example
```php
// Query: select id, status, created_at where status = ? order by created_at
// Index: INDEX(status) — not covering
Post::select('id', 'status', 'created_at')
    ->where('status', 'published')
    ->orderBy('created_at')
    ->get();
// Reads index to find rows, then table lookups for created_at
```
---
## Good Example
```php
// Query: select id, status, created_at where status = ? order by created_at
// Index: INDEX(status, created_at, id) — covering all columns
Post::select('id', 'status', 'created_at')
    ->where('status', 'published')
    ->orderBy('created_at')
    ->get();
// Reads only the index — no table access
```
---
## Exceptions
Write-heavy tables — each covering index adds write overhead. For infrequent queries, the index may not be worth the cost.
---
## Consequences Of Violation
Table access for every row even when the index is used. For queries returning many rows, the difference between a covering and non-covering index is the difference between milliseconds and seconds.
---
## Verify Index Usage with EXPLAIN
---
## Category
Testing
---
## Rule
Run `EXPLAIN` on every new query pattern before deploying to production and assert that `type` is not `ALL`.
---
## Reason
The query planner may choose a full table scan even when an index exists — due to low selectivity, table size, or query conditions. Assuming an index is used without verification is a common cause of production performance surprises. `EXPLAIN` provides definitive proof.
---
## Bad Example
```php
// Added INDEX(status) but never verified
Post::where('status', '!=', 'archived')->get();
// EXPLAIN shows type: ALL — the != operator prevents index usage
// Full table scan on every call
```
---
## Good Example
```php
// Verify with EXPLAIN:
// EXPLAIN SELECT * FROM posts WHERE status != 'archived'
// type: ALL — redesign needed
// Better query:
Post::whereIn('status', ['draft', 'published'])->get();
// EXPLAIN shows type: range — index used
```
---
## Exceptions
Trivial queries on tables with < 1000 rows where full table scans are acceptable and measured.
---
## Consequences Of Violation
Silent performance degradation. Queries that were fast at 10k rows become slow at 100k rows. The team discovers the issue during a production incident, not during development.
---
## Prefer Composite Indexes Over Many Single-Column Indexes
---
## Category
Performance
---
## Rule
Design composite indexes for combined filter patterns rather than adding a standalone index on every column.
---
## Reason
Databases generally use at most one index per table per query for filtering. Single-column indexes on `a`, `b`, and `c` do not efficiently support `WHERE a = ? AND b = ?` — the database picks one index and scans. A composite index `INDEX(a, b)` supports both `WHERE a = ?` and `WHERE a AND b` efficiently.
---
## Bad Example
```php
$table->index('status');
$table->index('created_at');
$table->index('category_id');
// Query: WHERE status=? AND created_at>?
// Only one index used — the other column requires a scan
```
---
## Good Example
```php
$table->index(['status', 'created_at']);
$table->index('category_id');
// Composite index supports combined filter efficiently
```
---
## Exceptions
Columns queried only in isolation (never combined with other filters). A standalone index is correct for columns that appear only in single-column WHERE clauses.
---
## Consequences Of Violation
Index bloat — 10 indexes on a table where 3 composite indexes would suffice. Each INSERT/UPDATE now maintains 10 index structures instead of 3, slowing write throughput while adding unused index maintenance overhead.
