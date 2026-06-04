## Configure Per-Provider Named Rate Limiters
---
## Category
Security
---
## Rule
Use named Laravel rate limiters per webhook provider (`webhooks:stripe`, `webhooks:github`), never a single global limit.
---
## Reason
Different providers have different webhook volumes; a single global limit either blocks legitimate traffic or allows provider floods.
---
## Bad Example
```php
Route::post('webhook/stripe', [StripeController::class, 'handle'])->middleware('throttle:100,1');
Route::post('webhook/github', [GitHubController::class, 'handle'])->middleware('throttle:100,1'); // same limit
```
---
## Good Example
```php
RateLimiter::for('webhooks:stripe', fn () => Limit::perMinute(200));
RateLimiter::for('webhooks:github', fn () => Limit::perMinute(60));
Route::post('webhook/stripe', [StripeController::class, 'handle'])->middleware('throttle:webhooks:stripe');
Route::post('webhook/github', [GitHubController::class, 'handle'])->middleware('throttle:webhooks:github');
```
---
## Exceptions
Providers that share an aggregate rate limit.
---
## Consequences Of Violation
Legitimate high-volume providers blocked, low-volume providers leave capacity unused, poor resource allocation.
## Set Limits with 80% Headroom
---
## Category
Reliability
---
## Rule
Configure rate limits at 80% of expected peak traffic to absorb legitimate variability.
---
## Reason
Setting limits at exact expected peak causes 429 errors on normal traffic spikes.
---
## Bad Example
```php
RateLimiter::for('webhooks:stripe', fn () => Limit::perMinute(200)); // exactly at peak
```
---
## Good Example
```php
RateLimiter::for('webhooks:stripe', fn () => Limit::perMinute(250)); // 80% headroom above 200 peak
```
---
## Exceptions
When upstream guarantees maximum delivery rate.
---
## Consequences Of Violation
Frequent 429 responses during normal traffic spikes, missed webhook processing.
## Return 429 with Retry-After Header
---
## Category
Reliability
---
## Rule
Always return standard 429 status code with `Retry-After` header when rate limit is exceeded.
---
## Reason
Providers respect 429 with Retry-After and back off; without proper response, they may continue retrying aggressively.
---
## Bad Example
```php
return response()->json(['error' => 'Too many requests'], 503); // wrong status, no Retry-After
```
---
## Good Example
```php
return response()->json(['error' => 'Rate limit exceeded'], 429)
    ->header('Retry-After', 60);
```
---
## Exceptions
None — 429 with Retry-After is the standard.
---
## Consequences Of Violation
Providers don't back off, continue retrying, compounding the overload.
## Use Redis-Backed Rate Limit Counters
---
## Category
Scalability
---
## Rule
Use Redis-backed rate limit stores for distributed rate limiting across multiple servers.
---
## Reason
File or database-backed limiters are not shared across servers, allowing each server to independently exhaust the limit.
---
## Bad Example
```php
// config/cache.php — 'file' driver doesn't work across servers
```
---
## Good Example
```php
// config/cache.php
'default' => env('CACHE_DRIVER', 'redis'),
// Rate limit state is shared across all servers
```
---
## Exceptions
Single-server deployments.
---
## Consequences Of Violation
N servers each process 100 requests/minute, hitting 429 on the shared limit after N×100 requests.
## Log Rate Limit Hits Per Provider
---
## Category
Observability
---
## Rule
Log every rate limit hit with provider name and timestamp for capacity planning.
---
## Reason
Rate limit hit patterns reveal whether limits are appropriate; without logging, tuning is guesswork.
---
## Bad Example
```php
// Rate limit hit silently — no data for capacity planning
```
---
## Good Example
```php
RateLimiter::for('webhooks:stripe', function () {
    Log::warning('Stripe webhook rate limit hit');
    return Limit::perMinute(250);
});
```
---
## Exceptions
Extremely high-volume applications where logging every hit is prohibitive (use sampling).
---
## Consequences Of Violation
Undetected rate limit saturation, no data for threshold tuning, reactive instead of proactive capacity management.
