# Skill: Add a Custom Bootstrapper at the Correct Position

## Purpose
Create and register a custom bootstrapper that executes initialization logic at the correct position relative to the six core bootstrappers, respecting the fixed execution order.

## When To Use
- Loading tenant-specific configuration from a database or header before service providers boot
- Setting environment-level overrides based on server variables before configuration is cached
- Registering global error handlers or custom logging channels before the framework error handler is active
- Performing pre-provider-registration setup that must happen before `RegisterProviders`

## When NOT To Use
- Service container bindings or singleton registrations (use `ServiceProvider::register()`)
- Request-specific logic (use middleware instead)
- Tasks that can be deferred to a service provider's `boot()` method (use the provider lifecycle)
- Replacing or skipping core bootstrappers — never remove core bootstrappers

## Prerequisites
- Understanding of the six core bootstrappers and their exact order:
  1. `LoadEnvironmentVariables`
  2. `LoadConfiguration`
  3. `HandleExceptions`
  4. `RegisterFacades`
  5. `RegisterProviders`
  6. `BootProviders`
- Knowledge of `Illuminate\Contracts\Foundation\Bootstrapper` interface
- Access to kernel bootstrapper array definition

## Inputs
- The custom bootstrapper class implementing `Bootstrapper`
- The desired insertion position relative to the six core bootstrappers
- The Application instance to manipulate during bootstrap

## Workflow
1. Create a class implementing `Illuminate\Contracts\Foundation\Bootstrapper`:
   ```php
   namespace App\Bootstrap;

   use Illuminate\Contracts\Foundation\Application;
   use Illuminate\Contracts\Foundation\Bootstrapper;

   class LoadTenantConfig implements Bootstrapper
   {
       public function bootstrap(Application $app): void
       {
           // Only access services whose bootstrappers have already run
           $config = $app->make('config');
           $tenantId = $_SERVER['HTTP_X_TENANT_ID'] ?? 'default';
           $config->set('tenant.id', $tenantId);
       }
   }
   ```
2. Determine the correct position:
   - **Before all bootstrappers**: Add at index 0 if the logic needs raw environment or server vars (before any framework processing)
   - **After LoadConfiguration but before HandleExceptions**: For config-dependent setup that must be available before custom error handling
   - **After BootProviders**: For logic that needs fully booted providers and all services available
3. Insert the bootstrapper class at the chosen position in the kernel's `$bootstrappers` array:
   ```php
   protected $bootstrappers = [
       \Illuminate\Foundation\Bootstrap\LoadEnvironmentVariables::class,
       \Illuminate\Foundation\Bootstrap\LoadConfiguration::class,
       \App\Bootstrap\LoadTenantConfig::class,  // After config is loaded
       \Illuminate\Foundation\Bootstrap\HandleExceptions::class,
       \Illuminate\Foundation\Bootstrap\RegisterFacades::class,
       \Illuminate\Foundation\Bootstrap\RegisterProviders::class,
       \Illuminate\Foundation\Bootstrap\BootProviders::class,
   ];
   ```
4. Keep the `bootstrap()` method fast — no HTTP calls, database queries, or file writes. If heavy work is unavoidable, cache the result
5. Only resolve services from the container that are guaranteed to be available at the insertion point
6. Add a comment explaining why this position was chosen

## Validation Checklist
- [ ] Bootstrapper class implements `Illuminate\Contracts\Foundation\Bootstrapper`
- [ ] `bootstrap()` method does not resolve services whose providers haven't run yet
- [ ] Bootstrapper is inserted at the correct position relative to the six core bootstrappers
- [ ] No core bootstrapper is removed or replaced — only custom bootstrappers are added alongside
- [ ] `bootstrap()` performs no HTTP calls, database queries, or slow I/O
- [ ] A comment documents why the chosen position is correct
- [ ] `php artisan <any-command>` still works (bootstrap didn't break)
- [ ] The bootstrapper state is visible in the application after bootstrap completes

## Common Failures
- Resolving services before their providers are registered: `LoadTenantConfig` resolving a service class before `RegisterProviders` runs causes "Target class not found" errors. Fix: position after `BootProviders` or only use `config` and other guaranteed services
- Heavy bootstrapper: Adding HTTP calls or DB queries delays every request. Fix: cache the result or use a service provider instead
- Bootstrapper runs on both HTTP and Console: The `$bootstrappers` array is in both kernels. If console-specific, guard with `if ($app->runningInConsole())`
- Misplaced custom bootstrapper: Placing it before `LoadConfiguration` when it needs config results in null config values. Fix: verify position against the core sequence

## Decision Points
- **Before vs after the core sequence**: Before for early environment setup; after for fully-booted framework access
- **Bootstrapper vs Service Provider**: Use bootstrapper for framework-level initialization that must execute before or during the core sequence; use service providers for business-logic registration. Bootstrappers have no `register()`/`boot()` phases
- **Custom bootstrapper vs Middleware**: Bootstrappers run once per request before middleware — use for initialization; use middleware for per-request manipulation

## Performance Considerations
- Bootstrappers delay every request's TTFB — even a 50ms bootstrapper impacts 100% of traffic
- Config caching eliminates `LoadConfiguration` filesystem I/O but custom bootstrapper overhead is additive
- The bootstrapper runs on both HTTP and Console — CLI commands also pay the cost
- If the bootstrapper logic can be deferred, use a lazy/deferred service provider instead

## Security Considerations
- Bootstrappers run before error handlers (position 3) — an exception in a bootstrapper at position 1-2 will not be caught by the framework error handler; results in raw exception output
- Bootstrappers after `HandleExceptions` benefit from the framework error handling
- Custom bootstrappers have full access to the Application container — ensure they don't expose or log sensitive configuration values

## Related Rules
- Register custom bootstrappers in the correct position relative to the six core bootstrappers (Architecture)
- Never resolve services in bootstrappers that depend on other bootstrappers yet to run (Reliability)
- Keep custom bootstrappers fast and side-effect-free beyond their single responsibility (Performance)
- Do not attempt to remove or skip core bootstrappers (Reliability)

## Related Skills
- Optimize Bootstrap Performance with Config Caching and Deferred Providers
- Verify Bootstrapper Execution Order and Guarded Behavior

## Success Criteria
- Custom bootstrapper runs at the exact intended position in the bootstrapper sequence
- All services resolved in `bootstrap()` are guaranteed available at that position
- Bootstrapper adds less than 5ms to every request's bootstrap time
- Both HTTP and Console kernels execute the bootstrapper correctly
- Removing or adding other bootstrappers does not affect the custom bootstrapper's behavior

---

# Skill: Optimize Bootstrap Performance with Config Caching and Deferred Providers

## Purpose
Reduce bootstrap time by enabling configuration caching, deferring non-essential service providers, and verifying the performance improvement across requests.

## When To Use
- Before production deployment to eliminate filesystem I/O during `LoadConfiguration`
- When profiling reveals bootstrap accounts for >50% of request time
- When the application has 30+ registered service providers with many that only register bindings
- After adding new configuration files or providers that impact bootstrap performance

## When NOT To Use
- During active development where config changes frequently — caching requires `config:clear` after every change
- When the application is not in production and performance is not a concern
- For providers that register event listeners, route macros, or perform side effects in `boot()` — these cannot be deferred

## Prerequisites
- Access to the application's `config/app.php` providers array
- Understanding of which providers only register bindings (safe to defer) vs which have side effects on boot (must stay eager)
- Ability to run artisan commands and measure request duration

## Inputs
- The complete list of service providers in `config/app.php`
- Application performance metrics (current bootstrap time)
- Configuration files in `/config/` directory

## Workflow
1. **Enable configuration caching**:
   - Run `php artisan config:cache` — this serializes all configuration files into `bootstrap/cache/config.php`
   - Verify the cached file exists and is readable
   - Test that the application still works correctly after caching
2. **Measure performance improvement**:
   - Compare TTFB or bootstrap time before and after caching (e.g., using `LARAVEL_START` constant)
   - Expect significant reduction: caching reduces `LoadConfiguration` from reading 30+ files to a single `require` statement
3. **Audit service providers for deferral eligibility**:
   - Identify providers that only call `$this->app->singleton()`, `$this->app->bind()`, or `$this->app->instance()`
   - Identify providers with no `boot()` method or only logging/debug logic in `boot()`
4. **Implement `DeferrableProvider`** on eligible providers:
   ```php
   use Illuminate\Contracts\Support\DeferrableProvider;

   class AnalyticsServiceProvider extends ServiceProvider implements DeferrableProvider
   {
       public function register(): void
       {
           $this->app->singleton(MetricCollector::class, fn() => new MetricCollector());
       }

       public function provides(): array
       {
           return [MetricCollector::class];
       }
   }
   ```
5. **Verify deferred providers**:
   - Confirm the provider is not instantiated until its service is resolved
   - Test that all services from the deferred provider resolve correctly
   - Verify the provider's `boot()` method runs when the service is first resolved (not at application boot)
6. **Measure final improvement**: Compare total bootstrap time before and after optimization

## Validation Checklist
- [ ] `php artisan config:cache` completes without errors
- [ ] `php artisan config:show` (Laravel 11+) or checking `config()` returns expected values confirms cache works
- [ ] After `config:cache`, configuration changes are not reflected until next `config:cache` run
- [ ] Eligible providers are identified and implement `DeferrableProvider`
- [ ] Deferred providers include a correct `provides()` method returning all bindings
- [ ] Application functionality is identical before and after optimization
- [ ] Bootstrap time is measurably reduced (verify with timing metrics)

## Common Failures
- `php artisan config:cache` fails with "class not found": Providers or configuration references classes that can't be autoloaded at cache time. Fix: ensure all referenced classes are autoloadable
- Cached config returns stale values: Running `config:cache` captures current state — must re-run after any config change. Fix: add `config:cache` to deployment script
- Deferred provider's `boot()` runs too late: Code that needs provider booted services before explicit resolution will break. Fix: do not defer providers with boot-time side effects
- `provides()` method incomplete: A binding not listed in `provides()` means the deferred provider is never loaded automatically. Fix: ensure all registered bindings appear in `provides()`

## Decision Points
- **Cache on every deployment**: Yes, always in production. The one-time `config:cache` cost is negligible compared to per-request savings
- **Which providers to defer**: Any provider that only binds container entries with no boot-time side effects. Providers that register event listeners, middleware, routes, or perform I/O in `boot()` cannot be deferred
- **Config cache in development**: Only if config changes infrequently, or if CI/CD handles `config:cache` and `config:clear` in deployment steps

## Performance Considerations
- `RegisterProviders` + `BootProviders` account for 60-70% of bootstrap time with 30+ providers — deferred providers reduce this proportionally
- Config caching eliminates filesystem I/O from 30+ files to one file — a 10-50ms reduction per request depending on filesystem speed
- Each deferred provider saves its `register()` method execution on every request unless the services it provides are resolved
- The trade-off: deferred providers add autoloader overhead when their services are eventually resolved (one-time cost per resolution)

## Security Considerations
- After `config:cache`, the application reads from the cached file — any manual edits to config files are ignored until next cache rebuild
- If config file permissions change, cached config may be readable by unauthorized processes — ensure `bootstrap/cache/config.php` has proper permissions
- Deferred providers may contain initialization logic that affects security — ensure deferred providers still run their `boot()` when needed

## Related Rules
- Use config caching in production to eliminate filesystem I/O during bootstrap (Performance)
- Defer service providers that only register container bindings (Performance)
- Keep custom bootstrappers fast and side-effect-free beyond their single responsibility (Performance)

## Related Skills
- Add a Custom Bootstrapper at the Correct Position
- Verify Bootstrapper Execution Order and Guarded Behavior

## Success Criteria
- Config caching is enabled and verified in the production deployment
- Bootstrap time is reduced by at least 30% (or proportionally to the number of deferred providers)
- All deferred providers resolve correctly when their services are requested
- Application behavior is identical before and after optimization
- CI/CD pipeline includes `php artisan config:cache` in the deployment steps

---

# Skill: Verify Bootstrapper Execution Order and Guarded Behavior

## Purpose
Confirm that the six core bootstrappers execute in the correct fixed order, that the guarded bootstrap flag prevents re-execution, and that custom bootstrappers run at their intended position.

## When To Use
- After adding or modifying custom bootstrappers to verify they run at the right position
- Debugging bootstrap-related failures in integration tests
- Verifying that multiple kernel instances bootstrap independently
- Ensuring that sub-requests in tests behave correctly with the guarded flag

## When NOT To Use
- Debugging middleware execution order (use `php artisan route:list -v`)
- Testing service provider boot order (use provider-level testing)
- Validating configuration values (use `php artisan config:show` or `config()` assertions)

## Prerequisites
- Access to the kernel source (`Illuminate\Foundation\Http\Kernel` or `Illuminate\Foundation\Console\Kernel`)
- A test environment (PHPUnit) or a debugging setup (dd(), logger, or breakpoints)
- Understanding of `Application::bootstrapWith()` method

## Inputs
- The kernel's bootstrapper array
- A test case or debug script that boots the application
- The Application instance being tested

## Workflow
1. **Read the bootstrapper array** from both kernels:
   - `Illuminate\Foundation\Http\Kernel::$bootstrappers`
   - `Illuminate\Foundation\Console\Kernel::$bootstrappers`
   - Confirm they are identical (six core bootstrappers in same order)
2. **Add a trace to each bootstrapper** (temporarily):
   - Modify each bootstrapper or add a logging wrapper
   - Log the class name and timestamp on each `bootstrap()` call
3. **Execute a single request** (HTTP or Console) and observe the log output:
   - Verify the six bootstrappers fire in exact order:
     1. `LoadEnvironmentVariables`
     2. `LoadConfiguration`
     3. `HandleExceptions`
     4. `RegisterFacades`
     5. `RegisterProviders`
     6. `BootProviders`
   - Verify each fires exactly once per kernel instance
4. **Send a second request through the same kernel instance** (e.g., in a test):
   - Verify the bootstrappers do NOT fire again (guarded by `$this->hasBeenBootstrapped`)
   - The flag is stored on the Application instance, not the Kernel
5. **Create a second Application instance** and dispatch a kernel handle on it:
   - Verify the bootstrappers fire again on the new instance
   - Confirm the guarded flag is per-Application-instance
6. **Add a custom bootstrapper** and verify its position in the log output:
   - After insertion, the log should show the custom bootstrapper at the expected position
   - Verify no core bootstrapper was removed or reordered

## Validation Checklist
- [ ] Six core bootstrappers execute in exact order on every request
- [ ] Bootstrappers fire exactly once per kernel instance
- [ ] Guarded flag prevents re-execution on subsequent `handle()` calls on same instance
- [ ] Multiple Application instances each run bootstrappers independently
- [ ] Custom bootstrappers execute at their intended position in the sequence
- [ ] No core bootstrapper is removed or overridden

## Common Failures
- Bootstrappers running multiple times: If `hasBeenBootstrapped` is not set correctly (e.g., mocking the Application), bootstrappers run on every `handle()` call. Fix: use a real Application instance in tests
- Custom bootstrapper running at wrong position: Array insertion index is off by one or inserted at the end by default. Fix: verify array order before and after insertion
- Assumption that multiple kernels share bootstrap state: Two different Application instances each run bootstrappers independently. Fix: manage Application instances explicitly in tests
- Testing framework resets Application state: PHPUnit may create a fresh Application per test — bootstrappers run fresh for each test. This is correct behavior

## Decision Points
- **Single Application vs Multiple in tests**: Use one Application instance per test suite if bootstrapper state must persist; create fresh instances per test for isolation
- **Temporary logging vs Permanent monitoring**: Use temporary logging for verification only; remove before deployment. For permanent monitoring, use the Request Duration Lifecycle Handlers
- **Override kernel `bootstrap()` vs Insert custom bootstrapper**: Never override `bootstrap()` — always add custom bootstrappers to the array to maintain the fixed sequence

## Performance Considerations
- The `hasBeenBootstrapped` check is a simple property read — negligible cost
- Tracing bootstrapper execution via logging adds overhead — remove debug logs after verification
- Bootstrapper order verification is a one-time setup task — not a runtime concern

## Security Considerations
- Logging which bootstrappers ran and their order is safe for debugging but avoid logging sensitive configuration values loaded by bootstrappers
- If a bootstrapper fails, the guarded flag may not be set — subsequent calls attempt re-bootstrap and fail again. Handle bootstrap failures explicitly
- Custom bootstrappers that modify configuration after config caching can create drift between cached and runtime config — document this behavior

## Related Rules
- Understand that guarded bootstrapping is per-Application-instance, not global (Testing)
- Register custom bootstrappers in the correct position relative to the six core bootstrappers (Architecture)
- Do not attempt to remove or skip core bootstrappers (Reliability)

## Related Skills
- Add a Custom Bootstrapper at the Correct Position
- Optimize Bootstrap Performance with Config Caching and Deferred Providers

## Success Criteria
- Able to predict exactly when each bootstrapper fires for any combination of kernels and Application instances
- Test suite correctly manages Application instances for bootstrap-dependent tests
- Custom bootstrappers are confirmed to run at their intended position
- The guarded bootstrap flag works as expected — exactly one execution per instance
