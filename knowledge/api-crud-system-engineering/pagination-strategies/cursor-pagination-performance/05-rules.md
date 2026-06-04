# Cursor Pagination Performance — Phase 5 Rules

## Verify Execution Plan Shows Index Range Scan
---
## Category
Performance
---
## Rule
Always verify with EXPLAIN ANALYZE that cursor-paginated queries use Index Range Scan (not Seq Scan or Index Scan with filter) before deploying to production.
---
## Reason
Cursor pagination's O(1) performance guarantee relies entirely on the database using an index range scan. Without it, the query performs a full table scan, often performing worse than offset pagination.
---
## Bad Example
```php
// Deploying cursor query without verification
$posts = Post::orderBy('created_at', 'desc')->cursorPaginate(15);
// No EXPLAIN ANALYZE — silently using Seq Scan in production
```
---
## Good Example
```php
// Before deployment: EXPLAIN ANALYZE confirms Index Range Scan
// EXPLAIN ANALYZE SELECT * FROM posts ORDER BY created_at DESC, id DESC LIMIT 16;
// Result: -> Index Range Scan using idx_posts_created_at_id (cost=...)

$posts = Post::orderBy('created_at', 'desc')->orderBy('id', 'desc')->cursorPaginate(15);
```
---
## Exceptions
Development environments with small datasets where Seq Scan is expected and production will use the index.
---
## Consequences Of Violation
Full table scans on every request; response times 10-100x slower than expected; user-facing timeout errors.
---

## Match Composite Index Column Order to Query Column Order Exactly
---
## Category
Performance | Design
---
## Rule
Design composite indexes so leading columns match the query's WHERE equality conditions, followed by ORDER BY columns in the same direction as the query.
---
## Reason
Composite indexes only optimize queries when their leading columns match the query's column order. A mismatch causes the index to be unusable for the range scan, falling back to full scan.
---
## Bad Example
```sql
-- Index column order doesn't match query
CREATE INDEX idx_posts_created_at_status ON posts(created_at, status);
-- Query: WHERE status = 'published' ORDER BY created_at DESC
-- Index cannot be used for this filter+sort combination
```
---
## Good Example
```sql
-- Equality filter column first, then sort columns
CREATE INDEX idx_posts_status_created_id ON posts(status, created_at DESC, id DESC);
-- Query: WHERE status = 'published' ORDER BY created_at DESC, id DESC
-- Perfect match — enables Index Range Scan
```
---
## Exceptions
When the query has no WHERE filters, the sort columns are the leading index columns.
---
## Consequences Of Violation
Unused indexes; full table scans; wasted disk space for unhelpful indexes.
---

## Use Covering Indexes for Frequently Queried Columns
---
## Category
Performance
---
## Rule
Include frequently selected columns in the composite index when the query selects a subset of columns.
---
## Reason
Covering indexes eliminate expensive table lookups (bookmark lookups) after the index scan. Each row's additional column fetch is a random I/O operation; a covering index converts those to sequential index page reads.
---
## Bad Example
```sql
-- Index doesn't cover selected columns; table lookups for every row
CREATE INDEX idx_posts_created_id ON posts(created_at DESC, id DESC);
-- Query: SELECT id, title, excerpt FROM posts ORDER BY created_at DESC, id DESC LIMIT 16
-- 16 table lookups per page
```
---
## Good Example
```sql
-- Covering index includes selected columns
CREATE INDEX idx_posts_covering ON posts(created_at DESC, id DESC) INCLUDE (title, excerpt);
-- Query: SELECT id, title, excerpt ... — index-only scan, no table lookups
```
---
## Exceptions
When SELECT * is required (too many columns to include) or when the index would become excessively large.
---
## Consequences Of Violation
Unnecessary random I/O; higher latency; buffer pool pressure from table lookups.
---

## Create Index Before Deploying Cursor Pagination Code
---
## Category
Reliability | Performance
---
## Rule
Always include the composite index migration in the same deployment as the cursor pagination code — never deploy cursor queries without their supporting index.
---
## Reason
Deploying cursor pagination code without the matching index causes immediate full table scans on every paginated request. Rollback requires either a deployment or manual index creation.
---
## Bad Example
```php
// Deploy 1: Cursor pagination code (no index)
// Deploy 2: Index migration (added later)
// Result: Performance degradation between deploys
```
---
## Good Example
```php
// Single deployment with both migration and code
Schema::table('posts', function (Blueprint $table) {
    $table->index(['created_at', 'id']);
});

// PostController uses cursorPaginate immediately
Post::orderBy('created_at', 'desc')->orderBy('id', 'desc')->cursorPaginate(15);
```
---
## Exceptions
When using a zero-downtime migration tool that requires separate deployments for schema changes.
---
## Consequences Of Violation
Production performance degradation; deployed code without working index; emergency hotfix required.
---

## Set Query Timeouts for Pagination Endpoints
---
## Category
Reliability | Security
---
## Rule
Configure database statement timeouts (e.g., 5000ms) on all cursor-paginated endpoints to prevent runaway queries.
---
## Reason
Even with proper indexes, unforeseen conditions (index bloat, table locks, hardware issues) can cause slow queries. A timeout prevents individual slow requests from exhausting database connection pools and degrading all endpoints.
---
## Bad Example
```php
// No query timeout — slow query blocks connection pool indefinitely
DB::connection()->setStatementTimeout(null);
$posts = Post::cursorPaginate(15);
```
---
## Good Example
```php
// Statement timeout prevents resource exhaustion
DB::connection()->setStatementTimeout(5000);
$posts = Post::orderBy('created_at', 'desc')->orderBy('id', 'desc')->cursorPaginate(15);
```
---
## Exceptions
Batch processing scripts that may require longer timeouts.
---
## Consequences Of Violation
Database connection pool exhaustion; cascading failures across all endpoints; application unavailability.
---

## Rebuild Indexes Periodically to Prevent Bloat
---
## Category
Maintainability | Performance
---
## Rule
Schedule periodic index maintenance (REINDEX for PostgreSQL, OPTIMIZE TABLE for MySQL) for tables with high write volume and cursor-paginated queries.
---
## Reason
Index bloat from dead tuples (PostgreSQL) or fragmented pages (MySQL) degrades cursor range scan performance over time. A bloated index traverses more pages per range scan, increasing response times.
---
## Bad Example
```php
// No index maintenance scheduled
// Over 6 months, index grows 50% from dead tuples
// Cursor queries degrade from 4ms to 40ms
```
---
## Good Example
```php
// Scheduled maintenance in scheduler
// $schedule->command('indexes:rebuild')->weekly();

// Or database-level maintenance
// PostgreSQL: REINDEX INDEX CONCURRENTLY idx_posts_created_at_id;
// MySQL: OPTIMIZE TABLE posts;
```
---
## Exceptions
Read-only tables or append-only tables where index bloat is minimal.
---
## Consequences Of Violation
Gradual performance degradation; unpredictable response times; eventual timeouts.
---

## Monitor Index Usage and Cursor Query Performance
---
## Category
Maintainability
---
## Rule
Monitor index usage (`pg_stat_user_indexes` in PostgreSQL, `index_stats` in MySQL) and cursor query timing (via `DB::listen()`) to detect degradation early.
---
## Reason
Unused indexes waste disk and buffer pool; degraded cursor queries may indicate index issues, schema drift, or data growth requiring index redesign.
---
## Bad Example
```php
// No monitoring — performance degrades silently until users report issues
$posts = Post::cursorPaginate(15);
```
---
## Good Example
```php
DB::listen(function ($query) {
    if (str_contains($query->sql, 'cursorPaginate')) {
        Log::info('Cursor query timing', [
            'time' => $query->time,
            'sql' => $query->sql,
        ]);
        if ($query->time > 500) {
            Log::warning('Slow cursor pagination query', ['sql' => $query->sql]);
        }
    }
});
```
---
## Exceptions
Low-traffic internal tools where monitoring overhead exceeds value.
---
## Consequences Of Violation
Silent performance degradation; late detection of index issues; reactive (not proactive) maintenance.
---

## Benchmark with Production-Scale Data Before Signing Off
---
## Category
Performance | Reliability
---
## Rule
Always performance-test cursor-paginated endpoints with datasets matching or exceeding expected production volume before approving for production.
---
## Reason
Cursor pagination performance characteristics at 100 rows are identical for all approaches; differences only emerge at 100K-10M rows. Testing with small data gives false confidence.
---
## Bad Example
```php
// Testing with 100 rows — all strategies perform at 2ms
// Production has 10M rows — cursor pagination without proper index times out
```
---
## Good Example
```php
// Performance test script:
for ($i = 0; $i < 100; $i++) {
    $start = microtime(true);
    $response = $this->get('/api/posts?cursor=' . $cursors[$i]);
    $duration = (microtime(true) - $start) * 1000;
    assert($duration < 50, "Cursor page $i took {$duration}ms");
}
```
---
## Exceptions
Proof-of-concept or prototype endpoints before production scaling is determined.
---
## Consequences Of Violation
Production performance surprises; missed index requirements; emergency performance hotfixes.
