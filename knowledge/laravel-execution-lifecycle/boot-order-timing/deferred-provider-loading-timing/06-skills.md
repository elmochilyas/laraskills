# Skill: Implement Deferred Providers for Bootstrap Optimization

## Purpose
Configure service providers as deferred so their `register()` and `boot()` methods are skipped until their services are first resolved, reducing per-request bootstrap overhead.

## When To Use
- Providers that only register bindings and have no `boot()` logic
- Providers whose services are not needed on every request (admin panels, reporting, analytics)
- Package providers offering optional features that are rarely used together
- Auditing existing providers to identify deferral candidates

## When NOT To Use
- Providers with `boot()` logic that registers routes, event listeners, view composers, or gates on every request
- Providers whose services are resolved on 90%+ of requests — deferral adds complexity without meaningful benefit
- Providers that register middleware, commands, or scheduled tasks
- When the first-use latency spike from loading the deferred provider is unacceptable

## Prerequisites
- Understanding of the two-phase provider lifecycle (register vs boot)
- Knowledge of which services the provider registers and their usage frequency
- Familiarity with the services cache at `bootstrap/cache/services.php`

## Inputs
- Provider class content to audit for deferral eligibility
- Service usage frequency data (which services are used on what percentage of requests)

## Workflow
1. Audit the provider — does it have a `boot()` method? If yes, deferral is likely inappropriate (unless using `when()`)
2. Verify the provider only contains `register()` bindings and `$bindings`/`$singletons` properties
3. Implement `DeferrableProvider` interface on the provider class (use the interface, not the legacy `$defer` property)
4. Implement `provides()` method that returns EVERY service identifier the provider registers, including aliases
5. If the provider registers event listeners and must be deferred, implement `when()` to trigger loading before the relevant event fires
6. Run `php artisan optimize:clear` and `php artisan optimize` to regenerate the services manifest
7. Verify by inspecting `bootstrap/cache/services.php` — the provider should appear in the `deferred` array
8. Test that every service listed in `provides()` resolves correctly from the container

## Validation Checklist
- [ ] Provider implements `DeferrableProvider` interface (not the legacy `$defer` property)
- [ ] `provides()` returns ALL bindings and aliases the provider registers
- [ ] No `boot()` logic that must run on every request exists in the provider
- [ ] Services cache is regenerated and verified after deferral changes
- [ ] First-use latency spike for deferred services is acceptable in production
- [ ] Every service in `provides()` resolves correctly via `$app->make()`
- [ ] `when()` is implemented if the deferred provider must respond to events

## Common Failures
- Missing a service in `provides()` — causes `BindingResolutionException` when that service is resolved
- Deferring a provider with `boot()` logic — the `boot()` method still runs on first resolution, defeating the optimization
- Not clearing the services cache after changes — stale manifest treats the provider as eager (or fails to recognize new services)
- Type-hinting a deferred service in a high-traffic class constructor — triggers resolution on every request, negating deferral benefit

## Decision Points
- If a provider has both bindings and boot logic, split into one deferred binding provider and one eager boot provider
- If the deferred service is used on most requests, keep the provider eager — deferral adds complexity without savings
- Use `when()` only when the deferred provider registers event listeners that must fire before the listened event

## Performance Considerations
- Deferred providers save 100% of their `register()` and `boot()` overhead on requests that don't use their services
- First resolution pays a ~1-5ms penalty for provider loading plus service construction
- Without services cache, every request inspects all providers for deferral — this defeats the optimization
- Under Octane, deferred providers load once per worker on first use, then stay loaded — less impactful but still reduces per-worker memory

## Security Considerations
- Auth and authorization providers should NOT be deferred — they must run on every authenticated request
- A deferred provider that registers auth-related services loads at first auth call — ensure `provides()` includes all auth bindings
- Deferred providers loaded mid-request have access to current request context — closures must not capture sensitive data
- Security services never loaded cannot protect — ensure critical security providers are eager

## Related Rules
- Deferred Provider Loading Timing Rule 1: Keep provides() Complete and In Sync
- Deferred Provider Loading Timing Rule 2: Never Defer Providers with Boot Logic
- Deferred Provider Loading Timing Rule 3: Regenerate Services Cache After Provider Changes

## Related Skills
- Structure Service Provider register() Methods (register-phase-order)
- Structure Service Provider boot() Methods (boot-phase-order)
- Order Service Providers by Dependency (ku-02-provider-registration-order)

## Success Criteria
- Every binding-only provider implements `DeferrableProvider`
- `provides()` method is complete and verified against the provider's bindings
- Services cache is regenerated after any deferral change
- No `BindingResolutionException` occurs from missing `provides()` entries
- Bootstrap time is measurably reduced after deferral optimization
