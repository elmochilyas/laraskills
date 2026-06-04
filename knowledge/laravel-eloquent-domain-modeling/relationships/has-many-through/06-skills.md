# HasManyThrough Skills

## Skill: Configure a HasManyThrough relationship with proper indexing

### Purpose
Define a `HasManyThrough` relationship that traverses an intermediate model to access a collection of distant target records, with proper foreign key indexing for join performance.

### When To Use
- Aggregating data across a two-level hierarchy: Country → User → Post
- Hiding the intermediate model when it exists purely to scope the target collection
- Read-only access to distant records through an intermediate chain

### When NOT To Use
- When you need to write/create through the relationship (it's read-only)
- When intermediate models themselves are needed in the result
- When the intermediate-to-target relationship is `HasOne` (use `HasOneThrough`)
- When a direct `HasMany` relationship exists without needing an intermediate

### Prerequisites
- Three related tables: parent, intermediate, target
- Intermediate model has `HasMany` relationship to target

### Inputs
- Target model class (first argument)
- Intermediate model class (second argument)
- Foreign key on intermediate table referencing parent
- Foreign key on target table referencing intermediate
- Local key on parent table
- Local key on intermediate table

### Workflow
1. Confirm argument order: `$this->hasManyThrough(Target::class, Intermediate::class)` — target first, intermediate second
2. Check the intermediate-to-target relationship is `HasMany` (not `HasOne`)
3. In the migration: add `->index()` on both `intermediate.parent_id` and `target.intermediate_id`
4. Add `->cascadeOnDelete()` on both foreign keys to prevent orphans
5. Document the read-only constraint in the method DocBlock: `/** Read-only. Create targets through specific intermediate: $intermediate->targets()->create(...). */`
6. For eager loading, use `Parent::with('targets')->get()` — returns a flat collection of target models

### Validation Checklist
- [ ] Argument order is correct: target first, intermediate second
- [ ] Intermediate model has `HasMany` (not `HasOne`) to target
- [ ] `intermediate.parent_id` has index for join performance
- [ ] `target.intermediate_id` has index for join performance
- [ ] Both foreign keys have `cascadeOnDelete()`
- [ ] Read-only constraint is documented in the method DocBlock
- [ ] `$parent->targets` returns a Collection (empty when no intermediates exist)

### Common Failures
- Wrong argument order — swapping target and intermediate produces incorrect SQL
- Assuming `create()` works — throws `BadMethodCallException`
- Not indexing both foreign keys — slow join queries
- Not documenting read-only — developers discover the limitation at runtime

### Decision Points
- **HasManyThrough or nested eager loading?** — Use `HasManyThrough` when intermediate models are not needed in the result; use nested `load('intermediate.targets')` when intermediate data is required

### Performance Considerations
- Single join query — more efficient than nested eager loading for the same data
- `withCount('targets')` generates a nested subquery — more expensive than a simple `hasMany` count
- Index both foreign keys for query performance
- Pagination works but count queries include the join, adding overhead

### Security Considerations
- The intermediate model scopes the target — authorization at the intermediate level applies transitively
- Ensure cascade delete policies are correct: deleting a parent cascades through intermediate to targets
- Orphaned target records can leak data if not cleaned up

### Related Rules
- [Through-Argument-Order](../has-many-through/05-rules.md)
- [Through-Index-Both-Foreign-Keys](../has-many-through/05-rules.md)
- [Through-Cascade-Intermediate](../has-many-through/05-rules.md)
- [Through-Document-ReadOnly](../has-many-through/05-rules.md)
- [Through-Not-When-Intermediate-Is-Meaningful](../has-many-through/05-rules.md)
- [Through-Create-Via-Intermediate](../has-many-through/05-rules.md)

### Related Skills
- Create target records through intermediate models

### Success Criteria
- `$parent->targets` returns Collection of target models
- `Parent::with('targets')->get()` executes 2 queries
- `has('targets')` correctly filters parents with targets
- Direct `create()` on through throws exception
- Deleting parent cascades through to targets

---

## Skill: Create target records through intermediate models

### Purpose
Create new target records in a `HasManyThrough` chain by working through the specific intermediate model's relationship.

### When To Use
- Creating target records that belong to an intermediate in a through chain
- Any mutation operation on targets in a `HasManyThrough` relationship

### When NOT To Use
- Attempting `$parent->targets()->create()` — throws exception

### Prerequisites
- Intermediate model with `HasMany` relationship to target
- Target model with `BelongsTo` relationship to intermediate
- Access to the specific intermediate instance

### Inputs
- Intermediate model instance
- Target attributes array

### Workflow
1. Access the specific intermediate: `$intermediate = $parent->intermediates->first();`
2. Create through the intermediate's own relationship: `$intermediate->targets()->create($data)`
3. For batch creation: `$intermediate->targets()->createMany([...])`

### Validation Checklist
- [ ] Target is created through the intermediate's `HasMany` relationship
- [ ] FK on target correctly references the intermediate
- [ ] Parent can access the new target via the `HasManyThrough` chain

### Common Failures
- Calling `$parent->targets()->create()` — throws exception
- Not loading/accessing the intermediate first — no intermediate instance to create through

### Decision Points
- **Create through which intermediate?** — Must be the specific intermediate instance that owns the target

### Performance Considerations
- Creating through intermediate's `HasMany` is a single INSERT query
- No overhead over direct model creation

### Security Considerations
- Authorization at the intermediate level should be checked before creating targets
- Ensure mass assignment protection (`$fillable`) is configured on the target model

### Related Rules
- [Through-Create-Via-Intermediate](../has-many-through/05-rules.md)

### Related Skills
- Configure a HasManyThrough relationship with proper indexing

### Success Criteria
- Target record is created with correct FK to intermediate
- Parent can see the new target through the `HasManyThrough` chain
- No runtime exceptions from attempting writes on read-only relationship
