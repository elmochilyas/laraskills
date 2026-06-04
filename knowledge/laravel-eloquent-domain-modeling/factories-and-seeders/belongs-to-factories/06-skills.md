# Skill: Set Up BelongsTo Factory Relationship with for()

## Purpose

Create a child model that belongs to a parent model using the factory `for()` method, automatically resolving the foreign key from the relationship definition.

## When To Use

- Creating a single child with a new or existing parent
- Writing tests or seeders that need related model graphs
- Replacing hard-coded foreign key assignment in factory chains

## When NOT To Use

- The relationship is HasMany (use `has()`)
- The relationship is BelongsToMany (use `hasAttached()`)
- The parent should be shared across many children (use `recycle()`)

## Prerequisites

- Child model has a `belongsTo()` relationship method defined
- Child factory extends Laravel's `Factory` base class
- Parent factory exists and has a `definition()` method

## Inputs

- Child model class name
- Parent model class name or existing parent instance
- Optional parent attribute overrides

## Workflow

1. Identify the BelongsTo relationship method on the child model (e.g., `user()` returns `BelongsTo`)
2. If creating a new parent, pass `ParentModel::factory()` to `for()`:
   ```
   ChildModel::factory()->for(ParentModel::factory())->create()
   ```
3. If reusing an existing parent, pass the model instance:
   ```
   $parent = ParentModel::factory()->create()
   ChildModel::factory()->for($parent)->create()
   ```
4. For parent attribute overrides, use the magic `for{Relation}()` shorthand:
   ```
   ChildModel::factory()->forParent(['name' => 'Admin'])->create()
   ```
5. For multiple children sharing one parent, create the parent first then pass the instance to each child

## Validation Checklist

- [ ] `for()` or magic `for{Relation}()` used, not direct foreign key assignment
- [ ] Existing parent instance passed when children should share a parent
- [ ] Parent attribute overrides positioned inside the `for()` call

## Common Failures

- **Missing BelongsTo method**: `for()` throws `InvalidArgumentException` if the relationship method is not defined. Verify the model has the matching `belongsTo()` method.
- **Foreign key in definition()**: Setting `'user_id' => User::factory()` in `definition()` creates hidden coupling. Remove it and use `for()` at the call site.

## Decision Points

- **Factory vs instance**: Pass a factory when each child needs a new independent parent. Pass an existing instance when children should share.
- **Magic vs explicit**: Use magic `for{Relation}()` for readability with simple overrides. Use explicit `for()` with the relationship name third argument when the relationship name is ambiguous (e.g., multiple BelongsTo to the same model).

## Performance Considerations

- Passing an existing model instance avoids an extra database write per child
- `for(Parent::factory())` on N children creates N parents — use `recycle()` for shared parents

## Security Considerations

- No direct security impact; `for()` respects mass-assignment protection on the child

## Related Rules

- Rule 1: Use for() for All BelongsTo Factory Relationships
- Rule 2: Pass a Factory for New Parents, Pass an Instance for Existing
- Rule 3: Use Magic for{Relation} Methods for Readability
- Rule 4: Do Not Set Foreign Key Columns Directly in Factory Definitions
- Rule 6: Use recycle() When Multiple Children Share the Same BelongsTo Parent

## Related Skills

- HasMany Factory Relationships with has()
- Recycle Pattern for Shared Parents
- Circular Dependency Resolution

## Success Criteria

- Child model is created with correct foreign key referencing the parent
- `for()` call site clearly shows the relationship intent
- No hard-coded foreign key column names appear in factory definitions or call sites
