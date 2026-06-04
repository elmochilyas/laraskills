# Knowledge Unit: Package Service Provider Patterns

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/package-service-provider-patterns
- **Maturity:** Mature
- **Related Technologies:** Laravel, Spatie Package Tools, Composer, Service Container

## Executive Summary

Service providers are the central bootstrapping mechanism for Laravel packages. Every package registers bindings, event listeners, middleware, routes, commands, and configurations through a service provider class. The core pattern separates concerns into two phases: `register()` (binding classes into the container, never using the container resolved instances) and `boot()` (registering views, routes, migrations, and event listeners after all providers are registered). Understanding the provider lifecycle, deferred providers, and auto-discovery is essential for building maintainable, performant Laravel packages.

## Core Concepts

- **Service Provider Lifecycle:** All service providers' `register()` methods run first (in order), then all `boot()` methods run; this ensures all bindings exist before boot-time registration
- **Deferred Providers:** Providers that only register bindings (no boot logic) can be deferred—they're not loaded until one of their bindings is requested, reducing application boot time
- **Auto-Discovery:** Laravel's `composer.json` `extra.laravel` section lets packages register providers and facades automatically without manual entry in `config/app.php`
- **Provider Ordering:** Providers registered via auto-discovery boot in a specific order; the `when()` method on deferred providers declares dependencies that trigger provider loading

## Mental Models

- **Provider as Plugin Manifest:** Think of the provider as the manifest file that tells Laravel what the package provides—bindings, commands, views, assets, translations
- **Register vs Boot as Construction vs Initialization:** `register()` is like a constructor (prepare dependencies, no side effects); `boot()` is like an initializer (set up resources that depend on constructed objects)
- **Provider as Wiring Harness:** The provider connects the package to the Laravel application—it wires package resources to framework events and registration points
- **Singleton Provider Instance:** A provider is instantiated once per request lifecycle; store provider state in properties but be mindful of request-scoped vs application-scoped concerns

## Internal Mechanics

1. **Provider Registration:** Laravel reads `config/app.php` providers array (or `composer.json` extra for auto-discovery) and instantiates each provider class, calling `register()` on each.
2. **Provider Boot:** After all providers are registered, Laravel iterates all registered providers and calls `boot()`. Deferred providers skip this step unless loaded.
3. **Deferred Provider Loading:** When the application resolves a binding that belongs to a deferred provider, Laravel loads the provider, calls `register()` (and `boot()` if applicable), then resolves the binding.
4. **Auto-Discovery Flow:** `composer.json` `extra.laravel.providers` and `extra.laravel.aliases` arrays → `Illuminate\Foundation\PackageManifest` → merges with `config/app.php` providers → cached in `bootstrap/cache/packages.php`.

## Patterns

- **Register-Only Provides Boot Methods:** For packages that only bind classes into the container (e.g., service class, repository, client), implement `register()` only and make the provider deferred by setting `protected $defer = true`.
- **Config Merging Pattern:** In `register()`: `$this->mergeConfigFrom(__DIR__.'/../config/package.php', 'package-name')` merges package defaults with existing application config; calling too late loses user configuration.
- **Conditional Registration Pattern:** Use `if (app()->runningInConsole())` or `if ($this->app->environment('production'))` guards to conditionally register resources based on runtime context.
- **Event-Based Boot Pattern:** Use `$this->app['events']->listen()` in `boot()` to dispatch events rather than performing actions immediately; this decouples the package from the boot order.
- **Singleton Binding Pattern:** `$this->app->singleton(Contract::class, Concrete::class)` in `register()` ensures the package's primary service is resolved once and reused throughout the request lifecycle.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Provider loading | Auto-discovery vs manual registration | Auto-discovery for distribution packages; manual for application-specific providers |
| Deferred vs eager | Deferred for pure binding providers; eager if boot logic needed | Deferred where possible for performance |
| Multiple providers vs single | Single provider for simple packages; split for complex concerns | One provider per package; split only if functional separation is warranted |
| Base class | Spatie PackageServiceProvider vs Laravel's ServiceProvider | Spatie for most packages; Laravel base for deferred-only or exotic needs |

## Tradeoffs

- **Deferred Provider Performance vs Complexity:** Deferred providers reduce boot time (fewer classes loaded per request) but add complexity: deferred providers cannot have `boot()` logic, and their `register()` can't depend on non-deferred bindings.
- **Convention vs Explicit Registration:** Auto-discovery is convenient but reduces visibility into what providers are registered. For packages with significant functionality, manual registration ensures developers know the package is present.
- **Conditional Registration vs Consistency:** Conditionally registering features based on environment or configuration provides flexibility but may create confusing inconsistencies between environments.
- **Provider Inheritance vs Composition:** Extending Spatie's PackageServiceProvider (inheritance) is simpler but limits flexibility. Composing utilities in a custom provider (composition) is more flexible but requires more code.

## Performance Considerations

- **Boot Time:** Every eager-loaded provider adds to boot time. Deferred providers should be used for any package that registers bindings without requiring boot-time registration.
- **Package Manifest Caching:** `php artisan optimize` caches the package manifest; in production, deferred providers are resolved from cache without filesystem scanning.
- **Service Container Resolutions:** Frequent `$this->app->make()` calls in `boot()` can be optimized by storing resolved instances in provider properties.
- **Configuration Publishing:** Publishing config files doesn't affect runtime performance; it only affects the build/deploy process. Published config files are read from the application's config directory, which is already cached.

## Production Considerations

- **Provider Testing:** Test that providers register correctly: test that bindings are resolvable, that deferred providers load on correct binding resolution, and that boot logic executes without errors.
- **Provider Compatibility:** Test providers across supported Laravel versions; API changes to `\Illuminate\Support\ServiceProvider` between versions can break package providers.
- **Caching and Optimization:** `php artisan optimize --force` in deployment scripts should re-cache the package manifest; without caching, auto-discovered packages are loaded from filesystem scans on each request.
- **Provider Dependencies:** If a package provider depends on another package's bindings, document the dependency order or use deferred provider `when()` method to ensure correct loading sequence.

## Common Mistakes

- **Container resolution in register():** Calling `$this->app->make()` or injecting resolved instances in `register()` when not all services are bound yet; use `register()` only for bindings
- **Missing parent::register()/boot():** When extending a base provider class, forgetting to call parent methods breaks the parent's registration logic
- **Over-registering providers:** Registering the same provider multiple times (auto-discovery + manual entry) causes duplicate execution; check config to avoid double registration
- **Non-deferred providers for simple bindings:** Creating eager-loaded providers for packages that only register bindings wastes boot time; always use deferred for binding-only packages
- **Heavy boot() logic:** Running expensive operations (API calls, file system operations, database queries) in `boot()` increases application boot time and can cause errors if services aren't ready

## Failure Modes

- **Provider Boot Order Race:** Package A's `boot()` depends on Package B's bindings, but B is loaded after A. Mitigate: use deferred provider's `when()` or document dependency requirements.
- **Auto-Discovery Cache Stale:** After adding a new package to `composer.json`, the package manifest cache doesn't update until `composer dump-autoload` or `php artisan optimize` runs. Mitigate: always run `composer dump-autoload` post-install.
- **Provider Not Registered:** Package providers are correctly implemented but not registered in `config/app.php` or auto-discovery. Mitigate: verify `composer.json` extra.laravel configuration.
- **Version Mismatch:** A package requires a newer ServiceProvider API (e.g., `loadViewsFrom` signature change) but the application runs an older Laravel version. Mitigate: use version constraints in composer.json and test across supported versions.

## Ecosystem Usage

- **Laravel Framework Providers:** Laravel itself uses 20+ built-in service providers (CacheServiceProvider, DatabaseServiceProvider, EventServiceProvider, etc.) as the model for provider patterns
- **Spatie Package Tools:** Encapsulates provider patterns into a reusable abstraction; the `PackageServiceProvider` is both a teaching tool and productivity tool
- **Common Package Providers:** `barryvdh/laravel-debugbar`, `laravel/telescope`, `laravel/sanctum`, `laravel/horizon` all use service provider patterns with varying complexity
- **Internal Package Usage:** Organizations should enforce a consistent provider pattern across all internal packages for maintainability and developer familiarity

## Related Knowledge Units

- spatie-laravel-package-tools
- service-provider-registration-boot
- package-auto-discovery
- package-skeleton-structure
- config-file-merging-publishing

## Research Notes

- The register/boot separation is inherited from Laravel's architecture and mirrors similar patterns in other frameworks (Spring's BeanPostProcessors, ASP.NET's Startup.ConfigureServices vs Configure)
- Auto-discovery (introduced in Laravel 5.5) dramatically simplified package configuration and is now the standard approach
- Deferred providers are underutilized; many packages that only provide binding registrations stay eager-loaded, unnecessarily increasing boot time
- The trend in 2025 is toward auto-discovery with explicit opt-out for security-sensitive or resource-intensive packages
