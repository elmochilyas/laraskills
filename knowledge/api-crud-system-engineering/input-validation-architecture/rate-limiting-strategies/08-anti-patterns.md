# Rate Limiting Strategies — Anti-Patterns

## Using File Cache for Rate Limits
**Description:** Using default `file` cache driver for rate limit storage in production.
**Why it happens:** Developers don't configure Redis and rely on Laravel's default file cache.
**Consequences:** File cache locking is unreliable under concurrent requests; rate limits are bypassed.
**Better approach:** Use Redis or database-backed cache for atomic rate limit counters.

## Per-IP Only Limiting on Authenticated Endpoints
**Description:** Rate limiting authenticated endpoints solely by IP address without per-user fallback.
**Why it happens:** Simpler implementation; developers think IP is sufficient for all cases.
**Consequences:** Users behind shared IPs (corporate VPN, NAT) share a limit pool; legitimate users get rate limited due to others.
**Better approach:** Use user ID as the primary key for authenticated requests, fall back to IP for guests.

## Single Global Rate Limiter
**Description:** Using one rate limiter for all endpoints regardless of cost or sensitivity.
**Why it happens:** Simplicity — one limiter covers everything.
**Consequences:** Expensive endpoints (reporting, file upload) get the same limit as cheap endpoints (list, show); cheap endpoints can be abused to exhaust shared limits.
**Better approach:** Define separate rate limiters for different endpoint categories based on compute cost and sensitivity.

## Ignoring 429 Responses
**Description:** Returning a generic 429 without `Retry-After` header or meaningful error message.
**Why it happens:** Default Laravel 429 response is used without customization.
**Consequences:** Clients cannot implement exponential backoff; users receive unhelpful error messages.
**Better approach:** Return structured 429 with `Retry-After` header, human-readable message, and rate limit reset information.
