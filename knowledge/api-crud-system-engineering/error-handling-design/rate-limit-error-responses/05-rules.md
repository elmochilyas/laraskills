# Phase 5: Rules — Rate Limit Error Responses

## Rule: Always Include Retry-After Header as Integer Seconds in 429
---
## Category
Framework Usage | Reliability
---
## Rule
Always include the `Retry-After` header in every 429 response as an integer number of seconds; never use the HTTP-date format.
---
## Reason
RFC 7231 prefers delta-seconds as the `Retry-After` format; integer seconds are simpler for programmatic clients to parse than HTTP-date format and eliminate timezone ambiguity.
---
## Bad Example
```php
return response()->json($envelope, 429, [
    'Retry-After' => 'Wed, 21 Oct 2026 07:28:00 GMT', // HTTP-date — harder to parse
]);
```
---
## Good Example
```php
return response()->json($envelope, 429, [
    'Retry-After' => 60, // Integer seconds — trivial to parse
]);
```
---
## Exceptions
No common exceptions — Retry-After in 429 must always be integer seconds.
---
## Consequences Of Violation
Client libraries fail to parse Retry-After; back-off logic broken; automated retry loops cause cascading failures.

---

## Rule: Include X-RateLimit Headers on ALL Responses, Not Just 429
---
## Category
Design | Scalability
---
## Rule
Always include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers on every successful response (not just 429 errors) so clients can self-regulate.
---
## Reason
Clients that see `Remaining: 3` can proactively slow down before hitting the limit, preventing 429 responses entirely. Proactive headers convert reactive throttling to cooperative throttling.
---
## Bad Example
```php
// Headers only on 429 — client always surprised
return response()->json($envelope, 429, [
    'X-RateLimit-Remaining' => 0,
]);
```
---
## Good Example
```php
// Middleware adds headers to every response:
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request);
    $response->headers->set('X-RateLimit-Limit', $this->limiter->getLimit());
    $response->headers->set('X-RateLimit-Remaining', $this->limiter->getRemaining());
    $response->headers->set('X-RateLimit-Reset', $this->limiter->getResetTime());
    return $response;
}
```
---
## Exceptions
No common exceptions — proactive rate limit headers should be present on every response.
---
## Consequences Of Violation
Clients only discover limits when they hit 429; unexpected throttling degrades user experience; retry storms from well-behaved clients.

---

## Rule: Use Distinct Rate Limiters for Login and General API
---
## Category
Security | Scalability
---
## Rule
Always configure separate rate limiters for authentication endpoints (login, register) and general API endpoints; never use a single global limiter.
---
## Reason
Login brute force attacks generate high request volumes that would exhaust a single limiter, blocking legitimate authenticated API traffic. Separate limiters isolate auth abuse from general API access.
---
## Bad Example
```php
// Single limiter for everything — login brute force blocks API
RateLimiter::for('api', fn ($job) => $job->limit(60)->everyMinute());
```
---
## Good Example
```php
// Separate limiters — auth abuse doesn't affect API
RateLimiter::for('login', fn ($job) => $job->limit(5)->everyMinute()->by($job->ip()));
RateLimiter::for('api', fn ($job) => $job->limit(60)->everyMinute()->by($job->user()?->id ?: $job->ip()));
RateLimiter::for('premium', fn ($job) => $job->limit(600)->everyMinute());
```
---
## Exceptions
Single-endpoint internal APIs that have no distinct auth and general traffic patterns.
---
## Consequences Of Violation
Login brute force causes 429 on all API endpoints; legitimate users blocked by auth abuse; denial of service from one vector.

---

## Rule: Apply Rate Limiting Before Authentication Middleware
---
## Category
Architecture | Security
---
## Rule
Always register the rate limit middleware before authentication middleware in the global or route middleware pipeline; never apply rate limiting after authentication.
---
## Reason
Rate limiting before auth catches unauthenticated request floods (DoS, credential stuffing) before they reach the auth layer, reducing auth server load. After-auth rate limiting allows attackers to bypass limits by omitting credentials.
---
## Bad Example
```php
// Rate limit after auth — unauthenticated requests bypass limits
'middleware' => [
    'auth:sanctum',
    'throttle:api', // Only applies to authenticated requests
]
```
---
## Good Example
```php
// Rate limit before auth — all requests limited
'middleware' => [
    'throttle:login',
    'guest', // or auth:sanctum for authenticated routes
]
```
---
## Exceptions
Endpoints that require a user context for rate limit key resolution (e.g., per-user limits). Still apply a lower default limit pre-auth.
---
## Consequences Of Violation
Unauthenticated DoS attacks bypass rate limiting; credential stuffing at full network speed; auth server overwhelmed.

---

## Rule: Map ThrottleRequestsException to Distinct Error Codes per Limiter
---
## Category
Design | Maintainability
---
## Rule
Always map `ThrottleRequestsException` to different error codes based on which rate limiter was hit (login vs. API vs. premium); never use a single code for all rate-limits.
---
## Reason
A rate limit on login (prevent brute force) requires different client action than a rate limit on the general API (slow down). Distinct codes enable distinct client-side handling.
---
## Bad Example
```php
$this->renderable(function (ThrottleRequestsException $e, $request) {
    return response()->json(
        new ErrorEnvelope(ErrorCodes::SYSTEM_RATE_LIMITED, 'Too many requests.', 429),
        429,
    );
    // Same code for login and general API rate limits
});
```
---
## Good Example
```php
$this->renderable(function (ThrottleRequestsException $e, Request $request) {
    $code = match ($this->resolveRateLimiterName($e)) {
        'login' => ErrorCodes::USER_AUTH_RATE_LIMITED,
        'premium' => ErrorCodes::PREMIUM_RATE_LIMITED,
        default => ErrorCodes::SYSTEM_RATE_LIMITED,
    };
    return response()->json(
        new ErrorEnvelope($code, 'Too many requests. Please try again later.', 429),
        429,
    );
});
```
---
## Exceptions
Single-limiter APIs where only one rate limit scenario exists.
---
## Consequences Of Violation
Clients cannot differentiate brute-force detection (change password) from API rate limiting (slow down); incorrect user guidance.

---

## Rule: Mirror Retry Info in Response Body for Header-Restricted Clients
---
## Category
Design | Reliability
---
## Rule
Always include `detail.retry_after_seconds` and `detail.retry_after` (ISO 8601) in the 429 response body in addition to the `Retry-After` header; never rely solely on headers.
---
## Reason
Some client environments (iOS URLSession, Server-Sent Events, WebSockets) restrict access to response headers. Mirroring retry info in the body ensures all clients can implement back-off.
---
## Bad Example
```php
// Retry info only in headers — restricted clients can't read it
return response()->json($envelope, 429, ['Retry-After' => 60]);
```
---
## Good Example
```php
return response()->json(
    new ErrorEnvelope(ErrorCodes::SYSTEM_RATE_LIMITED, 'Too many requests.', 429, [
        'retry_after_seconds' => 60,
        'retry_after' => now()->addSeconds(60)->toIso8601String(),
    ]),
    429,
    ['Retry-After' => 60, 'X-RateLimit-Limit' => 60, 'X-RateLimit-Remaining' => 0],
);
```
---
## Exceptions
No common exceptions — retry info should always be mirrored in the body.
---
## Consequences Of Violation
Mobile apps and WebSocket clients cannot read Retry-After; implement incorrect back-off; repeated 429 responses.

---

## Rule: Use Atomic Cache Operations for Rate Limit Counters
---
## Category
Performance | Reliability
---
## Rule
Always use atomic increment operations (Redis `INCR`, Laravel `RateLimiter::hit()`) for rate limit counters; never use read-then-write operations.
---
## Reason
Read-then-write has a race condition under concurrent requests — two requests can read the same counter, both increment, and both stay under the limit, bypassing the rate limit entirely.
---
## Bad Example
```php
// Read-then-write — race condition allows bypass
$count = Cache::get('rate_limit:' . $key);
if ($count > 60) abort(429);
Cache::put('rate_limit:' . $key, $count + 1, 60);
```
---
## Good Example
```php
// Atomic increment — no race condition
$count = Cache::increment('rate_limit:' . $key, 1);
if ($count === 1) {
    Cache::expire('rate_limit:' . $key, 60);
}
if ($count > 60) abort(429);
// Or use Laravel's built-in:
RateLimiter::hit('login:' . $request->ip());
```
---
## Exceptions
No common exceptions — atomic operations are mandatory for correct rate limiting.
---
## Consequences Of Violation
Rate limit bypass under concurrent requests; effective rate limit is 2x+ the configured value; brute force attacks succeed despite rate limiting.

---

## Rule: Log Rate Limit Hits for Abuse Analysis
---
## Category
Security | Maintainability
---
## Rule
Always log rate limit hits with user ID, IP, endpoint, and timestamp for abuse analysis; never log the full request body or headers.
---
## Reason
Rate limit logs are the primary data source for detecting misconfigured clients, DoS attacks, and credential stuffing. Missing context makes abuse detection impossible.
---
## Bad Example
```php
// Logged without context — cannot detect abuse patterns
Log::info('Rate limit hit');
```
---
## Good Example
```php
Log::info('Rate limit hit', [
    'limiter' => 'login',
    'key' => $request->ip(),
    'user_id' => $request->user()?->id,
    'endpoint' => $request->path(),
    'method' => $request->method(),
    'user_agent' => $request->userAgent(),
    'current_count' => RateLimiter::remaining('login:' . $request->ip()),
]);
```
---
## Exceptions
GDPR/CCPA compliance restricts logging IP addresses; log only endpoint and timestamp with shortened IP.
---
## Consequences Of Violation
Inability to detect credential stuffing; DoS attacks attributed to normal traffic; no forensic data for post-incident analysis.

---

## Rule: Reset Rate Limit Counters on Deploy
---
## Category
Reliability | Scalability
---
## Rule
Always reset rate limit counters during deployment (cache clear or counter flush) to prevent immediate post-deploy throttling of legitimate traffic.
---
## Reason
Rate limit counters persist across deployments. If a deployment takes 30 seconds, in-flight requests during deploy drain the limit window, causing the first post-deploy requests to be immediately throttled.
---
## Bad Example
```php
// Deploy script only runs migrations — rate limit counters persist
php artisan migrate --force
// Post-deploy requests immediately hit 429
```
---
## Good Example
```php
// Deploy script clears rate limit counters
php artisan migrate --force
php artisan cache:clear --tags=rate-limits
// Or in AppServiceProvider:
public function boot(): void
{
    if ($this->app->isDownForMaintenance()) {
        Cache::tags(['rate-limits'])->flush();
    }
}
```
---
## Exceptions
No common exceptions — rate limit counters must be reset on every deploy.
---
## Consequences Of Violation
Post-deploy 429 for all users; degraded user experience after every deployment; unnecessary support tickets.
