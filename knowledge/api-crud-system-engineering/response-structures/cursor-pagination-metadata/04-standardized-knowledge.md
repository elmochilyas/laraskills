# cursor-pagination-metadata

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: response-structures
- Knowledge Unit: cursor-pagination-metadata
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Cursor pagination metadata provides navigation fields (`next_cursor`, `prev_cursor`, `has_more`, `path`) that enable efficient, stable pagination through large datasets without expensive count queries. Unlike page-based pagination, cursor pagination uses opaque pointer values referencing positions in the dataset, making it immune to insertions and deletions shifting page boundaries.

The metadata structure differs fundamentally from page-based metadata — there is no concept of "total pages" or "current page number." Cursor pagination never executes a `COUNT(*)` query; `has_more` is determined by fetching `per_page + 1` records, giving constant query cost regardless of dataset position.

## Core Concepts
- **Cursor**: An opaque string or encoded value representing a position in the dataset. Clients pass cursors back to the API without interpreting them.
- **next_cursor**: The cursor value for the next page. Null or absent when no more results exist in the forward direction.
- **prev_cursor**: The cursor value for the previous page. Null or absent when on the first page.
- **has_more**: Boolean indicating whether additional results exist in the requested direction. Maps directly to "load more" UI controls.
- **path**: The base URL for cursor-based navigation, analogous to page-based pagination's `path` field.
- **Cursor Encoding**: Cursors are typically base64-encoded sort column values (e.g., `base64("id:12345")`). Never expose raw database values.
- **Stable Ordering**: Requires a unique, stable sort column (typically primary key). Ties must be broken deterministically.
- **CursorPaginator**: Laravel's cursor paginator encodes the cursor as a base64-encoded JSON object including the sort column value, direction, and a before/after flag.
- **No Total Count**: `has_more` is detected by fetching one extra record beyond the requested page size, never via `COUNT(*)`.

## When To Use
- Large datasets where count queries are expensive
- Frequently changing data where insertions/deletions would shift page boundaries
- Infinite scroll UIs where "load more" is the primary navigation
- Activity streams, news feeds, audit logs, and time-series data
- Mobile APIs where stable pagination is critical for UX

## When NOT To Use
- Admin UIs requiring page-number navigation and direct page access
- Search result pages where "Page 3 of 20" is a UX requirement
- APIs where clients need to jump to arbitrary positions in the dataset
- Small datasets where offset pagination performance is adequate
- Export features requiring total record counts for progress tracking

## Best Practices (WHY)
- **Encode cursor as opaque string**: Base64-encoded JSON prevents clients from decoding and depending on internal cursor structure, allowing future encoding changes.
- **Use unique sort column with tiebreaker**: Non-unique columns without tiebreakers cause records to appear on multiple pages or be skipped entirely.
- **Include sort direction in cursor**: The cursor must encode the sort direction so the API can determine which way to paginate when receiving a cursor.
- **Set has_more explicitly**: Always include `has_more` even when false. Clients use this to disable "load more" buttons and avoid unnecessary requests.
- **Omit prev_cursor for forward-only UIs**: Infinite scroll UIs never need backward navigation. Exposing `prev_cursor` adds complexity without value.

## Architecture Guidelines
- Cursor column must be unique and monotonically increasing/decreasing — `id` is the safest choice, `created_at` requires a primary key tiebreaker.
- For composite sorting, encode all sort column values in the cursor so the paginator can reconstruct the WHERE clause.
- Decide cursor expiration policy — time-limited cursors prevent stale pagination; indefinitely valid cursors simplify client logic.
- For bidirectional pagination, implement both `next_cursor` and `prev_cursor`. Clients must store the cursor from the previous request.
- Handle deleted cursor references gracefully — find the nearest remaining record rather than returning an empty page or 404.

## Performance
- Constant query cost regardless of position — no offset drift that makes deep pages expensive.
- Index utilization is ideal: `WHERE id > ? ORDER BY id LIMIT ?` uses the primary key or sort index efficiently.
- Eliminates `SELECT COUNT(*)`, the dominant cost in page-based pagination for large tables.
- Extra-record detection (`per_page + 1`) adds minimal overhead — the extra record is discarded but counted toward query result size.
- Cursor encoding/decoding adds ~50 bytes per navigation URL and negligible CPU time.

## Security
- Never expose raw database IDs as cursors — always encode (base64, encrypted, or HMAC-signed).
- Invalid/tampered cursors should return 422 Unprocessable Entity, not 500 Internal Server Error.
- Encrypt or HMAC-sign cursors containing sensitive sort column values to prevent client tampering.
- Without total counts, clients cannot estimate how many requests are needed to consume all results — rate limiting protects against runaway pagination.
- Document that cursor values are opaque strings; clients must not construct or interpret cursors.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Non-unique sort column | Paginating by `created_at` without tiebreaker | Assuming timestamps are unique | Records appear on multiple pages or get skipped | Add primary key as tiebreaker: `ORDER BY created_at DESC, id DESC` |
| Exposing raw IDs as cursors | Returning `cursor=12345` instead of encoded value | Convenience during development | Leaks database internals; enables cursor guessing | Always encode: `base64_encode(json_encode(['id' => 12345]))` |
| Client-side cursor construction | Clients build cursors from decoded data | Poor documentation of cursor opacity | Breaks when encoding strategy changes | Document cursor as opaque; never document internal format |
| Missing sort direction in cursor | Cursor encodes only the ID without direction | Oversight in cursor design | API cannot determine forward vs. backward pagination | Encode direction flag in cursor payload |
| Cursor pagination for admin tables | Using cursor pagination where page numbers are needed | Convenience without UX analysis | Cannot implement "Page 3 of 20" navigation | Use offset pagination for admin UIs |
| Ignoring null next_cursor | Client continues paginating with null cursor | Missing null check in client | Duplicate results or infinite request loops | Client must stop when `next_cursor` is null |

## Anti-Patterns
- **Raw ID Cursors**: Returning unencoded database IDs as cursor values exposes internals and enables guessing.
- **Non-Unique Sort Without Tiebreaker**: Paginating by columns with duplicate values causes inconsistent page boundaries.
- **Forward-Only with prev_cursor**: Exposing `prev_cursor` in infinite scroll UIs when backward navigation is never used.
- **Cursor Without has_more**: Omitting `has_more` forces clients to infer pagination end from null `next_cursor`, which is ambiguous with API errors.
- **Mutable Sort Column**: Using a cursor column whose value changes (e.g., `updated_at` for records that get updated) invalidates existing cursors.

## Examples
```php
// Get first page
GET /api/users?per_page=15
// Response:
// {
//   "data": [...],
//   "meta": {
//     "path": "http://api.example.com/api/users",
//     "per_page": 15,
//     "next_cursor": "eyJpZCI6MTUsIl9wb2ludHNUb05leHRJdGVtcyI6dHJ1ZX0=",
//     "prev_cursor": null,
//     "next_page_url": "http://api.example.com/api/users?per_page=15&cursor=eyJpZCI6MTV9",
//     "prev_page_url": null,
//     "has_more": true
//   }
// }

// Get next page using cursor
GET /api/users?per_page=15&cursor=eyJpZCI6MTUsIl9wb2ludHNUb05leHRJdGVtcyI6dHJ1ZX0=
// Response:
// {
//   "data": [...],
//   "meta": {
//     "path": "http://api.example.com/api/users",
//     "per_page": 15,
//     "next_cursor": "eyJpZCI6MzAsIl9wb2ludHNUb05leHRJdGVtcyI6ZmFsc2V9",
//     "prev_cursor": "eyJpZCI6MTUsIl9wb2ludHNUb05leHRJdGVtcyI6dHJ1ZX0=",
//     "next_page_url": null,
//     "prev_page_url": "http://api.example.com/api/users?per_page=15&cursor=eyJpZCI6MTV9",
//     "has_more": false
//   }
// }

// Laravel CursorPaginator usage
$users = User::orderBy('id')->cursorPaginate(15);
return UserResource::collection($users);
// Metadata auto-generated by PaginatedResourceResponse
```

## Related Topics
- **Prerequisites**: pagination-metadata-design
- **Related**: pagination-information-customization, top-level-meta-and-links
- **Advanced**: pagination-strategies (cross-subdomain)

## AI Agent Notes
- When implementing cursor pagination, encode the cursor as base64-encoded JSON including sort column, value, and direction.
- Always use a unique sort column with a primary key tiebreaker for non-unique sorts.
- Return `has_more` explicitly in every paginated response — clients depend on it for UI state.
- Validate cursor format on input — corrupted or tampered cursors should return 422, not 500.
- For forward-only infinite scroll UIs, omit `prev_cursor` from the response.

## Verification
- Every cursor-paginated response includes `next_cursor`, `prev_cursor`, `path`, `per_page`, and `has_more` in the meta object.
- Cursor values are opaque base64-encoded strings, never raw database IDs.
- Pagination queries use `WHERE sort_column > ? ORDER BY sort_column LIMIT ?` — verified via query log.
- Passing a valid cursor returns the correct next/previous page of data without duplicates or gaps.
- Invalid cursors return 422 Unprocessable Entity.
- Admin/navigation endpoints that need page numbers use offset pagination instead.
