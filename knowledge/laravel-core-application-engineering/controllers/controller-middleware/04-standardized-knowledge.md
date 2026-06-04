# ECC Standardized Knowledge — Controller Middleware

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Controllers |
| **Knowledge Unit** | Controller Middleware |
| **Difficulty** | Intermediate |
| **Category** | Application Architecture — HTTP Layer |
| **Last Updated** | 2026-06-02 |

---

## Overview

Controller middleware allows assigning middleware to specific controller actions within the controller class itself, using the `middleware()` method in the constructor. This provides method-level middleware granularity without needing to define per-route middleware — particularly useful when different actions within the same resource controller need different middleware.

The controller constructor is the only valid registration point for controller middleware. Registering middleware in the constructor binds it to the controller's route when the controller is resolved.

---

## Core Concepts

### middleware() Method
Called in the constructor: `$this->middleware('auth')->only(['create', 'store'])`. Registers middleware for the controller's route.

### only() / except()
Limit middleware to specific methods: `->only('store', 'update')` or `->except('index', 'show')`.

### Constructor Registration
Middleware must be registered in the constructor. The framework reads these registrations when the controller is resolved for a route.

---

## When To Use

- Resource controllers where different actions need different middleware
- Admin-only actions in an otherwise public controller
- API controllers where some endpoints need rate limiting
- Controllers where middleware granularity is at the method level

---

## When NOT To Use

- Routes that all share the same middleware (use route group middleware)
- Controllers with a single action (use route-level middleware)
- Middleware that should apply to all routes globally (use global middleware)

---

## Best Practices

### Use only() and except() for Granular Control
Specify which actions get middleware using `->only()` or `->except()`.

**Why:** Explicit declarations prevent middleware from accidentally applying to unintended actions. `->only()` is preferred as it's more restrictive.

### Prefer Route-Level Middleware for Consistency
Use route groups or route-level middleware for middleware shared by multiple controllers.

**Why:** Controller middleware is invisible in route files. Developers auditing security must check both routes AND controllers. Route-level middleware is more visible.

### Avoid Constructor Logic
The constructor should only contain `$this->middleware()` calls.

**Why:** The controller constructor runs when the controller is resolved. Business logic in constructors runs before the controller method, causing side effects during resolution.

---

## Architecture Guidelines

### Resource Controller Middleware
```php
class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth')->except(['index', 'show']);
        $this->middleware('admin')->only(['destroy']);
        $this->middleware('throttle:api')->only(['store', 'update', 'destroy']);
    }
}
```

### Method-Specific Middleware
```php
$this->middleware('verified')->only('store');
$this->middleware('password.confirm')->only(['edit', 'update']);
```

---

## Common Mistakes

### Business Logic in Constructor
Desc: Database queries or service calls alongside `$this->middleware()` in the constructor.
Cause: Treating the constructor as a setup method.
Consequence: Logic runs at controller resolution time, not dispatch time; side effects occur even for unmatched methods.
Better: Keep constructors to middleware registration only.

### Registering Middleware Outside Constructor
Desc: Calling `$this->middleware()` in a controller method.
Cause: Not knowing it only works in the constructor.
Consequence: Middleware is never registered.
Better: Always register middleware in the constructor.

### Forgetting except() for Public Actions
Desc: Applying `auth` middleware to all actions without `except(['index', 'show'])`.
Cause: Not thinking about which actions should be public.
Consequence: Public routes (index, show) are blocked.
Better: Always specify `except()` for public resource actions.

---

## Anti-Patterns

### Middleware as Authorization Gate
Using controller middleware to perform authorization checks. Middleware handles cross-cutting concerns. Authorization belongs in policies/gates or Form Request `authorize()`.

### Over-Nesting Middleware in Routes and Controllers
Applying the same middleware at route-group level AND controller level. The middleware runs twice. Check `php artisan route:list` to verify middleware composition.

---

## Examples

### Admin Controller Middleware
```php
class AdminUserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('admin')->except(['profile', 'updateProfile']);
        $this->middleware('verified')->only(['impersonate', 'destroy']);
    }
}
```

### API Controller Middleware
```php
class ApiUserController extends Controller
{
    public function __construct()
    {
        $this->middleware('throttle:60,1')->only(['index', 'show']);
        $this->middleware('throttle:10,1')->only(['store', 'update', 'destroy']);
        $this->middleware('auth:sanctum');
    }
}
```

---

## Related Topics

### Prerequisites
- **Controller Architecture** — Foundation for controller patterns
- **Middleware Fundamentals** — Middleware lifecycle and definition

### Closely Related
- **Resource Controllers** — Common use case for controller middleware
- **Middleware Lifecycle** — How controller middleware fits in the pipeline

### Advanced
- **Route Groups vs Controller Middleware** — When to use which

---

## AI Agent Notes

### Important Decisions
- Controller middleware is registered in the constructor via `$this->middleware()`
- `->only()` and `->except()` provide method-level granularity
- Controller middleware complements route-level middleware
- Constructor must NOT contain business logic — only middleware registrations

### Important Constraints
- `$this->middleware()` only works in the constructor
- Middleware registered here runs after route-level middleware
- `php artisan route:list` shows all middleware (route + controller) applied to each route
- Controller middleware cannot be removed by child controllers

### Rules Generation Hints
- Enforce `$this->middleware()` only in constructors
- Enforce `->only()` or `->except()` for all controller middleware
- Enforce empty constructors except for middleware registration

---

## Verification

This document has been validated against:
- `Illuminate\Routing\Controller::middleware()` — middleware registration
- `Illuminate\Routing\ControllerMiddlewareOptions` — only/except options
- `Illuminate\Routing\Route::gatherMiddleware()` — controller middleware collection
