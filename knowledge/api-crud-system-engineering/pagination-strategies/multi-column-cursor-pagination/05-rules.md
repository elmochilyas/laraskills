# Multi-Column Cursor Pagination — Phase 5 Rules

## Always Include the Primary Key as the Final Tiebreaker Column
---
## Category
Reliability | Design
---
## Rule
Always append the primary key as the last ORDER BY column in every multi-column cursor query, even if all sort columns appear unique.
---
## Reason
Even with high-cardinality primary sort columns (UUIDs, unique timestamps), theoretical collisions exist. The tiebreaker guarantees fully deterministic ordering at page boundaries, preventing duplicate or skipped records.
---
## Bad Example
```php
// Multi-column sort without tiebreaker — non-deterministic at boundaries
Post::orderBy('status', 'asc')->orderBy('created_at', 'desc')->cursorPaginate(15);
```
---
## Good Example
```php
// Primary key tiebreaker guarantees deterministic pagination
Post::orderBy('status', 'asc')
    ->orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15);
```
---
## Exceptions
When the combined sort columns form a UNIQUE composite constraint (e.g., `(user_id, post_id)`).
---
## Consequences Of Violation
Non-deterministic page boundaries; records appearing on multiple pages or skipped.
---

## Place Equality-Filter Columns Before Range/Sort Columns in the Index
---
## Category
Performance | Design
---
## Rule
Design composite indexes with equality-filter columns first, followed by sort columns in the ORDER BY direction.
---
## Reason
Database indexes work most efficiently when the leading index columns match equality filters. This narrows the scanned range first, then the sort columns operate on a smaller subset. Reversed order makes the index unusable for range scans.
---
## Bad Example
```sql
-- Sort columns first — index unusable for filtered cursor queries
CREATE INDEX idx_posts_created_status ON posts(created_at DESC, status ASC);
-- Query: WHERE status = 'published' ORDER BY created_at DESC, id DESC
-- status column is second in index — cannot narrow by status
```
---
## Good Example
```sql
-- Equality filter first, then sort columns
CREATE INDEX idx_posts_status_created_id ON posts(status ASC, created_at DESC, id DESC);
-- Query: WHERE status = 'published' ORDER BY created_at DESC, id DESC
-- Narrows by status first, then range-scans created_at + id
```
---
## Exceptions
When the query has no WHERE filters — sort columns are the leading index columns.
---
## Consequences Of Violation
Index cannot be used for range scans; full table scans on filtered cursor queries.
---

## Keep Composite Indexes to 3-4 Columns Maximum
---
## Category
Performance | Maintainability
---
## Rule
Limit composite indexes for cursor pagination to four columns maximum to avoid excessive index bloat and write overhead.
---
## Reason
Each additional index column increases B-tree depth, index size (60-100MB for 4 columns on 1M rows), and write cost on every INSERT/UPDATE/DELETE. Indexes with 5+ columns provide diminishing query returns at disproportionate cost.
---
## Bad Example
```sql
-- 7-column composite index — excessive bloat and write overhead
CREATE INDEX idx_posts_bloat ON posts(status, category, created_at, updated_at, user_id, title, id);
```
---
## Good Example
```sql
-- 3-column composite index — optimal balance
CREATE INDEX idx_posts_status_created_id ON posts(status, created_at DESC, id DESC);
```
---
## Exceptions
Covering indexes with INCLUDE columns (PostgreSQL) that don't affect index sort order or B-tree depth.
---
## Consequences Of Violation
Excessive disk usage; buffer pool pressure; slow write operations; index maintenance overhead.
---

## Use Row Constructor Syntax When Available
---
## Category
Maintainability | Performance
---
## Rule
Prefer row constructor syntax `(col1, col2) > (val1, val2)` over nested OR WHERE chains for databases that support it (PostgreSQL, MySQL 8.0+).
---
## Reason
Row constructor syntax produces cleaner, more readable queries and is optimized for composite index range scans. Nested OR chains are verbose, error-prone, and may not be optimally executed by all database engines.
---
## Bad Example
```sql
-- Nested OR WHERE chain — verbose and error-prone
WHERE status > 'published'
   OR (status = 'published' AND created_at < '2026-01-01')
   OR (status = 'published' AND created_at = '2026-01-01' AND id < 100)
```
---
## Good Example
```sql
-- Row constructor syntax — clean and optimized
WHERE (status, created_at, id) > ('published', '2026-01-01', 100)
```
---
## Exceptions
MySQL < 8.0 or databases that don't support row constructor comparison; fall back to nested OR chains.
---
## Consequences Of Violation
Verbose, error-prone SQL; potential suboptimal execution plans.
---

## Handle NULLs Explicitly With NULLS FIRST/LAST
---
## Category
Reliability
---
## Rule
Always specify NULLS FIRST or NULLS LAST explicitly in ORDER BY clauses for nullable sort columns, and handle accordingly in cursor construction.
---
## Reason
NULL comparison behavior varies by database: MySQL considers NULLs smaller than any value (NULLS FIRST for ASC), PostgreSQL defaults to NULLS LAST. Inconsistent handling produces wrong ordering across databases.
---
## Bad Example
```php
// NULL handling undefined — behavior varies by database
Post::orderBy('published_at', 'desc')->orderBy('id', 'desc')->cursorPaginate(15);
// MySQL: NULLs first; PostgreSQL: NULLs last
```
---
## Good Example
```php
// Explicit NULL handling — consistent across databases
Post::orderByRaw('published_at DESC NULLS LAST')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15);
```
---
## Exceptions
When the sort column is NOT NULL (no nulls possible).
---
## Consequences Of Violation
Inconsistent results across different database systems; records with NULLs sorted to unexpected positions.
---

## Never Support Dynamic Client-Specified Sort With Cursor Pagination
---
## Category
Performance | Design
---
## Rule
Never allow clients to specify arbitrary ORDER BY columns with cursor pagination; use a predetermined, index-supported sort order.
---
## Reason
A composite index can only match one column order and direction. Dynamic sorts would require indexes for every possible combination, which is impractical. Without a matching index, cursor queries fall back to full table scans.
---
## Bad Example
```php
// Dynamic client sort — impossible to index all combinations
$posts = Post::orderBy($request->sort_by, $request->sort_dir)
    ->orderBy('id', 'desc')
    ->cursorPaginate(15);
```
---
## Good Example
```php
// Predetermined sort with limited client options
$allowedSorts = ['created_at', 'updated_at'];
$sortBy = in_array($request->sort_by, $allowedSorts) ? $request->sort_by : 'created_at';

$posts = Post::orderBy($sortBy, 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15);
// Each allowed sort has its own composite index
```
---
## Exceptions
For datasets under 1000 records where full table scan performance is acceptable.
---
## Consequences Of Violation
Full table scans on every request; impossible to index; catastrophic performance degradation.
---

## Prefer Laravel's cursorPaginate() for Multi-Column Sorts
---
## Category
Framework Usage | Maintainability
---
## Rule
Use Laravel's built-in `cursorPaginate()` for multi-column cursor pagination before considering manual WHERE clause construction.
---
## Reason
`cursorPaginate()` handles cursor encoding, nested OR WHERE chain construction, LIMIT+1 has_more detection, and response formatting. Manual implementation duplicates thousands of lines of tested framework code.
---
## Bad Example
```php
// Manual multi-column cursor — error-prone and unnecessary
$cursor = $this->decodeCursor($request->cursor);
$posts = Post::where(function ($q) use ($cursor) {
    $q->where('status', '>', $cursor->status)
      ->orWhere(function ($q) use ($cursor) {
          $q->where('status', $cursor->status)
            ->where('created_at', '<', $cursor->created_at);
      })
      ->orWhere(function ($q) use ($cursor) {
          $q->where('status', $cursor->status)
            ->where('created_at', $cursor->created_at)
            ->where('id', '<', $cursor->id);
      });
})->orderBy('status', 'asc')->orderBy('created_at', 'desc')->orderBy('id', 'desc')->limit(16)->get();
```
---
## Good Example
```php
// Laravel handles everything
$posts = Post::orderBy('status', 'asc')
    ->orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15);
```
---
## Exceptions
Databases requiring row constructor syntax where Laravel's cursor doesn't use it; encrypted cursor requirements.
---
## Consequences Of Violation
Unnecessary code complexity; subtle pagination bugs; increased testing burden.
---

## Verify Composite Index Usage With EXPLAIN ANALYZE
---
## Category
Performance | Reliability
---
## Rule
Always verify with EXPLAIN ANALYZE that the composite index is used for an Index Range Scan (not Seq Scan) before deploying multi-column cursor pagination to production.
---
## Reason
Multi-column composite indexes are complex and error-prone. A mismatch in column order, direction, or NULL handling can cause the database to ignore the index entirely, resulting in full table scans.
---
## Bad Example
```php
// No EXPLAIN verification — silent full table scans
$posts = Post::orderBy('status', 'asc')
    ->orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15);
// Index expects created_at DESC but query has mixed direction?
```
---
## Good Example
```php
// EXPLAIN ANALYZE:
// EXPLAIN ANALYZE SELECT * FROM posts
//   WHERE (status, created_at, id) > ('published', '2026-01-01', 100)
//   ORDER BY status ASC, created_at DESC, id DESC LIMIT 16;
// Verify: "Index Range Scan" on idx_posts_status_created_id

$posts = Post::orderBy('status', 'asc')
    ->orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15);
```
---
## Exceptions
Development environments with too little data for reliable execution plans.
---
## Consequences Of Violation
Full table scans on production; 10-100x slower queries; timeout errors.
---

## Build a Reusable CursorBuilder for Manual Implementations
---
## Category
Maintainability | Code Organization
---
## Rule
When manual multi-column cursor implementation is required, build a reusable `CursorBuilder` class that constructs the nested OR WHERE chain from an array of column definitions.
---
## Reason
Manual multi-column WHERE chains are complex, repetitive, and error-prone. A builder pattern encapsulates the logic once, making it testable and reusable across all endpoints.
---
## Bad Example
```php
// Duplicated OR chain in every controller
public function index(Request $request) {
    $cursor = decode($request->cursor);
    Post::where(fn($q) => /* complex chain for 3 columns */)->get();
}

public function commentsIndex(Request $request) {
    $cursor = decode($request->cursor);
    Comment::where(fn($q) => /* same complex chain duplicated */)->get();
}
```
---
## Good Example
```php
class CursorBuilder {
    public function buildWhere(QueryBuilder $query, array $columns, object $cursor): void
    {
        // Generic OR chain construction from column definitions
        // [['col' => 'status', 'dir' => 'asc'], ['col' => 'created_at', 'dir' => 'desc']]
    }
}

// Use once, reuse everywhere
app(CursorBuilder::class)->buildWhere($query, $columns, $cursor);
```
---
## Exceptions
When using Laravel's `cursorPaginate()` — no manual builder needed.
---
## Consequences Of Violation
Duplicated complex logic; difficult maintenance; higher bug probability across endpoints.
