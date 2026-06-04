# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Threat Mitigation |
| Knowledge Unit | Rate Limiter Facade and Throttle Middleware |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Laravel's `RateLimiter` facade and `throttle` middleware provide rate limiting for routes and API endpoints. `RateLimiter::for()` defines named limiters in `AppServiceProvider::boot()`. The `throttle` middleware applies a named limiter to routes. Laravel includes default limiters for `api`, `login` (Fortify), and `global` (web). Rate limiting protects against brute force attacks, API abuse, and resource exhaustion. The underlying cache driver determines storage: file/Redis/memcached for distributed setups, array for local.

---

## Core Concepts

- **`RateLimiter::for()`**: Define a named limiter. Takes a name and a closure returning `Limit::perMinute()` or `Limit::perSecond()`.
- **`Limit::perMinute($maxAttempts)`**: Allows `$maxAttempts` requests per minute. Returns a `Limit` instance.
- **`throttle` Middleware**: `Route::middleware('throttle:api')` — applies the named `api` limiter to the route group.
- **Sliding Window**: Default algorithm — counts attempts in a sliding time window. More forgiving than fixed window.
- **Fixed Window**: Alternative algorithm — resets count at the start of each window. Can allow bursts at window boundaries.
- **`RateLimiter::hit()`**: Manually increment the attempt counter for a key. Used in custom rate limiting logic.
- **`RateLimiter::remaining()`**: Check remaining attempts for a key. Useful for returning `X-RateLimit-Remaining` headers.

---

## When To Use

- API routes — prevent abuse of public endpoints
- Login/registration forms — prevent brute force attacks
- Any route that could be abused: search, file upload, export, SMS sending
- Paid API tiers — enforce plan-specific limits

## When NOT To Use

- Internal admin routes with trusted users (rate limiting may interfere with legitimate work)
- Webhook receivers (rate-limited webhooks may be re-delivered or dropped)
- When the limiting strategy causes more harm than abuse prevention (set thresholds carefully)

---

## Best Practices

- **Named Limiters Over Inline**: Define limiters in `AppServiceProvider` using `RateLimiter::for()`. Use names in middleware.
- **Tiered Rate Limiting**: Different limits for guests vs authenticated users vs premium users. Use `Limit::perMinute()->by($request->user()?->id ?: $request->ip())`.
- **Return Rate Limit Headers**: Laravel automatically returns `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` headers.
- **Monitor Rate Limit Hits**: Log when users hit rate limits — investigate patterns for abuse.

---

## Architecture Guidelines

- Define limiters in `AppServiceProvider::boot()` or `RouteServiceProvider`
- API root limiter: `RateLimiter::for('api', fn (Request $req) => Limit::perMinute(60)->by($req->user()?->id ?: $req->ip()))`
- Login limiter: Fortify defines a `login` limiter by default — customize in FortifyServiceProvider
- Guest vs authenticated: use `->by()` to differentiate keys
- Throttle middleware on route groups, not individual routes

---

## Performance Considerations

- Rate limiter uses Laravel cache — Redis is fastest for distributed setups
- File cache is slow under high concurrency — use Redis/memcached in production
- In-memory (array) cache for testing: `Cache::driver('array')`
- Rate limit check adds ~0.5-2ms per request (cache read + increment)

---

## Security Considerations

- **Distributed Rate Limiting**: In multi-server setups, use a shared cache (Redis) for rate limit state. File cache is per-server.
- **IP Spoofing**: `$request->ip()` can be spoofed behind proxies. Use `$request->header('X-Forwarded-For')` with trusted proxies.
- **Key Collision**: Ensure rate limit keys are unique per user/per IP. Avoid generic keys that multiple users share.
- **Brute Force Protection**: Login rate limiting is essential — Fortify includes it. Do not disable.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not using named limiters | Inline `throttle:60,1` in routes | Hard to change limits globally | Define named limiters with `RateLimiter::for()` |
| Same limit for all user types | Ignoring user context | Premium users limited same as free | Use `->by()` for different keys per user type |
| File cache for rate limiting | Default config | Rate limits reset per server (inconsistent) | Use Redis/memcached for distributed setups |
| Not handling rate-limit errors gracefully | Default 429 response | Poor UX for legitimate users | Customize 429 response with retry information |

---

## Anti-Patterns

- **No rate limiting on public APIs**: Unauthenticated endpoints can be abused
- **Rate limiting on 2FA challenge without lower threshold**: 2FA is low-volume — limit strictly (5 attempts per hour)
- **Rate limiting by IP only for authenticated users**: Authenticated users should be limited by user ID, not IP

---

## Examples

**Defining named limiters:**
```php
// AppServiceProvider::boot()
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
});

RateLimiter::for('login', function (Request $request) {
    $key = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());
    return Limit::perMinute(5)->by($key);
});
```

**Applying throttle middleware:**
```php
// routes/api.php
Route::middleware('throttle:api')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
```

**Custom rate limit check:**
```php
$key = 'search:' . ($request->user()?->id ?: $request->ip());
if (RateLimiter::tooManyAttempts($key, 30)) {
    $seconds = RateLimiter::availableIn($key);
    return response()->json([
        'message' => 'Too many requests. Try again in ' . $seconds . ' seconds.',
        'retry_after' => $seconds,
    ], 429);
}
RateLimiter::hit($key, 60); // decay in 60 seconds
```

---

## Related Topics

- Advanced rate limiting (sliding window, token bucket)
- Plan-aware throttling for SaaS APIs
- Form Request validation
- Brute force protection

---

## AI Agent Notes

- Rate limiting is the primary defense against API abuse. Check if public API routes are throttled.
- The default `api` limiter (60/min) is reasonable for most apps but should be adjusted per endpoint sensitivity.
- Login rate limiting should never be disabled — if Fortify is not used, ensure custom login routes are throttled.

---

## Verification

- [ ] Named limiters defined for API, login, and sensitive endpoints
- [ ] `throttle` middleware applied to route groups (not just individual routes)
- [ ] Guest vs authenticated users differentiated via `->by()`
- [ ] Redis/memcached cache used for rate limiting in production
- [ ] Login rate limiting configured (Fortify default or custom)
- [ ] Rate limit headers returned (automatic with throttle middleware)
- [ ] Rate limit hit events logged/monitored
- [ ] 429 response customized with retry information
