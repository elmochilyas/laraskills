# Skill: Diagnose Bootstrap-Order Bugs

## Purpose

Identify and resolve bugs caused by accessing services, configuration, or environment values before the corresponding bootstrapper has run in the six-phase bootstrapper sequence.

## When To Use

- `config()` returns `null` inside a service provider's `register()` method
- `env()` returns unexpected values after `php artisan config:cache`
- A service resolves to a different instance than expected during early bootstrap
- `BindingResolutionException` occurs for a service that is registered but not yet available
- Code works in FPM but fails in Octane (where state depends on bootstrapper timing)
- Framework error handlers are not active when an early error occurs

## When NOT To Use

- Errors that occur after the bootstrapper sequence completes (in middleware, controllers, or later lifecycle)
- Configuration file parsing errors (these belong to config loading debugging)
- Container resolution errors unrelated to bootstrap timing

## Prerequisites

- Knowledge of the six bootstrappers and their exact execution order:
  1. `LoadEnvironmentVariables`
  2. `LoadConfiguration`
  3. `HandleExceptions`
  4. `RegisterFacades`
  5. `RegisterProviders`
  6. `BootProviders`
- Understanding of the two-phase provider lifecycle: `register()` then `boot()`
- Access to the Application container state and error stack traces

## Inputs

- Error message and stack trace
- The service provider or bootstrapper where the error occurs
- The bootstrapper phase during which the error manifests
- The Application's `hasBeenBootstrapped()` state
- Whether config caching is enabled

## Workflow

1. Identify the bootstrapper phase from the stack trace or error context
2. Determine which service/config the failing code is trying to access
3. Check if the required bootstrapper has already run:
   - Before `LoadEnvironmentVariables`: No `.env` values available
   - Before `LoadConfiguration`: `$app->make('config')` throws `BindingResolutionException`
   - Before `HandleExceptions`: Error handlers not set — raw PHP errors
   - Before `RegisterFacades`: Facades like `Cache::`, `DB::` throw
   - Before `RegisterProviders`: No service providers instantiated
   - Before `BootProviders`: Providers registered but `boot()` not called
4. Move config-dependent logic from `register()` to `boot()` in the failing service provider
5. If accessing environment before `LoadEnvironmentVariables`, read `$_ENV` directly or ensure the code runs after the bootstrapper
6. If facades are used before `RegisterFacades`, use `$app->make()` with the contract class instead
7. If `env()` returns `null` after config caching, replace with `config()` calls
8. Test the fix in both cached and uncached config modes to verify timing independence

## Validation Checklist

- [ ] Source of the error identified by bootstrapper phase
- [ ] Config-dependent code moved from `register()` to `boot()` in the affected provider
- [ ] `env()` helper replaced with `config()` in all application code
- [ ] Facade usage before `RegisterFacades` replaced with `$app->make()` using contract class
- [ ] Error handlers active for the bootstrapper phase where the error occurs
- [ ] Fix works with both `config:cache` enabled and disabled
- [ ] Fix works in both FPM and Octane runtimes

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| `config()` returns null in `register()` | `LoadConfiguration` runs before `RegisterProviders` but providers' `register()` runs before `BootProviders` — config is loaded but other providers may not have run | Move config reads to `boot()` |
| `env()` returns null after deploy | `config:cache` resolves `env()` calls at cache-build time | Replace `env()` with `config()` in all application code |
| Facade throws in early bootstrap | Facade used before `RegisterFacades` runs | Use `$app->make(Contract::class)` instead |
| HandleExceptions not active | Error occurs before `HandleExceptions` bootstrapper | Ensure `APP_DEBUG` is set in `.env` for development |
| hasBeenBootstrapped guard crash | `bootstrapWith()` called twice | Call `reset()` before re-bootstrapping in long-running processes |

## Decision Points

- **`register()` vs `boot()`** — Use `register()` only for registering container bindings; use `boot()` for any logic that reads config, env, or other providers' bindings
- **`env()` vs `config()`** — Use `env()` only in `config/*.php` files (which execute during `LoadConfiguration`); use `config()` everywhere else
- **Facade vs contract** — In code that may execute before `RegisterFacades`, use contract-based resolution; otherwise, facade usage is safe

## Performance Considerations

- Moving code from `register()` to `boot()` does not change performance — both execute during the bootstrap sequence
- Config caching eliminates file parsing cost in `LoadConfiguration` but does not change the bootstrapper order
- Provider deferral (`DeferrableProvider`) reduces `RegisterProviders` overhead but changes provider loading timing

## Security Considerations

- If `HandleExceptions` has not run, uncaught exceptions expose raw PHP error information
- Code that accesses config before `LoadConfiguration` may silently use default values (not configured values) — this can lead to incorrect security settings (e.g., disabled authentication)
- `env()` returning null after `config:cache` is a silent failure — the application uses null/empty values instead of configured secrets

## Related Rules

- Place all config-dependent logic in `boot()` not `register()` (05-rules.md, Rule 1)
- Never modify the kernel's `$bootstrappers` array (05-rules.md, Rule 2)
- Never call `env()` helper after `php artisan config:cache` (05-rules.md, Rule 3)
- Never call `bootstrapWith()` a second time without `reset()` first (05-rules.md, Rule 6)
- Implement `DeferrableProvider` on providers that only register bindings (05-rules.md, Rule 5)

## Related Skills

- Optimize Provider Registration Order (this KU)
- Debug Application Construction Failures (application-class-construction)
- Debug Facade Resolution Failures (base-bindings-and-core-aliases)

## Success Criteria

- Config-dependent code executes during the correct phase and reads the correct values
- `config()` is used instead of `env()` in all application code
- No `BindingResolutionException` caused by bootstrap-order violations
- The fix works identically with and without `config:cache`
- The fix works identically in FPM and Octane

---

# Skill: Optimize Provider Registration Order

## Purpose

Improve application bootstrap performance by deferring service providers that only register bindings, reducing the number of providers instantiated during every request.

## When To Use

- Application has 30+ service providers in `config/app.php 'providers'`
- Bootstrap time is dominated by the `RegisterProviders` bootstrapper phase
- Profiling (Telescope, Clockwork) shows provider instantiation as a bottleneck
- Some providers only register bindings that are not used on every request
- Application runs on FPM where bootstrap cost is paid per request

## When NOT To Use

- Providers that register event listeners, route model bindings, or view composers in `boot()` — these cannot be deferred because they run on framework events, not explicit resolution
- Providers that are already deferred (check for `DeferrableProvider` interface)
- Applications where bootstrap time is already acceptable (<10ms)
- Octane applications where bootstrap runs once per worker (optimization is less impactful)

## Prerequisites

- Access to `config/app.php` providers list
- Profiling data showing provider instantiation time
- Understanding of each provider's purpose (bindings vs boot logic)
- Knowledge of the `DeferrableProvider` interface and `provides()` method

## Inputs

- The list of service providers from `config/app.php 'providers'`
- For each provider: whether it has `boot()` logic, and what bindings it provides
- Profiling data showing how long each provider takes to instantiate and boot

## Workflow

1. Profile the current bootstrap time: measure the `RegisterProviders` and `BootProviders` phases
2. For each provider, determine if it can be deferred:
   - Check if it has a `boot()` method with non-empty logic
   - Check if it registers event listeners, route model bindings, view composers, or other framework-level observers
   - If the provider ONLY registers bindings in `register()` and has no `boot()` logic (or empty `boot()`), it is a deferral candidate
3. For deferral candidates:
   a. Implement `Illuminate\Contracts\Support\DeferrableProvider` interface
   b. Add a `provides()` method that returns an array of binding/class names the provider registers
   c. Remove the provider from `config/app.php 'providers'` array
   d. The framework will now load this provider lazily when one of its provided bindings is first resolved
4. Run `php artisan clear-compiled` and clear cache
5. Remeasure bootstrap time to confirm improvement
6. Write a test that resolves a binding from the deferred provider to verify it loads correctly

## Validation Checklist

- [ ] Deferred providers implement `DeferrableProvider` interface
- [ ] Deferred providers define `provides()` returning all registered binding keys
- [ ] No deferred provider has a `boot()` method with side effects
- [ ] All deferred bindings resolve correctly on first access
- [ ] Bootstrap time shows measurable improvement (5-50% reduction depending on provider count)
- [ ] No runtime errors from missing binding resolution (provider loaded lazily before resolution)

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| Binding not resolving after deferral | `provides()` does not list the binding key used for resolution | Ensure all binding keys are listed in `provides()` |
| Listener never fires after deferral | Deferred provider registers event listeners in `boot()` | Move listener registration to a non-deferred provider |
| Unexpected resolution order | Deferred provider's bindings accessed in `boot()` of non-deferred provider | Ensure deferred bindings are not needed during boot of other providers |
| `ServiceNotFoundException` | Provider not loaded before binding resolution | Ensure the `provides()` array includes the exact key used by `$app->make()` |

## Decision Points

- **Deferred vs non-deferred** — Defer providers that ONLY register bindings; keep non-deferred any provider with boot logic, event listeners, route models, or view composers
- **Partial deferral** — If a provider has some deferrable bindings and some logic that must run eagerly, split it into two providers: one deferred (bindings) and one non-deferred (boot logic)

## Performance Considerations

- Each deferred provider saves ~0.05-0.2ms per request (instantiation + registration overhead)
- With 20-30 deferrable providers out of 40 total, this saves 1-6ms per request
- In Octane, optimization is less impactful but still reduces worker startup time
- Deferred providers still execute lazily when their bindings are resolved — total CPU cost is amortized, not eliminated

## Security Considerations

- A deferred provider that registers security-related services (auth guards, authorization gates) must be tested to ensure it loads before those services are needed
- If a deferred provider is never resolved, its services are never available — ensure critical services are registered in non-deferred providers

## Related Rules

- Implement `DeferrableProvider` on providers that only register bindings (05-rules.md, Rule 5)
- Never modify the kernel's `$bootstrappers` array (05-rules.md, Rule 2)
- Place all config-dependent logic in `boot()` not `register()` (05-rules.md, Rule 1)

## Related Skills

- Diagnose Bootstrap-Order Bugs (this KU)
- Implement a Custom Bootstrapper Extension (this KU)
- Write Environment-Aware Service Providers (path-helpers-and-environment-detection)

## Success Criteria

- Deferred providers are not instantiated during `RegisterProviders` phase
- Deferred providers load and register their bindings on first binding resolution
- All services registered by deferred providers resolve correctly at runtime
- Bootstrap time improvement is measurable (5-50% reduction in provider registration time)
- No regression in functionality — all listeners, routes, and bindings work as before

---

# Skill: Implement a Custom Bootstrapper Extension

## Purpose

Extend the Laravel bootstrap sequence with custom initialization logic that runs at a controlled point relative to the six standard bootstrappers, without modifying the kernel's `$bootstrappers` array.

## When To Use

- Performing framework-level initialization before any service provider binds or boots
- Setting up infrastructure that both configuration loading and provider registration depend on
- Integrating custom autoloading or error handling mechanisms
- Running environment-specific initialization that must execute at a precise point in the bootstrap sequence

## When NOT To Use

- Adding bootstrapper-like logic that belongs in a service provider (most use cases)
- Modifying the kernel's `$bootstrappers` array — this is not a supported extension point
- Replacing standard bootstrappers (all six are required for proper framework operation)
- Running per-request logic (use middleware instead)

## Prerequisites

- Deep understanding of the six bootstrapper sequence and their dependencies
- Ability to choose the correct hook point in the lifecycle (`booting()`, custom bootstrapper via `$app->bootstrapWith()`, service provider)

## Inputs

- The initialization logic to execute
- The required position in the bootstrap sequence (before or after specific standard bootstrappers)
- The Application instance

## Workflow

1. Determine if a custom bootstrapper is truly necessary — most extension needs are met by service providers or lifecycle hooks
2. If a custom bootstrapper is needed, create a class that implements the bootstrapper contract (any class with a `bootstrap(Application $app)` method)
3. Register the custom bootstrapper by adding it to the kernel's `$bootstrappers` array ONLY if you have subclassed the kernel — for standard kernels, use `$app->booting()` or `$app->booted()` callbacks instead
4. If using `$app->bootstrapWith()` manually, ensure this is called before the `hasBeenBootstrapped` guard is set
5. Test the custom bootstrapper in isolation by calling it directly: `$bootstrapper->bootstrap($app)`
6. Test the custom bootstrapper as part of the full bootstrap sequence to verify ordering dependencies

## Validation Checklist

- [ ] Custom bootstrapper is truly necessary (not replaceable by service provider or lifecycle hook)
- [ ] The bootstrapper's position in the sequence respects all dependencies
- [ ] The bootstrapper does not duplicate or replace standard bootstrapper functionality
- [ ] The bootstrapper is idempotent (safe to run multiple times in Octane)
- [ ] The bootstrapper does not leave request-scoped state in the container
- [ ] The bootstrapper respects the `hasBeenBootstrapped` guard (or clears it if needed)

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| Bootstrapper runs at wrong time | Ordering assumption incorrect relative to standard bootstrappers | Document exact execution position and dependencies |
| `LogicException` from `bootstrapWith()` | `hasBeenBootstrapped` already set to true | Call `$app->reset()` before re-bootstrapping |
| Bootstrapper state leaks in Octane | Bootstrapper registers request-scoped state that survives `flush()` | Ensure bootstrapper-created state is cleared or survives appropriately |
| Bootstrapper duplicates service provider logic | Bootstrapper used where a provider would suffice | Move logic to service provider |

## Decision Points

- **Custom bootstrapper vs `booting()` callback** — Use a custom bootstrapper only when the logic must execute at a precise point between standard bootstrappers; use `booting()` callbacks for logic that runs after all bootstrappers but before provider boot
- **Custom bootstrapper vs service provider** — Use a custom bootstrapper for infrastructure initialization that providers depend on; use service providers for domain-specific binding and boot logic

## Performance Considerations

- Each custom bootstrapper adds its own execution time to the bootstrap sequence
- In Octane, custom bootstrappers run once per worker startup — cost amortized across requests
- Bootstrappers that perform I/O (file reads, API calls) block the entire bootstrap sequence

## Security Considerations

- Custom bootstrappers run before `HandleExceptions` if placed early in the sequence — uncaught exceptions produce raw PHP errors
- Bootstrappers that modify container state must not overwrite security-critical bindings
- In Octane, bootstrapper-captured scope persists across requests — ensure no request-scoped variables are captured

## Related Rules

- Never modify the kernel's `$bootstrappers` array (05-rules.md, Rule 2)
- Never call `bootstrapWith()` a second time without `reset()` first (05-rules.md, Rule 6)

## Related Skills

- Diagnose Bootstrap-Order Bugs (this KU)
- Add Lifecycle Hooks During Bootstrap (application-builder-configuration)
- Write Environment-Aware Service Providers (path-helpers-and-environment-detection)

## Success Criteria

- Custom bootstrapper executes at the correct point in the bootstrap sequence
- The bootstrapper's initialization state is available to subsequent bootstrappers and providers
- No regression in standard bootstrapper behavior
- The bootstrapper is idempotent and safe for Octane's single-initialization model
- A service provider or lifecycle hook was not a viable alternative
