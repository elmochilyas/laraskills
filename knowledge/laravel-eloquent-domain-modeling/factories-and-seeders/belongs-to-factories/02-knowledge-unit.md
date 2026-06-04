# BelongsTo Factories

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Factories & Seeders
- **Last Updated:** 2026-06-02

## Executive Summary
Factory relationships for `BelongsTo` allow you to associate a child model with its parent during creation, using the `for()` method or magic `for{Relation}` methods. This is the inverse of `has()` â€” instead of the parent creating children, the child references an existing or newly-created parent. The foreign key is automatically populated on the child.

## Core Concepts
- **for() method:** Chained on the child factory: `Post::factory()->for(User::factory())->create()`. Creates both user and post, wiring `user_id`.
- **Magic for{Relation} methods:** `Post::factory()->forUser(['name' => 'Admin'])->create()` â€” shorthand with optional attribute overrides for the parent.
- **Existing parent models:** Pass an existing model instance: `Post::factory()->for($user)->create()`. Skips parent creation.
- **BelongsTo resolution:** The factory uses the relationship to determine the foreign key column name (`user_id` for `belongsTo(User::class)`).
- **Attribute forwarding:** Second argument to `for()` overrides attributes on the parent factory: `Post::factory()->for(User::factory(), ['name' => 'Admin'])`.

## Mental Models
- **Child pointing to parent:** Unlike `has()` where the parent drives creation, `for()` makes the child declare "I belong to this parent." The foreign key is on the child's table.
- **Reusable parent reference:** You can create one parent and attach multiple children to it using `for($existingParent)`. This avoids redundant parent creation.
- **Optional parent creation:** If you pass a factory, the parent is created automatically. If you pass a model, it's reused. Choose based on whether the parent ID matters for the test.

## Internal Mechanics

> **Reference:** 
- `for()` stores the relationship config (factory/model instance, relationship name, attributes) in `$belongsToRelations` array.
- During `create()`, the factory processes `$belongsToRelations` before the child model is created:
  - If a factory instance is given, it creates the parent model first, then sets the foreign key on the child.
  - If a model instance is given, it reads the parent's primary key and sets the foreign key on the child.
- Magic `for{Relation}` methods parse the relation name after `for`, resolve the factory, and apply attribute overrides.

## Patterns
### Creating Parent Simultaneously
```php
Post::factory()->for(User::factory())->create();
// Creates user, then post with user_id
```

### Using Existing Parent
```php
$user = User::factory()->create();
Post::factory()->count(3)->for($user)->create();
// Creates 3 posts, all belonging to the same user
```

### Magic Method
```php
Post::factory()->forUser(['is_admin' => true])->create();
```

### Overriding Parent Attributes
```php
Post::factory()->for(User::factory()->admin(), ['name' => 'Override'])->create();
```

### Deep Chaining
```php
Comment::factory()
    ->for(
        Post::factory()->for(User::factory())
    )
    ->create();
```

### Mixed has() and for()
```php
User::factory()
    ->has(
        Post::factory()->for(User::factory()->admin(), 'author')
    )
    ->create();
```

## Architectural Decisions
### Decision: `for()` with Factory vs. `for()` with Existing Model
- **Factory:** Creates a new parent per child. Useful when each child needs a distinct parent, or when testing creation paths.
- **Existing model:** All children share a parent. Useful when the parent identity is not the focus of the test.
- **Tradeoff:** Factory approach creates more data; existing model is more efficient. Choose based on test focus.

### Decision: Magic `for{Relation}` vs. Explicit `for()` with Custom Relationship
- **Magic:** Auto-resolves the relationship. Works with conventional `belongsTo(User::class)` â†’ `forUser()`.
- **Explicit with relationship name:** `for($factory, 'customRelation')` when the child has multiple belongs-to relationships for the same model.
- **Tradeoff:** Magic is concise. Explicit is necessary for ambiguous or named relationships.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Fluent, readable relationship setup | Implicit factory resolution can fail on non-standard relation names | Verify relation method exists before using magic methods |
| Existing model reuse avoids redundant creates | Passing wrong model type sets wrong foreign key | Type-hint assertions in tests |
| Automatic foreign key wiring | Custom foreign keys not on `_id` convention need explicit handling | Test that FK column matches expectation |
| Works bidirectionally with `has()` | Mixing `has()` and `for()` on same relationship can conflict | Use one direction per test scenario |

## Performance Considerations
- `for()` with a factory creates one parent per child. For 100 posts, 100 users are created (unless sharing a parent). Use existing model instances to reduce query count.
- For bulk operations, pre-create parent models and pass them to `for()` to avoid N parent creations.
- `for()` with existing model adds zero queries beyond the child INSERT.

## Production Considerations
- Use `for()` with existing models in seeder scripts to associate all seed data under a single system user or default category.
- When seeding demo data, `for()` lets you control which parent each child attaches to, ensuring realistic data distribution.

## Common Mistakes
**Mistake: Using `for()` on the parent factory instead of the child.**
Why it happens: Confusing `has()` and `for()` direction. `User::factory()->for(Profile::factory())` tries to set a `user_id` on the User.
Why it's harmful: Wrong foreign key set or exception thrown.
Better approach: `for()` is always on the child factory (the model with the foreign key).

**Mistake: Passing a collection instead of a single model to `for()`.**
Why it happens: `Post::factory()->for(User::all())`.
Why it's harmful: `BelongsTo` expects a single parent, not a collection.
Better approach: Pass a single model instance or use `each()` to assign different parents.

**Mistake: Forgetting the relationship name parameter for multiple belongs-to.**
Why it happens: `Post::factory()->for(User::factory())` when Post has both `author()` and `editor()` relationships.
Why it's harmful: Resolves to the first `BelongsTo` relationship for `User`.
Better approach: Use `for(User::factory(), 'editor')` to disambiguate.

## Failure Modes
1. **Missing relationship method on child:** `for()` calls `$child->user()` but the method returns null. Mitigation: verify `BelongsTo` relationship is defined.
2. **Wrong foreign key set:** Custom foreign key not matched to factory expectations. Mitigation: inspect child's foreign key attribute after creation.
3. **Parent creation cascade overflow:** `for()` with nested `for()` creates deep dependency chains. Mitigation: limit nesting depth or use existing models.

## Ecosystem Usage
- **Laravel Jetstream:** `TeamMembershipFactory` uses `for()` to associate memberships with users and teams.
- **Laravel Cashier:** Subscription factories use `for()` to associate subscriptions with billable models.
- **Spatie Laravel Permission:** `ModelHasRoleFactory` uses `for()` for polymorphic role associations.

## Related Knowledge Units


### Prerequisites
- Model Design
- Model Lifecycle
- Factory Definition
- BelongsTo Relationship

### Related Topics
- HasMany Factories
- BelongsToMany Factories

### Advanced Follow-up Topics
- Polymorphic Factory Relationships
- Named Relationship Factories


## Research Notes
- **Source Analysis:** `Factory::for()` stores the parent factory/model in `$belongsToRelations`. During `create()`, the factory processes these before the child model, creating parents first and wiring foreign keys.
- **Key Insight:** `for()` processes in FIFO order â€” parent factories are created before the child. This ensures foreign keys are available when the child is instantiated.
- **Version-Specific Notes:** Laravel 8 introduced `for()` and magic methods. Laravel 9+ supports `for()` with existing model instances (not just factories). Laravel 10+ allows `for()` with `count()` on parent factory (though this rarely makes semantic sense).
