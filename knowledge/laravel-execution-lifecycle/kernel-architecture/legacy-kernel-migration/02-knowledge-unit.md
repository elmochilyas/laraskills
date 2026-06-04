# Legacy Kernel Migration

## Metadata
**Domain:** Laravel Execution Lifecycle & Framework Internals  
**Subdomain:** Kernel Architecture  
**Last Updated:** 2026-06-02

## Executive Summary
Legacy kernel migration refers to the process of moving from Laravel 10's userland kernel classes (`App\Http\Kernel`, `App\Console\Kernel`) to Laravel 11+'s ApplicationBuilder pattern (`bootstrap/app.php`). This migration preserves the same runtime behavior while adopting a composition-based configuration approach. Understanding the patterns, pitfalls, and bridge mechanisms is essential for teams upgrading Laravel applications across major versions.

## Core Concepts
- **syncMiddlewareToRouter() Bridge**: A method in the legacy HTTP kernel that manually syncs route middleware aliases to the Router instance. In Laravel 10, this was called during kernel construction — in Laravel 11+, it's handled automatically by the ApplicationBuilder.
- **Middleware Configuration Migration**: Three array properties (`$middleware`, `$middlewareGroups`, `$routeMiddleware`) in `App\Http\Kernel` map to `$middleware->append()`, `$middleware->web()`, and `$middleware->alias()` in the ApplicationBuilder's `withMiddleware()` closure.
- **Schedule Migration**: `schedule()` method content in `App\Console\Kernel` moves to `->withSchedule()` closure in `bootstrap/app.php`.
- **Command Migration**: `$commands` property and `commands()` method in `App\Console\Kernel` move to `->withCommands()` in `bootstrap/app.php`.
- **Incremental Strategy**: Laravel 11+ detects existing `App\Http\Kernel` and `App\Console\Kernel` classes and falls back to legacy behavior — enabling incremental migration rather than a single cutover.

## Mental Models
- **Bridge Analogy**: `syncMiddlewareToRouter()` is the bridge connecting two configuration eras — legacy (kernel property) and modern (ApplicationBuilder). Crossing the bridge means no longer needing it.
- **State Extraction**: Visualize migration as extracting configuration state from kernel class properties and injecting it into ApplicationBuilder method calls. The state itself (middleware list, command list) doesn't change — only its container changes.
- **Strangler Fig Pattern**: The migration follows the strangler fig pattern — the legacy kernel class remains in place while ApplicationBuilder gradually takes over responsibility, until the legacy class can be safely removed.

## Internal Mechanics

**Laravel 10 `App\Http\Kernel`:**
```php
class Kernel extends HttpKernel
{
    protected $middleware = [
        \App\Http\Middleware\TrustProxies::class,
        \Illuminate\Http\Middleware\HandleCors::class,
    ];
    protected $middlewareGroups = [
        'web' => [
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        ],
        'api' => ['throttle:api'],
    ];
    protected $routeMiddleware = [
        'auth' => \App\Http\Middleware\Authenticate::class,
        'admin' => \App\Http\Middleware\AdminCheck::class,
    ];
}
```

**Laravel 11+ equivalent in `bootstrap/app.php`:**
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(\App\Http\Middleware\TrustProxies::class);
    $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
    $middleware->web(append: [
        \App\Http\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
    ]);
    $middleware->api(prepend: ['throttle:api']);
    $middleware->alias([
        'auth' => \App\Http\Middleware\Authenticate::class,
        'admin' => \App\Http\Middleware\AdminCheck::class,
    ]);
})
```

**Migration steps (recommended order):**
1. Add `withMiddleware()` to `bootstrap/app.php` — replicate all kernel middleware config.
2. Add `withCommands()` and `withSchedule()` — replicate console kernel config.
3. Verify behavior — both old kernel and new ApplicationBuilder config are active.
4. Remove `app/Http/Kernel.php` and `app/Console/Kernel.php` — BC layer detects their absence.
5. Clean up — remove any code referencing `App\Http\Kernel` directly (use `Contracts\Http\Kernel`).

**The `syncMiddlewareToRouter()` bridge** (`src/Illuminate/Foundation/Http/Kernel.php`):
```php
protected function syncMiddlewareToRouter()
{
    $this->router->middlewarePriority = $this->middlewarePriority;
    // ... syncs routeMiddleware to router aliases
}
```
In Laravel 10, this was called in the kernel constructor. In Laravel 11+, the ApplicationBuilder calls the equivalent setup via `$router->middleware()` and `$router->aliasMiddleware()` directly.

## Patterns
- **Strangler Fig Pattern**: Old kernel class remains while new config is assembled alongside it. Removal is the final step.
- **Bridge Pattern**: `syncMiddlewareToRouter()` bridges kernel property configuration to the Router's internal state.
- **Adapter Pattern**: The BC layer adapts the legacy kernel class interface to the new ApplicationBuilder interface.
- **Decorator Pattern**: `withMiddleware()` decorates the Middleware configuration singleton, adding user middleware on top of framework defaults.

## Architectural Decisions
- **BC-First Approach**: The framework prioritizes backward compatibility — existing Laravel 10 apps upgrade without code changes. The migration is optional (but recommended) in Laravel 11.
- **Property to Method Call**: The shift from class properties (declarative) to method calls (imperative) enables IDE autocompletion, static analysis, and runtime conditionals in middleware configuration.
- **Single Responsibility**: `bootstrap/app.php` becomes the single source of truth for bootstrap configuration, separating concerns from the application-layer service providers.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Incremental migration — old kernel files still work | Dual configuration (kernel + ApplicationBuilder) can conflict | Must verify middleware isn't duplicated during migration |
| ApplicationBuilder provides autocomplete and validation | New API surface must be learned | Teams may prefer familiar array property syntax |
| Removal of boilerplate in new projects | Manual migration for existing projects | Legacy apps with heavy middleware customization require careful mapping |
| BC detection handles most edge cases | BC detection adds complexity to kernel construction | edge cases (e.g., custom kernel constructor) may break migration |
| Migration can be verified step by step | Each step requires testing and deployment | Rollback is possible by restoring kernel files |

## Performance Considerations
- **No runtime impact**: The migration produces identical internal state — there is zero performance difference between kernel property config and ApplicationBuilder config.
- **BC detection overhead**: `class_exists('App\Http\Kernel')` is a negligible autoloader check (microseconds).
- **Memory**: ApplicationBuilder pattern creates additional Intermediate Configuration objects during application construction, but these are short-lived (freed after bootstrap).

## Production Considerations
- **Test middleware configuration**: Before removing old kernel files, deploy with both configurations active and verify middleware behavior in a staging environment.
- **Audit service providers**: Search for `$kernel->pushMiddleware()` or `$kernel->prependMiddleware()` in all service providers — these must be converted to `Middleware::append()`/`prepend()` calls.
- **Container bindings**: Check for container bindings referencing `App\Http\Kernel::class` — replace with `\Illuminate\Contracts\Http\Kernel::class`.
- **Middleware priority**: If using `$middlewarePriority` in old kernel, this maps to `$middleware->priority()` in `withMiddleware()`.

## Common Mistakes
- **Duplicate middleware**: Adding middleware via `withMiddleware()` while old kernel property still defines it — results in the middleware running twice.
- **Missing import in bootstrap/app.php**: Forgetting `use Illuminate\Foundation\Configuration\Middleware;` in `bootstrap/app.php` causes a runtime "class not found" error.
- **Assuming route middleware migration is identical**: Route middleware aliases moved from `$routeMiddleware` property to `$middleware->alias()` method — the key-value format is the same but the API differs.
- **Skipping `->withRouting()`**: The ApplicationBuilder method `withRouting()` is separate from `withMiddleware()`. Route middleware relies on routing configuration — forgetting `withRouting()` breaks route model binding.
- **Removing kernel too early**: Removing `app/Http/Kernel.php` before `withMiddleware()` is fully configured causes the framework to use default middleware only — no custom middleware runs.

## Failure Modes
- **Silent middleware loss**: If `withMiddleware()` partially replicates kernel config (e.g., missing one middleware), there's no warning — the middleware simply doesn't run. Full test coverage is essential.
- **BC detection conflict**: If both `App\Http\Kernel` exists AND `withMiddleware()` is configured, Laravel merges both. The merge behavior is additive for arrays but may produce unexpected ordering.
- **Third-party package breakage**: Packages that call `$kernel->pushMiddleware()` in their service providers work with old kernel but silently fail (no-op) if kernel class uses ApplicationBuilder config. This is a known issue — use `Middleware` configuration class instead.

## Ecosystem Usage
- **First-party packages**: Laravel's own packages (Horizon, Telescope) were updated in Laravel 11 to use `Middleware` configuration class instead of `$kernel->pushMiddleware()`.
- **Third-party packages**: Popular packages (Spatie, Bugsnag, Sentry) now provide migration snippets. Many include automatic version detection via `class_exists()`.
- **Application code**: Internal packages shared across Laravel 10 and 11+ apps should use `\Illuminate\Contracts\Http\Kernel` type hints and check for `withMiddleware()` availability.

## Related Knowledge Units

### Prerequisites
- **HTTP Kernel Internals** — understanding the pipeline and middleware arrays being migrated
- **Console Kernel Internals** — the console counterpart with command and schedule registration
- **Kernel Version Evolution** — why and how the kernel architecture changed across versions

### Related Topics
- **Laravel Upgrade Guide (10→11)** — official framework upgrade documentation and changelog
- **Application Skeleton** — how `bootstrap/app.php` serves as the new configuration entry point
- **Middleware Internals** — how middleware priority, groups, and aliases are configured in both formats

### Advanced Follow-up Topics
- **ApplicationBuilder Internals** — deep dive into `withMiddleware()`, `withCommands()`, and `withSchedule()` implementation
- **Multi-Version Package Development** — building packages compatible with both pre-11 and post-11 kernel patterns
- **Custom Kernel Implementation** — when and how to implement a custom kernel outside the framework default

## Research Notes
* **Source Analysis:** The BC detection logic is in multiple locations — `Illuminate\Foundation\Application::registerCoreContainerAliases()` (checks for `App\Http\Kernel`), `Illuminate\Foundation\Configuration\ApplicationBuilder` (collects middleware config), and `Illuminate\Foundation\Http\Kernel` constructor (reads middleware from kernel class or container).
* **Key Insight:** The migration from kernel property to ApplicationBuilder is not just syntactic — `withMiddleware()` offers new capabilities (e.g., `$middleware->remove()` to remove framework default middleware like `VerifyCsrfToken`). This was difficult in the old kernel property approach.
* **Version-Specific Notes:** Laravel 10.43+ backported `withMiddleware()` support — enabling pre-migration before upgrading to Laravel 11. This is the recommended migration path: migrate middleware config in Laravel 10, then upgrade to Laravel 11 and remove the kernel file.
