# Knowledge Unit: Service Provider Registration (register vs boot)

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/service-provider-registration-boot
- **Maturity:** Mature
- **Related Technologies:** Laravel Service Container, Service Providers, PHP

## Executive Summary

The `register()` and `boot()` methods in Laravel service providers have distinct purposes and constraints. `register()` is for binding classes into the service container—it runs before all providers are registered, meaning you cannot use any resolved application services (like the event dispatcher, router, or config repository). `boot()` runs after all providers are registered, so it safely uses any resolved application service. This two-phase lifecycle enables Laravel to construct the entire application dependency graph before any component starts operating. Misunderstanding the separation causes subtle bugs where package boot logic fails because the required bindings don't exist yet.

## Core Concepts

- **register() Phase:** All service providers' `register()` methods execute first. Only bindings and singletons should be set here. No resolved instances (`$this->app->make()`, `app()`) should be accessed.
- **boot() Phase:** After all `register()` methods complete, all service providers' `boot()` methods execute. This is where views, routes, migrations, events, and middleware are registered—any operation that depends on fully registered bindings.
- **Deferred Providers:** Providers that only implement `register()` can be deferred—they're not loaded until a binding they provide is resolved. Deferred providers skip `boot()` entirely.
- **Provider Boot Order:** Within each phase, providers execute in the order they appear in `config/app.php` (merged with auto-discovered providers); this order is largely alphabetical.

## Mental Models

- **register() as Dependency Declaration:** Think of `register()` as declaring "here are the classes this package provides to the application"; like defining exports in a module
- **boot() as Initialization:** Think of `boot()` as "the system is fully built, now set up functionality that depends on the complete system"; like an application's main() function
- **The Unresolved Container:** During `register()`, the container is like a parts warehouse—you can see what's available (check `$this->app->bound()`) but you can't assemble anything (call `$this->app->make()`)
- **Phase Separation as Safety Net:** The two-phase design prevents circular dependencies: A cannot depend on B if B hasn't registered yet; by the time `boot()` runs, all dependencies are guaranteed registered

## Internal Mechanics

1. **Provider Instantiation:** Laravel creates provider instances and calls `register()` on each, in order. During this phase, bindings are stored in the container's `$bindings` and `$instances` arrays but are not resolved.
2. **Boot Phase Trigger:` After all `register()` calls complete, Laravel iterates providers again and calls `boot()` on each. The container is fully populated, so any binding can be resolved.
3. **Deferred Provider Loading:** When a deferred provider's binding is resolved (via `app()->make()`), Laravel: creates the provider, calls `register()`, adds it to the loaded providers list for potential `boot()` call, and resolves the binding.
4. **Multiple Booting:** Providers can define `boot()` as multiple methods using `$this->app->booted(function() { ... })` or by implementing individual methods. These execute after all `boot()` methods have completed.
5. **Deferred Provider Resolution:** The `$defer` property and `provides()` method define which bindings a deferred provider handles. When `$this->app->make('binding-name')` is called, Laravel checks if any deferred provider provides it, loads that provider, then resolves.

## Patterns

- **register-Only Providers:** For packages that only provide interface-to-class bindings: implement `register()` with `$this->app->bind()` / `$this->app->singleton()` and set `protected $defer = true`.
- **Safe Boot Access:** In `boot()`, use method injection or `$this->app->make()` to access resolved services. Never inject in the constructor; the container isn't fully populated yet.
- **Conditional Boot Registration:** Use `if ($this->app->runningInConsole())` or `if ($this->app->environment('production'))` guards in `boot()` to conditionally register console-specific or environment-specific resources.
- **boot() Event Listeners:** Use `$this->app['events']->listen()` in `boot()` to register event listeners that depend on fully booted application. Event dispatcher is available in `boot()` because it's registered early by Laravel's core providers.
- **Multiple Boot Method Pattern:** Define boot concerns in separate protected methods (`bootCommands()`, `bootViews()`, `bootRoutes()`) and call them from the `boot()` method for organizational clarity.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Provider type | Eager vs deferred | Deferred for binding-only providers; eager for providers with boot logic |
| register() content | Bindings only vs bindings + simple config | Bindings only + mergeConfigFrom; all other logic in boot() |
| Deferred declaration | $defer property vs implementsDeferredProvider interface | $defer for simple cases; interface for complex provides() declarations |
| Boot method injection | Type-hint parameters vs $this->app->make() | Type-hint for required services; $this->app->make() for optional services |

## Tradeoffs

- **Deferred Performance vs Complexity:** Deferred providers significantly reduce boot time but cannot have `boot()` logic and their `register()` cannot depend on other bindings. Eager providers with minimal boot logic are sometimes simpler.
- **register Config Merging vs boot Config Merging:** `mergeConfigFrom()` in `register()` ensures merged config is available to all other providers during `boot()`. Merging in `boot()` means config may not be available to earlier-booting providers.
- **Constructor Injection vs Boot Injection:** Constructor injection in provider is unreliable because container isn't fully built. Boot method injection is reliable. Always use `boot()` for injection.
- **Single boot() vs Multiple Method Calls:** One large `boot()` is simpler but harder to maintain; splitting into focused methods (bootRoutes, bootViews, etc.) is more organized but adds method count.

## Performance Considerations

- **Boot Time Impact:** Each eager provider's `register()` and `boot()` add to application boot time. Deferred providers eliminate this cost for requests that don't use the provider's bindings.
- **Provider Caching:** `php artisan optimize` caches the compiled providers and manifest; this reduces boot time significantly. Without caching, all providers are instantiated and booted on every request.
- **Deferred Provider Resolution Latency:** The first request that resolves a deferred provider's binding experiences the provider's `register()` call as part of the resolution, adding latency to that request.
- **Memory Impact:** Each provider instance occupies memory; 50+ eager providers can add ~1-2MB to baseline memory usage. Deferred providers reduce baseline memory.

## Production Considerations

- **Provider Order Dependencies:** If one provider depends on another's boot-time registrations, document the order requirement in the package README. Use `ServiceProvider::when()` for deferred provider dependencies.
- **Environment-Aware Registration:** Use `$this->app->environment()` checks in `boot()` to skip registration of development-only services (debugbars, profilers) in production.
- **Provider Registration Testing:** Test that providers register correctly: resolve bindings in tests, verify views and routes are accessible, test deferred providers load on correct trigger.
- **Caching and Optimization:** In deployment scripts, `php artisan optimize --force` re-compiles all cached configurations including service providers, improving boot performance.

## Common Mistakes

- **Resolving services in register():** Calling `app('config')`, `app('events')`, or using injected services in `register()`; these may not be available yet, causing runtime errors
- **Heavy boot() operations:** Running database queries, API calls, or file operations in `boot()`; these execute on every request, adding latency
- **Forgetting $defer property:** A binding-only provider without `$defer = true` is eagerly loaded, wasting boot time
- **register() side effects:** Performing view registration or route loading in `register()`; these operations depend on services that may not be available yet
- **Missing parent::register()/boot():** When extending a base provider, forgetting the parent call skips necessary registration logic from the base class

## Failure Modes

- **Order-Dependent Crash:** Provider A's `boot()` calls a service registered by Provider B, but B boots after A. Mitigate: use deferred provider `when()` to declare B as a trigger for A's loading.
- **Deferred Provider Not Found:** A binding resolved earlier than expected triggers a deferred provider that doesn't provide the requested service. Mitigate: verify `provides()` method returns all bindings the deferred provider registers.
- **Circular Deferred Provider Chain:** Deferred provider A triggers B, which triggers A. Mitigate: restructure to avoid circular deferred dependencies; consider merging providers or making both eager.
- **register() Exception Fails All Providers:** An exception in one provider's `register()` prevents remaining providers from running. Mitigate: wrap risky registration in try-catch and log errors.

## Ecosystem Usage

- **Laravel Core:** The framework itself uses this pattern in 20+ built-in providers (CacheServiceProvider, DatabaseServiceProvider, etc.)
- **Package Ecosystem:** Every package's service provider follows the register/boot pattern; it's fundamental to Laravel's architecture
- **Spatie Package Tools:** The `PackageServiceProvider` handles register/boot separation internally; developers using Spatie tools don't need to manage the lifecycle manually
- **Telescope/Debugbar:** Use boot-time environment checks to only register in development environments; demonstrate conditional registration pattern

## Related Knowledge Units

- package-service-provider-patterns
- spatie-laravel-package-tools
- package-auto-discovery
- config-file-merging-publishing

## Research Notes

- The register/boot pattern is inherited from Laravel's architectural debt to Taylor Otwell's design decisions in Laravel 3/4; it mirrors patterns in other frameworks (Spring Framework's Bean Post Processors)
- The pattern has been stable since Laravel 5.0 (2015) and is unlikely to change in future versions
- Deferred providers are one of the most underutilized performance optimization features in Laravel packages
- The trend toward auto-discovery has not changed the register/boot pattern; auto-discovery handles provider registration, but providers still follow the same lifecycle
