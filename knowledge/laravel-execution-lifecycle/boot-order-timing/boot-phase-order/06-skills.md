# Skill: Structure Service Provider boot() Methods

## Purpose
Write `boot()` methods that correctly initialize application services (routes, events, views, gates) while respecting the two-phase provider lifecycle.

## When To Use
- Creating or modifying a service provider that needs to register routes, event listeners, view composers, or gates
- Moving initialization logic that was incorrectly placed in `register()`
- Refactoring providers that perform heavy I/O in `boot()`

## When NOT To Use
- For container bindings — use `register()` (see `register-phase-order` skill)
- For providers that only bind services — make them deferred (see `deferred-provider-loading-timing` skill)
- For cross-provider setup that must run after ALL providers boot — use `booted()` callbacks (see `lifecycle-callback-hooks` skill)

## Prerequisites
- Understanding of the register-then-boot two-phase guarantee
- Knowledge of which services your provider depends on from other providers

## Inputs
- Provider class content with `boot()` method to audit or write
- List of services/routes/events the provider must register

## Workflow
1. Identify all actions the provider performs — separate bindings (go in `register()`) from initialization (stays in `boot()`)
2. Remove any `$this->app->bind()` calls from `boot()` and move them to `register()`
3. Register routes using `Route::middleware()->group()` or `$this->loadRoutesFrom()`
4. Register event listeners using `Event::listen()` or the `$listen` array on `EventServiceProvider`
5. Register view composers, gate definitions, and command registrations
6. Audit for heavy I/O — move database queries, API calls, or file operations out of `boot()` (use deferred loading or lazy initialization)
7. If extending a parent provider, call `parent::boot()` as the first statement
8. Document cross-provider dependencies as comments in `boot()` or in `config/app.php`

## Validation Checklist
- [ ] No `$this->app->bind()` or `singleton()` calls exist in `boot()`
- [ ] No `$this->app->make()` calls that could be moved earlier are in `boot()`
- [ ] Parent `boot()` is called when extending a provider
- [ ] No heavy I/O operations in `boot()`
- [ ] Boot dependencies on other providers are documented
- [ ] `boot()` does not call `$app->boot()` or `app()->boot()`

## Common Failures
- Binding in `boot()` makes the binding invisible to deferred providers that resolve before `boot()`
- Heavy I/O in `boot()` adds 5-50ms to every request's bootstrap time
- Skipping `parent::boot()` when extending a provider silently omits parent initialization
- Rebinding an already-resolved singleton in `boot()` has no effect on existing instances

## Decision Points
- If `boot()` is empty and the provider only binds services, implement `DeferrableProvider` to skip boot entirely
- If `boot()` depends on another provider's services, reorder `config/app.php` or refactor to use `booted()` callback
- If `boot()` logic is extensive, split into multiple providers by concern

## Performance Considerations
- `boot()` iteration is O(n) on provider count — each empty `boot()` adds ~1-2µs
- Route/event registration in `boot()` adds 5-50ms — mitigated by `route:cache` and `event:cache`
- Deferred providers with no boot logic skip `boot()` entirely

## Security Considerations
- Auth gates, policies, and authorization setup should run in `boot()` where all services are available
- Package providers boot after app providers — a package's `boot()` can read but not override app bindings
- Avoid logging sensitive configuration values in `boot()` — all config is fully resolved

## Related Rules
- Boot Phase Order Rule 1: Separate Binding Registration from Initialization
- Boot Phase Order Rule 2: Avoid Heavy I/O in Boot
- Boot Phase Order Rule 6: Always Call parent::boot() When Extending Providers

## Related Skills
- Structure Service Provider register() Methods (register-phase-order)
- Implement Deferred Providers (deferred-provider-loading-timing)
- Order Service Providers by Dependency (ku-02-provider-registration-order)

## Success Criteria
- All bindings are in `register()`, all initialization is in `boot()`
- Bootstrap completes within expected time budget
- No `BindingResolutionException` from missing bindings during boot
- Parent providers' boot logic executes correctly when extending
