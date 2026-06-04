## Use Type-Hinted Parameters Instead of Manual findOrFail

Always type-hint the Eloquent model in controller methods for implicit binding. Never call `Model::findOrFail()` manually for route parameters.

---

## Category

Framework Usage

---

## Rule

Controller methods that receive a model identifier from a route parameter must type-hint the model class. Do not use `Model::findOrFail($id)` inside the controller body.

---

## Reason

Implicit binding eliminates boilerplate, automatically returns 404 for missing models, and documents the expected model type in the method signature. Manual `findOrFail()` duplicates framework behavior and adds unnecessary code to every controller method.

---

## Bad Example

```php
Route::get('/users/{id}', [UserController::class, 'show']);

class UserController
{
    public function show(string $id)
    {
        $user = User::findOrFail($id); // Manual — defeats binding
    }
}
```

---

## Good Example

```php
Route::get('/users/{user}', [UserController::class, 'show']);

class UserController
{
    public function show(User $user)
    {
        // $user is resolved automatically; 404 if not found
    }
}
```

---

## Exceptions

When the parameter value is not a model identifier (e.g., it's a search term or filter value), implicit binding is not applicable.

---

## Consequences Of Violation

Unnecessary boilerplate in every controller method; inconsistent 404 handling; missed opportunity for self-documenting method signatures.

---

## Match Parameter Names Between Route and Controller

The route parameter name must match the controller method's variable name.

---

## Category

Framework Usage

---

## Rule

Ensure the route parameter name (e.g., `{user}`) exactly matches the controller method's type-hinted parameter name (e.g., `User $user`). Do not use different names.

---

## Reason

Implicit binding relies on parameter name matching: `{user}` in the URI maps to `$user` in the controller. A mismatch (e.g., `{user}` in route but `User $account` in controller) silently fails, injecting a raw string instead of a resolved model.

---

## Bad Example

```php
Route::get('/users/{user}', [UserController::class, 'show']);
// Route parameter: user

class UserController
{
    public function show(User $account) // Parameter: $account
    {
        // Mismatch — $account receives raw string, not model
    }
}
```

---

## Good Example

```php
Route::get('/users/{user}', [UserController::class, 'show']);

class UserController
{
    public function show(User $user) // Matches {user}
    {
        // $user is automatically resolved
    }
}
```

---

## Exceptions

When using explicit binding via `Route::bind()`, the binding closure maps the parameter name to the resolved value independently of the controller parameter name.

---

## Consequences Of Violation

Silent failure of implicit binding; raw ID strings injected instead of model instances; confusing errors when `$account->name` throws "call to a member function on string".

---

## Use Inline Syntax Over getRouteKeyName() for Single-Route Customization

Use `{user:slug}` in the route definition instead of overriding `getRouteKeyName()` when only some routes need a custom binding column.

---

## Category

Framework Usage

---

## Rule

When only a subset of routes should bind by a non-ID column, use the inline `{parameter:column}` syntax. Do not override `getRouteKeyName()` unless all routes for that model should use the custom key.

---

## Reason

`getRouteKeyName()` changes the binding column for ALL routes referencing that model. This silently breaks routes that expect ID-based binding. Inline syntax is scoped to the specific route.

---

## Bad Example

```php
class User extends Model
{
    public function getRouteKeyName(): string { return 'slug'; }
}

// Admin route now also binds by slug — broken
Route::get('/admin/users/{user}', [AdminController::class, 'show']);
```

---

## Good Example

```php
// Only this route uses slug binding
Route::get('/users/{user:slug}', [UserController::class, 'show']);
// Admin route still uses default ID binding
Route::get('/admin/users/{user}', [AdminController::class, 'show']);
```

---

## Exceptions

Override `getRouteKeyName()` when the model has no auto-increment ID (e.g., UUID primary key) or when the application always uses a non-ID key for that model.

---

## Consequences Of Violation

All bindings of that model change behavior; unexpected failures in routes that assumed ID-based binding.

---

## Use Scoped Bindings for Multi-Tenant Routes

Always scope nested bindings in multi-tenant applications.

---

## Category

Security

---

## Rule

For nested routes in multi-tenant applications, ensure scoped bindings are enabled (default for resource routes, explicit `->scopeBindings()` for manual routes).

---

## Reason

Without scoped bindings, a user in tenant A can access tenant B's child resources by guessing IDs. Scoped bindings add a `where(foreign_key, parent_id)` constraint that ensures the child belongs to the specified parent.

---

## Bad Example

```php
Route::get('/posts/{post}/comments/{comment}', [CommentController::class, 'show']);
// No scopeBindings() — comment 999 from post 2 accessible at /posts/1/comments/999
```

---

## Good Example

```php
// Resource routes auto-scope
Route::resource('posts.comments', CommentController::class);

// Manual routes need explicit scope
Route::get('/posts/{post}/comments/{comment}', [CommentController::class, 'show'])
    ->scopeBindings();
```

---

## Exceptions

Routes where the child resource is globally unique (e.g., UUID-based IDs) may not need scoping. Document the exception with a comment.

---

## Consequences Of Violation

Cross-tenant data access; users can access resources that don't belong to their assigned parent context.

---

## Use withTrashed() Judiciously

Only add `->withTrashed()` to routes that explicitly handle soft-deleted models.

---

## Category

Security

---

## Rule

Do not call `->withTrashed()` on routes unless the controller intentionally handles soft-deleted resources and is authorized to do so.

---

## Reason

Without `withTrashed()`, soft-deleted models return 404, which is the correct default behavior — deleted resources should not be accessible. Adding `withTrashed()` exposes deleted records and creates a security risk if the controller does not properly gate access to trashed resources.

---

## Bad Example

```php
Route::get('/users/{user}', [UserController::class, 'show'])
    ->withTrashed();
// Deleted users are now accessible — may expose sensitive data
```

---

## Good Example

```php
// Separate route for trashed resources, with explicit authorization
Route::get('/admin/users/{user}/history', [AdminController::class, 'history'])
    ->withTrashed()
    ->middleware('can:viewTrashed,App\Models\User');
```

---

## Exceptions

Admin-only routes that specifically need to display or restore deleted resources. Always pair with authorization middleware.

---

## Consequences Of Violation

Accidental exposure of soft-deleted records; data leakage of deleted user information; potential compliance violations.
