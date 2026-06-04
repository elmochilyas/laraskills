# Skill: Set Up HasMany Factory Relationship with has()

## Purpose

Create a parent model with child models in a single fluent factory call using `has()`, automatically resolving the foreign key from the `HasMany` relationship definition.

## When To Use

- Creating a parent with a predictable number of child models
- Setting up related data in a single factory call for tests or seeders
- Building nested model graphs (parent → child → grandchild)

## When NOT To Use

- The relationship is BelongsTo (use `for()` on the child factory)
- The relationship is BelongsToMany (use `hasAttached()`)
- Children should be added to an existing parent (use `for()` on the child factory)

## Prerequisites

- Parent model has a `hasMany()` relationship method defined
- Child factory exists with a `definition()` method
- Child table has the foreign key column matching convention

## Inputs

- Parent model class name
- Child factory with optional count
- Optional child attribute overrides (uniform across all children)

## Workflow

1. Identify the HasMany relationship method on the parent (e.g., `posts()` returns `HasMany`)
2. Use `has()` on the parent factory with a child factory:
   ```
   User::factory()->has(Post::factory()->count(3))->create()
   ```
3. For uniform child attribute overrides, pass as second argument:
   ```
   User::factory()->has(Post::factory()->count(3), ['published' => true])->create()
   ```
4. For readable shorthand, use the magic `has{Relation}()` method:
   ```
   User::factory()->hasPosts(3)->create()
   ```
5. Nest `has()` calls for multi-level graphs:
   ```
   User::factory()
       ->has(Post::factory()
           ->has(Comment::factory()->count(3)))
       ->create()
   ```

## Validation Checklist

- [ ] `has()` or magic `has{Relation}()` used instead of manual foreign key assignment
- [ ] Child attribute overrides passed as second argument when uniform
- [ ] Relationships use the correct method (`has()` for HasMany, not `for()`)
- [ ] Nested relationships use consistent, meaningful counts

## Common Failures

- **Wrong method for relationship type**: Using `has()` on a BelongsTo relationship (e.g., `User::factory()->has(Profile::factory())` when Profile belongs to User). Use `for()` on the child instead.
- **Missing relationship method**: `has()` throws `InvalidArgumentException` if the named relationship method doesn't exist. Verify the model defines the matching `hasMany()`.
- **afterCreating instead of has()**: Manually creating children in an `afterCreating()` callback duplicates what `has()` already handles declaratively.

## Decision Points

- **has() vs magic method**: Use magic `has{Relation}()` for simple cases with only a count. Use explicit `has()` with a factory when you need states, sequences, or custom configuration on the child.
- **Attribute overrides position**: Pass as second argument to `has()` for uniform values across children. Use `sequence()` on the child factory for varying values.

## Performance Considerations

- `has()` creates parent first, then children in a single transaction — efficient for typical test volumes
- For thousands of children, consider `recycle()` to share parents or raw inserts for bulk data

## Security Considerations

- No direct security impact; affects test and seeding data only

## Related Rules

- Rule 1: Use has() for All HasMany Factory Relationships
- Rule 2: Use Magic has{Relation} Methods for Readability
- Rule 3: Pass Attribute Overrides as the Second Argument to has()
- Rule 4: Nest Relationships for Complete Graph Creation
- Rule 5: Use has() Instead of afterCreating for Child Relationships

## Related Skills

- BelongsTo Factory Relationships with for()
- BelongsToMany Factory Relationships with hasAttached()
- Recycle Pattern for Shared Parents

## Success Criteria

- Parent and children are created with correct foreign key references
- Children have the expected attribute values (uniform or sequenced)
- Nested graph is created in a single factory call without intermediate variables
