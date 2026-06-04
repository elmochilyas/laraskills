# Static Property Accumulation

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Executive Summary
Static property accumulation is the second-most common memory leak pattern in Octane applications, distinct from singleton state leaks. Static properties survive across all requests because they are attached to the class definition itself, not to any container instance. Even services that are correctly registered as `bind()` (non-shared) or `scoped()` can leak memory if they use static properties for caching, memoization, or callback registration. Over thousands of requests, accumulated statics can cause OOM crashes that appear random.

## Core Concepts
- **Static Property Scope:** Static properties belong to the class, not the object. In a persistent PHP process (Octane worker), a static property accumulates values across every request and never releases them unless explicitly cleared.
- **Accumulation Vectors:** Common sources: callback registries (Blade `@directive`, pipeline `through()`), memoization caches (Eloquent `$snakeAttributes`, collection `$macros`), singleton registries (event listeners, middleware lists).
- **Accumulation Rate:** Each request adds N bytes to a static array. After M requests, total = N × M bytes. With N=1KB and M=2000 (typical max_requests), that's 2MB of leaked memory from a single static array.
- **Compounding Effect:** Multiple static accumulators across the application compound. 50 registries each adding 500 bytes per request = 50MB leaked over 2000 requests.

## Mental Models
- **"The Hoarder's Attic":** Static properties are an attic. Every request brings something up and never takes anything down. Eventually the attic is full and the house collapses.
- **"The Monotonic Counter":** Static accumulation only goes up. There is no garbage collection for static memory. Every request pushes the pointer forward.
- **"The Global Whiteboard":** If a class uses a static property as a cache, every request on every worker writes on the same whiteboard. Unlike singletons (which are per-container), statics are per-class (per-worker for Swoole, per-process for RoadRunner).

## Internal Mechanics
1. **Declaration:** A class declares `protected static array $macros = [];`
2. **Registration:** Some code (provider, middleware, controller) adds an entry: `static::$macros['myMacro'] = $callback;`
3. **Accumulation:** Next request adds another entry to the same array. The old entries are never removed.
4. **Growth:** The array grows by 1 element per request. Each element holds a closure (capturing scope), plus any data the closure references.
5. **OOM:** At some request count, the worker's memory footprint exceeds PHP's `memory_limit`. The process crashes or is killed.
6. **Worker Recycled:** The runtime spawns a new worker. The process repeats. A memory-time tradeoff: lower `max_requests` reduces accumulation but increases worker churn.

## Patterns
- **Explicit Reset Listener:** Register a `RequestTerminated` listener that calls static reset methods on known leaky classes: `Macroable::resetMacros()`, `Str::resetCache()`, etc.
- **Instance-Based Caching:** Replace `static::$cache[$key]` with a per-instance property or a scoped binding. Use the container for caching, not static properties.
- **Trait Awareness:** Laravel's `Macroable` trait uses a static `$macros` array. Any class using `Macroable` leaks macros across requests. Wrap registrations in `Octane::once()` or clear in `RequestTerminated`.
- **Blade Directive Registration:** `Blade::directive()` registers into a static array on the `BladeCompiler`. Register directives in a `RequestTerminated` cleanup listener, or better, register them only once using a flag check.

## Architectural Decisions
| Decision | Rationale |
|---|---|
| PHP does not provide static property GC | Language design: static = class-level, lasts for class lifetime (process lifetime) |
| Laravel uses static properties extensively | Historical design (PHP-FPM era); no process persistence was assumed |
| Octane does not intercept static mutation | Impossible at the language level. Static writes are opaque to the runtime |

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Simple, fast caching (static array lookup) | Memory never released until worker restart | Linear memory growth under load |
| Concise API (Macroable, mixins) | Invisible accumulation | Random OOM crashes at high request counts |
| No container dependency for cached state | No automatic lifecycle management | Must manually track and reset |

## Performance Considerations
- Static array lookups are O(1) and extremely fast (local symbol table). This is why developers use them.
- Accumulation cost is memory, not CPU. Each addition is O(1). The GC cost of scanning large static arrays during `gc_collect_cycles()` grows proportionally.
- PHP's garbage collector treats static properties as roots. The entire accumulated static array is scanned during every GC cycle, increasing pause times as the array grows.
- Monitor `memory_get_usage()` at the start and end of each request. A growing delta between start-of-request baselines indicates static accumulation.

## Production Considerations
- Set `max_requests` low enough (e.g., 500) to bound accumulation growth, but high enough to avoid worker churn overhead.
- Implement a **static leak detection script** that snapshots `get_defined_vars()` and reflection-based static property values before and after a test request sequence.
- Use memory profiling tools (Blackfire, Xdebug traces) to identify growing memory allocations. Focus on classes with static arrays.
- Patch leaky third-party packages by wrapping their static registrations with request-count gating: `$registered ||= true; if (!$registered) { $leaky->register(); }`.
- In RoadRunner, static accumulation is per-process only — each RoadRunner worker is a separate PHP process. In Swoole, workers are separate processes too, but coroutines within a worker share statics.

## Common Mistakes
- Confusing "static property accumulation" with "singleton state leaks." They require different detection and fix strategies. Static leaks happen on *any* class with statics, not just container-bound services.
- Using `isset(static::$cache) && static::$cache` as a memoization guard without cleanup. The cache grows unbounded if keys are unique per request.
- Registering Blade `@include` callbacks or view composers in service providers. These register into statics on `ViewFactory` and `BladeCompiler`.
- Using Laravel's `Collection::macro()` inside a controller method. Each request adds a new macro; after 1000 requests, the collection class has 1000 unused closures in memory.
- Assuming `unset()` on the variable holding the only reference to a static-accumulating object frees the memory. The static array holds a strong reference; the memory is not freed.

## Failure Modes
- **Graceful OOM:** After thousands of requests, the worker's memory usage slowly climbs to `memory_limit`. The worker crashes, a new one spawns, and the cycle repeats. The application appears to restart periodically under load.
- **Sudden OOM:** A single request triggers registration of a large static array (e.g., loading 10,000 routes into a static cache). Memory spikes immediately.
- **Silent Data Drift:** A static array that accumulates per-request configuration causes later requests to behave differently than earlier ones (e.g., a static array of middleware parameters that grows, causing increased processing time).
- **Worker Threshhold Crash:** The worker dies right before `max_requests` because accumulated memory finally exceeds the limit. The runtime respawns but the request that triggered the crash is lost.

## Ecosystem Usage
- **Blade:** `Blade::directive()` registers to static `$customDirectives` on `BladeCompiler`. `Blade::stringable()` registers to static `$stringable` on `Str`.
- **Eloquent:** `Model::$snakeAttributes` is a static boolean — mutation here (though rare) persists. `Model::observe()` registers observers on a static array.
- **Collection:** `Collection::macro()` accumulates in static `$macros`. `Collection::make()` with serialized closures can grow the closures' captured scope statically.
- **Str:** `Str::macro()` similar to Collection. `Str::snakeCache` is a static array for snake_case conversion results.
- **Validator:** `Validator::extend()` registers custom validation rules into a static registry on the Validator factory.
- **Third-Party Packages:** Many packages use static properties for caching computed metadata (annotations, attributes, serialization schemas). Each library must be audited.

## Related Knowledge Units
### Prerequisites
- singleton-state-leaks (contrast: singleton leaks are container-bound; static leaks are class-bound)

### Related Topics
- octane-architecture-overview (worker lifecycle context)
- memory-profiling-and-observability (tools to detect accumulation)
- octane-package-compatibility (evaluating packages for static leaks)

### Advanced Follow-up Topics
- octane-lifecycle-hooks (RequestTerminated for cleanup)
- scoped-bindings-for-octane (scoped bindings as mitigation for instance-level state)
- service-binding-audit (including static analysis in binding audit)

## Research Notes
- PHP 8.2+ added `Random\Engine` with static-safe patterns, but this is a niche case.
- Laravel 11 introduced `once()` helper which uses a static array internally. Calls to `once()` with different arguments all accumulate in the same static cache. Use sparingly in long-running processes.
- Research question: Could a PHP extension provide opt-in "request-scoped statics" that the runtime automatically resets? Experimental RFCs have been discussed but none adopted.
- The `opcache.preload` feature in PHP 8.0+ can preload classes and reset static properties during preloading, but this does not help with runtime accumulation.
- A practical mitigation: wrap all static registrations in a guard that checks `$GLOBALS['__request_count']` and only registers on the first request.
