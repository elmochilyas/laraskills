# Phase 5: Rules — Rate Limit Headers

> Generated from 04-standardized-knowledge.md

## Always Return Rate Limit Headers on Every Rate-Limited Endpoint
---
## Category
Design
---
## Rule
Always include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers on every rate-limited endpoint response.
---
## Reason
Clients need consistent header presence to build reliable backoff logic. Inconsistent header presence forces clients to guess whether rate limiting is active, leading to thundering herd problems.
---
## Bad Example
```php
// Some endpoints have headers, others don't
```

---
## Good Example
```php
// Laravel's throttle middleware adds these automatically
Route::middleware('throttle:api')->group(function () {
    // All routes here consistently return rate limit headers
});
```

---
## Exceptions
Endpoints not subject to rate limiting (health checks, monitoring).
---
## Consequences Of Violation
Client-side backoff logic unreliable; thundering herd on rate-limited endpoints.

---
## Use Absolute Unix Timestamps for X-RateLimit-Reset
---
## Category
Design
---
## Rule
Always use absolute Unix epoch timestamps (seconds since 1970-01-01) for `X-RateLimit-Reset`, never relative offsets.
---
## Reason
Relative offsets require clients to track time locally and add the offset, introducing clock-drift errors. Absolute timestamps enable accurate client-side scheduling regardless of client clock sync.
---
## Bad Example
```php
// Relative offset — client must add current time
$response->headers->set('X-RateLimit-Reset', 60);
```

---
## Good Example
```php
// Absolute Unix timestamp — client compares directly
$response->headers->set('X-RateLimit-Reset', now()->addSeconds(60)->timestamp);
```

---
## Exceptions
No common exceptions. Always use absolute timestamps.
---
## Consequences Of Violation
Incorrect client-side backoff timing; premature or delayed retry requests.

---
## Always Include Retry-After on 429 Responses
---
## Category
Reliability
---
## Rule
Always send the `Retry-After` header with the exact number of seconds to wait on every 429 (Too Many Requests) response.
---
## Reason
Without `Retry-After`, clients have no guidance on when to retry. They may retry immediately, causing cascading 429s and a thundering herd problem as all blocked clients retry simultaneously.
---
## Bad Example
```php
return response()->json(['message' => 'Too many requests'], 429);
// No Retry-After — client must guess wait time
```

---
## Good Example
```php
return response()->json([
    'message' => 'Too many requests',
    'retry_after' => $seconds,
], 429)
->header('Retry-After', $seconds)
->header('X-RateLimit-Remaining', 0);
```

---
## Exceptions
No common exceptions. All 429 responses require Retry-After.
---
## Consequences Of Violation
Thundering herd retry storms; cascading rate limit failures across all clients.

---
## Expose Rate Limit Headers via CORS for Browser Clients
---
## Category
Framework Usage
---
## Rule
Always expose rate limit headers in CORS configuration so browser-based clients can read them.
---
## Reason
Browsers block JavaScript from accessing non-exposed response headers. Without `Access-Control-Expose-Headers`, client-side JS cannot read `X-RateLimit-*` headers and cannot implement backoff.
---
## Bad Example
```php
// config/cors.php
'exposed_headers' => [],
// Rate limit headers invisible to JS
```

---
## Good Example
```php
'exposed_headers' => [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Retry-After',
],
```

---
## Exceptions
Internal APIs with no browser-based consumers — but exposing headers has no security downside.
---
## Consequences Of Violation
Browser API clients cannot access rate limit status; no client-side backoff capability.

---
## Include X-RateLimit-Remaining: 0 in 429 Responses
---
## Category
Design
---
## Rule
Always set `X-RateLimit-Remaining: 0` on 429 responses alongside `Retry-After`.
---
## Reason
Clients polling `X-RateLimit-Remaining` see no change without it (the value may still show the previous count). Setting it to 0 signals clearly that the limit is exhausted.
---
## Bad Example
```php
return response()->json([...], 429)
    ->header('Retry-After', 60);
// X-RateLimit-Remaining may still show 0 or stale value
```

---
## Good Example
```php
return response()->json([...], 429)
    ->header('Retry-After', 60)
    ->header('X-RateLimit-Limit', 60)
    ->header('X-RateLimit-Remaining', 0);
```

---
## Exceptions
No common exceptions. Always set remaining to 0 on 429.
---
## Consequences Of Violation
Client confusion about rate limit state; polling loops that never detect exhaustion.

---
## Never Strip Rate Limit Headers at Reverse Proxy
---
## Category
Reliability
---
## Rule
Always ensure your reverse proxy (Nginx, Cloudflare, AWS ALB) passes through rate limit headers without stripping or overriding them.
---
## Reason
Reverse proxies often strip unknown headers by default. Rate limit headers stripped at the proxy level are invisible to clients, defeating their purpose.
---
## Bad Example
```php
// Nginx strip unknown headers by default
// X-RateLimit-Limit headers stripped without explicit config
```

---
## Good Example
```php
# Nginx: explicitly pass through rate limit headers
proxy_pass_header X-RateLimit-Limit;
proxy_pass_header X-RateLimit-Remaining;
proxy_pass_header X-RateLimit-Reset;
proxy_pass_header Retry-After;
```

---
## Exceptions
No common exceptions. Verify header pass-through in your proxy configuration.
---
## Consequences Of Violation
Clients never receive rate limit headers despite server setting them correctly.

---
## Support Both X-RateLimit-* and RateLimit-* (RFC 9213) Headers
---
## Category
Scalability
---
## Rule
Always include both `X-RateLimit-*` (legacy) and `RateLimit-*` (RFC 9213 standard) header names on responses.
---
## Reason
The `RateLimit-*` header format is the emerging standard (RFC 9213). Supporting both ensures compatibility with legacy clients while adopting the standard for future-proofing.
---
## Bad Example
```php
// Only legacy headers
$response->headers->set('X-RateLimit-Limit', $limit);
```

---
## Good Example
```php
$response->headers->set('X-RateLimit-Limit', $limit);
$response->headers->set('RateLimit-Limit', $limit);
$response->headers->set('X-RateLimit-Remaining', $remaining);
$response->headers->set('RateLimit-Remaining', $remaining);
$response->headers->set('X-RateLimit-Reset', $reset);
$response->headers->set('RateLimit-Reset', $reset);
```

---
## Exceptions
Internal APIs with known, controlled clients using only one header format.
---
## Consequences Of Violation
Newer clients expecting standard header names fail to detect rate limits; legacy clients break if old headers are dropped.

---
## Use 64-Bit PHP to Prevent 2038 Integer Overflow
---
## Category
Reliability
---
## Rule
Always run PHP on a 64-bit system to ensure `X-RateLimit-Reset` Unix timestamps do not overflow past 2038-01-19.
---
## Reason
32-bit PHP stores timestamps as signed 32-bit integers, which overflow on 2038-01-19T03:14:07Z. After that date, rate limit reset times become negative numbers, breaking all client-side backoff logic.
---
## Bad Example
```php
// 32-bit PHP: time() after 2038-01-19 returns negative
$reset = time() + 3600; // -2147483648 on overflow
```

---
## Good Example
```php
// 64-bit PHP: time() handles dates far beyond 2038
$reset = Carbon::now()->addHour()->timestamp;
```

---
## Exceptions
APIs that will be decommissioned before 2038 — rare.
---
## Consequences Of Violation
Rate limit reset timestamps become negative after 2038-01-19; all rate-limited endpoints break.
