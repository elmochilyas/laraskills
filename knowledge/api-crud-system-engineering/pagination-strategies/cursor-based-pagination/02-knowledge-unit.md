# Cursor-Based Pagination

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** pagination-strategies
- **Knowledge Unit:** Cursor-Based Pagination
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary
Cursor-Based Pagination uses opaque cursor tokens to paginate through results, offering stable pagination even when new records are inserted. Unlike offset pagination, cursor pagination avoids the "phantom read" and performance degradation problems that plague large datasets.

---

## Core Concepts
- **Cursor Definition**: An opaque token encoding the last item's position (often the ID or a timestamp)
- **Cursor Query Pattern**: `WHERE id > ?` or `WHERE created_at < ?` with `ORDER BY` and `LIMIT`
- **Forward/Backward Pagination**: Cursors can navigate both directions with `before` and `after` parameters
- **Cursor Encoding**: Base64-encoded cursor values that can include multiple sort columns
- **Cursor Stability**: Results don't shift when new records are inserted (unlike offset pagination)
- **Performance Characteristics**: O(1) for indexed cursor columns, regardless of depth

---

## Mental Models
1. **Bookmark Model**: A cursor is a bookmark marking where you left off. Reading the next page is like opening the book to your bookmark — you always find the right place, even if pages were added.
2. **Conveyor Belt Model**: Items pass on a conveyor belt. A cursor marks the last item you picked up. You always know where the next item is, regardless of how many items are upstream.

---

## Internal Mechanics
The client sends `?cursor=eyJpZCI6MTAwfQ==` (base64-encoded last item ID). The server decodes the cursor, constructs `WHERE id > decoded_id`, orders ascending, and limits to `$perPage`. Response includes `next_cursor` and `prev_cursor` in the meta. Forward pagination uses `>`, backward uses `<`. Cursors can encode multiple columns for composite sort.

---

## Patterns

### Pattern 1: Simple ID Cursor
**Purpose**: Cursor based on auto-incrementing primary key
**Benefits**: Fastest, simplest, O(1) with primary key index
**Tradeoffs**: Only works with ID-based ordering

### Pattern 2: Composite Cursor
**Purpose**: Cursor encoding multiple columns (e.g., `created_at` + `id` for tie-breaking)
**Benefits**: Stable pagination with custom sort orders
**Tradeoffs**: More complex cursor encoding/decoding logic

---

## Architectural Decisions
### When To Use
- Large datasets (>100k records) where offset pagination degrades
- Real-time feeds where new records are inserted frequently
- Infinite scroll and "load more" UI patterns
- APIs needing stable pagination across data changes

### When To Avoid
- Small datasets where offset pagination is simpler
- UIs requiring "jump to page N" functionality (offset needed)
- APIs where total count is required for display

### Alternatives
- Offset pagination (page number + size)
- Keyset pagination (manual WHERE clause with `> last_seen`)
- Hybrid: offset for metadata, cursor for data

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Stable pagination under insert | No total page count | Must provide total separately if needed |
| O(1) performance at any depth | Cannot jump to arbitrary pages | Limits UI pagination options |
| Consistent with real-time data | More complex client implementation | Document cursor format clearly |
| Efficient on large datasets | Composite cursors add complexity | Use simple ID cursor when possible |

---

## Performance Considerations
- Cursor queries on indexed columns are O(log n) or better
- Full-table scans are avoided entirely (unlike `OFFSET` which scans skipped rows)
- Base64 encoding/decoding overhead is negligible
- Composite cursors with multiple columns need matching composite indexes
- Decoded cursor values should be validated and sanitized

---

## Production Considerations
- Encrypt or sign cursors to prevent tampering (users could guess IDs)
- Set a maximum cursor age to prevent replay of stale cursors
- Validate cursor format before decoding to prevent errors
- Log invalid cursor attempts (potential probing attacks)
- Ensure cursor sort column has a unique index to prevent ties

---

## Common Mistakes
**Not handling cursor expiry**: Old cursors pointing to deleted records should return empty results, not errors.
**Cursor column without unique index**: Non-unique sort columns cause ties. Always add a tiebreaker (usually ID).
**Reversible cursors**: Plain base64 cursors can be decoded. Encrypt or sign cursors that shouldn't be guessable.
**Cursor without direction**: Implement both `after` and `before` for full navigation support.

---

## Failure Modes
**Cursor tampering**: Malformed or guessed cursors cause server errors. *Detection:* Error logs with decoding failures. *Mitigation:* Validate, sign, or encrypt cursors.
**Cursor staleness**: A cursor from before a data deletion points to a non-existent position. *Detection:* Empty result set for valid cursor. *Mitigation:* Return empty page gracefully.

---

## Ecosystem Usage
Laravel's `CursorPaginator` (available since Laravel 9) provides built-in cursor pagination via `User::cursorPaginate(15)`. The response includes `nextCursor` and `previousCursor`. `withCursor()` enables custom cursor implementations.

---

## Related Knowledge Units
### Prerequisites
- Database indexing
- SQL WHERE and ORDER BY clauses

### Related Topics
- Offset-based pagination
- Pagination metadata design
- Query parameter sorting

### Advanced Follow-up Topics
- Composite cursor implementation
- Encrypted/signed cursor strategies
- Cursor-based pagination with non-sequential keys (UUIDs)

---

## Research Notes
- Cursor pagination is recommended by GraphQL (Relay specification) and by the JSON:API specification
- Laravel's `CursorPaginator` uses `WHERE (column, id) > (?, ?)` for composite cursor queries
- For UUID-based cursors, created_at + UUID is the standard composite cursor approach
- GraphQL's Relay connection spec provides a robust cursor pagination pattern
