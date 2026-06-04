# Middleware Configuration in Bootstrap
## Metadata (Domain: Laravel Execution Lifecycle & Framework Internals, Subdomain: Middleware Pipeline, Last Updated: 2026-06-02)
## Executive Summary
In Laravel 11+, middleware configuration moved from the `App\Http\Kernel` class to `bootstrap/app.php` using a dedicated `Middleware` configuration object. This change centralizes application configuration in the bootstrap file, aligning with Laravel's "no-kernel" simplification. Developers use the `->withMiddleware()` method on the Application instance to register middleware aliases, groups, priority, global middleware, and invokable middleware classes.

## Core Concepts
The `withMiddleware()` callback receives an `Illuminate\Foundation\Configuration\Middleware` instance with methods for all middleware configuration: `append()`/`prepend()` for global middleware, `group()` for defining groups, `alias()` for aliases, `priority()` for ordering, `replace()` for swapping middleware, and `use()` for applying defaults. Invokable middleware classes (single-action middleware with `__invoke()`) can be registered directly. This replaces the property-based configuration on the Kernel class.

## Mental Models
**Central Control Panel:** `bootstrap/app.php` is the central control panel for the application. Middleware configuration is one of several panels you can adjust. The `Middleware` config object is the middleware-specific control panel.

**Constructor Arguments:** Instead of setting properties on a class, you call methods on a builder object. Like configuring a car by calling `->withSunroof()` instead of setting `$car->sunroof = true`.

## Internal Mechanics
`Illuminate\Foundation\Configuration\Middleware` is a fluent configuration class. Each method mutates internal state (arrays of aliases, groups, priority, etc.). When the application boots, these configurations are transferred to the Kernel (or equivalent internal structure) for use during request handling. The `use()` method applies sensible defaults. The `replace()` method swaps an existing middleware with a custom implementation without removing it from groups.

```php
// Laravel 11 bootstrap/app.php configuration
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'role' => \App\Http\Middleware\CheckRole::class,
        'log' => \App\Http\Middleware\LogRequests::class,
    ]);

    $middleware->group('admin', [
        'auth',
        'role:admin',
        \App\Http\Middleware\LogActions::class,
    ]);

    $middleware->priority([
        \App\Http\Middleware\CustomSession::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ]);

    $middleware->append(\App\Http\Middleware\TrustProxies::class);

    $middleware->replace(
        \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
        \App\Http\Middleware\CustomCsrf::class
    );
})
```

## Patterns
- **Builder Pattern:** The `Middleware` object uses method chaining to build configuration.
- **Centralized Configuration:** All middleware setup is in one file, not spread across Kernel methods.
- **Invokable Registry:** Single-action middleware can be registered without creating a full class.

## Architectural Decisions
The move to `bootstrap/app.php` in Laravel 11 was driven by a desire to simplify the application skeleton. The previous approach required developers to understand Kernel class properties, inheritance from the base Kernel, and which properties controlled what. The centralized `Middleware` configuration object provides IDE autocompletion, discoverability, and fluent configuration. The `replace()` method solves the common need to swap a default middleware without manually editing group arrays.

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Centralized, discoverable configuration | Existing Laravel 10 apps must migrate to new syntax | Migration guide needed for upgrades |
| IDE-friendly fluent API | Breaking change from property-based configuration | Old Kernel customizations stop working |
| Replace() avoids group array manipulation | One more API surface to learn | Simpler but adds cognitive load |
| Invokable middleware registration | Invokable middleware cannot use constructor DI for dependencies | Must use the handle() method for DI |

## Performance Considerations
Configuration in `bootstrap/app.php` is processed once during application bootstrap. The resulting configuration is cached when `php artisan optimize` runs. No per-request overhead is introduced by the centralized configuration approach.

## Production Considerations
Laravel 11's middleware configuration is cached as part of the optimized application. Changes to `bootstrap/app.php` require re-caching. For multi-tenant applications, middleware configuration can be set per-tenant by using a custom configuration provider.

## Common Mistakes
**Why it happens:** Developers migrating from Laravel 10 continue editing `App\Http\Kernel` which no longer exists or is ignored. **Why it's harmful:** Middleware configuration has no effect — the application uses framework defaults. **Better approach:** Move all middleware configuration to `bootstrap/app.php` using the `withMiddleware()` callback.

## Failure Modes
- **Kernel-based configuration ignored:** In Laravel 11, `$middleware` and `$routeMiddleware` properties on Kernel are not read.
- **Method chaining order:** Some methods must be called in a specific order (e.g., `use()` before customizations) but the API attempts to be order-independent.
- **Replace() target not found:** If the middleware class to replace is not in the active stack, `replace()` silently does nothing.

## Ecosystem Usage
- **Laravel Breeze (Laravel 11):** Configuration updated to use `withMiddleware()`.
- **Laravel Jetstream (Laravel 11):** Uses centralized middleware configuration for its authentication stack.
- **First-party packages:** Align to use `Middleware` configuration object for setup instructions.

## Related Knowledge Units
### Prerequisites
- Pipeline Pattern Fundamentals (what is being configured)
- Global Middleware Stack (global stack configuration)
- Middleware Groups (group definition configuration)
- Application Bootstrap (bootstrap/app.php role in application setup)

### Related Topics
- Middleware Aliases (alias registration via Middleware::alias())
- Middleware Priority (priority definition via Middleware::priority())
- Middleware Groups (group definition via Middleware::group())

### Advanced Follow-up Topics
- Laravel 11 Application Bootstrap Internals (bootstrap/app.php architecture)
- Service Providers Migration (Laravel 10 to 11 configuration changes)
- Kernel Architecture (how Middleware config object transfers to Kernel state)
- Boot Order Timing (when middleware config is applied in boot sequence)

## Research Notes
**Source Analysis:** `Illuminate\Foundation\Configuration\Middleware` (vendor/laravel/framework/src/Illuminate/Foundation/Configuration/Middleware.php).
**Key Insight:** The `Middleware` configuration object is part of a larger Laravel 11 initiative to replace Kernel property configuration with centralized bootstrap configuration.
**Version-Specific Notes:** This is a Laravel 11+ feature. Backwards compatibility is provided for Kernel-based configuration in Laravel 10.
