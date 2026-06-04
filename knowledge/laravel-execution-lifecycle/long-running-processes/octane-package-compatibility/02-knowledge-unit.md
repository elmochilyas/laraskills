# Octane Package Compatibility

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Executive Summary
Not all Laravel packages are compatible with Octane's long-running process model. Packages that rely on per-request state stored in singletons, static properties, or global variables will break silently. Evaluating a package for Octane compatibility requires examining its service provider registrations, static property usage, and dependency on PHP superglobals. This KU provides a systematic evaluation framework, identifies common incompatible patterns, and catalogs the compatibility status of major Laravel packages.

## Core Concepts
- **Compatibility Spectrum:** Packages fall on a spectrum: **Fully Compatible** (no changes needed), **Compatible with Hooks** (needs `RequestTerminated` listener or tick), **Partially Compatible** (some features work, some break), **Incompatible** (requires code changes to the package).
- **Common Incompatible Patterns:**
  - Singleton registration with per-request mutable state
  - Static property caching of request-specific data
  - Direct use of `$_GET`, `$_POST`, `$_REQUEST` superglobals
  - Assumption that `__destruct()` runs at request end
  - Use of `register_shutdown_function()` for cleanup
  - Filesystem cache that assumes unique process per request
- **Compatibility Responsibility:** The application developer is responsible for ensuring all installed packages are Octane-compatible. Package authors are increasingly adding Octane support, but it is not universal.
- **Shim Layer:** An application-side compatibility layer can wrap incompatible packages. Examples: intercepting static registrations, wrapping in scoped bindings, adding `RequestTerminated` cleanup listeners.

## Mental Models
- **"The Thunderdome Test":** Every package enters the Octane arena. Some survive (compatible), some get patched up (hooks needed), some are carried out (incompatible).
- **"The Package X-Ray":** Look through the package's service provider and see how it binds into the container. Is it using `singleton()`? Is it storing data on static properties? These are the bones of compatibility.
- **"The Adapter Pattern":** An incompatible package can sometimes be made compatible by wrapping it in an adapter layer that resets state between requests, without modifying the package source.

## Internal Mechanics
1. **Package Provider Scan:** Examine the package's service provider for `singleton()`, `scoped()`, `bind()`, and `instance()` calls. Check if the provider implements `OctaneSandbox`.
2. **Static Property Scan:** Search the package for `static` properties and methods that read/write them. Look for `$macros`, `$customDirectives`, `$resolvedCache`, `$instances` — common accumulation patterns.
3. **Global State Access Scan:** Search for `$_SERVER`, `$_ENV`, `$_REQUEST` superglobals, and `register_shutdown_function()`, `set_error_handler()`, `set_exception_handler()` calls.
4. **Runtime Behavior Test:** Deploy the package in a staging Octane environment. Send two requests with different parameters. Verify that the second response is not contaminated by the first. Assert key behaviors (auth, locale, timezone) are isolated.
5. **Documentation Check:** Search the package docs for "Octane", "long-running", "persistent", "singleton" keywords. Author's awareness of Octane is a strong indicator of compatibility.

## Patterns
- **Registry Reset Listener:** If a package uses static registries, add a `RequestTerminated` listener that calls the package's reset method or clears the static array via reflection.
- **Scoped Wrapper Binding:** If a package registers a mutable singleton, override the binding in the application's `AppServiceProvider`: `$this->app->scoped(PackageService::class, fn() => new PackageService())`. This shadows the package's singleton.
- **OctaneSandbox Provider:** Create a new provider implementing `OctaneSandbox` that re-registers the package's bindings on every sandbox creation. This ensures per-request freshness without modifying the package.
- **Package Blacklist Check:** Maintain a list of known-incompatible package versions. Add a CI step that blocks install of these versions and suggests alternatives.
- **Feature Flag Guard:** If only some features of a package are incompatible, disable those features under Octane: `if (app()->bound(Octane::class)) { $package->disableFeature('x'); }`.

## Architectural Decisions
| Decision | Rationale |
|---|---|
| Application-side compatibility is the default | Package authors cannot be expected to support all runtimes |
| Static property analysis is mandatory | Even if a package uses `bind()` (transient), static properties can leak |
| Shims over forks | Forking packages creates maintenance burden; shims are upgrade-safe |
| Test-based verification | Static analysis cannot detect all runtime behavior; actual request isolation testing catches the rest |

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Application shims preserve package upgradeability | Shims add complexity and maintenance cost | Each shim must be tested with each package version update |
| Static analysis detects most issues | False negatives from dynamic registration | Runtime testing is still required |
| Feature flag gating reduces risk | Disabled features may surprise users | Must document disabled features prominently |
| Override bindings via shadow provider | May conflict if package updates binding type | CI must detect binding registration changes in updated packages |

## Performance Considerations
- Shim layers add ~0.5-3ms per request depending on complexity. Monitor the overhead of `RequestTerminated` listeners that perform package state resets.
- Reflection-based static property clearing is slower than direct method calls. Cache the reflection handles on first use.
- Overriding a package's singleton with scoped adds normal scoped overhead (~1ms per request).
- Avoid adding heavy cleanup in `RequestTerminated` for packages used in every request. Defer cleanup that only matters for specific feature sets.

## Production Considerations
- Run a **compatibility test suite** as part of deployment: two sequential requests that exercise each package feature, asserting response differences and memory stability.
- Log package compatibility warnings at boot time. `OctaneServiceProvider` can detect known-incompatible packages and emit warnings without blocking startup.
- Pin package versions after validation. A minor version update can introduce new singleton bindings. Use `composer.lock` diffs to detect changed providers.
- Create a **package compatibility matrix** for the project. An internal wiki page listing each package, its version, compatibility status, and notes on required shims.
- For critical incompatible packages, consider alternatives. E.g., if `spatie/laravel-newsletter` is incompatible, evaluate `mailcoach` or a custom solution.

## Common Mistakes
- Assuming "it works in PHP-FPM, so it works in Octane." PHP-FPM's per-request process isolation masks all state accumulation and leakage.
- Testing compatibility with a single request. Octane bugs only manifest on the second, third, or thousandth request. Test with sequences of ≥100 requests.
- Patching the vendor directory to "fix" a package. Vendor changes are overwritten on `composer update`. Use shims, overrides, or real package forks.
- Confusing "no errors" with "compatible." A package can produce wrong results without throwing any exceptions. Compare response outputs across sequential requests.
- Ignoring indirect dependencies. `composer show --tree` reveals dependencies. A package's dependency may be the one leaking state, not the package itself.

## Failure Modes
- **Silent Incompatibility:** A package appears to work (no errors) but produces subtly wrong results. Example: a package that increments a static counter per request — the counter value is meaningless across requests.
- **Partial Feature Breakage:** Some package features work under Octane, others silently fail. Example: Spatie Medialibrary's remote URL generation works, but its temporary upload model leaks because of singleton `TemporaryUpload` registry.
- **Version-Specific Compatibility:** A package is compatible in v1.2 but breaks in v1.3. The update introduces a new singleton provider registration. CI did not flag the change.
- **Runtime-Specific Compatibility:** A package is compatible with RoadRunner (process isolation) but not Swoole (coroutine sharing). The compatibility test only tested one runtime.

## Ecosystem Compatibility Reference
| Package | Status | Notes |
|---|---|---|
| spatie/laravel-permission | Compatible with hooks | Register `PermissionRegistrar` reset in `RequestTerminated` |
| spatie/laravel-medialibrary | Mostly compatible | Temporary uploads need scoped binding; conversions work |
| barryvdh/laravel-debugbar | Compatible (v3.8+) | Auto-detects Octane; collects data per-request |
| laravel/telescope | Compatible | Watchers flush per-request under Octane |
| maatwebsite/laravel-excel | Compatible with hooks | Temp file management needs `RequestTerminated` cleanup |
| beyondcode/laravel-websockets | Incompatible | Uses global state; requires replumbing for Octane |
| lab404/laravel-impersonate | Needs scoped | Guard state leaks; register `scoped()` for guard |
| propaganistas/laravel-no-captcha | Compatible | Stateless; uses config only |
| thedevdojo/wave | Partially compatible | Large package; audit per-feature |

## Ecosystem Usage
- **Spatie Packages:** Spatie/laravel-permission requires `RequestTerminated` listener to clear `PermissionRegistrar` cache. Spatie/laravel-medialibrary temporary uploads need scoped binding wrappers. Spatie maintains Octane compatibility notes per package.
- **Laravel Debugbar:** Compatible since v3.8+ with Octane. Collects per-request debug data and flushes between requests. Enable in staging for compatibility validation.
- **Laravel Telescope:** Watchers auto-flush per-request in Octane. Use Telescope's `DumpWatcher` during package compatibility testing to catch unexpected state mutations.
- **Livewire v3:** Uses scoped bindings internally for Octane support. Livewire components that register static macros or store per-request data in static properties still require individual auditing.
- **Community Tools:** `laravelcm/octane-checker` scans installed packages for common Octane-incompatible patterns (singleton mutations, static registrations). Integrate into CI pipeline to block incompatible package updates.
- **Composer Plugin Ecosystem:** No standardized Octane compatibility metadata exists on Packagist. Evaluate packages via issue tracker searches for "Octane" before adoption. Contribute compatibility findings back to package repositories.

## Related Knowledge Units
### Prerequisites
- singleton-state-leaks (core pattern to check in packages)
- static-property-accumulation (core pattern to check in packages)

### Related Topics
- scoped-bindings-for-octane (remediation for package singletons)
- octane-lifecycle-hooks (RequestTerminated for package cleanup)
- service-binding-audit (audit methodology applied to packages)

### Advanced Follow-up Topics
- memory-profiling-and-observability (verify package memory behavior)
- octane-architecture-overview (sandbox context for package compatibility)
- queue-worker-lifecycle (package compatibility for queue workers)

## Research Notes
- The Octane documentation provides a list of known-compatible packages, but it is community-maintained and often outdated.
- Packagist's "requires" metadata does not indicate Octane compatibility. There is no `octane-compatible` Composer flag. Community adoption of `octane` as a `suggest` package name is growing.
- Some package authors add `.octane` config files (e.g., `spatie/laravel-permission` has a config section for Octane reset behavior). This pattern is recommended but not standardized.
- Research question: Could Packagist display an Octane compatibility badge for packages that pass a standardized test suite? No such initiative exists.
- Laravel's first-party packages (Cashier, Passport, Sanctum, Scout) are all Octane-compatible as of Laravel 10. Manual verification is still recommended per version.
