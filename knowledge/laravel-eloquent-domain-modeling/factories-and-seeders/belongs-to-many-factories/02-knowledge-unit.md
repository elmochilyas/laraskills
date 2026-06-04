# BelongsToMany Factories

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Factories & Seeders
- **Last Updated:** 2026-06-02

## Executive Summary
Factory relationships for `BelongsToMany` (many-to-many) use the `hasAttached()` method to seed pivot table records alongside the parent and related models. Unlike `HasMany` and `BelongsTo`, many-to-many requires a pivot table with foreign keys to both models. `hasAttached()` handles creating the related models, inserting pivot rows, and optionally setting pivot attributes.

## Core Concepts
- **hasAttached() method:** Chained on the factory builder: `User::factory()->hasAttached(Role::factory()->count(3))->create()`. Creates 3 roles and attaches each to the user via the pivot table.
- **Pivot attributes:** Pass an array or closure as the second argument to set pivot data (e.g., `team_id`, `expires_at`). Pass a single array for uniform pivot data, or a closure for per-attachment pivot values.
- **Existing model attachment:** Pass existing model instances: `User::factory()->hasAttached($role)->create()`. Skips role creation but still inserts pivot rows.
- **Magic has{Relation} methods:** `User::factory()->hasRoles(3)->create()` â€” shorthand for `hasAttached()` with inferred factory.
- **Automatic pivot table resolution:** The factory reads the `BelongsToMany` relationship to determine the pivot table name and foreign key names.

## Mental Models
- **Bridging two worlds:** Many-to-many factories bridge two independent model types through a pivot. The `hasAttached()` method creates both sides and the bridge.
- **Sticker board analogy:** Think of attaching models like putting stickers on a board. The board (parent) exists, the stickers (related models) are created, and each attachment (pivot row) records which sticker is on which board and any extra metadata.
- **Pivot as a contract:** The pivot row is the contract between two models. `hasAttached()` lets you specify the terms of that contract (pivot attributes) during factory creation.

## Internal Mechanics

> **Reference:** 
- `hasAttached()` stores the relationship config in `$hasRelations` with a special marker indicating it's a BelongsToMany attachment.
- During creation, the parent is created first, then each related model is created (if a factory was given), then `attach()` is called on the relationship with the model IDs and pivot attributes.
- `sync()` or `attach()` is used internally, depending on whether multiple attachments are expected to replace or append.
- Pivot attribute closures receive the current model instance and the related model instance, enabling per-attachment customization.

## Patterns
### Basic Many-to-Many Attachment
```php
User::factory()->hasAttached(Role::factory()->count(3))->create();
```

### With Uniform Pivot Attributes
```php
User::factory()
    ->hasAttached(
        Role::factory()->count(2),
        ['assigned_at' => now()]
    )
    ->create();
```

### With Per-Attachment Pivot Closure
```php
User::factory()
    ->hasAttached(
        Role::factory()->count(3),
        fn (User $user, Role $role) => ['assigned_at' => now()]
    )
    ->create();
```

### Attaching Existing Models
```php
$role = Role::factory()->create();
User::factory()
    ->hasAttached($role, ['is_primary' => true])
    ->create();
```

### Mixed Existing and New Attachments
```php
$adminRole = Role::factory()->create();
User::factory()
    ->hasAttached($adminRole, ['is_primary' => true])
    ->hasAttached(Role::factory()->count(2))
    ->create();
```

### Magic Method
```php
User::factory()->hasRoles(2, ['assigned_at' => now()])->create();
```

## Architectural Decisions
### Decision: `hasAttached()` vs. `afterCreating` + `attach()`
- **`hasAttached()`:** Declarative, handles pivot data, works with existing models. Preferred for all standard many-to-many setups.
- **`afterCreating`:** Required when attachment logic depends on runtime conditions (e.g., attach only if certain state is active).
- **Tradeoff:** `hasAttached()` covers 95% of cases. Fall back to `afterCreating` for conditional logic.

### Decision: Single Array vs. Closure for Pivot Attributes
- **Single array:** All pivot rows get the same attribute values. Efficient, readable.
- **Closure:** Each attachment gets custom pivot data (e.g., different `assigned_at` timestamps). More flexible but verbose.
- **Tradeoff:** Use arrays when pivot data is uniform. Use closures when it varies per attachment.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Handles pivot table automatically | Implicit pivot table name may not match custom names | Verify `belongsToMany` relationship defines correct table |
| Supports both new and existing models | Mixed attachments can lead to duplicate entries | Use `sync()` logic vs. `attach()` depending on desired behaviour |
| Pivot attribute closures provide rich customization | Closure signature must match expected parameters | Type-hint `(User $user, Role $role)` for clarity |
| Magic methods reduce boilerplate for simple cases | Lack of explicit pivot attribute support in magic method call | Use explicit `hasAttached()` when pivot data is needed |

## Performance Considerations
- Each attached model creates one INSERT (model) + one INSERT (pivot). 10 users Ã— 5 roles = 10 user queries + 50 role queries + 50 pivot queries.
- Attaching existing models skips the model INSERT but still inserts pivot rows.
- For bulk pivot seeding, consider raw `DB::table('role_user')->insert([...])` after model creation.
- Pivot attribute closures are called once per attachment â€” keep them cheap.

## Production Considerations
- Never use `hasAttached()` in production code paths.
- In seeder scripts, `hasAttached()` is ideal for `User` â†” `Role` or `Post` â†” `Tag` relationships.
- For large many-to-many seeding, pre-create models and attach via raw inserts for performance.

## Common Mistakes
**Mistake: Forgetting pivot table exists in migration.**
Why it happens: Focusing on model factories without ensuring the pivot migration exists.
Why it's harmful: `hasAttached()` fails with "table not found."
Better approach: Ensure pivot migration is created before using `hasAttached()`.

**Mistake: Using `has()` instead of `hasAttached()` for many-to-many.**
Why it happens: `has()` works for HasMany and feels similar for BelongsToMany.
Why it's harmful: `has()` doesn't insert pivot rows; it sets a non-existent foreign key on the related table.
Better approach: Always use `hasAttached()` for `BelongsToMany` relationships.

**Mistake: Passing pivot attributes as a flat array without key.**
Why it happens: `hasAttached($roles, [$role1->id, $role2->id])` instead of associative array.
Why it's harmful: Pivot attributes are keyed and will be misinterpreted.
Better approach: Always use associative arrays or closures for pivot attributes.

## Failure Modes
1. **Duplicate pivot entries:** Attaching the same model twice without detaching first. Mitigation: use `sync()` instead of `attach()` for idempotent seeding, or wrap in `syncWithoutDetaching()`.
2. **Missing pivot migration:** `hasAttached()` requires the pivot table to exist. Mitigation: run migrations before seeding.
3. **Wrong pivot column order:** If `belongsToMany` specifies custom pivot columns, the factory may use the wrong names. Mitigation: test pivot row integrity after creation.

## Ecosystem Usage
- **Laravel Jetstream:** Uses `hasAttached()` for team-to-user membership with pivot attributes (role, permissions).
- **Spatie Laravel Permission:** Test factories use `hasAttached()` for role-permission assignments.
- **Laravel Nova:** Uses `hasAttached()` for attaching resources to fields and actions.

## Related Knowledge Units


### Prerequisites
- Model Design
- Model Lifecycle
- Factory Definition
- BelongsToMany Relationship
- Pivot Tables

### Related Topics
- HasMany Factories
- BelongsTo Factories
- Recycle Pattern

### Advanced Follow-up Topics
- Polymorphic Many-to-Many Factory Attachments
- Custom Pivot Models


## Research Notes
- **Source Analysis:** `hasAttached()` is defined in `Illuminate\Database\Eloquent\Factories\Factory` and processes attachments after the parent model is created. It calls `$parent->{$relation}()->attach($related, $pivotAttributes)`.
- **Key Insight:** Unlike `has()` (which inserts foreign keys directly), `hasAttached()` goes through Eloquent's relationship attach method, which respects custom pivot model classes, pivot events, and touch parents.
- **Version-Specific Notes:** `hasAttached()` was introduced in Laravel 8.x alongside class-based factories. Laravel 9+ added support for pivot attribute closures. Laravel 10+ added magic `has{Relation}` methods for many-to-many.
