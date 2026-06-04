# Octane Boot Timing

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Boot Order & Timing |
| Knowledge Unit | Octane Boot Timing |
| Difficulty | Advanced |
| Lifecycle Phase | Application Bootstrap / Long-Running |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Under Laravel Octane (Swoole, RoadRunner, FrankenPHP), the boot sequence fundamentally changes. The application boots once per worker process, not once per request. All bootstrappers, service provider `register()` and `boot()` methods, and booting/booted callbacks execute a single time when the worker starts. Subsequent requests handled by that worker skip the entire bootstrap pipeline — they proceed directly to request handling. This model transforms bootstrap from a per-request cost to a one-time startup cost, dramatically improving throughput but introducing state management challenges.

## Core Concepts
- **One-time boot**: `Application::boot()` runs once per worker. The `$this->booted` flag and `$this->hasBeenBootstrapped` flag prevent re-execution.
- **Per-request reset**: The Application instance is preserved across requests, but state must be reset between requests. Octane's `RequestTerminated` event flushes session, auth, and uploaded files.
- **Scoped bindings**: `$app->scoped()` creates bindings that are resolved fresh per request, unlike singletons which persist across requests.
- **No middleware re-initialization**: Middleware resolution still happens per-request via the container, but provider boot is one-time.
- **$instances persistence**: The container's `$instances` array accumulates singletons across requests — this is both the performance benefit and the source of memory leaks.
- **Boot sequence**: Same 16-step sequence as HTTP, but steps 1-15 happen once per worker start. Steps 11-15 (middleware pipeline through response) repeat per request.

## When To Use
- All Octane-deployed applications — understanding boot timing is essential for Octane-safe code.
- Debugging state leaks that only appear after the first request in Octane workers.
- Optimizing worker startup time by deferring providers and using services cache.

## When NOT To Use
- Traditional PHP-FPM deployments — boot timing is per-request, not one-time.
- Queue workers — they use the Console Kernel but share the same one-time boot model.
- Development environments where worker restart on every file change is acceptable.

## Best Practices (WHY)
- **Pre-resolve hot-path services in booted()**: Services used on every request should be pre-resolved to avoid per-request resolution overhead. *Why: Resolution cost is paid once per worker, not once per request.*
- **Use scoped() for per-request state**: Auth, session, tenant, and locale services should be scoped. *Why: Singletons persist across requests; scoped bindings are flushed between requests.*
- **Audit all singletons**: Check every `singleton()` for mutable state that could leak between requests. *Why: A singleton that accumulates request-specific data will leak to subsequent requests.*
- **Clear resolved instances**: Use `Facade::clearResolvedInstance()` in `RequestTerminated` listener for facades that hold request-specific state. *Why: Facade root caching uses static properties that persist across requests.*
- **Leverage one-time boot cost**: Move service registration, route loading, and view compilation to boot() knowing they execute once. *Why: The per-request amortization makes these operations essentially free.*

## Architecture Guidelines
- Octane boots the application in the main worker process before accepting requests.
- The `config/octane.php` file configures which listeners fire on `RequestTerminated` for state reset.
- Octane's default `Flush*` listeners handle session, auth, uploaded files, and other request-specific state.
- Deferred providers become even more efficient under Octane — their loading cost is paid once per worker (first request that needs them), then amortized.
- The `tick()` method allows running periodic callbacks (e.g., every N requests) in long-running workers.

## Performance
- **Bootstrap cost amortization**: 50-100ms bootstrap cost is paid once and spread across thousands of requests — effectively zero per request.
- **Provider overhead elimination**: `register()` and `boot()` overhead (typically 10-30ms) is zero per request under Octane.
- **Singleton memory growth**: The `$instances` array grows as services are first resolved. Monitor total memory usage over time.
- **Worker max requests**: Configure `octane.max_requests` to periodically restart workers, preventing unbounded memory growth.
- **Scoped binding overhead**: `scoped()` requires flushing `$instances` per request — minimal overhead (~0.1ms per scoped binding).

## Security
- State leaks under Octane can expose user A's data to user B — the most critical security concern. Use `scoped()` for all user-specific services.
- Authentication state must be explicitly flushed between requests — Octane's `FlushAuthenticationState` listener handles this.
- Session data must be flushed — `FlushSessionState` listener handles this. Without it, session data persists across requests.
- Static property accumulation in packages (cache arrays, collections) is a security concern — data from one request persists to the next.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Using singleton for request-state services | Not understanding Octane's one-time boot | User data leaks between requests | Use scoped() for per-request services |
| Static property accumulation | Global state in package or custom code | Memory grows unbounded; data leaks | Use instance properties, not static |
| Not testing with Octane | Developing on FPM, deploying on Octane | Subtle state bugs in production | Run tests with Octane in CI |
| Ignoring max_requests | No worker restart configured | Memory leaks accumulate until OOM | Set reasonable max_requests (e.g., 500-1000) |
| Deferred provider assumption | Provider deferred thinking it's cheaper | First request pays provider load cost | Pre-resolve in booted() for critical providers |

## Anti-Patterns
- **Request-scoped singletons**: Using `singleton()` for services that hold per-request state and hoping it works under Octane.
- **No flush listeners**: Running Octane without `FlushUploadedFiles`, `FlushSessionState`, `FlushAuthenticationState` in `octane.php`.
- **Static cache accumulation**: Using static class properties as caches that grow unbounded under Octane.
- **Deferred providers everywhere**: Making all providers deferred to "optimize" Octane — they load on first request anyway.

## Examples
```php
// config/octane.php — required flush listeners
'listeners' => [
    RequestTerminated::class => [
        FlushUploadedFiles::class,
        FlushSessionState::class,
        FlushAuthenticationState::class,
        \App\Listeners\FlushTenantState::class,
    ],
],
```

## Related Topics
- **Prerequisites:** Complete Boot Sequence — the shared bootstrap pipeline Octane optimizes.
- **Closely Related:** Octane Architecture Overview, Singleton State Leaks — the full Octane lifecycle.
- **Advanced:** Scoped Bindings for Octane — the binding type that makes Octane safe.
- **Cross-Domain:** Long-Running Process Architecture — Octane as a first-class concern.

## AI Agent Notes
- Octane calls `$app->boot()` once in the worker lifecycle. The `booted` flag prevents re-execution.
- The `$instances` array persists across requests — use `scoped()` instead of `singleton()` for request-aware services.
- Octane dispatches `RequestTerminated` event which is the hook for state flushing.
- To check if running under Octane: `$app->bound('octane')` or `app()->runningInConsole()` considers Octane as "not console."
- Static property leaks are the #1 Octane production issue — audit all static properties in custom and package code.

## Verification
- [ ] All per-request services use scoped(), not singleton()
- [ ] Static properties are audited for accumulation risk
- [ ] Octane flush listeners are configured for session, auth, uploaded files
- [ ] max_requests is configured to prevent unbounded memory growth
- [ ] Tests run with Octane or worker-like isolation to catch state leaks
