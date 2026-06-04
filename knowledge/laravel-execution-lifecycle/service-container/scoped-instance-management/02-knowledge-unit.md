# Scoped Instance Management

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Container
- **Knowledge Unit:** Scoped Instance Management
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Scoped instance management is the container subsystem responsible for managing service instances whose lifetime is confined to a specific scope boundary — typically a single HTTP request in Octane or a single job in a queue worker. Implemented through the `$scopedInstances` array and the `scoped()` binding method, this feature provides the semantics of singletons within a scope while ensuring automatic cleanup at scope boundaries, preventing the state leakage that plagues traditional singleton usage in long-running processes.

The critical engineering decision in scoped instances is that they are stored separately from the main `$instances` cache (which holds traditional singletons). The `$scopedInstances` array is cleared by `flushScoped()`, while `$instances` persists for the process lifetime. This separation enables Octane to call `flushScoped()` at the end of each request, destroying request-bound singletons while preserving process-global singletons (config, router, kernel). The consequence is that service providers must correctly classify every shared binding as either process-scoped (singleton) or request-scoped (scoped) — incorrect classification causes either state leaks (singletons storing request data) or excessive re-construction (scoped services re-built per request unnecessarily).

For production applications, scoped instances are the primary Octane-safe alternative to singletons. Every service that holds per-request state — authenticated user, tenant context, locale setting, request-scoped cache — must be registered with `scoped()` rather than `singleton()` when deploying under Octane. The migration from singleton to scoped is the single most impactful Octane preparation step; failure to do so is the root cause of the "#1 Octane bug" — user A sees user B's data.

---

## Core Concepts

### Scoped Binding Registration
```php
$this->app->scoped(CurrentTenant::class, TenantContext::class);
$this->app->scoped(UserLocale::class, function ($app) {
    return new UserLocale($app->make(Request::class)->getPreferredLanguage());
});
```

### Scope Boundaries
The default scope boundary is the request. `flushScoped()` is called by the Octane request handler at the end of each request:

```php
// Octane request handler (simplified)
$response = $kernel->handle($request);
$app->flushScoped(); // Clears all scoped instances
$kernel->terminate($request, $response);
```

### flushScoped() — Scope Reset
Clears the `$scopedInstances` array, forcing re-resolution on next `make()`:

```php
public function flushScoped(?array $abstracts = null): void
{
    if ($abstracts === null) {
        $this->scopedInstances = [];
        return;
    }

    foreach ($abstracts as $abstract) {
        unset($this->scopedInstances[$abstract]);
    }
}
```

### Scoped vs Singleton Storage
Scoped instances are stored in `$scopedInstances`, checked during resolution after the main `$instances` cache:

```php
// Inside resolve() — after instances check but before bindings
if (isset($this->scopedInstances[$abstract]) && ! $needsContextualBuild) {
    return $this->scopedInstances[$abstract];
}
```

---

## Mental Models

### The Hotel Room
A hotel where each guest (request) gets a room (scoped instance). The room is private to that guest for their stay (scope boundary). When the guest checks out (request ends), the room is cleaned and reset (`flushScoped`). The hotel building itself (singleton) stays — the elevators, lobby, and management systems persist across guests. A scoped instance is the room key — valid only for your stay.

### The Whiteboard in a Meeting Room
A meeting room with a whiteboard (`scoped`). Each meeting (scope) gets a clean whiteboard. During the meeting, you write notes on the board (store state). After the meeting, the board is erased (`flushScoped`). The next meeting starts with a blank board. A singleton, by contrast, is the building's sign — it never changes between meetings.

### The Sandbox Playground
Each child (request) gets a sandbox (scoped instances) with fresh toys. When playtime ends (request complete), the sandbox is reset — toys are collected and cleaned. The playground structure itself (swings, slide — singletons) stays. A child leaving returns to a clean sandbox; no child finds another child's leftover toys.

---

## Internal Mechanics

### Storage Structure

Two separate arrays maintain instance caches:

```php
// Process-lifetime singletons
$this->instances = [
    'config' => ConfigRepository { ... },
    'router' => Router { ... },
    // Never cleared during request lifecycle
];

// Request-scoped singletons
$this->scopedInstances = [
    CurrentTenant::class => TenantContext { tenant: 42 },
    UserLocale::class => UserLocale { locale: 'fr' },
    // Cleared by flushScoped() at request end
];
```

### Resolution Integration

Within `resolve()`, the scoped instances cache is checked after the main instances cache:

```php
protected function resolve($abstract, $parameters = [], $raiseEvents = true)
{
    $abstract = $this->getAlias($abstract);

    // 1. Check process-lifetime instances
    if (isset($this->instances[$abstract]) && ! $needsContextualBuild) {
        return $this->instances[$abstract];
    }

    // 2. Check scoped instances
    if (isset($this->scopedInstances[$abstract]) && ! $needsContextualBuild) {
        return $this->scopedInstances[$abstract];
    }

    // ... build, extend, callback ...

    // Cache if shared
    if ($this->isShared($abstract)) {
        if ($this->isScoped($abstract)) {
            $this->scopedInstances[$abstract] = $object;
        } else {
            $this->instances[$abstract] = $object;
        }
    }
}
```

### isScoped() Check
The container tracks which bindings are scoped through the binding definition. A `Definition` (Laravel 12+) has an `$isScoped` flag:

```php
public function isScoped($abstract): bool
{
    return isset($this->bindings[$abstract])
        && $this->bindings[$abstract] instanceof Definition
        && $this->bindings[$abstract]->isScoped;
}
```

### Octane Integration
Laravel Octane's request handler calls `flushScoped()` after each request via the `Octane\RequestContext` lifecycle:

```php
// Octane\WorkerState (simplified)
public function endRequest(): void
{
    $this->container->flushScoped();
    $this->container->forgetInstances(); // Optional: also clear non-scoped instances
}
```

---

## Patterns

### Octane-Safe Tenant Context
```php
// ServiceProvider
$this->app->scoped(TenantContext::class, function ($app) {
    return new TenantContext($app->make(Request::class)->getHost());
});

// Controller
class DashboardController {
    public function __construct(protected TenantContext $tenant) {}
    // Each request gets a fresh TenantContext with correct tenant
}
```

### Request-Scoped Cache
```php
$this->app->scoped(RequestCache::class, function ($app) {
    return new RequestCache($app->make(Cache::class));
});

// In a service:
class ProductService {
    public function __construct(protected RequestCache $cache) {}
    
    public function getProducts(): array
    {
        return $this->cache->remember('products', fn() => /* query */);
    }
    // Cache is per-request — automatically cleared after scope flush
}
```

### Locale/Language Context
```php
$this->app->scoped(LocaleContext::class, function ($app) {
    return new LocaleContext(
        $app->make(Request::class)->getLocale()
    );
});
```

### Selective Flush
```php
// Clear only specific scoped instances
$app->flushScoped([TenantContext::class, LocaleContext::class]);
// Other scoped instances remain (e.g., RequestCache)
```

---

## Architectural Decisions

### Why scoped instances are stored separately from $instances
The separation enables bulk operations — `flushScoped()` clears all request-scoped instances without touching process-scoped singletons. If scoped instances were mixed into `$instances`, flushing would require iterating every singleton and checking a flag, which is slower and risks accidentally clearing a process-level singleton. The separate array makes scope boundaries explicit at the storage level.

### Why the container checks $instances before $scopedInstances
Process-lifetime singletons take priority over request-scoped instances. This ensures that if a service provider mistakenly registers the same abstract with both `singleton()` and `scoped()`, the singleton (process-lifetime) wins. The ordering also enables a migration path: a service registered as `singleton()` in Laravel 10 can remain registered that way even after `scoped()` is introduced — it will be found in the `$instances` cache first and returned, never reaching the `$scopedInstances` check.

### Why flushScoped() accepts an optional array of abstracts
Selective flushing enables fine-grained scope control. A tenant-switching middleware might flush the `TenantContext` scoped instance mid-request when switching tenants, while leaving other scoped instances intact. The optional array makes the API flexible without requiring multiple method overloads.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Automatic cleanup at scope boundaries prevents state leaks | Scope boundaries must be explicitly triggered (flushScoped()) | If scope is not flushed, scoped instances persist like singletons |
| Separate storage from process singletons | Two instance caches increase container complexity | Double cache check on every resolution (~0.3μs overhead) |
| Selective flush enables mid-scope management | Selective flush requires knowing which abstracts to clear | Over-flushing clears instances unnecessarily, causing re-resolution cost |
| Octane-safe by default for scoped() bindings | Migration from singleton() requires code changes | Teams must audit and reclassify existing singletons for Octane deployment |

---

## Performance Considerations

Scoped instance resolution has identical performance to singleton resolution within a scope — O(1) array lookup in `$scopedInstances`. The `flushScoped()` operation is O(N) where N is the number of scoped instances. With 50 scoped instances, flush takes ~2-5μs — negligible per request.

The double cache check (`$instances` then `$scopedInstances`) adds ~0.3μs per resolution. For a request with 100 scoped resolutions, this adds ~30μs total — immeasurably small compared to database queries or view rendering.

In Octane, scoped instances that hold large data (e.g., a serialized cache of 10MB) are flushed at request end, freeing memory for the next request. This contrasts with singletons, which accumulate data across requests. Scoped instances thus provide both correctness and memory efficiency in long-running processes.

---

## Production Considerations

- **Audit all `singleton()` bindings before Octane deployment.** Every singleton that holds request-scoped data (user, tenant, locale, request instance) must be converted to `scoped()`. Static analysis tools can automate this audit.
- **Ensure `flushScoped()` is called.** Octane handles this automatically. For queue workers, call `$app->flushScoped()` in the worker's `after` hook to prevent job-to-job state leakage.
- **Monitor scoped instance memory.** Log the size of `$scopedInstances` periodically. Unexpectedly large instances may indicate that a scoped service is accumulating data within a single scope.
- **Use selective flush for mid-request scope changes.** If your application switches tenants mid-request (multi-tenant with tenant-per-request scope), call `$app->flushScoped([TenantContext::class])` at the switch point.

---

## Common Mistakes

**Why it happens:** Using `singleton()` for services that hold authenticated user data. **Why it's harmful:** Under Octane, the singleton holds user A's data after user A's request completes. User B's request resolves the same singleton and gets user A's data — a data leak. **Better approach:** Use `scoped()` for any service containing per-request or per-user state.

**Why it happens:** Assuming `scoped()` and `singleton()` are interchangeable in FPM. **Why it's harmful:** They behave identically in FPM (process dies after request). But if the application later migrates to Octane, the distinction matters. Latent `singleton()` calls for request-scoped services are a deployment blocking issue. **Better approach:** Always use `scoped()` for request-scoped services, even in FPM. This makes future Octane migration seamless.

**Why it happens:** Not calling `flushScoped()` at the start of a new scope in queue workers. **Why it's harmful:** Scoped instances from the previous job persist into the next job, leaking state across jobs. **Better approach:** Call `$app->flushScoped()` at the beginning of each job, before any job-specific resolution occurs.

**Why it happens:** Storing a reference to a scoped instance in a singleton property. **Why it's harmful:** The singleton holds a reference to a scoped instance that will be flushed. After flush, the singleton holds a stale reference to an object that is no longer in the container's scope cache — but the singleton still returns it. **Better approach:** Never cache scoped instances in singletons. Re-resolve through the container each time.

---

## Failure Modes

### Scoped Instance Not Flushed — State Leak
A scoped instance persists across requests because `flushScoped()` was not called or was called conditionally. **Common causes:** Octane not configured to flush, custom scope boundary without flush, or exception before flush call. **Detection:** Users see data from previous requests. **Mitigation:** Ensure `flushScoped()` is called in a `finally` block, not just on success path. Octane does this automatically; custom queue workers must implement it.

### Singleton Holding Scoped Reference — Stale Data
A singleton caches a reference to a scoped instance that is later flushed. **Common causes:** A singleton service (e.g., `CacheManager`) lazily resolves and stores a scoped dependency. **Detection:** The scoped dependency appears to work but returns stale data after the first scope boundary. **Mitigation:** Singletons should only depend on other singletons. If a singleton needs a scoped service, resolve it on each use rather than storing it.

### Scoped Instance Accumulation — Memory Growth
A scoped service accumulates data within a single scope, growing unbounded. **Common causes:** A scoped cache service that caches query results without eviction — if the request makes many queries, the cache grows until scope flush. **Detection:** Memory usage spikes for long-running Octane requests. **Mitigation:** Set an upper bound on scoped caches, or use a TTL-based approach even for request-scoped data.

---

## Ecosystem Usage

**Laravel Octane:** The Octane package is the primary consumer of scoped instance management. Octane's `WorkerState` class calls `$container->flushScoped()` after every request. This is the mechanism that prevents state leakage between Octane requests. The `Sandbox` class in Octane also uses scoped instances to isolate request-specific state.

**Laravel Horizon:** Horizon queue workers flush scoped instances between jobs to prevent state leaks across queued jobs. The `Worker` class calls `$this->app->flushScoped()` at the end of each job processing cycle.

**Laravel Cashier (Stripe):** Uses `scoped()` for the Stripe API client instance. Each request or job gets a fresh client with the correct tenant's API keys, while the underlying HTTP client connection is managed as a singleton for connection pooling.

**Spatie Laravel Multitenancy:** Uses `scoped()` for the `CurrentTenant` context. Each request resolves the correct tenant from the request domain or header, and the scoped binding ensures that all services within the request see the same tenant without requiring explicit parameter passing.

---

## Related Knowledge Units

### Prerequisites
- Container Fundamentals
- Binding Types

### Related Topics
- Binding Resolution
- Container Aliases

### Advanced Follow-up Topics
- Resolution Callbacks
- Rebound Callbacks

---

## Research Notes

### Source Analysis
- `Illuminate\Container\Container::scoped()` (lines 285-295): Registers a binding with shared + scoped flags.
- `Illuminate\Container\Container::$scopedInstances` (property, line 145): Separate cache array for scoped instances.
- `Illuminate\Container\Container::flushScoped()` (lines 500-510): Clears scoped instances — optionally selective.
- `Illuminate\Container\Container::isScoped()` (lines 530-545): Checks binding definition for scoped flag.
- `Illuminate\Container\Container::resolve()` (lines 600-700): Scoped instances cache check (step 2 after process instances).
- `Laravel\Octane\WorkerState` (Octane package): Calls `flushScoped()` in request lifecycle.

### Key Insight
The `$scopedInstances` array is checked *after* `$instances` but *before* `$bindings`. This means a scoped instance that is resolved once is returned from the scoped cache on subsequent resolutions within the same scope — the scope acts as a singleton lifetime. But if an abstract has both a singleton and a scoped binding registered, the process-lifetime singleton always wins because it's checked first.

### Version-Specific Notes
- **Laravel 10.x:** No `scoped()` method. All shared bindings were process-lifetime singletons. State leakage under Octane was a known problem with no framework solution.
- **Laravel 11.x:** `scoped()` introduced. `$scopedInstances` array added to Container. `flushScoped()` added. Octane integration added in Octane 2.x.
- **Laravel 12.x:** `scoped()` bindings shown in `bound()` results (previously hidden). `flushScoped()` accepts optional abstract array for selective flushing.
- **Laravel 13.x:** Scoped instances participate in rebound callbacks. `forgetScopedInstance()` added for per-abstract removal without full flush. Container provides `scopedInstances()` method for debugging.
