# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Laravel 11 vs 10 Middleware Registration
**Generated:** 2026-06-03

---

# Decision Inventory

* Laravel 10 Kernel.php vs Laravel 11 bootstrap/app.php Registration
* HasMiddleware Interface vs #[Middleware] Attribute for Controller Middleware
* Group Modification (append/prepend) vs Full Group Replacement
* Package Registration via Router vs Application Registration

---

# Architecture-Level Decision Trees

---

## Decision 1: Laravel 10 Kernel.php vs Laravel 11 bootstrap/app.php Registration

---

## Decision Context

Which middleware registration approach to use — the legacy Laravel 10 class-based `Kernel.php` or the Laravel 11+ fluent API in `bootstrap/app.php`.

---

## Decision Criteria

* Laravel version (10 vs 11+)
* Whether upgrading from Laravel 10 (backward compatibility)
* Whether starting a new project

---

## Decision Tree

Is this a new Laravel 11+ application?
↓
YES → Laravel 11+ fluent API — `bootstrap/app.php` with `->withMiddleware()`
NO → Is this an upgrade from Laravel 10 to 11?
    ↓
    YES → Kepp existing `Kernel.php` — the upgrade guide recommends NOT migrating the application structure
    NO → Is this a Laravel 10 application?
        ↓
        YES → Keep `Kernel.php` — the class-based approach is correct for Laravel 10
        NO → N/A — determine the correct version approach
NO → Does the application need to support both versions (package development)?
    ↓
    YES → Router service provider methods — `$router->aliasMiddleware()` works in both versions
    NO → Use the version-specific approach

---

## Rationale

Laravel 11 removed `Kernel.php` and introduced a fluent API in `bootstrap/app.php`. The old `Kernel.php` still works in Laravel 11 for backward compatibility. The upgrade guide explicitly recommends NOT migrating the application structure when upgrading from Laravel 10. The fluent API is more discoverable and composable than property arrays.

---

## Recommended Default

**Default:** Laravel 11+ fluent API for new applications. Keep `Kernel.php` when upgrading from Laravel 10.
**Reason:** The fluent API is the recommended approach for new projects. Migrating during upgrade introduces unnecessary risk.

---

## Risks Of Wrong Choice

* Migrating Kernel.php during upgrade: High effort, no benefit, risk of misconfiguration
* Using Kernel.php in new Laravel 11 app: Works but misses the improved discoverability of the fluent API
* Mixed registration (both Kernel.php and bootstrap/app.php): Undocumented merging behavior; test thoroughly
* Using `$this->middleware()` in controller constructors in Laravel 11: Fatal error — method removed in Laravel 11

---

## Related Rules

* Never Place Business Logic in Middleware
* Keep Global Middleware Minimal

---

## Related Skills

* Register Middleware Using Laravel 11 Fluent API in bootstrap/app.php
* Migrate Middleware Registration from Laravel 10 to 11

---

---

## Decision 2: HasMiddleware Interface vs #[Middleware] Attribute for Controller Middleware

---

## Decision Context

Whether to define controller-level middleware using the `HasMiddleware` interface (static method) or the `#[Middleware]` PHP 8 attribute.

---

## Decision Criteria

* Laravel version (Laravel 11+ for both options)
* Whether middleware applies to all controller methods or specific methods
* Whether the controller already implements other interfaces
* Team preference for attributes vs methods

---

## Decision Tree

Does middleware need to be applied to specific controller methods (not all)?
↓
YES → Use `#[Middleware('auth', except: ['index', 'show'])]` — attribute targets specific methods
NO → Does middleware apply to the entire controller with method exceptions?
    ↓
    YES → `HasMiddleware` interface — `public static function middleware(): array` with `except` and `only`
    NO → Does the team prefer attributes over interface methods?
        ↓
        YES → `#[Middleware]` attribute — compiler-time visibility; no interface needed
        NO → `HasMiddleware` interface — static, discoverable, works in Laravel 10 if controller extends base Controller
NO → Is the middleware configuration complex (multiple middleware with different exclusions)?
    ↓
    YES → `HasMiddleware` interface — more verbose but clearer for complex configurations
    NO → `#[Middleware]` attribute — concise for simple configurations

---

## Rationale

`HasMiddleware` defines middleware statically via a `middleware()` method that returns an array of `Middleware` objects. The `#[Middleware]` attribute provides per-method, compiler-time metadata. Both are equally supported. `HasMiddleware` is better for complex configurations with multiple middleware and exclusions. `#[Middleware]` is more concise for simple per-method middleware.

---

## Recommended Default

**Default:** `HasMiddleware` interface for controller-wide middleware with method exclusions. `#[Middleware]` attribute for per-method middleware.
**Reason:** `HasMiddleware` centralizes middleware configuration in one method. `#[Middleware]` keeps middleware near the method it protects.

---

## Risks Of Wrong Choice

* Using `$this->middleware()` in Laravel 11: Fatal error — base Controller no longer has this method
* `#[Middleware]` on every method when all methods share middleware: Repetitive; `HasMiddleware` is cleaner
* `HasMiddleware` with complex per-method configuration: Each method needs its own `Middleware` object — attribute may be clearer
* Mixing both approaches: Both are equivalent; mixing is confusing but technically correct

---

## Related Rules

* Never Place Business Logic in Middleware
* Keep Global Middleware Minimal

---

## Related Skills

* Register Controller-Level Middleware Using HasMiddleware Interface
* Use #[Middleware] Attribute for Per-Method Middleware Configuration

---

---

## Decision 3: Group Modification (append/prepend) vs Full Group Replacement

---

## Decision Context

Whether to modify existing default groups (web, api) by appending/prepending middleware or fully replace the group definition.

---

## Decision Criteria

* Whether the modification is an addition or a complete redefinition
* Whether all default middleware should be preserved
* Whether the default group's middleware is well understood

---

## Decision Tree

Is the goal to ADD middleware to an existing group without removing defaults?
↓
YES → Group modification — `$middleware->web(append: [CustomMiddleware::class])` (Laravel 11+) or append to group array (Laravel 10-)
NO → Is the goal to REPLACE the entire group with custom middleware?
    ↓
    YES → Are you CERTAIN that no default middleware (session, CSRF, bindings for web) is needed?
        ↓
        YES → Full replacement — `$middleware->group('web', [CustomStack])` — include ALL needed middleware explicitly
        NO → Group modification — defaults are essential; append your middleware
    NO → Is the goal to REMOVE specific middleware from a group?
        ↓
        YES → Group modification with remove — `$middleware->web(remove: [MiddlewareToRemove::class])` (Laravel 11+)
        NO → Group modification — append/prepend for additions

---

## Rationale

Full group replacement (`$middleware->group('web', [ ... ])`) replaces all default middleware. If session, CSRF, or binding middleware is omitted, web routes lose critical protections. Group modification (`$middleware->web(append: [...])`) adds to the default stack without removing anything. In Laravel 11+, `remove` allows targeted removal without full replacement.

---

## Recommended Default

**Default:** Group modification (append/prepend/remove) for all changes to default groups. Full replacement only when creating an entirely custom group with no relation to defaults.
**Reason:** Default groups contain security-critical middleware. Full replacement risks accidental removal of essential protections.

---

## Risks Of Wrong Choice

* Full replacement omitting session: Web routes have no session — flash messages, auth state, CSRF all broken
* Full replacement omitting CSRF: All POST routes vulnerable to cross-site request forgery
* Group modification when removal is needed: Cannot remove middleware from a group without full replacement (Laravel 10-)
* Group modification when no group exists: Custom group must be fully defined — `$middleware->group('admin', [...])`

---

## Related Rules

* Keep Global Middleware Minimal
* Never Place Business Logic in Middleware

---

## Related Skills

* Register Middleware Using Laravel 11 Fluent API in bootstrap/app.php
* Migrate Middleware Registration from Laravel 10 to 11

---

---

## Decision 4: Package Registration via Router vs Application Registration

---

## Decision Context

Whether a package should register middleware via the Router service provider methods or require the consuming application to configure it.

---

## Decision Criteria

* Whether the package targets both Laravel 10 and 11
* Whether the middleware is mandatory for the package to function
* Whether the middleware can be registered without side effects

---

## Decision Tree

Does the package need to support both Laravel 10 and 11?
↓
YES → Router service provider methods — `$router->aliasMiddleware()` and `$router->middlewareGroup()` work in both versions
NO → Is the middleware mandatory for the package to function (can't work without it)?
    ↓
    YES → Auto-register via `boot()` — register the middleware so it's available when the developer applies it
    NO → Document registration — let the developer decide when/if to apply the middleware
NO → Does the middleware registration have side effects (events, listeners, config)?
    ↓
    YES → Configurable registration — allow the developer to enable/disable via config
    NO → Auto-registration — safe to register in `boot()`

---

## Rationale

Packages should use `$router->aliasMiddleware()` or `$router->middlewareGroup()` in their service provider's `boot()` method. These methods work in both Laravel 10 and 11 without modification. The `boot()` method is safe because middleware registration only adds an alias — it doesn't apply the middleware to any routes. The developer applies it via route definitions.

---

## Recommended Default

**Default:** Router service provider methods for package middleware registration. Auto-register middleware aliases; let the developer decide when to apply them.
**Reason:** Router methods work across versions. Auto-registering aliases makes middleware available without forcing it on any route.

---

## Risks Of Wrong Choice

* Kernel.php in package: Only works in Laravel 10; breaks in Laravel 11
* bootstrap/app.php in package: Only works in Laravel 11; breaks in Laravel 10
* Auto-applying middleware to all routes: Side effects, unexpected behavior, violates separation of concerns
* Not registering at all: Developer must manually register — package appears broken

---

## Related Rules

* Keep Global Middleware Minimal
* Never Place Business Logic in Middleware

---

## Related Skills

* Register Package Middleware Using Router Service Provider Methods
* Create Cross-Version Compatible Package Middleware
