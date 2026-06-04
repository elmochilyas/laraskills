## Always Cache Authorization Decisions
---
## Performance
---
Always cache authorization callback results using `Cache::remember()` to avoid repeated execution.
---
Every private/presence channel subscription triggers a synchronous HTTP request that executes the auth callback. Without caching, the same authorization runs repeatedly for the same user and channel, adding unnecessary database load.
---
```php
Broadcast::channel('orders.{id}', function ($user, $id) {
    return $user->id === Order::find($id)?->user_id; // Uncached DB query per subscription
});
```
---
```php
Broadcast::channel('orders.{id}', function ($user, $id) {
    return Cache::remember("order:{$id}:user:{$user->id}", 300, function () use ($user, $id) {
        return $user->id === Order::find($id)?->user_id;
    });
});
```
---
Authorization that must reflect permission changes instantly (use short TTL instead). No common exceptions for repeated checks.
---
Database overload during reconnection storms; slow auth responses.

## Always Apply Rate Limiting to the Auth Endpoint
---
## Security
---
Always apply `throttle` middleware to the `/broadcasting/auth` endpoint to prevent abuse and storm overload.
---
Without rate limiting, a reconnection storm or DoS attack can overwhelm the auth endpoint, degrading or crashing the entire application.
---
```php
Broadcast::routes(); // No rate limiting — vulnerable to storms
```
---
```php
Broadcast::routes(['middleware' => ['auth:sanctum', 'throttle:100,1']]);
```
---
Public-channel-only applications. No common exceptions for private/presence channels.
---
Auth endpoint DoS; cascading application failure during storms.

## Always Keep Auth Callback Database Queries to at Most One
---
## Performance
---
Always limit auth callbacks to a single database query or use cached lookups.
---
Each database query in an auth callback adds 5-50ms latency per subscription. During reconnection storms with thousands of simultaneous subscriptions, even one query per callback can overwhelm the database.
---
```php
Broadcast::channel('team.{id}', function ($user, $id) {
    $team = Team::find($id); // Query 1
    $membership = $team->members()->where('user_id', $user->id)->first(); // Query 2
    return $membership !== null;
});
```
---
```php
Broadcast::channel('team.{id}', function ($user, $id) {
    return Cache::remember("team:{$id}:user:{$user->id}", 300, function () use ($user, $id) {
        return $user->teams()->where('team_id', $id)->exists(); // Single query
    });
});
```
---
No common exceptions; auth callbacks must be optimized for speed.
---
Slow auth responses; database overload; failed subscriptions under load.

## Always Set Separate Rate Limits for Web Session vs. API Token Auth
---
## Security
---
Always apply different rate limits for session-based and token-based auth requests to the broadcast endpoint.
---
Session-based and token-based auth have different usage patterns and abuse profiles. A single rate limit may be too restrictive for one and too permissive for the other.
---
```php
// Same throttle for all guards
Broadcast::routes(['middleware' => 'throttle:60,1']);
```
---
```php
// Separate routes for different auth types
Route::post('/broadcasting/auth', [BroadcastController::class, 'authenticate'])
    ->middleware('auth:sanctum')
    ->middleware('throttle:100,1');
Route::post('/broadcasting/auth', [BroadcastController::class, 'authenticate'])
    ->middleware('auth:web')
    ->middleware('throttle:60,1');
```
---
Applications using only one auth guard type. No common exceptions for multi-guard setups.
---
False rate-limit positives; abuse vulnerability in less-restricted path.

## Always Monitor Auth Endpoint Latency Separately
---
## Maintainability
---
Always track auth endpoint P50/P95/P99 latency as a distinct metric from application-wide response times.
---
Auth performance issues hide within average application metrics. Slow auth directly impacts user experience (delayed subscription confirmation), but without separate monitoring, degradation goes unnoticed.
---
```php
// Auth and app metrics mixed in same dashboard
```
---
```php
// Dedicated auth latency tracking
Metrics::track('broadcasting.auth.latency', $duration, ['p50', 'p95', 'p99']);
```
---
Small applications with trivial auth callbacks. No common exceptions at scale.
---
Undetected auth degradation; user-facing subscription delays.

## Always Implement Cache Stampede Prevention
---
## Performance
---
Always use cache stampede prevention techniques (locks, jittered TTL) for auth caches.
---
When auth cache entries expire simultaneously during a reconnection storm, all clients trigger database queries at once, overwhelming the database and causing cascading failure.
---
```php
Cache::remember("auth:{$key}", 300, fn() => $result); // All expire at t=300
```
---
```php
Cache::remember("auth:{$key}", random_int(240, 360), fn() => $result); // Jittered TTL
```
---
No common exceptions; stampede prevention is essential for production auth caching.
---
Database overload during storms; cascading application failure.

## Never Use Eternal TTL for Auth Caches
---
## Security
---
Never cache authorization decisions indefinitely without an invalidation mechanism.
---
Eternal caches serve stale authorization results after permission changes. A user who loses access to a channel continues to receive subscription authorization until manual cache clearing.
---
```php
Cache::forever("auth:order:{$id}:user:{$userId}", $result); // Never expires
```
---
```php
Cache::put("auth:order:{$id}:user:{$userId}", $result, 300); // 5-minute TTL
```
---
Permissions that never change during a user's session. No common exceptions.
---
Stale authorization; users retain access after permission revocation.
