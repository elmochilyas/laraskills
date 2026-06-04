# Static Property Accumulation

## Metadata
- **ID:** ku-10-long-running-memory-leak
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Overview
Static property accumulation is the second-most common memory leak pattern in Octane applications, distinct from singleton state leaks. Static properties survive across all requests because they are attached to the class definition itself, not to any container instance. Even services correctly registered as `bind()` (non-shared) or `scoped()` can leak memory if they use static properties for caching, memoization, or callback registration. Over thousands of requests, accumulated statics can cause OOM crashes that appear random.

## Core Concepts
- **Static Property Scope**: Statics belong to the class, not the object. In a persistent PHP process (Octane worker), static properties accumulate values across every request and never release them unless explicitly cleared.
- **Accumulation Vectors**: Common sources: callback registries (Blade `@directive`, pipeline `through()`), memoization caches (Eloquent `$snakeAttributes`, collection `$macros`), singleton registries (event listeners, middleware lists).
- **Accumulation Rate**: Each request adds N bytes to a static array. After M requests, total = N × M bytes. With N=1KB and M=2000, that's 2MB from a single static array.
- **Compounding Effect**: Multiple static accumulators compound. 50 registries each adding 500 bytes per request = 50MB leaked over 2000 requests.
- **Distinction from Singletons**: Static leaks happen on any class with statics, not just container-bound services. They require different detection and fix strategies.

## When To Use
- **Pre-Octane audit**: Identify all static property usage across application and dependencies.
- **OOM debugging**: When workers crash with memory exhaustion after processing many requests.
- **Package evaluation**: Assess third-party packages for static accumulation.
- **CI integration**: Add static property leak detection as a CI step.

## When NOT To Use
- **PHP-FPM only apps**: Static state is naturally reset per-request via process destruction.
- **Non-persistent scripts**: CLI commands that run once and exit don't accumulate meaningfully.
- **Truly constant statics**: Static properties initialized once and never modified are safe.
- **Singleton container state**: Container-based leaks are covered by singleton state leaks KU.

## Best Practices (WHY)
- **Replace `static::$cache` with instance-based caching**: Use the container (scoped binding) for per-request caching instead of static properties. *Why: The container provides lifecycle management; static properties are permanent until process death.*
- **Register a `RequestTerminated` listener for known leaky classes**: Clear static arrays after each request: `Str::resetCache()`, `Collection::clearMacros()`, etc. *Why: Explicit cleanup is the only way to free static memory — there is no automatic GC for statics.*
- **Use `Octane::once()` for one-time registrations**: Wrapper that guards callback registration with a flag check. *Why: Prevents duplicate registrations across requests without leaking static memory.*
- **Monitor `memory_get_usage()` deltas**: A growing start-of-request baseline across requests indicates static accumulation. *Why: Baseline growth is the telltale sign of static leaks — memory that should be freed but isn't.*

## Architecture Guidelines
- **PHP does not provide static property GC**: Language design — static = class-level, lasts for class lifetime (process lifetime).
- **Laravel uses static properties extensively**: Historical design from PHP-FPM era; no process persistence was assumed.
- **Octane does not intercept static mutation**: Impossible at the language level. Static writes are opaque to the runtime.
- **Accumulation is per-process**: In RoadRunner and Swoole, each worker is a separate process. Statics are isolated per worker.

## Performance
- **Static array lookups**: O(1) and extremely fast (local symbol table). This is why developers use them.
- **Accumulation cost is memory, not CPU**: Each addition is O(1). The GC cost of scanning large static arrays during `gc_collect_cycles()` grows proportionally.
- **PHP's garbage collector treats static properties as roots**: Entire accumulated static array is scanned during every GC cycle, increasing pause times as the array grows.
- **Monitor `memory_get_usage()`**: A growing delta between start-of-request baselines indicates static accumulation.

## Security
- **Graceful OOM**: Worker memory slowly climbs to `memory_limit` over thousands of requests. Worker crashes, spawns replacement, cycle repeats. Application appears to restart periodically.
- **Sudden OOM**: Single request triggers registration of a large static array (e.g., loading 10,000 routes into a static cache). Memory spikes immediately.
- **Silent data drift**: Static array accumulating per-request configuration causes later requests to behave differently than earlier ones.
- **Worker threshold crash**: Worker dies right before `max_requests` due to accumulated memory exceeding limit. The triggering request is lost.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Confusing static leaks with singleton leaks | Both involve persistent state | Wrong fix applied | Statics are class-bound, not container-bound |
| Using `isset(static::$cache)` as memoization guard | Keys unique per request | Cache grows unbounded | Use scoped binding or explicit per-request cache |
| Registering Blade directives in controller | `Blade::directive()` in controller method | Accumulates directives across requests | Register once in service provider with guard |
| Using `Collection::macro()` inside request | Each request adds a macro | 1000 unused closures in memory after 1000 requests | Use Octane::once() or register in boot() |

## Anti-Patterns
- **Static property as request cache**: Using `static::$cache[$key] = $value` for per-request memoization. Use scoped bindings instead.
- **Ignoring third-party statics**: Assuming only application code has static accumulators. Vendors like Blade, Validator, and Collection all have static registries.
- **No cleanup in RequestTerminated**: Not registering cleanup listeners for known leaky classes. Statics accumulate silently until OOM.
- **Over-relying on `max_requests`**: Lowering `max_requests` instead of fixing the leak. Masking the symptom, not curing the disease.

## Examples

```php
// LEAKY: Static accumulation
class PaymentService
{
    protected static array $callbacks = [];

    public static function registerCallback(callable $callback): void
    {
        static::$callbacks[] = $callback; // Grows with every request!
    }
}

// FIXED: RequestTerminated cleanup
Event::listen(RequestTerminated::class, function () {
    PaymentService::clearCallbacks();
    Str::resetCache();
    Collection::clearMacros();
});

// FIXED: One-time registration guard
if (! app()->bound('directive_registered')) {
    Blade::directive('custom', function ($expression) {
        return "<?php echo customHandler({$expression}); ?>";
    });
    app()->instance('directive_registered', true);
}

// SAFE: Instance-based caching
class TenantService
{
    private array $cache = []; // Per-instance, not static

    public function getConfig($key)
    {
        return $this->cache[$key] ??= TenantConfig::get($key);
    }
}
```

## Related Topics
- **Singleton State Leaks**: Contrast — singleton leaks are container-bound; static leaks are class-bound.
- **Octane Architecture Overview**: Worker lifecycle context.
- **Memory Profiling and Observability**: Tools to detect accumulation.
- **Octane Lifecycle Hooks**: RequestTerminated for cleanup.
- **Scoped Bindings for Octane**: Scoped bindings as mitigation for instance-level state.

## AI Agent Notes
- PHP 8.2+ added `Random\Engine` with static-safe patterns, but this is a niche case.
- Laravel 11 introduced `once()` helper which uses a static array internally. Calls to `once()` with different arguments all accumulate in the same static cache. Use sparingly in long-running processes.
- Research question: Could a PHP extension provide opt-in "request-scoped statics" that the runtime automatically resets? Experimental RFCs discussed but none adopted.
- `opcache.preload` can preload classes and reset static properties during preloading, but does not help with runtime accumulation.
- A practical mitigation: wrap all static registrations in a guard that checks `$GLOBALS['__request_count']` and only registers on the first request.

## Verification
- [ ] Scan codebase for static properties using `grep -r 'static.*\$' app/`
- [ ] Identify static arrays that grow: `static::$cache[]`, `static::$macros[]`, etc.
- [ ] Register `RequestTerminated` listeners for known leaky classes
- [ ] Run two identical requests and compare `memory_get_usage()` before each — baseline should not grow
- [ ] Test with 100+ sequential requests in the same worker — verify memory is stable
- [ ] Audit all `Macroable` class usage and add cleanup where needed
