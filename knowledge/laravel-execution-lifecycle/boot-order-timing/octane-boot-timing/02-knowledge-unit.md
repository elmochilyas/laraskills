# Octane Boot Timing

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **Last Updated:** 2026-06-02

## Executive Summary
Laravel Octane (Swoole, RoadRunner) fundamentally alters the boot sequence economics by running the full bootstrap pipeline once per worker process start, then reusing the booted application across thousands of subsequent requests. The `register()` and `boot()` phases execute a single time; per-request handling is limited to the middleware pipeline, route dispatch, and response generation. However, this model introduces new complexities: application state must be reset between requests via the sandbox mechanism, service provider singletons must be request-agnostic, and callbacks registered during boot must not accumulate or leak. Understanding Octane's boot-time model is essential for writing performant, memory-safe Laravel applications under long-running processes.

## Core Concepts

### One-Time Boot vs Per-Request Bootstrap

| Aspect | Traditional PHP-FPM | Octane (Swoole/RoadRunner) |
|---|---|---|
| **Boot frequency** | Every request | Once per worker start |
| **Boot cost** | Paid on every request | Amortized over 1000s of requests |
| **Provider register()** | Every request | Once per worker |
| **Provider boot()** | Every request | Once per worker |
| **Config loading** | Every request | Once per worker |
| **Service instances** | Fresh per request | Shared across requests (sandboxed) |
| **Memory model** | Clean per request | Persistent; must reset state |
| **Request lifecycle** | Full bootstrap → middleware → response | Middleware → response (sandbox reset) |

### Octane Boot Flow
```
Worker Start:
  public/index.php (modified by Octane)
    → Create Application
    → Register OctaneServiceProvider
    → Kernel::bootstrap()  (full 16-step sequence)
    → Application::boot()  (all providers register + boot)
    → Enter event loop (wait for requests)

Each Request:
  → Octane server receives request
  → Sandbox is "refreshed" (reset request-specific state)
  → Request is sent through middleware pipeline
  → Route dispatch → Controller → Response
  → Terminable middleware
  → Sandbox cleanup
  → Return to event loop
```

### The Sandbox Mechanism
```php
// Inside Octane's request handling
public function handle(Request $request): Response
{
    $this->sandbox->run($request, function () use ($request) {
        $kernel = $this->app->make(Kernel::class);
        return $kernel->handle($request);
    });
}

// Sandbox::run() performs:
// 1. Store existing singletons to restore later
// 2. Reset request-specific instances
//    - Request instance
//    - Session instance
//    - Database connection (if using transaction-per-request)
//    - Auth user
//    - Current locale
// 3. Run the kernel handle
// 4. Restore original singletons
```

## Mental Models

### The Candle vs The Lantern
PHP-FPM is like lighting a new candle for every request: bright but wasteful, each candle burns completely. Octane is like a lantern with a long-burning wick (the booted application) and you only add a drop of oil (the sandboxed request state) for each request.

### The Server Process
The Octane worker is a restaurant kitchen that opens at 6 AM (boot) and serves hundreds of meals (requests) until closing. The stoves are always hot (services are loaded), the ingredients are prepped (bindings are registered), and the chefs (request handlers) just plate dishes (sandbox per request). Between meals, the kitchen is wiped down (sandbox reset) but the equipment stays on.

## Internal Mechanics

### Octane Server Bootstrap
```php
// In Octane\OctaneServiceProvider::register()
$this->app->singleton(Server::class, function ($app) {
    return new Server($app, [
        'host' => config('octane.server_host'),
        'port' => config('octane.server_port'),
    ]);
});

// Server::start()
public function start()
{
    $this->app->bootstrap();  // Forces full boot
    $this->startWorker();     // Enters event loop
}
```

### The ApplicationState Class
```php
class ApplicationState
{
    public $app;
    public $instances = [];
    public $aliases = [];
    public $bindings = [];
    
    public static function from(Application $app): self
    {
        $state = new self;
        $state->app = $app;
        $state->instances = $app->getBindings();
        // Store reference state before first request
        return $state;
    }
}
```

### Request Sandbox Reset
```php
class Sandbox
{
    protected $snapshot;
    
    public function __construct(ApplicationState $state)
    {
        $this->snapshot = clone $state;
    }
    
    public function refresh(Application $app)
    {
        // Reset to pre-request state
        foreach ($this->snapshot->instances as $abstract => $binding) {
            $app->forgetInstance($abstract);
        }
        
        // Re-bind fresh request instances
        $app->instance('request', new Request());
        $app->instance('session', new SessionManager($app));
        
        // Re-run only the request-specific bootstrappers?
        // No—bootstrappers are skipped because app is already booted.
        // Only the middleware/route pipeline runs.
    }
}
```

### What Gets Sandboxed
- `request` → new Request instance
- `session` → new SessionManager
- `auth` → fresh AuthManager
- `cookie` → fresh CookieJar
- `redirect` → fresh Redirector
- `router` → reset matched route state
- `url` → new UrlGenerator

### What Does NOT Get Sandboxed
- `config` → shared (config is read-only per worker)
- `view` → shared (view composers registered once)
- `log` → shared (monolog instance)
- `events` → shared (listener registrations persist)
- Database connection manager → shared (connection pool reused)
- Cache repository → shared (in-memory cache persists)

### The Booted Flag in Octane
```php
// Application::boot()
public function boot()
{
    if ($this->isBooted()) {
        return;  // <-- This is critical for Octane
    }
    // ... boot process ...
    $this->booted = true;
}
```
After the first boot, subsequent calls to `boot()` return immediately. The `$booted` flag persists for the worker's lifetime.

## Patterns

### Octane-Safe Singleton
```php
// Safe: no request-specific state captured in singleton
$this->app->singleton(StableService::class, function () {
    return new StableService();
});

// Unsafe: captures request-specific state
$this->app->singleton(UnstableService::class, function ($app) {
    return new UnstableService($app->make('request'));  // Request changes!
});
```

### Conditional Callback Registration
```php
public function boot()
{
    if (! $this->app->bound('booted')) {
        $this->app->booted(function ($app) {
            // Runs once per worker, not per request
            Route::middleware('web')->group(base_path('routes/octane-safe.php'));
        });
        $this->app->instance('booted', true);
    }
}
```

### Using the `Octane` Facade
```php
use Laravel\Octane\Facades\Octane;

// Tick: runs every N requests
Octane::tick('cleanup', function () {
    Cache::store('file')->flush();
})->seconds(300);

// Table: shared memory across workers
Octane::table('counter', 100, [
    'hits' => 'int',
]);
```

## Architectural Decisions

### Why sandbox instead of full re-boot?
Full re-boot would negate Octane's performance advantage. The sandbox resets only request-scoped state while preserving the container's bindings and resolved singletons. This reduces per-request overhead from ~50-100ms (full boot) to ~5-10µs (sandbox reset).

### Why not sandbox everything?
Some services (config, log, view) are inherently application-global. Resetting them per-request would create overhead without benefit. The challenge is correctly identifying which services are request-scoped and which are application-scoped.

### Why separate ApplicationState and Sandbox?
`ApplicationState` captures the pristine post-boot state as a reference. `Sandbox` applies diffs from that state for each request. This separation allows the sandbox to be lightweight (store only what changed) while the application state is comprehensive.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Boot cost paid once; thousands of requests amortize | Memory persists; GC never fully reclaims per-request allocations | Workers grow memory over time; need restart strategy |
| Response time dramatically reduced (~5-10ms vs ~50-100ms) | State management complexity: must manually sandbox | Bugs from stale request state are hard to reproduce |
| Bootstrapper events fire once; no per-request event noise | Event listeners that condition on request state break | Listeners must check current request when they fire |
| Singleton pattern is efficient | Singleton closures capture state at boot time, not request time | Closures must not reference request, session, auth, or other per-request services |
| Process-per-core model uses all CPU | Each worker has separate memory; no in-memory sharing | Use Octane tables or external cache for cross-worker state |

## Performance Considerations

- **Boot cost amortization:** A Laravel app with 50 providers and 100ms boot time processes 1000 requests per worker before restart. Boot cost per request: 100ms / 1000 = 0.1ms.
- **Memory growth:** Each request allocates memory that may not be fully reclaimed. Workers should restart after a request limit (default: 500). Monitor with `php artisan octane:status`.
- **Service caching:** `php artisan optimize` still important—reduces service manifest parsing, which happens once per worker start.
- **OPcache implications:** With Octane, OPcache's `opcache.validate_timestamps=0` is safe (PHP files don't change mid-worker-lifetime), eliminating file stat calls entirely.
- **Deferred providers under Octane:** Deferred providers are less impactful under Octane because boot costs are already amortized. However, they still reduce per-worker memory by not loading unused services.
- **Tick callback overhead:** `Octane::tick()` callbacks run on every N requests. Heavy ticks reduce throughput. Keep tick work minimal.

## Production Considerations

- **Worker count:** Set `OCTANE_WORKERS` to match CPU core count. More workers = more memory. Each worker runs the full boot sequence independently.
- **Max requests:** Configure `max_requests` per worker (default: 500). This controls memory leak accumulation. If app has known leaks, lower this value.
- **Graceful restart:** `php artisan octane:reload` restarts workers without dropping requests. Use during deployments.
- **Memory monitoring:** Track worker RSS memory. If it grows by more than 10-20% over the worker's lifetime, investigate sandbox misses or listener accumulation.
- **State pollution debugging:** If a request sees stale data from a previous request, the service is not properly sandboxed. Common culprits: custom singletons that reference the `request` instance.
- **Transaction management:** Database transactions that span requests are dangerous. Octane's sandbox does not automatically roll back open transactions. Use middleware to ensure transactions are committed/rolled back per request.
- **File handle limits:** Workers keep files, database connections, and cURL handles open. Monitor `lsof` per worker. Exceeding system limits causes failures.

## Common Mistakes

- **Caching request state in a singleton closure:**
  ```php
  // BAD: Resolves request once at boot, stale forever
  $this->app->singleton('ip.service', function ($app) {
      return new IpService($app->make('request')->ip());
  });
  ```
- **Registering listeners in `boot()` without deduplication:** Each `Event::listen()` call in `boot()` under Octane registers the listener only once (boot runs once), but if the listener registration is conditional on request state, it may not register at all.
- **Assuming `$_SERVER` and `$_ENV` are fresh per request:** These superglobals are set during boot. Octane does not re-read them per request. Use `request()->server()` for request-specific server values.
- **Not sandboxing custom singletons:** A custom singleton that stores user data (e.g., `$this->app->singleton(UserContext::class)`) leaks data across requests unless manually reset in middleware.
- **Using `array` properties on long-lived services:** If a service stores state in a class property, that state persists across requests under Octane. Use per-request storage (e.g., `$app->instance()`) instead.
- **Calling `exit()` or `die()`:** Under Octane, these kill the entire worker process. Use proper response return or exception handling.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Stale request data | Previous user's session seen | Singleton captures request-scoped state | Audit singletons; sandbox all request-specific services |
| Memory exhaustion | OOM kill; worker crashes | Listener accumulation or request data retained | Set `max_requests`; audit closure references |
| Socket/connection leak | "Too many open files" error | Database/HTTP connections not released | Use connection pool; ensure proper disconnect |
| Boot callback accumulation | Growing boot time; callbacks multiply | `$app->booted()` called repeatedly due to conditional logic | Guard with `if (! $this->app->bound('once'))` |
| Config not updating | Stale config after deployment | Config loaded once per worker | Restart workers via `octane:reload` after config changes |
| Transaction stuck open | Deadlocks; connection hangs | Open transaction from previous request | Ensure all transactions commit/rollback per request in middleware |

## Ecosystem Usage

- **Laravel Horizon:** Under Octane, Horizon runs as a separate process. Octane workers handle HTTP; Horizon workers handle queues. Boot timing for each is independent.
- **Laravel Telescope:** Telescope's watchers must be Octane-aware. Some watchers (e.g., request watcher) use `booted()` callbacks that fire once per worker, not per request. Telescope handles this by clearing entries per request.
- **Laravel Scout:** Scout's search engine connections are singletons under Octane. If the connection drops between requests, it must re-establish automatically.
- **Livewire:** Livewire's component state management works with Octane, but Livewire components must not store request-scoped state in class properties longer than one request.
- **Nova:** Nova's authorization gate and resources are registered once during boot. The auth user is sandboxed per request, which is compatible with Octane's model.
- **Spatie Permission:** Uses `Gate::before()` in `boot()`. Under Octane, this registers once per worker and works correctly—the Gate closure checks the current user via `$request->user()`, which is sandboxed.

## Related Knowledge Units

### Prerequisites
- [Complete Boot Sequence](../complete-boot-sequence/02-knowledge-unit.md) — the full pipeline that Octane runs once per worker.
- [Application Flush and Reset](../application-bootstrap/application-flush-and-reset/02-knowledge-unit.md) — the flush/reset mechanism that enables per-request state isolation.

### Related Topics
- [Boot Phase Order](../boot-phase-order/02-knowledge-unit.md) — how the boot phase runs once per worker in Octane.
- [Lifecycle Callback Hooks](../lifecycle-callback-hooks/02-knowledge-unit.md) — how callbacks must be deduplicated to avoid accumulation in Octane.
- [Deferred Provider Loading Timing](../deferred-provider-loading-timing/02-knowledge-unit.md) — why deferred providers are less impactful under Octane but still reduce per-worker memory.
- [Console vs HTTP Boot Differences](../console-vs-http-boot-differences/02-knowledge-unit.md) — Octane's boot model as a third execution context between HTTP and Console.

### Advanced Follow-up Topics
- [OpCache Configuration](../caching-optimization/opcache-configuration/02-knowledge-unit.md) — how OpCache preloading optimizes Octane worker startup.
- [Cache Invalidation Deployment](../caching-optimization/cache-invalidation-deployment/02-knowledge-unit.md) — how Octane's graceful reload interacts with cache invalidation.
- [Bootstrap Warmup in CI/CD](../caching-optimization/bootstrap-warmup-in-cicd/02-knowledge-unit.md) — warmup strategies for Octane deployments.

## Research Notes
- Laravel Octane was released in 2021 (Laravel 8.x). It supports Swoole and RoadRunner as server backends.
- Octane's sandbox mechanism has evolved significantly: early versions required manual sandbox configuration; Laravel 11's Octane added automatic sandbox detection for common services.
- The `max_requests` default of 500 is conservative. Production apps often run 2000-10000 requests before restart, depending on memory stability.
- RoadRunner uses Goridge for PHP-to-Go communication; its boot sequence is identical to Swoole's from Laravel's perspective, but the server-level initialization differs.
- Future development may include "partial sandboxing" where only explicitly marked services are reset, reducing per-request overhead further.
- The Laravel core team has discussed making Octane the default execution model in future versions (per Taylor Otwell's 2023 Laracon talk).
