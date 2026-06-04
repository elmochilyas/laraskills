# ECC Standardized Knowledge — Laravel 11 vs 10 Middleware Registration

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Middleware System |
| **Knowledge Unit** | Laravel 11 vs 10 Middleware Registration |
| **Difficulty** | Intermediate |
| **Category** | HTTP Pipeline — Middleware |
| **Last Updated** | 2026-06-02 |

---

## Overview

Laravel 11 fundamentally changed how middleware is registered, moving from a class-based configuration in `app/Http/Kernel.php` to a fluent functional API in `bootstrap/app.php`. The `Kernel.php` class was removed entirely, along with its `$middleware`, `$middlewareGroups`, `$routeMiddleware`, and `$middlewarePriority` array properties. The base Controller's `middleware()` method was also removed, replaced by the `HasMiddleware` interface and `#[Middleware]` attribute.

The engineering significance of this change is that middleware registration is now centralized in the application's bootstrap file alongside routing and exception configuration. The fluent API is more discoverable and composable than class property arrays. However, the change introduced significant migration effort, package compatibility issues, and community confusion (40,000+ Stack Overflow views on Laravel 11 middleware registration).

---

## Core Concepts

### The Fundamental Shift

| Aspect | Laravel 10 | Laravel 11+ |
|--------|-----------|-------------|
| Registration file | `app/Http/Kernel.php` | `bootstrap/app.php` |
| API style | Class property arrays | Fluent method calls |
| Registration mechanism | Extend `HttpKernel`, override properties | Configure via `->withMiddleware()` |
| Controller middleware | `$this->middleware()` in constructor | `HasMiddleware` interface or `#[Middleware]` attribute |
| Global middleware | `protected $middleware = [...]` | `$middleware->append([...])` |
| Middleware aliases | `protected $routeMiddleware = [...]` | `$middleware->alias([...])` |
| Middleware groups | `protected $middlewareGroups = [...]` | `$middleware->group('name', [...])` |
| Middleware priority | `protected $middlewarePriority = [...]` | `$middleware->priority([...])` |

### bootstrap/app.php as Hub

`bootstrap/app.php` is the single entry point for application configuration. The `withMiddleware` closure receives an `Illuminate\Foundation\Configuration\Middleware` object that provides fluent methods for `append`, `prepend`, `use`, `alias`, `group`, `priority`, `web`, and `api` configuration.

### Backward Compatibility

Laravel 11 maintains backward compatibility — the old `app/Http/Kernel.php` still works if it exists. The upgrade guide explicitly recommends NOT migrating the application structure when upgrading from Laravel 10. The old way continues to work; new applications use the new way.

### HasMiddleware Interface

Replaces the base Controller's `middleware()` constructor method. Controllers implement `HasMiddleware` and define a static `middleware()` method returning an array of `Middleware` objects. Alternative: use the `#[Middleware]` PHP 8 attribute on controller methods.

---

## When To Use

- **Laravel 11+ fluent API** for new Laravel applications — `bootstrap/app.php` with `->withMiddleware()`.
- **Laravel 10 Kernel.php** for existing Laravel 10 applications that have been upgraded — the upgrade guide recommends NOT migrating the application structure.
- **HasMiddleware interface** for controller-level middleware in Laravel 11+ — replaces `$this->middleware()` in constructor.
- **#[Middleware] attribute** for per-method middleware configuration on controllers.
- **Router service provider methods** (`$router->aliasMiddleware()`, `$router->middlewareGroup()`) for packages — these work in both Laravel 10 and 11.

---

## When NOT To Use

- Do NOT attempt to migrate Laravel 10 Kernel.php to Laravel 11 bootstrap/app.php during an upgrade — the old Kernel.php continues to work.
- Do NOT use `$this->middleware()` in controller constructors in Laravel 11 — the base Controller no longer has this method. Use `HasMiddleware` or `#[Middleware]`.
- Do NOT use `$middleware->group('web', [...])` for full replacement of the web group unless you are explicitly overriding all defaults — use `$middleware->web(append: [...])` for additions.
- Do NOT access the `Middleware` configuration object from a service provider — it is only available inside the `withMiddleware` closure.

---

## Best Practices (WHY)

- **Use `$router->aliasMiddleware()` in package service providers.** This works in both Laravel 10 and 11 without modification. Packages should not depend on `Kernel.php` or `bootstrap/app.php`.
- **Use group modification (`append`/`prepend`/`remove`) instead of full group replacement.** `$middleware->web(remove: [...])` keeps default group contents while making targeted changes. Full replacement requires including all default middleware explicitly.
- **Implement `HasMiddleware` for controller middleware.** The interface provides a static middleware definition that avoids instantiating the controller just to read middleware configuration. Works in both Laravel 10 (if controller extends `Controller`) and Laravel 11+.
- **Use conditional registration inside the closure.** The fluent API supports conditionals: `if (config('app.env') === 'production') { $middleware->append(...) }`. This was not possible with the property array approach.
- **Document group modifications explicitly.** Group modifications (`$middleware->web(append: [...])`) are less visible than explicit group definitions. Document all modifications.

---

## Architecture Guidelines

- **Laravel 10 registration:** `App\Http\Kernel extends HttpKernel`. Properties: `$middleware` (global), `$middlewareGroups`, `$routeMiddleware`, `$middlewarePriority`.
- **Laravel 11+ registration:** `bootstrap/app.php` → `->withMiddleware(function (Middleware $middleware) { ... })`. Fluent methods: `append`, `prepend`, `use`, `alias`, `group`, `priority`.
- **Global middleware (Laravel 11+):** `$middleware->append(...)`, `$middleware->prepend(...)`, `$middleware->use([...])` (replace entire stack).
- **Aliases (Laravel 11+):** `$middleware->alias(['custom' => CustomMiddleware::class])`.
- **Groups (Laravel 11+):** `$middleware->group('name', [...])` (full definition), `$middleware->web(append: [...])` (modification).
- **Priority (Laravel 11+):** `$middleware->priority([...])` (full replace). Laravel 12+: `prependToPriorityList`, `appendToPriorityList`.
- **Controller middleware (Laravel 11+):** Implement `HasMiddleware` → define `public static function middleware(): array` returning `Middleware` objects. Or use `#[Middleware('auth')]` attribute.
- **Package registration:** Use `$router->aliasMiddleware()` and `$router->middlewareGroup()` in service providers (works in both versions).

---

## Performance

The change from class properties to fluent API has zero impact on request-time performance. Configuration is resolved at application bootstrap, cached, and used at request time through the same internal `Kernel` mechanisms. Both approaches are cached by `php artisan optimize`. The fluent API is a compile-time abstraction, not a runtime abstraction.

---

## Security

The `HasMiddleware` interface improves security by making controller middleware static and discoverable. Unlike `$this->middleware()` in the constructor (which could be conditional or dynamic), the static `middleware()` method returns a fixed array. This makes middleware configuration more predictable. The `#[Middleware]` attribute provides compile-time visibility into which middleware applies to which controller method, improving auditability.

---

## Common Mistakes

- **Using `->configure()` instead of `->alias()`.** The `configure()` method does not exist on the `Middleware` object. Use `$middleware->alias('custom', CustomMiddleware::class)`.
- **Forgetting to use `append`/`prepend` instead of array assignment.** In Laravel 11+, `$middleware = [Custom::class]` inside the closure creates a local variable instead of configuring the middleware stack.
- **Not using HasMiddleware for controller middleware.** In Laravel 11, the base Controller does not have a `middleware()` method. Controllers using `$this->middleware()` will fail unless they use `HasMiddleware` or `#[Middleware]`.
- **Removing default groups entirely.** Overriding a group with `$middleware->group('web', [...])` replaces the entire group. If critical middleware (session, CSRF) is omitted, web routes lose protection.
- **Mixed registration models without testing.** An upgraded application uses both `Kernel.php` (existing) and `bootstrap/app.php` (new additions). The merging behavior is not well documented — test thoroughly.

---

## Anti-Patterns

- **Full group replacement instead of modification.** `$middleware->group('web', ['auth'])` replaces the entire web group, losing session, CSRF, and all default middleware. Use `$middleware->web(append: ['auth'])` instead.
- **Using `$this->middleware()` in Laravel 11.** The base Controller's `middleware()` method was removed. Using it causes a fatal error. Implement `HasMiddleware` instead.
- **Trying to access Middleware config object from a service provider.** The `Middleware` object is only available inside the `withMiddleware` closure. Packages must use `$router->aliasMiddleware()` instead.
- **Not re-running `route:cache` after middleware changes.** Middleware parameter changes (like rate limit numbers) require `route:cache` rebuild. The old values persist in the cache.

---

## Examples

### Laravel 11+ Fluent API
```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Global
        $middleware->append(\App\Http\Middleware\RequestId::class);

        // Aliases
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);

        // Groups
        $middleware->group('admin', ['auth', 'verified', 'role:admin']);

        // Group modification
        $middleware->web(append: [
            \App\Http\Middleware\SetLocale::class,
        ]);

        // Priority
        $middleware->priority([
            \App\Http\Middleware\RequestId::class,
            // ... full priority list
        ]);
    })
    ->create();
```

### Laravel 10 Kernel.php
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
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \App\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],
        'api' => ['throttle:api', \Illuminate\Routing\Middleware\SubstituteBindings::class],
    ];

    protected $routeMiddleware = [
        'auth' => \Illuminate\Auth\Middleware\Authenticate::class,
        'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
    ];
}
```

### HasMiddleware (Laravel 11+)
```php
class UserController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('auth', except: ['index', 'show']),
            new Middleware('verified', only: ['edit', 'update']),
        ];
    }
}
```

### #[Middleware] Attribute
```php
class UserController extends Controller
{
    #[Middleware('auth', except: ['index', 'show'])]
    public function index(): View { ... }

    #[Middleware('verified', only: ['edit', 'update'])]
    public function edit(): View { ... }
}
```

### Package Registration (Cross-Version)
```php
public function boot(): void
{
    $router = $this->app['router'];
    $router->aliasMiddleware('role', RoleMiddleware::class);
    $router->middlewareGroup('admin', [RoleMiddleware::class]);
}
```

---

## Related Topics

- **Middleware Fundamentals** (prerequisite) — understanding what middleware is and how it works.
- **Global, Route Group, and Route Middleware** (prerequisite) — the three registration tiers.
- **Controller Middleware** — controller-level middleware registration.
- **Custom Middleware** — creating middleware that needs to be registered.
- **Middleware Ordering and Priority** — how priority registration changes between versions.
- **Cross-Cutting Concerns** — deciding which middleware to register at which tier.
- **Application Bootstrapping** — how bootstrap/app.php configures the application.
- **Service Provider Registration** — how packages register middleware across versions.
- **Upgrade Guide** — migrating from Laravel 10 to 11.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** Middleware Fundamentals (prerequisite). Serves as prerequisite for upgrading between versions.
- **The removal of Kernel.php** was one of the most discussed changes in Laravel 11's release (February 2024).
- **Backward compatibility:** Old Kernel.php continues to work in Laravel 11. Do NOT migrate 10→11 application structure.
- **HasMiddleware** replaces `$this->middleware()` in the controller constructor. The old method was removed in Laravel 11.
- **Group modification** (`$middleware->web(append: [...])`) replaced full group array redefinition.
- **Stack Overflow:** 40,000+ views on Laravel 11 middleware registration questions in the first year.
- **Package compatibility:** Use `$router->aliasMiddleware()` in service providers — works in both versions.

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| Fundamental shift explained | ✓ |
| When to use / when NOT to use | ✓ |
| Best practices with rationale | ✓ |
| Both registration models documented | ✓ |
| Performance analysis | ✓ |
| Security implications documented | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples for both versions | ✓ |
| Related topics mapped | ✓ |
