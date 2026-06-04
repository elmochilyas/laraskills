# cursor-pagination-metadata
## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Response Structures  
**Knowledge Unit:** cursor-pagination-metadata  
**Difficulty Level:** Intermediate  
**Last Updated:** 2026-06-02

## Executive Summary
Cursor pagination metadata provides navigation fields (`next_cursor`, `prev_cursor`, `has_more`, `path`) that enable efficient, stable pagination through large datasets without requiring expensive count queries. Unlike page-based pagination, cursor pagination uses opaque pointer values that reference positions in the dataset, making it immune to insertions/deletions shifting page boundaries. The metadata structure differs fundamentally from page-based metadata because there is no concept of "total pages" or "current page number."

## Core Concepts
- **Cursor**: An opaque string or encoded value that represents a position in the dataset. Clients do not interpret cursors — they pass them back to the API.
- **`next_cursor`**: The cursor value for the next page of results. Null or absent when there are no more results in the forward direction.
- **`prev_cursor`**: The cursor value for the previous page of results. Null or absent when on the first page.
- **`has_more`**: A boolean indicating whether additional results exist in the requested direction. Used by clients to determine if a "load more" button should be shown.
- **`path`**: The base URL for cursor-based navigation, analogous to page-based pagination's path field.
- **Cursor Encoding**: Cursors are typically base64-encoded versions of the sort column values (e.g. base64 of "id:12345"). Never expose raw database values as cursors.
- **Stable Ordering**: Cursor pagination requires a unique, stable sort column (typically the primary key). Ties must be broken deterministically.

## Mental Models
- **Bookmark**: A cursor is a bookmark that marks your exact position. You can go forward or back to that bookmark, but you cannot jump to "page 5" because pages don't exist.
- **Infinite Scroll**: Cursor pagination is the natural model for infinite scroll UIs. The "load more" button maps directly to `has_more`.
- **Tunnel Vision**: You can only see what's ahead or behind your cursor. You cannot see the total size of the tunnel.

## Internal Mechanics
- **`CursorPaginator`**: Laravel's cursor paginator generates cursors based on the `orderBy` column and direction. It encodes the cursor as a base64-encoded JSON object.
- **Cursor Generation**: The cursor includes the sort column value, the direction, and an optional boolean indicating whether it's an "after" or "before" cursor. This ensures the paginator can reconstruct the query.
- **Query Construction**: `WHERE sort_column > decoded_cursor_value ORDER BY sort_column ASC LIMIT per_page`. The paginator adds one to the limit to detect `has_more`.
- **No Total Count**: By design, cursor pagination never knows the total number of records. `has_more` is determined by checking if the query returned one extra record beyond the requested page size.
- **Reverse Navigation**: Going backward uses `WHERE sort_column < decoded_cursor_value ORDER BY sort_column DESC`. The paginator handles direction reversal transparently.
- **Metadata Structure**: Laravel's `CursorPaginator::toArray()` outputs `data`, `next_cursor`, `prev_cursor`, `path`, `per_page`, `next_page_url`, `prev_page_url`, `has_more`.

## Patterns
- **Cursor on Time-Based Sorts**: Use cursor pagination with `created_at` as the cursor column for feeds and activity streams. New records inserted at the top don't shift existing pagination windows.
- **Cursor with Composite Sorting**: When sorting by non-unique columns, add the primary key as a tiebreaker. `ORDER BY created_at DESC, id DESC`. The cursor encodes both values.
- **Forward-Only Cursor**: For infinite scroll UIs, only expose `next_cursor` and `has_more`. Omit `prev_cursor` to discourage reverse navigation.
- **Bidirectional Cursor**: For list UIs with prev/next controls, expose both `next_cursor` and `prev_cursor`. Requires storing the cursor from the previous request.
- **Opaque Cursor Encoding**: Encrypt or sign cursors to prevent client tampering. A client should not be able to craft arbitrary cursors to probe data.

## Architectural Decisions
- **Cursor vs. Page Pagination**: Choose cursor pagination when dataset size is large, when data churns frequently, or when infinite scroll is the primary UX. Choose page pagination when direct page access is required (search results, admin tables).
- **Cursor Column Selection**: The cursor column must be unique and monotonically increasing/decreasing. `id` is the safest choice. `created_at` ties require a tiebreaker.
- **Cursor Exposure Duration**: Decide whether cursors expire. Some APIs issue time-limited cursors to prevent stale pagination. Others treat cursors as valid indefinitely.
- **Sort Direction Support**: Determine whether the API supports both ascending and descending cursor pagination. Descending requires reversing the sort column comparison.

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| No count query, fast on large datasets | No total or page count | Clients cannot show "Page 3 of 20" |
| Stable pagination despite inserts | Cannot jump to arbitrary pages | "Go to page 5" is impossible |
| Efficient for infinite scroll | Harder to implement search result pagination | Search relevance may require page numbers |
| Opaque cursors hide database structure | Cursor encoding/decoding overhead | Additional ~50 bytes per navigation URL |
| Consistent performance regardless of position | Deep pagination is not cheaper — same cost per page | Every page costs the same, no "offset drift" |

## Performance Considerations
- **Consistent Query Cost**: Unlike offset pagination where deep pages are increasingly expensive, cursor pagination has constant query cost regardless of position.
- **Index Utilization**: Cursor pagination queries use the sort index efficiently: `WHERE id > ? ORDER BY id LIMIT ?`. This is an ideal index access pattern.
- **No COUNT Query**: The primary performance advantage — no `SELECT COUNT(*)` on large tables.
- **Extra Record Detection**: The paginator fetches `per_page + 1` records to detect `has_more`. The extra record is discarded, but it still counts toward query result size.

## Production Considerations
- **Cursor Expiration**: If the cursor column value can be deleted, a cursor may point to a non-existent record. Decide how to handle this (return empty page vs. 404 vs. adjust cursor).
- **Monitoring Cursor Decoding Errors**: Invalid cursors (tampered, malformed, expired) should return 422 Unprocessable Entity, not 500.
- **Cursor Leakage**: If cursors are base64-encoded raw IDs, clients can decode them and infer database IDs. Encrypt or hash cursors for sensitive data.
- **API Documentation**: Clearly document that cursor values are opaque strings. Clients should not attempt to construct or interpret cursors.
- **Rate Limiting**: Without total, clients cannot estimate how many requests are needed to consume all results. Rate limiting protects against runaway pagination.

## Common Mistakes
- **Client-Side Cursor Construction**: Clients that try to manually construct cursor values from decoded data break when encoding changes.
- **Non-Unique Sort Column**: Using a non-unique column without a tiebreaker creates inconsistent pagination (records may appear on multiple pages or be skipped).
- **Forgetting Sort Direction in Cursor**: A cursor must encode the sort direction so the API can determine which way to paginate.
- **Exposing Raw IDs as Cursors**: Returning `cursor=12345` instead of `cursor=eyJpZCI6MTIzNDV9` leaks database internals.
- **Using Cursor Pagination for Admin Tables**: Admin UIs typically need page-number navigation and sortable columns. Cursor pagination is a poor fit.

## Failure Modes
- **Deleted Cursor Reference**: If the record identified by the cursor is deleted, the paginator may start from the beginning. Mitigate by finding the nearest remaining record.
- **Cursor Tampering**: Clients that modify cursors can trigger unexpected queries. Cursor decryption failures should be handled gracefully.
- **Sort Column Mutation**: If the cursor column value changes after the cursor was issued (e.g. user changes their `created_at`), the cursor becomes invalid.
- **Empty Cursor for Last Page**: When the last page is reached, `next_cursor` is null. Clients that ignore this and continue paginating with null receive duplicate results.

## Ecosystem Usage
- **Laravel Framework**: `Illuminate\Pagination\CursorPaginator` was introduced in Laravel 8. It provides `nextCursor()`, `previousCursor()`, `cursorName()` methods.
- **Laravel Nova**: Nova uses cursor pagination for its resource index views, passing `cursor` and `perPage` parameters.
- **Spatie/laravel-json-api-paginate**: Supports cursor pagination with JSON:API-compatible metadata.
- **Twitter/Stripe API**: Both APIs use cursor-based pagination in their public REST APIs. Twitter uses `next_cursor` and `previous_cursor` fields.

## Related Knowledge Units
### Prerequisites
- pagination-metadata-design

### Related Topics
- pagination-information-customization

### Advanced Follow-up Topics
- top-level-meta-and-links

---

## Research Notes

### Source Analysis
- `Illuminate\Persistence\CursorPaginator` (introduced Laravel 8)
- `Illuminate\Http\Resources\Json\PaginatedResourceResponse` (cursor-aware metadata generation)
- `Illuminate\Pagination\Cursor` (cursor encoding/decoding)

### Key Insight
Cursor pagination never executes a `COUNT(*)` query — `has_more` is determined by fetching `per_page + 1` records — making it the only pagination strategy with constant query cost regardless of dataset position.

### Version-Specific Notes
- Laravel 8: `CursorPaginator` introduced
- Laravel 10/11/12/13: Cursor encoding uses base64-encoded JSON; no breaking changes to the cursor metadata shape
- `has_more` field present in `toArray()` output across all versions since introduction
