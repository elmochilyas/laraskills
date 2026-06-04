# Anti-Patterns: Laravel 11 vs 10 Middleware Registration

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Middleware System |
| Knowledge Unit | Laravel 11 vs 10 Middleware Registration |
| Difficulty | Intermediate |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Full Group Replacement Instead of Modification | Architecture | Critical |
| 2 | Using `$this->middleware()` in Laravel 11 | Reliability | Critical |
| 3 | Trying to Access Middleware Config Object from Service Provider | Architecture | High |
| 4 | Not Re-running `route:cache` After Middleware Changes | Reliability | Medium |
| 5 | Migrating Kernel.php During Laravel 10→11 Upgrade | Maintenance | Medium |

---

## Anti-Pattern 1: Full Group Replacement Instead of Modification

### Category
Architecture

### Description
Using `$middleware->group('web', [...])` to add middleware to the web group, which replaces the entire group definition and loses all default middleware (session, CSRF, cookies).

### Why It Happens
The `group()` method looks like the right way to configure a middleware group. Developers coming from Laravel 10 are used to redefining the entire `$middlewareGroups['web']` array, and the `group()` method in Laravel 11 appears to be the equivalent.

### Warning Signs
- Web routes lose session functionality after a middleware configuration change
- CSRF token mismatch errors on all POST forms
- Cookies are not encrypted; session data is not persisted
- The `$middleware->group('web', [...])` call omits `EncryptCookies`, `StartSession`, or `ValidateCsrfToken`
- Forms work before a middleware change and break after

### Why Harmful
Full replacement of the web group removes critical middleware: session management (login state lost), CSRF protection (all POST requests fail), cookie encryption (cookies sent in plain text), and route model binding (Eloquent models not resolved). This breaks core Laravel functionality silently — there is no error, just non-functional features.

### Real-World Consequences
- Developer adds a custom middleware to the web group using full replacement
- `StartSession` is omitted, so login never persists across requests
- All users appear logged out after every request
- Debugging: check session driver, check cookie settings, check auth guard — none are the issue
- Root cause: `group('web', [...])` replaced everything, omitting session
- Fix takes 4 hours to identify; users affected for days

### Preferred Alternative
Use group modification methods (`append`, `prepend`, `remove`) instead of full group replacement.

```php
// Wrong: replaces entire web group, losing defaults
$middleware->group('web', [
    \App\Http\Middleware\SetLocale::class,
]);

// Correct: adds to existing web group without removing defaults
$middleware->web(append: [
    \App\Http\Middleware\SetLocale::class,
]);

// Or prepend:
$middleware->web(prepend: [
    \App\Http\Middleware\BeforeSession::class,
]);
```

### Refactoring Strategy
1. Identify all `$middleware->group('web', [...])` or `$middleware->group('api', [...])` calls
2. Replace with `$middleware->web(append: [...])` or `$middleware->api(append: [...])`
3. Verify session, CSRF, and cookie middleware are still active
4. Test that login, form submission, and route model binding still work
5. Remove any duplicate default middleware from custom groups

### Detection Checklist
- [ ] Group modification (`append`, `prepend`) is used instead of full `group()` replacement
- [ ] Session, CSRF, and cookie middleware are still present in web group
- [ ] Login persists across requests
- [ ] POST forms pass CSRF validation
- [ ] Route model binding works

### Related Rules/Skills/Trees
- Rule: Use group modification (`append`/`prepend`/`remove`) instead of full group replacement
- Rule: Removing default groups entirely loses session, CSRF, and all default middleware
- Related KU: Global, Route Group, and Route Middleware

---

## Anti-Pattern 2: Using `$this->middleware()` in Laravel 11

### Category
Reliability

### Description
Calling `$this->middleware()` in a controller constructor in Laravel 11, where the base Controller no longer has this method, causing a fatal error.

### Why It Happens
Developers upgrade from Laravel 10 but do not change their controller middleware registration pattern. The old `$this->middleware()` method was removed from the base Controller in Laravel 11.

### Warning Signs
- Fatal error: `Call to undefined method App\Http\Controllers\Controller::middleware()`
- Controllers use `$this->middleware()` in constructors
- After upgrading to Laravel 11, controller middleware stops working
- Stack trace shows the call originates from a controller constructor
- Method exists in Laravel 10 documentation but not in Laravel 11

### Why Harmful
The application crashes with a fatal error whenever affected controllers are instantiated. Every route using these controllers returns a 500 error. The error is immediately visible (unlike subtle behavior changes), but the fix requires understanding the new `HasMiddleware` interface.

### Real-World Consequences
- Production deployment: Laravel 11 upgrade deployed; all admin routes return 500 errors
- Controller constructor calls `$this->middleware('auth')` — method does not exist
- 500 errors for all authenticated routes
- Rollback required; upgrade delayed by 2 weeks
- Fix: implement `HasMiddleware` interface on every affected controller

### Preferred Alternative
Use the `HasMiddleware` interface or `#[Middleware]` attribute for controller middleware in Laravel 11+.

```php
// Laravel 10 (removed in Laravel 11):
class UserController extends Controller {
    public function __construct() {
        $this->middleware('auth')->except(['index', 'show']);
    }
}

// Laravel 11:
class UserController extends Controller implements HasMiddleware {
    public static function middleware(): array {
        return [
            new Middleware('auth', except: ['index', 'show']),
        ];
    }
}

// Or with attribute:
class UserController extends Controller {
    #[Middleware('auth', except: ['index', 'show'])]
    public function edit(): View { /* ... */ }
}
```

### Refactoring Strategy
1. Audit all controllers for `$this->middleware()` calls
2. Implement `HasMiddleware` interface on each controller
3. Move middleware definitions from constructor to static `middleware()` method
4. Replace `only`/`except` parameters with `Middleware` constructor parameters
5. Remove empty `__construct()` methods that only contained middleware definitions

### Detection Checklist
- [ ] No controller uses `$this->middleware()` (Laravel 11+)
- [ ] Controllers with middleware implement `HasMiddleware`
- [ ] Static `middleware()` method is defined where needed
- [ ] No fatal errors on controller instantiation
- [ ] Middleware is applied to correct methods

### Related Rules/Skills/Trees
- Rule: Implement `HasMiddleware` for controller middleware in Laravel 11+
- Rule: Using `$this->middleware()` in Laravel 11 causes a fatal error
- Related KU: Controller Middleware (interface vs constructor)

---

## Anti-Pattern 3: Trying to Access Middleware Config Object from Service Provider

### Category
Architecture

### Description
Attempting to modify middleware configuration (append, prepend, group) from a service provider using the `Middleware` configuration object, which is only available inside the `withMiddleware` closure.

### Why It Happens
Package developers need to register middleware. The fluent `Middleware` API in `bootstrap/app.php` is the documented way to configure middleware. Developers try to access it from their service provider's `boot()` method.

### Warning Signs
- Service provider calls `$this->app->make(Middleware::class)` or similar
- Fatal error or null pointer when trying to call middleware methods in a provider
- Middleware registered in service provider is not applied to routes
- Confusion between `withMiddleware` closure (bootstrap/app.php) and service provider registration
- Package documentation conflicts with Laravel 11 middleware API

### Why Harmful
The `Middleware` configuration object only exists inside the `withMiddleware` closure in `bootstrap/app.php`. It is not available in the container. Trying to access it from a service provider returns null or throws an error, and middleware registration silently fails.

### Real-World Consequences
- Package boot method tries `$middleware->append(Custom::class)` but `$middleware` is null
- No error: the code silently does nothing (null call on non-object)
- Custom middleware is never registered; package functionality is broken
- Developer spends hours debugging why the package middleware does not run
- Fix: change to `$router->aliasMiddleware()` pattern

### Preferred Alternative
Use `$router->aliasMiddleware()` and `$router->middlewareGroup()` in service providers, which work in both Laravel 10 and 11.

```php
// Wrong: trying to use Middleware object in service provider
public function boot(): void {
    $middleware = $this->app->make(Middleware::class); // null!
    $middleware->alias('role', RoleMiddleware::class);
}

// Correct: use router methods in service provider
public function boot(): void {
    $router = $this->app['router'];
    $router->aliasMiddleware('role', RoleMiddleware::class);
    $router->middlewareGroup('admin', [RoleMiddleware::class]);
}
```

### Refactoring Strategy
1. Audit service providers for `Middleware` object usage
2. Replace with `$this->app['router']->aliasMiddleware()` and `->middlewareGroup()`
3. Test that middleware is registered and functional
4. Document cross-version compatibility: router methods work in Laravel 10 and 11
5. Remove any null checks added as workarounds for the broken approach

### Detection Checklist
- [ ] Service providers use `$router->aliasMiddleware()` not `Middleware` object
- [ ] Middleware registered in packages is functional
- [ ] Both Laravel 10 and 11 are supported
- [ ] No null checks on Middleware object in providers
- [ ] Package documentation uses correct registration pattern

### Related Rules/Skills/Trees
- Rule: Use `$router->aliasMiddleware()` in package service providers
- Rule: The `Middleware` object is only available inside the `withMiddleware` closure
- Related KU: Service Provider Registration (cross-version middleware)

---

## Anti-Pattern 4: Not Re-running `route:cache` After Middleware Changes

### Category
Reliability

### Description
Modifying middleware parameters (rate limit numbers, middleware aliases, group definitions) without re-running `php artisan route:cache`, causing the old cached configuration to persist.

### Why It Happens
Route caching is automatically deployed in CI/CD. Developers update middleware configuration locally, commit the change, and deploy — but the deployment pipeline may not detect that middleware parameters require cache invalidation.

### Warning Signs
- Rate limit changes deployed but old limit still applies
- New middleware alias not resolving in production
- Group modification not taking effect after deployment
- Application works locally (no cache) but fails in production (cached)
- Deployment pipeline does not run `route:cache` after middleware changes

### Why Harmful
Route caching serializes route definitions including middleware parameters (like `throttle:60,1`). If the rate limit number is changed but the cache is not rebuilt, the old value persists. Similarly, middleware aliases and group definitions are baked into the cached routes.

### Real-World Consequences
- Rate limit changed from `100,1` to `200,1` in middleware configuration
- Deployed without `route:cache` rebuild
- Old limit of 100 applies for 3 days until someone notices
- Customer impact: legitimate traffic restricted below intended limit
- Emergency fix: manually run `route:cache` on production
- Root cause: deployment script did not invalidate cache after middleware config change

### Preferred Alternative
Include `php artisan route:cache` in the deployment pipeline whenever middleware configuration files change. Monitor for cache staleness after middleware modifications.

```bash
# Deployment script
php artisan down
git pull
composer install --no-dev
php artisan route:cache    # Rebuild after middleware changes
php artisan config:cache
php artisan up
```

### Refactoring Strategy
1. Identify deployment pipeline steps; add `route:cache` step
2. Add file hash checking: re-run cache if middleware config files changed
3. Document which files require `route:cache` when modified
4. Add smoke tests that verify rate limits, aliases, and group definitions take effect
5. Consider disabling route cache in development to force fresh middleware resolution

### Detection Checklist
- [ ] `route:cache` runs automatically on deployment
- [ ] Middleware parameter changes take effect immediately after deployment
- [ ] Rate limit numbers match configuration after deployment
- [ ] New middleware aliases resolve correctly
- [ ] Deployment pipeline detects middleware config changes

### Related Rules/Skills/Trees
- Rule: Middleware parameter changes require `route:cache` rebuild
- Rule: Not re-running `route:cache` after middleware changes
- Related KU: Route Caching (middleware interaction)

---

## Anti-Pattern 5: Migrating Kernel.php During Laravel 10→11 Upgrade

### Category
Maintenance

### Description
Attempting to migrate the `app/Http/Kernel.php` middleware configuration to the `bootstrap/app.php` fluent API during a Laravel 10 to 11 upgrade, introducing risk and complexity without benefit.

### Why It Happens
The upgrade guide shows the new fluent API. Developers want to adopt the new pattern immediately, thinking they must migrate to be "on the latest."

### Warning Signs
- Laravel 10→11 upgrade involves rewriting middleware configuration
- Both `Kernel.php` (old) and `bootstrap/app.php` (new) contain middleware definitions
- Middleware behavior changes after upgrade due to migration errors
- Group definition mistakes (full replacement instead of modification) during migration
- `HasMiddleware` migration creates new bugs in controller middleware
- Upgrade takes 3x longer than expected due to middleware migration

### Why Harmful
The Laravel upgrade guide explicitly recommends NOT migrating the application structure. The old `Kernel.php` continues to work in Laravel 11. Migration introduces risk: middleware can be misconfigured, groups can be incorrectly defined, and controller middleware can be lost. The migration provides zero functional benefit.

### Real-World Consequences
- Developer follows online guide to migrate Kernel.php to bootstrap/app.php
- Full group replacement loses CSRF middleware
- Controller `$this->middleware()` replaced with `HasMiddleware` — one controller missed
- All form submissions fail after deployment
- Rollback required; upgrade takes 3 weeks instead of 2 days
- Lesson: never migrate Kernel.php during upgrade

### Preferred Alternative
Keep the old `Kernel.php` during the Laravel 10→11 upgrade. Only migrate to the new fluent API when doing a separate, standalone cleanup effort with full testing.

```php
// During Laravel 10→11 upgrade:
// Keep Kernel.php as-is. It works in Laravel 11.
// DO NOT migrate to bootstrap/app.php during the upgrade.

// Future cleanup (separate task):
// - Remove Kernel.php
// - Move middleware config to bootstrap/app.php
// - Replace $this->middleware() with HasMiddleware
```

### Refactoring Strategy
1. During Laravel 10→11 upgrade: leave `Kernel.php` unchanged
2. Only migrate middleware configuration as a separate, non-upgrade task
3. When migrating: test each middleware tier (global, group, route) individually
4. Migrate controller middleware (`HasMiddleware`) separately from pipeline configuration
5. Run full integration test suite after migration

### Detection Checklist
- [ ] Laravel 10→11 upgrade did not migrate middleware configuration
- [ ] Kernel.php still works (it is backward compatible)
- [ ] Middleware behavior is identical before and after upgrade
- [ ] Migration to fluent API is a separate, planned task
- [ ] No middleware functionality was lost during upgrade

### Related Rules/Skills/Trees
- Rule: Do NOT migrate Kernel.php during Laravel 10→11 upgrade
- Rule: Backward compatibility: old Kernel.php continues to work in Laravel 11
- Related KU: Upgrade Guide (Laravel 10 to 11)
