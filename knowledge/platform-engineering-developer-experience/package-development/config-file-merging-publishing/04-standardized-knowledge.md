# Experience Curation: Config File Merging & Publishing

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/config-file-merging-publishing
- **Maturity:** Mature
- **Related Technologies:** Laravel, Spatie Package Tools, PHP, Composer
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Package configuration in Laravel follows a two-phase approach: configuration merging and configuration publishing. During merging (`mergeConfigFrom()`), the package's default configuration is merged with the application's existing configuration at boot time, ensuring package consumers can access config values without publishing the file. Publishing (`php artisan vendor:publish`) copies the package's config file to the application's `config/` directory, allowing the consumer to override defaults. The merging happens first (so defaults are always available), publishing happens optionally (for customization). Understanding the interaction between merging and publishing prevents common issues like missing config values or unexpected default overrides.

## Core Concepts
- **Config Namespace:** Each package registers its configuration under a unique namespace (e.g., `config('package-name.key')`); the namespace matches the config filename (e.g., `package-name.php`)
- **mergeConfigFrom():** Called in `register()`, this method deep-merges the package's default config array with any existing config for the same namespace, ensuring package defaults are available without publishing
- **Publishing:** `$this->publishes()` declares that the package config can be copied to the application's config directory; `php artisan vendor:publish` executes the copy
- **Tagged Publishing:** Config publishing is tagged (e.g., `--tag=config`) to selectively publish only configuration files, not migrations or views
- **Config as a Layer Cake:** Application config is the top layer, published package config is the middle layer, merged defaults are the bottom layer; each layer overrides the one below
- **Namespace as a Compartment:** Each package config namespace is isolated; `config('package-a.prefix')` and `config('package-b.prefix')` live independently without collision

## When To Use
- Any Laravel package that has configurable options; always provide sensible defaults that work without publishing
- Packages with environment-specific behavior that requires `env()` calls in published config files
- Packages where consumers need visibility into available configuration options (publishing serves as documentation)
- Complex packages with 5+ configuration options that benefit from organized, documented configuration

## When NOT To Use
- Packages with no configurable options (fully automatic behavior); skip config entirely
- Packages with a single boolean or simple flag that can be controlled via environment variable checks in code
- Internal-only packages where configuration is hardcoded and never overridden by consumers
- Packages where configuration is managed through a database model rather than config files

## Best Practices
- **WHY:** Always call `mergeConfigFrom()` in `register()`, never `boot()`; config merged in `boot()` is unavailable to other providers during their `boot()` phase
- **WHY:** Use tagged publishing (`--tag=config`) so consumers can publish config files independently from migrations, views, and assets
- **WHY:** Provide sensible defaults for every configuration option; the package should work without publishing the config file
- **WHY:** Use `env()` calls in published config files only, not in unpublished default config files; `env()` in unpublished config may produce unexpected results when config is cached
- **WHY:** Use a unique config namespace prefixed with the package name to prevent collisions with other packages; `config('my-package.driver')` not `config('driver')`

## Architecture Guidelines
- **Config File Location:** Place at `config/package-name.php` in the package root (Laravel convention); automatically discovered by Spatie Package Tools' `hasConfigFile()`
- **Config Key Style:** Use snake_case keys for consistency with Laravel core conventions
- **Config Key Hierarchy:** Use dot-notation hierarchy for related options (`config('package.cache.ttl')`, `config('package.cache.driver')`) to group configuration logically
- **env() Usage:** In published config only; never use `env()` directly in business logic—always resolve through `config()` with a fallback
- **Config Defaults:** Always provide sensible defaults; config should work without publishing. Unknown options should have safe defaults
- **Namespace Choice:** Single file for packages with <20 options; multiple files for complex packages with separable configuration domains
- **Spatie Package Tools:** Use `->hasConfigFile('package-name')` to configure merging, publishing, and tagging with a single method call

## Performance
- `mergeConfigFrom()` is an array merge operation with negligible cost (microseconds per package); not a performance concern even with 50+ packages
- Reading published config is a PHP `include` operation on each request in development; in production, config caching reads all config at once
- Extremely large config files (>100KB) add to config cache generation time and in-memory config store size; keep config files focused on essential options
- Each `env()` call in an unpublished config file reads the environment on each request (uncached); once published and `config:cache` is run, `env()` returns the cached value
- Production deployments should always run `php artisan config:cache` to optimize config access

## Security
- Never put secrets (API keys, passwords, tokens) in config file defaults; use `env()` calls with fallback to retrieve secrets from environment
- Document required environment variables in README; don't expose them in default config values
- Published config files should not contain sensitive defaults that could be accidentally committed to version control
- Sensitive configuration options should use `env()` with no fallback (or a clearly-marked placeholder) to force explicit configuration
- Config files that are not meant for consumer modification should not be publishable; mark them as internal with `@internal` docblocks

## Common Mistakes

### Calling mergeConfigFrom() in boot() instead of register()
- **Description:** Merging configuration in the `boot()` method of the service provider
- **Consequence:** Config merged in `boot()` is not available to other providers' `boot()` methods; configuration values may be missing when other packages or application code tries to read them during boot
- **Better Approach:** Always call `mergeConfigFrom()` in `register()`, the first phase of provider lifecycle

### Not tagging config publishing
- **Description:** Publishing config without specifying a tag in the `publishes()` call
- **Consequence:** Consumers must run `vendor:publish` without `--tag` and publish everything (configs + migrations + views) at once; no granular control
- **Better Approach:** Always use tagged publishing: `$this->publishes([...], 'package-name-config')`

### Using env() in unpublished config
- **Description:** Using `env('KEY', 'default')` calls in the package's default config file that lives in the package source code
- **Consequence:** `env()` calls are evaluated during merge, which happens before config is cached; when `config:cache` runs, the env values are resolved at cache-build time and become stale
- **Better Approach:** Use `env()` calls only in the published copy of the config file; the unpublished default should use plain PHP values or `config()` calls

### Config key collisions
- **Description:** Two packages using the same config namespace or top-level key
- **Consequence:** One package's configuration overwrites the other's; behavior becomes unpredictable and environment-dependent based on boot order
- **Better Approach:** Always namespace config with the package name; `config('my-package.driver')` not `config('driver')`

### Forgetting to publish after updating package
- **Description:** Package adds new config options in a new version; published config file doesn't include them
- **Consequence:** Consumer's published config is stale; new options aren't visible and default values from merge may surprise the consumer
- **Better Approach:** Rely on `mergeConfigFrom()` to add new defaults over the published file; document new config options in release notes

## Anti-Patterns
- **Config as documentation:** Using the config file as the sole documentation for all package options without README or inline comments; published config files should be self-documenting
- **No defaults, all options required:** Creating config options with no defaults that must all be set before the package works; this creates a poor onboarding experience
- **Publishing everything:** Making every config file, migration, and view publishable when many should remain internal implementation details
- **env() in business logic:** Accessing `env('KEY')` directly in controllers or services instead of going through `config('package.key')`; this bypasses config caching and merge behavior
- **Deeply nested config arrays:** Using 4-5 levels of nested arrays in config; hard to override individual values with `array_replace_recursive` merge behavior

## Examples
- **Laravel Sanctum:** Uses `mergeConfigFrom()` in `register()` with tagged publishing (`--tag=sanctum-config`); config file documents all options with comments
- **Spatie/laravel-permission:** Uses `hasConfigFile()` from Spatie Package Tools; config file includes all permission-related options with documentation
- **barryvdh/laravel-debugbar:** Uses tagged publishing for config and assets separately; config file has extensive `env()` calls for environment-specific toggling

## Related Topics
- package-service-provider-patterns (config merging must happen in the service provider's register method)
- spatie-laravel-package-tools (provides `hasConfigFile()` as the standard config abstraction)
- service-provider-registration-boot (the lifecycle timing that determines when merge vs publish happens)
- environment-file-management (env() calls interact with .env file management and config caching)
- laravel-configuration-caching (config:cache behavior affects merge/publish dynamics in production)

## AI Agent Notes
- When a user's package config isn't working, the first thing to check is whether `mergeConfigFrom()` is in `register()` or `boot()`
- The `env()` staleness issue with config caching is one of the most common production Laravel bugs; always warn users about it
- Spatie Package Tools' `hasConfigFile()` handles merging and publishing correctly; recommend it over manual implementation
- For organizations, standardize config file structure (key naming, documentation style, env() placement) across all internal packages
- When migrating from manual to Spatie tools config, ensure no double-registration occurs

## Verification
- [ ] `mergeConfigFrom()` is called in `register()`, not `boot()`
- [ ] Config publishing uses a specific tag (e.g., `--tag=package-name-config`)
- [ ] Config file has sensible defaults for all options; package works without publishing
- [ ] `env()` calls are only in published config files, not in unpublished defaults
- [ ] Config namespace is unique and prefixed with package name
- [ ] Published config file path matches the config namespace (`config/package-name.php`)
- [ ] Config file has inline comments documenting each option
- [ ] Secrets and credentials use `env()` with no default or a clearly-marked placeholder
- [ ] `config:cache` and `config:clear` behavior is documented for consumers
- [ ] New config options in package updates are documented in release notes
