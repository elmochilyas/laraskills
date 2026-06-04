# Skill: Separate Service Registration from Initialization

## Purpose
Correctly split provider logic between `register()` (container bindings only) and `boot()` (service initialization), respecting the two-phase lifecycle guarantee to avoid `BindingResolutionException` and ensure reliable bootstrap.

## When To Use
- Creating a new service provider from scratch
- Debugging `BindingResolutionException` during bootstrap
- Refactoring a provider that mixes bindings and initialization in the same method
- Onboarding developers to Laravel's two-phase provider lifecycle

## When NOT To Use
- For deferred providers that only bind and have no boot logic
- For framework core providers that are already structured correctly
- For providers that only publish config/migrations (use `$this->publishes()` in `boot()`)

## Prerequisites
- Understanding that all providers `register()` before any provider `boot()` starts
- Knowledge of the container's `bind()`, `singleton()`, `scoped()`, `instance()` methods

## Inputs
- Provider class content to audit or write
- List of services to bind (abstract → concrete mappings)
- List of initialization actions (routes, events, views, gates to register)

## Workflow
1. List all container bindings the provider needs — these go in `register()`
2. List all initialization actions — these go in `boot()`
3. Write `register()` with only `$this->app->bind()`, `singleton()`, `scoped()`, `instance()`, and `when()->needs()->give()`
4. Use `$bindings`/`$singletons` class properties for simple interface-to-class mappings
5. Write `boot()` with `Route::`, `Event::listen()`, `Gate::define()`, `$this->loadViewsFrom()`, etc.
6. Verify no `$this->app->make()` or `resolve()` call exists in `register()`
7. If the provider extends another provider, call `parent::boot()` first in `boot()`
8. If splitting a monolithic provider, create separate providers for binding and boot concerns

## Validation Checklist
- [ ] `register()` contains only bindings and no resolution calls
- [ ] `boot()` contains all initialization logic
- [ ] No `$this->app->make()` exists in `register()`
- [ ] Simple mappings use `$bindings`/`$singletons` properties
- [ ] `parent::boot()` is called when extending providers
- [ ] No `$app->boot()` or `app()->boot()` is called manually

## Common Failures
- Resolving a service in `register()` that is registered by a later provider — throws `BindingResolutionException`
- Registering a binding in `boot()` makes it invisible to deferred providers that resolved before boot
- Skipping `parent::boot()` when extending a provider — parent initialization silently omitted
- Calling `$this->app->register()` manually — defeats the two-phase design

## Decision Points
- If a provider is large, split it: put bindings in a deferred provider and boot logic in an eager provider
- If boot() depends on another provider's bindings, reorder providers in `config/app.php`
- If a binding depends on runtime config, bind a closure that reads config lazily in `register()`

## Performance Considerations
- Every non-deferred provider runs `register()` on every request — keep it minimal
- `boot()` iteration is O(n) — each provider adds overhead even with empty `boot()`
- Use `DeferrableProvider` for binding-only providers to skip both phases
- Route/event caching reduces boot() overhead by eliminating file parsing

## Security Considerations
- Bindings in `register()` are visible to all subsequent providers — sensitive services can be overridden unless protected
- `boot()` runs after all registrations — code here has access to fully configured app
- Package providers boot after app providers — they cannot override app bindings unless explicit

## Related Rules
- Register vs Boot Rule 1: Keep register() Pure — Bindings Only
- Register vs Boot Rule 2: Use boot() for All Initialization
- Register vs Boot Rule 5: Do Not Modify Container Bindings in boot()

## Related Skills
- Structure Service Provider register() Methods (register-phase-order)
- Structure Service Provider boot() Methods (boot-phase-order)
- Implement Deferred Providers (deferred-provider-loading-timing)

## Success Criteria
- Every provider clearly separates bindings (in `register()`) from initialization (in `boot()`)
- No `BindingResolutionException` occurs from resolution in `register()`
- All bindings are available when any provider's `boot()` runs
- The codebase has no manual `$app->boot()` calls
