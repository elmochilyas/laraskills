# HasOne Skills

## Skill: Configure HasOne with unique constraint and cascade delete

### Purpose
Define a one-to-one `HasOne` relationship with a database UNIQUE constraint on the foreign key, cascade delete, and the inverse `BelongsTo` on the child model.

### When To Use
- Modeling domain concepts where a child cannot exist without the parent (User→Profile, Order→Invoice)
- One-to-one profile/settings/extended metadata patterns
- Single-child aggregates where uniqueness is required

### When NOT To Use
- When the child can belong to multiple parent types (use polymorphic `MorphOne`)
- When you need the "latest" from a has-many set (use `HasOneOfMany`)
- When the FK belongs on the parent table (use `BelongsTo` on the child)

### Prerequisites
- Parent model and child model
- Child table with foreign key column

### Inputs
- Relationship method name
- Foreign key column (default: `snake_case` parent + `_id`)
- Local key on parent (default: `id`)

### Workflow
1. In the child migration: `$table->foreignId('user_id')->constrained()->unique()->cascadeOnDelete()->index()`
2. On the parent model, define `return $this->hasOne(Child::class)`
3. Always define the inverse `BelongsTo` on the child model
4. Use `$parent->child()->create($data)` to create children with auto-assigned FK
5. Add `nullsafe` access in templates: `$user->profile?->bio`

### Validation Checklist
- [ ] Child table has UNIQUE constraint on the FK column
- [ ] Child table has index on the FK column
- [ ] Foreign key has `cascadeOnDelete()`
- [ ] Inverse `BelongsTo` is defined on the child model
- [ ] `$parent->child` returns a single model instance or null
- [ ] `Parent::with('child')->get()` executes exactly 2 queries

### Common Failures
- Missing UNIQUE constraint — duplicate children silently exist, `$parent->child` returns arbitrary one
- Confusing direction — putting `HasOne` on the child instead of `BelongsTo`
- Missing inverse `BelongsTo` — child can't navigate to parent
- Missing cascade delete — orphaned children accumulate
- Assuming `HasOne` enforces uniqueness — only the UNIQUE constraint does

### Decision Points
- **HasOne or HasOneOfMany?** — Use `HasOne` when a UNIQUE constraint guarantees at most one child; use `HasOneOfMany` when selecting the "best" from a has-many set

### Performance Considerations
- Eager loading executes a single `WHERE IN` query — very efficient
- Index the FK column for all relationship queries
- `has('child')` generates `WHERE EXISTS` — scales linearly with index coverage

### Security Considerations
- Validate parent existence before creating child via relationship
- FK column should not be mass-assignable on the child model
- Use `firstOrCreate()` or `updateOrCreate()` with UNIQUE constraint to prevent duplicates in concurrent requests

### Related Rules
- [HasOne-Unique-Constraint](../has-one/05-rules.md)
- [HasOne-Inverse-BelongsTo](../has-one/05-rules.md)
- [HasOne-Cascade-Delete](../has-one/05-rules.md)
- [HasOne-Index-Foreign-Key](../has-one/05-rules.md)
- [HasOne-Eager-Load-Serialization](../has-one/05-rules.md)
- [HasOne-Not-For-LatestOfMany](../has-one/05-rules.md)

### Related Skills
- Create child records through HasOne parent relationship

### Success Criteria
- `$parent->child` returns a single model instance or null
- Deleting parent cascades to child
- UNIQUE constraint prevents duplicate children
- Inverse navigation works (child→parent)
- FK column is indexed

---

## Skill: Create child records through HasOne parent relationship

### Purpose
Create child records using `$parent->child()->create()` to auto-assign the foreign key and prevent orphaned records.

### When To Use
- Creating a single child that belongs to a parent
- First-time profile/settings creation
- Creating children in controllers, services, or factories

### When NOT To Use
- When the FK value comes from a source other than the parent model

### Prerequisites
- Defined `HasOne` relationship on parent
- Defined `BelongsTo` relationship on child

### Inputs
- Parent model instance
- Child attributes array (without FK)
- Optional: default attributes for firstOrCreate/createOrUpdate

### Workflow
1. Call `$parent->child()->create($data)` instead of `Child::create($data + ['parent_id' => $parent->id])`
2. For idempotent creation, use `$parent->child()->firstOrCreate($data)` or `$parent->child()->updateOrCreate($data)`

### Validation Checklist
- [ ] Child is created with correct FK auto-assigned
- [ ] No orphaned child records
- [ ] Inverse `BelongsTo` is defined on child for bidirectional access

### Common Failures
- Calling `Child::create()` and forgetting the FK
- Not using `HasOne` relationship for create — missing FK auto-assignment
- Forgetting that `HasOne` doesn't enforce uniqueness — duplicate children possible without DB UNIQUE constraint

### Decision Points
- **create() or firstOrCreate()?** — Use `create()` when you know there's no existing child; use `firstOrCreate()`/`updateOrCreate()` for idempotent child creation

### Performance Considerations
- Single INSERT query
- `firstOrCreate()` adds a SELECT before INSERT

### Security Considerations
- Ensure child model has `$fillable` configured
- The auto-assigned FK is trusted (from parent model, not user input)

### Related Rules
- [HasOne-Create-Through-Parent](../has-one/05-rules.md)

### Related Skills
- Configure HasOne with unique constraint and cascade delete

### Success Criteria
- Child created with correct FK automatically
- No orphaned records
- Idempotent creation works with firstOrCreate/updateOrCreate
