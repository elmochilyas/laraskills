## Define Event Listeners in $listen Array as Classes
---
## Framework Usage
---
## Always define event-to-listener mappings in the `$listen` array of `EventServiceProvider` using fully-qualified listener classes; avoid Closure-based listener registration.
---
## The `event:cache` command serializes the `$listen` array into a manifest file. Closure listeners registered via `Event::listen()` or anonymous functions cannot be serialized and are silently omitted from the cache.
---
```php
// EventServiceProvider.php
public function boot(): void
{
    Event::listen(OrderShipped::class, function (OrderShipped $event) {
        // handle
    });
}
```
---
```php
// EventServiceProvider.php
protected $listen = [
    OrderShipped::class => [
        SendShipmentNotification::class,
    ],
];
```
---
## Listeners that must determine registration at runtime based on configuration or environment state. Register these in `boot()` and document they are uncached.
---
## Critical listeners silently omitted in production; events dispatched with no handling; debugging time wasted on "listener not firing" issues.
---
## Run event:cache Explicitly After php artisan optimize
---
## Framework Usage
---
## Always run `php artisan event:cache` as a separate command after `php artisan optimize` in deployment scripts.
---
## In most Laravel versions, `event:cache` is NOT included in the `optimize` composite command. Relying on `optimize` to cache events leaves event listeners uncached.
---
```bash
php artisan optimize
# Missing: event:cache
```
---
```bash
php artisan optimize
php artisan event:cache
php artisan event:list
```
---
## Laravel versions where the framework explicitly includes `event:cache` in the `optimize` command (verify with `php artisan help optimize`).
---
## Auto-discovery runs on every request, adding 10-30ms overhead; listeners may not be registered until the first manual cache build.
---
## Clear Event Cache Before Regenerating
---
## Reliability
---
## Always run `php artisan event:clear` before `php artisan event:cache` when listeners have been removed or modified.
---
## The event cache is an append-only manifest. If a listener class is deleted from the codebase but the cache still references it, dispatching the event causes a `ClassNotFoundException`.
---
Deleting a listener class and running only `event:cache` without clearing first.
---
```bash
php artisan event:clear
php artisan event:cache
php artisan event:list
```
---
## No common exceptions.
---
## Runtime crashes on event dispatch after deployment; production incidents requiring emergency cache clears.
---
## Verify Listener Registration After Caching
---
## Testing
---
## Run `php artisan event:list` after `event:cache` to confirm all expected listeners are registered in the manifest.
---
## `event:cache` may succeed but capture an incorrect or incomplete listener set if a service provider failed silently or a listener class was misconfigured. The list output is the source of truth.
---
```bash
php artisan event:cache
# Assuming cache succeeded without verification
```
---
```bash
php artisan event:cache
php artisan event:list
```
---
## No common exceptions.
---
## Deployments with missing or incorrect listeners go undetected until users report events not being handled.
---
## Prefer Explicit $listen Over Auto-Discovery
---
## Performance
---
## Prefer explicit `$listen` array declarations over auto-discovery of event listeners for performance-critical applications.
---
## Auto-discovery scans `app/Listeners/` directory using PHP Reflection on every request (when uncached) to inspect `handle()` method type-hints. The `$listen` array is declarative and requires no Reflection.
---
Relying on auto-discovery without explicit `$listen` entries.
---
```php
// EventServiceProvider.php
protected $listen = [
    OrderShipped::class => [
        SendShipmentNotification::class,
    ],
];
```
---
## Small applications (<5 listener pairs) where auto-discovery overhead is negligible.
---
## 10-30ms per-request Reflection overhead when cache is cold; auto-discovery may miss listeners with non-standard conventions.
---
## Document Wildcard Listeners as Uncached
---
## Architecture
---
## Document any wildcard event listeners (`Event::listen('event.*')`) registered in `boot()` as explicitly uncached.
---
## The event cache only captures listeners defined in the `$listen` and `$subscribe` arrays. Wildcard pattern listeners registered via `Event::listen()` in `boot()` are not persisted in the manifest and run uncached on every request.
---
```php
public function boot(): void
{
    Event::listen('order.*', function ($event) {
        // Not captured by event:cache
    });
}
```
---
```php
public function boot(): void
{
    Event::listen('order.*', function ($event) {
        // Document: UNCACHED — wildcard listener
    });
}
```
---
## No common exceptions — wildcard listeners are inherently uncacheable.
---
## Maintenance surprises when developers add wildcard listeners unaware they bypass the caching layer; performance regression at scale.
