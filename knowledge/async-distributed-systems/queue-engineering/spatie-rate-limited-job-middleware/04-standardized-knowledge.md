# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Middleware
- **Knowledge Unit:** K053 — Spatie `laravel-rate-limited-job-middleware` Package
- **Knowledge ID:** K053
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Spatie Docs — `laravel-rate-limited-job-middleware`
  - Source — `spatie/laravel-rate-limited-job-middleware`

---

# Overview

Spatie's `laravel-rate-limited-job-middleware` provides an alternative to Laravel's built-in `RateLimited` middleware with additional features: explicit configuration per job (intervals, strategy, release behavior), conditional application (control which job instances are rate-limited), and a cleaner API. It uses the same `RateLimiter` facade under the hood but offers more developer-friendly configuration syntax: `RateLimited::allowed(10)->everySeconds(30)`.

---

# Core Concepts

- **`allowed()`:** Define allowed calls per time period: `RateLimited::allowed(10)->everySeconds(30)`.
- **`times()`:** Alternative syntax: `RateLimited::times(10)->everySeconds(30)`.
- **`releaseAfterBackoff()`:** Custom release delay based on time until reset.
- **`releaseAfterSeconds()`:** Fixed release delay.
- **Conditional application:** `->when(fn($job) => $job->shouldRateLimit())` to conditionally apply rate limiting.
- **Intervals:** `everySeconds()`, `everyMinutes()`, `everyHour()`, `everyDay()`.

---

# When To Use

- Per-instance conditional rate limiting (premium users get higher limits)
- When the explicit Spatie syntax is preferred over Laravel's named limiter approach
- Multiple rate limit configurations per job class

---

# When NOT To Use

- Simple uniform rate limiting — Laravel's built-in is simpler and dependency-free
- Projects that minimize package dependencies — this adds an external dependency
- When rate limiting logic is complex enough to warrant a fully custom implementation

---

# Best Practices

- **Always test the `when()` callback.** If the callback always returns `false`, rate limiting is silently disabled. *Why: No error is thrown when `when()` returns false — the job just runs unrestricted. A bug in the condition bypasses rate limiting entirely.*
- **Don't use both Spatie and Laravel rate limiters on the same job.** They operate independently with separate counters. *Why: Two independent rate limiters for the same underlying limit cause unpredictable behavior — one may block while the other allows.*
- **Keep the package updated.** It depends on internal `RateLimiter` APIs that may change between Laravel versions. *Why: Spatie packages are well-maintained but lag behind Laravel releases — test compatibility after upgrades.*

---

# Performance Considerations

- Same underlying `RateLimiter` facade — identical cache overhead to Laravel's built-in.
- Conditional `when()` check adds negligible overhead (callable invocation).
- No additional Redis connections beyond the built-in rate limiter.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using both Spatie and Laravel limiters on same job | Both applied in `middleware()` | Two independent counters for same API limit | Choose one |
| Not testing `when()` callback | Bug in condition | Rate limiting silently bypassed | Unit test the callback |
| `releaseAfterBackoff()` with null release time | Rate limiter key deleted | Release delay = 0 → tight loop | Use `releaseAfterSeconds()` fallback |

---

# Examples

```php
class ApiJob implements ShouldQueue
{
    public function middleware(): array
    {
        return [
            RateLimited::allowed(10)
                ->everySeconds(60)
                ->when(fn($job) => $job->user->isFree())
                ->releaseAfterBackoff(),
        ];
    }
}
```

---

# Related Topics

- **K050 RateLimited Job Middleware (K050)** — Laravel built-in equivalent
- **K076 RateLimiter Facade (K076)** — Underlying API
