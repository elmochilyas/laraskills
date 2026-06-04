# Knowledge Unit: Config File Merging & Publishing

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/config-file-merging-publishing
- **Maturity:** Mature
- **Related Technologies:** Laravel, Spatie Package Tools, PHP, Composer

## Executive Summary

Package configuration in Laravel follows a two-phase approach: configuration merging and configuration publishing. During merging (`mergeConfigFrom()`), the package's default configuration is merged with the application's existing configuration at boot time, ensuring package consumers can access config values without publishing the file. Publishing (`php artisan vendor:publish`) copies the package's config file to the application's `config/` directory, allowing the consumer to override defaults. The merging happens first (so defaults are always available), publishing happens optionally (for customization). Understanding the interaction between merging and publishing prevents common issues like missing config values or unexpected default overrides.

## Core Concepts

- **Config Namespace:** Each package registers its configuration under a unique namespace (e.g., `config('package-name.key')`); the namespace matches the config filename (e.g., `package-name.php`)
- **mergeConfigFrom():** Called in `register()`, this method deep-merges the package's default config array with any existing config for the same namespace, ensuring package defaults are available without publishing
- **Publishing:** `$this->publishes()` declares that the package config can be copied to the application's config directory; `php artisan vendor:publish` executes the copy
- **Tagged Publishing:** Config publishing is tagged (e.g., `--tag=config`) to selectively publish only configuration files, not migrations or views

## Mental Models

- **Merging as Default, Publishing as Override:** Merging provides sensible defaults that work immediately; publishing gives consumers explicit control to override specific values
- **Config as a Layer Cake:** Application config is the top layer, published package config is the middle layer, merged defaults are the bottom layer; each layer overrides the one below
- **Namespace as a Compartment:** Each package config namespace is isolated; `config('package-a.prefix')` and `config('package-b.prefix')` live independently without collision
- **Merging Timing Matters:** `mergeConfigFrom()` in `register()` means the merged config is available to all providers during `boot()` and throughout the request lifecycle

## Internal Mechanics

1. **Config Merging Flow:** `mergeConfigFrom($path, $namespace)` reads the default config file → checks if `config($namespace)` already has values (from a previously published file) → deep-merges the arrays (published values override defaults, but keys only in defaults are preserved) → stores the merged result back in `config($namespace)`.
2. **Config Access Resolution:** `config('package-name.key')` uses Laravel's config repository which reads from the merged config values; the config is a simple array store, resolved during the config access, no lazy loading.
3. **Publishing Mechanism:** `$this->publishes([$configFile => config_path('package-name.php')], 'config')` registers the source-to-destination mapping; `vendor:publish` copies the file, creating `config/package-name.php` in the application.
4. **Environment Configuration:** Published config values can be overridden by environment variables using `env()` calls in the config file; this is the standard Laravel pattern for environment-specific configuration.

## Patterns

- **Config File as a Manifest:** The config file defines all configurable options with comments explaining each option; it's the primary documentation surface for the package's configuration.
- **env() in Published Config:** Use `env('PACKAGE_KEY', 'default')` in the published config to allow environment-specific overrides; this only works when the config is published because `vendor:publish` copies the raw PHP file.
- **Config Key Hierarchy:** Use dot-notation hierarchy for related options (`config('package.cache.ttl')`, `config('package.cache.driver')`) to group configuration logically.
- **Tagged Publishing for Granularity:** Use separate tags for config, migrations, views, and assets so consumers can publish selectively: `php artisan vendor:publish --tag=package-name-config`.
- **Spatie Package Tools Config:** Use `->hasConfigFile('package-name')` to configure merging, publishing, and tagging with a single method call; the file is expected at `config/package-name.php` in the package root.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Config file location | Package root `config/` vs nested | `config/package-name.php` at package root (Laravel convention) |
| Config key style | snake_case vs camelCase vs kebab-case | snake_case for consistency with Laravel core |
| env() usage | In config file vs in application code | In published config file only; never use env() directly in business logic |
| Config defaults | Sensible defaults vs empty/no defaults | Always provide sensible defaults; config should work without publishing |
| Config namespace | Single file vs multiple files | Single file for packages with <20 options; multiple files for complex packages |

## Tradeoffs

- **Merging Performance vs Clarity:** `mergeConfigFrom()` happens on every request in development (cached in production). For packages with large config files, consider splitting rarely-changed defaults into a separate config file.
- **Published vs Unpublished Config:** Unpublished config is simpler (no publishing step needed) but gives consumers no visibility into available options. Published config provides discoverability but adds a setup step.
- **Deep Merge Behavior:** `mergeConfigFrom()` uses `array_replace_recursive`, which may produce unexpected results for nested arrays. For config with deeply nested values, document the merge behavior.
- **Config Cache Implications:** When `php artisan config:cache` runs, all published config files are cached. Package merging with `mergeConfigFrom()` still works (it merges before caching). However, calls to `env()` in published config files become stale (cached value) until the cache is cleared.

## Performance Considerations

- **Merge Operation Cost:** `mergeConfigFrom()` is an array merge operation, negligible cost (microseconds per package). Not a performance concern even with 50+ packages.
- **Published Config File Reads:** Reading published config is a PHP `include` operation on each request (in development); in production, config caching reads all config at once.
- **Config File Size:** Extremely large config files (>100KB) add to config cache generation time and in-memory config store size; keep config files focused on essential options.
- **env() Calls in Config:** Each `env()` call in an unpublished config file reads the environment on each request (uncached). Once published and `config:cache` is run, `env()` returns the cached value, which may be unexpected.

## Production Considerations

- **Config Caching:** In production, always run `php artisan config:cache`; this caches all merged and published config values. Package config still works correctly because merging happens before caching.
- **Environment Overrides:** For production deployment, use `.env` file values to override published config options; the `env()` calls in the published config read from the `.env` file (or cached config).
- **Config Validation:** For config options that accept a limited set of values, validate at boot time or on first access; invalid config values cause confusing runtime errors.
- **Sensitive Configuration:** Never put secrets (API keys, passwords, tokens) in config file defaults; use `env()` calls with fallback to retrieve secrets from environment, and document required environment variables in README.

## Common Mistakes

- **Calling mergeConfigFrom() in boot() instead of register():** Config merged in `boot()` is not available to other providers' `boot()` methods; always merge in `register()`
- **Not tagging config publishing:** Config published without tags requires consumers to run `vendor:publish` without `--tag` and publish everything (configs + migrations + views) at once
- **Using env() in unpublished config:** `env()` calls in the package's default config file read environment variables during merge, which may produce unexpected results when config is cached
- **Config key collisions:** Two packages using the same config namespace (e.g., both use `config('database')`) create collision; always namespace with package name
- **Forgetting to publish after updating package:** Updated package config defaults don't overwrite published config files; consumers must manually diff their published config against the updated default

## Failure Modes

- **Config Not Published After Update:** Package adds new config options; published config file doesn't include them because it was copied from an older version. Mitigate: use `mergeConfigFrom()` so new defaults are merged over the published file, adding any missing keys.
- **Config Cache Staleness:** Changing `.env` values doesn't affect config until cache is cleared. Mitigate: document that `php artisan config:clear` is needed after `.env` changes when config cache is enabled.
- **env() Staleness in Cached Config:** `env()` calls are evaluated once during config cache generation and never re-evaluated. Mitigate: for values that change at runtime, use `config()` in business logic rather than `env()` directly.
- **Merge Behavior Surprise:** `array_replace_recursive` replaces entire arrays rather than merging keys; nested config arrays may behave unexpectedly. Mitigate: document the merge behavior for nested config and test edge cases.

## Ecosystem Usage

- **Laravel Core Packages:** Sanctum, Horizon, Telescope, and Pulse all follow the merge/publish pattern with tagged publishing
- **Spatie Packages:** All Spatie packages use Spatie Package Tools' `hasConfigFile()` for consistent config merging and publishing
- **Barryvdh Packages:** IDE-Helper and Debugbar use standard merge/publish pattern with separate tags for config and assets
- **Third-Party Packages:** The vast majority of Laravel packages implement config merging + publishing as standard practice

## Related Knowledge Units

- package-service-provider-patterns
- spatie-laravel-package-tools
- service-provider-registration-boot
- environment-file-management

## Research Notes

- The config merging/publishing pattern has been stable since Laravel 5.0; it's one of the most mature and well-understood aspects of package development
- The Spatie Package Tools abstraction (`hasConfigFile()`) reduces config setup from 5-10 lines to 1 line; this abstraction is now considered the standard approach
- A common pain point is the interaction between `env()` calls and config caching; Laravel 11+ documentation recommends against using `env()` directly in application code
- Config defaults as the sole documentation of configurable options is a common pattern; well-commented config files serve as both configuration and documentation
