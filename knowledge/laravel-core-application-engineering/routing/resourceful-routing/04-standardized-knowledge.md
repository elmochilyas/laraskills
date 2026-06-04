# ECC Standardized Knowledge — Resourceful Routing

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Routing System |
| **Knowledge Unit** | Resourceful Routing |
| **Difficulty** | Foundation |
| **Category** | Application Architecture — Routing |
| **Last Updated** | 2026-06-02 |

---

## Overview

Resourceful routing (`Route::resource()`) automatically generates the 7 standard RESTful routes for a resource: index, create, store, show, edit, update, destroy. It also generates named routes, URI patterns, and controller method expectations. `Route::apiResource()` generates only the 5 API-appropriate routes (excluding create and edit, which return HTML forms).

The key engineering decision is whether to use resourceful routing (convention, reduced boilerplate) vs explicit route registration (control, visibility). Resourceful routing enforces RESTful conventions across the team, reducing naming inconsistencies and documentation overhead.

---

## Core Concepts

### Standard Resource Routes
| Verb | URI | Action | Route Name |
|------|-----|--------|------------|
| GET | /photos | index | photos.index |
| GET | /photos/create | create | photos.create |
| POST | /photos | store | photos.store |
| GET | /photos/{photo} | show | photos.show |
| GET | /photos/{photo}/edit | edit | photos.edit |
| PUT/PATCH | /photos/{photo} | update | photos.update |
| DELETE | /photos/{photo} | destroy | photos.destroy |

### API Resource Routes
`Route::apiResource()` omits create and edit routes. `Route::apiResources()` registers multiple API resources in one call.

### Customizing Resource Routes
`->only(['index', 'show'])` limits generated routes. `->except(['create', 'edit'])` excludes specific routes.

### Nested Resources
`Route::resource('posts.comments', CommentController::class)` generates nested routes like `posts/{post}/comments/{comment}`.

### Shallow Nesting
`Route::resource('posts.comments', CommentController::class)->shallow()` uses shallow nesting — routes that don't need the parent ID omit it.

---

## When To Use

- Standard CRUD operations on any resource
- RESTful API endpoints
- Consistent route naming across the application
- Resources with the conventional 7 actions

---

## When NOT To Use

- Singleton resources (use `Route::singleton()`)
- Resources with non-standard action names
- Read-only resources (index + show only — use explicit routes or `->only(['index', 'show'])`)
- Resources with complex custom actions beyond the 7 standard verbs

---

## Best Practices

### Use apiResource for APIs
Use `Route::apiResource()` instead of `Route::resource()` for API-only applications.

**Why:** API endpoints don't need create/edit routes (they return HTML forms). Using `apiResource` avoids generating unnecessary routes and documents intent.

### Use only/explicitly
Limit generated routes with `->only()` or `->except()`.

**Why:** Explicit route lists prevent unused actions from being accidentally routable. They also document which operations the resource supports.

### Add Custom Actions Separately
Define non-standard actions outside the resource definition.

**Why:** Mixing custom actions inside resource definitions violates RESTful conventions and confuses route organization.

### Name Resources Consistently
Use plural resource names consistently: `Route::resource('users', ...)` not `Route::resource('user', ...)`.

**Why:** Plural resource names are the RESTful convention. Inconsistent naming creates confusion for API consumers.

---

## Architecture Guidelines

### Resource Route Registration
```php
Route::resource('photos', PhotoController::class);
// Equivalent to 7 individual route definitions
```

### Nested Resource Pattern
```php
Route::resource('posts.comments', CommentController::class);
// Generates: posts/{post}/comments, posts/{post}/comments/{comment}
```

### Shallow Nesting
Use `->shallow()` when the parent ID is unnecessary for routes that reference the child directly:
```php
Route::resource('posts.comments', CommentController::class)->shallow();
```

---

## Performance Considerations

Resource routes generate 5-7 Route objects. The registration cost is proportional to the number of generated routes, not the number of `Route::resource()` calls. No performance difference vs explicit definition at matching time.

---

## Security Considerations

### Unused Actions
If `->only()` is not used, all 7 actions are routable. A controller method that doesn't exist throws an exception when accessed. Use `->only()` to limit the attack surface to only intended actions.

---

## Common Mistakes

### Not Using apiResource for APIs
Desc: Using `Route::resource()` for JSON APIs.
Cause: Not aware of `apiResource`.
Consequence: Creates unnecessary create/edit routes that return 404.
Better: Use `Route::apiResource()` for API endpoints.

### Forgetting Shallow Nesting
Desc: All nested routes include the parent ID even when unnecessary.
Cause: Not using `->shallow()`.
Consequence: URIs are longer than necessary; `show`, `update`, `destroy` carry redundant parent ID.
Better: Use `->shallow()` for deeply nested resources.

### Mixed Plural/Singular Naming
Desc: `Route::resource('user', ...)` and `Route::resource('photos', ...)` inconsistently.
Cause: Inconsistent naming conventions.
Consequence: Confusing API surface.
Better: Always use plural resource names.

---

## Anti-Patterns

### Mixing Custom and Resource Routes
Adding custom routes inside the same resource group that are not part of the standard 7 verbs. This makes route organization unclear and violates REST conventions.

### Over-Nesting
Nesting resources 3+ levels deep (`posts/{post}/comments/{comment}/replies/{reply}`). This creates unwieldy URIs and complex controllers. Limit nesting to 2 levels.

---

## Examples

### API Resource
```php
Route::apiResource('users', UserController::class);
Route::apiResources([
    'photos' => PhotoController::class,
    'posts' => PostController::class,
]);
```

### Nested with Shallow
```php
Route::resource('posts.comments', CommentController::class)->shallow();
// Generates:
// GET /posts/{post}/comments → index
// GET /posts/{post}/comments/create → create
// POST /posts/{post}/comments → store
// GET /comments/{comment} → show (shallow)
// GET /comments/{comment}/edit → edit (shallow)
// PUT /comments/{comment} → update (shallow)
// DELETE /comments/{comment} → destroy (shallow)
```

---

## Related Topics

### Prerequisites
- **Route Definition** — Foundation for all route registration

### Closely Related
- **Singleton Routes** — For resources with a single instance
- **Route Groups** — Applying middleware/prefixes to resource groups
- **Route Name Generation** — Named routes generated by resources

### Advanced
- **Route Model Binding** — Automatic model resolution for resource parameters

---

## AI Agent Notes

### Important Decisions
- Resource names determine URI patterns and route names — choose once, change rarely
- `apiResource` is preferred for JSON APIs to avoid unnecessary route bloat
- Shallow nesting is recommended for 3+ level nesting

### Important Constraints
- Resource routes must follow the controller method naming convention exactly (index, create, store, show, edit, update, destroy)
- Custom actions beyond these 7 should be defined outside `Route::resource()`

### Rules Generation Hints
- Enforce `apiResource` for API route files
- Enforce `->only()` or `->except()` to explicitly declare resource operations
- Enforce shallow nesting beyond 2 levels

---

## Verification

This document has been validated against:
- `Illuminate\Routing\Router::resource()` — route generation
- `Illuminate\Routing\ResourceRegistrar` — route registration logic
- Laravel RESTful resource controller documentation
