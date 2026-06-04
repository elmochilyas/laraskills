# Legacy Kernel Migration — Rules

## Rule Name
Migrate configuration one property at a time with verification between each step.
---
## Category
Reliability
---
## Rule
Migrate each kernel property (`$middleware`, `$middlewareGroups`, `$routeMiddleware`, `$commands`, `schedule()`) independently. Verify with `php artisan route:list -v` after each migration step before proceeding to the next.
---
## Reason
Migrating all properties at once increases the risk of missed middleware, incorrect aliases, or accidental omissions. Step-by-step migration with verification isolates failures to a single change, making debugging trivial.
---
## Bad Example
```php
// Migrated all middleware, commands, and schedule in one edit
// Massive diff — can't tell which mapping was wrong
```
---
## Good Example
```php
// Step 1: Migrate $middleware → $middleware->append()
// Verify with route:list -v
// Commit

// Step 2: Migrate $middlewareGroups → $middleware->groupName()
// Verify with route:list -v
// Commit

// Step 3: Migrate $routeMiddleware → $middleware->alias()
// Verify with route:list -v
// Commit
```
---
## Exceptions
Trivial projects with 1-2 middleware entries and no groups may migrate everything in a single step.
---
## Consequences Of Violation
Middleware silently missing after migration, difficult to identify which property mapping caused the issue, extended debugging time, accidental production deployment with incomplete configuration.

---

## Rule Name
Use the BC layer — keep old kernel files until ApplicationBuilder config is verified.
---
## Category
Security
---
## Rule
Do not delete `App\Http\Kernel` or `App\Console\Kernel` until `php artisan route:list -v` shows identical middleware lists to the pre-migration baseline. Keep the old files as a safety net during migration.
---
## Reason
The BC detection layer (`class_exists('App\Http\Kernel')`) provides fallback behavior. Removing the kernel file before ApplicationBuilder configuration is complete causes the framework to use default middleware only — with no error or warning.
---
## Bad Example
```php
// Deleted app/Http/Kernel.php before withMiddleware() was finished
// No custom middleware runs — no error thrown
```
---
## Good Example
```php
// Keep app/Http/Kernel.php (BC layer active)
// Build withMiddleware() incrementally
// After final verification: php artisan route:list -v matches pre-migration
// Only then: delete app/Http/Kernel.php and app/Console/Kernel.php
```
---
## Exceptions
No common exceptions. The BC layer exists specifically to enable this safe migration pattern.
---
## Consequences Of Violation
Custom middleware silently disappears in production, auth middleware missing, access logging stops, security posture degrades without alerting.

---

## Rule Name
Replace all `$kernel->pushMiddleware()` calls in service providers before migration.
---
## Category
Architecture
---
## Rule
Audit service providers for direct kernel manipulation (`$kernel->pushMiddleware()`, `$kernel->prependMiddleware()`) and migrate those middleware registrations into `withMiddleware()` before removing the legacy kernel file.
---
## Reason
Direct kernel calls modify the kernel instance at runtime. In Laravel 11+ without `App\Http\Kernel`, the kernel instance is the framework kernel, which does not expose these mutator methods. The calls silently become no-ops.
---
## Bad Example
```php
// app/Providers/AppServiceProvider.php
public function boot(): void
{
    // Becomes a no-op after legacy kernel is removed
    $this->app->make(Kernel::class)->pushMiddleware(EnsureTokenIsValid::class);
}
```
---
## Good Example
```php
// bootstrap/app.php
return Application::configure()
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(EnsureTokenIsValid::class);
    })
    ->create();
```
---
## Exceptions
No common exceptions. All middleware registration must centralize in `bootstrap/app.php`.
---
## Consequences Of Violation
Dynamically registered middleware stops running after migration, silent functionality loss, security middleware bypassed without any error indication.

---

## Rule Name
Verify middleware lists match exactly using `php artisan route:list -v` before and after.
---
## Category
Testing
---
## Rule
Run `php artisan route:list -v` to produce a complete middleware listing for every route before migration. After applying `withMiddleware()`, run the same command and diff the output. Reject the migration if the lists differ.
---
## Reason
Manual inspection of middleware arrays is error-prone — easy to miss a single entry or alias. Automated diff comparison catches every discrepancy, including ordering differences introduced by the migration.
---
## Bad Example
```php
// "Looks about right" — deploy withMiddleware() without diff check
// One middleware entry was accidentally skipped
```
---
## Good Example
```bash
# Before migration
php artisan route:list -v > before-migration.txt

# After withMiddleware() configuration
php artisan route:list -v > after-migration.txt

# Diff to verify
Compare-Object (Get-Content before-migration.txt) (Get-Content after-migration.txt)
```
---
## Exceptions
When intentionally adding or removing middleware as part of the migration (not a pure migration but a refinement), document the diff and approve it explicitly.
---
## Consequences Of Violation
Undetected middleware changes in production, missing security middleware on specific routes, difficult to trace which routes lost protections, regressions caught by users instead of tests.

---

## Rule Name
Do not mark migration as complete until command and schedule registration is also migrated.
---
## Category
Maintainability
---
## Rule
Migrate both `App\Http\Kernel` and `App\Console\Kernel` configuration together. Do not consider migration complete until commands (`->withCommands()`) and schedules (`->withSchedule()`) are also moved to `bootstrap/app.php` alongside middleware.
---
## Reason
Partial migration (middleware only, leaving commands and schedule in legacy files) creates confusion — the codebase has two configuration patterns, and new team members must know which parts use which approach. The console kernel retains its legacy file until explicitly migrated.
---
## Bad Example
```php
// bootstrap/app.php has withMiddleware()
// But app/Console/Kernel.php still holds $commands and schedule()
// Confusion: "Where do I add a new command?"
```
---
## Good Example
```php
// bootstrap/app.php
return Application::configure()
    ->withMiddleware(function (Middleware $middleware) {
        // ...
    })
    ->withCommands([
        ProcessReports::class,
        GenerateInvoice::class,
    ])
    ->withSchedule(function (Schedule $schedule) {
        $schedule->command('reports:generate')->daily();
    })
    ->create();

// Both app/Http/Kernel.php and app/Console/Kernel.php removed
```
---
## Exceptions
Projects with no custom commands or schedules have nothing to migrate for the console kernel.
---
## Consequences Of Violation
Permanent dual configuration pattern, confusion about where to add new commands, inconsistent codebase styles, increased onboarding friction.

---

## Rule Name
Use `->withMiddleware()` remove capabilities to drop unwanted framework defaults.
---
## Category
Code Organization
---
## Rule
Leverage the `$middleware->remove()` method available in `withMiddleware()` to explicitly drop framework default middleware, rather than leaving the old kernel file with an incomplete middleware array.
---
## Reason
The old kernel property approach required listing every middleware to include — defaults were inherited from the parent class. `withMiddleware()` enables surgical removal of specific middleware, making it clear which defaults are intentionally excluded.
---
## Bad Example
```php
// Old kernel — unclear which middleware is inherited vs excluded
protected $middleware = [
    // Only listing custom middleware, defaults from parent
];
```
---
## Good Example
```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->remove([
        \Illuminate\Http\Middleware\HandleCors::class,
    ]);
    // Intent is explicit — only CORS is removed
})
```
---
## Exceptions
No common exceptions. Explicit removal is always clearer than relying on inheritance.
---
## Consequences Of Violation
Unclear middleware configuration, accidental inclusion of unwanted middleware, confusion about which defaults apply.
