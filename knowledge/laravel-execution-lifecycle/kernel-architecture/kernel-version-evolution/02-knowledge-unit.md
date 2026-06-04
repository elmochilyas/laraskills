# Kernel Version Evolution

## Metadata
**Domain:** Laravel Execution Lifecycle & Framework Internals  
**Subdomain:** Kernel Architecture  
**Last Updated:** 2026-06-02

## Executive Summary
The kernel architecture underwent significant structural changes across Laravel versions 10 through 13. The most consequential change — removal of `App\Http\Kernel` and `App\Console\Kernel` in Laravel 11 — shifted middleware and command configuration from class properties to the `bootstrap/app.php` ApplicationBuilder. Understanding this evolution is essential for maintaining legacy applications, planning upgrades, and writing version-compatible packages.

## Core Concepts
- **Userland Kernel Removal**: In Laravel 10, each new project included `app/Http/Kernel.php` and `app/Console/Kernel.php` extending framework base classes. From Laravel 11, these files are no longer generated — configuration moves to `bootstrap/app.php`.
- **ApplicationBuilder Pattern**: Laravel 11+ uses `Illuminate\Foundation\Configuration\ApplicationBuilder` returned by `bootstrap/app.php`. Methods like `->withMiddleware()`, `->withCommands()`, and `->withSchedule()` replace kernel class properties.
- **Framework Kernel Persistence**: The internal kernel classes (`Illuminate\Foundation\Http\Kernel` and `Illuminate\Foundation\Console\Kernel`) remain unchanged. Only the user-facing extension classes were removed.
- **BC-Preserving Compatibility Layer**: Laravel 11+ still loads `App\Http\Kernel` and `App\Console\Kernel` if they exist — enabling incremental migration.

## Mental Models
- **Configuration Gravity Shift**: Visualize kernel configuration moving from vertical inheritance (user class extends framework class) to horizontal assembly (ApplicationBuilder method calls assemble the same state).
- **Iceberg Model**: The userland kernel was the visible tip above water — the framework kernel is the massive ice below. Removing the tip doesn't change the underlying framework kernel behavior.
- **Migration as Refactor, Not Rewrite**: The kernel removal is a config relocation, not a behavioral change. Middleware, commands, and schedules configured via ApplicationBuilder produce the same internal state as the old kernel class.

## Internal Mechanics

**Laravel 10 kernel structure** (`app/Http/Kernel.php`):
```php
class Kernel extends HttpKernel {
    protected $middleware = [];
    protected $middlewareGroups = [];
    protected $routeMiddleware = [];
}
```
The framework constructor reads these properties. `syncMiddlewareToRouter()` mirrors route middleware to the Router.

**Laravel 11+ equivalent** (`bootstrap/app.php`):
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(...);       // was $middleware[]
    $middleware->web(append: [...]); // was $middlewareGroups['web']
    $middleware->alias([...]);       // was $routeMiddleware
})
->withCommands([...])
->withSchedule(function (Schedule $schedule) { ... })
```

**How the bridge works:**
1. `bootstrap/app.php` returns `ApplicationBuilder`.
2. `ApplicationBuilder::withMiddleware()` registers middleware in the container under `Illuminate\Foundation\Configuration\Middleware` singleton.
3. When the framework kernel boots, it reads middleware from this singleton instead of the now-absent `App\Http\Kernel` properties.
4. If `App\Http\Kernel` exists, it falls back to the legacy property-read approach.

**Evolution timeline:**
- **Laravel 5-9**: Userland kernel with middleware arrays in extending class.
- **Laravel 10**: Added `syncMiddlewareToRouter()` bridge. Kernel deprecated? — not yet, but groundwork laid.
- **Laravel 11**: `App\Http\Kernel` removed from skeleton. `bootstrap/app.php` becomes primary configuration point. `withSchedule()` added for console kernel.
- **Laravel 12-13**: Further streamlined ApplicationBuilder. Framework kernel minor optimizations. `withCommands()` improved for auto-discovery.

## Patterns
- **Versionary Pattern**: The kernel API evolves through explicit version boundaries — older patterns are preserved for compatibility but not advertised.
- **Configuration Assembly**: The ApplicationBuilder uses a fluent configuration assembly pattern — each `with*()` call appends to internal state, and the final `send()` (implied) binds state to the container.
- **Deprecation Lifecycle**: The userland kernel follows a proper deprecation: available (v10) → not generated (v11) → removed/discouraged (v12+).
- **Backward Compatibility Layer (BC)**: Detecting old kernel files and falling back to legacy behavior. Classic Laravel approach — never break existing applications.

## Architectural Decisions
- **Remove, Don't Rename**: Rather than renaming `App\Http\Kernel` to something else, Laravel removed it entirely. This simplifies the mental model — middleware configuration belongs in `bootstrap/app.php`, not in a class.
- **ApplicationBuilder Over Inheritance**: The old kernel used inheritance (extending framework class) — new approach uses composition (ApplicationBuilder collects config). Composition is more testable and discoverable.
- **Single Configuration Entry Point**: `bootstrap/app.php` now serves as the single configuration entry point for middleware, commands, schedules, routing, and exception handling. This consolidates scattered configuration.
- **Framework Kernel Intact**: The framework kernel remains class-based because it controls internal pipeline mechanics that shouldn't be user-configurable. The boundary is clear: user config → ApplicationBuilder → framework kernel consumes.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Less boilerplate in new projects | Existing Laravel 10 projects have manual migration work | Upgrade requires understanding both old and new config patterns |
| ApplicationBuilder is more discoverable (`->withMiddleware()` provides autocomplete) | ApplicationBuilder methods have different API shapes than array properties | Teams must learn new API surface for middleware configuration |
| Single config entry point (`bootstrap/app.php`) | All kernel config in one file can become large | Complex apps may prefer separating middleware config into dedicated files |
| BC layer preserves Laravel 10 apps | BC detection adds branch logic and test burden | Framework must maintain dual config paths (property vs ApplicationBuilder) |
| Composition over inheritance improves testability | Composition can hide state — ApplicationBuilder methods mutate internal objects | Debugging requires understanding the builder's internal state accumulation |

## Performance Considerations
- **No performance impact from kernel removal**: The userland kernel was resolved and instantiated on every request anyway — removing it saves one class autoload and one object allocation (negligible).
- **ApplicationBuilder overhead**: The builder pattern adds method call overhead, but this is a one-time cost at application construction (not per-request).
- **Middleware configuration**: Middleware list resolution (from ApplicationBuilder vs old kernel property) has identical runtime performance — both produce the same internal array.

## Production Considerations
- **Upgrade order**: When upgrading Laravel 10 → 11+, migrate middleware first (uses BC), then commands, then schedule — testing each step independently.
- **Package compatibility**: Third-party packages that modify middleware via service providers (e.g., `$kernel->pushMiddleware()`) still work because the framework kernel is unchanged. Packages that type-hint `App\Http\Kernel` will break — use `Contracts\Http\Kernel` instead.
- **Skeleton vs running app**: Remember that the skeleton change (what `laravel new` generates) is separate from the framework change. Existing apps keep their kernel files until explicitly removed.
- **CI/CD implications**: Deployment scripts that rely on `app/Http/Kernel.php` existence (e.g., configuration validation) may need updating.

## Common Mistakes
- **Assuming kernel removal means "no kernel"**: The framework kernel (`Illuminate\Foundation\Http\Kernel`) still exists and operates identically. Only the userland extension class was removed from the skeleton.
- **Missing `->withRouting()`**: In Laravel 11+, routing configuration also moved to `bootstrap/app.php`. Separating middleware config from routing config breaks route-model binding if not migrated together.
- **Forgetting `use` statements**: `bootstrap/app.php` needs `use Illuminate\Foundation\Configuration\Middleware;` and `use Illuminate\Foundation\Configuration\Exceptions;` — missing imports cause runtime errors.
- **Relying on `$kernel` variable in `AppServiceProvider`**: Code like `$kernel->pushMiddleware(...)` in service providers breaks if `App\Http\Kernel` doesn't exist — use `Middleware` configuration class instead.

## Failure Modes
- **Partial migration**: Migrating middleware to `->withMiddleware()` but leaving `app/Http/Kernel.php` with old config — the BC layer may merge both, causing duplicate middleware or unexpected ordering.
- **Missing BC detection**: If a custom deployment script removes `app/Http/Kernel.php` before the ApplicationBuilder config is complete, the framework silently uses defaults (no custom middleware at all).
- **Version mismatch in package**: A package requiring `App\Http\Kernel` type-hint in its service provider will throw `Class "App\Http\Kernel" not found` on Laravel 11+ skeleton projects.

## Ecosystem Usage
- **First-party packages**: Laravel Breeze, Jetstream, and Fortify all provide middleware configuration snippets for both old kernel (v10) and ApplicationBuilder (v11+) formats.
- **Third-party packages**: Spatie packages now recommend using `Middleware` configuration class in `bootstrap/app.php`. Sentry's Laravel SDK added automatic detection of kernel version.
- **Application code**: Teams maintaining Laravel 10 apps should standardize early migration to ApplicationBuilder patterns (available via `withMiddleware()` in Laravel 10.x too) to simplify future upgrades.

## Related Knowledge Units

### Prerequisites
- **HTTP Kernel Internals** — understanding the pipeline, middleware, and bootstrapper mechanics being evolved
- **Console Kernel Internals** — the console counterpart affected by the same version changes
- **Service Container** — how `ApplicationBuilder` binds configuration into the container

### Related Topics
- **Legacy Kernel Migration** — practical step-by-step migration from kernel properties to ApplicationBuilder
- **Application Structure (Skeleton)** — how `bootstrap/app.php` replaces `app/Http/Kernel.php` in new projects
- **Upgrade Guides (10→11, 11→12)** — official Laravel upgrade paths and breaking changes

### Advanced Follow-up Topics
- **Custom ApplicationBuilder Extensions** — extending the builder with custom configuration methods
- **Multi-Version Package Development** — writing packages compatible with both kernel property and ApplicationBuilder patterns
- **Injection Guidelines by Class Type** — how kernel version affects injection capabilities per class type

## Research Notes
* **Source Analysis:** The kernel detection logic is in `Illuminate\Foundation\Application::getKernel()` — it checks for `App\Http\Kernel` existence via `class_exists()`. The ApplicationBuilder lives at `src/Illuminate/Foundation/Configuration/ApplicationBuilder.php` (introduced in Laravel 11).
* **Key Insight:** The switch from kernel class to ApplicationBuilder is part of a broader Laravel trend toward minimal skeleton. The same pattern applies to exception handling (`->withExceptions()`) and routing (`->withRouting()`).
* **Version-Specific Notes:** Laravel 13 (2026) further streamlined the ApplicationBuilder API — `withMiddleware()` now accepts `Middleware` object directly or closure, `withCommands()` supports directory scanning with automatic registration. The old kernel property approach is fully deprecated and will be removed in Laravel 14.
