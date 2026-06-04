| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Pagination Strategies |
| **Metadata** | Knowledge Unit | Cursor Pagination Design |
| **Metadata** | Difficulty | Intermediate |
| **Metadata** | Dependencies | Offset Pagination Design, SQL Indexing Fundamentals |
| **Metadata** | Standards | JSON:API Pagination Extension |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Cursor pagination uses an opaque token (cursor) that points to a specific record in the dataset. Instead of calculating offsets, clients send the cursor from the previous response to fetch the next page. This approach is immune to the phantom-read problem (new inserts shifting page boundaries) and has O(1) performance regardless of position in the dataset. Cursor pagination is the preferred strategy for real-time feeds, activity streams, and any dataset with frequent concurrent writes.

## Core Concepts

- **Cursor Definition**: An opaque string encoding the position of the last record in the current page; the server decodes it to construct a WHERE clause.
- **LIMIT+1 Detection**: Fetch one extra record to determine `has_more` — if 16 records are returned (for limit=15), the 16th is used for the next cursor but excluded from the response.
- **Bidirectional Pagination**: Support both `next_cursor` (forward) and `prev_cursor` (backward) for full navigation.
- **Tiebreaker Column**: Always include the primary key as the final sort column to guarantee deterministic ordering when the primary sort column has duplicates.
- **Opaque vs Transparent**: Opaque cursors (base64-encoded JSON) are easier to debug; encrypted cursors prevent client manipulation.

## When To Use

- Real-time data feeds with frequent concurrent writes (phantom-read immunity is valuable).
- Large datasets where deep-offset performance degradation is a concern.
- Infinite scroll UI patterns where clients navigate sequentially forward.
- Activity streams, event logs, notification feeds, and any append-heavy dataset.
- Any scenario where random page access is not required.

## When NOT To Use

- When clients need random page access ("jump to page 5 of 10").
- When the UI requires a total count or page selector (e.g., "Page 3 of 247").
- When the sort order is by relevance score (search results) — scores change with new data.
- For small, stable datasets (<5000 records) where offset pagination's simplicity outweighs cursor benefits.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Always include a tiebreaker column | Multiple records with the same sort value cause non-deterministic ordering and duplicate/missing records across pages |
| Expose only cursor parameters, not page numbers | Mixing offset and cursor parameters lets clients bypass cursor consistency guarantees |
| Encode only sort column values, not entire records | Keeps cursors small and avoids exposing unnecessary data |
| Use `has_more` boolean instead of `total` | Cursor pagination cannot know the total without an expensive COUNT query |
| Return `next_cursor` and `prev_cursor` in response | Enables bidirectional navigation without additional API calls |
| Validate cursor format on every request | Malformed cursors should return 400, not 500 |

## Architecture Guidelines

- Design the composite index before implementing cursor pagination — the index must match the ORDER BY clause exactly.
- Use Laravel's `cursorPaginate()` for automatic cursor encoding, WHERE clause construction, and has_more detection.
- Keep cursor content to the minimum: only the sort column values needed for the WHERE clause.
- For public APIs, consider signing or encrypting cursors to prevent tampering and enumeration.
- Document that cursor pagination has no `last_page` and no random access — clients must paginate sequentially.

## Performance Considerations

- Cursor pagination delivers O(1) performance at any depth because it uses index range scans, not scan-and-discard.
- The key requirement is a composite index matching the ORDER BY columns; without it, cursor queries fall back to full table scans.
- LIMIT+1 overhead is negligible (one additional index leaf-page read, ~0.01ms).
- Cursor decode cost (base64 + JSON) is sub-millisecond and not a performance concern.
- Cursor pagination benefits from sequential read-ahead in the buffer pool, unlike offset pagination's scattered reads.

## Security Considerations

- Plain base64 cursors can be decoded by clients — do not include sensitive data (user IDs, roles, email addresses).
- If the cursor encodes data the client should not control (e.g., authorization scope), sign or encrypt the cursor.
- Sequential or predictable cursors enable record enumeration; use opaque tokens with multiple fields.
- Always validate cursor format on decode; return 400 for malformed or tampered cursors.
- Cursor pointing to deleted records should return `data: [], has_more: false`, not an error.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not including a tiebreaker column | Single-column sort on `created_at` seems sufficient | Non-deterministic ordering — records may appear on two pages or be skipped | Always add primary key as tiebreaker |
| Using offsets and cursors interchangeably | Exposing both cursor and page parameters | Clients use page=5 with offset logic, bypassing cursor consistency | Expose only cursor-based parameters |
| Making cursors predictable/enumerable | Using sequential integers as cursors | Clients enumerate all records, bypassing authorization | Use opaque multi-field cursors |
| Not handling cursor decode failures | Assuming cursors are always valid | Malformed cursors cause 500 errors | Validate cursor format; return 400 |

## Anti-Patterns

- **Exposing both `page` and `cursor` parameters**: Defeats the purpose of cursor pagination; clients choose the less-consistent option.
- **Including sensitive data in plaintext cursors**: Base64 is not encryption; PII in cursors is a data leak.
- **Changing sort order without invalidating cursors**: Existing cursors become meaningless under a new sort order.
- **Using cursor pagination without the supporting index**: Falls back to full table scan, performing worse than offset pagination.

## Examples

- **Laravel cursorPaginate()**: `Post::orderBy('created_at', 'desc')->orderBy('id', 'desc')->cursorPaginate(15)`
- **Cursor WHERE clause**: `WHERE (created_at < ? OR (created_at = ? AND id < ?)) ORDER BY created_at DESC, id DESC LIMIT 16`
- **Response format**: `{ "data": [...], "meta": { "next_cursor": "...", "has_more": true }, "links": { "next": "...", "prev": "..." } }`
- **Bidirectional navigation**: Include both `next_cursor` and `prev_cursor` in meta; clients use `direction=prev` with the prev cursor.

## Related Topics

- Offset Pagination Design — Understanding the problems cursor pagination solves
- Cursor Encoding Strategies — Security and format choices for cursors
- Keyset Pagination Design — SQL-only equivalent of cursor pagination
- Multi-Column Cursor Pagination — Handling complex sort orders with composite cursors

## AI Agent Notes

- When generating cursor pagination code, always include a tiebreaker column in the ORDER BY clause.
- Use `cursorPaginate()` over manual cursor construction for Laravel APIs.
- For custom cursor implementations, pre-verify the execution plan shows an index range scan.
- Include error handling for cursor decode failures (400 Bad Request) and deleted records (empty page with has_more=false).

## Verification

- [ ] Composite index on ORDER BY columns exists before deploying cursor pagination
- [ ] Execution plan shows Index Range Scan (not Seq Scan) for cursor queries
- [ ] Tiebreaker column (primary key) is included in ORDER BY and cursor WHERE clause
- [ ] LIMIT+1 pattern correctly detects has_more (fetch, count, exclude extra, return)
- [ ] Malformed or tampered cursors return HTTP 400 with clear error message
- [ ] Cursor pointing to deleted records returns `data: [], has_more: false` (not 404 or error)
- [ ] Bidirectional pagination works correctly (prev_cursor returns expected results)
- [ ] No `page` or `offset` parameters are exposed when using cursor pagination
- [ ] All paginated endpoints using cursor strategy return consistent response structure
