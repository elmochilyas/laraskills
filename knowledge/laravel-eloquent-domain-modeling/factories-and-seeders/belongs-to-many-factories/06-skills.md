# Skill: Set Up BelongsToMany Factory Relationship with hasAttached()

## Purpose

Create models with many-to-many relationships including pivot table data using the factory `hasAttached()` method.

## When To Use

- Setting up test data with many-to-many relationships
- Needing pivot attributes beyond the foreign keys
- Attaching a known set of related models from reference data

## When NOT To Use

- The relationship is HasMany (use `has()`)
- The relationship is BelongsTo (use `for()`)
- No pivot attributes are needed and attachment is simple (consider attach in callback)

## Prerequisites

- Both models define the `BelongsToMany` relationship
- Related model factory exists
- Pivot table exists matching Laravel's alphabetical convention or explicitly named

## Inputs

- Parent model class name
- Related model factory or existing model instances
- Pivot attribute overrides (array or closure)

## Workflow

1. Identify the BelongsToMany relationship method (e.g., `roles()` returns `BelongsToMany`)
2. Use `hasAttached()` on the parent factory with a related factory:
   ```
   User::factory()->hasAttached(Role::factory()->count(3))->create()
   ```
3. For uniform pivot attributes across all attachments, pass an array as second argument:
   ```
   User::factory()->hasAttached(Role::factory()->count(3), ['team_id' => 1])->create()
   ```
4. For varying pivot attributes per attachment, pass a closure:
   ```
   User::factory()->hasAttached(Role::factory()->count(3), fn () => ['team_id' => Team::factory()])->create()
   ```
5. For known existing models, pass an array of instances:
   ```
   User::factory()->hasAttached([$adminRole, $editorRole])->create()
   ```

## Validation Checklist

- [ ] `hasAttached()` used instead of manual pivot table inserts
- [ ] Pivot attributes use closure when values differ per attachment
- [ ] Existing model instances used for known reference datasets
- [ ] Count parameter controls number of attachments when predictable data is needed

## Common Failures

- **Pivot attributes in definition()**: Setting pivot columns (e.g., `team_id`) on the related model's factory `definition()` inserts them into the wrong table. Always pass pivot data via `hasAttached()`'s second argument.
- **Missing count**: `hasAttached(Role::factory())` attaches exactly 1 role. Use `->count(N)` on the related factory for predictable volumes.

## Decision Points

- **Array vs closure**: Use a plain array for uniform pivot values. Use a closure (receives the related model) when pivot attributes vary per attachment.
- **Factory vs existing instances**: Use factories when the related models must be created as part of the graph. Use existing instances when attaching from a pre-existing reference set.

## Performance Considerations

- Passing existing model instances skips related model creation — faster for known datasets
- Factory creation with `count(3)` creates 3 related models per parent — scales linearly

## Security Considerations

- Pivot data in `hasAttached()` is not validated by default — ensure test data respects domain invariants

## Related Rules

- Rule 1: Use hasAttached() for All BelongsToMany Factory Relationships
- Rule 2: Use Closures for Varying Pivot Attributes
- Rule 3: Pass Existing Models for Known Reference Datasets
- Rule 5: Do Not Manually Set Pivot Attributes in the Related Model's Definition
- Rule 6: Use hasAttached() for Count-Controlled Many-to-Many Data

## Related Skills

- BelongsTo Factory Relationships with for()
- HasMany Factory Relationships with has()
- Recycle Pattern for Shared Parents

## Success Criteria

- Pivot table rows are created with correct foreign keys
- Pivot attributes are correctly populated (uniform or per-attachment)
- Related models are created or reused as specified
- No pivot-related columns exist in the related model's factory definition
