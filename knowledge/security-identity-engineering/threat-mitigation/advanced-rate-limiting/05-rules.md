# Rules: Advanced Rate Limiting

## Define Rate Limits per Endpoint, Not Globally
---
## Category
Architecture
---
## Rule
Apply separate rate limits for different endpoint groups (login, API, public pages). Use `RateLimiter::for()` to define named limiters.
---
## Reason
Different endpoints have different traffic patterns and security requirements. Login endpoints need strict limits (5/minute), while public read-only API endpoints can handle higher traffic. A single global limit either blocks legitimate traffic or fails to protect sensitive endpoints.
---
## Bad Example
```php
// Global rate limit for all routes — too restrictive for API, too loose for login
'api' => ['throttle:60,1'],
'web' => ['throttle:60,1'],
```
---
## Good Example
```php
RateLimiter::for('login', fn ($job) => Limit::perMinute(5));
RateLimiter::for('api', fn ($job) => Limit::perMinute(100));
```
---
## Exceptions
No common exceptions — per-endpoint limits are essential.
---
## Consequences Of Violation
Login endpoints overwhelmed, or API unnecessarily throttled.
---

## Key Rate Limits by User ID for Authenticated, IP for Guests
---
## Category
Architecture
---
## Rule
Use `$job->user?->id ?: $job->ip` as the rate limit key. Authenticated users are identified by their user ID; guests by their IP address.
---
## Reason
Keying authenticated users by IP is inaccurate because users on the same NAT share an IP. Keying guests by user ID is impossible since they have none. Using user ID for authenticated users ensures fair limits per account regardless of IP, and IP for guests is the best available identifier.
---
## Bad Example
```php
RateLimiter::for('api', fn ($job) => Limit::perMinute(60)->by($job->ip)); // Same limit for all users behind NAT
```
---
## Good Example
```php
RateLimiter::for('api', fn ($job) => Limit::perMinute(60)->by($job->user?->id ?: $job->ip));
```
---
## Exceptions
No common exceptions — key strategy depends on authentication state.
---
## Consequences Of Violation
NAT users unfairly limited, or guest users not limited.
---

## Throttle Authentication Attempts (Login, Password Reset, MFA)
---
## Category
Security
---
## Rule
Apply strict rate limits (3-5 attempts per minute) to login, password reset, MFA verification, and registration endpoints.
---
## Reason
Brute-force attacks target authentication endpoints. Without strict limits, an attacker can try thousands of passwords per minute. Low limits force attackers to slow down, making brute-force attacks impractical.
---
## Bad Example
```php
// Login endpoint limited to 60/min — brute-force is trivial
RateLimiter::for('login', fn ($job) => Limit::perMinute(60));
```
---
## Good Example
```php
RateLimiter::for('login', fn ($job) => Limit::perMinute(5));
```
---
## Exceptions
No common exceptions — authentication endpoints need the strictest limits.
---
## Consequences Of Violation
Successful brute-force attack, account compromise.
---

## Return 429 With Retry-After Header
---
## Category
Architecture
---
## Rule
Configure the response when a rate limit is exceeded to include `Retry-After: <seconds>` header and a meaningful error message. Use Laravel's default 429 behavior.
---
## Reason
The `Retry-After` header tells the client (or intermediary) how long to wait before retrying. This is essential for automated clients (CI/CD, cron jobs, API consumers) to implement proper backoff. Without it, clients may retry immediately and continue hitting the 429.
---
## Bad Example
```php
// Override to return 200 with message
return response()->json(['error' => 'too fast'], 200); // Client does not know to slow down
```
---
## Good Example
```php
return response()->json(['error' => 'Too Many Requests'], 429)
    ->header('Retry-After', $retryAfterSeconds);
```
---
## Exceptions
No common exceptions — 429 and Retry-After are standard.
---
## Consequences Of Violation
Clients retry immediately, never recovering from rate limit.
---

## Use Segmented Rate Limiting for Fine-Grained Control
---
## Category
Architecture
---
## Rule
Use `Limit::perSecond()`, `Limit::perMinute()`, and `Limit::perDay()` in combination to implement sliding window rate limiting. Use multiple limits for burst and sustained traffic.
---
## Reason
A single per-minute limit may allow bursts (60 requests in 1 second). Combining a per-second limit (5/second) with a per-minute limit (100/minute) controls both burst and sustained traffic. Segmented limiting handles diverse traffic patterns.
---
## Bad Example
```php
RateLimiter::for('api', fn ($job) => Limit::perMinute(100)); // 100 requests in 1 second allowed
```
---
## Good Example
```php
RateLimiter::for('api', fn ($job) => [
    Limit::perSecond(5), // Burst control
    Limit::perMinute(100), // Sustained control
]);
```
---
## Exceptions
No common exceptions — segmented limits are recommended.
---
## Consequences Of Violation
Burst traffic overwhelms server despite per-minute limits.
---

## Add Throttle Middleware to Route Groups, Not Individual Routes
---
## Category
Architecture
---
## Rule
Apply `throttle:<limiter>` middleware to route groups (`Route::group(['middleware' => 'throttle:api'])`), not to each route individually.
---
## Reason
Applying throttle to individual routes is repetitive and error-prone — a new route added without the throttle middleware will be unprotected. Group-level application ensures all routes in the group are covered consistently.
---
## Bad Example
```php
Route::get('/posts', [PostController::class, 'index'])->middleware('throttle:api');
Route::get('/users', [UserController::class, 'index'])->middleware('throttle:api');
Route::post('/posts', [PostController::class, 'store'])->middleware('throttle:api');
```
---
## Good Example
```php
Route::group(['middleware' => 'throttle:api'], function () {
    Route::get('/posts', [PostController::class, 'index']);
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);
});
```
---
## Exceptions
Routes with unique rate limits (e.g., login at 5/min vs API at 100/min).
---
## Consequences Of Violation
Inconsistent rate limiting, unprotected routes.
---

## Monitor Rate Limit Hits in Production
---
## Category
Monitoring
---
## Rule
Log or monitor (via metrics) when rate limits are hit. Alert on sustained rate limiting from a single user or IP.
---
## Reason
Frequent rate limit hits may indicate an attack (brute-force, DDoS) or a misconfigured client. Monitoring provides situational awareness and enables timely response. Sustained rate limiting from one source is particularly suspicious.
---
## Bad Example
```php
// No monitoring — rate limit hits are invisible
```
---
## Good Example
```php
RateLimiter::for('api', function ($job) {
    return [
        Limit::perMinute(100)->onLimitReached(function () use ($job) {
            Log::warning('Rate limit reached', ['key' => $job->key, 'ip' => $job->ip]);
        }),
    ];
});
```
---
## Exceptions
No common exceptions — monitoring rate limits is critical for security.
---
## Consequences Of Violation
Attack or misconfiguration goes unnoticed.
