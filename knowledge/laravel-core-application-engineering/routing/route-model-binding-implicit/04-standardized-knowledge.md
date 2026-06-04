# ECC Standardized Knowledge — Route Model Binding (Implicit)

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Routing System |
| **Knowledge Unit** | Route Model Binding (Implicit) |
| **Difficulty** | Foundation |
| **Category** | Application Architecture — Routing |
| **Last Updated** | 2026-06-02 |

---

## Overview

Implicit route model binding automatically resolves Eloquent model instances from route parameters. When a route parameter name matches a controller method's type-hinted parameter name, Laravel automatically queries the database and injects the model instance. If the model is not found, a 404 response is automatically returned.

The core mechanism is parameter name matching: `Route::get('/users/{user}', fn(User $user) => ...)` — the `{user}` parameter is resolved to the `User` model with that ID because the parameter name matches the type-hinted variable name `$user`. This convention eliminates the manual `User::findOrFail($id)` boilerplate from every controller method.

---

## Core Concepts

### Name-Based Resolution
The route parameter `{user}` matches the controller parameter `User $user` by name. The framework calls `User::findOrFail($id)` where `$id` is the URL segment value.

### Soft Deleted Models
Use `Route::model('user', User::class)->withTrashed()` to include soft-deleted models in binding resolution.

### Custom Column Binding
Use `Route::get('/users/{user:username}', ...)` to bind by a column other than `id`. The model is resolved via `User::where('username', $value)->firstOrFail()`.

### Route Key Customization
Override `getRouteKeyName()` on the model to set a default custom key for all implicit bindings of that model.

---

## When To Use

- Every route where a model ID is a URL parameter
- Controller methods that need a model instance
- API routes where model IDs identify resources
- Nested resource routes

---

## When NOT To Use

- When custom resolution logic is needed beyond a simple `findOrFail`
- When binding requires authorization checks (use explicit binding or middleware)
- When the route parameter doesn't directly map to a model

---

## Best Practices

### Use Type-Hinted Parameters in Controllers
Always type-hint the model in controller methods for automatic implicit binding.

**Why:** Eliminates manual `findOrFail()` calls, automatically returns 404 for missing models, and documents the expected model type in the method signature.

### Use Custom Column Binding for Non-ID Lookups
Use `{user:slug}` syntax when routes should resolve by a column other than the primary key.

**Why:** Explicit column binding is clearer than overriding `getRouteKeyName()`, which affects ALL bindings of that model globally.

### Use withTrashed() Judiciously
Only include soft-deleted models when the route context requires it.

**Why:** Accidentally showing soft-deleted records to unauthorized users is a common security issue. Only use `withTrashed()` when the controller explicitly handles trashed models.

---

## Architecture Guidelines

### Resolution Flow
```
{user} in URI → controller parameter User $user
  → Framework calls User::resolveRouteBinding($value)
  → Default: User::findOrFail($value)
  → Returns User instance or throws ModelNotFoundException → 404
```

### Custom Route Key
```php
Route::get('/users/{user:username}', [UserController::class, 'show']);
// Resolves via User::where('username', $value)->firstOrFail()
```

### Model-Level Custom Key
```php
class User extends Model
{
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
// Now ALL {user} bindings use slug instead of id
```

---

## Performance Considerations

Each implicit binding executes a database query. For nested resources with multiple bindings (e.g., `posts/{post}/comments/{comment}`), two queries are executed. Use eager loading or explicit binding to optimize N+1 patterns.

---

## Security Considerations

### Unscoped Binding in Multi-Tenant Apps
Implicit binding without scoping allows cross-tenant resource access. A user in tenant A can access tenant B's resources by guessing IDs. Always use scoped bindings for multi-tenant routes.

### Soft Delete Visibility
Without `withTrashed()`, soft-deleted models return 404. This is usually correct — deleted resources should not be accessible. Only add `withTrashed()` when the route explicitly handles trashed models.

---

## Common Mistakes

### Parameter Name Mismatch
Desc: Route parameter `{user}` but controller parameter `User $account`.
Cause: Not matching the parameter name to the type-hinted variable name.
Consequence: Implicit binding fails; raw ID string injected instead of model.
Better: Match parameter names: `{user}` → `User $user`.

### Assuming Binding by ID
Desc: Route has `{user:slug}` but controller expects `$user->id`.
Cause: Not checking which column the binding uses.
Consequence: Wrong model resolved if slug != id.
Better: Document the binding column explicitly.

### Forgetting withTrashed()
Desc: Route should include soft-deleted models but doesn't use `withTrashed()`.
Cause: Not aware of the soft-delete binding option.
Consequence: Soft-deleted models return 404.
Better: Add `->withTrashed()` for routes handling trashed resources.

---

## Anti-Patterns

### Overriding getRouteKeyName() for a Single Route
Changing `getRouteKeyName()` on the model when only one route needs custom binding. Affects all bindings globally. Use inline `{user:column}` syntax instead.

### Manual findOrFail() in Controllers
Writing `User::findOrFail($id)` when implicit binding would handle it automatically. This defeats the purpose of the binding system and introduces boilerplate.

---

## Examples

### Standard Implicit Binding
```php
Route::get('/users/{user}', function (User $user) {
    return $user; // Automatically resolved
});
```

### Custom Column Binding
```php
Route::get('/users/{user:slug}', [UserController::class, 'show']);
```

### With Trashed
```php
Route::get('/users/{user}', [UserController::class, 'show'])->withTrashed();
```

---

## Related Topics

### Prerequisites
- **Route Definition** — Foundation for parameter definition
- **Eloquent Basics** — Model resolution mechanism

### Closely Related
- **Route Model Binding (Explicit)** — Custom resolution logic
- **Custom Route Keys** — `getRouteKeyName()` and inline key syntax
- **Scoped Bindings** — Multi-tenant binding scope enforcement

### Advanced
- **Soft Delete Binding** — `withTrashed()` pattern for deleted models

### Cross-Domain
- **Eloquent & Domain Modeling** — Route key name design on models

---

## AI Agent Notes

### Important Decisions
- Parameter name matching is case-insensitive — `{User}` matches `User $user`
- Custom column `{user:slug}` was introduced in Laravel 8
- `getRouteKeyName()` affects ALL bindings — use inline syntax for single-route customization

### Important Constraints
- Implicit binding only works with Eloquent models
- Non-model type hints (e.g., `string $user`) do NOT trigger binding
- The binding column must exist in the database

### Rules Generation Hints
- Enforce type-hinted parameters over manual `findOrFail()` in controllers
- Enforce `{user:column}` over `getRouteKeyName()` for single-route customization
- Enforce scoped bindings for multi-tenant routes

---

## Verification

This document has been validated against:
- `Illuminate\Routing\ImplicitRouteBinding::resolveForRoute()` — binding resolution
- `Illuminate\Database\Eloquent\Model::resolveRouteBinding()` — default findOrFail
- `Illuminate\Database\Eloquent\Model::resolveSoftDeletableRouteBinding()` — withTrashed
