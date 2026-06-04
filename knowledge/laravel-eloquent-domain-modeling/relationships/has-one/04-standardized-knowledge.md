# HasOne — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** HasOne
- **ECC Version:** 1.0

## Overview
`HasOne` defines a one-to-one relationship where the foreign key resides on the related (child) table. It is the inverse of `BelongsTo`. The parent model references exactly zero or one child row. This is the most constrained cardinality in Eloquent, used when a child cannot logically exist without its parent.

## Core Concepts
- Foreign key convention: child table contains `{parent}_id` column; local key defaults to parent's `id`
- Definition: `return $this->hasOne(Profile::class);` on parent; custom keys via extra arguments
- Inverse: child defines `belongsTo(Parent::class)` for bidirectional access
- Dynamic property returns single model or `null`; method call returns `HasOne` builder
- `HasOne` extends `HasOneOrMany` — the only difference from `HasMany` is `getResults()` calls `first()` instead of `get()`
- Eager loading uses `WHERE foreign_key IN (...parent_keys)`; matching groups children by FK and attaches via `setRelation()`

## When To Use
- Modeling domain concepts where a child cannot exist without the parent (User→Profile, Order→Invoice)
- One-to-one profile/settings/extended metadata patterns
- Single-child aggregates where the relationship is mandatory for the domain
- Self-referential single relationships (User→Referrer)

## When NOT To Use
- Do NOT use when the child can belong to multiple parent types (use polymorphic `MorphOne`)
- Do NOT use when you need to enforce uniqueness at the database level without a UNIQUE constraint
- Do NOT use for one-to-one relationships where the FK belongs on the parent table (use `BelongsTo` on the child)
- Do NOT use when the child may have multiple records and you need the "latest" (use `HasOneOfMany`)

## Best Practices (WHY)
- Always add a database `UNIQUE` constraint on the foreign key column — Eloquent does not enforce uniqueness
- Always define the inverse `BelongsTo` on the child model for bidirectional access
- Use `$user->profile()->create($data)` for child creation to auto-associate the FK
- Set `ON DELETE CASCADE` on the foreign key or handle cascade in model events
- Eager-load the relationship in serialization contexts to avoid N+1

## Architecture Guidelines
- Keep one-to-one relationships for genuinely singular domain concepts; don't split models arbitrarily
- Embed the child's lifecycle in the parent — deleting the parent should cascade to the child
- Use `$with` only if the relationship is needed on every single query for the parent
- Prefer eager loading via `with()` at the query site rather than `$with` for most cases

## Performance
- Eager loading executes a single `WHERE IN` query — efficient for any parent set size
- `has('profile')` generates `WHERE EXISTS (SELECT 1 FROM ...)` — scales linearly with index coverage
- Index the foreign key column on the child table; without it, both eager loading and exists queries become full table scans
- Hydration overhead is 2–5µs per model; identical to HasMany since they share the same parent class

## Security
- Validate parent existence before creating child records via the relationship
- Ensure foreign key columns are not mass-assignable on the child model
- Use `firstOrCreate()` or `updateOrCreate()` with unique constraints to prevent duplicate children in concurrent requests

## Common Mistakes
- Assuming uniqueness without a database UNIQUE constraint — duplicate children silently exist
- Confusing direction: putting `hasOne` on the child model instead of `belongsTo`; the child always uses `belongsTo`
- Missing the inverse `belongsTo` — breaks bidirectional access and prevents child-from-parent navigation
- Forgetting that `HasOne` silently returns the first child by primary key if duplicates exist — a data integrity risk

## Anti-Patterns
- **HasOne as a lazy-load crutch**: defining `hasOne` but never eager-loading, causing N+1 on every access
- **HasOne for optional metadata that should be a JSON column**: splitting a model into parent+child when a single table with nullable columns would suffice
- **Missing cascade on delete**: letting orphaned children accumulate when parents are deleted
- **HasOne without inverse on child**: assuming the child never needs to reference the parent

## Examples
```php
// Definition
class User extends Model
{
    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }
}

class Profile extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

// Create child via relationship
$user->profile()->create(['avatar' => 'photo.jpg']);

// Eager loading
$users = User::with('profile')->get();
foreach ($users as $user) {
    echo $user->profile?->avatar;
}

// Existence check
$usersWithProfile = User::has('profile')->get();
$usersWithoutProfile = User::doesntHave('profile')->get();

// Custom keys
return $this->hasOne(Profile::class, 'user_id', 'id');
```

## Related Topics
- BelongsTo — inverse of HasOne
- HasMany — one-to-many variant (same parent class)
- HasOneOfMany — latest/oldest of a one-to-many
- HasOneThrough — one-to-one across an intermediate

## AI Agent Notes
- When generating HasOne relationships, always include the inverse BelongsTo on the child model
- Always recommend a UNIQUE constraint on the child's foreign key column in the migration
- Use `$user->profile()->create()` not `Profile::create()` when creating children to auto-set the FK
- Remember that `hasOne` + `latestOfMany` creates a `HasOneOfMany` relationship, not a plain `HasOne`
- The eager loading SQL for HasOne is identical to HasMany — only the result hydration differs (first vs get)

## Verification
- [ ] Child table has a UNIQUE constraint on the foreign key column
- [ ] Child model defines the inverse `belongsTo` relationship
- [ ] `$parent->child` returns a single model instance or null
- [ ] `Parent::with('child')->get()` executes exactly 2 queries
- [ ] Deleting the parent cascades to the child (ON DELETE CASCADE or event)
- [ ] `has('child')` produces correct `WHERE EXISTS` SQL
- [ ] Duplicate child creation is prevented at the database level
