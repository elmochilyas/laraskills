# Skill: Implement Service Provider Registration (register vs boot)

## Purpose
Correctly implement the `register()` and `boot()` lifecycle in Laravel service providers, ensuring bindings are registered in the right phase and avoiding common bugs from lifecycle misunderstanding.

## When To Use
- Writing a new service provider for a package or application
- Debugging a provider that fails with "service not available" errors
- Optimizing provider performance with deferred loading
- Converting an existing provider with lifecycle bugs

## When NOT To Use
- Using Spatie Package Tools (the DSL handles lifecycle separation automatically)
- Simple providers with only config merging (use `register()` only)

## Prerequisites
- Understanding of Laravel service container
- Provider class extending `Illuminate\Support\ServiceProvider`

## Inputs
- List of bindings the provider needs to register
- List of boot-time resources (views, routes, migrations, events, commands)
- Decision on whether the provider can be deferred

## Workflow (numbered)
1. **Identify bindings** — List all `$this->app->bind()`, `$this->app->singleton()`, and `mergeConfigFrom()` calls; these go in `register()`
2. **Identify boot resources** — List all view loading, route registration, migration setup, event listeners, and command registrations; these go in `boot()`
3. **Implement register()** — Only bindings and `mergeConfigFrom()`; no resolved instances, no `app()` calls, no service resolution
4. **Set up deferred** — If provider has only `register()` and no `boot()`, set `protected $defer = true` and implement `provides()` method
5. **Implement boot()** — Use method injection for required services; split complex boot into `bootCommands()`, `bootViews()`, `bootRoutes()` methods
6. **Add conditional guards** — Use `if ($this->app->runningInConsole())` or `if ($this->app->environment('production'))` for environment-specific registration
7. **Call parent methods** — If extending a base provider, ensure `parent::register()` and `parent::boot()` are called in the override

## Validation Checklist
- [ ] `register()` contains only bindings and `mergeConfigFrom()`
- [ ] `boot()` handles views, routes, migrations, events, commands
- [ ] No resolved services in `register()` (no `$this->app->make()`, `app()`)
- [ ] `parent::register()` and `parent::boot()` called if overriding
- [ ] `$defer = true` set for binding-only providers
- [ ] `provides()` returns all bindings for deferred providers
- [ ] Boot method injection used instead of constructor injection
- [ ] Heavy operations (DB, API, file I/O) deferred to lazy evaluation
- [ ] Conditional registration guards applied in `boot()` where needed

## Common Failures
- **Resolving services in register()** — services not available yet; runtime errors or null references
- **Heavy boot() operations** — DB queries, API calls run on every request; add significant latency
- **Forgetting $defer property** — binding-only provider eagerly loaded even when bindings unused
- **register() side effects** — view/route registration in register() depends on services not yet available
- **Missing parent::register()/boot()** — base class registration logic skipped entirely

## Decision Points
- Deferred vs eager: binding-only providers = deferred; any boot logic = eager
- Boot method splitting: complex boot() → split into named methods (bootCommands, bootViews)
- Conditional guards: use `runningInConsole()` for command-only registration; environment checks for dev-only features

## Performance/Security Considerations
- Each eager provider's register/boot adds to application boot time; minimize where possible
- Deferred providers eliminate boot time when bindings aren't used — most underutilized optimization
- `php artisan optimize` caches compiled providers; include in deploy scripts
- 50+ eager providers adds ~1-2MB baseline memory; use deferred for binding-only packages
- Environment-aware registration guards in boot() prevent debugging tools in production
- Commands registered in boot() should include safety prompts for destructive operations
- Test that deferred providers don't accidentally expose bindings that should be eagerly loaded

## Related Rules (from 05-rules.md)
- REGBOOT-RULE-001: register() is for bindings only
- REGBOOT-RULE-002: boot() for registration that needs resolved services
- REGBOOT-RULE-003: Deferred for binding-only providers
- REGBOOT-RULE-004: No resolved services in register()
- REGBOOT-RULE-005: No heavy I/O in register() or boot()
- REGBOOT-RULE-011: Deferred providers reduce memory

## Related Skills
- Set Up a Package Service Provider with Spatie Tools
- Configure Package Auto-Discovery
- Write Deferred Service Providers for Laravel Packages

## Success Criteria
- Provider boot logic works correctly in all environments
- No lifecycle-related bugs: every service resolved when it's available
- Deferred providers not loaded when their bindings aren't used
- Provider boot time under 5ms (under 1ms for deferred)
- All boot methods are testable in isolation
- Heavy operations deferred; no unnecessary request-time work

---

# Skill: Write Deferred Service Providers for Laravel Packages

## Purpose
Optimize Laravel package performance by implementing deferred service providers that only load when their bindings are actually resolved, reducing boot time and memory for requests that don't use the package.

## When To Use
- Package only registers bindings (no boot-time logic)
- Package's services are used infrequently relative to request volume
- Package has heavy setup that should only run on demand

## When NOT To Use
- Package has boot-time logic (views, routes, events, migrations)
- Package's bindings are used on every request (no benefit from deferring)
- Package relies on boot-time configuration or service resolution

## Prerequisites
- Service provider implementing `Illuminate\Contracts\Support\DeferrableProvider`
- Understanding of which bindings the provider registers

## Inputs
- List of all bindings/singletons the provider registers
- Service container binding names (abstracts) that consumers use

## Workflow (numbered)
1. **Verify deferred eligibility** — Provider has only `register()` with bindings; no `boot()` logic
2. **Implement DeferrableProvider** — Class implements `Illuminate\Contracts\Support\DeferrableProvider` (or `protected $defer = true` in older Laravel)
3. **Implement provides()** — Return array of all binding names the provider registers: `return [UserService::class, 'user.service']`
4. **Move register() logic** — Ensure all bindings are in `register()`; no boot-time dependency
5. **Update tests** — Verify that bindings resolve correctly after deferred loading
6. **Benchmark** — Compare boot time with eager vs deferred; confirm reduction (typical: ~5-20ms saved per request without binding usage)

## Validation Checklist
- [ ] Provider implements `DeferrableProvider` or uses `$defer = true`
- [ ] `provides()` returns all binding names the provider registers
- [ ] No `boot()` method in the provider
- [ ] Bindings resolve correctly when first requested (deferred loading works)
- [ ] Test verifies provider is not loaded when bindings are not used
- [ ] Benchmark shows measurable boot time reduction

## Common Failures
- **Deferred provider with boot()** — boot() is silently skipped; no error, but boot logic never runs
- **Incomplete provides()** — binding resolves but provider not loaded; container throws binding not found
- **Binding-only assumption wrong** — provider does have boot-time logic; cannot be deferred
- **Unnecessary deferring** — bindings used on every request; deferring adds complexity with no benefit

## Decision Points
- DeferrableProvider interface vs `$defer` property: use interface for Laravel >= 8; `$defer` for backward compatibility
- Which bindings to include in provides(): include all bindings; test each resolves correctly
- When not to defer: binding used on > 50% of requests, or boot time reduction is negligible

## Performance/Security Considerations
- Deferred providers are one of the most underutilized Laravel performance optimizations
- First request that resolves a deferred binding experiences provider register() as part of resolution (cache warmup consideration)
- No security difference between deferred and eager; binding resolution is identical
- Test that deferred providers don't create timing issues for event-driven or queue-based workflows

## Related Rules (from 05-rules.md)
- REGBOOT-RULE-003: Deferred for binding-only providers
- REGBOOT-RULE-010: Deferred providers implement provides()
- REGBOOT-RULE-011: Deferred providers reduce memory
- REGBOOT-RULE-012: Deferred providers underutilized
- REGBOOT-RULE-015: Avoid deferred providers with boot()

## Related Skills
- Implement Service Provider Registration (register vs boot)
- Configure Package Auto-Discovery
- Optimize Laravel Application Boot Time

## Success Criteria
- Deferred provider not loaded when its bindings aren't used (verified via log or debug)
- Application boot time reduced by 5-20ms per request (for unused providers)
- All bindings resolve correctly on first request after deferred loading
- Zero deferred providers with silently skipped boot logic
