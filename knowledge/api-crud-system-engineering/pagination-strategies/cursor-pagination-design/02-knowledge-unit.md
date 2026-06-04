# Cursor Pagination Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Pagination Strategies
- **Knowledge Unit:** Cursor Pagination Design
- **Last Updated:** 2026-06-02

---

## Executive Summary

Cursor pagination uses an opaque token (cursor) that points to a specific record in the dataset. Instead of calculating offsets, clients send the cursor from the previous response to fetch the next page. This approach is immune to the phantom-read problem (new inserts shifting page boundaries) and has O(1) performance regardless of position in the dataset. Cursor pagination is the preferred strategy for real-time feeds, activity streams, and any dataset with frequent concurrent writes.

---

## Core Concepts

### Cursor Definition
A cursor is an opaque string that encodes the position of the last record in the current page. The server decodes it to construct a `WHERE` clause:
```sql
-- Cursor points to the last record on page 1 (id=15, created_at='2026-06-01')
SELECT * FROM posts
WHERE (created_at < '2026-06-01' OR (created_at = '2026-06-01' AND id < 15))
ORDER BY created_at DESC, id DESC
LIMIT 15;
```

### Query Parameter Design
```
GET /posts?cursor=eyJpZCI6MTUsImNyZWF0ZWRfYXQiOiIyMDI2LTA2LTAxIn0=&limit=15
```

### Response Structure
```json
{
    "data": [ ... ],
    "meta": {
        "next_cursor": "eyJpZCI6MzAsImNyZWF0ZWRfYXQiOiIyMDI2LTA2LTAyIn0=",
        "has_more": true
    },
    "links": {
        "next": "/posts?cursor=eyJpZCI6MzAsImNyZWF0ZWRfYXQiOiIyMDI2LTA2LTAyIn0=",
        "prev": "/posts?cursor=eyJpZCI6MTUsImNyZWF0ZWRfYXQiOiIyMDI2LTA2LTAxIn0="
    }
}
```

### Laravel's `cursorPaginate()`
```php
$posts = Post::orderBy('created_at', 'desc')->cursorPaginate(15);
return PostResource::collection($posts);
// Laravel handles cursor encoding/decoding automatically
```

---

## Mental Models

### The Bookmark Model
Instead of counting pages, you place a bookmark at the last record you saw. On the next request, you start reading from that bookmark. If someone adds pages before your bookmark, you never notice — you still start from where you left off.

### The Train Track Model
Offset pagination is like a train that always starts at the station and counts cars. Cursor pagination is like getting off at your stop and remembering the stop name. Next time, you board directly at that stop, regardless of how many cars were added behind you.

### The Linked List Model
Each page response contains a pointer (next_cursor) to the next node. The client follows pointers sequentially. There is no random access — you cannot jump to page 5 without traversing pages 1–4.

---

## Internal Mechanics

### Cursor Encoding/Decoding
```php
// Encoding (Laravel internal)
$cursor = base64_encode(json_encode([
    'id' => $lastRecord->id,
    'created_at' => $lastRecord->created_at->toISOString(),
]));

// Decoding
$decoded = json_decode(base64_decode($cursor), true);
```

### SQL WHERE Clause Construction
```sql
-- Forward pagination (DESC order)
SELECT * FROM posts
WHERE (created_at < '2026-06-01'
    OR (created_at = '2026-06-01' AND id < 15))
ORDER BY created_at DESC, id DESC
LIMIT 16;  -- Fetch one extra to detect has_more

-- Backward pagination
SELECT * FROM posts
WHERE (created_at > '2026-06-01'
    OR (created_at = '2026-06-01' AND id > 15))
ORDER BY created_at ASC, id ASC
LIMIT 16;
```

### has_more Detection
Fetch `LIMIT + 1` records. If 16 records are returned, `has_more = true`, and the 16th record is used to build the next cursor but excluded from the response.

### Laravel's CursorPaginator
```php
$paginator = Post::orderBy('created_at')->cursorPaginate(15);

$paginator->nextCursor();   // Cursor instance
$paginator->previousCursor();
$paginator->hasMorePages();
$paginator->onFirstPage();
```

---

## Patterns

### Stable Cursor Pattern (Composite)
Use multiple columns to guarantee uniqueness and stable ordering:
```php
Post::orderBy('created_at', 'desc')
    ->orderBy('id', 'desc')
    ->cursorPaginate(15);
```

### Cursor in Query String
```
GET /api/posts?cursor=eyJpZCI6MTV9&limit=15
GET /api/posts?cursor=eyJpZCI6MzB9&limit=15&direction=prev
```

### HTTP Header Cursor
```http
GET /api/posts
X-Cursor: eyJpZCI6MTV9
X-Limit: 15
```
Less common but useful for keeping URLs clean.

### Bidirectional Pagination
Support both `next` and `prev` cursors:
```php
// Response includes both directions
"links": {
    "next": "/posts?cursor=enc_cursor_next",
    "prev": "/posts?cursor=enc_cursor_prev"
}
```

---

## Architectural Decisions

### Cursor Content Strategy
Encode only the sort column values, not entire records. Include enough columns to make the cursor deterministic (all columns in ORDER BY + tiebreaker).

### Opaque vs Transparent Cursors
Opaque cursors (base64-encoded JSON) are easier to debug. Encrypted cursors prevent clients from manipulating the cursor to access unauthorized data. Signed cursors detect tampering. Laravel uses base64-encoded JSON by default.

### Single-Column vs Multi-Column Cursors
Single-column cursors work only if the column is unique. Multi-column cursors handle non-unique sort columns by adding a tiebreaker (usually the primary key).

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| O(1) performance at any depth | No random page access | Cannot skip to page N |
| Immune to insert-induced duplicates | Cursor must be regenerated when sort values change | Records with updated sort fields can be missed |
| Consistent view under concurrent writes | More complex query construction | Must handle WHERE clause correctly |
| Laravel built-in support | Cursor size grows with number of sort columns | Keep cursor small, avoid large payloads |

---

## Performance Considerations

### Index Requirement
Cursor pagination queries use the `ORDER BY` columns in a `WHERE` clause, enabling index range scans:
```sql
-- This query uses the index on (created_at DESC, id DESC)
SELECT * FROM posts
WHERE (created_at, id) < ('2026-06-01', 15)
ORDER BY created_at DESC, id DESC
LIMIT 16;
```

### LIMIT+1 Overhead
Fetching one extra record per page is negligible (1 additional row read). The cost is far outweighed by eliminating deep-offset scans.

### Cursor Decode Cost
Base64 decoding and JSON parsing of the cursor is sub-millisecond. Not a performance concern.

---

## Production Considerations

### Cursor Expiry
Cursors pointing to deleted records produce empty pages but don't break. The `WHERE` clause simply finds no matching records. Return `data: [], has_more: false`.

### Cursor Tampering
Clients can decode base64 cursors and modify values. If the cursor encodes data the client shouldn't control (e.g., user_id for authorization), sign or encrypt the cursor:
```php
$cursor = encrypt(json_encode(['id' => 15]));
```

### Maximum Limit
Enforce `per_page` / `limit` maximum just like offset pagination:
```php
$limit = min((int) request('limit', 15), 100);
```

### Cursor Stability
If a record's sort field changes (e.g., user updates `created_at` via admin tool), that record may appear in unexpected pages or be missed. Use immutable sort columns when possible.

---

## Common Mistakes

### Not Including a Tiebreaker Column
Why it happens: Single-column sort on `created_at` seems sufficient. Why it's harmful: Multiple records with the same `created_at` value cause non-deterministic ordering — records may appear on both the current and next page. Better approach: Always add the primary key as a tiebreaker: `ORDER BY created_at DESC, id DESC`.

### Using Offsets and Cursors Interchangeably
Why it happens: Developers implement cursor pagination but expose both cursor and page parameters. Why it's harmful: Clients use `page=5` with offset logic, bypassing the cursor's consistency guarantees. Better approach: Expose only cursor-based parameters when using cursor pagination.

### Making Cursors Predictable/Enumerable
Why it happens: Using sequential integers as cursors. Why it's harmful: Clients can enumerate all records by incrementing the cursor, bypassing authorization boundaries. Better approach: Use opaque, non-sequential cursors (base64 of JSON with multiple fields).

---

## Failure Modes

### Missing Records on Sort Field Update
If a record's sort column is updated (e.g., post `updated_at` changes), it may be excluded from the cursor `WHERE` clause on subsequent pages. The record is effectively lost from the pagination set.

### Empty Cursor Result
If all remaining records are deleted between requests, the cursor page returns empty. Clients must handle `data: []` gracefully (stop paginating).

### Cursor Decode Failure
A malformed or corrupted cursor causes decode failure. Return 400 Bad Request with a clear message. Do not expose internal error details.

---

## Ecosystem Usage

### Laravel
`Model::cursorPaginate()` — available since Laravel 9. Uses base64-encoded JSON cursors. Handles bidirectional pagination. Works with `ORDER BY` clauses that include a unique column.

### Slack API
Slack's `cursor` parameter in `next_cursor` response field. Cursor is an opaque string. No `prev` cursor is provided — clients cannot navigate backward.

### Stripe API
Stripe uses `starting_after` and `ending_before` parameters instead of a single cursor. The cursor value is the record ID. Stripe requires the sort order to be deterministic.

### GitHub API
GitHub uses `page` and `per_page` for most endpoints but uses cursor-based `since` parameter for event streams.

---

## Related Knowledge Units

### Prerequisites
- Offset Pagination Design — Understanding the problems cursor pagination solves
- SQL Indexing Fundamentals — Range scans and composite index usage

### Related Topics
- Cursor Encoding Strategies — Security and format choices for cursors
- Keyset Pagination Design — The SQL-level equivalent of cursor pagination
- Multi-Column Cursor Pagination — Handling complex sort orders

### Advanced Follow-up Topics
- Cursor Pagination Performance — Comparative benchmarks
- Offset-to-Cursor Migration — Transitioning APIs without breaking clients

---

## Research Notes

### Source Analysis
- Laravel documentation: `cursorPaginate()` method reference
- Stripe API reference: Cursor-based pagination with `starting_after`/`ending_before`
- Slack API documentation: `next_cursor` pattern
- JSON:API pagination specification: Cursor-based extension

### Key Insight
Cursor pagination is not just a performance optimization — it is a correctness optimization. For real-time data, the phantom-read immunity is more valuable than any speed improvement. Choose cursor pagination for consistency first, performance second.

### Version-Specific Notes
- Laravel 9+: `cursorPaginate()` available natively
- Laravel 11: No changes to cursor pagination behavior
- Cursor encoding format is an implementation detail and may change between Laravel versions
