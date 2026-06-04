# Experience Curation: Package Service Provider Patterns

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/package-service-provider-patterns
- **Maturity:** Mature
- **Related Technologies:** Laravel, Spatie Package Tools, Composer, Service Container
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Service providers are the central bootstrapping mechanism for Laravel packages. Every package registers bindings, event listeners, middleware, routes, commands, and configurations through a service provider class. The core pattern separates concerns into two phases: `register()` (binding classes into the container, never using resolved instances) and `boot()` (registering views, routes, migrations, and event listeners after all providers are registered). Understanding the provider lifecycle, deferred providers, and auto-discovery is essential for building maintainable, performant Laravel packages.

## Core Concepts
- **Service Provider Lifecycle:** All service providers' `register()` methods run first (in order), then all `boot()` methods run; this ensures all bindings exist before boot-time registration
- **Deferred Providers:** Providers that only register bindings (no boot logic) can be deferred—they're not loaded until one of their bindings is requested, reducing application boot time
- **Auto-Discovery:** Laravel's `composer.json` `extra.laravel` section lets packages register providers and facades automatically without manual entry in `config/app.php`
- **Provider Ordering:** Providers registered via auto-discovery boot in a specific order; the `when()` method on deferred providers declares dependencies that trigger provider loading
- **Provider as Plugin Manifest:** Think of the provider as the manifest file that tells Laravel what the package provides—bindings, commands, views, assets, translations
- **Register vs Boot as Construction vs Initialization:** `register()` is like a constructor (prepare dependencies, no side effects); `boot()` is like an initializer (set up resources that depend on constructed objects)

## When To Use
- Every Laravel package needs at least one service provider as its entry point
- Use deferred providers for packages that only register bindings without boot-time logic
- Use auto-discovery for distribution packages to eliminate manual setup steps
- Split into multiple providers only when functional separation is warranted (e.g., separate provider for Inertia support)
- Use Spatie's PackageServiceProvider for most packages to reduce boilerplate

## When NOT To Use
- Simple helper libraries that provide static utility functions don't need a service provider
- Packages that exclusively provide Artisan commands can sometimes skip a provider (commands can be auto-discovered)
- Application-specific code should use AppServiceProvider rather than a separate package provider
- Avoid multiple providers for simple packages; one provider is sufficient unless concerns are clearly separable

## Best Practices
- **WHY:** Call `mergeConfigFrom()` in `register()`, not `boot()`; config merged in `boot()` is unavailable to other providers' `boot()` methods
- **WHY:** Use deferred providers for binding-only packages; they reduce boot time by not loading until their bindings are requested
- **WHY:** Never resolve container instances in `register()`; not all services are bound yet during the registration phase
- **WHY:** Use auto-discovery for distribution packages; it eliminates manual provider registration and improves developer experience
- **WHY:** Use `$this->app->singleton()` for primary service classes; ensures the package's core service is resolved once and reused throughout the request lifecycle
- **WHY:** Implement conditional registration with `if (app()->runningInConsole())` guards to register resources only in appropriate runtime contexts

## Architecture Guidelines
- **Single Provider Pattern:** One provider per package; split only if functional separation is warranted (e.g., separate providers for web and API functionality)
- **Register-Only Provides Boot Methods:** For packages that only bind classes into the container, implement `register()` only and make the provider deferred by setting `protected $defer = true`
- **Config Merging Pattern:** In `register()`: `$this->mergeConfigFrom(__DIR__.'/../config/package.php', 'package-name')` merges package defaults with existing application config
- **Event-Based Boot Pattern:** Use `$this->app['events']->listen()` in `boot()` to dispatch events rather than performing actions immediately; this decouples the package from the boot order
- **Singleton Binding Pattern:** `$this->app->singleton(Contract::class, Concrete::class)` in `register()` ensures the primary service is resolved once and reused
- **Provider Base Class:** Extend Spatie's PackageServiceProvider for most packages; use Laravel's base ServiceProvider for deferred-only or exotic needs
- **Testing:** Test that providers register correctly: verify bindings are resolvable, deferred providers load on correct binding resolution, and boot logic executes without errors

## Performance
- Every eager-loaded provider adds to boot time; use deferred providers for any package that registers bindings without requiring boot-time registration
- `php artisan optimize` caches the package manifest; in production, deferred providers are resolved from cache without filesystem scanning
- Frequent `$this->app->make()` calls in `boot()` can be optimized by storing resolved instances in provider properties
- Publishing config files doesn't affect runtime performance; it only affects the build/deploy process
- Spatie Package Tools adds minimal overhead (microseconds) during provider boot

## Security
- Avoid registering commands, routes, or event listeners unconditionally that expose sensitive functionality; use conditional registration guards
- Auto-discovered providers should be auditable; document all providers a package registers
- For security-sensitive packages, consider requiring manual provider registration rather than auto-discovery to ensure explicit opt-in
- Never expose debugging or introspection routes in production environments; guard with `if (! app()->environment('production'))`

## Common Mistakes

### Container resolution in register()
- **Description:** Calling `$this->app->make()` or injecting resolved instances in `register()`
- **Consequence:** Not all services are bound yet; resolution may fail or return incomplete instances
- **Better Approach:** Use `register()` only for bindings; use `boot()` for any logic that requires resolved services

### Missing parent::register()/boot()
- **Description:** When extending a base provider class, forgetting to call parent methods
- **Consequence:** Breaks the parent's registration logic; Spatie PackageServiceProvider won't process the package specification
- **Better Approach:** Always call `parent::register()` and `parent::boot()` when overriding these methods

### Non-deferred providers for simple bindings
- **Description:** Creating eager-loaded providers for packages that only register bindings
- **Consequence:** Wastes boot time; the provider is loaded on every request even when its bindings are never used
- **Better Approach:** Set `protected $defer = true` for any package that only registers bindings without boot logic

### Heavy boot() logic
- **Description:** Running expensive operations (API calls, file system operations, database queries) in `boot()`
- **Consequence:** Increases application boot time and can cause errors if services aren't ready during boot
- **Better Approach:** Defer heavy operations to lazy evaluation, event listeners, or command handlers

### Over-registering providers
- **Description:** Registering the same provider multiple times (auto-discovery + manual entry)
- **Consequence:** Duplicate execution; provider's registration and boot logic runs twice, potentially causing duplicate bindings or resource registration
- **Better Approach:** Check config to avoid double registration; auto-discovery is sufficient for most packages

## Anti-Patterns
- **Doing everything in boot():** Putting all registration logic in `boot()` because it "works"; this bypasses the register/boot separation and can cause ordering issues
- **Giant provider classes:** A single provider with 500+ lines handling all package concerns; split into traits or separate classes for maintainability
- **Ignoring deferred providers:** Using eager-loaded providers for every package regardless of whether boot logic is needed
- **Runtime logic in register():** Making API calls, querying databases, or performing I/O in `register()`; this phase is for binding only
- **Manual provider registration insistence:** Requiring users to manually add providers to `config/app.php` when auto-discovery would work

## Examples
- **Laravel Sanctum:** Uses a service provider to register authentication guards, commands, and migrations with conditional production-only guards
- **Spatie/laravel-backup:** Uses Spatie PackageServiceProvider to register commands, config, views, and translations declaratively
- **barryvdh/laravel-debugbar:** Uses a service provider with conditional registration for debug bar assets and collectors (dev-only registration)

## Related Topics
- spatie-laravel-package-tools (provides the PackageServiceProvider base class with declarative DSL)
- service-provider-registration-boot (detailed lifecycle of register/boot phases)
- package-auto-discovery (how auto-discovery works and how to configure it in composer.json)
- package-skeleton-structure (skeleton provides the service provider template)
- config-file-merging-publishing (config merging must happen in register(), not boot())

## AI Agent Notes
- Always check whether a package needs boot logic before recommending eager vs deferred providers
- When debugging provider issues, check for double registration (auto-discovery + manual), missing parent calls, and register vs boot timing
- For new packages, recommend Spatie's PackageServiceProvider as the base class; it eliminates most boilerplate
- Auto-discovery is the modern standard; only recommend manual registration for security-sensitive or opt-in packages
- The `when()` method on deferred providers is the correct way to handle provider dependency ordering

## Verification
- [ ] `register()` contains only bindings, no resolved instances or side effects
- [ ] `boot()` handles view registration, routes, events, and commands
- [ ] `parent::register()` and `parent::boot()` are called if overriding
- [ ] Deferred providers set `protected $defer = true` and implement `provides()` method
- [ ] Auto-discovery is configured in `composer.json` `extra.laravel.providers`
- [ ] Config merging happens in `register()`, not `boot()`
- [ ] Provider tests verify bindings are resolvable and boot logic executes
- [ ] No duplicate provider registration (auto-discovery + manual entry)
- [ ] Heavy operations are deferred to lazy evaluation or event listeners
- [ ] Conditional registration guards are applied for environment-specific resources
