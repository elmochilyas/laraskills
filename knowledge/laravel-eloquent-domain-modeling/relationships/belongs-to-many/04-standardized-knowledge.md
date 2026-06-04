# BelongsToMany — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** BelongsToMany
- **ECC Version:** 1.0

## Overview
`BelongsToMany` defines a many-to-many relationship mediated by a pivot (intermediate) table. Each model can have multiple related records, and each related record can belong to multiple parents. This is the only Eloquent relationship type that inherently requires a third database table, and it is the most complex built-in relationship.

## Core Concepts
- Pivot table convention: singular model names in alphabetical order separated by underscore (`role_user`)
- Definition: `return $this->belongsToMany(Role::class);` on both models for symmetric access
- Dynamic property returns Collection of related models, each with a `pivot` attribute containing pivot data
- Extra pivot columns via `->withPivot('expires_at')`; timestamps via `->withTimestamps()`
- Custom pivot models via `->using(CustomPivot::class)`
- Core operations: `attach()`, `detach()`, `sync()`, `toggle()`, `updateExistingPivot()`

## When To Use
- Many-to-many relationships where both sides can have multiple related records independently
- Role-based access control: User ↔ Role
- Tagging systems: Post ↔ Tag
- Favorites/bookmarks: User ↔ Post (via custom pivot table)
- Any relationship requiring extra metadata on the association (quantity, expiry, role)

## When NOT To Use
- Do NOT use for one-to-many relationships (use `HasMany` + `BelongsTo`)
- Do NOT use when the intermediate table needs to be a full domain entity (promote to a dedicated model)
- Do NOT use for polymorphic many-to-many relationships (use `MorphToMany`)
- Do NOT use when the pivot only contains two foreign keys and no extra data — still valid but consider if `HasMany` through a dedicated model is more appropriate

## Best Practices (WHY)
- Always add a composite unique constraint on both FK columns in the pivot migration to prevent duplicates
- Define `belongsToMany` on both models for bidirectional access
- Use `->withPivot()` to whitelist only the extra columns you need
- Use `syncWithoutDetaching()` for additive-only sync operations
- Clean up pivot rows on model delete via `deleting` event or `ON DELETE CASCADE`

## Architecture Guidelines
- Keep pivot tables lean: composite primary key, two foreign keys, and only essential extra columns
- Use custom pivot models (`->using()`) when the pivot has behavior, events, or complex casting
- Prefer `sync()` with attributes for atomic pivot updates over multiple `attach()`/`detach()` calls
- Index both foreign key columns individually and consider a composite index on the pair
- Detach all pivot rows when deleting a model to prevent orphaned relationship data

## Performance
- `BelongsToMany` eager loading uses a join query — with 5+ such relationships, query volume multiplies
- Composite unique index serves as a covering index for equality lookups on both FK columns
- `detach()` generates a single `DELETE` query — efficient with proper indexing
- `sync()` computes diff via `SELECT` then executes `INSERT`/`DELETE` — wrap in transaction for consistency
- For massive pivot tables (>1M rows), consider chunked sync or direct pivot table queries

## Security
- Validate that related models exist before attaching (IDs reference real records)
- Ensure `sync()` input is sanitized — never pass user input directly as IDs without validation
- Pivot data should be validated separately from model data
- Extra pivot columns exposed in API responses require explicit whitelisting via `withPivot()`

## Common Mistakes
- Missing inverse: only one model defines `belongsToMany`, making the relationship one-directional
- Ignoring pivot data: accessing `$role->pivot->column` without `->withPivot('column')` returns error
- N+1 with pivot model access: accessing `$role->pivot->customColumn` in a loop without eager loading
- Wrong pivot column order: second argument is the FK on the defining model's side; third is the related key

## Anti-Patterns
- **Missing composite unique constraint**: allowing duplicate pivot rows silently corrupts the relationship
- **Auto-increment ID as primary key without unique constraint on FKs**: duplicates are possible
- **Loading pivot data that's never used**: selecting all pivot columns when only FKs are needed
- **sync() in a loop**: calling sync() for each parent individually instead of batching

## Examples
```php
// Definition
class User extends Model
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)
            ->withPivot('expires_at')
            ->withTimestamps()
            ->as('membership');
    }
}

class Role extends Model
{
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}

// CRUD operations
$user->roles()->attach($roleId, ['expires_at' => now()]);
$user->roles()->detach($roleId);
$user->roles()->sync([1, 2, 3]);
$user->roles()->syncWithoutDetaching([4, 5]);
$user->roles()->toggle([1, 2]);
$user->roles()->updateExistingPivot($roleId, ['expires_at' => now()->addYear()]);

// Pivot column filtering (Laravel 10+)
$user->roles()->wherePivot('expires_at', '>=', now())->get();

// Eager loading
$users = User::with('roles')->get();
foreach ($users as $user) {
    foreach ($user->roles as $role) {
        echo $role->membership->expires_at;
    }
}
```

## Related Topics
- Pivot Table Conventions — naming, structure, migration patterns
- Custom Pivot Models — extending Pivot with behavior
- Pivot Attributes — reading/writing extra pivot columns
- Pivot Events — lifecycle hooks for attach/detach
- MorphToMany — polymorphic many-to-many variant

## AI Agent Notes
- Always generate a composite unique constraint on both FK columns in pivot migrations
- Use `sync()` for atomic bulk updates, `attach()`/`detach()` for individual operations
- Remember that deleting a parent does NOT cascade-delete the related records — only pivot rows must be cleaned
- Use `->as('customName')` for clearer pivot access naming
- The `sync()` method computes diff via SELECT — for very large pivot sets, consider batching

## Verification
- [ ] `$parent->related` returns Collection of related models
- [ ] Each related model has `pivot` attribute with extra columns
- [ ] `sync()` correctly inserts, updates, and deletes pivot rows
- [ ] Composite unique constraint prevents duplicate pivot rows
- [ ] Deleting model cascades to pivot rows (event or DB cascade)
- [ ] Custom pivot model methods work as expected
- [ ] Eager loading produces exactly 2 queries
