# Octane Architecture Overview

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Executive Summary
Laravel Octane supercharges application performance by booting the framework once and reusing it across hundreds of requests, eliminating the per-request bootstrap overhead inherent to traditional PHP-FPM. The core architectural insight is the **sandbox** — a per-request clone of the application container that isolates state while preserving the memory-resident services. Octane supports three runtimes (Swoole, RoadRunner, FrankenPHP) each with distinct concurrency models, but exposes a unified interface through the `Octane` facade and lifecycle hooks.

## Core Concepts
- **One-Time Boot vs Per-Request Boot:** The application container is resolved once during worker start. Services registered as `singleton()` survive across requests. The `$app` instance is the master application object; a sandboxed clone is created for each request.
- **Octane Sandbox:** A lightweight clone of the container created per-request. The sandbox shares the same service instances for singletons but creates fresh instances for classes registered via `->scoped()`. After the request completes, the sandbox is discarded — any state mutations made during the request are lost.
- **Workers:** Long-running PHP processes managed by the runtime. Each worker processes requests sequentially (Swoole can process concurrently with coroutines). Workers are recycled after a configurable `max_requests` threshold to mitigate memory leaks.
- **Runtime Adapters:** Swoole (event-driven, coroutine-capable), RoadRunner (goroutine-backed, HTTP/2), FrankenPHP (Caddy-based, Go worker pool). Each adapter maps Octane's request lifecycle onto the runtime's native concurrency model.

## Mental Models
- **"Boot Once, Clone Many":** Think of the framework bootstrap as a heavy template. Each request gets a photocopy (sandbox) of the template. The original is never touched by request logic.
- **"The Singleton Taxi":** Singletons are like a taxi that stays running between passengers. The car (engine, chassis) stays; personal belongings (request state) must not be left behind.
- **"Green Threads vs System Threads":** Swoole coroutines are scheduled inside a single OS thread. RoadRunner uses multiple OS threads via Go's scheduler. The mental model for concurrency differs — Swoole requires coroutine-safe code; RoadRunner relies on process isolation.

## Internal Mechanics
1. **Worker Boot Sequence:** The runtime spawns a worker process. Octane's `LaravelOctane\Worker` class bootstraps Laravel (`$app = require bootstrap/app.php`), then calls `$kernel->bootstrap()` to run all service providers. The fully booted `$app` is stored in memory.
2. **Request Arrival:** The runtime receives an HTTP request. Octane's event loop invokes the `RequestStarted` hook. A **sandbox** is created via `$app->make(Sandbox::class)->set('app', clone $app)`. Service providers tagged `OctaneSandbox` are re-registered.
3. **Request Handling:** The sandboxed kernel handles the request. Middleware, controller, response — all execute against the sandboxed container. Singletons in the sandbox reference the original master container's instances.
4. **Request Termination:** `RequestTerminated` event fires. The sandbox is destroyed. Octane calls `$sandbox->flush()` which forces destruction of all scoped bindings. If a tick callback is registered via `Octane::tick()`, it runs after the configured interval.
5. **Worker Recycling:** After `max_requests`, the worker gracefully shuts down, the runtime spawns a replacement worker, and the boot sequence repeats.

## Patterns
- **Sandbox-Safe Service Registration:** Register mutable services as `$app->scoped()` so each request gets a fresh instance. Register immutable services (config readers, HTTP clients) as `$app->singleton()`.
- **Deferred Provider Rebinding:** Providers that register request-specific state should implement `OctaneSandbox` contract to rebind on sandbox creation.
- **Tick Initialization:** Use `Octane::tick('name', fn() => ..., $interval)` for periodic maintenance (cache pruning, metrics aggregation). Ticks run in the master container, not the sandbox.
- **Gate Checkpoint Pattern:** Check `Octane::state()['app']['workerId']` before executing worker-local logic (e.g., per-worker connection pools).

## Architectural Decisions
| Decision | Rationale |
|---|---|
| Sandbox over clone-and-replace | Minimal overhead per request; only re-registers sandbox-sensitive providers |
| Singleton sharing across sandboxes | Preserves benefits of long-lived connections, config caches, route collections |
| `max_requests` recycling | Safety valve against accumulated memory leaks without requiring perfect code |
| Separate master/sandbox containers | Clear ownership: master owns infrastructure, sandbox owns request-scoped state |

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| 10-50x throughput improvement | Must audit all service bindings for state safety | Bugs that only surface under load (stale state, data leaks) |
| Shared database connections | Memory pressure from leaked request data | OOM crashes, need for `max_requests` tuning |
| Hot code via `Octane::tick()` | Tick callbacks run in master container, not sandbox | Shared mutable state in tick closures is unsafe |
| Runtime flexibility (Swoole/RR/FrankenPHP) | Each runtime has different gotchas | Swoole coroutines require non-blocking drivers; RoadRunner pipes have serialization cost |

## Performance Considerations
- Sandbox creation takes ~2ms per request. Re-registering sandbox providers adds ~0.5ms per provider. Keep sandbox providers lean.
- Swoole coroutines zero overhead on context switching (userland). RoadRunner process-per-core model has ~1MB RSS baseline per worker.
- Maximum throughput is bound by worker count × requests per second per worker. Tune `max_requests` to balance leak accumulation against worker churn cost.
- Memory baseline for an idle Octane worker is typically 30-50MB (Laravel booted). Each request adds 1-5MB transient memory freed after sandbox destruction.

## Production Considerations
- Configure `max_requests` between 500-2000 depending on application leak profile. Lower means safer but more worker churn.
- Monitor `octane:status` for worker count, request count per worker. Set alerts for worker restart frequency.
- Use `OCTANE_WORKER_COUNT=auto` in Swoole to match CPU core count. RoadRunner defaults to `numcpu` in `.rr.yaml`.
- Coroutine-unsafe code must be wrapped. Swoole provides `Co::defer()` and channel-based synchronization. RoadRunner guarantees process-level isolation so coroutine safety is not a concern.
- Configure graceful shutdown timeout. Swoole `max_wait_time` seconds. RoadRunner `graceful_timeout`.

## Common Mistakes
- Treating Octane as "drop-in faster Laravel" without auditing service providers. Singleton state leaks are the #1 source of production bugs.
- Registering mutable repositories (Eloquent models with cached queries, API clients with token stores) as singletons without clearing state between requests.
- Using global state (static properties, globals) expecting per-request isolation. Static is shared across all requests in the same worker.
- Not implementing `OctaneSandbox` on providers that register request-scoped services. The sandbox skips re-registration by default.
- Mixing long-lived connections (Redis, DB) across coroutines in Swoole without connection pooling. Each coroutine should use its own connection or a pool.

## Failure Modes
- **Silent Data Leak:** User A's data appears in User B's response. Root cause: singleton service holding request-specific state (e.g., `Auth::user()` on a singleton guard instance).
- **OOM Cascade:** Worker RSS grows monotonically until the OS OOM killer terminates the process. Root cause: static arrays accumulated over thousands of requests (Blade compiled views cache, collection callbacks).
- **Deadlocked Worker:** All coroutines blocked on a shared resource. Root cause: blocking I/O inside a coroutine without yielding (`Co::sleep()` vs `sleep()`).
- **Silent Process Death:** Swoole worker crashes mid-request, runtime respawns without logging. Root cause: uncaught exception in coroutine context without global exception handler.

## Ecosystem Usage
- **Laravel Forge:** Automated Octane deployment with Swoole or RoadRunner. Forge manages `supervisor` config for worker processes.
- **Laravel Vapor:** Serverless Octane via FrankenPHP on Lambda. Vapor handles sandbox lifecycle implicitly via Lambda cold/warm starts.
- **Laravel Horizon:** Queue monitoring coexists with Octane but runs in separate workers. Horizon's state (supervisor counts) must not be accessed from Octane workers.
- **Spatie packages:** Many Spatie packages (permission, media-library) require `OctaneSandbox` awareness for per-request state. Spatie maintains Octane compatibility docs.

## Related Knowledge Units
### Prerequisites
- singleton-state-leaks (deep dive on the primary failure mode)
- scoped-bindings-for-octane (the solution to singleton leaks)

### Related Topics
- static-property-accumulation (the second major leak vector)
- octane-lifecycle-hooks (tick, RequestTerminated)
- octane-configuration-and-workers (worker tuning details)

### Advanced Follow-up Topics
- service-binding-audit (systematic audit methodology)
- memory-profiling-and-observability (observing sandbox behavior)
- octane-package-compatibility (sandbox implications for packages)

## Research Notes
- Swoole v5.x introduced `HookFlags` for finer-grained coroutine hooking. Not all PHP functions are safe to hook (e.g., `proc_open`).
- RoadRunner v3.x added gRPC and TCP support. The HTTP plugin remains the primary Octane transport.
- FrankenPHP merges Caddy's config with Octane's sandbox. `frankenphp.yml` replaces `octane.php` for some settings.
- Laravel 11+ ships Octane as a first-party choice (no longer requiring `laravel/octane` install separately in some starter kits). The sandbox abstraction is stable since Octane v2.x.
- Research gap: benchmark sandbox creation cost vs alternative strategies (e.g., selective reset, diff-based sandbox). Current sandbox is O(n) in number of bound services.
