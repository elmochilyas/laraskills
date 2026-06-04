# ECC Standardized Knowledge — Custom Route Keys

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Routing System |
| **Knowledge Unit** | Custom Route Keys |
| **Difficulty** | Intermediate |
| **Category** | Application Architecture — Routing |
| **Last Updated** | 2026-06-02 |

---

## Overview

Custom route keys allow routes to bind by non-primary-key columns. By default, route model binding resolves models by the `id` column. Custom keys change this to any database column — `slug`, `uuid`, `username`, etc. — either globally (via `getRouteKeyName()` on the model) or per-route (via inline `{user:slug}` syntax).

The per-route syntax (`{user:slug}`) is preferred because it allows different routes for the same model to use different keys without affecting each other. The model-level override (`getRouteKeyName()`) should only be used when ALL bindings of that model should use the same non-ID key.

---

## Core Concepts

### Inline Custom Key
`Route::get('/users/{user:slug}', ...)` resolves `User::where('slug', $value)->firstOrFail()`. The key is specified directly in the route definition.

### getRouteKeyName()
Override on the model to set the default key for ALL bindings of that model:
```php
public function getRouteKeyName(): string { return 'slug'; }
```

### getRouteKey()
Returns the value of the route key column for a given model instance. Used when generating URLs via `route('users.show', $user)`.

---

## When To Use

- Resources identified by slugs in URLs
- Resources using UUIDs or ULIDs instead of auto-increment IDs
- Resources where the primary key should not be exposed in URLs
- SEO-friendly URL patterns

---

## When NOT To Use

- Simple ID-based bindings (use default behavior)
- When only one route needs a non-standard key (use inline syntax, not model override)
- When the column is not unique (binding assumes unique resolution)

---

## Best Practices

### Prefer Inline Syntax Over Model Override
Use `{user:slug}` in the route definition rather than overriding `getRouteKeyName()`.

**Why:** Inline syntax is explicit at the route level. Model overrides affect ALL routes and may silently break routes that expect ID-based binding.

### Ensure Column Uniqueness
Custom keys MUST reference unique columns with a database unique constraint.

**Why:** Binding resolves via `where(key, value)->firstOrFail()`. Non-unique columns silently return the first matching record, which may be wrong.

### Document Custom Keys in Route Files
Add comments near route definitions that use custom keys.

**Why:** Developers reading the route file need to know which column is used for binding without digging into the model.

---

## Architecture Guidelines

### Inline Syntax
```php
Route::get('/users/{user:slug}', [UserController::class, 'show']);
Route::get('/posts/{post:uuid}', [PostController::class, 'show']);
```

### Model Override
```php
class User extends Model
{
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
```

### URL Generation
```php
route('users.show', $user); // Uses getRouteKey() value
```

---

## Performance Considerations

Custom keys require a database query on a potentially non-indexed column. Always ensure the custom key column has a database index. UUID columns are slower than integer IDs for indexed lookups but acceptable for typical traffic volumes.

---

## Security Considerations

### UUID/ULID Exposure
While UUIDs don't expose sequential IDs, they still identify specific resources. UUID-based routes should still implement proper authorization. Security through obscurity (hiding behind UUIDs) is not sufficient.

### Slug Predictability
Sequential or predictable slugs (e.g., `my-post-1`, `my-post-2`) can be enumerated. For sensitive resources, use UUIDs or random strings.

---

## Common Mistakes

### Non-Unique Keys
Desc: Binding by a column that is not unique (e.g., `first_name`).
Cause: Not adding a unique constraint to the binding column.
Consequence: Wrong model resolved when duplicates exist.
Better: Only bind on columns with unique constraints.

### Global Override for Single-Route Need
Desc: Changing `getRouteKeyName()` when only one route needs a custom key.
Cause: Not knowing about inline `{user:slug}` syntax.
Consequence: All bindings of that model change behavior.
Better: Use inline syntax for single-route customization.

### Missing Index on Custom Key
Desc: Custom key column without a database index.
Cause: Forgetting to add an index to the migration.
Consequence: Slow queries on large tables.
Better: Always index custom binding columns.

---

## Anti-Patterns

### Complex Key Generation
Using custom keys that require joins or computed values. Binding resolution should be a simple WHERE clause on a single column.

### Exposing Internal IDs Through URLs
Putting `{user:id}` in URLs that are publicly accessible. Auto-increment IDs reveal database structure and entity count. Use slugs or UUIDs for public routes.

---

## Examples

### Slug-Based Route
```php
Route::get('/posts/{post:slug}', [PostController::class, 'show']);
// Resolves: Post::where('slug', $value)->firstOrFail()
```

### UUID-Based Route
```php
Route::get('/api/users/{user:uuid}', [UserController::class, 'show']);
// Resolves: User::where('uuid', $value)->firstOrFail()
```

---

## Related Topics

### Prerequisites
- **Route Model Binding (Implicit)** — Foundation for key-based binding
- **Route Definition** — Parameter definition in routes

### Closely Related
- **Route Model Binding (Explicit)** — Custom resolution with bind()
- **Scoped Bindings** — Context-aware key resolution

### Cross-Domain
- **Eloquent & Domain Modeling** — Model key design and unique constraints

---

## AI Agent Notes

### Important Decisions
- Inline syntax (`{user:slug}`) was introduced in Laravel 8
- `getRouteKeyName()` affects URL generation via `route()` helper AND binding
- Custom keys must have database indexes for performance
- UUIDs are slower than integers for indexed lookups

### Important Constraints
- The binding column must exist in the database table
- The column must return a single model (unique constraint)
- `getRouteKey()` on the model must return the custom key value for URL generation

### Rules Generation Hints
- Enforce unique constraints on custom key columns
- Prefer inline syntax over `getRouteKeyName()` for single-route customization
- Enforce database indexes on binding columns

---

## Verification

This document has been validated against:
- `Illuminate\Database\Eloquent\Model::getRouteKeyName()` — key column resolution
- `Illuminate\Database\Eloquent\Model::getRouteKey()` — URL generation value
- `Illuminate\Routing\Route::bindingFields()` — inline syntax parsing
