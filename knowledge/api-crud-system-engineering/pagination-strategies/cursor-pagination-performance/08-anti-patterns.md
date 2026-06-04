# Anti-Patterns — Cursor Pagination Performance

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Pagination Strategies |
| Knowledge Unit | Cursor Pagination Performance |
| Difficulty | Intermediate |
| Category | Performance Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Creating Indexes After Deploying Cursor Code | Critical | Medium | Code review: index migration not included in same deployment |
| Using Cursor With Arbitrary Client-Specified Sort | High | Medium | Code review: dynamic ORDER BY from user input |
| Adding Too Many Columns to Composite Index | Medium | Medium | Code review: composite index with 5+ columns |
| Not Testing With Production-Scale Data | Critical | High | Review: pagination tested only with <1000 rows |
| Overlooking Covering Index Benefits | Medium | High | Code review: SELECT * queries without covering index consideration |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Forgetting Index Maintenance | Never rebuilding indexes | Index bloat degrades cursor range scan performance over time |
| Wrong Index Column Order | Index column order doesn't match query WHERE clause | Index unusable for composite range scan; only leading column used |
| No Execution Plan Verification | Assuming cursor queries use index without checking | Seq Scan instead of Index Range Scan — slow queries |

---

## Anti-Pattern Details

### AP-CPP-01: Creating Indexes After Deploying Cursor Code

**Description**: Cursor pagination code is deployed to production, but the required composite index is created hours or days later via a separate migration. Between the code deployment and index creation, every cursor pagination query performs a full table scan. For any dataset larger than a few thousand records, this causes severe performance degradation and potential database timeouts.

**Root Cause**: Loose deployment coordination. The migration is scheduled separately from the code release, or the developer forgets to include the index migration.

**Impact**:
- 500 errors from query timeouts on large tables
- Database CPU spikes from full table scans on every paginated request
- Emergency rollback required if the index creation is delayed
- Angry users experiencing slow API responses

**Detection**:
- Code review: cursor pagination pull request adds code but no index migration
- Database review: cursor queries running without matching composite index
- Performance monitoring: query time spikes coinciding with cursor pagination deployment

**Solution**:
- Include the index migration in the same changeset as the cursor pagination code
- Create the index before or in the same deployment as the code
- Verify index existence as part of the deployment runbook

**Example**:
```php
// Code deployment MUST include this migration:
class AddCursorPaginationIndex extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE INDEX idx_posts_created_at_id ON posts(created_at DESC, id DESC)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX idx_posts_created_at_id');
    }
}

// Controller using cursor pagination (deployed together):
Post::orderBy('created_at', 'desc')->orderBy('id', 'desc')->cursorPaginate(15);
```

---

### AP-CPP-02: Using Cursor With Arbitrary Client-Specified Sort

**Description**: The client can specify any sort column and direction via query parameters (`?sort=title&direction=asc`), and the cursor pagination logic dynamically builds the ORDER BY from these parameters. Since a composite index can only match one predetermined column order, dynamic sorts mean the cursor query almost never has a matching index — every paginated request does a full table scan and sort.

**Root Cause**: Flexibility over performance. The developer wants to let clients sort by any column, not realizing cursor pagination requires a fixed index.

**Impact**:
- Every unique sort combination triggers a full table scan
- Database cannot cache or optimize for any particular sort order
- Response times vary wildly depending on the client's sort choice
- Indexing all possible sort combinations is impractical (combinatorial explosion)

**Detection**:
- Code review: `$request->input('sort')` passed to `orderBy()` in cursor pagination query
- Code review: no allowlist validation on sort parameters
- Database review: missing indexes for common sort combinations

**Solution**:
- Limit cursor pagination to a fixed, predetermined sort order
- If multiple sort options are needed, use offset pagination for non-default sorts
- Validate sort parameters against a strict allowlist
- Document that cursor pagination supports only the default sort

**Example**:
```php
// BEFORE: Dynamic sort with cursor
$sortColumn = $request->input('sort', 'created_at');
$sortDirection = $request->input('direction', 'desc');
$posts = Post::orderBy($sortColumn, $sortDirection) // ❌ no index match
    ->cursorPaginate(15);

// AFTER: Fixed sort for cursor pagination
$posts = Post::orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15); // ✅ uses idx_posts_created_at_id

// If client wants different sort, offer offset pagination instead:
if ($request->filled('sort')) {
    $posts = Post::orderBy($sortColumn, $sortDirection)->paginate(15); // offset for custom sorts
} else {
    $posts = Post::orderBy('created_at', 'desc')->orderBy('id', 'desc')->cursorPaginate(15); // cursor for default
}
```

---

### AP-CPP-03: Adding Too Many Columns to Composite Index

**Description**: The composite index for cursor pagination includes 5 or more columns to support complex sort orders or to serve double duty as a covering index. Large composite indexes bloat disk usage (100MB+ for 1M rows), slow down INSERT/UPDATE/DELETE operations, and increase buffer pool pressure. The cursor encoding also becomes larger with more columns.

**Root Cause**: Over-optimization. The developer adds all potentially useful columns to the index "just in case."

**Impact**:
- Index size grows to 100MB+ for 1M rows
- INSERT/UPDATE/DELETE performance degrades due to index maintenance
- Buffer pool has less space for hot data
- Cursor payload size increases with each added column
- Index maintenance (REINDEX) takes longer

**Detection**:
- Code review: composite index definition with 5+ columns
- Database review: index size-to-table-size ratio exceeds 50%
- Performance monitoring: write operations slowing down as index grows

**Solution**:
- Keep composite indexes to 3-4 columns maximum
- Use covering indexes only for frequently-queried columns
- Separate the pagination index from covering indexes

**Example**:
```php
// BEFORE: Too many columns in pagination index
// CREATE INDEX idx_posts_large ON posts(status, category_id, user_id, created_at DESC, id DESC, title)
// ❌ 6 columns — bloated, 100MB+ for 1M rows

// AFTER: Focused pagination index
// CREATE INDEX idx_posts_pagination ON posts(created_at DESC, id DESC)
// ✅ 2 columns — minimal, fast, efficient

// Separate covering index for queries that need it:
// CREATE INDEX idx_posts_covering ON posts(created_at DESC, id DESC, title, excerpt)
// ✅ only if these columns are frequently selected
```

---

### AP-CPP-04: Not Testing With Production-Scale Data

**Description**: Cursor pagination is tested with a local development dataset of 100-1000 records. Performance looks fine: all queries return in 2-5ms. In production with 10M records, the same queries time out because the index isn't working as expected, the execution plan shows a full table scan, or the buffer pool is too small. The 1000-row test never revealed these issues.

**Root Cause**: Testing at unrealistic scale. The developer assumes that if pagination is fast with 1000 rows, it will be fast with 10M rows.

**Impact**:
- Production degradation on launch day when real data is loaded
- Emergency index creation or query rewriting under pressure
- Performance doesn't match pre-launch benchmarks
- Users experience slow or timing-out pagination endpoints

**Detection**:
- Code review: no performance test with production-scale data volumes
- Test data review: test seeders create 100-1000 records
- Deployment review: no staging environment with realistic data volume

**Solution**:
- Test cursor pagination with at least 100K-1M records
- Verify EXPLAIN ANALYZE shows Index Range Scan at scale
- Load-test the pagination endpoint at production-scale data volumes
- Include pagination performance benchmarks in CI

**Example**:
```php
// Production-scale performance test:
public function test_cursor_pagination_performance(): void
{
    // Seed 100K records
    Post::factory()->count(100000)->create();

    $start = microtime(true);
    $response = $this->getJson('/api/posts?per_page=15');
    $duration = (microtime(true) - $start) * 1000;

    $this->assertLessThan(50, $duration, 'Paginated response should be <50ms at 100K records');

    // Also test deep pagination (position 90000):
    $cursor = $this->getDeepCursor();
    $start = microtime(true);
    $response = $this->getJson("/api/posts?cursor={$cursor}");
    $duration = (microtime(true) - $start) * 1000;
    $this->assertLessThan(100, $duration, 'Deep cursor pagination should be <100ms');
}
```

---

### AP-CPP-05: Overlooking Covering Index Benefits

**Description**: The cursor pagination query uses `SELECT *` or selects columns not included in the pagination index. For each row found via the index range scan, the database must perform a bookmark lookup (table row fetch by primary key) to retrieve the additional columns. For a page of 15 records, this requires 15 random I/O operations — significant compared to a covering index that eliminates all table lookups.

**Root Cause**: Not considering the cost of table lookups. The developer creates only the minimal index needed for the WHERE clause and ORDER BY.

**Impact**:
- Each paginated request requires 15+ random I/O operations for table lookups
- Response time doubles or triples compared to covering index usage
- Buffer pool must hold both index pages and data pages
- Performance degrades with larger column sizes (articles with long body text)

**Detection**:
- Code review: `SELECT *` in cursor pagination query
- Code review: index includes only ORDER BY columns, no selected columns
- Database review: EXPLAIN shows "Index Scan" (with table lookups) instead of "Index Only Scan"

**Solution**:
- Create covering indexes for frequently-queried pagination queries
- Select only needed columns instead of `SELECT *`
- Consider a `SELECT id, title, excerpt` instead of `SELECT *` to reduce table lookups

**Example**:
```php
// BEFORE: No covering index, SELECT *
$posts = Post::orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15); // ❌ SELECT * — 15 table lookups per page

// AFTER: Covering index with selected columns
// CREATE INDEX idx_posts_covering ON posts(created_at DESC, id DESC, title, excerpt)

$posts = Post::select(['id', 'title', 'excerpt', 'created_at']) // ✅ columns in covering index
    ->orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15); // ✅ Index Only Scan — no table lookups
```
