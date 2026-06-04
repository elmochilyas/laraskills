# Middleware Configuration in Bootstrap

## Metadata
- **ID:** ku-13-pipeline-testing
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **Last Updated:** 2026-06-02

## Overview
In Laravel 11+, middleware configuration moved from the `App\Http\Kernel` class to `bootstrap/app.php` using a dedicated `Middleware` configuration object. This change centralizes application configuration in the bootstrap file, aligning with Laravel's "no-kernel" simplification. Developers use the `->withMiddleware()` method on the Application instance to register middleware aliases, groups, priority, global middleware, and invokable middleware classes.

## Core Concepts
- **`withMiddleware()` Callback**: Receives an `Illuminate\Foundation\Configuration\Middleware` instance with methods for all middleware configuration.
- **`append()` / `prepend()`**: Add middleware to the global stack — at the end or beginning.
- **`group()`**: Define or modify middleware groups (`web`, `api`, custom). Supports `append`, `prepend`, `remove`.
- **`alias()`**: Register middleware aliases for use in route definitions.
- **`priority()`**: Set the middleware priority array for cross-source ordering.
- **`replace()`**: Swap an existing middleware with a custom implementation without editing group arrays.
- **`remove()`**: Remove middleware from specific groups or the global stack.
- **`use()`**: Apply sensible defaults (web + api groups).

## When To Use
- **Laravel 11+ projects**: Default configuration approach — always use `withMiddleware()`.
- **Migrating from Laravel 10**: Replace kernel property configuration with `withMiddleware()` calls.
- **Custom middleware registration**: Register aliases, groups, priority, global middleware all in one place.
- **Middleware customization**: Remove or replace framework default middleware.
- **Invokable middleware**: Register single-action middleware without creating a full class.

## When NOT To Use
- **Laravel <11 projects**: Use kernel properties (`$middleware`, `$middlewareGroups`, `$routeMiddleware`) instead.
- **Kernel-based hybrid approach**: Don't split configuration between kernel and `bootstrap/app.php` — use one or the other.
- **Package middleware**: Package service providers still register middleware via `$kernel->pushMiddleware()` or container bindings — ApplicationBuilder is for application-level config.

## Best Practices (WHY)
- **Use `replace()` instead of `remove()` + `append()`**: Replaces a middleware in all groups without manual group editing. *Why: `replace()` handles group membership automatically — `remove()` + `append()` requires knowing every group the middleware is in.*
- **Keep `withMiddleware()` focused on middleware concerns**: Don't mix middleware config with routing, exceptions, or other bootstrap concerns. *Why: `bootstrap/app.php` configures multiple concerns — keeping them separated by method improves readability.*
- **Use `remove()` explicitly rather than `replace()` for deletion**: If you want to remove a default middleware entirely, `remove()` is clearer than replacing with an empty class. *Why: `remove()` makes intent obvious; replacing with an empty class obscures what's happening.*
- **Cache configuration after changes**: `php artisan optimize` caches middleware configuration. Update cache after any `bootstrap/app.php` changes. *Why: Without re-caching, configuration changes may not take effect in production.*

## Architecture Guidelines
- **Centralized configuration**: All middleware setup in one file, not spread across Kernel properties and methods.
- **Builder Pattern**: `Middleware` object uses method chaining to build configuration state.
- **Invokable Registry**: Single-action middleware can be registered without a full class.
- **Replaces kernel property approach**: `$middleware`, `$middlewareGroups`, `$routeMiddleware` → `withMiddleware()` methods.
- **Method-based over property-based**: Methods provide IDE autocompletion, discoverability, and fluent configuration.

## Performance
- **One-time processing**: Configuration in `bootstrap/app.php` is processed once during application bootstrap.
- **Cached with optimize**: Configuration is cached when `php artisan optimize` runs.
- **No per-request overhead**: Centralized configuration approach introduces zero per-request cost.
- **Invokable middleware**: Registered just like class middleware — no additional overhead.

## Security
- **Kernel-based configuration ignored**: In Laravel 11, `$middleware` and `$routeMiddleware` on Kernel are not read — old configuration silently has no effect.
- **`replace()` target not found**: If the middleware class to replace is not in the active stack, `replace()` silently does nothing.
- **Missing `use` import**: Forgetting `use Illuminate\Foundation\Configuration\Middleware;` in `bootstrap/app.php` causes runtime error.
- **Method chaining order**: Some methods must be called in specific order — though the API attempts to be order-independent.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Editing App\Http\Kernel in Laravel 11 | Migrating from Laravel 10 habits | Middleware config has no effect | Use withMiddleware() in bootstrap/app.php |
| Forgetting use statement | Copy-paste without checking imports | Runtime "class not found" error | Always add import |
| Using append/prepend incorrectly | Not understanding the group context | Middleware added to wrong place | Use group-specific methods: `$middleware->web(append: [...])` |
| Not re-caching after changes | Config cached from previous state | Stale middleware configuration | Run `php artisan optimize` after changes |

## Anti-Patterns
- **Hybrid configuration**: Splitting middleware config between old kernel properties and new `withMiddleware()`. Use one approach consistently.
- **Over-engineering `withMiddleware()`**: Chaining dozens of method calls that could be simplified with groups and sensible defaults.
- **Not using `use()` for defaults**: Manually defining web and api groups when `use()` applies defaults automatically.
- **`replace()` for every customization**: Using `replace()` when a simple `append()` to the group would suffice.

## Examples

```php
// bootstrap/app.php — Laravel 11+ middleware configuration
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Global middleware
        $middleware->append(\App\Http\Middleware\TrustProxies::class);
        $middleware->prepend(\App\Http\Middleware\ForceHttps::class);
        
        // Groups
        $middleware->web(append: [
            \App\Http\Middleware\Localize::class,
        ]);
        $middleware->api(prepend: [
            'throttle:100,1',
        ]);
        $middleware->group('admin', [
            'auth',
            'verified',
            \App\Http\Middleware\LogAdminActions::class,
        ]);
        
        // Aliases
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
            'team' => \App\Http\Middleware\VerifyTeam::class,
        ]);
        
        // Priority
        $middleware->priority([
            \App\Http\Middleware\Localize::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);
        
        // Replace default middleware
        $middleware->replace(
            \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
            \App\Http\Middleware\CustomCsrf::class
        );
        
        // Remove middleware
        $middleware->remove(\Illuminate\Session\Middleware\StartSession::class);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Exception configuration
    })
    ->create();
```

## Related Topics
- **Pipeline Pattern Fundamentals**: What is being configured.
- **Global Middleware Stack**: Global stack configuration.
- **Middleware Groups**: Group definition configuration.
- **Application Bootstrap**: `bootstrap/app.php` role in application setup.
- **Middleware Aliases**: Alias registration via `Middleware::alias()`.

## AI Agent Notes
- `Illuminate\Foundation\Configuration\Middleware` is a fluent configuration class. Each method mutates internal state (arrays of aliases, groups, priority, etc.).
- When the application boots, these configurations are transferred to the Kernel (or equivalent internal structure) for use during request handling.
- The `Middleware` configuration object is part of a larger Laravel 11 initiative to replace Kernel property configuration with centralized bootstrap configuration.
- This is a Laravel 11+ feature. Backwards compatibility is provided for Kernel-based configuration in Laravel 10.

## Verification
- [ ] Set up middleware configuration in `bootstrap/app.php` using `->withMiddleware()`
- [ ] Register global middleware with `append()` and `prepend()` — verify execution order
- [ ] Define a custom `admin` group with its own middleware set
- [ ] Register aliases and use them in route definitions
- [ ] Use `replace()` to swap a framework middleware — verify the replacement runs
- [ ] Use `remove()` to strip unnecessary middleware — verify removal
- [ ] Run `php artisan optimize` and verify configuration is cached
