# Skill: Configure Custom Route Keys with Inline Syntax

## Purpose

Bind route parameters by non-primary-key columns (slug, UUID, username) using the inline `{parameter:column}` syntax, so that specific routes resolve models by a custom column without affecting default ID-based binding on other routes.

## When To Use

- Resources identified by slugs in public URLs
- Resources using UUIDs or ULIDs instead of auto-increment IDs
- Resources where the primary key should not be exposed in URLs
- SEO-friendly URL patterns

## When NOT To Use

- Simple ID-based bindings (use default implicit binding)
- When ALL routes for a model need the same custom key (consider `getRouteKeyName()`)
- When the column is not unique (binding requires deterministic resolution)

## Prerequisites

- Route model binding (implicit) foundation
- Database column with unique constraint for the custom key
- Database index on the custom key column

## Inputs

- Route parameter name
- Custom key column name (must exist in the model's table)
- Model class for the binding

## Workflow

1. Add the custom key column to the model's database migration with `->unique()->index()`
2. Run the migration to create the column
3. Add the route using `{parameter:column}` syntax in the URI: `Route::get('/users/{user:slug}', [UserController::class, 'show'])`
4. Add a comment above the route documenting the binding column
5. Verify the binding works: request a URL with a valid custom key value
6. Verify 404 for non-existent custom key values
7. Test URL generation with `route('name', $model)` to confirm `getRouteKey()` returns the custom key value

## Validation Checklist

- [ ] Custom key column has a database unique constraint
- [ ] Custom key column has a database index
- [ ] Inline `{parameter:column}` syntax used, not `getRouteKeyName()` override
- [ ] Inline comment documents the binding column
- [ ] `route()` helper generates correct URLs using the custom key
- [ ] 404 returned for non-matching custom key values

## Common Failures

### Non-unique keys
Binding by non-unique columns (e.g., `first_name`) silently returns the first matching record. Always enforce unique constraints on binding columns.

### Missing index on custom key
Custom key queries perform `WHERE column = ?` without an index on large tables. Always add `->index()` to the column migration.

### Global override for single-route need
Using `getRouteKeyName()` when only one route needs a custom key breaks all other bindings. Use inline syntax instead.

## Decision Points

### Inline Syntax vs getRouteKeyName()?
Use inline `{user:slug}` for single-route customization. Use `getRouteKeyName()` only when the model has no auto-increment ID (UUID primary key) or every binding should use the custom key.

### Slug vs UUID vs ULID?
Slugs for SEO-friendly, human-readable URLs. UUIDs for obscuring resource identity. ULIDs for time-sortable, UUID-like identifiers.

## Performance Considerations

- Custom key queries perform a database lookup on the custom column — always index the column
- UUID columns are slower than integers for indexed lookups but acceptable for typical traffic
- Custom keys add one additional database query per binding (same as default ID binding)

## Security Considerations

- UUIDs hide resource identity but are not authorization — always implement proper authorization
- Sequential slugs (e.g., `my-post-1`) can be enumerated — use UUIDs for sensitive resources
- Avoid exposing auto-increment IDs in public URLs to prevent entity count disclosure

## Related Rules

- Prefer Inline Custom Key Syntax
- Enforce Unique Constraints on Custom Key Columns
- Index Custom Key Columns
- Avoid Exposing Auto-Increment IDs in Public URLs
- Document Custom Keys in Route Files

## Related Skills

- Implement Implicit Route Model Binding
- Implement Explicit Route Model Binding
- Define Application Routes

## Success Criteria

- Route resolves models by the specified custom column
- Non-matching values return 404
- `route()` helper generates correct URLs with custom key values
- Other routes for the same model still bind by the default key
- The binding column is documented in an inline comment

---

# Skill: Implement Model-Level Route Key Customization

## Purpose

Override `getRouteKeyName()` on an Eloquent model to change the default binding column for ALL routes referencing that model, used when the model has no auto-increment ID or when the application always uses a non-ID key for all interactions.

## When To Use

- Models using UUID or ULID primary keys
- Applications that never expose auto-increment IDs for a specific model
- Models that always use a slug-based identifier across all routes

## When NOT To Use

- When only a subset of routes need a custom key (use inline `{parameter:column}` syntax)
- When the primary key is already the correct identifier for all routes
- When the custom key column is not unique

## Prerequisites

- Eloquent model class
- Custom key column exists in the database with unique constraint and index
- Understanding that this affects ALL route bindings and URL generation

## Inputs

- Model class to customize
- Custom key column name (must be unique and indexed)

## Workflow

1. Ensure the custom key column exists in the database with `->unique()->index()`
2. Override `getRouteKeyName()` on the model to return the custom column name
3. Verify that route bindings now resolve by the custom key
4. Test URL generation: `route('users.show', $user)` should generate URLs with the custom key value
5. Update any existing routes that relied on ID-based binding
6. Verify admin/internal routes still resolve correctly

## Validation Checklist

- [ ] `getRouteKeyName()` returns the correct column name
- [ ] Column has a unique constraint
- [ ] Column has a database index
- [ ] All routes binding this model use the new key
- [ ] URL generation via `route()` produces correct URLs
- [ ] Documentation updated for the model's binding behavior

## Common Failures

### Breaking existing routes
Changing `getRouteKeyName()` affects ALL routes. Existing admin/internal routes that expected ID binding will break. Audit all routes before changing.

### Forgetting getRouteKey() consistency
`getRouteKeyName()` changes both binding AND URL generation. Ensure `getRouteKey()` returns the correct value for URL generation (default behavior uses `getRouteKeyName()`).

## Decision Points

### Model override vs inline syntax?
Model override when all interactions use the same key. Inline syntax when different routes need different keys.

## Performance Considerations

Same as inline custom keys — the column must be indexed. The performance profile is identical to default ID binding, just on a different column.

## Security Considerations

- Changing the global key affects public and admin routes equally — ensure admin routes that need ID-based lookup still work
- URL generation uses the new key — existing external links with IDs will break

## Related Rules

- Prefer Inline Custom Key Syntax (exception: model-level override when appropriate)
- Enforce Unique Constraints on Custom Key Columns
- Index Custom Key Columns

## Related Skills

- Configure Custom Route Keys with Inline Syntax
- Implement Implicit Route Model Binding
- Define Application Routes

## Success Criteria

- All route bindings for the model resolve by the custom key
- `route()` helper generates URLs with custom key values
- All routes and URL references continue to work after the change
- The custom key column is properly indexed and unique-constrained
