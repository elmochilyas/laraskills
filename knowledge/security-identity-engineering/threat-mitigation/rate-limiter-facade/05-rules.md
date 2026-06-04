# Rules: Rate Limiter Facade

## Define All Named Limiters in AppServiceProvider
---
## Category
Architecture
---
## Rule
Register all `RateLimiter::for()` definitions in `AppServiceProvider::boot()` or a dedicated `RateLimiterServiceProvider`. Never define limiters in route files or controllers.
---
## Reason
Centralized limiter definitions provide a single source of truth. Scattering limiter definitions across route files and controllers makes it difficult to audit, change, or document rate limits. A dedicated provider also loads limiters during service container bootstrapping before routes are processed.
---
## Bad Example
```php
// Limiter defined in route file — hard to find
Route::middleware(['throttle:api'])->group(function () {
    RateLimiter::for('api', fn ($job) => Limit::perMinute(60));
});
```
---
## Good Example
```php
// AppServiceProvider or RateLimiterServiceProvider
public function boot(): void {
    RateLimiter::for('api', fn ($job) => Limit::perMinute(60));
    RateLimiter::for('login', fn ($job) => Limit::perMinute(5)->by($job->user?->id ?: $job->ip));
}
```
---
## Exceptions
No common exceptions — centralized registration is required.
---
## Consequences Of Violation
Scattered limiter definitions, difficult to audit and maintain.
---

## Use Limit::perSecond() With perMinute() for Burst Control
---
## Category
Architecture
---
## Rule
Combine `Limit::perSecond()` and `Limit::perMinute()` when the endpoint must handle both controlled bursts and sustained traffic. Return an array of limits from the `for()` closure.
---
## Reason
A single `perMinute(60)` limit allows 60 requests in the first second of the minute, which can overwhelm the server. Adding `perSecond(5)` caps the burst at 5 requests per second. The RateLimiter applies all limits, and the strictest is enforced.
---
## Bad Example
```php
RateLimiter::for('api', fn ($job) => Limit::perMinute(60)); // 60 requests in 1 second allowed
```
---
## Good Example
```php
RateLimiter::for('api', fn ($job) => [
    Limit::perSecond(5), // Burst cap: 5/sec
    Limit::perMinute(60), // Sustained cap: 60/min
]);
```
---
## Exceptions
Endpoints with naturally slow traffic where bursts are not a concern.
---
## Consequences Of Violation
Burst traffic overwhelms server despite per-minute limits.
---

## Key Limiters by User ID or IP Based on Auth State
---
## Category
Architecture
---
## Rule
Use `$job->user?->id ?: $job->ip` as the rate limiter key. Use `->by()` to specify the key.
---
## Reason
Limiting authenticated users by their IP is inaccurate — users behind NAT share an IP, and a single abusive user can block an entire office. Limiting by user ID provides per-account fairness. Guests must be limited by IP since they have no user ID.
---
## Bad Example
```php
RateLimiter::for('api', fn ($job) => Limit::perMinute(60)->by($job->ip)); // NAT issue
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
Unfair throttling of users behind shared IP, or guest users unthrottled.
---

## Name Limiters by Endpoint Purpose, Not by Route Name
---
## Category
Architecture
---
## Rule
Use descriptive, purpose-based names for limiters (`login`, `api`, `webhook-receive`). Avoid route-specific names like `posts-index` or `users-store`.
---
## Reason
Multiple endpoints often share the same rate limit profile (e.g., all read-only API endpoints). Purpose-based names group endpoints logically. Route-specific names create unnecessary duplication and make it harder to apply consistent policies.
---
## Bad Example
```php
RateLimiter::for('posts-index', fn ($job) => Limit::perMinute(60));
RateLimiter::for('users-index', fn ($job) => Limit::perMinute(60));
RateLimiter::for('comments-index', fn ($job) => Limit::perMinute(60)); // All the same
```
---
## Good Example
```php
RateLimiter::for('api-read', fn ($job) => Limit::perMinute(60)); // One limiter for all read endpoints
```
---
## Exceptions
Endpoints with unique, significantly different rate limits (login vs API).
---
## Consequences Of Violation
Duplicate limiter definitions, harder to manage rate limiting policy.
---

## Use onLimitReached for Side Effects (Logging, Notifications)
---
## Category
Architecture
---
## Rule
Attach `onLimitReached()` callbacks to limit definitions for logging or notifying when a limit is hit. Avoid inline checks after the fact.
---
## Reason
`onLimitReached()` runs exactly when the limit is crossed, providing an explicit hook for side effects. Manual post-request checks are unreliable (may not run if the response is cached). This callback is ideal for monitoring and alerting.
---
## Bad Example
```php
// Manual check after request — may not run for cached responses
if (RateLimiter::tooManyAttempts('api', 60)) {
    Log::warning('Rate limit hit');
}
```
---
## Good Example
```php
RateLimiter::for('api', fn ($job) => Limit::perMinute(60)
    ->onLimitReached(fn () => Log::warning('API rate limit hit'))
);
```
---
## Exceptions
No common exceptions — use the built-in callback mechanism.
---
## Consequences Of Violation
Missing notifications when rate limits are hit, reactive monitoring.
---

## Test Rate Limiter Behavior in Feature Tests
---
## Category
Testing
---
## Rule
Write feature tests that verify rate limiters are applied correctly: unauthenticated requests limited, authenticated requests limited by user ID, exceeded requests return 429.
---
## Reason
Rate limiter misconfiguration (wrong key, wrong limit, missing registration) can silently fail — allowing unlimited traffic or blocking all users. Feature tests catch these configurations before deployment.
---
## Bad Example
```php
// No rate limiter tests — misconfiguration undetected
```
---
## Good Example
```php
public function test_login_rate_limiter_blocks_after_5_attempts(): void {
    for ($i = 0; $i < 5; $i++) {
        $response = $this->post('/login', ['email' => 'test@test.com', 'password' => 'wrong']);
        $response->assertStatus(302); // Redirect back (validation error)
    }
    $response = $this->post('/login', ['email' => 'test@test.com', 'password' => 'wrong']);
    $response->assertStatus(429); // Too many requests
}
```
---
## Exceptions
No common exceptions — rate limit testing is essential.
---
## Consequences Of Violation
Undetected rate limiter misconfiguration in production.
