# Resolution Callbacks — Rules

## Use Abstract-Specific Callbacks Over Global Callbacks with instanceof
---
## Category
Performance
---
## Rule
Register abstract-specific `resolving()` callbacks instead of a single global callback with multiple `instanceof` checks.
---
## Reason
Global callbacks execute on every single `make()` call in the application. A global callback that checks `$object instanceof X` for 20+ types invokes those checks on every resolution — including primitive arrays, strings, and unrelated services — adding 3-5μs of unnecessary branching per resolution.
---
## Bad Example
```php
// Global callback — checked on EVERY resolution
$this->app->resolving(function ($object, $app) {
    if ($object instanceof Repository) { $object->setCache(...); }
    if ($object instanceof Mailer) { $object->setConfig(...); }
    if ($object instanceof Logger) { $object->setLevel(...); }
    // 10 more instanceof checks...
});
```
---
## Good Example
```php
// Abstract-specific — O(1) dispatch per type
$this->app->resolving(Repository::class, fn($repo) => $repo->setCache(...));
$this->app->resolving(Mailer::class, fn($mailer) => $mailer->setConfig(...));
$this->app->resolving(Logger::class, fn($logger) => $logger->setLevel(...));
```
---
## Exceptions
A single cross-cutting concern that applies to all services (e.g., a metrics collector that tags every resolved service).
---
## Consequences Of Violation
Performance: unnecessary instanceof dispatch on every service resolution, including lightweight objects and primitives.

---

## Use extend() for Decoration, resolving() for Configuration
---
## Category
Framework Usage
---
## Rule
Use `extend()` when wrapping a service with additional behavior; use `resolving()` for post-construction property configuration.
---
## Reason
Extenders run before `resolving()` callbacks. If you use `resolving()` for decoration, and another package uses `extend()`, the extender's output is lost because `resolving()` runs after extenders but can replace the instance. `extend()` is the designated API for decorator wrapping; `resolving()` is for configuration.
---
## Bad Example
```php
// resolving() for decoration — extender output gets replaced
$this->app->resolving(SearchClient::class, function ($client, $app) {
    return new LoggingSearchClient($client); // Replaces the instance
});

// Another provider's extender:
$this->app->extend(SearchClient::class, fn($c) => new CachedClient($c));
// CachedClient wraps raw client, then resolving() replaces it with LoggingSearchClient
```
---
## Good Example
```php
// extend() for decoration:
$this->app->extend(SearchClient::class, fn($client) => new LoggingSearchClient($client));
// resolving() for configuration only (no return value):
$this->app->resolving(SearchClient::class, fn($client) => $client->setTimeout(30));
```
---
## Exceptions
When a callback must definitely execute after all extenders and needs to see the fully decorated instance (rare).
---
## Consequences Of Violation
Reliability: extender output silently discarded when `resolving()` replaces the instance.

---

## Use afterResolving() for Side Effects Only
---
## Category
Framework Usage
---
## Rule
Use `afterResolving()` exclusively for side effects that do not modify the resolved instance — the cached singleton is already stored before this hook fires.
---
## Reason
The resolution pipeline executes `afterResolving()` after the instance is cached in `$instances`. Any modifications to the instance in `afterResolving()` apply to the object in memory but the cached singleton is already stored — subsequent `make()` calls return the cached reference, which may or may not reflect the modifications depending on mutability.
---
## Bad Example
```php
$this->app->afterResolving(Repository::class, function ($repo) {
    $repo->setCacheTtl(3600); // Modification after caching — works by reference for mutable objects
});

// Better to use resolving() for modifications:
$this->app->resolving(Repository::class, fn($repo) => $repo->setCacheTtl(3600));
```
---
## Good Example
```php
// afterResolving() for fire-and-forget side effects:
$this->app->afterResolving(DatabaseConnection::class, function ($connection, $app) {
    Log::info('Database connection resolved', [
        'connection' => $connection->getName(),
    ]);
});

// Use resolving() for actual configuration:
$this->app->resolving(DatabaseConnection::class, function ($connection, $app) {
    $connection->setTenant($app->make(TenantContext::class)->id());
});
```
---
## Exceptions
No common exceptions — `afterResolving()` is for logging, monitoring, and event dispatching, not configuration.
---
## Consequences Of Violation
Reliability: modifications applied after caching have ambiguous effects on cached vs. non-cached paths.

---

## Avoid Instance Replacement in resolving() Callbacks
---
## Category
Reliability
---
## Rule
Do not return a non-null value from `resolving()` callbacks unless you fully understand the lifecycle implications.
---
## Reason
A non-null return from `resolving()` replaces the resolved instance. This discards the output of all extenders that ran before the callback and creates a non-obvious dependency on callback execution order. Accidental returns (e.g., from `tap()` or implicit closure returns) are a common source of bugs.
---
## Bad Example
```php
$this->app->resolving(DataExporter::class, function ($exporter, $app) {
    $exporter->setFormat('csv');
    // No explicit return — implicitly returns null, which is fine
});

$this->app->resolving(DataExporter::class, function ($exporter, $app) {
    return tap($exporter)->setFormat('csv'); // BUG: tap returns $exporter, replacing the instance
});
// The return value replaces the instance — loses extender decorations
```
---
## Good Example
```php
$this->app->resolving(DataExporter::class, function ($exporter, $app) {
    $exporter->setFormat('csv');
    return; // Explicit void return — no replacement
});

// If replacement is truly needed, use extend() instead:
$this->app->extend(DataExporter::class, fn($exporter) => new LoggingExporter($exporter));
```
---
## Exceptions
No common exceptions — instance replacement in `resolving()` is almost always a design error.
---
## Consequences Of Violation
Reliability: extender decorations silently discarded. Maintainability: hard-to-trace bugs where callbacks "lose" decorations.

---

## Understand Callback Execution Order for Debugging
---
## Category
Maintainability
---
## Rule
Remember the callback execution order: `beforeResolving()` → build → extenders → `resolving()` → cache → `afterResolving()`.
---
## Reason
Callback order determines what state each hook sees. `beforeResolving()` receives the abstract name but no instance. Extenders see the raw built instance. `resolving()` sees the decorated instance. Caching happens after `resolving()` but before `afterResolving()`. This ordering affects where each type of interception should be registered.
---
## Bad Example
```php
// Assuming afterResolving runs before caching:
$this->app->afterResolving(CacheManager::class, function ($cache) {
    $cache->setPrefix('app'); // Runs after caching — cached singleton already stored
});
```
---
## Good Example
```php
// Correct hook for instance modification:
$this->app->resolving(CacheManager::class, function ($cache) {
    $cache->setPrefix('app'); // Runs before caching — modifications are stored
});

// afterResolving for logging:
$this->app->afterResolving(CacheManager::class, function ($cache) {
    Log::debug('CacheManager resolved', ['prefix' => $cache->getPrefix()]); // Side effect only
});
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Reliability: modifications applied at the wrong point in the lifecycle with no visible effect.

---

## Use $app Parameter Instead of Captured Container Reference
---
## Category
Maintainability
---
## Rule
Use the `$app` parameter passed to the callback closure rather than capturing `$this->app` or `app()` from the outer scope.
---
## Reason
Capturing the container in the closure's outer scope can create circular references that prevent garbage collection and may reference a stale or different container instance (e.g., in test environments where the container is replaced). The `$app` parameter passed by the container is always the correct current instance.
---
## Bad Example
```php
class ServiceProvider {
    public function boot(): void {
        $container = $this->app; // Captured reference

        $this->app->resolving(Logger::class, function ($logger) use ($container) {
            $logger->setChannel($container->make(ChannelConfig::class));
        });
    }
}
```
---
## Good Example
```php
class ServiceProvider {
    public function boot(): void {
        $this->app->resolving(Logger::class, function ($logger, $app) {
            $logger->setChannel($app->make(ChannelConfig::class));
        });
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Maintainability: potential memory leaks from circular references. Reliability: using a stale container reference in long-running processes (Octane).

---

## Guard Callback Registration to Prevent Duplicates
---
## Category
Reliability
---
## Rule
Guard resolution callback registration to prevent duplicate registration when a service provider boots multiple times.
---
## Reason
If a service provider's `boot()` method is called multiple times (e.g., during testing or provider re-registration), callbacks registered without guards accumulate. Each duplicates fires multiple times per resolution, causing duplicated configuration and side effects.
---
## Bad Example
```php
class AppServiceProvider extends ServiceProvider {
    public function boot(): void {
        $this->app->resolving(Logger::class, fn($logger) => $logger->setLevel('debug'));
        // If boot() runs twice, callback fires twice per resolution
    }
}
```
---
## Good Example
```php
class AppServiceProvider extends ServiceProvider {
    private static bool $callbacksRegistered = false;

    public function boot(): void {
        if (self::$callbacksRegistered) {
            return;
        }

        $this->app->resolving(Logger::class, fn($logger) => $logger->setLevel('debug'));

        self::$callbacksRegistered = true;
    }
}
```
---
## Exceptions
Service providers guaranteed to boot exactly once (standard Laravel application boot with no provider duplication).
---
## Consequences Of Violation
Performance: duplicate callback execution on every resolution. Reliability: duplicated configuration, event handlers registered multiple times.
