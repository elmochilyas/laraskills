# Skill: Trace Request Flow Through the HTTP Kernel

## Purpose

Follow the complete request path from `Kernel::handle()` through `sendRequestThroughRouter()` to `dispatchToRouter()`, identifying each orchestration step and where to hook for debugging, profiling, or extension.

## When To Use

When debugging missing middleware behavior, understanding bootstrap-phase errors, implementing a custom kernel, profiling request overhead split between bootstrap vs routing, or onboarding to a Laravel codebase.

## When NOT To Use

For HTTP-level concerns (headers, cookies, status codes) — those belong in middleware. For application-level logic — that belongs in controllers/services. This skill is for understanding the kernel structure, not modifying it.

## Prerequisites

- Understanding of Entry Point Mechanics (bootstrap/app.php, public/index.php)
- Knowledge of the 6 core bootstrappers
- Familiarity with the Pipeline pattern

## Inputs

- Laravel framework source (specifically `Illuminate\Foundation\Http\Kernel`)
- Access to add temporary logging or breakpoints

## Workflow

1. Identify the `handle()` method entry point in `Illuminate\Foundation\Http\Kernel`:
   - Wraps the request in try/catch for exception handling
   - Calls `$request->enableHttpMethodParameterOverride()` (~0.01ms)
   - Calls `$this->sendRequestThroughRouter($request)` for the main flow
   - Dispatches `RequestHandled` event after response is built
2. Step into `sendRequestThroughRouter($request)`:
   - Calls `$this->bootstrap()` — guarded by `hasBeenBootstrapped()` to run once per Application instance
   - Creates a `Pipeline` instance with the application container
   - Sends the request through `$this->middleware` (global middleware array)
   - Sets `then($this->dispatchToRouter())` as the pipeline destination
3. Examine `bootstrap()`:
   - Checks `$app->hasBeenBootstrapped()` — returns immediately if already bootstrapped
   - Calls `$app->bootstrapWith($this->bootstrappers())` — runs the 6 core bootstrappers in order
   - Any attempt to call `bootstrap()` manually from providers will re-run bootstrappers (dangerous)
4. Examine `dispatchToRouter()` closure:
   - Sets the request instance on the router: `$this->router->setRequest($request)`
   - Calls `$this->router->dispatch($request)` — enters the routing layer
5. Return path: the Response travels back through the Pipeline (outbound pass through middleware), returns to `handle()`, which dispatches `RequestHandled`, then returns `$response` to the entry point

## Validation Checklist

- [ ] Can identify all 4 core kernel methods: `handle()`, `sendRequestThroughRouter()`, `bootstrap()`, `dispatchToRouter()`
- [ ] Understands that `bootstrap()` runs once per Application instance, guarded by `hasBeenBootstrapped()`
- [ ] Can explain why `dispatchToRouter()` is a closure (decouples Pipeline from Router)
- [ ] Knows the 6 core bootstrappers and their order
- [ ] Can identify where middleware is injected (Pipeline construction) vs where route dispatch happens (Pipeline destination)
- [ ] Understands why calling `bootstrap()` manually is dangerous

## Common Failures

- Assuming `bootstrap()` runs on every request — under Octane it runs only once per worker
- Confusing global middleware (Pipeline in `sendRequestThroughRouter`) with route middleware (applied in Router)
- Believing `dispatchToRouter()` is a direct method call — it is a closure, enabling the Pipeline pattern
- Modifying `$this->middleware` after kernel construction — changes are silently ignored because Pipeline snapshot was already built

## Decision Points

- If debugging bootstrap issues, trace `bootstrapWith()` to identify which bootstrapper fails
- If middleware is not running, check if it's registered as global vs route middleware, and verify construction-time registration
- For Octane, remember `bootstrap()` runs once — bootstrapper state persists; reset in termination handlers

## Performance Considerations

Tracing adds no production cost when removed. The kernel flow itself has these costs: bootstrap (5-80ms depending on cache), Pipeline construction (~0.15ms per middleware), and the `hasBeenBootstrapped()` guard (~0.001ms). Understanding the flow helps target optimization: cache for bootstrap, audit middleware for pipeline, profile router for dispatch.

## Security Considerations

The kernel's try/catch in `handle()` catches all `Throwable` — some errors (parse errors, fatal errors) should propagate. The `HandleExceptions` bootstrapper manages visibility. The `enableHttpMethodParameterOverride()` allows `_method` POST parameter override — ensure your API requires this behavior.

## Related Rules

- Never Call bootstrap() Manually (http-kernel-dispatch:5)
- Maintain The Kernel's Execution Phase Order (http-kernel-dispatch:5)
- Use sendRequestThroughRouter Internal Pattern For Custom Kernels (http-kernel-dispatch:5)
- Prefer Extending Kernel Over Modifying Kernel Class (http-kernel-dispatch:5)

## Related Skills

- Profile and Optimize Kernel Bootstrap Time (http-kernel-dispatch:6)
- Configure Middleware Pipeline with Correct Priority (http-kernel-dispatch:6)
- Optimize Entry Point Bootstrap for Production (entry-point-mechanics:6)

## Success Criteria

Can trace a request from `Kernel::handle()` through `sendRequestThroughRouter()`, `bootstrap()`, the middleware Pipeline, and `dispatchToRouter()` to the Router. Understands the bootstrap guard, the Pipeline construction, and why the flow is structured as template-method. Can identify where to intercept for debugging (bootstrap events, middleware, RequestHandled).

---

# Skill: Profile and Optimize Kernel Bootstrap Time

## Purpose

Measure bootstrap phase duration independently from route dispatch, identify the dominant bootstrapper costs, apply caches or structural changes to keep bootstrap under 5ms in production.

## When To Use

When P99 response times are high, when bootstrap duration exceeds 50ms in production, during deployment pipeline optimization, or when provider count has grown significantly.

## When NOT To Use

Applications with bootstrap already under 5ms (caches fully enabled, low provider count). Combined timing is sufficient when bootstrap is negligible.

## Prerequisites

- Understanding of the 6 core bootstrappers and their purpose
- Access to production or staging profiling data
- Knowledge of bootstrap event hooks (`bootstrapping:*`, `bootstrapped:*`)

## Inputs

- Bootstrap phase profiling data (timestamps before/after bootstrappers)
- Provider registration list from `config/app.php` or `bootstrap/app.php`
- Cache status (config, route, event)
- Deployment pipeline script

## Workflow

1. Enable bootstrap phase timing using lifecycle hooks:
   ```php
   $app['events']->listen('bootstrapping:*', function ($event, $data) use ($app) {
       $app->instance('bs.' . $event, microtime(true));
   });
   $app['events']->listen('bootstrapped:*', function ($event, $data) use ($app) {
       $start = $app->bound('bs.' . $event) ? $app->make('bs.' . $event) : LARAVEL_START;
       Log::debug("Bootstrap: $event took " . round((microtime(true) - $start) * 1000, 2) . 'ms');
   });
   ```
2. Measure each bootstrapper duration:
   - `LoadEnvironmentVariables`: ~1ms (file read + parse)
   - `LoadConfiguration`: ~15ms uncached / ~0.1ms cached
   - `HandleExceptions`: ~0.5ms (sets error handlers)
   - `RegisterFacades`: ~1ms (aliases real facades)
   - `RegisterProviders`: ~5-15ms (scales with provider count)
   - `BootProviders`: ~5-15ms (scales with provider boot complexity)
3. Identify the dominant cost and apply targeted fix:
   - If `LoadConfiguration` is high → enable `config:cache`
   - If `RegisterProviders` is high → audit provider count, merge small providers
   - If `BootProviders` is high → profile individual provider `boot()` methods
   - If all costs are high → enable all caches (`config:cache`, `route:cache`, `event:cache`)
4. Re-measure after each fix to verify improvement
5. Set up production monitoring: alert if bootstrap exceeds 50ms

## Validation Checklist

- [ ] Bootstrap is measured separately from route dispatch (not combined in a single timer)
- [ ] Each of the 6 bootstrappers has a timing measurement
- [ ] `config:cache` is enabled in production (unless dynamic config is needed)
- [ ] Provider count is under 60 in production
- [ ] No provider `boot()` method performs heavy I/O synchronously
- [ ] Alert threshold is set at 50ms for bootstrap duration
- [ ] Bootstrap is under 5ms in production with caches enabled

## Common Failures

- Measuring combined `handle()` time — hides whether bootstrap or routing is the bottleneck
- Profiling in development with Xdebug — Xdebug adds 10-100x overhead, invalidating measurements
- Enabling `config:cache` without understanding multi-tenant implications — cached config is immutable
- Optimizing provider `register()` when the bottleneck is `boot()` — or vice versa

## Decision Points

- If `RegisterProviders` is the bottleneck, consider lazy providers (Laravel deferred providers) or merging small providers
- If config cache cannot be used (dynamic config), optimize individual config file loading — reduce file count, use faster drivers
- For Octane, bootstrap runs once per worker, not per request — the optimization focus shifts from per-request cost to memory stability

## Performance Considerations

Each bootstrapper profiled adds ~0.05ms per dispatch (12 dispatches = ~0.6ms total) — negligible for profiling. The fixes are asymmetric: enabling config cache saves ~15ms (high ROI), while optimizing a single provider boot may save ~2ms (lower ROI). Prioritize caches first, then structural changes.

## Security Considerations

Bootstrap timing data may reveal sensitive information about your infrastructure (provider count, framework version, cache status). Do not expose bootstrap timing in public-facing responses. Log at debug level or to a dedicated channel.

## Related Rules

- Monitor Bootstrap Time Separately From Route Dispatch Time (http-kernel-dispatch:5)
- Never Call bootstrap() Manually (http-kernel-dispatch:5)
- Cache Configuration And Routes In Production (entry-point-mechanics:5)
- Optimize The Composer Autoloader In Deployment (entry-point-mechanics:5)

## Related Skills

- Trace Request Flow Through the HTTP Kernel (http-kernel-dispatch:6)
- Optimize Entry Point Bootstrap for Production (entry-point-mechanics:6)
- Register Lifecycle Hooks at the Correct Phase (lifecycle-events-and-hooks:6)

## Success Criteria

Bootstrap phase is measured independently from route dispatch. Each bootstrapper's duration is known. Caches are enabled in production, reducing bootstrap to under 5ms. An alert exists for bootstrap exceeding 50ms. Provider count and boot complexity are documented and monitored.

---

# Skill: Configure Middleware Pipeline with Correct Priority

## Purpose

Set global middleware, route middleware groups, and middleware priority ordering to ensure dependent middleware executes in the correct sequence, preventing subtle bugs from incorrect execution order.

## When To Use

When adding new middleware with state dependencies (e.g., custom middleware that depends on session, auth, or route bindings), when debugging "undefined" session data in auth checks, when migrating middleware configuration from Laravel 10's `Kernel.php` to Laravel 11+'s `bootstrap/app.php`, or during code review.

## When NOT To Use

Middleware that has no dependencies on other middleware state (e.g., `TrimStrings`, `TrustProxies`, `CorsMiddleware`) requires no priority configuration.

## Prerequisites

- Understanding of global middleware vs route middleware groups vs route-specific middleware
- Knowledge of which middleware provides which state (session, auth, bindings)
- Access to `bootstrap/app.php` (Laravel 11+) or `App\Http\Kernel` (Laravel 10)

## Inputs

- Middleware list with dependencies
- Server environment (global vs group vs route)

## Workflow

1. Identify all middleware that provides state consumed by other middleware:
   - `StartSession` provides session data
   - `Authenticate` sets auth user
   - `SubstituteBindings` resolves route model bindings
   - `Authorize` checks authorization (depends on auth + bindings)
2. Identify all middleware that consumes state from other middleware:
   - Any middleware calling `Auth::user()`, `auth()->id()`, `session()->get()`
   - Authorization middleware checking model permissions
   - Custom middleware that reads resolved route models
3. Configure priority ordering (Laravel 11+ `bootstrap/app.php`):
   ```php
   ->withMiddleware(function (Middleware $middleware) {
       $middleware->priority([
           \Illuminate\Session\Middleware\StartSession::class,
           \Illuminate\Auth\Middleware\Authenticate::class,
           \Illuminate\Routing\Middleware\SubstituteBindings::class,
           \Illuminate\Auth\Middleware\Authorize::class,
           // custom middleware that depends on above
       ]);
   });
   ```
4. For Laravel 10, set `protected $middlewarePriority` in `App\Http\Kernel`
5. Assign middleware to the correct scope:
   - Truly global (every request): add to global middleware array
   - Route-group-specific (web vs api): add to middleware groups
   - Single-route-only: apply in route definition
6. Verify middleware execution order by adding temporary logging or using a debug toolbar

## Validation Checklist

- [ ] Priority ordering includes all middleware with state dependencies
- [ ] Session-providing middleware (`StartSession`) is before auth middleware
- [ ] Auth middleware is before authorization and binding-dependent middleware
- [ ] Route model binding (`SubstituteBindings`) is before `Authorize`
- [ ] Only truly global middleware is in the global array — not route-scoped middleware
- [ ] No middleware is mutated at runtime — all registration happens at configuration time
- [ ] Middleware groups are used for web vs API route separation

## Common Failures

- Not configuring priority — middleware runs in registration order, but that order depends on array position and may break when middleware is added/removed
- Putting route-scoped middleware (auth, throttle) in global array — affects health checks, assets, webhooks
- Mutating `$middleware` at runtime in a service provider — silently ignored because Pipeline snapshot is built at construction time
- Using closures for terminable middleware — kernel can't resolve closures for `terminate()` calls

## Decision Points

- If middleware reads only `$request` and `$next` (no `Auth::user()`, no `session()`), no priority needed
- If middleware modifies the response (headers, caching), priority is irrelevant — response modification order is cosmetic
- For middleware that must always run last (e.g., `Terminate`), ensure it is last in the priority array and last in the global array

## Performance Considerations

Priority sorting is O(n log n) and runs once during kernel construction — negligible cost (~0.01ms for 20 middleware). Misconfigured priority causes bugs that are far more expensive than the priority configuration itself.

## Security Considerations

Incorrect priority can bypass security middleware: if `SubstituteBindings` runs before `Authenticate`, authorized routes can resolve models before the user is known, potentially exposing unauthorized data through model bindings. Ensure auth middleware always runs before authorization and binding middleware.

## Related Rules

- Audit Middleware Execution Order With Priority (http-kernel-dispatch:5)
- Do Not Mutate $middleware At Runtime (http-kernel-dispatch:5)
- Add Global Middleware Only When Truly Global (http-kernel-dispatch:5)
- Maintain The Kernel's Execution Phase Order (http-kernel-dispatch:5)

## Related Skills

- Trace Request Flow Through the HTTP Kernel (http-kernel-dispatch:6)
- Profile and Optimize Kernel Bootstrap Time (http-kernel-dispatch:6)
- Configure ApplicationBuilder in bootstrap/app.php (entry-point-mechanics:6)

## Success Criteria

All middleware with state dependencies are ordered via priority configuration. `StartSession` runs before `Authenticate` runs before `SubstituteBindings` runs before `Authorize`. Only truly global middleware is in the global array. No runtime mutations of middleware arrays. Middleware groups separate web and API concerns.
