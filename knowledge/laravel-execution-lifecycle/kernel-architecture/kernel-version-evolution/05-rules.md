# Kernel Version Evolution — Rules

## Rule Name
Use `Contracts\Http\Kernel` type-hints to ensure version compatibility.
---
## Category
Maintainability
---
## Rule
Always type-hint `Illuminate\Contracts\Http\Kernel` and `Illuminate\Contracts\Console\Kernel` in application and package code. Never reference `App\Http\Kernel` or `App\Console\Kernel`.
---
## Reason
Userland kernel classes (`App\Http\Kernel`, `App\Console\Kernel`) were removed in Laravel 11+. Code referencing them throws "Class not found" in new skeleton projects. The contracts are stable across all versions from Laravel 5 through 13+.
---
## Bad Example
```php
class ServiceProvider extends Provider
{
    public function boot(App\Http\Kernel $kernel): void // Fails in Laravel 11+
    {
        // ...
    }
}
```
---
## Good Example
```php
use Illuminate\Contracts\Http\Kernel;

class ServiceProvider extends Provider
{
    public function boot(Kernel $kernel): void
    {
        // Works in Laravel 10, 11, 12, 13+
    }
}
```
---
## Exceptions
Legacy codebases pinned to Laravel 10 may continue using `App\Http\Kernel` until their upgrade. All new code should use the contract.
---
## Consequences Of Violation
"Class not found" errors on Laravel 11+ skeleton projects, broken packages, blocked version upgrades, forced hotfixes during deployment.

---

## Rule Name
Migrate kernel configuration in Laravel 10.43+ before upgrading to Laravel 11.
---
## Category
Reliability
---
## Rule
Adopt the `withMiddleware()` ApplicationBuilder syntax while still on Laravel 10.43+. Prove the configuration is correct, then upgrade Laravel core. Never migrate configuration and upgrade Laravel in the same deployment.
---
## Reason
Laravel 10.43+ backported `withMiddleware()` support, enabling pre-migration. Separating configuration migration from version upgrade makes each change independently testable and debuggable. Combined changes obscure the root cause of any failure.
---
## Bad Example
```bash
# Simultaneous: upgrade Laravel AND migrate config — can't tell which broke
composer update laravel/framework # 10→11
# Then rewrite bootstrap/app.php from scratch
```
---
## Good Example
```bash
# Step 1: Migrate config on Laravel 10.43+
# Edit bootstrap/app.php to add ->withMiddleware()
# Verify with php artisan route:list -v (identical middleware)

# Step 2: Upgrade Laravel to 11
composer require laravel/framework:^11.0
# Remove app/Http/Kernel.php after verification
```
---
## Exceptions
New Laravel 11+ projects starting from scratch have no migration to perform — use ApplicationBuilder from the start.
---
## Consequences Of Violation
Inability to determine whether configuration or upgrade caused a regression, extended rollback time, accidental middleware loss in production.

---

## Rule Name
Keep the old kernel file until migration is fully verified in staging.
---
## Category
Reliability
---
## Rule
Do not delete `App\Http\Kernel` or `App\Console\Kernel` until ApplicationBuilder configuration has been verified in a staging environment with production-like traffic. Use the BC layer to run both configurations simultaneously.
---
## Reason
The BC detection layer (`class_exists()`) falls back to legacy kernel behavior if the file exists and `withMiddleware()` is incomplete. Removing the kernel file early causes silent middleware loss — the framework uses defaults with no warning.
---
## Bad Example
```php
// Deleted app/Http/Kernel.php before withMiddleware() was complete
// Middleware silently lost — no error, no warning
```
---
## Good Example
```php
// app/Http/Kernel.php still exists (fallback active)
// bootstrap/app.php has withMiddleware() with full config
// Test both before deleting legacy file
// Final step: remove app/Http/Kernel.php
```
---
## Exceptions
Projects starting from Laravel 11+ skeleton have no legacy kernel file to keep.
---
## Consequences Of Violation
Silent loss of custom middleware — requests bypass all application-specific middleware, security middleware (auth, CSRF) missing, partial functionality in production.

---

## Rule Name
Audit all `$kernel->pushMiddleware()` calls in service providers before upgrading.
---
## Category
Security
---
## Rule
Search for and replace every `$kernel->pushMiddleware()` call in service providers before upgrading from Laravel 10 to 11+. These calls silently become no-ops when the kernel class no longer exists.
---
## Reason
`pushMiddleware()` modifies the kernel instance directly. In Laravel 11+ without `App\Http\Kernel`, this method is not available — the call silently does nothing. Middleware that was dynamically added disappears without error.
---
## Bad Example
```php
// app/Providers/AppServiceProvider.php
public function boot(): void
{
    $this->app->make(\App\Http\Kernel::class)
         ->pushMiddleware(LogRequests::class); // No-op in Laravel 11+
}
```
---
## Good Example
```php
// bootstrap/app.php
return Application::configure()
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(LogRequests::class);
    })
    ->create();
```
---
## Exceptions
No common exceptions. All dynamic middleware registration must move to `withMiddleware()`.
---
## Consequences Of Violation
Middleware silently disappears after upgrade, security checks bypassed, access logging stops without notification, difficult to diagnose because no error is thrown.

---

## Rule Name
Do not keep old kernel files indefinitely after migration is complete.
---
## Category
Maintainability
---
## Rule
Remove legacy `App\Http\Kernel` and `App\Console\Kernel` files after confirming ApplicationBuilder configuration is correct. Never maintain both configuration approaches permanently.
---
## Reason
Permanent dual configuration creates confusion about the source of truth. New team members may modify the legacy kernel file expecting changes to take effect, while the framework reads from ApplicationBuilder. Each approach must be checked to understand the final configuration.
---
## Bad Example
```php
// app/Http/Kernel.php still exists AND bootstrap/app.php has withMiddleware()
// Which one is active? Both merge additively — hard to reason about
```
---
## Good Example
```php
// After staging verification:
// 1. Remove app/Http/Kernel.php
// 2. Remove app/Console/Kernel.php
// 3. Run php artisan route:list -v to confirm
// 4. Commit — codebase now has one source of truth
```
---
## Exceptions
Teams with a gradual rollout strategy (e.g., per-service migration over months) may retain legacy files temporarily with a documented removal deadline.
---
## Consequences Of Violation
Confusion about configuration source of truth, duplicate middleware, inconsistent behavior between local and production, wasted maintenance time debugging phantom issues.

---

## Rule Name
For packages supporting pre-11 and 11+, detect version via `class_exists()`.
---
## Category
Maintainability
---
## Rule
When writing packages that must support both Laravel 10 and 11+, use `class_exists('App\Http\Kernel')` to detect which kernel configuration pattern is in use. Branch behavior accordingly.
---
## Reason
Packages cannot require a specific Laravel version for kernel configuration. Detecting the presence of the userland kernel class allows a single package version to support both patterns without breaking.
---
## Bad Example
```php
// Package hardcodes old kernel pattern — breaks on Laravel 11+
public function register(): void
{
    $this->app->resolving(\App\Http\Kernel::class, function ($kernel) {
        $kernel->pushMiddleware(MyMiddleware::class);
    });
}
```
---
## Good Example
```php
public function boot(): void
{
    if (class_exists(\App\Http\Kernel::class)) {
        // Laravel 10 — use kernel push approach
        $this->app->make(\App\Http\Kernel::class)->pushMiddleware(MyMiddleware::class);
    } else {
        // Laravel 11+ — use Middleware config
        $this->callAfterResolving(Middleware::class, function (Middleware $middleware) {
            $middleware->append(MyMiddleware::class);
        });
    }
}
```
---
## Exceptions
Packages targeting Laravel 11+ exclusively can drop the BC branch and use ApplicationBuilder patterns exclusively.
---
## Consequences Of Violation
"Class not found" errors on Laravel 11+ skeleton projects, package abandonment on newer framework versions, forced contributors to maintain separate version branches.
