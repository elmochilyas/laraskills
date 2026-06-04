# Knowledge Unit: Spatie Laravel Package Tools

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/spatie-laravel-package-tools
- **Maturity:** Mature
- **Related Technologies:** Laravel, Composer, PHP, Service Providers, Orchestra Testbench

## Executive Summary

Spatie Laravel Package Tools (`spatie/laravel-package-tools`) is the de facto standard for building Laravel packages. It provides a `PackageServiceProvider` base class that abstracts the repetitive boilerplate of package configuration—registering migrations, views, translations, Blade components, commands, and assets—into a concise, declarative DSL. Instead of manually calling `$this->loadMigrationsFrom()`, `$this->publishes()`, `$this->loadViewsFrom()`, etc., developers define the package structure in a `configurePackage()` method using a fluent builder API. This tool has been adopted by hundreds of packages across the ecosystem and is the recommended starting point for any new Laravel package.

## Core Concepts

- **PackageServiceProvider:** An abstract base class that extends Laravel's `Illuminate\Support\ServiceProvider` and provides the fluent configuration API
- **configurePackage():** The main method developers implement; receives a `Package` object with builder methods for each package concern
- **Package Builder:** A fluent object with methods like `->name()`, `->hasConfigFile()`, `->hasViews()`, `->hasMigration()`, `->hasCommand()` etc.
- **Auto-Discovery Integration:** Works with Laravel's package auto-discovery; packages using Spatie tools automatically register without manual provider registration

## Mental Models

- **Declarative over Imperative:** Instead of writing the sequence of registration calls (imperative), you declare what your package has (declarative) and the tool handles the mechanics
- **The Package as a Specification:** The `configurePackage()` method is a specification of what the package contains; the framework interprets the specification and performs all necessary registration
- **Convention over Configuration:** The tool follows Laravel's directory conventions (database/migrations/, resources/views/, config/, etc.) and handles discovery automatically
- **Boilerplate Eliminator:** The primary value is eliminating 50-100 lines of repetitive service provider code common to most Laravel packages

## Internal Mechanics

1. **Package Registration Flow:** When Laravel boots the package's service provider (which extends `PackageServiceProvider`), the base class calls `configurePackage()`, builds the package specification, then iterates over the specification and calls the appropriate Laravel registration methods (`loadMigrationsFrom`, `loadViewsFrom`, `publishes`, etc.).
2. **Config File Handling:** `->hasConfigFile('my-package')` tells the tool to: register the config file for merging (`$this->mergeConfigFrom()`), make it publishable (`$this->publishes()`), and use `config/my-package.php` in the package directory.
3. **Migration Registration:** `->hasMigration('create_my_table')` registers migration files from `database/migrations/` and makes them publishable to the application's `database/migrations/` directory with a timestamp prefix.
4. **Command Registration:** `->hasCommand(MyCommand::class)` calls `$this->commands([MyCommand::class])` during the boot method, making the Artisan command available.
5. **View/Blade Component Loading:** `->hasViews()` registers the views directory; `->hasViewComponent('my-prefix', MyComponent::class)` registers Blade components with a namespace prefix.

## Patterns

- **Single Provider Pattern:** Most packages have one service provider that handles all registration; Spatie tools encourage and facilitate this pattern rather than splitting across multiple providers.
- **Conditional Registration:** Use the `->when()` method or callbacks to conditionally register features only when certain conditions are met (e.g., only register Inertia support if the application uses Inertia).
- **Install Command Pattern:** `->hasInstallCommand(MyInstallCommand::class)` automatically registers a `package-name:install` command that publishes config, migrations, and assets with a single Artisan command.
- **Shared Method Commands:** Use `->hasCommand()` with `\Spatie\LaravelPackageTools\Commands\InstallCommand::class` for standardized installation commands that publish configs, migrations, and optionally run migrations.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Provider base class | Spatie PackageServiceProvider vs custom base | Spatie for most packages; custom only if exotic registration needed |
| Feature registration | Builder methods vs direct ServiceProvider calls | Builder methods for consistency; direct calls for edge cases not covered by the builder |
| Package name | Vendor prefix (spatie/package-name) vs generic | Use your organization prefix; package name is used for config namespace |
| Migration naming | Named migrations vs auto-discovery | Named migrations (hasMigration) for selective publishing; auto-discovery for mandatory migrations |

## Tradeoffs

- **Abstraction vs Control:** Spatie tools abstract common patterns but may not support unusual registration scenarios (dynamic view namespaces, conditional registrations based on runtime state). Use direct service provider methods for edge cases within the same package.
- **Dependency Weight:** Adding `spatie/laravel-package-tools` as a dependency increases the package's dependency count. For very simple packages (single config file, no views/migrations), direct service provider implementation may be lighter.
- **Framework Coupling:** The tool relies on Laravel-specific abstractions. For packages that support multiple frameworks (Laravel + Symfony, Lumen), a custom abstraction layer may be necessary.
- **Version Compatibility:** Spatie tools follow Laravel's support policy; ensure your package's required version is compatible with target Laravel versions. Major Laravel version bumps may require waiting for Spatie tool updates.

## Performance Considerations

- **Boot Time Impact:** Spatie tools add minimal overhead (microseconds) during provider boot; the builder processes the specification and calls standard Laravel registration methods. No runtime performance impact after registration.
- **Lazy Registration:** Use "lazy" registration features when possible; commands and event listeners are deferred until needed, reducing boot time impact.
- **Config File Pruning:** Published config files should include minimal comments; extensive documentation in published config files increases file size but has negligible performance impact.

## Production Considerations

- **Package Testing:** Packages using Spatie tools should test that `configurePackage()` is called correctly and that all registered resources are accessible. Use Orchestra Testbench for integration tests.
- **Semantic Versioning:** Follow semantic versioning for the package; breaking changes to `configurePackage()` API require a major version bump. Spatie tools v1.x is stable with backwards compatibility guarantees.
- **Publishing Conflicts:** If multiple packages use the same config/view/migration names, publishing can conflict. Use unique package name prefixes to prevent collisions.
- **Upgrade Path:** When upgrading Spatie tools between major versions, review the upgrade guide for API changes to `PackageServiceProvider` methods.

## Common Mistakes

- **Not calling parent::boot()/parent::register():** The base class handles registration in these methods; forgetting to call parent breaks the registration chain
- **Over-parameterizing the package name:** The package name is used for multiple purposes (config namespace, view namespace, migration prefix); changing it later requires breaking changes
- **Assuming all features need to be published:** Not all config files need publishing; sensitive configuration should remain private and not publishable
- **Ignoring the install command pattern:** The `hasInstallCommand` pattern simplifies user experience significantly; always include an install command for packages with config/migrations
- **Mixing Spatie tools with manual registration calls:** Double-registering resources (once via builder, once manually) can cause errors; use one approach consistently

## Failure Modes

- **Registration Order Dependency:** Some package resources depend on others (e.g., config must be registered before commands that use it). Spatie tools process declarations sequentially; ensure dependencies are declared in the correct order.
- **View Namespace Collisions:** Multiple packages using the same view namespace cause conflicts. Always use the package name as the view namespace; Spatie tools use `package-name` as the default.
- **Migration File Conflicts:** If two packages publish migrations with the same filename, Laravel's migration system may attempt to run both. Use unique migration file names prefixed with the package name.
- **Composer Autoloading Issues:** Improper PSR-4 autoloading configuration in the package's composer.json prevents Spatie tools from locating resource files. Verify autoloading paths match actual directory structure.

## Ecosystem Usage

- **Spatie's Own Packages:** Over 200 Spatie Laravel packages use this tool; it's battle-tested across the entire Spatie ecosystem
- **Community Adoption:** Packages like `barryvdh/laravel-debugbar`, `laravel/pulse`, and thousands of community packages use Spatie tools
- **Package Skeleton:** `spatie/package-skeleton-laravel` provides the canonical starter template including Spatie tools configuration
- **Orchestra Testbench:** The standard testing framework for Laravel packages; integrates naturally with Spatie tools for test setup

## Related Knowledge Units

- package-service-provider-patterns
- package-skeleton-structure
- package-auto-discovery
- service-provider-registration-boot
- package-testing-orchestra-testbench

## Research Notes

- Spatie Laravel Package Tools is at version 1.93.x as of late 2025 with 946+ stars and 469+ commits; very stable API
- The tool's design philosophy mirrors Laravel's own conventions—convention over configuration, fluent builders, and sensible defaults
- Organizations building internal packages should standardize on Spatie tools for consistency and reduced maintenance burden
- The tool has expanded beyond basic registration to include Inertia component support, shared directories, and more sophisticated migration handling in recent versions
