# ECC Standardized Knowledge — Route Model Binding (Explicit)

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Routing System |
| **Knowledge Unit** | Route Model Binding (Explicit) |
| **Difficulty** | Advanced |
| **Category** | Application Architecture — Routing |
| **Last Updated** | 2026-06-02 |

---

## Overview

Explicit route model binding gives developers full control over model resolution by registering binding logic in the route provider or `RouteServiceProvider`. When implicit binding (name matching + `findOrFail`) is insufficient — for example, when joining tables, caching queries, handling authorization, or resolving from external services — explicit binding provides a registration point for custom resolution logic.

`Route::model('user', User::class)` registers a simple class-to-parameter mapping. `Route::bind('user', fn($value) => ...)` registers a closure that receives the URL segment value and returns any resolved value. Both are registered in the `boot()` method of a service provider.

---

## Core Concepts

### Route::model()
`Route::model('user', User::class)` tells the framework: "when a route has `{user}`, resolve it using `User::findOrFail($value)`." This is equivalent to implicit binding but explicitly registered, useful for documenting the binding relationship.

### Route::bind()
`Route::bind('user', fn($value) => User::where('slug', $value)->firstOrFail())` registers a closure that receives the URL segment value. The closure can perform arbitrary resolution logic — cache lookups, external API calls, complex queries.

### Custom Resolution on the Model
Overriding `resolveRouteBinding($value, $field)` on the model class provides model-level control over resolution for both implicit and explicit bindings.

### Missing Model Behavior
Override `resolveRouteBinding()` to throw custom exceptions or return default values instead of the default 404 behavior.

---

## When To Use

- When resolution requires complex queries beyond `findOrFail`
- When binding needs caching (e.g., Redis-backed resolution)
- When resolving from non-database sources (APIs, files, in-memory stores)
- When authorization must be enforced during binding
- When the bound parameter doesn't map to a primary key

---

## When NOT To Use

- Simple ID-based resolution (use implicit binding)
- When the standard `findOrFail` behavior is sufficient
- When custom resolution logic belongs in the controller (keep binding simple)

---

## Best Practices

### Keep Bindings Simple
Registered binding closures should perform ONE operation: resolve a value from a source.

**Why:** Complex binding logic (including authorization, logging, or side effects) runs before middleware and controller code. Failures in binding are hard to diagnose.

### Use Route::bind() Over Route::model()
Use `Route::bind()` with an explicit closure for non-standard resolution.

**Why:** `Route::bind()` is more flexible and documents the resolution logic explicitly. `Route::model()` only adds marginal clarity over implicit binding.

### Register in a Dedicated Provider
Add explicit bindings in a dedicated `BindingsServiceProvider` rather than cluttering `AppServiceProvider`.

**Why:** Separating binding registration from other provider concerns makes bindings easy to audit and maintain.

---

## Architecture Guidelines

### Explicit Binding Registration
```php
// In a service provider's boot()
Route::bind('user', function (string $value) {
    return Cache::remember("user.{$value}", 3600, function () use ($value) {
        return User::where('slug', $value)->firstOrFail();
    });
});
```

### Model-Level Custom Resolution
```php
class User extends Model
{
    public function resolveRouteBinding($value, $field = null): ?Model
    {
        return $this->where('slug', $value)->firstOrFail();
    }
}
```

---

## Performance Considerations

Explicit bindings can introduce performance overhead if the closure performs expensive operations (external API calls, complex queries). Cache results when the same model may be resolved multiple times per request. Binding closures run before controller code, so slow bindings delay the entire response.

---

## Security Considerations

### Binding Authorization
Binding closures run before middleware. Authorization checks in bindings may bypass middleware-based protections. If authorization is needed during binding, use `Gate` or `Policy` directly in the closure rather than relying on route middleware.

### Cache Poisoning
If binding uses caching, ensure cache keys are unique per user context. Otherwise, user A's resolved model may be served to user B from cache.

---

## Common Mistakes

### Business Logic in Bindings
Desc: Adding validation, authorization, logging, or side effects to binding closures.
Cause: Convenience — binding runs automatically.
Consequence: Logic runs before middleware, hard to debug, violates separation of concerns.
Better: Move business logic to controller or middleware.

### Duplicate Binding Logic
Desc: Both `Route::model()` and implicit binding configured for the same parameter.
Cause: Not checking existing bindings.
Consequence: The explicit binding wins, but developer may think implicit binding is active.
Better: Use one binding strategy consistently.

---

## Anti-Patterns

### Binding as Authorization Gate
Using explicit binding to enforce permissions. Binding resolution and authorization are separate concerns. Use middleware, policies, or the controller for authorization.

### Over-Engineering Simple Bindings
Writing complex binding closures for simple `findOrFail` operations. Use implicit binding for standard cases and explicit binding only when genuinely needed.

---

## Examples

### Model Registration
```php
Route::model('user', User::class);
// Equivalent to implicit, but explicitly registered
```

### Custom Resolution with Cache
```php
Route::bind('user', function (string $value) {
    return Cache::remember("user.{$value}", 3600, function () use ($value) {
        return User::with('profile', 'settings')
            ->where('uuid', $value)
            ->firstOrFail();
    });
});
```

### Custom Missing Behavior
```php
public function resolveRouteBinding($value, $field = null): ?Model
{
    $user = User::where('slug', $value)->first();
    if (!$user) {
        throw new CustomUserNotFoundException;
    }
    return $user;
}
```

---

## Related Topics

### Prerequisites
- **Route Model Binding (Implicit)** — Understanding the convention that explicit binding overrides

### Closely Related
- **Custom Route Keys** — `getRouteKeyName()` and model-level overrides
- **Scoped Bindings** — Context-aware binding for nested resources

### Advanced
- **Missing Model Behavior** — Custom 404 or fallback for unresolved bindings
- **Soft Delete Binding** — Including trashed models in binding resolution

---

## AI Agent Notes

### Important Decisions
- Explicit binding via `Route::bind()` overrides implicit binding for the same parameter
- `Route::model()` is essentially explicit documentation of implicit-like behavior
- Binding closures run at route dispatch time, before controller code
- Custom `resolveRouteBinding()` on the model affects ALL bindings of that model

### Important Constraints
- Only one explicit binding can be registered per parameter name
- Binding closures cannot access the authenticated user (auth middleware hasn't run yet)
- Binding closures run on every request that matches the route

### Rules Generation Hints
- Enforce binding logic in dedicated service providers
- Enforce caching for expensive binding resolution
- Ban business logic and authorization from binding closures

---

## Verification

This document has been validated against:
- `Illuminate\Routing\Router::bind()` and `Router::model()` methods
- `Illuminate\Routing\Route::bindingFields()` — field-level binding configuration
- `Illuminate\Database\Eloquent\Model::resolveRouteBinding()` — custom resolution
