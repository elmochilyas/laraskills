# Deferred Providers and Pre-Resolved Bindings — Service Container Optimization

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane Performance |
| Knowledge Unit | Deferred Providers and Pre-Resolved Bindings — Service Container Optimization |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Octane shifts the cost of service provider boot from per-request to per-worker-start. **Deferred providers** delay provider loading until a bound service is actually requested. **Pre-resolved bindings** resolve services during worker boot (not per-request) to reduce request-time latency. Together, they optimize the boot/request split that Octane creates.

## Core Concepts

- **Deferred providers**: A service provider implementing `DeferrableProvider` / `getProvides()` is NOT loaded at worker start. It's loaded only when one of its bound services is resolved. Saves memory and startup time.
- **Pre-resolved bindings**: In `config/octane.php`: `'pre_resolved' => ['auth', 'cache', 'config', 'db', 'encrypter', 'events', 'files', 'log', 'queue', 'redirect', 'router', 'session', 'validator', 'view']` — resolved once, shared across requests.
- **Container compile (Laravel 10+)**: `artisan optimize` compiles service container definitions into a cached file, reducing provider resolution time.
- **Boot time vs request time tradeoff**: Pre-resolving more services increases worker boot time (worker start latency) but reduces first-request latency.

## When To Use

- Your Octane application has many service providers and you want to reduce per-request overhead by deferring non-essential providers.
- You experience slow first-request latency after worker boot and want to pre-resolve critical services.
- You are running a high-throughput API where every millisecond of request-time overhead matters.

## When NOT To Use

- Your providers register event listeners, middleware, or route models in `boot()` — these cannot be deferred because they have boot-time side effects.
- Your worker boot time is already on the critical path for rolling deployments and adding more pre-resolved bindings would unacceptably increase deployment time.
- The service is only used in specific rarely-hit code paths — pre-resolving it wastes memory and boot time.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Make every custom provider implement `DeferrableProvider` by default | Only non-deferred providers should be those with boot-time side effects (event listeners, middleware, route models). |
| Balance pre-resolution against deployment speed | Pre-resolving all services increases worker boot time proportionally. Worker start is on the critical path for rolling deployments. |
| Audit all providers for request-scoped singletons | Singletons that hold request-scoped data are incompatible with Octane's shared-worker model. Defer them or refactor. |
| Run `artisan optimize` after adding/modifying providers | Container compilation reduces provider resolution time by caching definitions. |

## Architecture Guidelines

- **Tiered provider strategy**: Boot essential providers once at worker start, defer expensive or rarely-used providers to per-request execution.
- **Pre-resolution profiling**: Benchmark worker start time with and without additional pre-resolved bindings. Add bindings only when first-request latency improvement outweighs boot time increase.
- **Provider dependency awareness**: If provider A depends on a binding from provider B, ensure B is either pre-resolved or A and B are both deferred to avoid resolution order issues.
- **Separation of concerns**: Use deferred providers for infrastructure concerns (caching, queue, mail) and non-deferred for request-specific behavior (session, auth, middleware).

## Performance Considerations

- Octane delivers 2.5–20x throughput over PHP-FPM; API endpoints with <50ms response see biggest gains.
- Deferred providers save memory and startup time by loading only when their bound services are requested.
- Pre-resolved bindings reduce first-request latency but increase worker boot time. Each additional pre-resolved service adds ~1–5ms to boot time.
- Container compile (`artisan optimize`) reduces provider resolution overhead by caching container definitions.
- Default pre-resolved bindings in Laravel cover the most common services — avoid adding niche services to the pre-resolved list.

## Security Considerations

- Deferred providers should not handle authentication or authorization logic that must be present for every request.
- If a deferred provider registers middleware that blocks unauthorized access, deferring it could leave a window where the middleware is not yet registered.
- Pre-resolved bindings are shared across all requests in a worker — never store user-specific data in pre-resolved singletons.
- Validate that deferred providers do not expose sensitive services prematurely by loading on unexpected triggers.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Pre-resolving everything | Adding every service to the pre-resolved list. | Developer assumes more pre-resolution always improves performance. | Worker boot time increases proportionally. Deployment speed degrades, especially during rolling updates. | Benchmark first-request latency vs boot time. Pre-resolve only services used in >50% of requests. |
| Deferring providers with boot-time side effects | Making a provider deferred when it registers event listeners or middleware in `boot()`. | Misunderstanding that deferred providers skip `boot()` until their services are resolved. | Event listeners, middleware, or route models are never registered, causing silent failures. | Only defer providers where `boot()` is empty or only resolves the provider's own services. |
| Not running container compile | Skipping `artisan optimize` after provider changes. | Unawareness that container compile reduces resolution overhead. | Service provider resolution happens on every worker start without caching benefits. | Run `artisan optimize` as part of deployment pipeline after any provider changes. |

## Anti-Patterns

- **Deferring all providers indiscriminately**: Providers that set up event listeners, middleware, or route models must be loaded at boot. Deferring them causes these registrations to never happen.
- **Pre-resolving services used in <1% of requests**: Wastes memory and increases boot time for services that are rarely needed. Let them resolve lazily.
- **Mixing deferred and non-deferred logic in the same provider**: Splits provider concerns and makes it unclear which services are available at boot time vs request time. Use separate providers.
- **Ignoring Octane's sandbox reset after deferred provider resolution**: Deferred providers loaded mid-request run in the sandbox context. Their bindings must be properly cleaned up for the next request.

## Examples

```
// Example: Deferred provider implementation
use Illuminate\Support\ServiceProvider;
use Illuminate\Contracts\Support\DeferrableProvider;

class AnalyticsServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register(): void
    {
        $this->app->singleton(AnalyticsService::class, function () {
            return new AnalyticsService(config('analytics.api_key'));
        });
    }

    public function provides(): array
    {
        return [AnalyticsService::class];
    }
}
// This provider is NOT loaded at worker start.
// It loads only when AnalyticsService is first resolved.
```

```
// Example: Pre-resolved bindings in config/octane.php
'pre_resolved' => [
    'auth',
    'cache',
    'config',
    'db',
    'encrypter',
    'events',
    'files',
    'log',
    'queue',
    'redirect',
    'router',
    'session',
    'validator',
    'view',
    // Add custom services that are used on nearly every request
    // 'App\Services\BillingService',  // only if used in >50% of requests
],
```

## Related Topics

- Service Provider Optimization
- State Management and Leak Prevention
- Octane Service Container Lifecycle
- OpCache Preloading for Cold-Start Optimization
- Worker Configuration by Driver

## AI Agent Notes

- Default `pre_resolved` list in `config/octane.php` is already well-optimized for most applications — avoid suggesting additions without evidence of a bottleneck.
- When auditing providers for deferral, look for `boot()` methods with `$this->app['events']->listen(...)`, `Route::model(...)`, or middleware registrations — these prevent deferral.
- The `DeferrableProvider` interface was introduced in Laravel 8 — verify the project's Laravel version before suggesting its use.
- Container compile (`artisan optimize`) is often forgotten in deployment scripts. Suggest adding it to the deploy pipeline after `composer install`.

## Verification

- [ ] Audit all custom service providers — mark each as deferrable or non-deferrable based on boot-time side effects.
- [ ] Verify deferred providers implement both `DeferrableProvider` and define `provides()` returning an array of service bindings.
- [ ] Confirm non-deferred providers have boot-time side effects that justify their exclusion from deferral.
- [ ] Run `php artisan optimize` and verify the container cache file is generated.
- [ ] Benchmark worker start time before and after pre-resolution changes.
- [ ] Test that deferred providers load correctly when their services are first requested.
- [ ] Verify no middleware or event listeners are missing after deferring providers.
- [ ] Check that pre-resolved bindings do not store request-scoped data in shared singletons.
