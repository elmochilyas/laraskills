# Rule Card: K050 — `RateLimited` Job Middleware

---

## Rule 1

**Rule Name:** scope-rate-limit-keys-per-resource

**Category:** Always

**Rule:** Always scope rate limit keys per resource using the `->key()` method.

**Reason:** Without scoping, the key defaults to the job class name — one user's API calls exhaust the limit for all users.

**Bad Example:**
```php
public function middleware(): array
{
    return [new RateLimited('api-requests')];
    // Global key — all API keys share the same limit
}
```

**Good Example:**
```php
public function middleware(): array
{
    return [(new RateLimited('api-requests'))->key(fn($j) => $j->apiKey)];
    // Per-resource key — each API key has its own limit
}
```

**Exceptions:** Jobs where the rate limit is truly global (e.g., a shared third-party service with one API key) may omit scoping.

**Consequences Of Violation:** A high-volume user exhausts the rate limit for all users — every other user's API calls are throttled until the window resets.

---

## Rule 2

**Rule Name:** match-decay-to-api-reset

**Category:** Always

**Rule:** Always match `decayMinutes` to the external API's rate limit reset period.

**Reason:** Mismatched windows cause either aggressive throttling (window too short) or insufficient protection (window too long).

**Bad Example:**
```php
RateLimiter::for('api-requests', fn($job) => Limit::perMinute(60));
// API resets hourly — 60 per minute is 3600 per hour, 60x the actual limit
```

**Good Example:**
```php
RateLimiter::for('api-requests', fn($job) => Limit::perHour(3600));
// Matches API's hourly reset — correct limit
```

**Exceptions:** When the external API doesn't document its reset period, choose a conservative window and adjust based on observed throttling.

**Consequences Of Violation:** A per-minute window of 60 over 60 minutes allows 3600 requests — but the API only allows 3600 per hour. The 3601st request in the last minute is blocked even though the rate hasn't been exceeded in the hour.

---

## Rule 3

**Rule Name:** prefer-rate-limited-with-redis

**Category:** Prefer

**Rule:** Prefer `RateLimitedWithRedis` when using Redis as the queue backend.

**Reason:** The Redis-specific variant uses direct atomic Redis operations instead of the generic cache abstraction — reducing overhead by ~2ms per check.

**Bad Example:**
```php
return [(new RateLimited('api-requests'))->key(fn($j) => $j->apiKey)];
// Generic — goes through cache abstraction layer
```

**Good Example:**
```php
use Illuminate\Queue\Middleware\RateLimitedWithRedis;

return [(new RateLimitedWithRedis('api-requests'))->key(fn($j) => $j->apiKey)];
// Redis-specific — direct atomic increment, lower latency
```

**Exceptions:** When using a non-Redis queue backend, use the generic `RateLimited`.

**Consequences Of Violation:** ~2ms extra overhead per rate limit check — at 50,000 jobs/hour, that's 100 seconds/hour of overhead from using the generic wrapper instead of the Redis-specific middleware.

---

## Rule 4

**Rule Name:** dont-override-release-delay

**Category:** Never

**Rule:** Never override the default release delay in `RateLimited` middleware.

**Reason:** The default delay matches the time until the window resets — overriding it causes tight retry loops or excessive waits.

**Bad Example:**
```php
return [(new RateLimited('api-requests'))
    ->key(fn($j) => $j->apiKey)
    ->releaseAfterSeconds(5)]; // 5 seconds — but window resets in 50 seconds
```

**Good Example:**
```php
return [(new RateLimited('api-requests'))
    ->key(fn($j) => $j->apiKey)];
    // Default delay = time until window reset — correct behavior
```

**Exceptions:** When you intentionally want the job to retry before the window resets (e.g., multiple rate limiters on different resources), custom delays may be justified.

**Consequences Of Violation:** A job released after 5 seconds retries immediately — hits the rate limit again, releases again, creating a tight retry loop that burns CPU until the window naturally resets.
