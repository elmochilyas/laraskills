# Anti-Patterns — Cursor Pagination Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Pagination Strategies |
| Knowledge Unit | Cursor Pagination Design |
| Difficulty | Intermediate |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Exposing Both page and cursor Parameters | High | Medium | API review: both `page` and `cursor` accepted on same endpoint |
| Including Sensitive Data in Plaintext Cursors | Critical | Medium | Code review: PII in base64-encoded cursor |
| Changing Sort Order Without Invalidating Cursors | High | Low | Code review: cursor used after sort configuration changed |
| Using Cursor Pagination Without Supporting Index | Critical | High | Code review: cursor query without matching composite index |
| No Tiebreaker Column in Sort | High | High | Code review: ORDER BY single non-unique column |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Not Handling Cursor Decode Failures | Assuming cursors are always valid | Malformed cursors cause 500 errors instead of 400 |
| Making Cursors Predictable/Enumerable | Sequential values allow data enumeration | Attackers can paginate through all records |
| Including total or last_page in Cursor Response | Cannot compute without expensive COUNT | Wasted query cost; defeats cursor purpose |

---

## Anti-Pattern Details

### AP-CPD-01: Exposing Both page and cursor Parameters

**Description**: The endpoint accepts both `page` (offset pagination) and `cursor` (cursor pagination) parameters. Clients can choose either, and some may use `page=5` with offset logic while others use `cursor=abc`. This dual-exposure defeats cursor consistency because clients using `page` bypass the cursor's phantom-read protection. The API contract is ambiguous — clients don't know which parameter is canonical.

**Root Cause**: Migration or hybrid implementation without removing the old parameter. The developer adds cursor support but keeps the old page parameter for backward compatibility.

**Impact**:
- Clients using `page` experience phantom reads (duplicates/skipped records)
- Database must support both pagination strategies — two code paths to maintain
- Response format may differ between the two strategies (total/last_page vs has_more)
- New clients don't know which parameter to use

**Detection**:
- API review: endpoint documents both `page` and `cursor` parameters
- Code review: controller checks `if ($request->has('cursor'))` → cursor path, else → offset path
- Integration tests: both parameter sets accepted on the same endpoint

**Solution**:
- Expose only cursor-based parameters on cursor-paginated endpoints
- If backward compatibility is needed, use a versioned endpoint (V1: page, V2: cursor)
- Document a clear deprecation path for the page parameter if it must coexist temporarily

**Example**:
```php
// BEFORE: Both page and cursor exposed
public function index(IndexPostsRequest $request): JsonResponse
{
    if ($request->has('cursor')) {
        return $this->cursorResponse($request); // cursor path
    }
    return $this->offsetResponse($request); // offset path — ❌ bypasses cursor consistency
}

// AFTER: Cursor-only
public function index(IndexPostsRequest $request): JsonResponse
{
    $posts = Post::orderBy('created_at', 'desc')->orderBy('id', 'desc')
        ->cursorPaginate($request->validated('per_page', 15));

    return response()->json([
        'data' => PostResource::collection($posts),
        'meta' => [
            'next_cursor' => $posts->nextCursor()?->encode(),
            'prev_cursor' => $posts->previousCursor()?->encode(),
            'has_more' => $posts->hasMorePages(),
        ],
    ]);
}
```

---

### AP-CPD-02: Including Sensitive Data in Plaintext Cursors

**Description**: The cursor payload includes sensitive information — user IDs, email addresses, roles, or internal identifiers — encoded in plain base64. Since base64 is not encryption, any client can decode the cursor and read its contents. If the cursor is logged, the sensitive data appears in plaintext in log files.

**Root Cause**: Convenience. The developer includes all available column values in the cursor without considering which ones are sensitive.

**Impact**:
- User email addresses, roles, or internal IDs exposed to clients
- Log files contain decodable sensitive cursor data
- PCI/HIPAA/GDPR compliance violation for exposed PII
- Attackers can decode cursors to learn internal record structures

**Detection**:
- Code review: `base64_encode(json_encode($post->toArray()))` — entire record in cursor
- Code review: cursor payload includes `email`, `role`, `phone`, or similar fields
- Log review: decoded cursor values visible in application logs

**Solution**:
- Encode only the sort column values needed for the WHERE clause
- Never include sensitive fields (email, role, phone, internal IDs) in cursor payload
- If sensitive data must be in the cursor, encrypt it rather than base64-encoding

**Example**:
```php
// BEFORE: Entire record in cursor
$cursor = base64_encode(json_encode($post->toArray())); // ❌ includes all columns

// AFTER: Only sort columns
$cursor = base64_encode(json_encode([
    'v' => 1,
    'id' => $post->id,
    'created_at' => $post->created_at->toISOString(),
])); // ✅ minimal, non-sensitive fields
```

---

### AP-CPD-03: Changing Sort Order Without Invalidating Cursors

**Description**: The API changes its default sort order (e.g., from `created_at ASC` to `created_at DESC`, or from `updated_at` to `title`) while clients still hold cursors generated under the old sort order. When a client uses an old cursor with the new sort order, the WHERE clause from the old cursor produces incorrect results — wrong records, wrong ordering, or empty pages.

**Root Cause**: Configuration change without considering existing in-flight cursors. The sort order is updated in the code with no cursor invalidation mechanism.

**Impact**:
- Clients using cached cursors get incorrect pagination results
- Records may be skipped or duplicated depending on the sort change
- Silent data corruption: no error is thrown, just wrong results
- Debugging is difficult because the issue only affects clients with stale cursors

**Detection**:
- Code review: sort order changed in code without cursor version check
- Bug reports: "pagination returning wrong records after the latest deploy"
- Support tickets: inconsistent pagination results across devices

**Solution**:
- Include the sort configuration version or hash in the cursor payload
- When sort order changes, increment the cursor version to invalidate old cursors
- Document that sort order changes will invalidate in-flight cursors

**Example**:
```php
// BEFORE: Sort change invalidates cursors silently
// Cursor contains: { "id": 15, "created_at": "2026-06-01" }
// Sort changes from created_at ASC to title ASC
// Old cursor WHERE: (created_at, id) > ('2026-06-01', 15) — wrong under new sort

// AFTER: Versioned cursor that detects sort changes
const CURSOR_SORT_VERSION = 2;

$cursor = base64_encode(json_encode([
    'v' => CURSOR_SORT_VERSION, // ✅ version changes when sort changes
    'id' => $post->id,
    'created_at' => $post->created_at->toISOString(),
]));

public function decode(string $cursor): array
{
    $data = json_decode(base64_decode($cursor), true);
    if (($data['v'] ?? 0) !== CURSOR_SORT_VERSION) {
        throw new InvalidCursorException('Cursor expired due to sort order change. Please re-request.');
    }
    return $data;
}
```

---

### AP-CPD-04: Using Cursor Pagination Without Supporting Index

**Description**: Cursor pagination is implemented without creating the required composite index on the ORDER BY columns. Without the index, the database falls back to a full table scan + sort for every paginated request. At any significant dataset size (>10K records), cursor pagination without an index performs worse than offset pagination because it must scan and sort the entire table to find the cursor position.

**Root Cause**: Assuming cursor pagination is inherently fast. The developer implements cursor pagination but forgets (or doesn't know) to create the matching index.

**Impact**:
- Full table scan on every paginated request
- Performance degrades with dataset size (O(N)), worse than offset for deep pages
- Response times spike from 5ms to 500ms+ on moderate datasets
- Database CPU and I/O increase dramatically

**Detection**:
- Code review: `cursorPaginate()` or `forPageAfterId()` without corresponding index migration
- Database review: `EXPLAIN ANALYZE` shows Seq Scan instead of Index Range Scan
- Performance monitoring: pagination response times degrade as table grows

**Solution**:
- Create the composite index matching the ORDER BY columns before deploying cursor pagination
- Verify the execution plan shows Index Range Scan
- Include the index migration in the same deployment as the cursor pagination code

**Example**:
```php
// BEFORE: Cursor pagination without index
public function index(Request $request): JsonResponse
{
    $posts = Post::orderBy('created_at', 'desc')
        ->orderBy('id', 'desc')
        ->cursorPaginate(15); // ❌ no matching index — full table scan
}

// AFTER: With matching index
// Migration:
// CREATE INDEX idx_posts_created_at_id ON posts(created_at DESC, id DESC)

// Controller:
public function index(Request $request): JsonResponse
{
    $posts = Post::orderBy('created_at', 'desc')
        ->orderBy('id', 'desc')
        ->cursorPaginate(15); // ✅ uses index — Index Range Scan
}
```

---

### AP-CPD-05: No Tiebreaker Column in Sort

**Description**: The ORDER BY clause includes only a single non-unique column like `created_at`. When multiple records share the same timestamp, the sort order between them is non-deterministic. Records may appear on two different pages (duplicated) or be skipped entirely across page boundaries. The cursor's WHERE clause cannot uniquely identify the boundary record.

**Root Cause**: Assuming the sort column is effectively unique. The developer has never seen two records with the same timestamp during development.

**Impact**:
- Records with duplicate sort values may appear on multiple pages (duplicates)
- Records with duplicate sort values may be skipped across page boundaries
- Inconsistent pagination: the same request returns different results at different times
- Hard to reproduce and debug: requires specific data conditions

**Detection**:
- Code review: `orderBy('created_at')` without a tiebreaker `orderBy('id')`
- Bug reports: "I see the same post on two different pages"
- Integration tests: order-dependent failures in pagination assertions

**Solution**:
- Always include the primary key as the final column in ORDER BY
- Use the PK as the tiebreaker in the cursor WHERE clause
- Even if the primary column "seems unique," add the tiebreaker for safety

**Example**:
```php
// BEFORE: No tiebreaker
Post::orderBy('created_at', 'desc')->cursorPaginate(15); // ❌ non-deterministic duplicates

// AFTER: With tiebreaker
Post::orderBy('created_at', 'desc')
    ->orderBy('id', 'desc') // ✅ tiebreaker
    ->cursorPaginate(15);

// Resulting cursor WHERE:
// WHERE (created_at < ? OR (created_at = ? AND id < ?))
// ORDER BY created_at DESC, id DESC
```
