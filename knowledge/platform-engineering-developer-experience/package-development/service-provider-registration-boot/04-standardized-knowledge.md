# Experience Curation: Service Provider Registration (register vs boot)

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/service-provider-registration-boot
- **Maturity:** Mature
- **Related Technologies:** Laravel Service Container, Service Providers, PHP
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
The `register()` and `boot()` methods in Laravel service providers have distinct purposes and constraints. `register()` is for binding classes into the service container—it runs before all providers are registered, meaning you cannot use any resolved application services (like the event dispatcher, router, or config repository). `boot()` runs after all providers are registered, so it safely uses any resolved application service. This two-phase lifecycle enables Laravel to construct the entire application dependency graph before any component starts operating. Misunderstanding the separation causes subtle bugs where package boot logic fails because the required bindings don't exist yet.

## Core Concepts
- **register() Phase:** All service providers' `register()` methods execute first. Only bindings and singletons should be set here. No resolved instances (`$this->app->make()`, `app()`) should be accessed.
- **boot() Phase:** After all `register()` methods complete, all service providers' `boot()` methods execute. This is where views, routes, migrations, events, and middleware are registered—any operation that depends on fully registered bindings.
- **Deferred Providers:** Providers that only implement `register()` can be deferred—they're not loaded until a binding they provide is resolved. Deferred providers skip `boot()` entirely.
- **Provider Boot Order:** Within each phase, providers execute in the order they appear in `config/app.php` (merged with auto-discovered providers); this order is largely alphabetical.
- **register() as Dependency Declaration:** Think of `register()` as declaring "here are the classes this package provides to the application"; like defining exports in a module
- **boot() as Initialization:** Think of `boot()` as "the system is fully built, now set up functionality that depends on the complete system"; like an application's main() function

## When To Use
- Every service provider must implement at least `register()` for bindings; `boot()` is needed when registration depends on resolved services
- Deferred providers for packages that only bind interfaces to classes without boot-time registration
- Multiple boot methods pattern when the provider handles several distinct registration concerns (commands, views, routes, events)
- Conditional registration in `boot()` when resources should only be available in specific environments or contexts

## When NOT To Use
- Don't resolve services in `register()`; use `boot()` for any logic that needs resolved instances
- Don't use deferred providers if `boot()` logic is needed; deferred providers cannot have boot methods
- Don't put heavy I/O (database queries, API calls, file operations) in either `register()` or `boot()`—these run on every request
- Don't register routes, views, or migrations in `register()`; these operations depend on services that may not be available

## Best Practices
- **WHY:** Use `mergeConfigFrom()` in `register()` so merged config is available to all providers during `boot()`. Merging in `boot()` means config may not be available to earlier-booting providers.
- **WHY:** Set `protected $defer = true` for binding-only providers. Deferred providers eliminate boot time overhead for requests that don't use the provider's bindings.
- **WHY:** Use boot method injection (type-hint parameters) for required services rather than `$this->app->make()`. Method injection is cleaner and testable.
- **WHY:** Split complex `boot()` into multiple protected methods (`bootCommands()`, `bootViews()`, `bootRoutes()`) for organizational clarity and testability.
- **WHY:** Use `if ($this->app->runningInConsole())` guards in `boot()` to conditionally register console-specific or environment-specific resources.

## Architecture Guidelines
- **register-Only Providers:** For packages that only provide interface-to-class bindings: implement `register()` with `$this->app->bind()` / `$this->app->singleton()` and set `protected $defer = true`
- **Safe Boot Access:** In `boot()`, use method injection or `$this->app->make()` to access resolved services. Never inject in the constructor; the container isn't fully populated yet.
- **Conditional Boot Registration:** Use `if ($this->app->runningInConsole())` or `if ($this->app->environment('production'))` guards in `boot()` to conditionally register environment-specific resources
- **boot() Event Listeners:** Use `$this->app['events']->listen()` in `boot()` to register event listeners that depend on fully booted application
- **Multiple Boot Method Pattern:** Define boot concerns in separate protected methods (`bootCommands()`, `bootViews()`, `bootRoutes()`) and call them from the `boot()` method
- **Deferred Provider Resolution:** The `$defer` property and `provides()` method define which bindings a deferred provider handles. When `$this->app->make('binding-name')` is called, Laravel checks if any deferred provider provides it, loads that provider, then resolves.

## Performance
- Each eager provider's `register()` and `boot()` add to application boot time. Deferred providers eliminate this cost for requests that don't use the provider's bindings.
- `php artisan optimize` caches the compiled providers and manifest; without caching, all providers are instantiated and booted on every request.
- The first request that resolves a deferred provider's binding experiences the provider's `register()` call as part of the resolution, adding latency to that request.
- Each provider instance occupies memory; 50+ eager providers can add ~1-2MB to baseline memory usage. Deferred providers reduce baseline memory.
- Deferred providers are one of the most underutilized performance optimization features in Laravel packages.

## Security
- Use environment-aware registration guards in `boot()` to ensure debugging or introspection tools are only loaded in appropriate environments
- Don't register sensitive routes or middleware in `boot()` without environment checks
- Commands registered in `boot()` should include safety prompts for destructive operations
- Test that deferred providers don't accidentally expose bindings that should be eagerly loaded for security reasons

## Common Mistakes

### Resolving services in register()
- **Description:** Calling `app('config')`, `app('events')`, or using injected services in `register()`
- **Consequence:** These services may not be available yet during the registration phase, causing runtime errors or null references
- **Better Approach:** Use `register()` only for bindings; use `boot()` for any logic requiring resolved services

### Heavy boot() operations
- **Description:** Running database queries, API calls, or file operations in `boot()`
- **Consequence:** These execute on every request, adding significant latency to application boot time
- **Better Approach:** Defer heavy operations to lazy evaluation, event listeners, or command handlers

### Forgetting $defer property
- **Description:** A binding-only provider without `$defer = true`
- **Consequence:** Provider is eagerly loaded on every request even when its bindings are never used, wasting boot time and memory
- **Better Approach:** Always set `protected $defer = true` for providers that only register bindings and don't need boot logic

### register() side effects
- **Description:** Performing view registration, route loading, or other initialization in `register()`
- **Consequence:** These operations depend on services that may not be available during the registration phase; registration fails or produces inconsistent state
- **Better Approach:** Keep `register()` pure—only bindings and `mergeConfigFrom()`; move all other registration to `boot()`

### Missing parent::register()/boot()
- **Description:** When extending a base provider (e.g., Spatie PackageServiceProvider), forgetting to call parent methods
- **Consequence:** The base class's registration logic is skipped, breaking the entire registration chain
- **Better Approach:** Always call `parent::register()` and `parent::boot()` when overriding these methods

## Anti-Patterns
- **Everything in boot():** Putting all registration logic in `boot()` because it "works" (bindings, config merging, views, routes all in boot); this bypasses the register/boot separation and can cause ordering issues
- **Constructor injection in providers:** Using constructor injection in a service provider class; the container isn't fully populated during construction, so injections may fail
- **Deferred providers with boot() logic:** Setting `$defer = true` but also implementing `boot()`; deferred providers never execute `boot()`, so boot logic is silently skipped
- **register() as initialization:** Treating `register()` as the place to initialize the package (loading configs, setting up middleware, registering routes); these belong in `boot()`

## Examples
- **Laravel Sanctum:** Uses `register()` for binding the Sanctum guard, `boot()` for registering commands and configuring the auth provider
- **Spatie/laravel-permission:** Uses Spatie PackageServiceProvider which handles register/boot separation internally; developer only implements `configurePackage()`
- **barryvdh/laravel-debugbar:** Uses `boot()` with environment checks to only register debug bar assets and collectors in non-production environments

## Related Topics
- package-service-provider-patterns (broader context of service provider design)
- spatie-laravel-package-tools (abstracts register/boot separation via configurePackage DSL)
- package-auto-discovery (how providers are discovered and loaded)
- config-file-merging-publishing (config merging must happen in register(), not boot())
- deferred-service-providers (deep dive into deferred provider mechanics)

## AI Agent Notes
- The register/boot separation is one of the most common sources of Laravel package bugs; always verify which phase a registration belongs in
- When users report "provider works on my machine but fails in production," suspect boot order or environment-dependent registration issues
- Spatie PackageTools eliminates register/boot concerns for most packages; recommend it to avoid manual lifecycle management
- Deferred providers are underutilized; always suggest them for binding-only packages
- The pattern has been stable since Laravel 5.0 (2015) and is unlikely to change

## Verification
- [ ] `register()` contains only bindings (`$this->app->bind()`, `$this->app->singleton()`) and `mergeConfigFrom()`
- [ ] `boot()` handles views, routes, migrations, events, and commands registration
- [ ] No resolved services are accessed in `register()` (no `$this->app->make()`, no `app()`)
- [ ] `parent::register()` and `parent::boot()` are called if overriding
- [ ] `$defer = true` is set for binding-only providers with no boot logic
- [ ] `provides()` method returns all bindings registered by deferred providers
- [ ] Boot method injection is used instead of constructor injection
- [ ] Heavy operations (DB queries, API calls, file I/O) are not in `register()` or `boot()`
- [ ] Conditional registration guards applied in `boot()` for environment-specific resources
- [ ] Provider tests verify bindings are resolvable and boot logic executes correctly
