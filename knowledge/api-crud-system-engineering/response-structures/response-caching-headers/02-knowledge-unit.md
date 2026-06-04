# response-caching-headers
## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Response Structures  
**Knowledge Unit:** response-caching-headers  
**Difficulty Level:** Intermediate  
**Last Updated:** 2026-06-02

## Executive Summary
Response caching headers control how API responses are cached by clients, browsers, CDNs, and reverse proxies. In Laravel APIs, the key headers are `Cache-Control` (directives for cache behavior), `ETag` (content-based hash for conditional requests), and `Last-Modified` (timestamp-based freshness). Proper cache header design reduces server load, improves client response times, and prevents stale data delivery. In APIs (as opposed to web pages), caching strategy focuses on ETag-based conditional requests and explicit `Cache-Control` directives rather than HTML-specific headers like `Expires`.

## Core Concepts
- **`Cache-Control`**: The primary HTTP header for cache directives. Key directives: `public`, `private`, `no-cache`, `no-store`, `max-age`, `s-maxage`, `must-revalidate`.
- **`ETag`**: An opaque identifier (typically a hash of the response content) representing a specific version of a resource. Clients send `If-None-Match` with the ETag; server returns 304 Not Modified if unchanged.
- **`Last-Modified`**: A timestamp indicating when the resource was last modified. Clients send `If-Modified-Since`; server returns 304 if not modified since.
- **`Vary`**: Indicates which request headers were used to determine the response. `Vary: Accept` tells caches to store different versions for different Accept headers.
- **`304 Not Modified`**: The response status when a conditional request validates that the cached resource is still fresh. The body is empty, saving bandwidth.
- **Cache Validation vs. Freshness**: Freshness (max-age) determines how long a cache can use a response without checking. Validation (ETag/Last-Modified) determines whether a stale cached response is still valid.
- **Private vs. Public Caching**: `private` means the response is specific to a single user and should not be cached by shared caches (CDNs, proxies). `public` means any cache can store the response.

## Mental Models
- **Library Card**: ETag is the library card's barcode. The client shows the barcode and asks "Is this still current?" The server scans and says "Yes, same content" (304) or "No, here's the new version" (200).
- **Milk Carton**: `max-age` is the expiration date. `must-revalidate` means "Don't drink it after the expiration date — check the store first." `no-cache` means "Check the store every time, but you can keep the carton."
- **Varying Lenses**: `Vary: Accept` is like having different lenses for the same camera body. The same resource looks different through different lenses (content types), and the cache needs to store each view separately.

## Internal Mechanics
- **ETag Generation**: Typically an MD5 or SHA256 hash of the response body after serialization. In Laravel, ETags can be generated via middleware after the response is built.
- **Conditional Request Flow**: Client sends `If-None-Match: "abc123"`. Server generates ETag for the current response, compares, and returns 304 with empty body if matching.
- **Cache-Control in Laravel**: `response()->json($data)->header('Cache-Control', 'public, max-age=3600')` sets the header. More commonly, middleware applies cache headers globally.
- **ETag Middleware**: A Laravel middleware can automatically generate ETags for all JSON responses using `md5($response->getContent())`. The ETag is set on the response, and the middleware compares with `If-None-Match` to return 304.
- **Last-Modified from Model**: `$post->updated_at->toRfc7231String()` converts the model timestamp to the HTTP date format required by `Last-Modified`.
- **Vary Header**: `$response->setVary('Accept, Authorization')` tells caches that the response varies by these headers. Vary is critical for APIs that support content negotiation.
- **Cache Middleware Order**: Cache-related middleware should run AFTER authentication (to determine public vs. private) but BEFORE response compression (ETags should be computed on the compressed body).

## Patterns
- **ETag for All Resources**: Generate ETags for every API response. The computational cost (hashing) is negligible, and the bandwidth savings from 304 responses are significant for frequently requested resources.
- **Model Timestamp ETag**: Use `md5($model->updated_at->timestamp . $model->id)` as a cheap ETag alternative to hashing the full response body. This avoids serializing the resource just to compute the hash.
- **Cache-Control per Resource Type**: Different resource types have different caching requirements. Reference data (countries, categories) can have long `max-age`. User-specific data should use `private, no-cache`.
- **Conditional GET Pattern**: Clients should always send `If-None-Match` for GET requests. This turns every GET into a conditional request, enabling 304 responses when content hasn't changed.
- **Vary on Authorization**: For authenticated APIs, always include `Vary: Authorization` to prevent CDNs from serving authenticated responses to unauthenticated users.
- **Private for Authenticated Responses**: Any response containing user-specific data should use `Cache-Control: private` to prevent shared cache contamination.
- **s-maxage for CDN Caching**: Use `s-maxage=60` to allow CDNs to cache for 60 seconds while `max-age=0` forces browsers to revalidate. This separates proxy caching from browser caching.

## Architectural Decisions
- **ETag Strategy: Full Content vs. Weak ETag**: Full content ETags are unique per content version. Weak ETags (`W/"abc"`) allow semantic equivalence (same meaning despite byte-level differences). Use strong ETags by default; use weak ETags when byte-level differences don't change resource meaning.
- **Last-Modified vs. ETag Priority**: ETags are more precise (hash-based) while Last-Modified is simpler (timestamp-based). Support both; the conditional request logic should prefer ETag over Last-Modified when both are present.
- **Cache Busting Strategy**: When a resource's fields change, the ETag changes automatically. For collections where insertions shift content, the ETag changes even if individual items haven't changed. Ensure the caching strategy accommodates frequent collection changes.
- **Zero max-age vs. no-cache**: `max-age=0, must-revalidate` and `no-cache` have similar behavior but different semantics. `no-cache` means "always check with the server." `max-age=0` means "stale immediately." Use `no-cache` for semantically correct freshness control.
- **Response Varying by Query Parameters**: If the response varies by query parameters (pagination, sparse fieldsets), the cache key must include these parameters. The `Vary` header can't express query parameter variation — use a custom cache key approach with reverse proxy caching.

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Reduced server load via 304 responses | ETag generation requires serialization or hash computation | For very large responses, ETag hashing costs CPU time |
| Faster client experience with cached responses | Stale data served during cache freshness window | max-age=3600 means up to 1 hour of potentially stale data |
| Bandwidth savings on 304 responses | Conditional request headers add request size | `If-None-Match` header adds ~40 bytes per request |
| Fine-grained cache control via directives | Cache configuration is complex | Misconfigured caching causes hard-to-debug stale data bugs |
| CDN integration via Cache-Control headers | CDN caching of authenticated responses leaks data | Always set `private` for user-specific responses |

## Performance Considerations
- **ETag Computation Cost**: Hashing the full response body costs ~0.1ms per MB of response. For typical sub-100KB API responses, the cost is ~0.01ms. Use model-timestamp ETags to eliminate this entirely.
- **304 Response Savings**: A 304 response with empty body can save 99% of response bandwidth compared to a 200 with full payload.
- **Cache Hit Ratio Improvement**: Proper `Cache-Control` directives increase cache hit ratios from 0% (no caching) to 60-90% (well-cached) for read-heavy endpoints.
- **Middleware Execution Cost**: Cache-control middleware adds ~0.01ms per request. ETag middleware adds ~0.05ms for hashing.

## Production Considerations
- **Cache Invalidation Strategy**: ETags and Last-Modified handle validation but not invalidation. When a resource is updated, the cache must wait for max-age to expire or be purged via reverse proxy APIs.
- **Private Data Leakage Prevention**: Test that authenticated responses have `Cache-Control: private` and `Vary: Authorization`. A missing `private` directive can leak user data through shared caches.
- **Monitoring 304 Rates**: Track the ratio of 304 to 200 responses. A low 304 rate indicates clients are not sending conditional headers, reducing caching effectiveness.
- **Debugging Cached Responses**: During development, disable caching via `Cache-Control: no-store` or by adding a query parameter `?nocache=1` that bypasses cache middleware.
- **CDN Configuration**: If using Cloudflare, Fastly, or Akamai, ensure cache directives are compatible with the CDN's behavior. Some CDNs ignore `private` directives on HTTPS connections.

## Common Mistakes
- **No Cache Headers on GET Responses**: Returning JSON responses without any `Cache-Control` directive. Browsers and proxies may cache these according to heuristics, causing unpredictable behavior.
- **Public Cache on Authenticated Data**: Setting `Cache-Control: public` on responses that contain user-specific data. This leaks private data to other users through shared caches.
- **ETag on POST Responses**: Setting ETags on POST responses. POST is not cacheable by default; ETags on POST are useless.
- **Missing Vary Header**: Omitting `Vary: Accept` on endpoints that support content negotiation. Caches may serve JSON responses to clients expecting XML or vice versa.
- **Overly Aggressive Caching**: Setting `max-age=86400` on fast-changing resources. Clients see stale data for up to 24 hours.
- **Caching Error Responses**: Setting `Cache-Control: public` on 4xx/5xx responses. Caching error responses means clients receive stale errors even after the issue is resolved.

## Failure Modes
- **Stale Data from Shared Cache**: A CDN or proxy caches a response with `max-age=3600`. The resource is updated, but the cache doesn't refresh for an hour. Clients receive stale data.
- **ETag Collision**: Different resources produce the same ETag hash (extremely rare with MD5/SHA256 but possible). The server returns 304 when the resource has actually changed.
- **Cache Poisoning**: A malicious request causes a error response to be cached. All subsequent clients receive the error. Mitigate with `no-store` on 5xx responses.
- **Private Data Served Publicly**: A missing `private` directive on a user profile response allows a CDN to cache and serve it to other users. Critical privacy failure.
- **Vary Header Proliferation**: Adding too many headers to `Vary` (e.g., `Vary: Cookie, Authorization, Accept, Accept-Language, X-Custom`) fragments the cache into unusably small segments.

## Ecosystem Usage
- **Laravel Framework**: `Illuminate\Http\Response` supports `setCache()`, `setTtl()`, `setEtag()`, `setLastModified()` methods. Middleware-based caching is implemented manually or via packages.
- **Spatie/laravel-responsecache**: Caches full responses to files/Redis based on cache profiles. Returns cached responses without hitting the application. Supports ETag and cache tags for invalidation.
- **Barryvdh/laravel-httpcache**: Integrates Laravel with Varnish and other HTTP cache infrastructure. Adds `Cache-Control` headers based on configuration.
- **Laravel Page Cache (Spatie)**: Caches full GET responses as static files for extreme performance. Designed for public, non-personalized content.
- **Varnish Cache**: A popular HTTP cache that respects RFC-compliant cache headers. Many high-traffic Laravel APIs deploy Varnish in front of the application.
- **Cloudflare**: Enterprise CDN that respects `Cache-Control`, `ETag`, and `Vary` headers. Provides additional caching rules and purge APIs.

## Related Knowledge Units
### Prerequisites
- envelope-response-design

### Related Topics
- response-compression

### Advanced Follow-up Topics
- response-versioning

---

## Research Notes

### Source Analysis
- HTTP/1.1 Caching Specification (RFC 7234) — `Cache-Control`, `ETag`, `Last-Modified`, `Vary`
- `Illuminate\Http\Response` — `setCache()`, `setTtl()`, `setEtag()`, `setLastModified()` methods
- `Illuminate\Http\Request` — `If-None-Match`, `If-Modified-Since` header access
- `Spatie\ResponseCache\Middlewares\CacheResponse` — response caching middleware

### Key Insight
ETags computed from model timestamps (`md5($model->updated_at . $model->id)`) are an order of magnitude cheaper than full-content hashing and achieve the same validation result — the resource never needs to be serialized just to generate the ETag.

### Version-Specific Notes
- Laravel 10/11/12/13: `Response::setCache()` accepts the same array keys across versions
- No native ETag middleware in Laravel core — must be implemented manually or via packages (Spatie, Barryvdh)
- `Vary` header support consistent; trusted proxy configuration required for correct scheme detection in cached responses
