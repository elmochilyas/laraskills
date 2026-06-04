# Rules

## Rule 1: Keep Eager Provider `register()` and `boot()` Methods Lightweight
---
## Category
Performance
---
## Rule
Minimize work inside eager provider methods — defer heavy operations, avoid I/O, and keep bindings declarative.
---
## Reason
Eager providers execute on every single request. Heavy logic in `register()` or `boot()` multiplies bootstrap time linearly with provider count, directly increasing TTFB.
---
## Bad Example
```php
class EagerServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $permissions = DB::table('permissions')->get(); // Query on every request
        Gate::define('admin', fn($user) => $user->role === 'admin');
    }
}
```
---
## Good Example
```php
class EagerServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Gate::define('admin', fn($user) => $user->role === 'admin');
        // Database queries belong in deferred providers or lazy-loaded services
    }
}
```
---
## Exceptions
Core infrastructure providers (error handling, config, routing) may need minimal I/O in `register()` to bootstrap the framework itself.
---
## Consequences Of Violation
Linear increase in bootstrap time with provider count; unnecessary database connections and queries on every request; poor TTFB metrics.

## Rule 2: Prefer Deferred Providers for Services Used on Fewer Than 30% of Routes
---
## Category
Performance
---
## Rule
Evaluate every eager provider: if its services are used on fewer than 30% of routes, convert it to a deferred provider.
---
## Reason
Eager providers run unconditionally. For services with low utilization, the provider's overhead is wasted on the majority of requests. Deferred providers shift this cost to only when the service is actually resolved.
---
## Bad Example
```php
// Eager by default — runs on every request
class NotificationServiceProvider extends ServiceProvider
{
    // Notifications are only used on the notification-preference page (<5% of routes)
}
```
---
## Good Example
```php
class NotificationServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function provides(): array
    {
        return [NotificationManager::class, Notifier::class];
    }
}
```
---
## Exceptions
Providers that register boot-time artifacts (routes, views, event listeners, middleware) must remain eager regardless of utilization percentage.
---
## Consequences Of Violation
Wasted bootstrap time on every request; higher cumulative overhead as provider count grows; harder to optimize because each individual provider's cost seems small.

## Rule 3: Always Verify Whether a Provider Is Eager or Deferred
---
## Category
Maintainability
---
## Rule
Check a provider's class signature — if it implements `DeferrableProvider`, it is deferred; otherwise it is eager. Do not assume.
---
## Reason
Packages may change their deferral strategy across versions. Assuming a provider is deferred when it is actually eager leads to unexpected bootstrap overhead. `php artisan about` shows the full provider list.
---
## Bad Example
```php
// Assuming this package provider is deferred
use Spatie\Permission\PermissionServiceProvider;

// Not checked — is it actually deferred?
```
---
## Good Example
```php
// Verify in CI or via php artisan about
// ReflectionMethod check or documentation review
$reflection = new ReflectionClass(PermissionServiceProvider::class);
$isDeferred = $reflection->implementsInterface(DeferrableProvider::class);
```
---
## Exceptions
No common exceptions. Provider deferral status is a runtime concern that affects performance — always verify.
---
## Consequences Of Violation
Performance regressions when packages change to eager without notice; inaccurate performance profiling; wasted optimization effort.

## Rule 4: Never Convert All Providers to Deferred for "Optimization"
---
## Category
Architecture
---
## Rule
Keep providers that register boot-time artifacts (routes, listeners, views, middleware) as eager. Do not make every provider deferred.
---
## Reason
Some providers must run at boot time — routes must be registered before the router handles the request, event listeners must exist before events are dispatched. Making them deferred breaks fundamental application functionality.
---
## Bad Example
```bash
# Bulk convert all providers to deferred to "optimize" bootstrap
# Routes from these providers won't be registered
```
---
## Good Example
```php
// Only apply DeferrableProvider to providers whose services
// are resolved lazily — never to route/listener providers
class RouteServiceProvider extends ServiceProvider { /* stays eager */ }
class EventServiceProvider extends ServiceProvider { /* stays eager */ }
class MailServiceProvider extends ServiceProvider implements DeferrableProvider { /* deferred */ }
```
---
## Exceptions
No common exceptions. Boot-time registration providers must always be eager.
---
## Consequences Of Violation
Routes returning 404; event listeners never firing; views not found; middleware not applied; application appears broken despite correct code.

## Rule 5: Profile Eager Provider Bootstrap Time Regularly
---
## Category
Performance
---
## Rule
Measure each eager provider's contribution to bootstrap time using Laravel Debugbar, Blackfire, or Xdebug at least once per quarter.
---
## Reason
Eager provider overhead accumulates silently. Regular profiling identifies which providers are the top contributors, enabling data-driven decisions about deferral or consolidation.
---
## Bad Example
```php
// No measurement — assuming all providers are equally lightweight
// In reality, one provider may account for 60% of bootstrap time
```
---
## Good Example
```php
// Use Laravel Debugbar's "Bootstrap" tab or measure manually:
$start = microtime(true);
$app->register(HeavyProvider::class);
$elapsed = (microtime(true) - $start) * 1000;
logger("HeavyProvider bootstrap: {$elapsed}ms");
```
---
## Exceptions
Very small applications (<5 providers) with no reported performance issues may not need regular profiling.
---
## Consequences Of Violation
Blind performance degradation; inability to identify optimization targets; bootstrap time increases going unnoticed until users report slow page loads.
