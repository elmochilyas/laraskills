# Keyset Pagination Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Pagination Strategies
- **Knowledge Unit:** Keyset Pagination Design
- **Last Updated:** 2026-06-02

---

## Executive Summary

Keyset pagination (also known as "seek pagination" or "the WHERE method") is a database-level pagination strategy that uses a `WHERE` clause on the sort columns to fetch the next page, rather than `LIMIT`/`OFFSET`. It is identical in concept to cursor pagination but implemented entirely in SQL without opaque tokens — the client sends the last seen values directly as query parameters. Keyset pagination offers O(1) performance at any depth and immunity to phantom reads, making it ideal for deep pagination scenarios where clients can be trusted with the sort column values.

---

## Core Concepts

### Keyset WHERE Clause
```sql
-- Fetch the next page after the last record (id=100, created_at='2026-06-01')
SELECT * FROM posts
WHERE created_at < '2026-06-01'
   OR (created_at = '2026-06-01' AND id < 100)
ORDER BY created_at DESC, id DESC
LIMIT 15;
```

### Transparent Parameters
The client sends raw column values instead of an opaque cursor:
```
GET /posts?after_id=100&after_created_at=2026-06-01&limit=15
```

### No Encoding Overhead
Keyset pagination requires no encoding/decoding step. The values are sent as-is in query parameters. This simplifies debugging but exposes the sort column values to clients.

---

## Mental Models

### The Dictionary Guide Word Model
When you open a dictionary, you don't count pages — you look at the guide words at the top of the page. Keyset pagination uses similar guide words: "give me the 15 records after the one where `id=100` and `created_at='2026-06-01'`."

### The Address Model
Instead of "give me people 301–315 on the street" (offset), keyset pagination says "give me the 15 people who live after 100 Main Street" (keyset). You don't need to count the houses before 100 Main Street.

### The > / < Model
Keyset pagination is fundamentally a comparison operation. Every page request translates to "fetch records where the sort value is greater (or less) than this reference point." This is exactly what B-tree indexes are optimized for.

---

## Internal Mechanics

### Single-Column Keyset
```sql
-- When id is unique and the only sort column
SELECT * FROM users
WHERE id > 100
ORDER BY id ASC
LIMIT 15;
```
Simple, efficient, requires only a primary key index.

### Multi-Column Keyset
```sql
-- When sorting by non-unique column
SELECT * FROM posts
WHERE (created_at, id) < ('2026-06-01', 100)
ORDER BY created_at DESC, id DESC
LIMIT 15;
```
The composite `WHERE` clause matches composite index structure precisely.

### Laravel Implementation (forPageAfterId)
```php
// Simple keyset by primary key
$posts = Post::orderBy('id')->where('id', '>', $lastId)->limit(15)->get();

// Or use Laravel's built-in
$posts = Post::forPageAfterId(15, $lastId)->get();
```

### Manual Keyset Implementation
```php
public function paginatePosts($request)
{
    $limit = min((int) $request->input('limit', 15), 100);
    $afterId = (int) $request->input('after_id', 0);
    $afterCreatedAt = $request->input('after_created_at');

    $query = Post::orderBy('created_at', 'desc')->orderBy('id', 'desc');

    if ($afterId && $afterCreatedAt) {
        $query->where(function ($q) use ($afterCreatedAt, $afterId) {
            $q->where('created_at', '<', $afterCreatedAt)
              ->orWhere(function ($q) use ($afterCreatedAt, $afterId) {
                  $q->where('created_at', '=', $afterCreatedAt)
                    ->where('id', '<', $afterId);
              });
        });
    }

    $posts = $query->limit($limit + 1)->get();
    $hasMore = $posts->count() > $limit;

    return [
        'data' => $posts->take($limit),
        'has_more' => $hasMore,
        'next_after_id' => $hasMore ? $posts->get($limit - 1)->id : null,
        'next_after_created_at' => $hasMore ? $posts->get($limit - 1)->created_at : null,
    ];
}
```

---

## Patterns

### Parameter Naming Convention
```
# Forward
GET /posts?after_id=100&after_created_at=2026-06-01

# Backward
GET /posts?before_id=50&before_created_at=2026-05-15

# Combined (for bidirectional)
GET /posts?after_id=100&after_created_at=2026-06-01&direction=prev
```

### Response Metadata Pattern
```json
{
    "data": [ ... ],
    "pagination": {
        "after_id": 115,
        "after_created_at": "2026-06-01T12:00:00Z",
        "has_more": true
    }
}
```

### Stable Column Names Pattern
Use consistent parameter names across all endpoints. Prefix with `after_` or `before_` to indicate direction. Keep column names in snake_case matching the database.

### SQL Row Constructor Syntax
PostgreSQL and MySQL support row constructor syntax for cleaner queries:
```sql
-- PostgreSQL
SELECT * FROM posts
WHERE (created_at, id) > ('2026-06-01', 100)
ORDER BY created_at ASC, id ASC
LIMIT 15;

-- MySQL
SELECT * FROM posts
WHERE (created_at, id) > ('2026-06-01', 100)
ORDER BY created_at ASC, id ASC
LIMIT 15;
```

---

## Architectural Decisions

### Keyset vs Cursor Pagination
Use keyset pagination when:
- Clients are trusted or internal (no cursor obfuscation needed)
- You want maximum debuggability (raw values in logs)
- You don't want the overhead of cursor encoding
- Clients need to resume pagination from a bookmark they control

Use cursor pagination when:
- Cursor opaqueness is a security requirement
- API is public and you don't want to expose sort column values
- You want to prevent clients from enumerating records via sequential IDs

### Exposed Sort Columns
If your sort column is something clients shouldn't see (e.g., internal `position` used for admin ordering), use cursor pagination. If the sort column is already visible in the response (e.g., `created_at`, `id`), keyset pagination adds no additional exposure.

### Direction Support
Always support both forward and backward pagination with separate parameter sets:
- `after_*` parameters for forward pagination
- `before_*` parameters for backward pagination

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| O(1) performance at any depth | Exposes sort column values to clients | Can reveal internal ordering or sequential IDs |
| No encoding overhead | Clients must send multiple parameters | More complex query strings |
| Fully debuggable (raw values in logs) | Clients can manipulate sort values | Must validate that values correspond to real records |
| DB-agnostic SQL pattern | Complex multi-column WHERE construction | Can be error-prone to implement manually |

---

## Performance Considerations

### Index Requirement
The `WHERE` clause must match the `ORDER BY` index exactly:
```sql
-- Required index
CREATE INDEX idx_posts_created_id ON posts(created_at DESC, id DESC);

-- This query uses the index range scan
SELECT * FROM posts
WHERE (created_at, id) > ('2026-06-01', 100)
ORDER BY created_at ASC, id ASC
LIMIT 15;
```

### Row Constructor vs Boolean Expression
Row constructor syntax `(a, b) > (x, y)` is optimized in PostgreSQL and MySQL 8.0+ to use a single index range scan. Boolean expressions `a > x OR (a = x AND b > y)` may be less optimized in some databases. Prefer row constructor syntax when available.

### LIMIT+1 for Has-More Detection
Same as cursor pagination: fetch `LIMIT + 1` rows to determine if more pages exist. This adds negligible cost.

---

## Production Considerations

### Parameter Validation
Validate that `after_id` / `before_id` are positive integers and that date parameters are valid ISO 8601 dates:
```php
$request->validate([
    'after_id' => 'integer|min:0',
    'after_created_at' => 'date_format:Y-m-d\TH:i:s\Z',
    'limit' => 'integer|min:1|max:100',
]);
```

### Security: Value Injection
Keyset parameters are used directly in SQL WHERE clauses. Ensure values are properly bound (use Eloquent, not raw `DB::raw()`):
```php
// Safe: Laravel parameter binding
$query->where('created_at', '<', $afterCreatedAt);

// Dangerous: Raw string interpolation
$query->whereRaw("created_at < '{$afterCreatedAt}'"); // SQL injection risk
```

### Default Sort
Always define a default sort order. If no `after_*` parameters are provided, start from the beginning.

---

## Common Mistakes

### Not Including a Tiebreaker
Why it happens: Developers sort by `created_at` which appears unique. Why it's harmful: Records with identical `created_at` values create non-deterministic page boundaries. Better approach: Always include the primary key as the final sort column and the final WHERE clause condition.

### Using Mix of `after_` and `before_` 
Why it happens: Developers implement both directions but allow clients to send both parameter sets simultaneously. Why it's harmful: The WHERE clause logic becomes contradictory and may return incorrect or empty results. Better approach: Require `direction=next` or `direction=prev` as a separate parameter; ignore the non-matching parameter set.

### Forgetting to Scope Parameters to the Query
Why it happens: After fetching a record using a filter (e.g., `status=active`), the client reuses the same keyset for a different filter. Why it's harmful: The keyset position is meaningless in a different filtered view. Better approach: Always generate fresh keyset values from the current query's results.

---

## Failure Modes

### Deleted Keyset Record
If the record identified by `after_id` is deleted, the keyset still works — the `WHERE` clause finds the next matching record after that ID. No failure, no empty page.

### Unstable Sort Values
If a record's sort value changes (e.g., `position` updated), the keyset may point to a record that no longer belongs in the current position. The pagination works but may skip or duplicate records.

### Type Mismatch
If the client sends a string for an integer column, database type coercion may cause incorrect comparisons. Always validate parameter types server-side.

---

## Ecosystem Usage

### Laravel
`forPageAfterId()` and `forPageBeforeId()` are built-in for primary key based keyset pagination. No built-in support for composite keysets — must be implemented manually or via `cursorPaginate()`.

### PostgreSQL Community
PostgreSQL documentation explicitly recommends keyset pagination as "the correct way to do pagination." The `(col1, col2) > (val1, val2)` syntax is widely promoted.

### Pagila (Sample Database)
The Pagila sample database includes examples of keyset pagination in its documentation.

---

## Related Knowledge Units

### Prerequisites
- SQL Query Execution — WHERE clause optimization, index usage
- Cursor Pagination Design — Understanding the conceptual equivalent

### Related Topics
- Multi-Column Cursor Pagination — Advanced keyset with many sort columns
- Pagination Strategy Selection — Keyset vs offset vs cursor comparison

### Advanced Follow-up Topics
- SQL Row Constructor Performance — Database-specific optimization
- Offset-to-Cursor Migration — Moving from offset to keyset pagination

---

## Research Notes

### Source Analysis
- Markus Winand, "Use the Index, Luke!": "Pagination done the PostgreSQL way" chapter
- PostgreSQL documentation: `LIMIT` and `OFFSET` vs keyset pattern
- MySQL 8.0 documentation: Row constructor expressions

### Key Insight
Keyset pagination is the least-known but most-performant pagination strategy. It combines cursor pagination's O(1) performance with complete transparency. It is ideal for internal APIs, admin panels, and any scenario where clients are trusted with sort column values.

### Version-Specific Notes
- Laravel: No native composite keyset support; use `cursorPaginate()` or manual implementation
- PostgreSQL 9.2+: Row constructor optimization
- MySQL 8.0.28+: Row constructor index optimization
