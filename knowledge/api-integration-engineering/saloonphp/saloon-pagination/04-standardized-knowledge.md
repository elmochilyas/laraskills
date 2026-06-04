# ECC Standardized Knowledge — Pagination Plugin for SaloonPHP (Cursor, Page, Offset)

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | api-client-sdk-design |
| Knowledge Unit ID | k027 |
| Knowledge Unit | Pagination Plugin for SaloonPHP (Cursor, Page, Offset) |
| Difficulty | Advanced |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K010, K016, K005, K008 |

## Overview (Engineering Value)
SaloonPHP's pagination plugin provides a unified interface for handling paginated API responses across three pagination styles: cursor-based, page-based, and offset-based. The plugin abstracts pagination traversal into a Paginator class that auto-inspects response metadata and retrieves subsequent pages. Custom paginator implementations handle API-specific pagination schemas (Link headers, `next` URLs, custom metadata fields). The engineering value lies in eliminating repetitive pagination boilerplate — instead of manually constructing `?page=2`, `?page=3` URLs and inspecting response metadata, developers use a single `paginate()` call with `while ($paginated->hasNext())` iteration, consistent across all pagination styles.

## Core Concepts
- **Cursor-Based Pagination**: Opaque cursor (token/ID) fetches the next page; stable under concurrent writes — new records don't shift positions
- **Page-Based Pagination**: `?page=N&per_page=M` with `total`/`last_page` metadata; simplest but unstable under concurrent writes (records shift pages)
- **Offset-Based Pagination**: `?offset=N&limit=M`; similar to page-based but with absolute index instead of page number
- **Paginator Interface**: `HasPagination` trait providing `paginate(Connector, Request): PaginatedResponse`
- **PaginatedResponse**: Collection of current page items + `hasNext()`, `next()`, `previous()`, `items()` methods
- **Response Metadata Extraction**: Pagination info parsed from response body fields or HTTP headers (Link, X-Total-Count)

## When To Use
- Fetching multi-page result sets from any paginated API (list endpoints, search results, activity logs)
- Data synchronization/ETL jobs that consume entire data sets from paginated APIs
- Infinite scroll UI components backed by external API data
- Any integration where result set exceeds single page (default page sizes: 20-100 records)

## When NOT To Use
- Single-page result sets (use a regular Request; pagination adds unnecessary abstraction)
- APIs without pagination support (plugin requires pagination metadata to function)
- Streaming APIs (WebSockets, SSE) where data arrives continuously, not in pages
- Very large data sets where cursor expiry is guaranteed during iteration (switch to export/webhook delivery)

## Best Practices (explain WHY)
- **Prefer cursor pagination for production integrations**: Cursor-based pagination is stable under concurrent writes — new records don't shift page boundaries, eliminating duplicates or missed records during iteration
- **Use page pagination only when random access needed**: Page pagination supports "jump to page N" but suffers from drift under concurrent writes; appropriate for admin panels, not data syncs
- **Wrap pagination in LazyCollection for large data sets**: LazyCollection processes one page at a time without loading all results into memory, preventing OOM on large data syncs
- **Set maximum page limits**: APIs may return empty pages indefinitely; cap at 1000 pages or 50000 records to prevent runaway requests and runaway billing
- **Combine with rate limit plugin during pagination**: Deep pagination (100+ pages) triggers rate limits; pagination + rate limiting ensures compliance with upstream constraints
- **Implement checkpointing for long-running pagination**: Save last successful cursor/page on failure to resume from that point, avoiding full re-fetch on retry

## Architecture Guidelines
- Add `HasPagination` trait to the connector; plugin auto-detects pagination style from response
- Create custom paginator (implementing `Pagination` interface) for API-specific pagination schemas
- Use `PaginatedResponse::collect()` (with DTO plugin) to cast all items to typed DTOs
- For concurrent page fetching: use Saloon's pool feature with page ranges for parallel processing
- Monitor pagination depth as an operational metric; deep pagination suggests inefficient query patterns

## Performance Considerations
- Sequential pagination: O(N) requests where N = number of pages; total time = N × per-page latency
- Concurrent page fetching: reduces wall-clock time to ~max(per-page latency) but increases upstream load proportionally
- Page size tradeoff: smaller pages = more requests but lower latency per request, lower memory per page
- Cursor/ID-based pagination: more efficient server-side than offset pagination for large data sets (no `OFFSET` scan)
- Default page size (20-100): balances request count against response size; check API's max `per_page` limit
- LazyCollection memory: holds one page in memory at a time (~20-100 DTOs), not the entire result set

## Security Considerations
- User-supplied page numbers/offsets must be validated to prevent SSRF via malformed pagination parameters
- API cursors should be treated as opaque values; never parse or modify them client-side
- Pagination metadata may expose total record counts — consider if this leaks business-sensitive information
- Rate limiting during pagination prevents abuse; enforce per-connector rate limits even during bulk data fetches

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using page pagination for real-time data syncs | Familiarity | Duplicate or missed records under concurrent writes | Use cursor pagination for data syncs and real-time iteration |
| No maximum page limit | Trusting API behavior | Runaway requests on API bug; unexpected cost | Always set `$maxPages` or equivalent limit |
| Loading all pages into memory | Convenience | OOM on large data sets (50000+ records) | Use LazyCollection wrapping for streaming |
| Hardcoding page size | Copy-paste config | API rejection if exceeds max `per_page` | Check API docs for `per_page` max; use default (20-100) |
| Ignoring cursor expiry | Not reading API docs | Mid-sync failures with no recovery | Implement checkpointing; short expiry APIs may need single-page exports |
| Sequential fetch when concurrent is safe | Not knowing pool exists | Unnecessarily slow page traversal | Use Saloon's pool for concurrent page fetching in batch operations |

## Anti-Patterns
- **Infinite Loop Assumption**: Assuming `hasNext()` will eventually return false without a page cap (some APIs return empty results with `hasNext=true`)
- **Memory God Collection**: Fetching all pages via `collect()` without LazyCollection (stores entire result set in memory)
- **Raw Pagination URL Construction**: Manually building `?page=N` URLs instead of using the paginator (brittle, not resilient to API format changes)
- **Simultaneous Page+Offset Pagination**: Applying both styles to the same API (duplicate parameters confuse servers; use one style)

## Examples (concise, architectural)
```php
class GitHubConnector extends Connector
{
    use HasPagination;

    public function resolveBaseUrl(): string { return 'https://api.github.com/'; }
}

// Page-based pagination
$paginated = $connector->paginate(new ListRepoIssuesRequest(owner: 'laravel', repo: 'framework'));
while ($paginated->hasNext()) {
    foreach ($paginated->items() as $issue) {
        // Process one page of issues
    }
    $paginated = $paginated->next();
}

// LazyCollection for memory-efficient processing
$allIssues = LazyCollection::make(function () use ($connector) {
    $paginated = $connector->paginate(new ListRepoIssuesRequest(owner: 'laravel', repo: 'framework'), maxPages: 50);
    while ($paginated->hasNext()) {
        yield from $paginated->items();
        $paginated = $paginated->next();
    }
});

// Custom cursor paginator for Stripe
class StripeCursorPaginator implements Pagination
{
    public function applyPagination(Request $request, mixed $cursor): Request
    {
        return $request->query()->merge(['starting_after' => $cursor]);
    }

    public function getNextCursor(Response $response): mixed
    {
        $data = $response->body();
        return count($data['data']) < $data['has_more'] ? end($data['data'])['id'] : null;
    }
}
```

## Related Topics
- **Prerequisites**: Saloon Connector/Request pattern, HTTP query parameters, API response parsing
- **Closely Related**: Cursor pagination design, page vs cursor tradeoffs, REST API pagination standards
- **Advanced**: Concurrent pagination with pool requests, streaming pagination, checkpoint/recovery patterns
- **Cross-Domain**: Rate limiting (pagination + rate limit integration), DTO collection mapping

## AI Agent Notes
- Prefer cursor pagination for data synchronization; page pagination for user-facing list views
- Use `HasPagination` trait; the plugin auto-detects pagination style from response structure
- Implement custom `Pagination` interface for APIs with non-standard pagination (Link headers, next URL objects)
- Combine with LazyCollection for memory-safe processing of large result sets
- Always set `maxPages` to prevent runaway requests

## Verification
- [ ] Page-based pagination iterates through all pages correctly
- [ ] Cursor-based pagination handles empty result sets and single-page responses
- [ ] Offset-based pagination returns correct results with offset+limit params
- [ ] `hasNext()` returns false when no more pages are available
- [ ] Maximum page limit stops pagination after configured boundary
- [ ] Custom paginator correctly extracts `next` cursor/page from API response
- [ ] LazyCollection wraps paginated iteration without memory exhaustion
- [ ] Concurrent page fetching completes without race conditions or duplicate processing
