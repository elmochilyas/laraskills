# Pagination Link Headers

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Pagination Strategies
- **Knowledge Unit:** Pagination Link Headers
- **Last Updated:** 2026-06-02

---

## Executive Summary

Pagination link headers communicate navigational URLs in HTTP `Link` headers, following RFC 5988. This approach separates navigation metadata from the response body, allowing clients to discover `first`, `last`, `prev`, and `next` pages without parsing the payload. Link headers are the standard approach in many major APIs (GitHub, Stripe) and work with both offset and cursor pagination strategies.

---

## Core Concepts

### RFC 5988 Web Linking
The `Link` header contains URLs with `rel` (relationship) values:
```http
Link: <https://api.example.com/posts?page=2>; rel="next",
      <https://api.example.com/posts?page=1>; rel="prev"
```

### Standard Pagination Rels
- `first` — First page of results
- `last` — Last page of results
- `prev` — Previous page (relative to current)
- `next` — Next page (relative to current)

### Laravel's Link Header Generation
```php
$paginator = Post::paginate(15);
// Laravel automatically includes links in the response
// For API resources, manually access:
$paginator->nextPageUrl();
$paginator->previousPageUrl();
```

---

## Mental Models

### The Street Sign Model
Link headers are like street signs at an intersection. Instead of looking at a map (response body) to find your way, the signs tell you: "Next page → that way" and "Previous page ← that way." The signs are visible before you even enter the street.

### The Envelope Address Model
The Link header is like the return address on an envelope. Before opening the envelope, you already know where it came from and where to go next. The metadata is on the outside for quick reference.

### The Breadcrumb Trail Model
Each response leaves a breadcrumb (`prev` link) pointing back to where you came from and a trail marker (`next` link) pointing forward. Following breadcrumbs builds a trail through paginated data.

---

## Internal Mechanics

### Link Header Format
```http
Link: <https://api.example.com/posts?page=3&per_page=15>; rel="next",
      <https://api.example.com/posts?page=1&per_page=15>; rel="prev",
      <https://api.example.com/posts?page=1&per_page=15>; rel="first",
      <https://api.example.com/posts?page=7&per_page=15>; rel="last"
```

### Laravel Implementation
```php
// Laravel's LengthAwarePaginator generates links
$paginator = User::paginate(15);
$paginator->url(1);          // first page URL
$paginator->previousPageUrl();  // prev page URL
$paginator->nextPageUrl();      // next page URL
$paginator->url($paginator->lastPage()); // last page URL

// Access from resource collection
return UserResource::collection($paginator)
    ->response()
    ->header('Link', $paginator->toHeader());
```

### Custom Response with Link Header
```php
public function index(Request $request)
{
    $posts = Post::paginate(15);

    return response()->json([
        'data' => PostResource::collection($posts),
    ])->withHeaders([
        'Link' => $this->buildLinkHeader($posts),
        'X-Total-Count' => $posts->total(),
    ]);
}

private function buildLinkHeader($paginator): string
{
    $links = [];

    if ($paginator->previousPageUrl()) {
        $links[] = "<{$paginator->previousPageUrl()}>; rel=\"prev\"";
    }
    if ($paginator->nextPageUrl()) {
        $links[] = "<{$paginator->nextPageUrl()}>; rel=\"next\"";
    }
    $links[] = "<{$paginator->url(1)}>; rel=\"first\"";
    $links[] = "<{$paginator->url($paginator->lastPage())}>; rel=\"last\"";

    return implode(', ', $links);
}
```

### Cursor Pagination Link Headers
```php
$paginator = Post::cursorPaginate(15);

// Manually build link headers for cursor pagination
$links = [];
if ($paginator->previousCursor()) {
    $links[] = "<" . url()->current() . "?cursor=" . $paginator->previousCursor() . ">; rel=\"prev\"";
}
if ($paginator->nextCursor()) {
    $links[] = "<" . url()->current() . "?cursor=" . $paginator->nextCursor() . ">; rel=\"next\"";
}
```

---

## Patterns

### Full Link Header Set (Offset)
Include `first`, `last`, `prev`, `next` when the total count is known (LengthAwarePaginator).

### Partial Link Header Set (Cursor)
Include only `prev` and `next` since `first` and `last` are not meaningful with cursor pagination:
```http
Link: <https://api.example.com/posts?cursor=abc...>; rel="next",
      <https://api.example.com/posts?cursor=def...>; rel="prev"
```

### Link Header + Body Links (Defensive)
Include links in both headers and response body for maximum client compatibility:
```http
Link: <.../posts?page=2>; rel="next"
```
```json
{
    "data": [...],
    "links": {
        "next": ".../posts?page=2",
        "prev": ".../posts?page=1"
    }
}
```

### Query Parameter Preservation
All link header URLs must include existing query parameters (filters, sort, search):
```php
$url = url()->current() . '?' . http_build_query(array_merge(
    $request->except('page'),
    ['page' => $page]
));
```

---

## Architectural Decisions

### Link Headers vs Body Metadata
Use link headers when:
- REST purity is a priority
- Clients prefer headers for navigation logic
- You want to follow the GitHub/Stripe convention

Use body metadata when:
- Clients need total count and page info
- Link header size exceeds limits
- JSON:API compatibility is required

### Include Both (Recommended)
The most robust approach includes links in both headers and body. This supports clients that read either location.

### Link Header Size Limits
Some proxies and CDNs strip or truncate long headers. If pagination links include long cursors or filter parameters, consider using body-only links.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Standard RFC 5988 format | Not all clients read headers | Include body links as fallback |
| Separates navigation from data | Cannot include total count in headers alone | Use X-Total-Count header or body metadata |
| Prevents clients from parsing response body | Header length limits with long URLs | Use body links for complex parameters |
| Works with any pagination strategy | No `first`/`last` for cursor pagination | Document limitations for cursor strategies |

---

## Performance Considerations

### Header Parsing Overhead
Link header parsing is negligible (microseconds). No performance concern.

### Response Size Impact
Link headers add ~100–300 bytes to response headers. This is insignificant for most APIs but may matter for high-throughput microservices.

### Caching Implications
If the `Link` header changes between requests (new next/prev URLs), CDN caching may vary by URL. Ensure cache keys include pagination parameters.

---

## Production Considerations

### Multiple Link Headers
RFC 5988 allows multiple `Link` headers or comma-separated within one header. Both are valid:
```http
Link: <...>; rel="next"
Link: <...>; rel="prev"
```
Clients and parsers support both formats.

### URL Encoding
Ensure all special characters in URLs are percent-encoded within link headers. Cursor values containing `=`, `&`, or `+` must be encoded.

### Missing Previous Link
Don't include a `prev` link on the first page. Don't include a `next` link on the last page. Clients use the presence of these headers to determine navigation boundaries.

---

## Common Mistakes

### Including Body-style URLs in Link Headers
Why it happens: Developers copy the full URL from the response body's `links` object. Why it's harmful: Link header URLs must be properly quoted and formatted per RFC 5988. Better approach: Generate header-specific URLs with `url()->current()` and `http_build_query()`.

### Not Preserving Query Parameters
Why it happens: Link headers only include the `page` parameter, dropping `filter`, `sort`, or `search` parameters. Why it's harmful: Clients navigating to "next page" lose their filter context. Better approach: Merge all existing query parameters into the link URL.

### Forgetting Cursor Pagination Limitations
Why it happens: Developers automatically include `first` and `last` for all pagination types. Why it's harmful: Cursor pagination has no meaningful `last` page — including it implies a capability that doesn't exist. Better approach: Omit `first`/`last` for cursor pagination.

---

## Failure Modes

### Header Stripping by Proxies
Some reverse proxies or CDNs strip `Link` headers. Clients that depend solely on headers fail. Mitigate: Include links in body metadata as well.

### URL Length Exceeding Header Limits
Very long cursor values combined with filter parameters may exceed per-header size limits (varies by server/proxy). Mitigate: Switch to body-only links for endpoints with complex parameters.

### Invalid Link Header Format
Malformed `Link` headers (missing quotes, wrong angle brackets) cause clients to fail parsing. Validate headers with a parser library during development.

---

## Ecosystem Usage

### GitHub API
GitHub uses Link headers as the primary pagination mechanism. Response body does not include `links`. Standard `rel="next"`, `rel="prev"`, `rel="first"`, `rel="last"`. Base URL format: `https://api.github.com/repositories?page=2&per_page=30`.

### Stripe API
Stripe includes pagination data in the response body, not in Link headers. Uses `has_more` boolean and `url` properties.

### Laravel
`LengthAwarePaginator` includes a `toHeader()` method and a `getOptions()` method for custom header generation. `Paginator` and `CursorPaginator` require manual header construction.

---

## Related Knowledge Units

### Prerequisites
- Offset Pagination Design — Page-based link structure
- Cursor Pagination Design — Cursor-based link structure

### Related Topics
- Response Structure and Metadata — Body-based pagination metadata
- HATEOAS and Hypermedia Controls — Link headers as hypermedia controls

### Advanced Follow-up Topics
- RFC 5988 Web Linking — Full spec details
- API Discoverability — Link discovery patterns

---

## Research Notes

### Source Analysis
- RFC 5988: Web Linking — Defines the Link header format
- GitHub API documentation: Pagination with Link headers
- Laravel source: `Illuminate/Pagination/LengthAwarePaginator.php` — Link header generation

### Key Insight
Link headers are the most REST-idiomatic pagination approach, but they are rarely used as the sole navigation mechanism in practice. The combined approach (headers + body) provides the widest client compatibility without sacrificing REST purity.

### Version-Specific Notes
- Laravel 9–11: `LengthAwarePaginator::toHeader()` available
- `CursorPaginator`: No built-in link header support
