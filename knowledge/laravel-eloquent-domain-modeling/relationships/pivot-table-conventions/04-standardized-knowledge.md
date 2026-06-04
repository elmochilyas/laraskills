# Pivot Table Conventions — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Pivot Table Conventions
- **ECC Version:** 1.0

## Overview
Pivot tables are the intermediary database tables that implement many-to-many relationships in Eloquent. Their naming, column structure, and migration design follow strict conventions that eliminate boilerplate and prevent silent data corruption. Every developer working with `BelongsToMany` must internalize the singular-alphabetical-snake-case rule and composite key patterns.

## Core Concepts
- Pivot table name: singular model names in alphabetical order separated by underscore (`role_user` for User + Role)
- Foreign key columns default to `{singular_model}_{model_key}` (e.g., `user_id`, `role_id`)
- Composite primary key on both FKs is the standard — no auto-incrementing `id` column by default
- Custom table name and keys configurable via `belongsToMany()` arguments
- Migration helper: `foreignIdFor(Model::class)` for FK columns
- The `Pivot` class is a lightweight Model subclass with `$incrementing = false` and no timestamps

## When To Use
- Every many-to-many relationship between two Eloquent models
- Role-User, Post-Tag, Product-Category, and similar many-to-many associations
- When the relationship needs extra metadata columns on the join table

## When NOT To Use
- Do NOT use a pivot table for one-to-many relationships (use foreign key on child table)
- Do NOT use a pivot table when the intermediate should be a full model (create a dedicated model with its own table)
- Do NOT use a pivot table for polymorphic many-to-many (use morph pivot pattern)

## Best Practices (WHY)
- Always add a composite primary key or unique constraint on both FK columns — prevents duplicate relationship rows
- Use `$table->timestamps()` and `->withTimestamps()` on the relationship for pivot timestamps
- Index both foreign key columns individually if querying by a single direction frequently
- Use composite primary key instead of auto-increment `id` — the FK pair is the natural key
- Explicitly pass the table name when the generated name might be unexpected

## Architecture Guidelines
- Keep pivot tables lean: composite primary key, two foreign keys, and only essential extra columns
- Use `foreignIdFor()` for FK columns — convention-based column naming
- Add `ON DELETE CASCADE` on both foreign keys for automatic cleanup
- For pivots with extra attributes, consider whether a custom pivot model is needed
- Name pivot tables consistently according to the alphabetical convention

## Performance
- Composite primary key serves as a covering index for equality lookups on both FK columns
- Queries are typically fast because they filter by FK — both columns are naturally selective
- On very large pivot tables (>10M rows), join cost increases linearly — use constrained loading
- Omitting auto-increment `id` saves 4–8 bytes per row, which matters at scale
- Secondary index on a single FK helps when querying by one direction frequently

## Security
- Composite unique constraint prevents duplicate relationship data at the database level
- `attach()` and `sync()` input should be validated — ensure referenced IDs exist
- Pivot table migrations should be tested to ensure column types match related model key types
- No mass-assignment concerns directly on pivot rows via `attach()` (it uses explicit column values)

## Common Mistakes
- Relying on auto-increment `id` as primary key without a unique constraint on the two FKs — allows duplicate rows
- Wrong table name from non-alphabetical model names — `UserLog` vs `LogUser`
- Plural model names causing different pivot table names — always use singular model class names
- Forgetting `->withTimestamps()` when the pivot table has timestamp columns — timestamps never populated

## Anti-Patterns
- **Auto-increment ID as only primary key**: allows duplicate (user_id, role_id) pairs silently
- **Missing timestamp sync**: adding timestamp columns to migration but forgetting `->withTimestamps()` on the relationship
- **Non-alphabetical naming**: using `user_role` when convention expects `role_user` — causes inconsistency
- **Pivot table as dumping ground**: adding every conceivable column to the pivot table instead of creating a custom pivot model

## Examples
```php
// Migration for role_user pivot table
Schema::create('role_user', function (Blueprint $table) {
    $table->foreignIdFor(Role::class)->constrained()->cascadeOnDelete();
    $table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
    $table->timestamps();
    $table->primary(['role_id', 'user_id']);
});

// Model definition
class User extends Model
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)
            ->withTimestamps();
    }
}

// Custom table name
return $this->belongsToMany(Role::class, 'user_role_assignments');

// Custom keys
return $this->belongsToMany(
    Role::class,
    'role_user',
    'user_id',   // FK on pivot for this model
    'role_id'    // FK on pivot for related model
);

// Migration with extra pivot columns
Schema::create('post_tag', function (Blueprint $table) {
    $table->foreignIdFor(Post::class)->constrained()->cascadeOnDelete();
    $table->foreignIdFor(Tag::class)->constrained()->cascadeOnDelete();
    $table->timestamp('added_at')->nullable();
    $table->primary(['post_id', 'tag_id']);
});
```

## Related Topics
- BelongsToMany — many-to-many relationship type
- Custom Pivot Models — extending Pivot with behavior
- Pivot Attributes — reading/writing extra pivot columns
- Pivot Events — lifecycle hooks for attach/detach
- Morph Pivot — polymorphic many-to-many pivot patterns

## AI Agent Notes
- Always generate a composite primary key or unique constraint on both FK columns in pivot migrations
- Use singular alphabetical naming: `role_user` not `user_role` or `roles_users`
- Add `ON DELETE CASCADE` on both foreign keys in the pivot migration
- Use `$table->morphs()` for polymorphic pivot columns
- Remember that pivots don't have auto-increment IDs by default — the FK pair is the primary key

## Verification
- [ ] Pivot table follows alphabetical singular naming convention
- [ ] Composite primary key or unique constraint on both FK columns
- [ ] `ON DELETE CASCADE` on both foreign keys
- [ ] `->withTimestamps()` called on relationship if pivot has timestamp columns
- [ ] Extra pivot columns are whitelisted via `->withPivot()`
- [ ] No duplicate pivot rows can be created
- [ ] Deleting a model cascades to its pivot rows
