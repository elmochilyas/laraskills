## Run octane:test before every deployment and after every composer update
---
Category: Testing
---
Execute `php artisan octane:test` in the CI/CD pipeline on every commit and add a manual step to run it after every composer update — fail the build on any incompatibility warning.
---
Reason: A seemingly innocuous `composer update` can pull a package version that introduces static properties, $_SESSION access, or global state that breaks Octane's persistent worker model. Without automated testing, the incompatibility reaches production and causes cross-request data leaks that are nearly impossible to trace to the package update. octane:test catches these before they leave CI.
---
Bad Example:
```bash
# composer update run without Octane testing
# Package v2.1 introduces static $cache — data leaks across requests in production
# Root cause: the package update, but correlation takes days
```

Good Example:
```bash
# octane:test runs after every dependency change
composer update spatie/laravel-permission
php artisan octane:test  # Passes — safe to deploy
```
---
Exceptions: Development environments with manual testing coverage may skip automated octane:test in local development, but it must be in CI.
---
Consequences Of Violation: Undetected Octane incompatibility from dependency updates, data leakage between users, extremely difficult root-cause analysis across package versions.

## Audit every third-party package's static properties before Octane deployment
---
Category: Maintainability
---
Run `grep -rn "public static \$" vendor/PackageName --include="*.php"` for each third-party package and document which static properties are safe (intentionally shared state) versus unsafe (request-scoped caches).
---
Reason: Third-party packages are the most common source of Octane state leaks because they were written for FPM's per-request process model where static properties are naturally reset. A package's `public static $queryLog = []` silently accumulates all queries from all requests in an Octane worker — growing unboundedly and potentially leaking data. Manual audit of each package's statics is the only way to ensure safety.
---
Bad Example:
```bash
# No vendor audit — leaks from unknown packages
# Package has public static $cache that grows across requests
# Undetected until OOM or data leak
```

Good Example:
```bash
# Vendor package audit documented
# Package A: public static $config (immutable after boot) — safe
# Package B: public static $queryLog (appended per query) — UNSAFE, needs wrapper
# Package C: public static $instances (service locator pattern) — needs scoped binding
```
---
Exceptions: Applications with zero third-party dependencies (first-party only) may skip vendor auditing but should still audit app code.
---
Consequences Of Violation: Undetected state leaks from vendor packages, data contamination between users, memory growth from accumulating static collections.

## Use Octane's scoped() binding to wrap incompatible third-party packages
---
Category: Architecture
---
When a third-party package is incompatible with Octane (static properties, global state), create a wrapper that uses scoped() container bindings to provide fresh instances per request without modifying the vendor code.
---
Reason: Modifying vendor code is not sustainable — changes are lost on composer update and create maintenance burden. The scoped() wrapper pattern provides a clean separation: the outer layer (scoped binding) manages the lifecycle, while the inner package code operates on a fresh instance per request. This avoids data leakage without forking or patching the package.
---
Bad Example:
```php
// Modifying vendor code — lost on next composer update
// vendor/package/src/Service.php: public static $cache = []; // Removed manually
```

Good Example:
```php
// Scoped wrapper — no vendor modifications
$this->app->scoped(PackageService::class, function () {
    return new PackageService();  // Fresh instance per request
});
```
---
Exceptions: Performance-critical packages where scoped() overhead is prohibitive may need a different approach (fork or replace).
---
Consequences Of Violation: Data leaks from incompatible packages, lost vendor modifications on update, ongoing maintenance burden from patched vendor code.

## Maintain a written compatibility matrix for all third-party packages under Octane
---
Category: Maintainability
---
Create and maintain a documented matrix of all third-party packages with their Octane compatibility status (Compatible / Compatible with Config / Incompatible / Unknown) and update it with every dependency change.
---
Reason: Without a written record, every team member must independently rediscover which packages work under Octane. This wastes time, leads to inconsistent wrappers, and causes repeated incidents as the same incompatible packages are deployed to new environments. A living document ensures institutional knowledge is preserved and onboarding is faster.
---
Bad Example:
```bash
# No compatibility matrix — tribal knowledge
# Senior dev knows Package X is incompatible, but junior dev deploys it to a new service
```

Good Example:
```markdown
| Package | Version | Octane Compat | Notes |
|---------|---------|---------------|-------|
| spatie/laravel-permission | 6.0+ | Yes (with scoped) | Needs scoped() for Role model |
| barryvdh/laravel-debugbar | 3.x | No | Uses static $data, $_SESSION |
```
---
Exceptions: Small teams with a single application may rely on code review catch incompatibilities, though a written matrix is still recommended.
---
Consequences Of Violation: Repeated incompatibility incidents, wasted debugging time, inconsistent fixes across services, tribal knowledge lost when team members leave.
