# Rate Limiting Strategies — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | api-crud-system-engineering |
| Subdomain | input-validation-architecture |
| Knowledge Unit | rate-limiting-strategies |

## Rules

### Rule: Use Named Rate Limiters for Dynamic Limits
- **Condition:** When rate limits vary by user role, tier, or authentication status
- **Action:** Define named rate limiters in `AppServiceProvider::boot()` using `RateLimiter::for()` with a closure returning `Limit::perMinute()`.
- **Consequence:** Each request resolves its limit dynamically; no hardcoded static values.
- **Enforcement:** Review ensures `throttle` middleware is not used for tiered limits.

### Rule: Rate Limit by User ID When Authenticated
- **Condition:** When applying rate limits to authenticated endpoints
- **Action:** Use `$request->user()->id` as the rate limit key via `Limit::by()`.
- **Consequence:** Users are individually accountable; one user cannot exhaust another's limit.
- **Enforcement:** Integration tests verify per-user rate limits are independent.

### Rule: Rate Limit by IP for Public Endpoints
- **Condition:** When applying rate limits to unauthenticated or public endpoints
- **Action:** Use `$request->ip()` as the rate limit key.
- **Consequence:** Guest traffic is rate limited even without user identity.
- **Enforcement:** Tests with different IPs verify independent limits.

### Rule: Return Retry-After Header on 429
- **Condition:** When rate limit is exceeded and returning 429 response
- **Action:** Include `Retry-After` header with the number of seconds until the limit resets.
- **Consequence:** Clients can implement client-side backoff.
- **Enforcement:** Integration test verifies `Retry-After` header on 429 responses.

### Rule: Use Redis for Rate Limit Storage in Production
- **Condition:** When deploying to production with rate limiting
- **Action:** Configure `CACHE_STORE=redis` in production environment.
- **Consequence:** Rate limit counters are atomic, distributed, and survive application restarts.
- **Enforcement:** Deployment checklist includes cache driver verification.
