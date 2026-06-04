# Octane Package Compatibility

## Rule Name
Audit every installed package for Octane compatibility before deployment.
---
## Category
Reliability | Architecture
---
## Rule
Always evaluate every installed package's service provider, static property usage, and superglobal access before deploying Octane. Never assume compatibility based on popularity.
---
## Reason
Packages that rely on per-request state stored in singletons, static properties, or PHP superglobals break silently under Octane. A package that "works" may produce subtly wrong results without errors.
---
## Bad Example
```php
// Deployed without audit — "it's popular, it must be fine"
composer require spatie/laravel-permission
// Silent leak: PermissionRegistrar caches permissions in singleton properties
```
---
## Good Example
```php
// Pre-deployment audit checklist:
// 1. Check service provider for singleton() calls
// 2. Grep for static::$property assignments
// 3. Check for $_SERVER/$_ENV access
// 4. Test with 100+ sequential requests
// 5. Document in compatibility matrix
```
---
## Exceptions
PHP-FPM-only deployments where per-request process isolation naturally resets package state.
---
## Consequences Of Violation
Silent data corruption; intermittent wrong results; hours of debugging to identify the incompatible package.

---

## Rule Name
Create shim layers over package forks.
---
## Category
Maintainability | Architecture
---
## Rule
Always prefer wrapping incompatible packages with `RequestTerminated` cleanup listeners or scoped overrides over forking the package.
---
## Reason
Shims survive `composer update` without modification. Forks require manual merging of every upstream change, creating ongoing maintenance burden that grows with time.
---
## Bad Example
```php
// Forking the package — maintenance nightmare
// "spatie/laravel-permission": "dev-fork-octane-compat"
// Must manually merge all upstream patches
```
---
## Good Example
```php
// Application-side shim — survives composer update
Event::listen(RequestTerminated::class, function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});
```
---
## Exceptions
When the package maintainer explicitly accepts Octane compatibility patches and the community fork is temporary.
---
## Consequences Of Violation
Stale fork missing security patches; escalating maintenance cost; eventual divergence from upstream.

---

## Rule Name
Test packages with ≥100 sequential requests.
---
## Category
Testing | Reliability
---
## Rule
Always test new or updated packages with sequences of at least 100 sequential requests in the same worker before approving for Octane use.
---
## Reason
Octane-incompatible behavior only manifests on the second, third, or thousandth request. Single-request tests catch nothing because singletons and statics appear correct on first use.
---
## Bad Example
```php
// Single-request test — passes but misses accumulation
public function test_package_works(): void
{
    $response = $this->get('/package-feature');
    $response->assertOk(); // Fine on first request
}
```
---
## Good Example
```php
// Sequential test — catches accumulation
public function test_package_octane_compatible(): void
{
    for ($i = 0; $i < 100; $i++) {
        $response = $this->actingAs(User::factory()->create())
            ->get('/package-feature');
        $response->assertOk();
    }
    // Assert baseline memory hasn't grown
    $this->assertLessThan(5 * 1024 * 1024, memory_get_usage(true) - $this->baselineMemory);
}
```
---
## Exceptions
Packages with explicit Octane support documentation and published compatibility tests.
---
## Consequences Of Violation
Accumulation undetected until production; silent data leaks affect real users.

---

## Rule Name
Maintain a living package compatibility matrix.
---
## Category
Maintainability
---
## Rule
Always document each package, its version, compatibility status, required shims, and last-audit date in the project's documentation.
---
## Reason
Teams change and memory fades. A written compatibility matrix prevents repeated investigation and provides onboarding context for new team members. Without it, every package upgrade risks regression.
---
## Bad Example
```php
// Tribal knowledge: "Bob knows which packages work with Octane"
// Bob leaves the team; nobody knows why certain packages have cleanup code
```
---
## Good Example
```php
// docs/octane-compatibility.md
// | Package | Version | Status | Shim? | Last Audited |
// |---|---|---|---|---|
// | spatie/laravel-permission | 6.0 | Compatible (with hook) | RequestTerminated reset | 2026-06-01 |
// | barryvdh/laravel-debugbar | 3.13 | Incompatible | — | 2026-05-15 |
```
---
## Exceptions
Trivial projects with fewer than 5 third-party packages where the matrix can be memorized.
---
## Consequences Of Violation
Repeated investigation cycle for each team member; accidental upgrades break production; knowledge loss during turnover.

---

## Rule Name
Re-audit package compatibility after every update.
---
## Category
Maintainability | Reliability
---
## Rule
Always re-evaluate Octane compatibility when upgrading any third-party package, including minor and patch versions.
---
## Reason
A minor or patch update can introduce new singleton bindings, static property usage, or superglobal access that breaks Octane compatibility. CI should flag dependency changes for re-audit.
---
## Bad Example
```php
composer update spatie/laravel-permission
// Minor bump v6.1 → v6.2 introduces new singleton — service Leaks
```
---
## Good Example
```php
// CI step: detect dependency changes
// composer.lock diff shows package version change → trigger re-audit
// CI blocks merge until compatibility matrix is updated
```
---
## Exceptions
Packages with explicit Octane CI and a published compatibility guarantee per version.
---
## Consequences Of Violation
Regression undetected until production; silent data corruption from new incompatible bindings.

---

## Rule Name
Use feature-flag gating for partially compatible packages.
---
## Category
Reliability | Architecture
---
## Rule
When a package has some compatible and some incompatible features, gate the incompatible features behind an Octane check rather than disabling the entire package.
---
## Reason
Partial compatibility allows safe use of working features while avoiding broken ones. A hard fork or full disable loses valuable functionality that could be safely used.
---
## Bad Example
```php
// Throwing away the entire package because one feature is incompatible
```
---
## Good Example
```php
public function boot(): void
{
    if (! app()->bound(Octane::class)) {
        // Enable temporary-uploads only in non-Octane environments
        $this->package->enableFeature('temporary-uploads');
    }
    // Core features work under both runtimes
}
```
---
## Exceptions
When the incompatible feature is the primary reason for using the package — find a replacement.
---
## Consequences Of Violation
Losing valuable package functionality unnecessarily; switching costs for finding replacements.
