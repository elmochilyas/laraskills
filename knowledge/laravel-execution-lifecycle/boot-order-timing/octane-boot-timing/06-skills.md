# Skill: Adapt Boot Timing for Octane Long-Running Workers

## Purpose
Configure Laravel Octane service providers, bindings, and state management to handle the one-time boot model correctly — preventing state leaks, managing singleton scoping, and optimizing per-request performance.

## When To Use
- Deploying an existing Laravel application on Octane (Swoole, RoadRunner, FrankenPHP)
- Writing new service providers for an Octane-deployed application
- Debugging state leaks between requests in Octane workers
- Optimizing worker startup time and per-request throughput

## When NOT To Use
- Traditional PHP-FPM deployments — boot timing is per-request, not one-time
- Development environments where worker restart on every file change is acceptable
- Queue workers that already use a one-time boot model (though many principles apply)

## Prerequisites
- Understanding of the normal 16-step boot sequence from `complete-boot-sequence`
- Knowledge of the container's `singleton()` vs `scoped()` binding types
- Familiarity with Octane's `RequestTerminated` event and flush listeners
- Understanding of PHP static property behavior in long-running processes

## Inputs
- Current service provider bindings and their binding types (`singleton` vs `scoped`)
- Configuration file `config/octane.php`
- List of services that hold per-request state

## Workflow
1. Audit all `$app->singleton()` calls — identify services that hold mutable per-request state (auth, session, tenant, locale)
2. Replace inappropriate singletons with `$app->scoped()` — scoped bindings provide fresh instances per request
3. Add Octane flush listeners in `config/octane.php`: `FlushSessionState`, `FlushAuthenticationState`, `FlushUploadedFiles`
4. Add application-specific flush listeners for custom request-scoped state (tenant, locale, feature flags)
5. Set `octane.max_requests` to 500-1000 to prevent unbounded memory growth
6. In `$app->booted()` callbacks, pre-resolve hot-path services that are used on every request (cost paid once per worker)
7. Audit all static class properties in custom and package code — replace with instance properties or clear between requests
8. Use `Facade::clearResolvedInstance()` in `RequestTerminated` listeners for facade roots that hold request-specific state
9. Test with multiple sequential requests in the same worker to verify no state leaks

## Validation Checklist
- [ ] All per-request services use `scoped()` instead of `singleton()`
- [ ] Octane flush listeners are configured for session, auth, and uploaded files
- [ ] Application-specific flush listeners handle custom request-scoped state
- [ ] `max_requests` is configured to prevent unbounded memory growth
- [ ] Static class properties are audited and use instance properties where appropriate
- [ ] Hot-path services are pre-resolved in `booted()` for Octane optimization
- [ ] Tests run with sequential requests in the same worker to catch state leaks

## Common Failures
- Using `singleton()` for auth/session services — user A's data leaks to user B in the same worker
- Static property accumulation — request counters, cached queries, and collections grow unbounded across requests
- Missing flush listeners — session data persists across requests; uploaded files remain accessible
- Not setting `max_requests` — memory grows until OOM-killer terminates the worker
- Deferred providers that load on first request — first request pays more; pre-resolve in `booted()` if the service is used on every request

## Decision Points
- Use `scoped()` for any service that could hold request-specific state (even if it currently doesn't) — it's safer
- Pre-resolve truly stateless singleton hot-path services in `booted()` to avoid per-request resolution
- For static caches, use `SplObjectStorage` or weak references that can be garbage collected, or flush them between requests
- If a package has known Octane issues, wrap its usage in a service that properly handles per-request state flushing

## Performance Considerations
- Bootstrap cost (50-100ms) is paid once per worker and amortized across thousands of requests
- Singleton resolution cost is paid once per worker for pre-resolved services
- Scoped bindings require flushing `$instances` per request — minimal overhead (~0.1ms per scoped binding)
- Deferred providers load once per worker on first use — first request pays the load cost
- `max_requests` restart introduces a ~50-100ms latency spike for the next request after restart

## Security Considerations
- State leaks under Octane can expose user A's data to user B — the most critical security concern
- Auth state must be explicitly flushed between requests — `FlushAuthenticationState` listener handles this
- Session data must be flushed — `FlushSessionState` listener handles this
- Static property accumulation in packages is a security concern — data from one request persists to the next
- Audit all facades that hold request-specific state — use `Facade::clearResolvedInstance()` in flush listeners

## Related Rules
- Octane Boot Timing Rule 1: Use scoped() for All Per-Request State
- Octane Boot Timing Rule 3: Configure Octane Flush Listeners for Auth, Session, Uploads
- Octane Boot Timing Rule 6: Test with Octane to Catch State Leaks

## Related Skills
- Navigate the Complete Boot Sequence (complete-boot-sequence)
- Use Lifecycle Callback Hooks for Cross-Provider Coordination (lifecycle-callback-hooks)
- Implement Deferred Providers for Bootstrap Optimization (deferred-provider-loading-timing)
- Write Context-Aware Boot Code for Console vs HTTP (console-vs-http-boot-differences)

## Success Criteria
- No state leaks occur between requests handled by the same Octane worker
- All per-request services use `scoped()` binding type
- Octane flush listeners are fully configured and tested
- Workers restart before memory growth causes issues (via `max_requests`)
- Hot-path services are pre-resolved for optimal per-request performance
- Sequential-request tests pass without data leakage between requests
