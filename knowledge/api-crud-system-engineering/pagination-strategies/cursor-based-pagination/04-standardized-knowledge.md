# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** pagination-strategies
**Knowledge Unit:** Cursor-Based Pagination
**Difficulty:** Advanced
**Category:** Pagination
**Last Updated:** 2026-06-03

---

# Overview

Cursor-Based Pagination (also known as keyset pagination or seek pagination) is a pagination strategy that uses a pointer (cursor) to a specific record to determine the next page, rather than offset-based LIMIT/OFFSET. It exists because offset pagination becomes inefficient and inconsistent on large datasets — rows inserted or deleted before the current offset shift results between pages.

Engineers must care because cursor-based pagination is the most performant and consistent pagination strategy for large, write-heavy datasets. It avoids the offset drift problem, provides stable results regardless of data mutations, and maintains O(1) performance for deep pagination. However, it requires ordered, unique cursor values and doesn't support direct page number navigation.

---

# Core Concepts

**Cursor:** A pointer to a specific record that encodes the position for the next query. Typically an encoded version of the last record's sort column value (e.g., base64-encoded ID).

**Cursor Query:** `WHERE cursor_column > ? ORDER BY cursor_column ASC LIMIT ?` — uses the cursor as a starting point.

**Stable Sort:** Cursor-based pagination requires a unique, monotonically changing column for the cursor — typically an auto-incrementing ID or a timestamp + UUID composite.

**Forward/Backward Navigation:** Cursors enable both directions — `after` cursor for next page, `before` cursor for previous page.

**No Total Count:** Cursor-based pagination does not naturally provide total record counts. Computing total count requires a separate `COUNT(*)` query, which may be expensive.

---

# When To Use

- Large datasets (>10,000 records) where deep offset pagination is slow
- Real-time data that changes frequently (new records inserted while user paginates)
- Infinite scroll UIs where users don't need page number navigation
- APIs where stability of results between requests is critical
- Mobile APIs where pagination efficiency impacts battery/data usage

---

# When NOT To Use

- Small datasets (<1000 records) — offset pagination is simpler and fast enough
- UIs requiring direct page number navigation (page 1, page 2, page 5)
- APIs where total count is required for every response
- Datasets without a reliably unique and ordered column

---

# Best Practices

**Use the primary key as the default cursor column.** Auto-incrementing IDs are ideal — unique, monotonically increasing, indexed.

**Encode cursors for transport.** Base64-encode the cursor value with optional metadata (sort column, direction). Prevents tampering and encodes type information.

**Provide both `after` and `before` cursors.** Support forward and backward navigation from any page.

**Indicate whether there are more results.** Return `has_more: true/false` or include links for next/previous pages.

**Default sort order to the cursor column.** If no explicit sort is provided, sort by the cursor column (typically ID descending for list endpoints).

---

# Architecture Guidelines

**Cursor encoding/decoding is a dedicated service.** `CursorEncoder` handles encoding, decoding, validation, and versioning of cursor strings.

**Cursor pagination logic is reusable middleware or a trait.** `HasCursorPagination` trait on models or `CursorPaginator` service class.

**Query building uses named scopes or query macros.** `Model::cursorPaginate($perPage, $cursor)` scope encapsulates the query logic.

**Cursor metadata includes the cursor column name, value, and direction.** This enables decoding without external lookup.

---

# Performance Considerations

**Cursor queries use indexed columns, making them O(1) for any page depth.** No offset scanning — the database seeks directly to the cursor position.

**Composite cursor indexes are needed for multi-column sorts.** `INDEX(cursor_column, id)` supports ORDER BY cursor_column, id.

**Cursor encoding/decoding adds ~0.01ms** — negligible compared to query time.

**has_more detection requires fetching one extra record.** `LIMIT per_page + 1` to determine if there's a next page.

---

# Security Considerations

**Cursors must be signed or encrypted to prevent tampering.** Malicious cursors could enumerate records or cause invalid queries.

**Cursor values should not reveal internal IDs directly.** Base64 encoding is not encryption. Consider signing cursors for sensitive data.

**Validate cursor format before decoding.** Reject malformed cursors with 422.

**Rate limit cursor-based list endpoints.** Deep pagination beyond reasonable limits should be blocked.

---

# Common Mistakes

**No has_more indicator.** Clients don't know when to stop requesting pages, creating infinite loops.

**Using cursor on non-unique columns.** Duplicate cursor values cause inconsistent page boundaries.

**Not encoding cursors.** Exposing raw cursor values (like database IDs) allows enumeration and tampering.

**No backward navigation support.** Only `after` cursor without `before` cursor, limiting UX to forward-only.

**Computing total count unnecessarily.** `COUNT(*)` on every paginated query defeats the performance benefit of cursor pagination.

---

# Anti-Patterns

**Cursor Without Index:** Using cursor pagination without an index on the cursor column. Queries perform full table scans.
**Better approach:** Always index the cursor column. Composite indexes for multi-column sorts.

**Offset-Cursor Hybrid:** Using offset-style URL parameters (`?page=2`) with cursor-based backend logic, misunderstanding both strategies.
**Better approach:** Choose one strategy. Cursor for performance + stability, offset for simplicity + direct page access.

**Exposed Raw Cursor:** Returning raw database IDs as cursors without encoding or signing.
**Better approach:** Encode cursors with metadata. Sign or encrypt for sensitive data.

---

# Examples

**Cursor pagination query:**
```
public function scopeCursorPaginate(Builder $query, int $perPage, ?string $cursor, string $direction = 'after'): array
{
    if ($cursor) {
        $decoded = CursorEncoder::decode($cursor);
        $operator = $direction === 'after' ? '>' : '<';
        $query->where('id', $operator, $decoded['value']);
    }

    $orderDirection = $direction === 'after' ? 'asc' : 'desc';
    $records = $query->orderBy('id', $orderDirection)->limit($perPage + 1)->get();

    $hasMore = $records->count() > $perPage;
    $records = $records->take($perPage);

    $nextCursor = $records->isNotEmpty()
        ? CursorEncoder::encode(['value' => $records->last()->id, 'direction' => 'after'])
        : null;

    return [$records, $hasMore, $nextCursor];
}
```

# Related Topics

**Prerequisites:**
- MySQL/PostgreSQL Indexing
- Query Performance Fundamentals

**Closely Related Topics:**
- Cursor Encoding Strategies — cursor format design
- Cursor Pagination Design — comprehensive design patterns
- Offset Pagination — alternative approach

**Advanced Follow-Up Topics:**
- Multi-Column Cursor Pagination — composite sort cursors
- Cursor Pagination Performance — optimizing large datasets

**Cross-Domain Connections:**
- Pagination Strategy Selection — choosing between approaches
- Pagination Metadata Design — response format for cursors
