| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Pagination Strategies |
| **Metadata** | Knowledge Unit | Zero-Result Pagination |
| **Metadata** | Difficulty | Foundation |
| **Metadata** | Dependencies | Offset Pagination Design, Cursor Pagination Design |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Zero-result pagination occurs when a paginated request returns an empty `data` array. This happens in three scenarios: the dataset is truly empty (page 1, no results), the client requested a page beyond the last page (offset pagination), or all remaining records were deleted between requests (cursor pagination). Each scenario should be handled differently. Consistent empty-response semantics — returning an empty array rather than 404 or null — simplify client error handling and enable reliable infinite-scroll implementations.

## Core Concepts

- **Three Types of Empty Pages**: Genuinely empty (no records match), out-of-range (page exceeds last_page), depleted cursor (cursor points past remaining records).
- **Consistent Response**: All empty pages return HTTP 200 with `data: []` — never 404, never null.
- **Empty Data Must Be Array**: Return `data: []` (empty array), never `data: null` or `data: {}` — clients iterate over data.
- **Metadata Still Accurate**: Even for empty pages, metadata (total, last_page, per_page) should be accurate.
- **Client Termination Logic**: Clients stop paginating when `data.length === 0` or `has_more === false`.

## When To Use

- All paginated endpoints — consistent empty-response semantics are a universal pattern.
- Infinite scroll implementations where the end of content must be detectable.
- API-first applications where client pagination loops need a reliable termination signal.
- Any endpoint where `data` key might be empty at some point during pagination.

## When NOT To Use

- When the requested resource itself does not exist (e.g., `/api/nonexistent-resource`) — that should return 404.
- When pagination parameters are invalid (e.g., negative page number) — that should return 400.
- When the client is not authorized to access the resource — that should return 401/403.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Always return `data: []` for empty results | Non-array values crash client iteration (map, forEach, for...of) |
| Never return 404 for an empty page | 404 means the resource doesn't exist, not that the page is empty |
| Include accurate metadata in empty responses | Clients need total/per_page/last_page even when data is empty |
| Document empty-page behavior in API reference | Clients must know how to detect end of pagination |
| Check `has_more` in addition to empty data array | Defensive programming — catches edge cases where has_more may be misreported |
| Log excessive out-of-range page requests | May indicate client bugs, scrapers, or stale total counts |

## Architecture Guidelines

- Ensure all pagination methods (paginate, simplePaginate, cursorPaginate) return consistent empty structures.
- Use Laravel's built-in behavior — these methods already return `data: []` on empty results.
- For custom pagination implementations, always return `data: []` (not null, not omitted).
- If distinguishing empty states matters for clients, include a `meta.reason` field (`"no_results"`, `"page_exceeds_total"`, `"cursor_depleted"`).
- Consider a pre-emptive existence check for expensive queries: `if (! Post::exists()) { return $this->emptyResponse(); }`.

## Performance Considerations

- Empty result queries still execute database queries — for offset pagination, this includes COUNT(*); for cursor, includes the data query.
- An out-of-range page (e.g., page 999999) with offset pagination still executes the expensive OFFSET query — validate page numbers.
- For genuinely empty datasets, consider caching the "empty" state to avoid repeated queries.
- Cursor pagination's has_more detection (LIMIT+1) still fetches rows even when the cursor points to the last record.

## Security Considerations

- Empty pages should never be distinguishable from "resource exists but restricted" — return the same structure for unauthorized empty results.
- Repeated out-of-range page requests may indicate scraping — log and rate-limit.
- The `total` count in empty page metadata can leak information — consider omitting for sensitive endpoints.
- Ensure empty responses don't expose internal state (e.g., "no records because deleted cursor" vs "no records ever existed").
- Consistent empty responses prevent attackers from probing data existence through pagination.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Returning 404 for empty pages | "No results" treated as "not found" | Clients cannot distinguish missing endpoint from empty page | Always return 200 with empty data array |
| Returning null instead of empty array for data | null semantically means "no data" | Clients using data.map() or data.forEach() throw errors | Always return `[]` for the data key |
| Not handling empty cursor responses | Assuming cursor returns data while records exist | When all records deleted, cursor returns empty; client keeps requesting | Always check has_more or detect empty data array |
| Distinguishing empty types with different status codes | Trying to communicate "genuinely empty" vs "out of range" | Clients must handle different empty states differently | Use same 200+empty structure; add meta.reason if distinction matters |

## Anti-Patterns

- **404 for empty pages**: The most common pagination mistake; breaks client pagination loops.
- **`data: null` or `data: {}` instead of `data: []`**: Non-array data types crash client-side iteration.
- **Omitting `data` key entirely when empty**: Clients expect a consistent response shape.
- **Different empty response structures per endpoint**: Forces clients to handle each endpoint differently.
- **Returning 204 No Content for empty pages**: Unconventional and breaks standard pagination clients.

## Examples

- **Offset empty page (out of range)**: `{ "data": [], "meta": { "current_page": 99, "per_page": 15, "from": null, "to": null, "total": 57, "last_page": 4 } }`
- **Genuinely empty dataset**: `{ "data": [], "meta": { "current_page": 1, "per_page": 15, "total": 0, "last_page": 1 } }`
- **Cursor depleted**: `{ "data": [], "meta": { "has_more": false, "next_cursor": null } }`
- **With meta.reason**: `{ "data": [], "meta": { "reason": "page_exceeds_total", "total": 57, "last_page": 4, "current_page": 99 } }`
- **Client detection**: `if (data.data.length === 0 || !data.meta.has_more) { stopPagination(); }`

## Related Topics

- Offset Pagination Design — Page-based empty handling
- Cursor Pagination Design — Cursor-based empty handling
- API Error Handling — Distinguishing empty from error responses
- Per-Page Parameter Design — Page validation and empty page prevention
- Client-Side Pagination State Management — Handling empty states in frontend

## AI Agent Notes

- Always return `data: []` for empty paginated responses — never null, never omit, never 404.
- For infinite scroll endpoints, ensure the client checks both `data.length === 0` and `has_more === false`.
- Log out-of-range page requests for monitoring; they may indicate client bugs or scraping.
- If distinguishing empty types is required, use `meta.reason` rather than different status codes.
- For expensive queries, add a pre-emptive `Model::exists()` check before running the full pagination query on genuinely empty datasets.

## Verification

- [ ] All paginated endpoints return `data: []` (not null, not omitted) for empty results
- [ ] HTTP status is 200 for empty pages (never 404, never 204)
- [ ] Empty offset pages include accurate meta (total, last_page, per_page)
- [ ] Empty cursor pages include `has_more: false` and `next_cursor: null`
- [ ] Client-side pagination loop checks `data.length === 0` or `has_more === false` to terminate
- [ ] meta.reason (if used) provides meaningful values for each empty type
- [ ] Out-of-range page requests are logged for monitoring
- [ ] Page number validation prevents excessively large offsets on empty pages
- [ ] Empty response structure is consistent across all endpoints
