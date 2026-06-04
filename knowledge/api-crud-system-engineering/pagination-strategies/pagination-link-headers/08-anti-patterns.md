# Anti-Patterns — Pagination Link Headers

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Pagination Strategies |
| Knowledge Unit | Pagination Link Headers |
| Difficulty | Foundation |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Link Headers Only, No Body Fallback | High | Medium | Code review: pagination links only in headers |
| Absolute URLs Mixed With Relative Paths | Medium | Low | Code review: inconsistent URL formats in Link headers |
| Not Encoding Special Characters in URLs | High | Medium | Code review: cursor values with `=` or `&` not percent-encoded |
| Including total in Headers Instead of Body | Medium | Medium | API review: `X-Total-Count` header used instead of body metadata |
| Generating Link Headers Without Base URL | High | Medium | Code review: relative paths in Link headers |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Including first/last for Cursor Pagination | Cursor can't provide meaningful first/last | Misleads clients into thinking random access is supported |
| Not Preserving Query Parameters | Only page param in links when filters are active | Clients lose filter/sort context when navigating |
| Forgetting Cursor Pagination Limitations | Auto-including all four link relations | Cursor pagination only supports prev/next |

---

## Anti-Pattern Details

### AP-PLH-01: Link Headers Only, No Body Fallback

**Description**: Pagination navigation is communicated exclusively through HTTP `Link` headers, with no pagination metadata in the response body. Clients that can't easily access headers — browser-based JavaScript using the Fetch API without header access, some HTTP client libraries, or clients behind proxies that strip headers — lose all pagination navigation. These clients receive data with no way to reach the next page.

**Root Cause**: Following GitHub's API pattern without considering the client ecosystem. The developer implements Link headers because they're "the REST way" but ignores clients that can't use them.

**Impact**:
- Browser-based clients cannot access next/prev URLs from JavaScript
- Some HTTP client libraries don't expose Link headers
- Proxies, CDNs, and API gateways may strip Link headers
- API consumers must hack around missing header access

**Detection**:
- Code review: pagination links in headers but not in response body `meta`
- Client feedback: "I can't access the pagination links from my framework"
- Integration tests: pagination navigation works via HTTP headers but not via body

**Solution**:
- Always include pagination links in both HTTP headers AND the response body
- The body is the canonical source; headers are a secondary convenience
- Follow the "belt and suspenders" pattern: both headers and body fallback

**Example**:
```php
// BEFORE: Headers only
public function index(Request $request): JsonResponse
{
    $posts = Post::paginate(15);
    $paginator->toHeader(); // ❌ only in headers — clients without header access are lost

    return response()->json([
        'data' => PostResource::collection($posts),
        // ❌ no body links
    ]);
}

// AFTER: Headers AND body
public function index(Request $request): JsonResponse
{
    $posts = Post::paginate(15);

    return response()->json([
        'data' => PostResource::collection($posts),
        'links' => [ // ✅ body fallback
            'first' => $paginator->url(1),
            'last' => $paginator->url($paginator->lastPage()),
            'prev' => $paginator->previousPageUrl(),
            'next' => $paginator->nextPageUrl(),
        ],
        'meta' => [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ],
    ])->withHeaders($paginator->toHeader()); // ✅ headers too
}
```

---

### AP-PLH-02: Absolute URLs Mixed With Relative Paths

**Description**: Some pagination links are absolute URLs (`https://api.example.com/posts?page=3`) while others are relative paths (`/posts?page=3`). Clients that parse both types must handle two different URL formats. Relative paths break when:
- The client accesses the API through a different base URL (proxy, mirror)
- The client constructs URLs by concatenating base + relative (double-slash issues)
- The client caches URLs without context of which host they came from

**Root Cause**: Inconsistent URL generation. Different parts of the codebase generate Link URLs differently.

**Impact**:
- Clients must implement URL normalization for relative paths
- Relative URLs break when the API is accessed through different hosts
- Cached responses with relative URLs are ambiguous
- Debugging pagination issues is harder: "the link says /posts?page=3, but which host?"

**Detection**:
- Code review: some Link URLs use `url('/posts')` (absolute) while others use `'/posts'` (relative)
- Code review: `$request->url()` vs `$request->path()` inconsistencies
- Integration tests: Link URLs are relative when expected absolute

**Solution**:
- Always generate absolute URLs for pagination links
- Use `url()->current()` or `request()->fullUrl()` as the base
- Never hardcode the base URL — resolve it from the current request

**Example**:
```php
// BEFORE: Mixed formats
'<' . '/posts?page=3' . '>; rel="next"',           // ❌ relative
'<' . 'https://api.example.com/posts?page=1' . '>; rel="first"', // ✅ absolute — but inconsistent

// AFTER: Always absolute
$base = url()->current();
$links = [
    "<{$base}?cursor={$nextCursor}>; rel=\"next\"",
    "<{$base}?cursor={$prevCursor}>; rel=\"prev\"",
];

return response()->json($data)
    ->header('Link', implode(', ', $links)); // ✅ all absolute
```

---

### AP-PLH-03: Not Encoding Special Characters in URLs

**Description**: Link header URLs contain cursor values or filter parameters with special characters — `=`, `&`, `+`, spaces — that are not percent-encoded. When the header is parsed by the client's HTTP library, the URL breaks: `&` is interpreted as a new query parameter, `+` is decoded as a space, and `=` splits key-value pairs incorrectly.

**Root Cause**: Assuming cursor values are URL-safe. The developer generates the cursor as base64 (which contains `+` and `=`) and concatenates it into a URL without encoding.

**Impact**:
- Broken pagination: Link header URLs don't work when copied or followed
- Client receives truncated or malformed URLs
- Debugging nightmare: the URL looks correct in raw headers but breaks when parsed
- Cache keys based on cursor values differ due to encoding inconsistencies

**Detection**:
- Code review: `"cursor={$cursor}"` concatenation without `urlencode()`
- Code review: base64 cursor values (which contain `+`, `/`, `=`) used directly in URLs
- Bug reports: "pagination links in headers don't work"

**Solution**:
- Always percent-encode cursor values and filter parameters in Link URLs
- Use `urlencode()` or Laravel's `URL::parameter()` helpers
- Also encode the entire URL when setting the Link header value

**Example**:
```php
// BEFORE: Not encoded
$cursor = base64_encode(json_encode(['id' => 15, 'created_at' => '2026-06-01T00:00:00Z']));
// $cursor contains +, /, = characters
$url = url()->current() . '?cursor=' . $cursor; // ❌ broken URL

// AFTER: Percent-encoded
$cursor = base64_encode(json_encode(['id' => 15, 'created_at' => '2026-06-01T00:00:00Z']));
$url = url()->current() . '?cursor=' . urlencode($cursor); // ✅ encoded

// Or use Laravel's helper:
$url = url()->current() . '?' . http_build_query(['cursor' => $cursor]);

// Result: <https://api.example.com/posts?cursor=eyJpZCI6MTUsImNyZWF0ZWRfYXQiOiIyMDI2LTA2...>; rel="next"
```

---

### AP-PLH-04: Including total in Headers Instead of Body

**Description**: The total record count is communicated through a custom header (`X-Total-Count`, `X-Total`, or `Count`) instead of in the response body. There is no standard HTTP header for pagination total count. Custom headers may be stripped by proxies, are not accessible in browser `fetch()` responses without explicit header exposure, and deviate from REST conventions.

**Root Cause**: Trying to keep the response body minimal. The developer moves metadata to custom headers.

**Impact**:
- CORS responses must explicitly expose custom headers via `Access-Control-Expose-Headers`
- Browser `fetch()` cannot read custom headers without server-side configuration
- Custom headers may be stripped by CDNs, proxies, or API gateways
- Clients must parse both body (for data) and headers (for total) — two concerns

**Detection**:
- Code review: `X-Total-Count`, `X-Total`, or custom count headers used
- Code review: response body has no `total` or `meta.total` field
- Client feedback: "I can't read the total from my browser"

**Solution**:
- Include `total` in the response body's `meta` object
- Custom headers for total are acceptable as a supplement, never as the primary mechanism
- If headers are needed for performance (body parsing), use them as a cache/debug aid, not a client contract

**Example**:
```php
// BEFORE: Total only in custom header
return response()->json([
    'data' => PostResource::collection($posts),
    // ❌ no total in body
])->header('X-Total-Count', $total);

// AFTER: Total in body, header as supplement
return response()->json([
    'data' => PostResource::collection($posts),
    'meta' => [
        'current_page' => $posts->currentPage(),
        'per_page' => $posts->perPage(),
        'total' => $posts->total(), // ✅ primary source
        'last_page' => $posts->lastPage(),
    ],
    'links' => [
        'first' => $posts->url(1),
        'last' => $posts->url($posts->lastPage()),
        'prev' => $posts->previousPageUrl(),
        'next' => $posts->nextPageUrl(),
    ],
])->header('X-Total-Count', $total); // ✅ secondary supplement
```

---

### AP-PLH-05: Generating Link Headers Without Base URL

**Description**: Link header URLs are generated as relative paths (`/api/posts?cursor=abc`) or with an incorrect base URL (`http://localhost/api/posts?cursor=abc`) instead of the actual production base URL. The relative URL cannot be resolved by clients that access the API through a different endpoint (e.g., a Kubernetes ingress, load balancer, or API gateway that routes to different services under different paths).

**Root Cause**: Hardcoded base URL or using the request path without the scheme/host.

**Impact**:
- Clients must combine link URLs with their own base URL (error-prone)
- Staging/dev environments generate links pointing to localhost
- API gateway/proxy rewriting breaks relative links
- Cached responses from one environment are invalid in another

**Detection**:
- Code review: `'/api/posts?cursor=' . $cursor` — relative path without host
- Code review: `config('app.url') . '/api/posts'` — may be wrong behind proxy
- Bug reports: "pagination links point to the wrong server"

**Solution**:
- Always use `url()->current()` or `request()->fullUrl()` to generate absolute URLs
- Ensure the base URL is correctly detected behind proxies (trusted proxies config)
- Never hardcode the base URL

**Example**:
```php
// BEFORE: Hardcoded or relative URLs
// config('app.url') might be localhost in dev
// '/api/posts?cursor=' . $cursor is relative — breaks behind proxy

// AFTER: Request-aware URL generation
// Laravel's URL generator handles trusted proxies
$nextUrl = url()->current() . '?' . http_build_query(['cursor' => $nextCursor]);
$prevUrl = url()->current() . '?' . http_build_query(['cursor' => $prevCursor]);

return response()->json($data)->header('Link', implode(', ', [
    "<{$nextUrl}>; rel=\"next\"",
    "<{$prevUrl}>; rel=\"prev\"",
]));

// Configure trusted proxies in App\Http\Middleware\TrustProxies
// so url()->current() returns the correct scheme/host behind load balancers
```
