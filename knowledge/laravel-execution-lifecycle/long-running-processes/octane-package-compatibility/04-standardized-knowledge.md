# Octane Package Compatibility

## Metadata
- **ID:** ku-09-octane-contextual-caching
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Overview
Not all Laravel packages are compatible with Octane's long-running process model. Packages that rely on per-request state stored in singletons, static properties, or global variables will break silently. Evaluating a package for Octane compatibility requires examining its service provider registrations, static property usage, and dependency on PHP superglobals. This KU provides a systematic evaluation framework, identifies common incompatible patterns, and catalogs the compatibility status of major Laravel packages.

## Core Concepts
- **Compatibility Spectrum**: **Fully Compatible** (no changes needed), **Compatible with Hooks** (needs `RequestTerminated` listener or tick), **Partially Compatible** (some features work, some break), **Incompatible** (requires code changes).
- **Common Incompatible Patterns**: Singleton registration with per-request mutable state; static property caching of request-specific data; direct superglobal usage; assumptions about `__destruct()` timing; `register_shutdown_function()` for cleanup.
- **Application Responsibility**: The application developer ensures all installed packages are Octane-compatible. Package authors increasingly add Octane support, but it is not universal.
- **Shim Layer**: Application-side compatibility layer wrapping incompatible packages — intercepting static registrations, wrapping in scoped bindings, adding cleanup listeners.

## When To Use
- **Pre-Octane deployment**: Evaluate every installed package before deploying Octane.
- **Adding new packages**: Evaluate Octane compatibility as part of the package adoption process.
- **Upgrading packages**: A minor version update can introduce new singleton bindings — re-evaluate.
- **Debugging unexpected Octane behavior**: When a package silently produces wrong results under Octane.

## When NOT To Use
- **PHP-FPM only**: Package incompatibility is invisible in FPM — each request is isolated.
- **Well-known compatible packages**: Laravel first-party packages (Cashier, Passport, Sanctum, Scout) are Octane-compatible.
- **Packages with explicit Octane support**: Some packages provide Octane config files or documentation.

## Best Practices (WHY)
- **Test with ≥100 sequential requests**: Octane bugs only manifest on the second, third, or thousandth request. *Why: Singletons and statics accumulate; a single-request test catches nothing.*
- **Audit the package's service provider first**: Check for `singleton()` with mutable state, static property usage, `$_SERVER`/`$_ENV` access. *Why: The provider is the package's entry point — all binding registrations and side effects start there.*
- **Create shims over forks**: Wrapping incompatible packages with cleanup listeners or scoped overrides is upgrade-safe. Forking creates maintenance burden. *Why: Shims are upgraded with the package; forks require manual merging of each upstream change.*
- **Maintain a package compatibility matrix**: Document each package, version, compatibility status, and required shims. *Why: Teams change; memory fades. Written documentation prevents repeated investigation.*

## Architecture Guidelines
- **Application-side compatibility is the default**: Package authors cannot be expected to support all runtimes.
- **Static property analysis is mandatory**: Even if a package uses `bind()` (transient), static properties can leak.
- **Shims over forks**: Forking packages creates maintenance burden; shims are upgrade-safe.
- **Test-based verification**: Static analysis cannot detect all runtime behavior — actual request isolation testing catches the rest.

## Performance
- **Shim layers**: Add ~0.5-3ms per request depending on complexity.
- **Reflection-based static clearing**: Slower than direct method calls. Cache reflection handles on first use.
- **Scoped override**: Overriding package singleton with scoped adds normal scoped overhead (~1ms per request).
- **Heavy cleanup in RequestTerminated**: Can delay next request's sandbox creation.

## Security
- **Silent incompatibility**: Package appears to work (no errors) but produces subtly wrong results. Example: static counter per request — value meaningless across requests.
- **Partial feature breakage**: Some features work, others silently fail. Example: Spatie Medialibrary's URL generation works but temporary upload model leaks.
- **Version-specific compatibility**: Compatible in v1.2, breaks in v1.3. CI didn't flag the change.
- **Runtime-specific compatibility**: Compatible with RoadRunner (process isolation) but not Swoole (coroutine sharing).

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Assuming "works in PHP-FPM = works in Octane" | FPM isolation masks all accumulation | Production bugs under Octane | Always test with sequential requests |
| Testing with single request | Octane bugs need 2+ requests | False "compatible" verdict | Test with ≥100 sequential requests |
| Patching vendor directory | Overwritten on composer update | Lost changes | Use shims, overrides, or real forks |
| Confusing "no errors" with "compatible" | Silent data corruption | Wrong results without exceptions | Compare response outputs across requests |
| Ignoring indirect dependencies | Package's dependency may be the one leaking | Missed leak source | Check `composer show --tree` |

## Anti-Patterns
- **Forking packages for Octane compatibility**: Creating permanent forks of packages that could be fixed via shims. Increases maintenance burden significantly.
- **Deploying without package audit**: Assuming all packages are compatible because "they're popular." Popular packages can still leak state.
- **One-time audit with no re-evaluation**: Package updates can introduce new singletons. Each update requires re-evaluation.
- **Blindly enabling all package features**: Some features of a package may be incompatible while others work. Feature-flag gating is safer.

## Examples

```php
// Spatie Permission: RequestTerminated cleanup listener
Event::listen(RequestTerminated::class, function ($event) {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

// Scoped wrapper for package singleton
// In AppServiceProvider or OctaneSandbox provider:
$this->app->scoped(
    \Spatie\Permission\PermissionRegistrar::class,
    fn($app) => new \Spatie\Permission\PermissionRegistrar($app)
);

// Feature flag guard
if (! app()->bound(Octane::class)) {
    // Only register this feature in non-Octane environments
    $package->enableFeature('temporary-uploads');
}
```

## Related Topics
- **Singleton State Leaks**: Core pattern to check in packages.
- **Static Property Accumulation**: Core pattern to check in packages.
- **Scoped Bindings for Octane**: Remediation for package singletons.
- **Octane Lifecycle Hooks**: RequestTerminated for package cleanup.
- **Service Binding Audit**: Audit methodology applied to packages.

## AI Agent Notes
- The Octane documentation provides a list of known-compatible packages, but it is community-maintained and often outdated.
- Packagist's "requires" metadata does not indicate Octane compatibility. There is no `octane-compatible` Composer flag. Community adoption of `octane` as a `suggest` package name is growing.
- Some package authors add `.octane` config files (e.g., `spatie/laravel-permission` has a config section for Octane reset behavior). This pattern is recommended but not standardized.
- Laravel's first-party packages (Cashier, Passport, Sanctum, Scout) are all Octane-compatible as of Laravel 10. Manual verification is still recommended per version.

## Verification
- [ ] Run package compatibility scan — list all installed packages with their Octane status
- [ ] For each package, examine the service provider for `singleton()` calls
- [ ] Check for static properties using reflection or grep
- [ ] Test with 100+ sequential requests — compare response outputs for contamination
- [ ] Create shim layer for any incompatible package
- [ ] Add CI step that blocks installation of known-incompatible versions
- [ ] Maintain a living compatibility matrix in project documentation
