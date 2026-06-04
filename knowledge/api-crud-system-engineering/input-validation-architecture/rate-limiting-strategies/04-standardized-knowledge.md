# Rate Limiting Strategies — Standardized Knowledge

## Overview
Rate limiting protects API endpoints from abuse by capping the number of requests a client can make within a time window. Laravel 13 provides two mechanisms: the `throttle` middleware for simple static limits, and named rate limiters via `RateLimiter` facade for dynamic, role-based, or tiered limits. Both integrate with the cache system (Redis recommended for production) and support per-user, per-IP, and segmented limiting strategies.

## Key Concepts
- **throttle Middleware**: Simple static rate limiting. Syntax: `throttle:60,1` (60 requests per minute). Applied in routes or controllers.
- **Named Rate Limiters**: Dynamic limits defined in `AppServiceProvider::boot()` using `RateLimiter::for('name', fn)`. Support closures returning per-user limits.
- **RateLimiter Facade**: Provides programmatic access to check limits, consume attempts, and retrieve remaining attempts.
- **Segments**: Limit groups can be segmented by user ID, IP, or custom keys to prevent one user exhausting shared limits.

## Implementation
Define named rate limiters in `AppServiceProvider::boot()`:

```php
use Illuminate\Support\Facades\RateLimiter;

RateLimiter::for('api', function (Request $request) {
    $user = $request->user();
    $key = $user ? 'api:user:'.$user->id : 'api:guest:'.$request->ip();

    return Limit::perMinute($user?->tier === 'premium' ? 300 : 60)
        ->by($key)
        ->response(function () {
            return response()->json(['message' => 'Too many requests'], 429);
        });
});
```

Apply in routes:
```php
Route::middleware('throttle:api')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
});
```

## Best Practices
- Use named rate limiters with dynamic closures for tiered access
- Rate limit by user ID for authenticated endpoints, by IP for public endpoints
- Set lower guest limits and higher authenticated limits
- Return meaningful 429 responses with `Retry-After` headers
- Use Redis for rate limit storage in production environments
