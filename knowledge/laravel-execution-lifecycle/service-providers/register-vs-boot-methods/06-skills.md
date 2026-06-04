# Skill: Distinguish register() from boot() Responsibilities

## Purpose

Correctly decide whether a given operation belongs in a service provider's `register()` method or its `boot()` method, following the two-phase model to prevent order-dependent bootstrap failures.

## When To Use

- Creating a new service provider.
- Reviewing an existing provider to determine if code is in the correct method.
- Debugging "Target class does not exist" errors caused by resolving too early.
- Config caching failures related to side effects in `register()`.

## When NOT To Use

- Operations that happen after the application is fully booted (use `$app->booted()`).
- Service container resolution outside of providers (e.g., in controllers or jobs).

## Prerequisites

- Understanding of the two-phase model: all `register()` completes before any `boot()`.
- Service container bindings: `bind()`, `singleton()`, `tag()`, `when()->needs()->give()`.

## Inputs

- Operation to classify
- Provider class where the operation will be placed

## Workflow

1. Check the operation type:
   - **Container binding** (`bind`, `singleton`, `tag`, `when()->needs()->give()`, `mergeConfigFrom`) → `register()`.
   - **Boot-time registration** (`loadRoutesFrom`, `loadViewsFrom`, `loadMigrationsFrom`, Blade directives, event listeners) → `boot()`.
   - **Service resolution** (`make()`, `resolve()`) → `boot()` (never `register()`).
   - **I/O, logging, file writes, HTTP calls** → `boot()` (never `register()`).
   - **Post-bootstrap logic** (requires all providers booted) → `$app->booted()`.

2. Verify the placement follows the two-phase contract:
   - `register()`: bindings only, no side effects, no resolution.
   - `boot()`: any code that depends on bindings registered by other providers.

3. Document the reason for any exception to these rules.

## Validation Checklist

- [ ] All container bindings are in `register()`
- [ ] No `$this->app->make()` or `resolve()` calls in `register()`
- [ ] Routes, views, event listeners, middleware registration in `boot()`
- [ ] No I/O or logging in `register()`
- [ ] Config caching works without errors
- [ ] Boot method injection used instead of `$this->app->make()` in `boot()`
- [ ] Post-boot logic uses `$app->booted()` where appropriate

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| "Target class does not exist" error | `make()` called in `register()` — binding from another provider doesn't exist yet |
| Config cache fails | I/O or file writes in `register()` — side effects break during `php artisan config:cache` |
| Routes not found | Routes registered in `register()` instead of `boot()` — Router not yet bound |
| Event listeners not firing | Listeners registered in `register()` — Event dispatcher not yet available |

## Decision Points

- **register() vs boot()**: Can this operation run safely when only bindings from THIS provider exist? If no → `boot()`. If yes, is it a binding or config merge? → `register()`. Anything else → `boot()`.
- **boot() vs booted()**: Does this operation depend on another provider's `boot()` side effects? If yes → `booted()`. If it only needs bindings → `boot()`.

## Performance Considerations

- Both methods run on every request for eager providers — keep both lightweight.
- `register()` is simpler and faster (bindings only). `boot()` typically does more work (routes, events).
- Deferred providers skip both methods until first service resolution.

## Security Considerations

- `register()` runs during config caching — avoid logic that depends on request context.
- `boot()` runs with full application context — ensure authorization checks are in place for security-sensitive registrations.
- Never register debug-only routes or listeners without environment guards.

## Related Rules

- Rule 1: Never Resolve from the Container Inside `register()`
- Rule 2: Place Route, View, Event Listener, and Middleware Registration in `boot()`
- Rule 3: Keep `register()` Pure — Bindings and Config Merges Only, No Side Effects
- Rule 4: Use Boot Method Injection for Auto-Resolved Dependencies
- Rule 5: Use `$app->booted()` for Actions Requiring the Entire Application to Be Booted
- Rule 6: Never Perform I/O, Logging, or Database Operations Inside `register()`

## Related Skills

- Use Boot Method Injection and booted() Callbacks
- Create and Register a Service Provider

## Success Criteria

- Provider correctly separates bindings (`register()`) from boot-time initialization (`boot()`).
- No resolution or side effects in `register()`.
- Config caching completes without errors.
- Routes, events, and views work correctly after bootstrap.
---

# Skill: Use Boot Method Injection and booted() Callbacks

## Purpose

Leverage Laravel's auto-resolution of type-hinted dependencies in `boot()` and the `$app->booted()` callback to write cleaner, more maintainable provider boot logic that properly respects the bootstrap sequence.

## When To Use

- `boot()` needs access to services registered by other providers.
- A provider's boot logic depends on another provider's boot-time side effects.
- Refactoring a provider that uses `$this->app->make()` in `boot()`.
- Actions that must run after every provider has completed both phases.

## When NOT To Use

- `boot()` with no dependencies on other services (simple route/event registration).
- Actions that should run on every request, not just at boot (use middleware).
- Conditional or optional service resolution (use `$this->app->make()` with `bound()` check).

## Prerequisites

- Understanding of the two-phase model (`register()` → `boot()` → `booted()`)
- Service container auto-resolution
- Laravel's method injection for controller-like dependency resolution

## Inputs

- Services needed in `boot()`
- Provider class where injection will be used
- Post-boot logic requirements

## Workflow

1. Identify services needed in `boot()` — type-hint them as method parameters:
   ```php
   public function boot(PaymentGateway $gateway, LoggerInterface $logger): void
   {
       $gateway->setLogger($logger);
   }
   ```
2. Remove any `$this->app->make()` calls that can be replaced with injection.
3. For logic that requires all providers to have booted, use `$app->booted()`:
   ```php
   public function boot(): void
   {
       $this->app->booted(function ($app) {
           $app->make(Scheduler::class)->schedule();
       });
   }
   ```
4. For optional dependencies, use `$this->app->make()` with `bound()` check inside `boot()`.
5. Verify dependencies are registered (add `bound()` check if unclear).

## Validation Checklist

- [ ] Type-hinted parameters in `boot()` are auto-resolved by the container
- [ ] No `$this->app->make()` calls remain in `boot()` for mandatory dependencies
- [ ] `booted()` callback used for logic depending on other providers' boot side effects
- [ ] Optional dependencies use `$this->app->bound()` + `$this->app->make()` pattern
- [ ] Type-hinted dependencies are registered by this or a preceding provider
- [ ] Tests verify boot injection works correctly with all dependencies

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| "Target class does not exist" in boot injection | Type-hinted service not registered by any provider |
| `booted()` callback never fires | Application already booted when `booted()` is called in `boot()` — check call order |
| Multiple resolutions of same service | Using `$this->app->make()` repeatedly instead of injecting once |
| Optional dependency causes failure | Type-hinting an optional service that may not be registered — use `bound()` check |

## Decision Points

- **Injection vs make()**: Service always available? → Injection. Optional or conditional? → `make()` with `bound()`.
- **boot() vs booted()**: Need bindings only? → `boot()`. Need other providers' boot side effects? → `booted()`.

## Performance Considerations

- Boot method injection resolves dependencies once via the container — same as `$app->make()`.
- `booted()` callbacks add negligible overhead.
- Deferred providers may have different timing for boot callbacks.

## Security Considerations

- Boot method injection resolves from the container — ensure injected services are secure.
- `booted()` callbacks run after all providers boot — any security middleware should be in place.
- Avoid injecting request-dependent services in `boot()` — they may not be available during console commands.

## Related Rules

- Rule 4: Use Boot Method Injection for Auto-Resolved Dependencies
- Rule 5: Use `$app->booted()` for Actions Requiring the Entire Application to Be Booted

## Related Skills

- Distinguish register() from boot() Responsibilities
- Integration Test Provider Boot Method

## Success Criteria

- Provider's `boot()` uses type-hinted injection for all mandatory dependencies.
- Post-boot logic uses `$app->booted()` when depending on other providers' boot-time side effects.
- Code is more readable with explicit dependency declaration.
