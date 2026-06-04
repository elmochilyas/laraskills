# ECC Standardized Knowledge — Single-Action Controllers

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Controllers |
| **Knowledge Unit** | Single-Action Controllers |
| **Difficulty** | Intermediate |
| **Category** | Application Architecture — HTTP Layer |
| **Last Updated** | 2026-06-02 |

---

## Overview

Single-action controllers (invokable controllers) use `__invoke()` as their only public method, handling exactly one route. They are registered with `Route::get('/path', InvokableController::class)` without specifying a method name.

Single-action controllers are the controller equivalent of the action pattern — one class, one responsibility, one route. They shine for non-CRUD operations that don't fit the 7 resource actions: dashboard pages, contact forms, search endpoints, and API webhooks.

---

## Core Concepts

### __invoke() Method
The single method receives the request and returns the response. No other public methods should exist.

### Route Registration
`Route::get('/dashboard', DashboardController::class)` — the class name alone tells the router to call `__invoke()`.

### Dependency Injection
Constructor injection works normally. Method injection works on `__invoke()` parameters.

---

## When To Use

- Single-purpose endpoints (dashboard, search, contact form)
- Webhook handlers
- Operations that don't fit CRUD (publish, archive, approve, reject)
- Simple read-only pages that need a controller
- Replacing Closure routes while keeping simplicity

---

## When NOT To Use

- Resources with multiple actions (use resource controllers)
- Operations that share significant logic with other actions (use a shared service)
- Simple redirect routes (use a Closure or `Route::redirect()`)
- Routes that need multiple HTTP verb handlers

---

## Best Practices

### Use for Non-CRUD Operations
Prefer single-action controllers for operations that don't fit the 7 resource actions.

**Why:** Resource controllers with a `publish()` method alongside the standard 7 are confusing. Single-action controllers give each operation its own class with a clear name.

### Name Controllers by Operation
Name the controller after the operation: `PublishPostController`, `SearchUsersController`.

**Why:** The class name documents the purpose. Developers can find the handler for an operation by looking for its action-based class name.

### Replace Closure Routes with Invokable Controllers
Convert Closure routes to single-action controllers for production applications.

**Why:** Single-action controllers are cacheable, testable, and IDE-resolvable — all benefits that Closure routes lack.

---

## Architecture Guidelines

### Invokable Controller Definition
```php
class DashboardController
{
    public function __construct(
        private DashboardService $service,
    ) {}

    public function __invoke(): View
    {
        return view('dashboard', ['data' => $this->service->getData()]);
    }
}
```

### Route Registration
```php
Route::get('/dashboard', DashboardController::class);
Route::post('/contact', ContactFormController::class);
Route::post('/posts/{post}/publish', PublishPostController::class);
```

---

## Common Mistakes

### Multiple Public Methods
Desc: Adding a second public method alongside `__invoke()`.
Cause: Two operations seem related.
Consequence: Defeats the single-action purpose; confusing registration.
Better: Create a second single-action controller.

### Mixing with Resource Controllers
Desc: Using single-action controllers for operations that are clearly CRUD.
Cause: Over-applying the pattern.
Consequence: Proliferation of controllers for what should be resource actions.
Better: Use resource controllers for CRUD; single-action for non-CRUD.

---

## Anti-Patterns

### Invokable Controllers for Everything
Creating single-action controllers for every route, including standard CRUD actions. This creates excessive files and loses the organizational benefit of resource controllers.

### Fat Invokable Methods
The `__invoke()` method exceeding 15-20 lines. Extract business logic to services/actions.

---

## Examples

### Simple Invokable Controller
```php
class DashboardController
{
    public function __invoke(): View
    {
        return view('dashboard');
    }
}

// Route: Route::get('/dashboard', DashboardController::class);
```

### Post-Publish Invokable Controller
```php
class PublishPostController
{
    public function __construct(
        private PublishPostAction $action,
    ) {}

    public function __invoke(PublishPostRequest $request, Post $post): RedirectResponse
    {
        $this->action->execute($post);
        return redirect()->route('posts.index');
    }
}

// Route: Route::post('/posts/{post}/publish', PublishPostController::class);
```

---

## Related Topics

### Prerequisites
- **Controller Architecture** — Foundation for controller patterns
- **Route Definition** — Registration of invokable controllers

### Closely Related
- **Resource Controllers** — Alternative for CRUD operations
- **Action Pattern** — Parallel pattern in the business logic layer

### Advanced
- **Thin Controller Principles** — Keeping invokable methods lean

---

## AI Agent Notes

### Important Decisions
- Single-action controllers are registered by class only (no method specified)
- Only `__invoke()` should be public — no other public methods
- Method injection works on `__invoke()` parameters
- These controllers replace Closure routes with cacheable alternatives

### Important Constraints
- Only one route per controller class
- The class should end with `Controller` naming convention
- `__invoke()` should be the only public method
- Not suitable for resource CRUD operations

### Rules Generation Hints
- Enforce single-action controllers for non-CRUD endpoints
- Enforce invokable controllers over Closure routes in production
- Enforce single public method (`__invoke`) only

---

## Verification

This document has been validated against:
- `Illuminate\Routing\Router::addRoute()` — invokable controller detection
- `Illuminate\Routing\ControllerDispatcher` — `__invoke()` dispatch logic
