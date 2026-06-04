# Has-Many Factories

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Factories & Seeders
- **Last Updated:** 2026-06-02

## Executive Summary
Factory relationships for `HasMany` allow you to create a parent model along with its child models in a single fluent call. The `has()` method and magic `has{Relation}` methods define child model attributes inline, handling foreign key assignment automatically. This is the primary mechanism for setting up one-to-many relationships in test data.

## Core Concepts
- **has() method:** Chained on the factory builder: `User::factory()->has(Post::factory()->count(3))->create()`. Creates 3 posts for each user.
- **Magic has{Relation} methods:** `User::factory()->hasPosts(3)->create()` â€” shorthand for `has()` with inferred factory. The relation name is PascalCase after `has`.
- **Attribute forwarding:** Pass an array as second argument to `has()` or magic methods to override attributes on the related factory: `User::factory()->hasPosts(3, ['published' => true])->create()`.
- **Nested relationships:** `has()` can nest arbitrarily deep: `User::factory()->has(Post::factory()->has(Comment::factory()->count(2)))->create()`.
- **Count parameter:** `User::factory()->hasPosts(3)` or `User::factory()->has(Post::factory()->count(3))`. Both are equivalent.
- **Relationship resolution:** The `HasMany` relationship is used to determine the foreign key â€” the factory reads `make()` â†’ gets the relation â†’ creates child with correct parent key.

## Mental Models
- **Family tree construction:** Think of `has()` as declaring "this parent has these children." The factory constructs the parent, then the children, and wires the foreign keys.
- **Nested blueprint nesting:** Each `has()` call nests another factory blueprint. The depth of nesting reflects the relationship depth.
- **Builder decorator:** The `has()` method decorates the factory builder with additional model creation instructions. The terminal call (`create`) executes everything.

## Internal Mechanics

> **Reference:** 
- `has()` stores relationship definitions in `$hasRelations` array. Each entry contains the factory instance, relationship name, and attribute overrides.
- During `create()`, after the parent model is created, the factory iterates `$hasRelations`, resolves the relationship method on the model, and calls `$childFactory->create()` with `$parent->relation()` as the context.
- Magic `has{Relation}` methods use `__call` to parse the relation name and instantiate the matching factory (convention: `hasPosts` â†’ `Post::factory()`).
- The foreign key is set automatically by calling `$parent->relation()->make()` internally, which pre-populates the foreign key on the child.

## Patterns
### Basic HasMany
```php
User::factory()->has(Post::factory()->count(3))->create();
```

### Magic Method
```php
User::factory()->hasPosts(3)->create();
```

### With Attribute Overrides
```php
User::factory()->hasPosts(3, ['published' => true])->create();
```

### Nested Relations
```php
User::factory()
    ->has(
        Post::factory()
            ->count(3)
            ->has(Comment::factory()->count(5))
    )
    ->create();
```

### Inline Factory Definition
```php
User::factory()
    ->has(Post::factory()->state(['title' => 'Featured'])->count(1))
    ->create();
```

### Using States on Children
```php
User::factory()
    ->has(Post::factory()->count(2)->draft())
    ->has(Post::factory()->count(1)->published())
    ->create();
```

## Architectural Decisions
### Decision: `has()` vs. Manual `afterCreating` Callback
- **`has()`:** Declarative, automatic foreign key wiring, composable, readable. Preferred for all standard `HasMany` setups.
- **`afterCreating`:** Required when the relationship setup needs imperative logic (conditionals, external API calls, non-standard foreign keys).
- **Tradeoff:** `has()` covers 90% of cases. Use `afterCreating` for the remaining 10% that need custom logic.

### Decision: Magic Method vs. Explicit `has()` with Factory
- **Magic:** Less verbode, auto-resolves factory. Good for simple cases.
- **Explicit `has()`:** More control â€” can use states, sequences, callbacks on the child factory. Better for complex child setups.
- **Tradeoff:** Magic is concise but limited. Explicit is verbose but flexible.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single fluent expression for parent+children | Deep nesting reduces readability for complex graphs | Extract nested factory setup into helper methods |
| Automatic foreign key assignment | Implicit relationship resolution can fail on non-conventional FK names | Verify relationship method returns `HasMany` before relying |
| Composable with states and sequences | Large nested creates are slow (many queries) | Use `make()` for children if IDs not needed |
| Magic methods reduce boilerplate | Conventions break if model has non-standard factory | Use explicit `has()` when magic fails |

## Performance Considerations
- Each child `create()` issues a separate INSERT (unless wrapped in transaction). 100 parents Ã— 10 children each = 1,100 queries.
- Use `make()` on children when only in-memory structure is needed, then persist in bulk.
- Nested relationships multiply query count geometrically. Be deliberate about depth in seeder data.
- Consider using `each()` on the Collection after creation for sequential operations rather than nested `has()`.

## Production Considerations
- Factory `has()` should never appear in production code. It's strictly for testing and seeding.
- In seeder scripts, `has()` is ideal for creating structured demo data (users with posts, posts with comments).
- For very large seed datasets, consider raw SQL inserts with pre-computed foreign keys (skip factory overhead).

## Common Mistakes
**Mistake: Wrong relationship direction â€” using `has()` on child factory.**
Why it happens: Confusing `has()` (parent creates child) with `for()` (child belongs to parent).
Why it's harmful: The foreign key is set incorrectly, or the wrong model is created.
Better approach: `has()` is for the parent factory; `for()` is for the child factory.

**Mistake: Forgetting to call `count()` on child factory.**
Why it happens: `User::factory()->has(Post::factory())->create()` creates only 1 post.
Why it's harmful: Less data than expected.
Better approach: Explicitly chain `->count(n)` or use magic method with a count argument.

**Mistake: Using magic method with non-standard relation name.**
Why it happens: `hasPublishedPosts()` doesn't match `publishedPosts()` relation method.
Why it's harmful: `__call` cannot resolve the factory.
Better approach: Use explicit `has()` with `Post::factory()->published()` when the relation name doesn't follow conventions.

## Failure Modes
1. **Missing relationship method on parent:** `has()` calls `$parent->posts()` but the method doesn't exist. Mitigation: verify `HasMany` relationship is defined before using `has()`.
2. **Foreign key mismatch:** Custom foreign key on relationship not reflected in factory. Mitigation: test that child records have correct `parent_id`.
3. **Massive nested creation timeouts:** 5 levels of nested `has()` with count(10) each = 100,000 records. Mitigation: limit nesting depth in factories.

## Ecosystem Usage
- **Laravel Jetstream:** `TeamFactory` uses `has()` to create `TeamMembership` records.
- **Laravel Spark:** Uses `has()` for subscription-feature seeding.
- **Laravel Nova:** Test factories use `has()` for resource-field assignments.

## Related Knowledge Units


### Prerequisites
- Model Design
- Model Lifecycle
- Factory Definition
- HasMany Relationship

### Related Topics
- BelongsTo Factories
- BelongsToMany Factories
- Factory Callbacks

### Advanced Follow-up Topics
- Polymorphic Factory Relationships
- Deep Graph Factories


## Research Notes
- **Source Analysis:** `Factory::has()` stores relationship config in internal array. During `create()`, it's handled by `Illuminate\Database\Eloquent\Factories\HasRelationship` trait which iterates relationships and calls `$childFactory->create()` with the parent model context.
- **Key Insight:** The magic `has{Relation}` methods leverage Laravel's convention: `hasPosts` â†’ method `posts()` â†’ `Post::factory()`. If this chain breaks, use explicit `has()`.
- **Version-Specific Notes:** Laravel 8 introduced `has()` and magic methods. Laravel 9+ supports `has()` with nested magic methods (`->hasPosts(3, ['featured' => true])`). Laravel 10+ added support for `has()` with `count()` on child factory.
