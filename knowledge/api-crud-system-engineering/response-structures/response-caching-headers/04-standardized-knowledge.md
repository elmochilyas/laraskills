# response-caching-headers

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: response-structures
- Knowledge Unit: response-caching-headers
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Response caching headers control how API responses are cached by clients, browsers, CDNs, and reverse proxies. The key headers are `Cache-Control` (directives for cache behavior), `ETag` (content-based hash for conditional requests), and `Last-Modified` (timestamp-based freshness). Proper cache header design reduces server load, improves client response times, and prevents stale data delivery.

In APIs, caching strategy focuses on ETag-based conditional requests and explicit `Cache-Control` directives. ETags computed from model timestamps (`md5($model->updated_at . $model->id)`) are an order of magnitude cheaper than full-content hashing and achieve the same validation result — the resource never needs to be serialized just to compute the ETag.

## Core Concepts
- **Cache-Control**: Primary header for cache directives — `public`, `private`, `no-cache`, `no-store`, `max-age`, `s-maxage`, `must-revalidate`.
- **ETag**: Opaque identifier (hash of response content or model timestamp) representing a specific resource version. Clients send `If-None-Match`; server returns 304 Not Modified if unchanged.
- **Last-Modified**: Timestamp of last resource modification. Clients send `If-Modified-Since`; server returns 304 if not modified.
- **Vary**: Indicates which request headers determined the response — `Vary: Accept` tells caches to store different versions per Accept header.
- **304 Not Modified**: Empty-body response when a conditional request validates the cached resource is still fresh.
- **Cache Validation vs. Freshness**: Freshness (`max-age`) determines how long a cache can serve without checking. Validation (ETag/Last-Modified) determines whether a stale cached response is still valid.
- **Private vs. Public**: `private` means user-specific, not cacheable by shared caches. `public` means any cache (CDN, proxy) can store the response.

## When To Use
- Read-heavy endpoints where the same data is requested frequently
- Reference data endpoints (countries, categories, configuration) that change rarely
- Public API endpoints served through CDNs
- Mobile API endpoints where bandwidth savings improve UX
- Any GET endpoint returning data that changes less frequently than it is requested

## When NOT To Use
- Real-time or streaming endpoints where freshness is critical
- POST, PUT, PATCH, DELETE endpoints (not cacheable by default)
- Endpoints returning user-specific data without `private` directive (privacy risk)
- Endpoints where data changes on every request (unique response per request)
- Error responses (4xx/5xx) — caching error responses serves stale errors

## Best Practices (WHY)
- **Generate ETags from model timestamps**: `md5($model->updated_at->timestamp . $model->id)` avoids serializing the resource just to compute the hash. Full-content hashing costs ~0.1ms per MB.
- **Include Vary: Authorization for authenticated APIs**: Prevents CDNs from serving authenticated responses to unauthenticated users. Critical for data privacy.
- **Set Cache-Control: private on user-specific data**: A missing `private` directive on authenticated endpoints can leak user data through shared caches.
- **Use s-maxage for CDN with max-age=0 for browsers**: Allows CDNs to cache for short durations while forcing browsers to always revalidate. Separates proxy caching from browser caching.
- **Always send conditional headers on GET**: Clients should always send `If-None-Match`. This enables 304 responses, saving 99% of response bandwidth when content is unchanged.

## Architecture Guidelines
- Apply cache headers via middleware, not per-controller. Cache-related middleware runs after authentication (to determine public vs. private) but before compression.
- Different resource types need different caching — reference data gets long `max-age`, user data gets `private, no-cache`.
- For endpoints supporting content negotiation, include `Vary: Accept` to prevent serving wrong content types from cache.
- Use `no-cache` for semantically correct freshness control — it means "always check with the server" not "don't cache."
- Collections where insertions shift content change ETag even if individual items haven't changed — factor collection volatility into caching strategy.
- Test in production that authenticated responses have `Cache-Control: private` and `Vary: Authorization`.

## Performance
- ETag computation via model timestamp costs ~0.01ms — negligible compared to full serialization.
- 304 responses save 99% of response bandwidth compared to 200 with full payload.
- Proper `Cache-Control` directives increase cache hit ratios from 0% to 60-90% for read-heavy endpoints.
- Cache-control middleware adds ~0.01ms per request; ETag middleware adds ~0.05ms for hashing.
- Too many `Vary` headers fragment the cache into unusably small segments — keep `Vary` minimal.

## Security
- Authenticated responses must include `Cache-Control: private` to prevent shared cache contamination.
- Always include `Vary: Authorization` to prevent CDNs from serving authenticated responses to other users.
- Error responses (4xx/5xx) must not be cached — use `no-store` on error responses to prevent cache poisoning.
- ETag does not need to be cryptographically secure — it is a cache validator, not an integrity check.
- BREACH attack: If responses include user input alongside secrets (CSRF tokens), disable compression and consider cache implications.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| No Cache-Control on GET | Returning JSON without any cache directive | Assuming no caching by default | Browsers/proxies may cache unpredictably | Always set explicit `Cache-Control` on every GET response |
| Public cache on authenticated data | `Cache-Control: public` on user-specific responses | Copy-pasting cache config | Leaks private data through shared caches | Use `Cache-Control: private` for any user-specific data |
| Missing Vary header | Omitting `Vary: Accept` on content-negotiated endpoints | Not considering cache variation | Wrong content type served from cache | Always set `Vary: Accept` on multi-format endpoints |
| Overly aggressive caching | `max-age=86400` on fast-changing resources | Optimizing for performance without staleness analysis | Clients see stale data for up to 24 hours | Match `max-age` to actual data change frequency |
| Caching error responses | `Cache-Control: public` on 4xx/5xx responses | Global cache middleware without status code filtering | Stale errors served after issue is resolved | Use `no-store` for error responses |
| ETag on POST responses | Setting ETag on POST responses | Generic middleware applied to all methods | Useless — POST is not cacheable by default | Only set ETags on GET and HEAD responses |

## Anti-Patterns
- **No Cache Headers**: Assuming browsers won't cache API responses. They will, unpredictably.
- **Global Cache-Control Without Variation**: Same `max-age` for reference data and user profiles. Tailor per resource type.
- **ETag on Every Response**: Setting ETags on POST, PUT, PATCH responses where they provide zero value.
- **Vary: \***: Wildcard Vary header disables caching entirely on many CDNs. Be specific.
- **Cache Poisoning via Unvalidated Input**: Caching responses that include unvalidated query parameters. Normalize cache keys.

## Examples
```php
// Middleware setting cache headers based on resource type
public function handle($request, Closure $next)
{
    $response = $next($request);
    
    if ($request->isMethod('GET') && $response->isSuccessful()) {
        // Reference data — cache aggressively
        if ($request->is('api/countries*', 'api/categories*')) {
            $response->header('Cache-Control', 'public, max-age=3600, s-maxage=3600');
        }
        // User-specific data — private, validate on each request
        elseif ($request->is('api/profile*', 'api/settings*')) {
            $response->header('Cache-Control', 'private, no-cache, must-revalidate');
        }
        // General data — short public cache
        else {
            $response->header('Cache-Control', 'public, max-age=60, s-maxage=60');
        }
        
        // Generate weak ETag from model timestamps
        $etag = md5($response->getContent());
        $response->header('ETag', '"' . $etag . '"');
        $response->header('Vary', 'Accept, Authorization');
        
        // Handle conditional request
        if ($request->header('If-None-Match') === '"' . $etag . '"') {
            return response()->noContent(304);
        }
    }
    
    return $response;
}
```

## Related Topics
- **Prerequisites**: envelope-response-design
- **Related**: response-compression
- **Advanced**: response-versioning, conditional-requests (rest-api-design subdomain)

## AI Agent Notes
- Always set explicit `Cache-Control` on GET responses — never leave caching to browser heuristics.
- Use `private` for authenticated responses, `public` for public data.
- Prefer model-timestamp ETags over full-content hashing for performance.
- Set `Vary: Accept, Authorization` on authenticated content-negotiated endpoints.
- Never cache error responses — use `no-store` on 4xx/5xx.

## Verification
- Every GET response includes an explicit `Cache-Control` header.
- Authenticated responses use `Cache-Control: private` and `Vary: Authorization`.
- ETags are set on GET/HEAD responses only — not on POST, PUT, PATCH, DELETE.
- 304 Not Modified responses are returned when `If-None-Match` matches the current ETag.
- Error responses (4xx/5xx) have `Cache-Control: no-store` or equivalent.
- Reference data endpoints have longer `max-age` than user-specific or frequently changing data.
