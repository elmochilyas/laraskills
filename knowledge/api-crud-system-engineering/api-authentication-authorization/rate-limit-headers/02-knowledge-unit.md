# Rate Limit Headers

## Metadata (Domain: API & CRUD System Engineering, Subdomain: API Authentication & Authorization, Last Updated: 2026-06-02)

## Executive Summary
Rate limit headers communicate a client's current rate limit status via HTTP response headers. Standard headers include `X-RateLimit-Limit` (maximum requests allowed in the window), `X-RateLimit-Remaining` (remaining requests in the current window), and `X-RateLimit-Reset` (Unix timestamp when the window resets). On rate limit exceedance, the `Retry-After` header tells the client how many seconds to wait before retrying. Proper rate limit headers enable clients to self-regulate their request rate, avoid 429 errors, and implement intelligent backoff strategies.

## Core Concepts
- **`X-RateLimit-Limit`**: The maximum number of requests the client is allowed in the current time window.
- **`X-RateLimit-Remaining`**: The number of requests remaining in the current window. Decrements with each request.
- **`X-RateLimit-Reset`**: Unix timestamp (seconds since epoch) when the rate limit window resets and the counter returns to `Limit`.
- **`Retry-After`**: Sent with 429 responses. The number of seconds the client must wait before the next request (integer or HTTP-date).
- **`X-RateLimit-Tier`** (custom): The current auth tier (guest, user, premium, service) for transparency.
- **Window type**: Fixed window (counter resets at a specific time) or sliding window (counter decays continuously).

## Mental Models
- **Rate limit headers as fuel gauge**: `Limit` is the fuel tank capacity, `Remaining` is the fuel left, `Reset` is when the tank refills. Keep driving until empty, then wait for refill.
- **`Retry-After` as red light**: The server is saying "Stop! Wait N seconds before trying again." Ignoring this is running a red light.
- **Headers as contract**: These headers form a contract between the server and client. The server guarantees the limits, and the client is expected to respect them.

## Internal Mechanics
- Laravel's `ThrottleRequests` middleware automatically sets `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` on every response for rate-limited routes.
- `X-RateLimit-Limit`: Retrieved from the `Limit` instance's `$maxAttempts` property.
- `X-RateLimit-Remaining`: Calculated as `maxAttempts - currentAttempts`.
- `X-RateLimit-Reset`: Calculated as `time() + availableIn` where `availableIn = decaySeconds - (time() - windowStart)`.
- When the limit is exceeded, the middleware returns a 429 response with `Retry-After: <seconds>`.
- `Retry-After` can be an integer (seconds) or an HTTP-date string. Laravel uses the integer format.
- The `ThrottleRequestsWithRedis` middleware in Octane performs the same operations with Redis-optimized atomic operations.

## Patterns
- **Standard header implementation**: Laravel's default. Enabled automatically by the `throttle` middleware. No additional code needed.
- **Custom response headers middleware**: Middleware that adds `X-RateLimit-Tier` by inspecting the authenticated user's tier:
  ```php
  $response->header('X-RateLimit-Tier', $tier);
  ```
- **RFC 6585 compliant 429 response**: Include `Retry-After` as both seconds and date for compatibility:
  ```php
  return response()->json([...], 429)
      ->header('Retry-After', $seconds)
      ->header('X-RateLimit-Limit', $limit)
      ->header('X-RateLimit-Remaining', 0);
  ```
- **Client-side header consumption**: The frontend reads `X-RateLimit-Remaining` before each request and implements a local queue when remaining is low.
- **Dashboard display**: Admin UI that shows `X-RateLimit-Remaining / X-RateLimit-Limit` as a progress bar for API consumers.

## Architectural Decisions
1. **Header naming convention**: `X-RateLimit-*` prefix is a de facto standard but non-standard. The IETF standardized `RateLimit-*` (RFC 9213). Support both for maximum compatibility.
2. **Reset as timestamp vs datetime**: Timestamp (Unix epoch seconds) is machine-readable and universally supported. Avoid full datetime strings.
3. **Include tier in headers**: Custom headers like `X-RateLimit-Tier` or `X-RateLimit-Auth-Tier` help clients understand which tier's limits apply.
4. **Multiple bucket header representation**: When using multi-bucket limits, Laravel sends headers for the most restrictive bucket. For full transparency, include headers for each bucket.

## Tradeoffs (table)
| Aspect | `X-RateLimit-*` (custom) | `RateLimit-*` (RFC 9213) | No headers |
|--------|-------------------------|-------------------------|------------|
| Standard compliance | Widely used but non-standard | IETF standard | N/A |
| Client support | Universal (GitHub, Stripe) | Growing | None |
| Implementation in Laravel | Automatic | Requires custom middleware | N/A |
| Discoverability | Well-known | Newer, less known | N/A |
| Future compatibility | May be deprecated | Forward-looking | N/A |

## Performance Considerations
- Setting headers is free (response is already built). No performance impact.
- Calculating `Reset` requires computing `time() + availableIn`. The `availableIn` is already computed for rate limit enforcement. No additional cost.
- For multi-bucket limits, Laravel calculates the minimum `availableIn` across all buckets. This is negligible.

## Production Considerations
- **Header consistency**: Ensure all endpoints return rate limit headers, not just the ones with explicit `throttle` middleware. Wrap with a global middleware that adds default headers.
- **CORS exposure**: Expose rate limit headers to browser clients via `Access-Control-Expose-Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After`.
- **Clock synchronization**: The `Reset` header timestamp is based on server time. NTP-sync all servers to ensure the `Reset` value is consistent across requests to different server instances.
- **Documentation**: Document the exact semantics of each header. Clarify whether `Remaining` counts the current request or requests after it.
- **Debugging**: Include rate limit headers in development API responses. Developers building integrations need to see these headers to implement client-side rate limiting.

## Common Mistakes
- Setting `X-RateLimit-Reset` as a relative offset (seconds remaining) instead of an absolute Unix timestamp.
- Exposing the wrong `Limit` value when using multi-bucket limits (should be the most restrictive limit, not the sum).
- Not exposing rate limit headers via CORS, causing browser-based API clients to be unable to read them.
- Using `Retry-After` as a date string but parsing it inconsistently on the client side.
- Omitting `X-RateLimit-Remaining: 0` in 429 responses — clients need to see 0 remaining to understand why they were blocked.
- Setting `X-RateLimit-Limit` to the original limit in a 429 response instead of showing 0 remaining.

## Failure Modes
1. **`Reset` timestamp in the past**: Clock skew between web server and cache server causes negative `availableIn`. Solution: Ensure NTP sync; clamp `Reset` to `time() + 1` minimum.
2. **Inconsistent responses across server instances**: Server A returns `Remaining: 5`, Server B (with different clock) returns `Remaining: 3`. Solution: Use centralized cache (Redis) for rate limit state.
3. **Client ignores `Retry-After`**: Client retries immediately after 429, causing repeated 429 responses and wasted resources. Solution: Enforce strict `Retry-After` on the server; optionally blacklist clients that ignore it.
4. **Headers stripped by reverse proxy**: Nginx or Cloudflare strips `X-*` headers. Solution: Use the standard `RateLimit-*` headers or configure the proxy to pass custom headers through.
5. **Integer overflow in `Reset`**: 32-bit systems: timestamp after 2038-01-19 exceeds `PHP_INT_MAX` on 32-bit. Solution: Ensure 64-bit systems; use float if necessary.

## Ecosystem Usage
- **GitHub API**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `X-RateLimit-Used`.
- **GitLab API**: `RateLimit-*` (RFC 9213 style), `Retry-After`.
- **Stripe API**: `X-Request-Id` with rate limit headers in the response. Rate limit headers are documented per endpoint.
- **Twitter/X API**: `x-rate-limit-limit`, `x-rate-limit-remaining`, `x-rate-limit-reset` (lowercase).

## Related Knowledge Units
### Prerequisites
- HTTP response headers
- Rate limiter definition basics

### Related Topics
- [rate-limiting-by-auth-tier](./phase-2/09-rate-limiting-by-auth-tier.md)
- [rate-limiter-definition](./phase-2/10-rate-limiter-definition.md)
- [ip-based-rate-limiting](./phase-2/14-ip-based-rate-limiting.md)

### Advanced Follow-up Topics
- IETF RFC 9213 (RateLimit header fields)
- Client-side rate limiting algorithms (token bucket, leaky bucket)
- Retry-After header specification (RFC 7231 Section 7.1.3)

## Research Notes
### Source Analysis
Laravel's `Symfony\Component\HttpFoundation\Response` sets headers. The `ThrottleRequests` middleware in `vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php` adds the rate limit headers.

### Key Insight
Rate limit headers are as important as enforcement. Without headers, clients cannot build intelligent retry logic, leading to "thundering herd" problems where all clients retry simultaneously after a 429. The `Reset` timestamp allows clients to synchronize their retry timing, avoiding this cascade.

### Version-Specific Notes
- **Laravel 8+**: Rate limit headers are sent automatically with the `throttle` middleware.
- **RFC 9213 (2022)**: Standardized `RateLimit-*` headers. Consider supporting both `X-RateLimit-*` and `RateLimit-*` for forward compatibility.
- **PHP 8.x**: No changes to header handling. `time()` returns 64-bit integer on 64-bit systems.

## Tradeoffs

**Benefit:** Centralized, consistent pattern. **Cost:** Additional abstraction layer, indirection. **Consequence:** Cleaner controllers but requires team discipline to maintain separation.