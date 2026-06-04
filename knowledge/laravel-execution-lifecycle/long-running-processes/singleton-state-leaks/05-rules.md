# Singleton State Leaks

## Rule Name
Audit every singleton for mutable per-request state.
---
## Category
Architecture | Security
---
## Rule
Always examine every `singleton()` binding — across application and vendor code — for properties that change between requests.
---
## Reason
Singleton state leakage is the most common and dangerous Octane bug. A singleton that stores per-request data silently leaks that data into subsequent requests, producing wrong results without any error indication.
---
## Bad Example
```php
$this->app->singleton(AuthManager::class);
// AuthManager caches the resolved guard — User A's auth leaks to User B
```
---
## Good Example
```php
// Audit checklist for each singleton:
// 1. Does it store any mutable property?
// 2. Does it cache any computed result?
// 3. Does it have a setter called during requests?
// 4. Is any dependency a mutable singleton?
```
---
## Exceptions
Stateless singletons: config readers, HTTP clients, loggers, connection pools — immutable or no per-request data.
---
## Consequences Of Violation
Cross-user data leaks; auth spoofing; configuration drift; hours of debugging nondeterministic failures.

---

## Rule Name
Convert request-aware singletons to `scoped()`.
---
## Category
Architecture | Design
---
## Rule
Always convert singletons that hold request-scoped state (auth guards, session, current team, locale) from `singleton()` to `scoped()`.
---
## Reason
Scoped bindings provide automatic per-request isolation without code changes to the service itself. The sandbox flush mechanism creates a fresh instance for each request while preserving in-request singleton performance.
---
## Bad Example
```php
// Singleton — auth state leaks across requests
$this->app->singleton(CurrentTeam::class);
```
---
## Good Example
```php
// Scoped — fresh instance per request, shared within request
$this->app->scoped(CurrentTeam::class);
```
---
## Exceptions
Services where the mutable state is intentionally cross-request (e.g., rate-limit counters, connection pools).
---
## Consequences Of Violation
User A's team context appears in User B's request; wrong tenant data, wrong locale, wrong auth identity.

---

## Rule Name
Test with two sequential requests for different users.
---
## Category
Testing
---
## Rule
Always write a test that sends two sequential requests as different authenticated users and asserts full data isolation between them.
---
## Reason
This is the minimal reproducible test for singleton leaks. If the second response contains data from the first user, a singleton is leaking state. Single-request tests cannot catch this.
---
## Bad Example
```php
// Only tests single request — misses cross-request leaks
public function test_user_profile(): void
{
    $response = $this->actingAs($alice)->get('/profile');
    $response->assertSee($alice->name);
}
```
---
## Good Example
```php
public function test_no_singleton_leak_between_users(): void
{
    $alice = User::factory()->create(['name' => 'Alice']);
    $bob = User::factory()->create(['name' => 'Bob']);

    // First request — warms singletons
    $this->actingAs($alice)->get('/profile');

    // Second request — must not see Alice's data
    $bobResponse = $this->actingAs($bob)->get('/profile');
    $bobResponse->assertSee($bob->name);
    $bobResponse->assertDontSee($alice->name);
}
```
---
## Exceptions
PHP-FPM-only deployments where process isolation guarantees per-request freshness.
---
## Consequences Of Violation
Data leaks undetected until production; users see each other's private data.

---

## Rule Name
Never use `app()->instance()` for per-request state.
---
## Category
Architecture | Design
---
## Rule
Never call `app()->instance('name', $value)` to store per-request data. Use `scoped()` bindings instead.
---
## Reason
`instance()` stores directly into the container's shared instances array — it behaves as a singleton replacement. Under Octane, this overwrites the shared instance for all subsequent requests, not just the current one.
---
## Bad Example
```php
// In a controller or middleware:
app()->instance('current_user', $user); // Overwrites for all requests
```
---
## Good Example
```php
// Provider registration — safe per-request isolation:
$this->app->scoped(CurrentUser::class, function ($app) {
    return new CurrentUser($app->make(AuthManager::class)->user());
});
```
---
## Exceptions
One-time bootstrap-time setup in service providers that runs before any request.
---
## Consequences Of Violation
`instance()` acts as a global variable; every request overwrites the last request's value; hard-to-debug cross-request contamination.

---

## Rule Name
Do not use `Auth::onceUsingId()` in Octane workers.
---
## Category
Security | Architecture
---
## Rule
Prefer stateless authentication for one-off checks in Octane over `Auth::onceUsingId()` or similar methods that mutate guard state.
---
## Reason
`Auth::onceUsingId()` mutates the internal state of the auth guard singleton. Under Octane, that mutated guard state persists to the next request, causing subsequent users to appear as the previously set user.
---
## Bad Example
```php
// In a middleware or job running under Octane:
Auth::onceUsingId($userId); // Mutates guard state — leaks to next request
```
---
## Good Example
```php
// Stateless check — no guard mutation:
$user = User::find($userId);
// Or use a scoped auth check that doesn't persist:
app()->scoped(TemporaryAuth::class, fn() => new TemporaryAuth($userId));
```
---
## Exceptions
Requests where the auth state mutation is intentional and immediately cleaned up in `RequestTerminated`.
---
## Consequences Of Violation
Guest requests appear authenticated; User B sees User A's protected data; authentication confusion.

---

## Rule Name
Keep Eloquent caches out of singleton properties.
---
## Category
Architecture | Performance
---
## Rule
Never cache query results or Eloquent models in singleton class properties. Use scoped bindings or explicit request-scoped caches instead.
---
## Reason
A singleton property caching query results grows unbounded as unique keys accumulate across requests. Beyond memory waste, the cached data becomes stale and returns incorrect results for subsequent requests.
---
## Bad Example
```php
class ProductRepository
{
    private static array $cache = []; // Accumulates forever

    public function find(int $id): ?Product
    {
        return self::$cache[$id] ??= Product::find($id);
    }
}
```
---
## Good Example
```php
class ProductRepository
{
    private array $cache = []; // Per-instance — fresh per scope

    public function find(int $id): ?Product
    {
        return $this->cache[$id] ??= Product::find($id);
    }
}
// Registered as scoped: $this->app->scoped(ProductRepository::class);
```
---
## Exceptions
Truly immutable caches — data that is loaded once at worker boot and never changes (route collections, config).
---
## Consequences Of Violation
Unbounded memory growth; stale data returned to users after underlying records change; OOM crashes.
