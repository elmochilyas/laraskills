# Skill: Set Up Shared Parent with recycle() for Batch Child Creation

## Purpose

Use `recycle()` to share pre-created parent model instances across many child models, reducing redundant database writes and preventing circular dependency issues.

## When To Use

- Creating many children that should reference the same parent or a small set of parents
- Resolving circular factory dependencies
- Reducing database writes during large seed operations
- Creating realistic data where entities share resources (e.g., 100 posts by 10 users)

## When NOT To Use

- Each child should have an independent parent (use `for()` with factory on each)
- The relationship is HasOne (one-to-one) where each child requires a unique parent
- The batch size is small and performance is not a concern

## Prerequisites

- Parent models are pre-created (factory or explicit creation)
- Child model factory exists and can accept parent references
- Parent model instances are of the same type that the child's relationship expects

## Inputs

- Pre-created parent model instance(s) or Collection
- Child factory with count
- Factory chain modifiers (has, for, hasAttached as needed)

## Workflow

1. Pre-create the parent model(s) that will be shared:
   ```
   $user = User::factory()->create()
   ```
2. Call `recycle()` at the top of the child factory chain, before relationship methods:
   ```
   Post::factory()
       ->recycle($user)
       ->count(100)
       ->create()
   ```
3. For round-robin distribution across multiple parents, pass a collection:
   ```
   $users = User::factory()->count(10)->create()
   Post::factory()
       ->recycle($users)
       ->count(100)
       ->create()
   ```
4. Combine recycled parents with factory states for meaningful variation:
   ```
   $users = collect([
       User::factory()->admin()->create(),
       User::factory()->editor()->create(),
       User::factory()->count(8)->create(),
   ])
   Post::factory()->count(100)->recycle($users)->create()
   ```

## Validation Checklist

- [ ] `recycle()` placed before `has()`, `for()`, or `hasAttached()` in the chain
- [ ] Single instance used for singleton reuse; collection for round-robin
- [ ] Recycled models have meaningful variation (states) when relevant
- [ ] `recycle()` is not used when each child needs a unique parent (HasOne)
- [ ] Circular dependency is resolved (if recycle is being used for that purpose)

## Common Failures

- **recycle() placed too late**: If positioned after `has()` or `for()`, nested factories may not receive the recycled model. Place `recycle()` first.
- **Incorrect collection type**: Passing a single model wrapped in a collection when a single instance is expected. Use the bare model for singleton, Collection for round-robin.
- **HasOne violation**: Using `recycle()` on a HasOne relationship creates multiple children for one parent, violating the one-to-one constraint.

## Decision Points

- **Singleton vs collection**: Use a single instance when all children should reference the exact same parent. Use a collection for realistic distribution across multiple parents.
- **recycle() vs for()**: Use `recycle()` for batch operations with shared parents. Use `for()` when creating single children with explicit parent control.

## Performance Considerations

- `recycle()` reduces parent writes from N to 1 (or collection size) — 99% reduction for large batches
- Round-robin with a collection distributes evenly without additional queries
- Combine with `count(N)` for optimal batch insertion

## Security Considerations

- No direct security impact; affects test and seeding data only

## Related Rules

- Rule 1: Use recycle() When Many Children Share the Same Parent
- Rule 2: Pass a Collection for Round-Robin Distribution
- Rule 3: Use recycle() to Resolve Circular Dependencies
- Rule 4: Apply recycle() at the Top of the Factory Chain
- Rule 7: Use recycle() for Performance, Not as a Data Strategy Default

## Related Skills

- Circular Dependency Resolution with recycle()
- HasMany Factory Relationships with has()
- BelongsTo Factory Relationships with for()

## Success Criteria

- Batch children are created with correct parent references
- Parent creation count is bounded by collection size, not child count
- Distribution across recycled parents is predictable (round-robin)
- No redundant parent creation in batch operations
