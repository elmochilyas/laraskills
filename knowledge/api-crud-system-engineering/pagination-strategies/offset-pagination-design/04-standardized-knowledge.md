| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Pagination Strategies |
| **Metadata** | Knowledge Unit | Offset Pagination Design |
| **Metadata** | Difficulty | Foundation |
| **Metadata** | Dependencies | REST API Design Fundamentals, SQL Query Execution |
| **Metadata** | Standards | JSON:API Pagination Extension |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Offset pagination uses `offset` and `limit` query parameters to navigate a dataset. The client requests a specific page by calculating `offset = (page - 1) * limit`. It is the most widely recognized pagination strategy in REST APIs due to its simplicity and stateless request model. However, offset pagination suffers from well-known problems under concurrent writes and deep-offset performance degradation. Understanding its design surface — parameter naming, default values, maximum limits, and response structure — is essential before deciding whether to use it.

## Core Concepts

- **Offset and Limit**: `limit` controls records per page; `offset` controls how many to skip. Alternative: `page` + `per_page` where `offset = (page - 1) * per_page`.
- **Response Metadata**: Includes `current_page`, `per_page`, `from`, `to`, `total`, `last_page`, and `links` (first, last, prev, next).
- **Two Query Execution**: Laravel's `paginate()` runs both a `COUNT(*)` query (for total) and the data query with LIMIT/OFFSET.
- **Simple Pagination**: `simplePaginate()` skips the COUNT(*) query, returning only next/prev links without total metadata.
- **Empty Page Handling**: Page beyond `last_page` returns empty `data: []` with accurate metadata — never 404.

## When To Use

- Small, stable datasets (< 5000 records) where deep-offset problems don't apply.
- Admin panels and dashboards where total count and page selectors are UX requirements.
- Any scenario requiring random page access ("jump to page 5 of 10").
- Search results where the sort order is by relevance score (cursor pagination is unreliable with scored results).
- Append-only datasets with no concurrent writes (phantom reads are not a concern).

## When NOT To Use

- For real-time feeds or activity streams with frequent concurrent writes (phantom reads cause duplicates).
- For large, unbounded datasets where deep-offset queries would time out.
- For mobile APIs or infinite scroll patterns where cursor pagination provides better UX.
- When the COUNT(*) query on a large table (millions of rows) would add unacceptable latency.
- When clients need to paginate beyond page ~100 (deep offset degradation becomes severe).

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Enforce a maximum `per_page` (e.g., 100) | Prevents abuse and out-of-memory errors from excessively large pages |
| Validate page number as integer >= 1 | Negative or zero pages can crash pagination logic |
| Return 200 with empty data for out-of-range pages | 404 implies the resource doesn't exist, not that the page is empty |
| Use `page`/`per_page` for public APIs | More user-friendly and matches Laravel/JSON:API conventions |
| Consider `simplePaginate()` when total count is not required | Eliminates the expensive COUNT(*) query |
| Document default and maximum per_page per endpoint | Clients need to know what values are acceptable |

## Architecture Guidelines

- Use `page`/`per_page` naming for public-facing REST APIs; `offset`/`limit` for internal/gRPC-like APIs.
- Keep default page size at 15-25 for general APIs; 10-15 for mobile; 25-50 for admin panels.
- Always return paginated responses with a consistent `meta`/`links` structure across all endpoints.
- Provide both body metadata and Link headers for maximum client compatibility.
- For large tables, cache the total count or use `simplePaginate()` to avoid repeated COUNT(*) queries.

## Performance Considerations

- Deep offsets cause O(N) performance: `OFFSET 10000` requires the database to scan 10015 rows and discard the first 10000.
- `COUNT(*)` on large tables (millions of rows) can take seconds, especially with WHERE clauses.
- Offset pagination queries use the ORDER BY index only for ordering, not for skipping — the index scan still reads and discards offset rows.
- At 1M rows, page 1 may be 2ms but page 100000 may be 2-10s or time out.
- Use covering indexes to reduce table lookup overhead for the data phase of offset queries.

## Security Considerations

- Validate `page` parameter to prevent excessively large offsets that could cause denial of service.
- Cap `per_page` to prevent memory exhaustion from large responses.
- Never return 404 for empty pages — this could be used by attackers to probe for data existence.
- The `total` count reflects the state at time of query; concurrent mutations can make it stale.
- Log and monitor requests with extreme page numbers or per_page values for abuse detection.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Allowing unbounded per_page | No validation on per_page parameter | Client requests 100K records; OOM or slow response | Enforce a hard upper limit (e.g., 100) |
| Using offset for real-time feeds | Offset is default in Laravel | New record inserts cause duplicates across pages | Use cursor pagination for feeds |
| Not validating page number | Laravel's paginate() accepts any integer | Page 999999 triggers deep-offset queries that degrade DB | Clamp page to last_page or return empty |
| Returning 404 for empty pages | Treating "no results" as "not found" | Clients can't distinguish missing endpoint from empty page | Always return 200 with empty data array |

## Anti-Patterns

- **Using offset pagination for unbounded datasets**: Guarantees performance problems as data grows.
- **Not capping per_page**: Opens door to resource exhaustion attacks.
- **Mixing `page`/`per_page` and `offset`/`limit` across endpoints**: Confuses clients; standardize on one.
- **Running paginate() on views without checking if pagination is needed**: Unnecessary COUNT(*) queries.
- **Relying on `total` being perfectly accurate**: Concurrent mutations make total a point-in-time estimate.

## Examples

- **Laravel paginate()**: `User::paginate(15)` — executes COUNT(*) + data query with LIMIT/OFFSET.
- **Laravel simplePaginate()**: `User::simplePaginate(15)` — data query only, no COUNT(*).
- **Page-based URLs**: `GET /users?page=2&per_page=15` — user-friendly, matches Laravel defaults.
- **Offset-based URLs**: `GET /users?offset=15&limit=15` — database-idiomatic, preferred for internal APIs.
- **Response structure**: `{ "data": [...], "meta": { "current_page": 1, "per_page": 15, "total": 100, "last_page": 7 }, "links": { "first": "?page=1", "last": "?page=7", "prev": null, "next": "?page=2" } }`

## Related Topics

- Cursor Pagination Design — Alternative strategy for real-time data
- Keyset Pagination Design — Alternative for deep-offset scenarios
- Pagination Link Headers — Link header format for pagination
- Total Count Performance — Optimizing COUNT(*) on large tables
- Offset-to-Cursor Migration — Transitioning strategies without breaking clients

## AI Agent Notes

- When implementing offset pagination, always include per_page maximum enforcement and page validation.
- For new APIs, consider cursor pagination as the default and offset only when random page access is required.
- If the dataset is expected to grow beyond 5000 records, document offset pagination's limitations and plan for migration.
- Use `simplePaginate()` unless the UI specifically requires total count and last_page.

## Verification

- [ ] per_page has a documented and enforced maximum (e.g., 100)
- [ ] page parameter is validated as integer >= 1
- [ ] Empty pages return 200 with `data: []` (not 404)
- [ ] Response includes consistent `meta` and `links` structure
- [ ] COUNT(*) query performance is benchmarked with realistic data size
- [ ] simplePaginate() considered when total count is not needed
- [ ] Default per_page is documented per endpoint
- [ ] Deep offset queries are monitored or limited
