# Legacy Kernel Migration

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Kernel Architecture
- **Last Updated:** 2026-06-02

## Overview
Legacy kernel migration refers to the process of moving from Laravel 10's userland kernel classes (`App\Http\Kernel`, `App\Console\Kernel`) to Laravel 11+'s ApplicationBuilder pattern (`bootstrap/app.php`). This migration preserves the same runtime behavior while adopting a composition-based configuration approach. Understanding the patterns, pitfalls, and bridge mechanisms is essential for teams upgrading Laravel applications across major versions.

## Core Concepts
- **syncMiddlewareToRouter() Bridge**: A method in the legacy HTTP Kernel that manually syncs route middleware aliases to the Router. In Laravel 11+, handled automatically by ApplicationBuilder.
- **Middleware Configuration Migration**: Three array properties (`$middleware`, `$middlewareGroups`, `$routeMiddleware`) map to `$middleware->append()`, `$middleware->web()`, `$middleware->alias()` in `withMiddleware()`.
- **Schedule Migration**: `schedule()` method content moves to `->withSchedule()` closure.
- **Command Migration**: `$commands` property and `commands()` method move to `->withCommands()`.
- **Incremental Strategy**: Laravel 11+ detects existing kernel classes and falls back to legacy behavior — enabling incremental migration.

## When To Use
- **Laravel 10 → 11+ upgrade**: Required migration for any project upgrading across these versions.
- **Modernizing old Laravel apps**: Even without upgrading, adopting ApplicationBuilder patterns in Laravel 10.43+ simplifies future migration.
- **Package development**: When building packages that must support both kernel formats.

## When NOT To Use
- **Laravel 11+ skeleton projects**: New projects start with ApplicationBuilder — no migration needed.
- **Laravel 10 projects staying on Laravel 10**: Migration is optional (but recommended for future-proofing).
- **Framework internals**: Do not migrate the framework kernel itself.

## Best Practices (WHY)
- **Migrate in Laravel 10 first**: Laravel 10.43+ backported `withMiddleware()`. Migrate configuration before upgrading Laravel core. *Why: Separating configuration migration from Laravel version upgrade makes each change independently testable and debuggable.*
- **Keep old kernel file until fully verified**: The BC layer allows both configurations. Test in staging with both active before removal. *Why: Removing the kernel file early causes silent middleware loss — the framework falls back to defaults with no warning.*
- **Audit service providers for `$kernel->pushMiddleware()`**: These calls silently become no-ops in Laravel 11+ when `App\Http\Kernel` doesn't exist. *Why: The framework only reads middleware from ApplicationBuilder config; direct kernel calls are ignored.*
- **Replace `App\Http\Kernel` type-hints**: Use `Illuminate\Contracts\Http\Kernel` instead. *Why: The contract exists in all versions; the concrete class may not exist in Laravel 11+.*

## Architecture Guidelines
- **Strangler Fig Pattern**: Old kernel class remains while new config is assembled alongside it. Removal is the final step.
- **Property to Method Call**: The shift from class properties (declarative) to method calls (imperative) enables IDE autocompletion, static analysis, and runtime conditionals.
- **Single Responsibility**: `bootstrap/app.php` becomes the single source of truth for bootstrap configuration.
- **BC-First Approach**: Prioritizes backward compatibility — existing apps upgrade without code changes. Migration is optional (but recommended) in Laravel 11.

## Performance
- **No runtime impact**: Migration produces identical internal state — zero performance difference between kernel property config and ApplicationBuilder config.
- **BC detection overhead**: `class_exists('App\Http\Kernel')` is a negligible autoloader check (microseconds).
- **Memory**: ApplicationBuilder creates intermediate Configuration objects during construction, but these are short-lived (freed after bootstrap).

## Security
- **Silent middleware loss**: If `withMiddleware()` partially replicates kernel config (e.g., missing one middleware), there's no warning — the middleware simply doesn't run.
- **BC detection conflict**: If both kernel exists AND `withMiddleware()` is configured, Laravel merges both additively, potentially causing duplicate middleware or unexpected ordering.
- **Third-party package breakage**: Packages calling `$kernel->pushMiddleware()` work with old kernel but silently fail if kernel is removed before ApplicationBuilder config is complete.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Duplicate middleware | Adding middleware via `withMiddleware()` while old kernel still defines it | Middleware runs twice | Test with `route:list -v` to verify before removing kernel |
| Missing `use` in bootstrap/app.php | Forgetting import statements | Runtime "class not found" error | Add `use Illuminate\Foundation\Configuration\Middleware;` |
| Removing kernel too early | Removing `app/Http/Kernel.php` before `withMiddleware()` is complete | No custom middleware runs — only defaults | Remove only after verification |
| Skipping `->withRouting()` | Route configuration also moved to bootstrap/app.php | Route model binding breaks | Migrate routing alongside middleware |

## Anti-Patterns
- **Permanent dual configuration**: Keeping both old kernel files and ApplicationBuilder config indefinitely. Remove legacy files after verification.
- **Manual vendor edits**: Editing `Illuminate\Foundation\Http\Kernel` instead of using ApplicationBuilder for configuration.
- **Skipping command/schedule migration**: Only migrating middleware and leaving console kernel config in old format.
- **Over-relying on BC layer**: Treating the BC detection as a permanent solution rather than a migration bridge.

## Examples

```php
// BEFORE: Laravel 10 kernel
class Kernel extends HttpKernel
{
    protected $middleware = [
        \App\Http\Middleware\TrustProxies::class,
        \Illuminate\Http\Middleware\HandleCors::class,
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

// AFTER: Laravel 11+ bootstrap/app.php
return Application::configure()
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(\App\Http\Middleware\TrustProxies::class);
        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
        $middleware->web(append: [
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);
        $middleware->alias('auth', \App\Http\Middleware\Authenticate::class);
    })
    ->withCommands([
        \App\Console\Commands\ProcessReports::class,
    ])
    ->withSchedule(function (Schedule $schedule) {
        $schedule->command('reports:generate')->daily();
    })
    ->create();
```

## Related Topics
- **HTTP Kernel Internals**: Understanding the pipeline and middleware arrays being migrated.
- **Console Kernel Internals**: The console counterpart with command and schedule registration.
- **Kernel Version Evolution**: Why and how the kernel architecture changed across versions.
- **ApplicationBuilder Internals**: Deep dive into `withMiddleware()`, `withCommands()`, `withSchedule()` implementation.
- **Laravel Upgrade Guide (10→11)**: Official framework upgrade documentation.

## AI Agent Notes
- The BC detection logic spans multiple locations: `Application::registerCoreContainerAliases()` (checks for `App\Http\Kernel`), `ApplicationBuilder` (collects middleware config), and `Illuminate\Foundation\Http\Kernel` constructor (reads middleware from kernel class or container).
- The migration is not just syntactic — `withMiddleware()` offers new capabilities like `$middleware->remove()` to remove framework default middleware. This was difficult with the old kernel property approach.
- Laravel 10.43+ backported `withMiddleware()` support, enabling pre-migration before upgrading to Laravel 11. This is the recommended migration path.
- Packages that type-hint `App\Http\Kernel` will break on Laravel 11+ — always use `Illuminate\Contracts\Http\Kernel`.

## Verification
- [ ] Map each `$middleware` entry to `$middleware->append()` or `$middleware->prepend()`
- [ ] Map each `$middlewareGroups` entry to `$middleware->groupName(append: [...])` or `$middleware->groupName(prepend: [...])`
- [ ] Map each `$routeMiddleware` entry to `$middleware->alias(key, class)`
- [ ] Map `$commands` to `->withCommands([...])`
- [ ] Map `schedule()` to `->withSchedule(fn($schedule) => ...)`
- [ ] Run `php artisan route:list -v` before and after migration — verify identical middleware per route
- [ ] Remove kernel files only after staging verification confirms all middleware is present
