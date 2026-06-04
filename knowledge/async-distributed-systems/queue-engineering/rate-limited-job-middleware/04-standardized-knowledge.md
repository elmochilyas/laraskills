# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Middleware
- **Knowledge Unit:** K050 — `RateLimited` Job Middleware
- **Knowledge ID:** K050
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Job Middleware
  - Laravel Source — `Illuminate\Queue\Middleware\RateLimited`, `Illuminate\Queue\Middleware\RateLimitedWithRedis`

---

# Overview

The `RateLimited` middleware prevents a job from executing more than N times per time window, using Laravel's `RateLimiter` facade backed by cache (typically Redis). When the rate limit is exceeded, the job is released back to the queue with a delay equal to the time until the limit resets. It's essential for jobs that hit external APIs with rate constraints.

---

# Core Concepts

- **`RateLimiter` facade**: Underlying API. Defines named limiters with `maxAttempts` and `decayMinutes`.
- **Middleware application**: Return `new RateLimited('limiter_name')` from the job's `middleware()` method.
- **Rate limit exceeded**: Job is released with `release($secondsUntilReset)`. Does not consume a queue retry attempt.
- **Per-job scoping**: Rate limits can be scoped per job instance (e.g., per user, per API key) via custom key generation.
- **`RateLimitedWithRedis`**: Redis-specific variant with better performance via direct atomic Redis operations.

---

# When To Use

- Jobs that call external APIs with documented rate limits
- When proactive rate limiting is needed (before execution)
- Per-resource rate limiting (different API keys, different limits)

---

# When NOT To Use

- Reactive backpressure — use `ThrottlesExceptions` instead (detects failures, not prevents execution)
- Jobs that don't call rate-limited external resources
- Simple one-off jobs where rate limiting adds unnecessary complexity

---

# Best Practices

- **Scope rate limit keys per resource.** Use job properties (user ID, API key) to scope the limiter key. *Why: Without scoping, one user's API calls exhaust the rate limit for all users — the key defaults to the job class name only.*
- **Match `decayMinutes` to the external API's reset period.** If the API resets per minute, use 1 minute. If per hour, use 60. *Why: Mismatched windows cause either aggressive throttling (too short) or insufficient protection (too long).*
- **Prefer `RateLimitedWithRedis` when using Redis.** It's more efficient — uses direct Redis atomic operations instead of the generic cache `increment()`. *Why: Redis-specific middleware skips the cache abstraction layer, reducing overhead by ~2ms per check.*
- **Set release delay to match window reset.** The default release delay is the time until the window resets — don't override unless you have a specific reason. *Why: Releasing before the window resets causes the job to immediately hit the rate limit again, creating a tight retry loop.*

---

# Performance Considerations

- Each rate limit check adds ~1-5ms (cache read + increment).
- High key cardinality (e.g., per-user limits for 100K users) creates many cache keys.
- Rate-limited jobs may spend 90% of their time waiting for window resets.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not scoping rate limit keys | Default is class name only | Cross-resource starvation — one user blocks all | Scope key with `->key(fn($j) => $j->apiKey)` |
| Window shorter than max job time | Setting 1-min window for 2-min job | Counter resets mid-execution — burst of activity | Set window >= max job duration |
| Confusing `RateLimited` with `ThrottlesExceptions` | Both involve rate limiting | Wrong pattern for the job's needs | Use `RateLimited` for proactive, `ThrottlesExceptions` for reactive |

---

# Anti-Patterns

- **Global rate limiting without scoping:** One job instance exhausts the limit for all instances of that class.
- **Tight release delay (< 1 second):** Job retries instantly, hits the limit, releases — burn CPU with no progress.

---

# Examples

```php
class ProcessApiRequest implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public string $apiKey) {}

    public function middleware(): array
    {
        return [(new RateLimited('api-requests'))->key(fn($j) => $j->apiKey)];
    }

    public function handle(): void
    {
        // API call logic
    }
}
```

---

# Related Topics

- **K051 ThrottlesExceptions Middleware (K051)** — Reactive counterpart
- **K053 Spatie Rate-Limited Job Middleware (K053)** — Alternative implementation
- **K076 RateLimiter Facade (K076)** — Underlying API
