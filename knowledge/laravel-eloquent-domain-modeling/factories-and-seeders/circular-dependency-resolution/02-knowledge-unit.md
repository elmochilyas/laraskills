# Circular Dependency Resolution

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Factories & Seeders
- **Last Updated:** 2026-06-02

## Executive Summary
Circular factory dependencies occur when two or more models reference each other via relationships (e.g., `User hasMany Post` and `Post belongsTo User`), and their factories attempt to create each other in callbacks or relationship methods. Without intervention, this creates infinite recursion or stack overflow. Laravel provides several strategies to resolve circular dependencies: `recycle()`, lazy relationship resolution, deferred creation, and manual dependency injection patterns.

## Core Concepts
- **Direct circular dependency:** Factory A's `definition()` or callback creates Model B, whose factory creates Model A. Results in infinite loop.
- **Indirect circular dependency:** A → B → C → A. Requires tracking the entire chain to detect.
- **Recycle resolution:** Pre-creating shared model instances and reusing them via `recycle()` breaks the cycle by satisfying all references to the circular type.
- **Lazy callback resolution:** Postponing related model creation to `afterCreating` and using conditional checks prevents eager circular creation.
- **Nullable relationship design:** Making one side of the relationship nullable allows creation without the circular reference, filling it in later.
- **Stack limit:** PHP's default recursion limit (256) or memory limit is hit when circular factory dependencies are unbroken.

## Mental Models
- **Chicken-and-egg problem:** Two models need each other to exist. One must be created first without the other, then the relationship is established.
- **Quantum observation analogy:** Circular dependencies collapse when you observe them — defining an explicit creation order (who goes first) resolves the ambiguity.
- **Lifecycle stages:** Think of model creation in stages: Stage 1 creates the model without circular references, Stage 2 fills in the missing relationships.

## Internal Mechanics
- **Definition() recursion:** If `definition()` calls `ModelB::factory()->create()` and ModelB's definition calls `ModelA::factory()->create()`, the stack grows until PHP's recursion limit is exceeded.
- **Callback recursion:** If `afterCreating` on ModelA creates ModelB, and `afterCreating` on ModelB creates ModelA, each create triggers the other's callback.
- **HasRelationship trait recursion:** `has()` on factory A that creates factory B which `has()` factory A creates an infinite factory chain.
- **Recycle breaks the chain:** By the time factory B needs factory A's model, the recycled instance already exists in memory, so no new creation is triggered.

## Patterns
### Recycle as Default Strategy
```php
$user = User::factory()->create();
Post::factory()->count(5)->recycle($user)->create();
// Post factory tries to create a user? No — recycle provides one.
```

### Deferred BelongsTo via AfterCreating
```php
class PostFactory extends Factory
{
    public function configure(): void
    {
        $this->afterCreating(function (Post $post) {
            if (!$post->user_id) {
                // Only create user if not already assigned
                $post->user()->associate(User::factory()->create());
                $post->save();
            }
        });
    }
}
```

### Nullable Foreign Key with Later Association
Design the schema so one side of the relationship is nullable:
```php
// Schema: posts.user_id nullable
// Create post first, then associate user
$post = Post::factory()->create(['user_id' => null]);
$user = User::factory()->create();
$post->user()->associate($user)->save();
```

### Explicit Creation Order with Separate Steps
```php
$user = User::factory()->create();
$post = Post::factory()->create(['user_id' => $user->id]);
// No circular reference — user exists before post
```

### Factory Helper for Recursive Graphs
```php
public function createWithCircularReference(): array
{
    $post = Post::factory()->create(['user_id' => null]);
    $user = User::factory()->create();
    $post->update(['user_id' => $user->id]);
    return [$user, $post];
}
```

## Architectural Decisions
### Decision: Recycle vs. Nullable Design vs. Explicit Order
- **Recycle:** Least invasive. Pre-create the shared dependency. Works when one model instance can be shared across many children.
- **Nullable design:** Changes the schema. One side of the relationship must allow null. Requires migration changes.
- **Explicit order:** Most control but most verbose. Create objects step by step, filling in references manually.
- **Tradeoff:** Recycle is easiest but requires shared state. Nullable is cleanest but changes schema. Explicit is safest but most boilerplate.

### Decision: Resolve in Factory vs. Resolve in Test/Seeder
- **Factory resolution:** Embed the resolution strategy in the factory class itself (e.g., `recycle()` in `configure()`, deferred callbacks). Transparent to callers.
- **Test/Seeder resolution:** Keep factories simple and handle circular references at the call site. More explicit but repetitive.
- **Tradeoff:** Factory resolution is DRY but hides complexity. Call-site resolution is visible but verbose.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Recycle breaks cycles with minimal code | Implicit — caller may not know recycle is active | Document recycle usage in factory docblock |
| Nullable FK allows flexible creation order | Schema allows incomplete data | Add validation rules to enforce completeness at application level |
| Explicit step-by-step is transparent | Verbose and repetitive | Extract helper methods for common circular patterns |
| Deferred callbacks keep factory definition clean | Callbacks can introduce hidden dependencies | Test factories with and without callbacks to verify isolation |

## Performance Considerations
- Circular dependency resolution strategies have negligible performance impact when implemented correctly.
- Recycled models avoid redundant creation — actually improves performance.
- Deferred callbacks that check for existing relationships add a tiny conditional overhead per model.
- Stack overflow from unresolved circular dependencies crashes the process — detection and prevention is essential.

## Production Considerations
- Circular dependencies in production models may indicate a design issue. Consider if both directions of a relationship are truly needed.
- In seeding, circular dependencies are common (e.g., User ↔ Profile, Post ↔ Author). Use `recycle()` as the standard strategy.
- When circular references are unavoidable in production code, use lazy loading or service-level resolution rather than requiring both models at instantiation time.

## Common Mistakes
**Mistake: Ignoring circular dependency until it causes a crash.**
Why it happens: Simple factory tests pass; large seed datasets trigger the cycle.
Why it's harmful: Tests pass locally but fail in CI with stack overflow on larger datasets.
Better approach: Always test factory relationships with count > 1. The cycle may only trigger on batch creation.

**Mistake: Using `recycle()` when a new parent should be created per child.**
Why it happens: Over-using recycle as a one-size-fits-all solution.
Why it's harmful: All children share one parent when each should have a unique parent.
Better approach: Use explicit `for()` with per-child parent creation, and only use `recycle()` when sharing is intentional.

**Mistake: Making both sides of a relationship non-nullable when circular.**
Why it happens: Database designer doesn't consider factory/test implications.
Why it's harmful: Impossible to create either model without the other.
Better approach: Make at least one side nullable, or use a separate pivot/join table.

## Failure Modes
1. **PHP stack overflow:** Unresolved circular dependency exceeds `xdebug.max_nesting_level` or PHP's recursion limit. Mitigation: detect and break cycles with `recycle()`.
2. **Memory exhaustion:** Circular dependency creates an exponentially growing number of related models. Mitigation: limit creation depth and use `recycle()`.
3. **Deadlock on circular constraints:** Two models with non-nullable foreign keys referencing each other prevent insertion of either. Mitigation: make one FK nullable or defer constraint enforcement.

## Ecosystem Usage
- **Laravel Jetstream:** Team and User models have circular reference (Team has owner, User belongs to team). Resolved by creating the team first, then associating the user.
- **Laravel Spark:** Plan and Subscription models have circular dependencies resolved via nullable `subscription_id` on User.
- **Laravel Nova:** Action and Resource models avoid circular dependencies through explicit creation ordering in test factories.

## Related Knowledge Units


### Prerequisites
- Model Design
- Model Lifecycle
- Factory Definition
- BelongsTo Factories
- HasMany Factories
- Recycle Pattern

### Related Topics
- Factory Callbacks
- Seeding Strategies
- Database Constraints

### Advanced Follow-up Topics
- Domain Model Design for Testability
- Dependency Injection in Models


## Research Notes
- **Source Analysis:** Circular dependency resolution is not a built-in Laravel feature — it's a pattern applied by developers using existing factory tools (`recycle()`, `afterCreating`, deferred creation). The framework does not detect or prevent circular factory calls.
- **Key Insight:** The cleanest resolution is to break the cycle at the database level (nullable FK) and use application logic to enforce completeness. Factories then follow the same nullable → fill pattern.
- **Version-Specific Notes:** Laravel 9+ `recycle()` made circular resolution much simpler. Before Laravel 9, developers relied on manual nullable-FK patterns and deferred callbacks. `afterCreating` conditional checks remain the fallback for complex cases.
