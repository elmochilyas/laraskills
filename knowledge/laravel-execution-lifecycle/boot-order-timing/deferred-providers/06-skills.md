# Skill: Defer Service Providers Safely

## Purpose
Implement `DeferrableProvider` on eligible service providers with correct `provides()` and `when()` methods, ensuring deferred resolution works reliably without breaking event-driven features.

## When To Use
- Converting an eager provider to deferred for bootstrap optimization
- Creating a new provider that only binds services and should be deferred
- Adding event listeners to a deferred provider using `when()` for preemptive loading
- Auditing existing providers for deferral opportunities

## When NOT To Use
- When the provider registers routes, event listeners, view composers, or gates in `boot()`
- When the provider's services are resolved on most requests — savings are marginal
- When the first resolution latency spike is unacceptable for the service
- When the provider's `provides()` cannot be kept in sync with its bindings

## Prerequisites
- Understanding of the deferred services manifest (`bootstrap/cache/services.php`)
- Knowledge of the `DeferrableProvider` interface and `provides()` requirements
- Familiarity with the provider's binding registration

## Inputs
- Provider class to convert to deferred
- Complete list of all services, bindings, and aliases the provider registers

## Workflow
1. Verify the provider has no `boot()` logic that must run on every request — if it does, deferral is likely inappropriate
2. Add `implements DeferrableProvider` to the provider class
3. List every binding, alias, and service the provider registers via `$this->app->bind()`, `singleton()`, `scoped()`, and `$bindings`/`$singletons` properties
4. Implement `provides()` returning the complete list from step 3
5. If the provider registers event listeners in `boot()`, implement `when()` to specify which bindings/events trigger preemptive loading
6. Run `php artisan optimize:clear` to clear the services cache
7. Run `php artisan optimize` to regenerate the services manifest
8. Verify in `bootstrap/cache/services.php` that the provider appears in the `deferred` section with all service mappings
9. Test that every service in `provides()` resolves correctly via `$app->make()`
10. If the provider was previously eager, verify that its `register()` no longer runs during bootstrap by checking with debug logging

## Validation Checklist
- [ ] Provider implements `DeferrableProvider` interface (not legacy `$defer` property)
- [ ] `provides()` returns ALL services, bindings, and aliases the provider registers
- [ ] No mandatory `boot()` logic exists that must run on every request
- [ ] Services cache is regenerated and verified
- [ ] Every service in `provides()` resolves correctly from the container
- [ ] First-use latency spike is acceptable (<100ms for the deferred service)
- [ ] `when()` is implemented if the provider registers event listeners
- [ ] No controller/service constructor type-hints force early resolution of deferred services

## Common Failures
- Missing an alias in `provides()` — resolver on alias throws `BindingResolutionException`
- Deferring a provider with route/event registration in `boot()` — listeners never register until the provider triggers
- Not clearing cache after deferral change — stale manifest treats the provider as eager
- Deferring a service that is type-hinted in a widely-used constructor — the provider loads on every request anyway
- Using `when()` incorrectly — specifying the event class name instead of the service binding name

## Decision Points
- Use `when()` to specify services whose resolution should trigger provider loading — typically the event class for event listener registration
- If the provider has both bindings and boot logic, split into one deferred binding provider and one eager boot provider
- If the provider must NOT be deferred in some environments (e.g., Octane), consider conditional deferral

## Performance Considerations
- Saves 100% of `register()` + `boot()` overhead on requests that don't use the provider's services
- First resolution adds ~1-5ms penalty for provider loading + service construction
- Without services cache, the framework scans all providers on every request to detect deferral — this is slower than eager loading
- Under Octane, deferred providers load once per worker on first use — per-worker memory is reduced but per-request benefit is less significant

## Security Considerations
- Auth-related deferred providers load at first auth call — ensure `provides()` includes all auth bindings
- A deferred provider not yet loaded cannot protect or authenticate — critical security providers should be eager
- Closures in deferred providers capture scope at provider load time — ensure no sensitive data is captured
- Package deferred providers may expose services earlier or later than expected — verify timing in security-critical paths

## Related Rules
- Deferred Providers Rule 2: Always Implement provides() Completely
- Deferred Providers Rule 3: Never Defer Providers with Mandatory Boot Logic
- Deferred Providers Rule 5: Use when() for Event-Driven Deferred Providers

## Related Skills
- Implement Deferred Providers for Bootstrap Optimization (deferred-provider-loading-timing)
- Separate Service Registration from Initialization (ku-01-register-vs-boot)
- Order Service Providers by Dependency (ku-02-provider-registration-order)

## Success Criteria
- Deferred providers skip both phases on requests that don't use their services
- All services from deferred providers resolve correctly on first use
- Event listeners in deferred providers always fire (via correct `when()` configuration)
- Services cache is regenerated after every provider change
- Measurable bootstrap time reduction after deferral optimization
