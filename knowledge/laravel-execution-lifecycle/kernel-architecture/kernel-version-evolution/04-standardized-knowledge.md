# Kernel Version Evolution

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Kernel Architecture
- **Last Updated:** 2026-06-02

## Overview
The kernel architecture underwent significant structural changes across Laravel versions 10 through 13. The most consequential change — removal of `App\Http\Kernel` and `App\Console\Kernel` in Laravel 11 — shifted middleware and command configuration from class properties to the `bootstrap/app.php` ApplicationBuilder. Understanding this evolution is essential for maintaining legacy applications, planning upgrades, and writing version-compatible packages.

## Core Concepts
- **Userland Kernel Removal**: Laravel 10 included `app/Http/Kernel.php` and `app/Console/Kernel.php` extending framework base classes. From Laravel 11, these files are no longer generated — configuration moves to `bootstrap/app.php`.
- **ApplicationBuilder Pattern**: Laravel 11+ uses `Illuminate\Foundation\Configuration\ApplicationBuilder`. Methods like `->withMiddleware()`, `->withCommands()`, `->withSchedule()` replace kernel class properties.
- **Framework Kernel Persistence**: Internal kernel classes (`Illuminate\Foundation\Http\Kernel`, `Illuminate\Foundation\Console\Kernel`) remain unchanged. Only user-facing extension classes were removed.
- **BC-Preserving Layer**: Laravel 11+ still loads `App\Http\Kernel` and `App\Console\Kernel` if they exist — enabling incremental migration.
- **syncMiddlewareToRouter() Bridge**: In Laravel 10, this method in the HTTP Kernel manually synced route middleware aliases to the Router. In Laravel 11+, the ApplicationBuilder handles this automatically.

## When To Use
- **Upgrading Laravel 10 → 11+**: Migrate kernel configuration to ApplicationBuilder.
- **Creating new Laravel 11+ projects**: Use `bootstrap/app.php` exclusively.
- **Writing packages**: Support both pre-11 and post-11 kernel patterns via `class_exists()` detection.
- **Maintaining legacy apps**: Understand the old kernel property approach while planning migration.

## When NOT To Use
- **Package development for Laravel 11+ only**: Use ApplicationBuilder patterns exclusively.
- **Framework internals development**: The framework kernel remains class-based and unchanged.
- **Simple projects with no custom middleware/commands**: The defaults work without any kernel configuration.

## Best Practices (WHY)
- **Start migration early**: Migrate middleware configuration in Laravel 10.43+ (which backported `withMiddleware()`) before upgrading to Laravel 11. *Why: Early migration separates configuration from upgrade concerns, making each step independently testable.*
- **Keep App\Http\Kernel until migration is fully tested**: The BC layer allows both configurations to coexist. Test in staging with both active. *Why: Removing the kernel file before ApplicationBuilder config is complete causes silent middleware loss — the framework uses defaults only.*
- **Replace `App\Http\Kernel` type-hints with `Contracts\Http\Kernel`**: Package code referencing the userland kernel breaks in Laravel 11+. *Why: The contract (`Illuminate\Contracts\Http\Kernel`) is stable across versions; the concrete class may not exist.*
- **Audit `$kernel->pushMiddleware()` calls in service providers**: These silently become no-ops when the kernel class doesn't exist. *Why: The `Middleware` configuration object replaces this pattern.*

## Architecture Guidelines
- **Configuration gravity shift**: Configuration moved from vertical inheritance to horizontal assembly. The old kernel used inheritance (extending framework class); the new approach uses composition (ApplicationBuilder collects config).
- **Single configuration entry point**: `bootstrap/app.php` now serves as the single configuration entry for middleware, commands, schedules, routing, and exception handling.
- **Framework kernel unchanged**: The boundary is clear — user config → ApplicationBuilder → framework kernel consumes. The internal pipeline mechanics remain framework-owned.
- **BC detection**: Application checks for `App\Http\Kernel` existence via `class_exists()`. If present, it falls back to legacy property-read approach.

## Performance
- **No performance impact from kernel removal**: Removing the userland kernel saves one class autoload and one object allocation — negligible.
- **ApplicationBuilder overhead**: Builder pattern adds method call overhead, but this is one-time at application construction, not per-request.
- **Middleware resolution**: ApplicationBuilder vs old kernel property produces identical internal arrays — identical runtime performance.

## Security
- **Middleware loss**: If `withMiddleware()` partially replicates kernel config, there's no warning — the middleware simply doesn't run. Full test coverage is essential.
- **BC detection conflict**: If both `App\Http\Kernel` exists AND `withMiddleware()` is configured, Laravel merges both. The merge is additive but may produce unexpected ordering.
- **Package type-hint breakage**: Packages requiring `App\Http\Kernel` type-hint throw "Class not found" on Laravel 11+ skeleton projects.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Assuming kernel removal means "no kernel" | Not understanding framework kernel persists | Confusion about how middleware still works | Framework kernel unchanged; only userland class removed |
| Missing `->withRouting()` | Middleware config moved but routing config forgotten | Route model binding breaks | Migrate routing alongside middleware |
| Forgetting `use` statements | Missing imports in `bootstrap/app.php` | Runtime "class not found" errors | Add `use Illuminate\Foundation\Configuration\Middleware;` |
| Relying on `$kernel` variable in providers | Code like `$kernel->pushMiddleware()` in service providers | Silently no-op in Laravel 11+ | Use `Middleware` configuration class instead |

## Anti-Patterns
- **Doing both kernel approaches indefinitely**: Keeping old kernel files after migration is complete. Remove them after verification to simplify the codebase.
- **Overriding framework kernel**: Creating a custom class that extends the framework kernel instead of using ApplicationBuilder for configuration.
- **Vendor-patching kernel files**: Modifying framework kernel files in `vendor/`. Use ApplicationBuilder or service providers for customization.
- **Partial migration in production**: Deploying with half-migrated configuration that differs between kernel and ApplicationBuilder — causes inconsistent behavior.

## Examples

```php
// Laravel 10 kernel (app/Http/Kernel.php)
class Kernel extends HttpKernel
{
    protected $middleware = [
        \App\Http\Middleware\TrustProxies::class,
    ];
    protected $middlewareGroups = [
        'web' => [
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],
    ];
    protected $routeMiddleware = [
        'auth' => \App\Http\Middleware\Authenticate::class,
    ];
}

// Laravel 11+ equivalent (bootstrap/app.php)
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(\App\Http\Middleware\TrustProxies::class);
    $middleware->web(append: [
        \App\Http\Middleware\EncryptCookies::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ]);
    $middleware->alias('auth', \App\Http\Middleware\Authenticate::class);
})
->withCommands([
    App\Console\Commands\ProcessReports::class,
])
->withSchedule(function (Schedule $schedule) {
    $schedule->command('reports:generate')->daily();
})
```

## Related Topics
- **HTTP Kernel Internals**: Understanding the pipeline and middleware arrays being evolved.
- **Console Kernel Internals**: The console counterpart affected by the same version changes.
- **Legacy Kernel Migration**: Practical step-by-step migration from kernel properties to ApplicationBuilder.
- **ApplicationBuilder Internals**: How `withMiddleware()`, `withCommands()`, `withSchedule()` are implemented.
- **Upgrade Guides (10→11, 11→12)**: Official Laravel upgrade paths and breaking changes.

## AI Agent Notes
- The kernel detection logic is in `Illuminate\Foundation\Application::getKernel()` — it checks for `App\Http\Kernel` existence via `class_exists()`.
- The switch from kernel class to ApplicationBuilder is part of a broader Laravel trend toward minimal skeleton. The same pattern applies to exception handling (`->withExceptions()`) and routing (`->withRouting()`).
- Laravel 10.43+ backported `withMiddleware()` support — enabling pre-migration before upgrading to Laravel 11. This is the recommended migration path.
- The `syncMiddlewareToRouter()` method is implemented in the framework kernel, not the userland kernel. It bridges kernel property configuration to the Router's internal state.

## Verification
- [ ] Compare Laravel 10 and Laravel 11 skeleton projects — identify the kernel structure differences
- [ ] Migrate a middleware configuration from kernel property to `withMiddleware()` syntax
- [ ] Verify BC layer works: keep old kernel file while adding ApplicationBuilder config
- [ ] Remove old kernel file and confirm ApplicationBuilder config is picked up
- [ ] Test package code with `Contracts\Http\Kernel` type-hint vs `App\Http\Kernel`
- [ ] Run `php artisan route:list -v` before and after migration — verify middleware lists match
