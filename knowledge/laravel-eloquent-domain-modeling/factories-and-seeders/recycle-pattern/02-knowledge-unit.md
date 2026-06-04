# Recycle Pattern

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Factories & Seeders
- **Last Updated:** 2026-06-02

## Executive Summary
The `recycle()` method on factory builders enables reuse of existing model instances across multiple factory-created models. Instead of creating a new parent for every child (as `for()` does by default), `recycle()` shares one or more pre-existing models, reducing redundant database writes and creating more realistic shared-data scenarios. It is essential for performance in large seed sets and for avoiding circular dependency issues.

## Core Concepts
- **recycle() method:** `Post::factory()->count(100)->recycle($user)->create()` â€” all 100 posts belong to the same user. No new users created.
- **Recycle set:** Pass a collection: `recycle(User::all())` â€” the factory cycles through existing users round-robin.
- **Global recycle:** `User::factory()->recycle($admin)->hasPosts(10)->create()` â€” recycles $admin within the entire factory graph.
- **Nested recycle:** Applies to child factories created via `has()`, `for()`, and `hasAttached()` â€” prevents redundant parent/child creation throughout the graph.
- **Recycle resolution:** The factory matches the model class of the recycled instance to `BelongsTo` / `HasMany` relationships and uses it instead of creating a new instance.

## Mental Models
- **Shared resource pool:** Think of `recycle()` as a pool of shared resources. When a factory needs a parent model, it checks the pool first before creating a new one.
- **Round-robin distributor:** When recycling a collection, models are distributed in round-robin order. Post 1 â†’ user A, Post 2 â†’ user B, Post 3 â†’ user A, etc.
- **Graph-level singleton:** `recycle()` makes a model instance act as a singleton within the entire factory graph. Every relationship that would create that model type reuses the same instance.

## Internal Mechanics

> **Reference:** 
- `recycle()` stores the model instance(s) in `$recycle` array, keyed by model class.
- During `make()` and `create()`, before creating related models, the factory checks if a recycled instance of the required class exists.
- For `for()` and `has()`, the relationship resolution first consults the recycle pool. If a matching class is found, the recycled instance is used instead of creating a new factory.
- When a Collection is passed (e.g., `User::all()`), the factory uses a round-robin index to distribute associations.

## Patterns
### Reusing a Single Parent
```php
$user = User::factory()->create();
Post::factory()->count(10)->recycle($user)->create();
// 10 posts, all with the same user_id
```

### Recycling Across Complete Factory Graph
```php
$admin = User::factory()->admin()->create();
User::factory()
    ->recycle($admin)
    ->has(Post::factory()->count(3))
    ->has(Profile::factory())
    ->create();
// Posts and profile all reference the recycled admin user
```

### Round-Robin from Existing Collection
```php
$users = User::factory()->count(5)->create();
Post::factory()->count(20)->recycle($users)->create();
// 20 posts distributed across 5 users (4 each)
```

### Recycle with BelongsToMany
```php
$roles = Role::factory()->count(3)->create();
User::factory()
    ->count(10)
    ->hasAttached(Role::factory(), recycle: $roles)
    ->create();
```

### Preventing Circular Dependencies
```php
$user = User::factory()->create();
// Instead of Post factory creating a new user (which may trigger
// circular callback creating another post), reuse existing user:
Post::factory()->count(5)->recycle($user)->create();
```

## Architectural Decisions
### Decision: `recycle()` vs. Explicit `for()` with Existing Model
- **`recycle()`:** Applied at the graph level. All nested factory calls that create the recycled model type reuse it automatically. Less code, less repetition.
- **Explicit `for()`:** Each relationship must be explicitly wired. More verbose but more visible at the call site.
- **Tradeoff:** `recycle()` is more concise and DRY. Explicit `for()` is more explicit and easier to understand for readers unfamiliar with recycle.

### Decision: Single Instance vs. Collection Recycle
- **Single instance:** All relationships point to the same model. Simplest, most performant. Use when shared context is desirable.
- **Collection:** Models are distributed round-robin. More realistic data distribution. Use when diversity matters.
- **Tradeoff:** Single instance is faster and simpler. Collection is more realistic but adds complexity.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Eliminates redundant parent creation | Implicit â€” reader may not know recycle is active | Document `recycle()` usage in test setup or seeder |
| Simplifies factory graph construction | Wrong class recycled silently (if class names overlap) | Use explicit type-checking when recycling ambiguous models |
| Round-robin distributes associations | Order-dependent â€” tests relying on specific distribution may break if collection order changes | Assert on aggregate counts, not specific positions |
| Breaks circular dependencies naturally | Can mask legitimate creation paths that need new parents | Also test without recycle to verify full creation flow |

## Performance Considerations
- `recycle()` with a single instance eliminates N-1 parent INSERTs. For 1000 posts with 1 recycled user: 1000 INSERTs â†’ 1001. Without recycle: 2000 INSERTs.
- Collection recycle still creates the initial models in the collection. The cost is paid once, then reused.
- Global recycle in deeply nested graphs prevents the multiplicative explosion of related models.
- For maximum performance in seeders, recycle all static reference data (roles, permissions, categories) before creating transactional data.

## Production Considerations
- `recycle()` is strictly for testing and seeding. Never used in production.
- In seeder scripts, `recycle()` dramatically reduces seed time for related data. Always recycle lookup tables (roles, statuses, categories) before creating transactional records.
- For demo data, recycle a small set of users across many posts to create realistic multi-post-per-user scenarios.

## Common Mistakes
**Mistake: Recycling a model that doesn't match any relationship.**
Why it happens: Recycling an unrelated model class.
Why it's harmful: The recycled instance is silently ignored â€” no error, but no reuse either.
Better approach: Test that the recycle pool is actually used. Assert query count reduction.

**Mistake: Assuming recycle works across separate factory calls.**
Why it happens: Recycle in one statement expecting it to persist to the next.
Why it's harmful: Recycle is scoped to the factory builder instance.
Better approach: Pass the recycled model as a variable to multiple factory calls, or chain everything in one expression.

**Mistake: Forgetting that recycle applies to all nested factories.**
Why it happens: Recycle at the top level unexpectedly affects child factories.
Why it's harmful: Child factories that should create new parents reuse the recycled one instead.
Better approach: Scope recycle intentionally; use separate factory calls without recycle where new parents are needed.

## Failure Modes
1. **Silently ignored recycle:** Recycling a model class that has no relationship in the current factory graph. No error, no reuse. Mitigation: verify recycle usage with query count assertions.
2. **Collection recycle order dependency:** Distribution changes if the collection order changes between test runs. Mitigation: sort collections deterministically before passing to `recycle()`.
3. **Recycle with soft-deleted models:** Recycling a soft-deleted model that is then used in relationships (which exclude soft-deleted by default). Mitigation: ensure recycled models are not soft-deleted.

## Ecosystem Usage
- **Laravel Jetstream:** Recycles the team owner user across team membership factories.
- **Spatie Laravel Permission:** Test factories recycle a default admin user for permission assignment tests.
- **Laravel Nova:** Action test factories recycle a common resource model across multiple action requests.

## Related Knowledge Units


### Prerequisites
- Model Design
- Model Lifecycle
- Factory Definition
- BelongsTo Factories
- HasMany Factories

### Related Topics
- Circular Dependency Resolution
- Seeding Strategies

### Advanced Follow-up Topics
- Factory Graph Optimization
- Seeder Performance Tuning


## Research Notes
- **Source Analysis:** `Factory::recycle()` stores models in `$recycle` static-like array (per factory instance). During relationship resolution in `HasRelationship` trait, `resolveRecycle()` checks if a recycled model of the required class exists.
- **Key Insight:** `recycle()` is not just a convenience â€” it's a correctness tool for preventing circular dependency infinite loops in factory creation. Without `recycle()`, deeply connected graphs often hit stack limits.
- **Version-Specific Notes:** `recycle()` was introduced in Laravel 9.x. Laravel 10+ added support for recycling collections (round-robin). Laravel 11+ added support for `recycle()` with `hasAttached()`.
