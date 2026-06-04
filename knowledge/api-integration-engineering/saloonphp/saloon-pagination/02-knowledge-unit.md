# Metadata
Domain: API Integration Engineering
Subdomain: API Client SDK Design
Knowledge Unit: Pagination Plugin for SaloonPHP (Cursor, Page, Offset)
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
SaloonPHP's pagination plugin provides a unified interface for handling paginated API responses across different pagination styles: cursor-based, page-based, and offset-based. The plugin abstracts pagination traversal into a Paginator class that auto-inspects response metadata and retrieves subsequent pages. Custom paginator implementations handle API-specific pagination schemas (Link headers, `next` URLs, custom metadata fields).

## Core Concepts
- **Cursor-Based Pagination**: Uses an opaque cursor (token or ID) to fetch the next page; stable under data changes
- **Page-Based Pagination**: Uses `?page=1`, `?page=2` with `total` and `per_page` metadata; simplest but unstable under concurrent writes
- **Offset-Based Pagination**: Uses `?offset=0&limit=20`; similar to page-based but with offset index
- **Paginator Interface**: `Saloon\Traits\Plugins\HasPagination` with `paginate(Connector, Request): PaginatedResponse`
- **PaginatedResponse**: Collection of current page items + methods for `hasNext()`, `next()`, `previous()`, `items()`
- **Response Metadata**: Pagination info extracted from response body or headers (Link headers, X-Total-Count)

## Mental Models
- **Book Analogy**: Page-based = turning book pages (page 1, page 2); cursor-based = bookmark (here, then next)
- **Infinite Scroll**: Cursor pagination powers infinite scroll; new items don't shift the position
- **Library Catalog**: Offset pagination is like a library index card drawer; offset is the card number

## Internal Mechanics
- The plugin adds `paginate()` method to connectors via the `HasPagination` trait
- `paginate()` sends the request, extracts pagination metadata from the response, returns a `PaginatedResponse`
- Page-based: extracts `current_page`, `last_page`, `per_page`, `total` from response JSON
- Cursor-based: extracts `next_cursor`, `prev_cursor` from response metadata or Link headers
- `PaginatedResponse::next()` sends a new request with updated pagination parameters
- The paginator handles infinite loops (no next page = stop) and maximum page limits
- Custom paginators implement `Saloon\Traits\Plugins\Pagination\Pagination` interface

## Patterns
- **Auto-Traversal**: Loop `while ($paginated->hasNext()) { $paginated = $paginated->next(); }` for full data fetch
- **Lazy Collection**: Wrap pagination in a LazyCollection for memory-efficient processing of large result sets
- **Concurrent Page Fetching**: Fetch multiple pages concurrently using Saloon's pool feature
- **Custom Paginator**: Implement per-API paginator for non-standard pagination formats
- **Rate-Limited Pagination**: Combine with rate limit plugin to avoid hitting limits during bulk fetches
- **Paginated Cache**: Cache individual pages rather than full result sets for granular cache control

## Architectural Decisions
- Choose cursor pagination for stable iteration (new data doesn't shift page boundaries)
- Choose page pagination for random access (jump to specific page) or when total count is needed
- Use the plugin's built-in paginators for standard formats; implement custom for API-specific schemas
- Prefer LazyCollection wrapping for large data sets to avoid memory exhaustion
- Set maximum page limits to prevent runaway requests (1000 pages / 50000 records typical cap)
- Implement exponential backoff between pages for rate-limited APIs

## Tradeoffs
- Cursor pagination is stable under concurrent writes but doesn't support random page access or total count
- Page pagination is simple and supports "jump to page N" but may return duplicates or miss records under concurrent writes
- Custom paginators handle any format but add implementation effort per API
- LazyCollection is memory-efficient but holds database connections open for the iteration duration

## Performance Considerations
- Sequential pagination is slow for large result sets (N pages × per-page latency)
- Concurrent page fetching reduces wall-clock time but increases upstream load
- Each page is a separate HTTP request; minimize page size to reduce request count
- Page size tradeoff: smaller pages = more requests but lower latency per request and lower memory per page
- Cursor/ID-based pagination is more efficient server-side than offset pagination for large data sets
- Default page size (20-100) balances request count and response size

## Production Considerations
- Monitor pagination depth: deep pagination (100+ pages) suggests inefficient usage pattern
- Implement pagination timeouts for long-running data syncs (avoid unbounded execution)
- Log pagination progress for data import/export operations
- Use LazyCollection for batch processing to avoid memory exhaustion
- Implement checkpointing for long-running pagination (restart from last successful page on failure)
- Respect API rate limits that may be per-page (cost per request) or per-record (cost per item)

## Common Mistakes
- Using page pagination for real-time data where updates cause record duplication or omission
- Not limiting page count, causing runaway loops on APIs that return non-empty response for out-of-range pages
- Fetching all pages sequentially when only the first few pages are needed
- Hardcoding page size without checking API's `per_page` max limit
- Not handling API-specific edge cases: empty result sets, single-page responses, cursor expiry
- Storing paginated results in memory for full aggregation before processing (memory exhaustion)

## Failure Modes
- Cursor expiry: API cursor expires before iteration completes (common with time-limited cursors)
- Infinite loop: API returns the same "next" cursor indefinitely (broken pagination)
- Rate limit during pagination: deep pagination triggers rate limits before completion
- Data drift: records added/deleted during pagination cause inconsistent total counts
- Memory exhaustion: fetching all pages into memory without streaming to processing
- Pagination schema change: API changes pagination format without notice (custom paginator fails)

## Ecosystem Usage
- SaloonPHP pagination plugin supports cursor, page, and offset pagination natively
- GitHub API uses page-based pagination with `Link` headers and `per_page` parameter
- Stripe API uses cursor-based pagination with `starting_after`/`ending_before` parameters
- Laravel's own pagination (LengthAwarePaginator, CursorPaginator) internally uses similar concepts
- Saloon's paginator API: `$connector->paginate($request)` returns `PaginatedResponse`
- Custom paginators implement the `Pagination` interface for API-specific schemas

## Related Knowledge Units
- K010: SaloonPHP Connector/Request/Response Pattern (plugin host)
- K016: DTOs vs Resources Pattern (paginated responses mapped to DTO collections)
- K005: Retry Strategies (retry on pagination failures)
- K008: Rate Limiting Algorithms (rate limiting during pagination traversal)

## Research Notes
- Saloon's pagination plugin is documented at docs.saloon.dev/plugins/pagination
- The plugin supports three built-in paginators: `PagedPaginator`, `CursorPaginator`, `OffsetPaginator`
- Custom paginators can extend `Saloon\Traits\Plugins\Pagination\Pagination`
- The `PaginatedResponse::collect()` method casts all items to DTOs using the DTO plugin
- Cursor pagination is the recommended pattern for production APIs per REST API Design guidelines
