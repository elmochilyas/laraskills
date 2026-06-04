# Anti-Patterns — Multi-Column Cursor Pagination

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Pagination Strategies |
| Knowledge Unit | Multi-Column Cursor Pagination |
| Difficulty | Advanced |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| 5+ Columns in Cursor | High | Low | Code review: cursor with 5+ sort columns |
| Dynamic Client-Specified Sort | Critical | Low | Code review: multi-column sort from user input without index |
| Ignoring NULL Handling | High | Medium | Code review: no explicit NULLS FIRST/LAST on nullable columns |
| Manual WHERE Construction Without Testing | High | Medium | Code review: hand-written nested OR chain not tested |
| Using Multi-Column Cursor Without Composite Index | Critical | Medium | Code review: multi-column orderBy without matching index migration |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Omitting the Tiebreaker Column | Multi-column sort without PK as final column | Non-deterministic page boundaries |
| Incorrect OR Chain Construction | Wrong operator direction in nested conditions | Missing records or wrong page |
| Index Column Order Doesn't Match ORDER BY | Index created without matching query order | Database cannot use composite index for range scan |

---

## Anti-Pattern Details

### AP-MCC-01: 5+ Columns in Cursor

**Description**: The cursor includes five or more sort columns to handle complex sorting requirements. Each additional column creates exponential complexity in the nested OR WHERE chain, grows the cursor payload size, bloats the composite index, and makes cursor debugging nearly impossible. A 6-column cursor requires a 6-level nested OR chain and a 6-column composite index.

**Root Cause**: Over-engineering. The developer adds every potentially sortable column to the cursor "just in case."

**Impact**:
- Cursor payload exceeds 300 characters (URL truncation risk)
- Composite index exceeds 100MB for moderate datasets
- Nested OR WHERE chain is unreadable and error-prone
- Index maintenance overhead for rarely-used sort combinations
- Write performance degradation from index maintenance

**Detection**:
- Code review: ORDER BY clause with 5+ columns
- Code review: cursor payload containing 5+ fields
- Database review: composite index with 5+ columns

**Solution**:
- Limit cursor sort columns to 3-4 maximum
- Use a single primary sort column with a tiebreaker
- Consider whether all columns are actually needed for deterministic ordering

**Example**:
```php
// BEFORE: 5+ columns in cursor
Post::orderBy('status')
    ->orderBy('category_id')
    ->orderBy('created_at')
    ->orderBy('priority')
    ->orderBy('id') // ❌ 5 columns — excessive
    ->cursorPaginate(15);

// AFTER: Focused 3-column cursor
Post::orderBy('status')
    ->orderBy('created_at', 'desc')
    ->orderBy('id', 'desc') // ✅ 3 columns — sufficient
    ->cursorPaginate(15);

// Index: CREATE INDEX idx_posts_status_created_id ON posts(status, created_at DESC, id DESC)
```

---

### AP-MCC-02: Dynamic Client-Specified Sort

**Description**: The client specifies the multi-column sort order dynamically via query parameters: `?sort[]=status&sort[]=created_at&dir[]=asc&dir[]=desc`. The server builds a multi-column ORDER BY from user input and attempts cursor pagination against it. Since a composite index can only match one predetermined column order, the cursor query almost never has a matching index — every request does a full table scan.

**Root Cause**: Misguided flexibility. The developer thinks clients should be able to sort by any combination of columns, not realizing this is incompatible with cursor pagination.

**Impact**:
- Every unique sort combination does a full table scan
- Cannot create indexes for all possible sort combinations (combinatorial explosion)
- Response time is unpredictable and degrades with dataset size
- Cursor becomes meaningless when sort changes between requests

**Detection**:
- Code review: `$request->input('sort')` or `$request->input('columns')` used in ORDER BY for cursor pagination
- Code review: no allowlist for sort columns
- Database review: no matching composite index for any client-specified sort

**Solution**:
- Use a fixed, predetermined sort order for cursor pagination
- If multiple sort options are needed, use offset pagination for non-default sorts
- Validate sort columns against a strict allowlist if dynamic sorting is unavoidable

**Example**:
```php
// BEFORE: Dynamic multi-column sort
$sorts = $request->input('sort', ['created_at']);
$directions = $request->input('dir', ['desc']);
$query = Post::query();
foreach ($sorts as $i => $column) {
    $query->orderBy($column, $directions[$i] ?? 'desc'); // ❌ no index match
}
$posts = $query->cursorPaginate(15);

// AFTER: Fixed sort for cursor; dynamic sort uses offset
if ($request->has('sort')) {
    // Dynamic sort → offset pagination
    $posts = $query->orderBy(...)->paginate(15);
} else {
    // Default sort → cursor pagination
    $posts = Post::orderBy('status', 'asc')
        ->orderBy('created_at', 'desc')
        ->orderBy('id', 'desc')
        ->cursorPaginate(15);
}
```

---

### AP-MCC-03: Ignoring NULL Handling

**Description**: The multi-column sort includes nullable columns, but the ORDER BY clause doesn't specify `NULLS FIRST` or `NULLS LAST`. Different databases handle NULL sorting differently: PostgreSQL defaults to `NULLS LAST` for ascending sort, MySQL defaults to `NULLS FIRST`. Records with NULL values in sort columns appear at unpredictable positions, and the cursor WHERE clause may include incorrect comparisons against NULL.

**Root Cause**: Assuming NULL behavior is the same across all environments. The developer tests only with non-NULL data.

**Impact**:
- NULL-valued records sort to different positions in development vs production
- Cursor comparisons against NULL produce incorrect results
- Records with NULL sort values may be skipped or duplicated across pages
- Database migration (e.g., MySQL → PostgreSQL) changes pagination behavior

**Detection**:
- Code review: ORDER BY on nullable columns without explicit `NULLS FIRST/LAST`
- Code review: cursor WHERE clause doesn't handle NULL in comparison operators
- Bug reports: records with empty sort values appearing in wrong positions

**Solution**:
- Always specify `NULLS FIRST` or `NULLS LAST` for nullable sort columns
- Document the NULL handling strategy in the API reference
- Test pagination with NULL-valued records in the sort columns

**Example**:
```php
// BEFORE: No NULL handling
Post::orderBy('published_at') // ❌ NULL behavior varies by database
    ->orderBy('id')
    ->cursorPaginate(15);

// AFTER: Explicit NULL handling
Post::orderByRaw('published_at IS NULL') // NULLs last for ascending
    ->orderBy('published_at')
    ->orderBy('id')
    ->cursorPaginate(15);

// Or using raw SQL:
// ORDER BY published_at ASC NULLS LAST, id ASC

// For descending:
// ORDER BY published_at DESC NULLS FIRST, id DESC
```

---

### AP-MCC-04: Manual WHERE Construction Without Testing

**Description**: The developer manually builds the nested OR WHERE clause for multi-column cursor pagination instead of using Laravel's `cursorPaginate()` or a tested library. The hand-written SQL — `WHERE (status > ?) OR (status = ? AND created_at < ?) OR (status = ? AND created_at = ? AND id < ?)` — is error-prone, with incorrect operators, wrong column ordering, or missing parentheses causing incorrect pagination results.

**Root Cause**: Not using framework features or assuming manual SQL is simpler than `cursorPaginate()`.

**Impact**:
- Incorrect operator direction (>, <) causes wrong records on each page
- Missing parentheses change operator precedence and produce wrong WHERE logic
- Adding or removing sort columns requires rewriting the entire chain
- Edge cases (single row, duplicate values) may produce incorrect results

**Detection**:
- Code review: raw SQL string building for cursor WHERE clause
- Code review: `DB::raw()` or string concatenation for cursor conditions
- Bug reports: paginated results contain wrong records or duplicates

**Solution**:
- Use Laravel's `cursorPaginate()` which handles multi-column WHERE construction
- If manual implementation is needed, extract to a `CursorBuilder` class with unit tests
- Test all edge cases: single row, duplicate values, first page, last page, empty results

**Example**:
```php
// BEFORE: Manual WHERE construction
$where = '';
foreach ($columns as $i => $column) {
    $op = $directions[$i] === 'desc' ? '<' : '>';
    $where .= "($column $op ?)";
    if ($i < count($columns) - 1) {
        $where .= ' OR ';
    }
} // ❌ fragile, error-prone, untested

// AFTER: Use Laravel's cursorPaginate()
$posts = Post::orderBy('status', 'asc')
    ->orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15); // ✅ framework handles WHERE construction

// If manual is required, use a tested builder:
class CursorBuilder
{
    public function buildWhere(array $columns, array $directions, array $values): string
    {
        // Tested, extracted logic
    }
}
```

---

### AP-MCC-05: Using Multi-Column Cursor Without Composite Index

**Description**: A multi-column cursor pagination query uses two or more sort columns without a corresponding composite index. The database must perform a full table scan + sort on every paginated request, with performance degrading proportionally to dataset size. For a 3-column cursor on a 1M-row table, every query may take seconds.

**Root Cause**: Assuming cursor pagination is inherently fast regardless of indexing. The developer focuses on the cursor logic but forgets the prerequisite index.

**Impact**:
- Full table scan on every paginated request
- Response time grows linearly with dataset size (O(N))
- 1M rows → pagination queries take 2-10 seconds
- Database CPU and I/O saturation from repetitive full scans

**Detection**:
- Code review: `cursorPaginate()` with 2+ `orderBy()` calls but no index migration
- Database review: `EXPLAIN ANALYZE` shows Seq Scan for cursor query
- Performance monitoring: pagination response times increase as table grows

**Solution**:
- Always create a composite index matching the ORDER BY columns before deploying multi-column cursor pagination
- Include the index migration in the same deployment
- Verify EXPLAIN ANALYZE shows Index Range Scan

**Example**:
```php
// Migration (included with code deployment):
public function up(): void
{
    DB::statement('CREATE INDEX idx_posts_status_created_id ON posts(status ASC, created_at DESC, id DESC)');
}

// Controller (deployed together):
$posts = Post::orderBy('status', 'asc')
    ->orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15); // ✅ uses idx_posts_status_created_id

// Verify: EXPLAIN SELECT * FROM posts ORDER BY status ASC, created_at DESC, id DESC LIMIT 16
// Output should show "Index Scan" or "Index Range Scan"
```
