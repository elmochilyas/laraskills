# Static Property Accumulation

## Rule Name
Replace static property caching with instance-based caching.
---
## Category
Architecture | Performance
---
## Rule
Always prefer instance properties over `static::$cache` arrays for per-request caching. Use the container (scoped bindings) for lifecycle-managed caching.
---
## Reason
Static properties are class-level — they survive across all requests in a worker and can never be freed by the container. Instance properties on a scoped binding are automatically discarded at request end, preventing unbounded accumulation.
---
## Bad Example
```php
class TenantService
{
    protected static array $config = []; // Grows with every unique key across requests

    public static function get(string $key): mixed
    {
        return self::$config[$key] ??= TenantConfig::fetch($key);
    }
}
```
---
## Good Example
```php
class TenantService
{
    private array $config = []; // Per-instance — fresh per request

    public function get(string $key): mixed
    {
        return $this->config[$key] ??= TenantConfig::fetch($key);
    }
}
// $this->app->scoped(TenantService::class);
```
---
## Exceptions
Truly constant statics — values initialized once at class load and never modified (e.g., `public static string $version = '1.0'`).
---
## Consequences Of Violation
Unbounded memory growth; stale cached values; increased GC pause times scanning large static arrays.

---

## Rule Name
Register `RequestTerminated` cleanup for known leaky static registries.
---
## Category
Reliability | Maintainability
---
## Rule
Always register `RequestTerminated` listeners to clear known static accumulators: `Str::resetCache()`, `Collection::clearMacros()`, `PermissionRegistrar::forgetCachedPermissions()`, and any application-level static registries.
---
## Reason
PHP provides no automatic garbage collection for static properties — they persist for the class lifetime (worker lifetime). Explicit cleanup in `RequestTerminated` is the only reliable way to free accumulated static memory between requests.
---
## Bad Example
```php
// No cleanup — Blade directives, Collection macros, and string caches accumulate
```
---
## Good Example
```php
Event::listen(RequestTerminated::class, function () {
    Str::resetCache();
    Collection::clearMacros();
    if (method_exists(app('permission'), 'forgetCachedPermissions')) {
        app('permission')->forgetCachedPermissions();
    }
    app(TenantService::class)->clearCache();
});
```
---
## Exceptions
Services using the `Macroable` trait where macros are intentionally cross-request (registered once in a service provider).
---
## Consequences Of Violation
Static arrays grow by N bytes per request × thousands of requests → OOM; macros registered thousands of times; string caches bloat.

---

## Rule Name
Use `Octane::once()` for one-time registration guards.
---
## Category
Maintainability | Performance
---
## Rule
Always guard `Blade::directive()`, `Collection::macro()`, `Str::macro()`, and similar one-time registrations with `Octane::once()` or a manual flag check.
---
## Reason
Each request that calls `Blade::directive()` without a guard adds a new directive to the static registry. After 1000 requests, 1000 identical closures are in memory — all but one are wasted.
---
## Bad Example
```php
// In a controller or middleware — registers on every request
Blade::directive('money', function ($amount) {
    return "<?php echo number_format($amount, 2); ?>";
});
```
---
## Good Example
```php
// One-time registration — safe anywhere
Octane::once('blade-money-directive', function () {
    Blade::directive('money', function ($amount) {
        return "<?php echo number_format($amount, 2); ?>";
    });
});

// Or manual guard:
if (! app()->bound('directive-money-registered')) {
    Blade::directive('money', fn($a) => "<?php echo number_format($a, 2); ?>");
    app()->instance('directive-money-registered', true);
}
```
---
## Exceptions
Service provider `boot()` methods, which run only once per worker — no guard needed there.
---
## Consequences Of Violation
Thousands of identical closures in static arrays; memory waste; GC root count growth; OOM crashes.

---

## Rule Name
Monitor `memory_get_usage()` baseline growth as static leak indicator.
---
## Category
Performance | Reliability
---
## Rule
Always track `memory_get_usage()` at the start of each request and alert if the baseline rises consistently across requests.
---
## Reason
A rising start-of-request baseline is the telltale sign of static property accumulation — memory that should have been freed between requests but was not. Container-managed memory is released during sandbox flush; static memory is not.
---
## Bad Example
```php
// Only tracking peak memory — misses baseline growth
Log::info('Peak: '.memory_get_peak_usage(true));
```
---
## Good Example
```php
Event::listen(RequestReceived::class, function ($event) {
    $baseline = memory_get_usage(true);
    Metrics::gauge('worker_baseline', $baseline);
    $event->request->attributes->set('_baseline', $baseline);
});

Event::listen(RequestTerminated::class, function ($event) {
    $startBaseline = $event->request->attributes->get('_baseline');
    $delta = memory_get_usage(true) - $startBaseline;
    if ($delta > 1024 * 1024) { // >1MB baseline growth
        Log::warning('Possible static accumulation', ['delta' => $delta]);
    }
});
```
---
## Exceptions
Requests that legitimately register global state (e.g., package installation routes).
---
## Consequences Of Violation
Static accumulation goes undetected until OOM; root cause analysis starts without trend data.

---

## Rule Name
Never use static arrays as request-scoped caches.
---
## Category
Architecture | Design
---
## Rule
Do not use patterns like `static::$cache[$key] = $value` for results that vary per request. Use scoped bindings with instance properties.
---
## Reason
A static cache keyed by request-unique values grows unbounded over the worker lifetime. Every request adds new entries but never removes old ones. This is the most common static accumulation vector.
---
## Bad Example
```php
class TaxCalculator
{
    private static array $rates = [];

    public function rate(string $country): float
    {
        return self::$rates[$country] ??= $this->fetch($country);
        // Grows with every unique country across all requests — never shrinks
    }
}
```
---
## Good Example
```php
class TaxCalculator
{
    private array $rates = []; // Fresh per request scope

    public function rate(string $country): float
    {
        return $this->rates[$country] ??= $this->fetch($country);
    }
}
// Registered as scoped: $this->app->scoped(TaxCalculator::class);
```
---
## Exceptions
Caches for truly immutable data that is the same for every request (e.g., country code list loaded from config).
---
## Consequences Of Violation
Cache grows unbounded; stale entries for data that changes between requests; OOM from accumulated key-value pairs.

---

## Rule Name
Scan for static property accumulation in third-party packages too.
---
## Category
Maintainability | Reliability
---
## Rule
Always extend static property scans to vendor packages, not just application code. Include Blade, Collection, Validator, and any package using the `Macroable` trait.
---
## Reason
Third-party packages are the source of most static accumulation — Laravel's own facades, Blade directives, Collection macros, and vendor registries all use static properties. Application code is usually cleaner.
---
## Bad Example
```php
// Only scanned app/ directory — missed vendor statics
// grep -r 'static.*\$' app/
```
---
## Good Example
```php
// Scan all loaded classes at runtime
$classes = get_declared_classes();
foreach ($classes as $class) {
    $ref = new ReflectionClass($class);
    foreach ($ref->getStaticProperties() as $name => $value) {
        if (is_array($value) && count($value) > 100) {
            Log::warning("Large static array: {$class}::{$name}", [
                'count' => count($value),
            ]);
        }
    }
}
```
---
## Exceptions
No common exceptions — vendor packages are a primary accumulation source.
---
## Consequences Of Violation
Team focuses on fixing application code while framework-level static arrays silently accumulate and cause OOM.

---

## Rule Name
Do not rely solely on `max_requests` to mitigate static leaks.
---
## Category
Architecture | Reliability
---
## Rule
Always fix the root cause of static accumulation rather than lowering `max_requests` to mask the symptom.
---
## Reason
Lowering `max_requests` as the sole mitigation reduces throughput from frequent worker churn and wastes the performance benefits of long-running processes. Fix the leak — `max_requests` is the safety valve, not the solution.
---
## Bad Example
```php
// Masking the problem — lowering max_requests instead of fixing leaks
'max_requests' => 50, // Workers recycle so fast they never warm caches
```
---
## Good Example
```php
// Fix the leak:
// 1. Replace static caches with instance-based
// 2. Add RequestTerminated cleanup
// 3. Guard one-time registrations
// Then set max_requests based on residual leak profile
'max_requests' => 1500, // After fixing leaks — high value, low churn
```
---
## Exceptions
Temporary mitigation during incident response — lower `max_requests` to stop OOM crashes, then schedule a permanent fix.
---
## Consequences Of Violation
Throughput loss from excessive worker churn; cold-start overhead on every request; performance benefit of Octane is negated.
