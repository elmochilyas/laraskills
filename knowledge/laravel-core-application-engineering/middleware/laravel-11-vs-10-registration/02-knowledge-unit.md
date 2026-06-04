# Laravel 11 vs 10 Middleware Registration

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Middleware System
- **Knowledge Unit:** Laravel 11 vs 10 Middleware Registration
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Laravel 11 fundamentally changed how middleware is registered, moving from a class-based configuration in `app/Http/Kernel.php` to a fluent functional API in `bootstrap/app.php`. The `Kernel.php` class was removed entirely, along with its `$middleware`, `$middlewareGroups`, `$routeMiddleware`, and `$middlewarePriority` array properties. The base Controller's `middleware()` method was also removed, replaced by the `HasMiddleware` interface and `#[Middleware]` attribute.

The engineering significance of this change is that middleware registration is now centralized in the application's bootstrap file alongside routing and exception configuration. The fluent API (`->withMiddleware()`) is more discoverable and composable than class property arrays. However, the change introduced significant migration effort, package compatibility issues, and community confusion (40,000+ Stack Overflow views on Laravel 11 middleware registration). Understanding both registration models is essential for maintaining Laravel 10 applications and developing packages that support both versions.

---

## Core Concepts

### The Fundamental Shift
| Aspect | Laravel 10 (and earlier) | Laravel 11+ |
|--------|-------------------------|-------------|
| Registration file | `app/Http/Kernel.php` | `bootstrap/app.php` |
| API style | Class property arrays | Fluent method calls |
| Registration mechanism | Extend `HttpKernel`, override properties | Configure via `->withMiddleware()` |
| Controller middleware | `$this->middleware()` in constructor (extends `Controller`) | `HasMiddleware` interface or `#[Middleware]` attribute |
| Global middleware | `protected $middleware = [...]` | `$middleware->append([...])` |
| Middleware aliases | `protected $routeMiddleware = [...]` | `$middleware->alias([...])` |
| Middleware groups | `protected $middlewareGroups = [...]` | `$middleware->group('name', [...])` |
| Middleware priority | `protected $middlewarePriority = [...]` | `$middleware->priority([...])` |
| Default framework middleware | Defined in parent `HttpKernel` | Defined internally, accessible via `$middleware` object |

### The bootstrap/app.php Hub
In Laravel 11+, `bootstrap/app.php` is the single entry point for application configuration:

```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // All middleware configuration here
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Exception handling configuration here
    })->create();
```

The `withMiddleware` closure receives an `Illuminate\Foundation\Configuration\Middleware` object that provides all the fluent methods for configuring middleware.

### Backward Compatibility
Laravel 11 maintains backward compatibility: the old `app/Http/Kernel.php` still works if it exists. The upgrade guide explicitly states: "We do NOT recommend that Laravel 10 applications upgrading to Laravel 11 attempt to migrate their application structure." The old way continues to work, but new applications use the new way.

---

## Mental Models

### From Configuration to Configuration Function
Laravel 10's approach was declarative (property arrays describe the configuration). Laravel 11's approach is procedural (a function configures the application). The procedural approach provides more flexibility — conditionals, loops, and helper calls are possible inside the closure.

### From Class Inheritance to Composition
Laravel 10's `Kernel extends HttpKernel` used class inheritance to inherit default middleware and override specific properties. Laravel 11's `->withMiddleware()` uses composition — the application calls methods on a configuration object. The default middleware is applied behind the scenes; the application modifies it through the configuration API.

### From Single Responsibility to Bootstrap Hub
Laravel 10 had separate files for different responsibilities: `Kernel.php` for middleware, `Exceptions/Handler.php` for exceptions, `RouteServiceProvider.php` for routing. Laravel 11 consolidates these into `bootstrap/app.php` with separate `with*()` methods.

---

## Internal Mechanics

### Laravel 10 Kernel.php Structure
The Kernel class inherits from `Illuminate\Foundation\Http\Kernel` and overrides properties:

```php
namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    protected $middleware = [
        \App\Http\Middleware\TrustProxies::class,
        \Illuminate\Http\Middleware\HandleCors::class,
        \App\Http\Middleware\PreventRequestsDuringMaintenance::class,
        \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
        \App\Http\Middleware\TrimStrings::class,
        \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
    ];

    protected $middlewareGroups = [
        'web' => [
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \App\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],
        'api' => [
            'throttle:api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],
    ];

    protected $routeMiddleware = [
        'auth' => \Illuminate\Auth\Middleware\Authenticate::class,
        'auth.basic' => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
        'cache.headers' => \Illuminate\Http\Middleware\SetCacheHeaders::class,
        'can' => \Illuminate\Auth\Middleware\Authorize::class,
        'guest' => \App\Http\Middleware\RedirectIfAuthenticated::class,
        'password.confirm' => \Illuminate\Auth\Middleware\RequirePassword::class,
        'signed' => \Illuminate\Routing\Middleware\ValidateSignature::class,
        'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
        'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
    ];

    protected $middlewarePriority = [
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\Auth\Middleware\Authenticate::class,
        \Illuminate\Auth\Middleware\Authorize::class,
        // ...
    ];
}
```

The `HttpKernel` parent class's constructor reads these properties and registers the middleware with the router.

### Laravel 11+ bootstrap/app.php Structure
The configuration object provides fluent methods:

```php
->withMiddleware(function (Middleware $middleware) {
    // === GLOBAL MIDDLEWARE ===
    $middleware->append(\App\Http\Middleware\CustomGlobal::class);
    $middleware->prepend(\App\Http\Middleware\BeforeAll::class);
    $middleware->use([...]); // Replace entire global stack
    
    // === ALIASES ===
    $middleware->alias([
        'custom' => \App\Http\Middleware\Custom::class,
        'role' => \App\Http\Middleware\CheckRole::class,
    ]);
    
    // === GROUPS ===
    $middleware->group('admin', [
        'auth',
        'verified',
        'can:access-admin',
    ]);
    
    // === PRIORITY ===
    $middleware->priority([
        \App\Http\Middleware\Custom::class,
        \Illuminate\Auth\Middleware\Authenticate::class,
    ]);
    
    // === GROUP MODIFICATION ===
    // Add to existing groups
    $middleware->web(append: [
        \App\Http\Middleware\AddToWeb::class,
    ]);
    
    $middleware->api(prepend: [
        \App\Http\Middleware\BeforeApi::class,
    ]);
    
    $middleware->web(remove: [
        \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
    ]);
    
    $middleware->web(replace: [
        \Illuminate\Cookie\Middleware\EncryptCookies::class
            => \App\Http\Middleware\CustomEncrypt::class,
    ]);
})
```

### The Middleware Configuration Object
The `Illuminate\Foundation\Configuration\Middleware` class provides the fluent API. Internally, it collects configuration and applies it to the Kernel after construction:

```php
class Middleware
{
    public function append(array|string $middleware, ?string $group = null): static
    public function prepend(array|string $middleware, ?string $group = null): static
    public function use(array $middleware): static
    public function alias(array $aliases): static
    public function group(string $group, array $middleware): static
    public function priority(array $priority): static
    
    // Group modification methods
    public function web(array $append = [], array $prepend = [], array $remove = [], array $replace = []): static
    public function api(array $append = [], array $prepend = [], array $remove = [], array $replace = []): static
    
    // Priority list manipulation (Laravel 12+)
    public function appendToPriorityList(string $before, string|array $prepend): static
    public function prependToPriorityList(string $before, string|array $prepend): static
}
```

### HasMiddleware Interface
Replaces the base Controller's `middleware()` constructor method:

```php
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class UserController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('auth', except: ['index', 'show']),
            new Middleware('verified', only: ['edit', 'update']),
            new Middleware('throttle:10,1', only: ['store']),
        ];
    }
}
```

### #[Middleware] Attribute
PHP 8 attribute alternative:

```php
use Illuminate\Routing\Controllers\Middleware;

class UserController extends Controller
{
    #[Middleware('auth', except: ['index', 'show'])]
    #[Middleware('verified', only: ['edit', 'update'])]
    public function index(): View { ... }
}
```

---

## Patterns

### Conditional Middleware Registration Pattern
In Laravel 11+, middleware registration can use conditionals inside the closure:

```php
->withMiddleware(function (Middleware $middleware) {
    if (config('app.env') === 'production') {
        $middleware->append(SecurityHeadersMiddleware::class);
    }
    
    if (config('app.features.api')) {
        $middleware->api(append: [ApiVersionMiddleware::class]);
    }
})
```

- **Purpose**: Register middleware conditionally based on environment or configuration.
- **Benefits**: No need for service provider logic — registration logic is co-located in the configuration.
- **Tradeoffs**: The condition is evaluated once at application bootstrap, not per-request.

### Group Modification Pattern (Laravel 11+)
Modify default groups without redefining them:

```php
$middleware->web(remove: [
    \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
]);
```

- **Purpose**: Disable CSRF for specific cases without redefining the entire `web` group.
- **Benefits**: Default group contents are inherited from the framework; modifications are minimal.
- **Tradeoffs**: Modifications are harder to discover than explicit group definitions.

### Complete Group Replacement Pattern
Replace an entire group definition:

```php
$middleware->group('api', [
    'throttle:200,1',
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
    \App\Http\Middleware\ForceJson::class,
]);
```

- **Purpose**: Define a custom group from scratch.
- **Benefits**: Full control over group contents.
- **Tradeoffs**: Overrides the default group — must include all required middleware.

---

## Architectural Decisions

### Why the Change Was Made
The Laravel team made the change for several reasons:

1. **File reduction**: New Laravel 11 apps ship with ~50% fewer files. The `Kernel.php` was one of the removed files.
2. **Centralized configuration**: All application bootstrapping is now in `bootstrap/app.php` — routing, middleware, exceptions, and service providers.
3. **Fluent discoverability**: The `->withMiddleware()` API is more discoverable than class properties. Developers can see all available methods via IDE autocompletion.
4. **Composability**: The fluent API allows method chaining and conditional registration, which property arrays did not support.

### Why Kernel.php Was Removed, Not Deprecated
Removing `Kernel.php` entirely (rather than deprecating it) was a deliberate choice to simplify the framework structure. The old class-based approach is still supported for upgraded applications, but new applications never create a `Kernel.php`.

### HasMiddleware vs Constructor Method
The `HasMiddleware` interface was introduced because the base Controller's `middleware()` method was removed (the base Controller in Laravel 11 no longer extends `Illuminate\Routing\Controller`). The interface provides a static middleware definition, which avoids instantiating the controller just to read middleware configuration.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Fluent API is more discoverable than property arrays | Different API between Laravel 10 and 11 | Package authors must support both APIs |
| Centralized bootstrap configuration | Configuration file can become large | Use middleware groups to keep configuration organized |
| Group modification without redefinition | Modifications are less visible than explicit lists | Document all group modifications explicitly |
| HasMiddleware is static — no instantiation needed | Requires learning a new interface | Document the interface for the team |
| Backward compatible — old Kernel.php still works | Two ways to do the same thing creates confusion | Upgrade guide recommends NOT migrating 10→11 structure |

---

## Performance Considerations

### No Performance Difference
The change from class properties to fluent API has zero impact on request-time performance. The configuration is resolved at application bootstrap, cached, and used at request time through the same internal `Kernel` mechanisms. The fluent API is a compile-time abstraction, not a runtime abstraction.

### Bootstrap Cache Impact
Both approaches are cached by `php artisan optimize`. The cached configuration is compiled into a cached container, so there is no performance penalty for either approach at request time.

---

## Production Considerations

### Upgrading from Laravel 10 to 11
The official upgrade guide recommends:
1. Do NOT migrate `Kernel.php` to `bootstrap/app.php` if the application works.
2. The old `Kernel.php` continues to work indefinitely (Laravel 11 maintains backward compatibility).
3. Only new middleware additions should use the new API (by modifying the Middleware configuration from a service provider).
4. Full migration to the new API is optional and should only be done if there is a specific benefit.

### Package Compatibility
Packages that register middleware via service providers must work with both registration models:

```php
// Works in both Laravel 10 and 11
public function boot(): void
{
    $router = $this->app['router'];
    $router->aliasMiddleware('role', RoleMiddleware::class);
    $router->middlewareGroup('admin', [RoleMiddleware::class]);
}
```

The `$router->aliasMiddleware()` and `$router->middlewareGroup()` methods work in both versions. Packages should use these methods rather than modifying `Kernel.php` or `bootstrap/app.php`.

### HasMiddleware for Packages
Packages that provide controllers should implement `HasMiddleware` for compatibility:

```php
class PackageController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('auth'),
            new Middleware('package:configured'),
        ];
    }
}
```

This ensures middleware works in both Laravel 10 (if controller extends `Controller`) and Laravel 11+.

---

## Common Mistakes

### Using `->configure()` Instead of `->alias()`
A common error in Laravel 11+ middleware registration:

```php
// WRONG
$middleware->configure('custom', CustomMiddleware::class);

// RIGHT
$middleware->alias('custom', CustomMiddleware::class);
```

The `configure()` method does not exist on the `Middleware` object. This error appears frequently in Stack Overflow questions about Laravel 11 middleware.

### Forgetting to Use `append`/`prepend` Instead of Array Assignment
In Laravel 10, global middleware was assigned directly: `protected $middleware = [...]`. In Laravel 11+, it is `$middleware->append(...)` or `$middleware->prepend(...)`. Using array assignment inside the closure creates a local variable instead of configuring the middleware stack.

### Not Using HasMiddleware for Controller Middleware
In Laravel 11, the base Controller does not have a `middleware()` method. Controllers that rely on `$this->middleware()` in the constructor will fail unless they either extend `Illuminate\Routing\Controller` or use `HasMiddleware`/`#[Middleware]`.

### Removing Default Groups Entirely
Overriding a group with `$middleware->group('web', [...])` replaces the entire group definition. If the replacement omits critical middleware (session, CSRF), the web routes lose session and CSRF protection. Use group modification (`$middleware->web(append: [...])`) instead of full replacement when adding to default groups.

---

## Failure Modes

### Service Provider Middleware Registration in Laravel 11
Some package developers attempted to access the `Middleware` configuration object from a service provider and found it was not available at that point. The `Middleware` object is only available inside the `withMiddleware` closure. Packages must use `$router->aliasMiddleware()` instead.

### Mixed Registration Models
An upgraded application uses both `Kernel.php` (for existing configuration) and `bootstrap/app.php` `->withMiddleware()` (for new configuration). The two configurations are merged, but the merging behavior is not well documented. Testing middleware registration after upgrading is essential.

### HasMiddleware Not Detected
If a controller implements `HasMiddleware` but the middleware is not applied, check that:
1. The controller correctly returns an array of `Middleware` objects from `middleware()`.
2. The method is `public static`.
3. The routes are registered through the standard `Route::resource()` or `Route::controller()`.

---

## Ecosystem Usage

### Laravel Framework Packages
Laravel's own packages (Horizon, Telescope, Pulse) register middleware through service providers using `$router->aliasMiddleware()` and `$router->middlewareGroup()`. They do not depend on `Kernel.php` or `bootstrap/app.php`.

### Spatie Packages
Spatie's packages register middleware aliases in their service providers:

```php
public function boot(): void
{
    $router = $this->app['router'];
    $router->aliasMiddleware('role', RoleMiddleware::class);
    $router->aliasMiddleware('permission', PermissionMiddleware::class);
}
```

This approach works in both Laravel 10 and 11 without modification.

### Community Packages
Many community packages that provided middleware registration instructions for `app/Http/Kernel.php` (Laravel 10) updated their documentation for Laravel 11 to use `bootstrap/app.php`. The transition period (2023-2024) saw significant community confusion as documentation was updated piecemeal.

---

## Related Knowledge Units

### Prerequisites
- Middleware Fundamentals — understanding what middleware is and how it works
- Global, Route Group, and Route Middleware — the three registration tiers
- Controller Middleware — controller-level middleware registration

### Related Topics
- Custom Middleware — creating middleware that needs to be registered
- Middleware Ordering and Priority — how priority registration changes between versions
- Cross-Cutting Concerns — deciding which middleware to register at which tier

### Advanced Follow-up Topics
- Application Bootstrapping — how bootstrap/app.php configures the application
- Service Provider Registration — how packages register middleware across versions
- Upgrade Guide — migrating from Laravel 10 to 11

---

## Research Notes

- The removal of `Kernel.php` was announced in Laravel 11's release (February 2024) and was one of the most discussed changes. The community response was mixed — some praised the simplification, others criticized the migration burden.
- Stack Overflow accumulated over 40,000 views for Laravel 11 middleware registration questions within the first year of release. The most common questions were about the new syntax for aliases, global middleware, and controller middleware.
- The `HasMiddleware` interface was added in Laravel 11.0 and was refined in Laravel 11.5 to support the `#[Middleware]` attribute. The attribute form was added to provide a more expressive alternative to the interface.
- In Laravel 12, the `appendToPriorityList` and `prependToPriorityList` methods were added to the `Middleware` configuration object. These methods allow inserting middleware into the priority list without replacing the entire array.
- As of Laravel 13, the old `Kernel.php` approach is still supported but undocumented in the official installation guide. The official documentation exclusively covers the `bootstrap/app.php` approach.