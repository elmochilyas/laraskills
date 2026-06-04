# Skill: Migrate Controller Middleware from Constructor to HasMiddleware

## Purpose

Replace deprecated `$this->middleware()` calls in Laravel 11+ controller constructors with the `HasMiddleware` interface or `#[Middleware]` attribute to prevent fatal errors.

## When To Use

When upgrading a Laravel 10 application to Laravel 11+, or when creating new controllers in Laravel 11+.

## When NOT To Use

Laravel 10 applications that have not been upgraded — the `$this->middleware()` method still works in Laravel 10.

## Prerequisites

- Laravel 11+ application or upgraded application
- List of controllers using `$this->middleware()` in constructors

## Inputs

- Controller files using `$this->middleware()` in constructors

## Workflow

1. Search all controllers for `$this->middleware(` calls
2. For each controller, add `implements HasMiddleware` to the class declaration
3. Replace `$this->middleware(...)` calls in the constructor with a static `middleware()` method
4. Convert each call to a `new Middleware(...)` object with the same parameters:
   - `$this->middleware('auth')` → `new Middleware('auth')`
   - `$this->middleware('auth', except: ['index'])` → `new Middleware('auth', except: ['index'])`
   - `$this->middleware('verified', only: ['edit'])` → `new Middleware('verified', only: ['edit'])`
5. Remove the empty constructor (if it only contained middleware calls)
6. Alternatively for per-method middleware, use the `#[Middleware]` attribute on individual controller methods

## Validation Checklist

- [ ] No controller calls `$this->middleware()` in constructor — would cause fatal error
- [ ] Every controller with middleware implements `HasMiddleware`
- [ ] Static `middleware()` method returns array of `Middleware` objects
- [ ] `Middleware` class is imported: `use Illuminate\Routing\Controllers\Middleware`
- [ ] `except` and `only` parameters are preserved from the original constructor calls

## Common Failures

- Forgetting to import the `Middleware` class — `new Middleware(...)` resolves to a different class or fails
- Forgetting that `except` and `only` on static middleware run at the route level, not during controller construction
- Mixing `$this->middleware()` (removed) with `HasMiddleware` in the same application — all controllers must be updated

## Decision Points

- Use `HasMiddleware` interface for controllers with multiple middleware or complex configuration
- Use `#[Middleware]` attribute for simple, per-method middleware that is more readable as an attribute
- For dynamic middleware based on runtime conditions, use route definition middleware instead

## Performance Considerations

Zero runtime performance difference. The static `middleware()` method is called at route dispatch, same as the constructor-based approach.

## Security Considerations

Static middleware definitions are more predictable than constructor-based ones — they cannot be conditional or dynamic, making middleware configuration fully discoverable.

## Related Rules

- Use HasMiddleware or #[Middleware] for Controller Middleware in Laravel 11+ (laravel-11-vs-10-registration:5)
- Use Package-Registration Methods in Service Providers for Cross-Version Compatibility (laravel-11-vs-10-registration:5)

## Related Skills

- Register Middleware Using the Laravel 11+ Fluent API

## Success Criteria

All controllers use `HasMiddleware` interface or `#[Middleware]` attribute. No `$this->middleware()` calls remain. Application runs without `BadMethodCallException`.

---

# Skill: Register Middleware Using the Laravel 11+ Fluent API

## Purpose

Configure middleware registration in `bootstrap/app.php` using the fluent API, supporting global, group, alias, and priority registration with conditional logic.

## When To Use

When creating a new Laravel 11+ application, adding new middleware registration to an existing Laravel 11+ application, or when the team decides to migrate from Kernel.php.

## When NOT To Use

Laravel 10 applications or Laravel 10→11 upgraded applications following the upgrade guide recommendation to keep Kernel.php.

## Prerequisites

- Laravel 11+ application
- `bootstrap/app.php` with `->withMiddleware()` configuration

## Inputs

- List of middleware to register with their tiers and aliases

## Workflow

1. Open `bootstrap/app.php` and locate `->withMiddleware(function (Middleware $middleware) { ... })`
2. Register global middleware: `$middleware->append(CustomMiddleware::class)` or `$middleware->prepend(...)`
3. Register aliases: `$middleware->alias(['role' => CheckRole::class, 'throttle' => ThrottleRequests::class])`
4. Register groups: `$middleware->group('admin', ['auth', 'verified', 'role:admin'])`
5. Modify existing groups: `$middleware->web(append: [SetLocale::class])` — never use full replacement
6. Configure priority: `$middleware->priority([...])` or `$middleware->prependToPriorityList(...)` (Laravel 12+)
7. Use conditionals inside the closure for environment-specific middleware:
   ```php
   if (app()->environment('production')) {
       $middleware->append(EnforceHttps::class);
   }
   ```

## Validation Checklist

- [ ] Global middleware registered via `append`/`prepend` — not array assignment
- [ ] Group modifications use `append`/`prepend`/`remove` — not full `group('web', [...])` replacement
- [ ] Aliases registered via `$middleware->alias([...])` — one call with associative array
- [ ] Priority uses `prependToPriorityList`/`appendToPriorityList` (Laravel 12+) for targeted insertion
- [ ] Conditional middleware uses PHP `if` inside the closure — not service providers
- [ ] No `configure()` calls — this method does not exist on the Middleware object

## Common Failures

- Using `$middleware = [Custom::class]` inside the closure — creates a local variable instead of configuring the middleware stack
- Calling `->configure()` instead of `->alias()` — `configure()` does not exist
- Trying to access the `Middleware` configuration object from a service provider — only available inside `withMiddleware` closure
- Forgetting that `$middleware->group('web', [...])` replaces the entire group, losing default middleware

## Decision Points

- For package middleware registration, use `$router->aliasMiddleware()` and `$router->middlewareGroup()` in the service provider — these work in both Laravel 10 and 11+
- For application middleware registration, use the fluent API inside `withMiddleware`

## Performance Considerations

The fluent API has zero request-time performance impact — it is resolved at bootstrap and cached.

## Security Considerations

Keep all middleware registration in one place (`bootstrap/app.php`). Scattering middleware registration across service providers makes the security posture harder to audit.

## Related Rules

- Use the Fluent API in New Laravel 11+ Applications (laravel-11-vs-10-registration:5)
- Use Group Modification Instead of Full Group Replacement (laravel-11-vs-10-registration:5)
- Use Conditional Registration Inside withMiddleware for Environment-Specific Middleware (laravel-11-vs-10-registration:5)

## Related Skills

- Choose the Correct Registration Tier for Middleware
- Modify Default Middleware Groups Without Full Replacement

## Success Criteria

Middleware registration is fully configured in `bootstrap/app.php` using the fluent API. Global, group, alias, and priority registration are correct. No deprecated patterns remain.
