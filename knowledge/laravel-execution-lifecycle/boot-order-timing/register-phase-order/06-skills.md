# Skill: Structure Service Provider register() Methods

## Purpose
Write `register()` methods that correctly add container bindings without performing unsafe resolution or side effects, following the two-phase initialization contract.

## When To Use
- Creating or modifying a service provider that needs to add bindings to the container
- Refactoring an existing provider with `make()` calls inside `register()`
- Onboarding a team to Laravel's service provider lifecycle

## When NOT To Use
- For boot-time initialization logic (routes, events, views) — use the `Boot Phase Order` skill
- For deferred providers with only `$bindings`/`$singletons` properties — no explicit `register()` needed
- For config merging only — use `mergeConfigFrom()` but keep it minimal

## Prerequisites
- Understanding of the 16-step boot sequence from `complete-boot-sequence`
- Familiarity with the three provider source merge order (framework core, `config/app.php`, package discovery)

## Inputs
- Provider class content to audit or write
- `config/app.php` provider list

## Workflow
1. Identify all `$this->app->bind()`, `singleton()`, `scoped()`, `instance()`, and `when()->needs()->give()` calls in the provider
2. Move all such calls into `register()` if they are currently in `boot()`
3. Scan `register()` for any `$this->app->make()`, `resolve()`, or `app()` calls — move those to `boot()`
4. Replace simple interface-to-class mappings with the `$bindings` and `$singletons` properties
5. Verify `mergeConfigFrom()` calls are in `register()` (they must be for other providers to access the config)
6. Ensure no file I/O, network calls, or side effects exist in `register()`
7. Run `php artisan optimize:clear` and verify the provider loads without error

## Validation Checklist
- [ ] No `$this->app->make()` calls exist in any `register()` method
- [ ] All container bindings are in `register()` (not `boot()`)
- [ ] Simple interface-to-class mappings use `$bindings`/`$singletons` properties
- [ ] `mergeConfigFrom()` calls are in `register()`
- [ ] No I/O or side effects in `register()`
- [ ] Provider passes `php artisan optimize` without errors

## Common Failures
- Resolving `config` in `register()` works but other services may not — developers generalize this pattern incorrectly
- Heavy `register()` methods compound bootstrap time because every non-deferred provider runs on every request
- `mergeConfigFrom()` in `boot()` causes config values to be unavailable to other providers during `register()`

## Decision Points
- If a binding depends on runtime configuration, register a closure that reads config lazily rather than resolving it eagerly in `register()`
- If a provider has extensive `register()` logic, consider splitting into multiple smaller providers by concern

## Performance Considerations
- Empty `register()` still incurs ~1-2µs dispatch overhead per provider
- 50 providers with heavy `register()` methods can add 10-50ms to bootstrap time
- Deferred providers skip `register()` entirely — use them for binding-only providers

## Security Considerations
- Providers registered later can override bindings from earlier ones — the last registration wins
- Package discovery providers run after app providers; sensitive bindings in app providers can be overridden unless protected
- Never expose secrets or make API calls in `register()`

## Related Rules
- Register Phase Order Rule 1: Never Resolve Services in register()
- Register Phase Order Rule 5: Keep register() Minimal
- ku-01-register-vs-boot Rule 1: Keep register() Pure

## Related Skills
- Structure Service Provider boot() Methods (boot-phase-order)
- Implement Deferred Providers (deferred-provider-loading-timing)
- Order Service Providers by Dependency (ku-02-provider-registration-order)

## Success Criteria
- Every `register()` method in the codebase is free of resolution calls and side effects
- Bootstrap completes without `BindingResolutionException` errors
- Simple bindings use declarative `$bindings`/`$singletons` properties
- The `register()` phase completes within expected time budget
