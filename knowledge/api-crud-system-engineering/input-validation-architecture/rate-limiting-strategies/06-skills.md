# Rate Limiting Strategies — Skills

## Metadata
| Field | Value |
|---|---|
| Domain | api-crud-system-engineering |
| Subdomain | input-validation-architecture |
| Knowledge Unit | rate-limiting-strategies |

## Skills

### Skill: Define Named Rate Limiters
- **Description:** Create dynamic rate limiters that return different limits based on request context.
- **Steps:**
  1. Open `AppServiceProvider::boot()`
  2. Call `RateLimiter::for('name', fn(Request $request) => ...)`
  3. Inside the closure, inspect `$request->user()` and other context
  4. Return `Limit::perMinute(N)->by($key)` with the appropriate key and limit
- **Context:** Named limiters are referenced by `throttle:name` middleware or `RateLimiter::attempt()`.

### Skill: Apply Throttle Middleware to Routes
- **Description:** Apply rate limiting to route groups or individual routes.
- **Steps:**
  1. For static limits: `Route::get(...)->middleware('throttle:60,1')`
  2. For named limiters: `Route::get(...)->middleware('throttle:api')`
  3. Combine multiple limiters: `middleware(['throttle:api', 'throttle:uploads'])`
- **Context:** Middleware order matters — auth middleware should run before throttle when limits are user-dependent.

### Skill: Custom 429 Response
- **Description:** Customize the response sent when a rate limit is exceeded.
- **Steps:**
  1. In the rate limiter definition, chain `->response(function () { ... })`
  2. Return a `response()->json()` with the desired structure
  3. Set `Retry-After` header using `$retryAfter`
- **Context:** Custom responses should include enough information for clients to adjust behavior.

### Skill: Programmatic Rate Limiting
- **Description:** Use `RateLimiter` facade directly for fine-grained quota management.
- **Steps:**
  1. Check `RateLimiter::tooManyAttempts($key, $maxAttempts)` before processing
  2. Call `RateLimiter::hit($key, $decaySeconds)` to increment counter
  3. Call `RateLimiter::remaining($key, $maxAttempts)` to get remaining attempts
- **Context:** Programmatic limiting is useful for background jobs or custom API endpoints.
