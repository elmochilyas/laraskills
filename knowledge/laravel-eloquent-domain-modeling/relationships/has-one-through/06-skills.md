# HasOneThrough Skills

## Skill: Configure HasOneThrough with unique constraints and cascade deletes

### Purpose
Define a one-to-one `HasOneThrough` relationship that traverses an intermediate model with proper unique constraints, foreign key indexing, and cascade delete policies.

### When To Use
- Accessing a distant model's data without exposing the intermediate (User→Profile→Avatar)
- Hiding implementation details of multi-step ownership chains
- Read-only access through a one-to-one chain

### When NOT To Use
- When you need to write/create through the relationship (it's read-only)
- When the intermediate model is meaningful in the domain and should be exposed
- When the intermediate relationship is `HasMany` (use `HasManyThrough`)
- For simple one-to-one without an intermediate (use `HasOne`)

### Prerequisites
- Three related tables: parent, intermediate, target
- Each hop is one-to-one (hasOne/hasOne chain)

### Inputs
- Target model class (first argument)
- Intermediate model class (second argument)
- Custom foreign keys and local keys (if non-convention)
- UNIQUE constraint definition on intermediate.parent_id
- UNIQUE constraint definition on target.intermediate_id

### Workflow
1. Confirm argument order: `$this->hasOneThrough(Target::class, Intermediate::class)` — target first, intermediate second
2. In the intermediate migration: add `->unique()->index()` on `intermediate.parent_id`
3. In the target migration: add `->unique()->index()` on `target.intermediate_id`
4. Add `->cascadeOnDelete()` on the target's FK to intermediate
5. Add `->cascadeOnDelete()` on the intermediate's FK to parent
6. Define the intermediate model's relationship to target as `HasOne`
7. Define the target model's inverse `BelongsTo` to intermediate
8. Document the read-only constraint in the method DocBlock

### Validation Checklist
- [ ] Argument order is correct: target first, intermediate second
- [ ] `intermediate.parent_id` has UNIQUE + index
- [ ] `target.intermediate_id` has UNIQUE + index
- [ ] Both foreign keys have `cascadeOnDelete()`
- [ ] Intermediate-to-target relationship is `HasOne` (not `HasMany` or `BelongsTo`)
- [ ] Read-only constraint is documented
- [ ] `$parent->target` returns single model or null
- [ ] `Parent::with('target')->get()` executes a single query with JOIN

### Common Failures
- Wrong argument order — swapping target and intermediate produces incorrect SQL
- Missing UNIQUE constraints — duplicate intermediates break one-to-one guarantee
- Assuming `create()` works — throws `BadMethodCallException`
- Not indexing both foreign keys — slow join queries
- Not documenting read-only — developers discover at runtime

### Decision Points
- **HasOneThrough or nested eager loading?** — Use `HasOneThrough` when intermediate is an implementation detail; use nested `with('intermediate.target')` when intermediate data is needed

### Performance Considerations
- Single join query — more efficient than two separate queries
- Both FKs must be indexed for join performance
- Eager loading uses single JOIN — very efficient with indexes

### Security Considerations
- The intermediate model is not exposed through the relationship
- Ensure authorization gates check through the chain, not just the target
- Null intermediate returns null — guard downstream usage

### Related Rules
- [Through-Argument-Order-Target-First](../has-one-through/05-rules.md)
- [Through-Index-All-Keys](../has-one-through/05-rules.md)
- [Through-Unique-Intermediate](../has-one-through/05-rules.md)
- [Through-Cascade-From-Target](../has-one-through/05-rules.md)
- [Through-ReadOnly-Documentation](../has-one-through/05-rules.md)
- [Through-Nullsafe-Access](../has-one-through/05-rules.md)
- [Through-Not-For-Meaningful-Intermediate](../has-one-through/05-rules.md)

### Related Skills
- Create target records through intermediate model in HasOneThrough chain

### Success Criteria
- `$parent->target` returns a single model or null
- `Parent::with('target')->get()` executes 1 query with JOIN
- `has('target')` produces correct WHERE EXISTS
- UNIQUE constraints prevent duplicate intermediates
- Cascade delete cleans up orphans
- Read-only constraint is documented

---

## Skill: Create target records through intermediate model in HasOneThrough chain

### Purpose
Create new target records in a `HasOneThrough` chain by working through the specific intermediate model's relationship.

### When To Use
- Creating target records that belong to the intermediate
- Any mutation on targets in a HasOneThrough chain

### When NOT To Use
- Attempting `$parent->target()->create()` — throws exception

### Prerequisites
- Intermediate model with `HasOne` relationship to target
- Target model with `BelongsTo` relationship to intermediate

### Inputs
- Intermediate model instance
- Target attributes array

### Workflow
1. Access the specific intermediate: `$intermediate = $parent->intermediateRelation`
2. Guard against null intermediate: `if ($user->profile) { $user->profile->avatar()->create($data) }`
3. Create through the intermediate's relationship: `$intermediate->target()->create($data)`

### Validation Checklist
- [ ] Target is created through the intermediate's `HasOne` relationship
- [ ] FK on target correctly references the intermediate
- [ ] Parent can access the new target via the `HasOneThrough` chain
- [ ] Null intermediate is handled gracefully

### Common Failures
- Calling `$parent->target()->create()` — throws exception
- Not null-checking intermediate before creating target

### Performance Considerations
- Creating through intermediate's HasOne is a single INSERT query

### Security Considerations
- Authorization at the intermediate level should be checked before creating targets

### Related Rules
- [Through-ReadOnly-Documentation](../has-one-through/05-rules.md)

### Related Skills
- Configure HasOneThrough with unique constraints and cascade deletes

### Success Criteria
- Target record is created with correct FK to intermediate
- Parent can see the new target through the HasOneThrough chain
- No runtime exceptions from attempting writes on read-only relationship
