# ECC Standardized Knowledge — Resource Controllers

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Controllers |
| **Knowledge Unit** | Resource Controllers |
| **Difficulty** | Foundation |
| **Category** | Application Architecture — HTTP Layer |
| **Last Updated** | 2026-06-02 |

---

## Overview

Resource controllers implement the 7 standard RESTful actions: index, create, store, show, edit, update, destroy. They pair with `Route::resource()` to provide automatic route registration and standardized method naming. API resource controllers use `Route::apiResource()` and omit the create/edit actions (which return HTML forms).

The resource controller pattern enforces RESTful conventions across the team. Every developer knows that `UserController::index()` lists users, `store()` creates, `show()` displays, etc. This predictability reduces cognitive overhead and documentation needs.

---

## Core Concepts

### Standard Actions
- `index()` — list resources
- `create()` — show creation form
- `store()` — persist new resource
- `show($id)` — display single resource
- `edit($id)` — show edit form
- `update($id)` — persist changes
- `destroy($id)` — delete resource

### API Resource Controllers
Extend resource controllers but omit create and edit. Use `php artisan make:controller UserController --api` or `--resource` with `--api`.

### Invokable Resource (__invoke)
A single-method controller that handles a single route. Used for simple operations that don't need multiple methods.

---

## When To Use

- Standard CRUD for any resource
- RESTful API endpoints
- Consistent controller structure across the application

---

## When NOT To Use

- Non-CRUD operations (use dedicated controllers or single-action controllers)
- Resources with non-standard actions (add custom actions to a separate controller)
- Read-only resources (use `--api` or implement only index/show)

---

## Best Practices

### Use apiResource for APIs
Generate resource controllers with `--api` for JSON API endpoints.

**Why:** API endpoints don't need create/edit (HTML form) routes. Using `--api` generates only the 5 relevant controller methods.

### Use make:controller with --resource or --api
Generate resource controllers via Artisan.

**Why:** Artisan generates the method stubs with correct signatures and docblocks, saving time and ensuring consistent structure.

### Keep Actions Thin
Each resource action should be 5-10 lines: validate, delegate, return.

**Why:** Resource controllers are the most visible controllers in the application. Fat resource actions indicate missing service/action extraction.

---

## Architecture Guidelines

### Resource Controller Structure
```php
class PostController extends Controller
{
    public function index() { /* list */ }
    public function create() { /* form */ }
    public function store(Request $request) { /* persist */ }
    public function show(Post $post) { /* single */ }
    public function edit(Post $post) { /* edit form */ }
    public function update(Request $request, Post $post) { /* update */ }
    public function destroy(Post $post) { /* delete */ }
}
```

### Route Registration
```php
Route::resource('posts', PostController::class);
// 7 routes auto-registered with named routes
```

### Customizing Resource Routes
```php
Route::resource('posts', PostController::class)->only(['index', 'show']);
Route::apiResource('posts', PostController::class);
```

---

## Common Mistakes

### Mixing Non-Resource Actions
Desc: Adding `publish()` or `archive()` methods to a resource controller.
Cause: Convenience — putting related actions in one class.
Consequence: Violates single responsibility; confusing for developers expecting standard 7 actions.
Better: Create a separate controller or use route model binding with custom actions.

### Using Resource for Non-CRUD Resources
Desc: Resource controller for a resource that only needs index and show.
Cause: Following the pattern without evaluating fit.
Consequence: Unused methods that can never be reached (create, edit, store, update, destroy).
Better: Use `--api` or `->only(['index', 'show'])`.

---

## Anti-Patterns

### Resource Controller with 50+ Line Methods
Writing complex business logic inside resource controller methods. Each method should delegate to services/actions.

### Overloaded Store/Update Methods
The store and update methods receiving raw request data without Form Request validation. Always use Form Requests for store and update.

---

## Examples

### Generated Resource Controller
```bash
php artisan make:controller PostController --resource
php artisan make:controller Api\PostController --api
```

### Resource with Form Request
```php
class PostController extends Controller
{
    public function store(StorePostRequest $request): RedirectResponse
    {
        Post::create($request->validated());
        return redirect()->route('posts.index');
    }

    public function update(UpdatePostRequest $request, Post $post): RedirectResponse
    {
        $post->update($request->validated());
        return redirect()->route('posts.index');
    }
}
```

---

## Related Topics

### Prerequisites
- **Controller Architecture** — Foundation for all controllers
- **Resourceful Routing** — Route registration for resource controllers

### Closely Related
- **Single-Action Controllers** — Alternative to resource actions
- **Thin Controller Principles** — Keeping resource actions lean
- **Form Requests** — Validation for store/update actions

### Advanced
- **Controller Organization** — Namespace and directory placement

---

## AI Agent Notes

### Important Decisions
- Resource controllers enforce 7 standard action names — teams must follow this convention
- API resource controllers omit create/edit — use `--api` flag
- Route model binding automatically resolves models in show/edit/update/destroy
- Custom actions beyond the 7 should NOT be added to resource controllers

### Important Constraints
- index, create, store are not route model bound (no {id})
- show, edit, update, destroy receive the bound model
- Resource controllers expect specific parameter names matching the resource name

### Rules Generation Hints
- Enforce resource controller pattern for all CRUD operations
- Enforce `--api` for API controllers (no create/edit methods)
- Enforce Form Requests for store and update validation

---

## Verification

This document has been validated against:
- `Illuminate\Routing\Router::resource()` — resource route registration
- `Illuminate\Routing\ResourceRegistrar` — route generation logic
- `Illuminate\Routing\Controller` — base controller methods
