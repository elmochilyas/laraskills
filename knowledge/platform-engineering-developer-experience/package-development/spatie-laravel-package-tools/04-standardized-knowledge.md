# Experience Curation: Spatie Laravel Package Tools

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/spatie-laravel-package-tools
- **Maturity:** Mature
- **Related Technologies:** Laravel, Composer, PHP, Service Providers, Orchestra Testbench
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Spatie Laravel Package Tools (`spatie/laravel-package-tools`) is the de facto standard for building Laravel packages. It provides a `PackageServiceProvider` base class that abstracts the repetitive boilerplate of package configuration—registering migrations, views, translations, Blade components, commands, and assets—into a concise, declarative DSL. Instead of manually calling `$this->loadMigrationsFrom()`, `$this->publishes()`, `$this->loadViewsFrom()`, etc., developers define the package structure in a `configurePackage()` method using a fluent builder API. This tool has been adopted by hundreds of packages across the ecosystem and is the recommended starting point for any new Laravel package.

## Core Concepts
- **PackageServiceProvider:** An abstract base class that extends Laravel's `Illuminate\Support\ServiceProvider` and provides the fluent configuration API
- **configurePackage():** The main method developers implement; receives a `Package` object with builder methods for each package concern
- **Package Builder:** A fluent object with methods like `->name()`, `->hasConfigFile()`, `->hasViews()`, `->hasMigration()`, `->hasCommand()` etc.
- **Auto-Discovery Integration:** Works with Laravel's package auto-discovery; packages using Spatie tools automatically register without manual provider registration
- **Declarative over Imperative:** Instead of writing the sequence of registration calls (imperative), you declare what your package has (declarative) and the tool handles the mechanics
- **Boilerplate Eliminator:** The primary value is eliminating 50-100 lines of repetitive service provider code common to most Laravel packages

## When To Use
- Building any new Laravel package that needs migrations, views, config, commands, or translations
- Converting an existing package from manual service provider registration to a cleaner, more maintainable pattern
- Creating packages with install commands, Blade components, or Inertia component support
- Standardizing package development across an organization's internal package ecosystem
- Any package where developer experience and maintainability are priorities

## When NOT To Use
- Very simple packages that have only a single config file and no views, migrations, or commands (direct ServiceProvider is lighter)
- Packages that need to support multiple frameworks (Laravel + Symfony, Lumen); Spatie tools are Laravel-specific
- Packages that require exotic registration scenarios not covered by the builder API (dynamic view namespaces, complex conditional registrations)
- When minimizing dependency count is critical and the package is extremely simple

## Best Practices
- **WHY:** Use the `configurePackage()` DSL consistently rather than mixing builder calls with manual ServiceProvider methods; mixing registration approaches can cause double-registration and confusing behavior
- **WHY:** Always include an install command via `->hasInstallCommand()` for packages with config files or migrations; it simplifies user experience significantly by providing a single `package-name:install` command
- **WHY:** Call `parent::register()` and `parent::boot()` when extending the base class; the parent methods process the package specification and perform all registrations
- **WHY:** Use conditional registration with `->when()` or callbacks to register features only when certain conditions are met (e.g., only register Inertia support if the application uses Inertia)
- **WHY:** Choose a unique package name that serves as the config namespace, view namespace, and migration prefix; changing it later requires breaking changes across all consumers

## Architecture Guidelines
- **Single Provider Pattern:** Most packages have one service provider that handles all registration; Spatie tools encourage and facilitate this pattern
- **Config File Handling:** `->hasConfigFile('my-package')` registers the config file for merging, makes it publishable, and uses `config/my-package.php` in the package directory
- **Migration Registration:** `->hasMigration('create_my_table')` registers migration files from `database/migrations/` and makes them publishable with a timestamp prefix
- **Command Registration:** `->hasCommand(MyCommand::class)` calls `$this->commands([MyCommand::class])` during the boot method
- **View/Blade Component Loading:** `->hasViews()` registers the views directory; `->hasViewComponent('my-prefix', MyComponent::class)` registers Blade components with a namespace prefix
- **Install Command Pattern:** `->hasInstallCommand(MyInstallCommand::class)` automatically registers a `package-name:install` command that publishes config, migrations, and assets
- **Package Naming:** Use your organization prefix as the vendor namespace; package name is used for config namespace and should be unique within the organization

## Performance
- Spatie tools add minimal overhead (microseconds) during provider boot; the builder processes the specification and calls standard Laravel registration methods
- No runtime performance impact after registration; all work is done during boot
- Use lazy registration features when possible; commands and event listeners are deferred until needed, reducing boot time impact
- Config file pruning is unnecessary; published config files with extensive documentation have negligible performance impact
- The tool's overhead is justified by the reduction in boilerplate and improved code maintainability

## Security
- Spatie tools don't introduce security concerns beyond standard service provider security practices
- Be careful with `->hasCommand()` for destructive commands (migrations, clears); consider adding `--force` flags or confirmation prompts
- Published config files may contain `env()` calls; ensure fallback values are safe defaults, not sensitive defaults
- Review all registered commands, routes, and views for potential security implications before publishing
- The install command should not run destructive operations without confirmation

## Common Mistakes

### Not calling parent::boot()/parent::register()
- **Description:** Forgetting to call parent methods when overriding `register()` or `boot()` in the package service provider
- **Consequence:** The base class never processes the package specification; no registrations are performed
- **Better Approach:** Always call `parent::register()` and `parent::boot()` when extending PackageServiceProvider

### Over-parameterizing the package name
- **Description:** Using a generic or changeable package name in the builder configuration
- **Consequence:** The package name is used for config namespace, view namespace, and migration prefix; changing it later requires breaking changes
- **Better Approach:** Choose a stable, unique package name from the start; use the organization prefix for namespacing

### Assuming all features need to be published
- **Description:** Making all config files, views, and migrations publishable when some should remain private
- **Consequence:** Exposing internal configuration or sensitive defaults; confusing consumers with unnecessary publishing options
- **Better Approach:** Only make features publishable that consumers legitimately need to customize

### Ignoring the install command pattern
- **Description:** Not adding an install command even when the package has config, migrations, and/or assets
- **Consequence:** Users must manually discover and publish each resource type; poor onboarding experience
- **Better Approach:** Always include `->hasInstallCommand()` for packages with multiple publishable resources

### Mixing Spatie tools with manual registration calls
- **Description:** Using `->hasConfigFile()` and also manually calling `$this->mergeConfigFrom()` for the same file
- **Consequence:** Double-registration causes confusing behavior; resources may be registered twice
- **Better Approach:** Use one approach consistently; Spatie tools handle all standard registration scenarios

## Anti-Patterns
- **Custom provider base class for every package:** Creating a new abstract provider for each package instead of using Spatie's battle-tested base class
- **Bypassing the DSL for simple registration:** Manually calling `$this->loadViewsFrom()` when `->hasViews()` would suffice; this loses the benefits of the declarative abstraction
- **Ignoring version compatibility:** Not pinning Spatie tools version to match target Laravel versions, causing failures on major upgrades
- **Overriding the specification processing:** Modifying how the PackageServiceProvider processes the specification; this couples to internals that may change

## Examples
- **Spatie/laravel-backup:** Uses `configurePackage()` to register config, commands, views, translations, and migrations in ~20 lines of declarative code
- **Spatie/laravel-permission:** Registers config, migrations, commands, and translations through Spatie tools; the install command handles initial setup
- **Spatie/laravel-medialibrary:** A complex package with migrations, config, views, Blade components, and commands all registered through Spatie tools

## Related Topics
- package-service-provider-patterns (Spatie Package Tools builds on service provider principles)
- package-skeleton-structure (the skeleton includes Spatie Package Tools as a dependency)
- package-auto-discovery (Spatie tools integrate with Laravel's auto-discovery system)
- service-provider-registration-boot (the lifecycle that Spatie tools orchestrate)
- package-testing-orchestra-testbench (Testbench integration for packages using Spatie tools)

## AI Agent Notes
- Spatie Package Tools v1.x is stable with 946+ stars and 469+ commits as of late 2025
- Recommend Spatie tools as the default starting point for any Laravel package discussion
- When a user describes building a Laravel package, suggest Spatie tools first, then evaluate if the package is simple enough to skip them
- For organizational standards, recommend standardizing on Spatie tools for consistency
- The `configurePackage()` DSL covers ~95% of registration scenarios; direct ServiceProvider methods handle the remaining 5%
- Be aware that Spatie tools may need a brief lag after Laravel major version releases to update compatibility

## Verification
- [ ] Package service provider extends `Spatie\LaravelPackageTools\PackageServiceProvider`
- [ ] `configurePackage()` method is implemented with all necessary builder calls
- [ ] `parent::register()` and `parent::boot()` are called if overridden
- [ ] Config files are placed at `config/package-name.php` in the package root
- [ ] Migrations are in `database/migrations/` with unique, package-prefixed filenames
- [ ] Install command is registered for packages with publishable resources
- [ ] Auto-discovery is configured in `composer.json` `extra.laravel`
- [ ] No manual registration calls duplicate builder method functionality
- [ ] Package name is stable and unique within the organization
- [ ] Version constraint for `spatie/laravel-package-tools` is compatible with target Laravel versions
