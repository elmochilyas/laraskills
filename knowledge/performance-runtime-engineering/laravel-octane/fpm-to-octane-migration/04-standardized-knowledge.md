# FPM to Octane Migration — Service Provider Audit, Static Property Elimination, State Leak Testing

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane Performance |
| Knowledge Unit | FPM to Octane Migration — Service Provider Audit, Static Property Elimination, State Leak Testing |
| Difficulty | Enterprise |
| Last Updated | 2026-06-02 |

## Overview

Migrating from PHP-FPM to Octane is not a drop-in change. The migration requires: 1) **Service provider audit** — ensure providers are compatible with persistent execution, 2) **Static property elimination** — remove or refactor all static properties used for request-scoped data, 3) **State leak testing** — run concurrent requests and verify no cross-request contamination. The migration checklist covers ~20–30 action items for a medium Laravel application.

## Core Concepts

- **Service provider audit**: Check every provider's `register()` and `boot()` methods. Side effects (event listeners, middleware, route registrations) must be idempotent. Database queries in `boot()` should be cached or moved to lazy initialization.
- **Static property audit**: `grep -r "static \$" app/` and each `/vendor/...` package used. Request-scoped static data must become `scoped()` container bindings. Global state must be eliminated.
- **State leak testing**: `ab -n 100 -c 10 http://localhost:8000/test?user=A` followed by `.../test?user=B` — if response A leaks into response B, a state leak exists.
- **Package compatibility matrix**: Laravel packages known to work with Octane: Cashier, Horizon, Telescope, Socialite. Known problematic: packages using global state, static caches, or direct `$_SESSION` access.

## When To Use

- You are planning to migrate a PHP-FPM Laravel application to Octane for throughput improvements (2.5–20×).
- You have a medium-to-large Laravel codebase with multiple service providers and custom packages.
- You need a structured, auditable migration plan with verification steps.

## When NOT To Use

- Your application uses packages known to be incompatible with Octane and you cannot replace or modify them.
- Your application relies heavily on `$_SESSION`, `$_REQUEST`, or other superglobal manipulation that cannot be easily refactored.
- You do not have the capacity for thorough testing (concurrent request tests, soak tests) before production deployment.
- Your application uses `ext-pcntl` features that conflict with Octane's process management (e.g., custom signal handlers).

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Follow migration order: static properties → providers → singletons → deferred → local test → staging → production | Each step builds on the previous. Fixing static properties first prevents the most common and dangerous leaks. |
| Run state leak tests before and after each migration step | Isolates which change introduced or fixed a leak. Makes debugging tractable. |
| Use `Octane::booted()` for per-worker initialization | Ensures one-time setup logic runs exactly once per worker, not per request. |
| Deploy to 10% of servers first, compare error rates for 24 hours | Catches environment-specific issues that don't surface in staging. |
| Test all third-party packages under Octane before full migration | A single incompatible package can cause intermittent data leakage that is extremely hard to diagnose. |

## Architecture Guidelines

- **Migration order**: 1) Static property audit and fix, 2) Service provider audit, 3) Singleton → scoped binding migration, 4) Deferred provider optimization, 5) Local Octane testing, 6) Staging deployment with canary traffic, 7) Production rollout.
- **Provider refactoring strategy**: Split monolithic providers into smaller, focused providers. Each provider should have a single responsibility and be independently auditable.
- **Static property elimination**: Replace `public static $cache = []` with `app()->instance()` bindings. For caches, use Laravel's cache facade. For request-scoped data, use `scoped()` bindings.
- **State leak detection infrastructure**: Set up `octane:watch` during development. Monitor worker RSS in staging and production. Alert on >10% RSS growth per hour.

## Performance Considerations

- Octane delivers 2.5–20× throughput over PHP-FPM; API endpoints with <50ms response see biggest gains.
- Each worker uses 30–80MB RSS; total memory = workers × per-worker memory.
- Each worker maintains persistent DB/Redis connections; total = workers × connections-per-worker.
- Under Octane, database queries become primary bottleneck (bootstrap is eliminated).
- OpCache preloading further reduces cold-start latency by 2–5ms per worker.
- Migration itself does not improve performance — the gain comes from running Octane successfully after migration.

## Security Considerations

- State leaks can cause data exposure (User A sees User B's data). This is the primary security concern during migration.
- Static property elimination: request-scoped data stored in static properties becomes visible to all subsequent requests in the same worker.
- Singleton misuse: services registered as singletons that hold request-scoped data (e.g., `Auth::user()`) cause privilege escalation or data leakage.
- Session data in Octane: Octane uses Laravel's session drivers (cookie, database, Redis, file). Ensure session driver is configured correctly — cookie-based sessions are simplest and avoid shared state.
- Package audit for security-critical packages: Any package handling authentication, authorization, or encryption must be verified Octane-compatible.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Skipping the package audit | Deploying Octane without auditing all third-party packages. | Assuming all packages work identically under Octane. | A package using `public static $queryLog = []` causes data leakage between users. Intermittent, hard-to-debug issues. | Test all packages under Octane before full migration. Use a package compatibility matrix. |
| Relying on `$_SESSION` or `$_REQUEST` | Using PHP superglobals that assume per-request lifecycle. | Superglobals persist across requests in a worker. | Previous request's data contaminates current request. | Use Laravel's session and request facades instead of superglobals. |
| Not testing concurrent requests | Running only sequential tests before migration. | Sequential requests don't reveal state leaks caused by concurrent access. | Leaks discovered in production under load. | Run `ab -n 100 -c 10` with different user parameters to detect leaks. |
| Ignoring `octane:watch` during development | Skipping Octane's built-in state leak detection. | `octane:watch` slows development (reloads on file change). | Leaks accumulate silently during development, caught only in staging or production. | Run `octane:watch` at least once during a focused testing session before staging deploy. |

## Anti-Patterns

- **Big-bang migration**: Deploying Octane to all servers simultaneously without canary testing. Always roll out to a percentage of servers first.
- **No rollback plan**: Deploying Octane without a quick rollback mechanism. Keep the FPM deployment configuration intact for at least one release cycle.
- **Auditing only app code, not vendor code**: Third-party packages are a major source of static property leaks. Run static analysis on vendor code or at least test known packages.
- **Assuming `php artisan octane:status` shows no leaks**: `octane:status` only shows worker health, not data integrity. You must run explicit state leak tests.

## Examples

```
// Before: static property leak in FPM-friendly code
class QueryLogger
{
    public static array $queries = [];

    public function log(string $sql): void
    {
        self::$queries[] = $sql;  // Leaks across requests in Octane!
    }
}

// After: Octane-safe using container binding
class QueryLogger
{
    public array $queries = [];

    public function log(string $sql): void
    {
        $this->queries[] = $sql;
    }
}
// In service provider:
$this->app->scoped(QueryLogger::class);  // Fresh instance per request
```

```
// State leak test script
// Run with ab (Apache Benchmark)
ab -n 100 -c 10 "http://localhost:8000/test?user=alice"
# Then verify response contains only alice's data

ab -n 100 -c 10 "http://localhost:8000/test?user=bob"
# Then verify response contains only bob's data

# If alice's data appears in bob's response, a state leak exists.
```

```
// Migration checklist script
#!/bin/bash
echo "=== Octane Migration Audit ==="
echo "1. Static properties in app/..."
grep -rn "static \$\|static::\|self::" app/ --include="*.php"
echo "2. Service providers with boot() side effects..."
grep -rn "function boot\|Event::listen\|Route::\|\$this->app\['events'" app/Providers/ --include="*.php"
echo "3. Packages to verify..."
cat composer.json | grep -E '"require"|"require-dev"' -A 50 | grep '"php"' -v
```

## Related Topics

- State Management and Leak Prevention
- Service Provider Optimization
- Package Compatibility Matrix
- Octane Architecture and Execution Model
- Worker Configuration by Driver

## AI Agent Notes

- When asked about Octane migration, the first step is always the static property audit. Use `grep -r "static \$" app/` to find candidates.
- The package audit is the most commonly skipped step. Always recommend testing all third-party packages under Octane.
- For state leak testing, recommend using `ab` (Apache Benchmark) with different user parameters to detect cross-request contamination.
- Octane migration takes 1–4 weeks for a medium Laravel application depending on codebase complexity and package compatibility.
- `php artisan octane:status` is a health check, not a leak detector. Always pair it with explicit data-integrity tests.

## Verification

- [ ] Run `grep -rn "static \$\|self::\|static::" app/ --include="*.php"` and refactor all request-scoped static properties to container bindings.
- [ ] Run `grep -rn "function boot\|Event::listen\|Route::" app/Providers/ --include="*.php"` and verify all boot-time side effects are idempotent.
- [ ] Run concurrent request tests (`ab -n 100 -c 10`) with different user parameters and verify no cross-request contamination.
- [ ] Test all third-party packages under Octane in a staging environment.
- [ ] Run `php artisan octane:watch` during a focused testing session to catch state leaks.
- [ ] Measure worker RSS growth over a 24-hour soak test — alert if >10% per hour.
- [ ] Verify graceful reload works: `php artisan octane:reload` does not drop in-flight requests.
- [ ] Configure health check monitoring and alerting before production rollout.
- [ ] Deploy to 10% of servers first; monitor error rates for 24 hours.
- [ ] Document rollback procedure: revert to FPM by switching the process manager configuration.
